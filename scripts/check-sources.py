"""Optional network check. Availability is separate from editorial fact checking."""
import concurrent.futures
import datetime
import json
import pathlib
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
sources = json.loads((ROOT / 'content/sources.json').read_text())


def check(item):
    key, source = item
    result = {'id': key, 'requestedURL': source['url']}
    try:
        with urllib.request.urlopen(source['url'], timeout=20) as response:
            result.update(status=response.status, finalURL=response.url, available=True)
            response.read(1024)
    except urllib.error.HTTPError as error:
        result.update(status=error.code, finalURL=error.url, available=False)
    except Exception as error:
        result.update(status=None, available=False, error=type(error).__name__)
    return result


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(check, sources.items()))
audit = {
    'checkedOn': datetime.date.today().isoformat(),
    'method': 'Public HTTP GET with redirect resolution; no account access.',
    'scope': 'URL availability only. This does not validate all claims in a linked resource.',
    'results': results,
}
(ROOT / 'content/source-audit.json').write_text(json.dumps(audit, indent=2) + '\n')
print(json.dumps({'checked': len(results), 'available': sum(r['available'] for r in results),
                  'unconfirmed': [r for r in results if not r['available']]}, indent=2))
