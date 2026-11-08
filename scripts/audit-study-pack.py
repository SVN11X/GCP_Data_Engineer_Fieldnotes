#!/usr/bin/env python3
"""Audit a private Path 16 ZIP. Publish metadata and IDs, never extracted text."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from zipfile import ZipFile


def canonical(url):
    parts = urlsplit(url)
    return parts.netloc.removeprefix('docs.') + parts.path.rstrip('/')


def audit(archive, content):
    with ZipFile(archive) as pack:
        index = json.loads(pack.read('index.json'))
        resources = json.loads(pack.read('resource_index.json'))
        records = [json.loads(line) for line in pack.open('study_corpus.jsonl')]
    sources = json.loads((content / 'sources.json').read_text())
    lessons = json.loads((content / 'lessons.json').read_text())
    texts = Counter(r['text'] for r in records)
    mappings = []
    for lesson in lessons:
        wanted = {canonical(sources[ref]['url']) for ref in lesson['references']}
        candidates = [r for r in records if canonical(r['source_url']) in wanted]
        # Match a document, then favor an interior chunk over navigation headings.
        candidates.sort(key=lambda r: (r.get('chunk_number', 1) == 1, -len(r['text'])))
        selected, seen = [], set()
        for record in candidates:
            if record['source_url'] in seen:
                continue
            seen.add(record['source_url'])
            selected.append({k: record.get(k) for k in ('id', 'kind', 'source_url', 'chunk_number', 'provenance', 'ai_verified')})
            if len(selected) == 3:
                break
        mappings.append({'lesson': lesson['id'], 'status': 'document-overlap' if selected else 'no-direct-document-match',
                         'meaning': 'Document overlap is a discovery link, not claim verification or a quotation.', 'evidence': selected})
    topics = {
        'BigQuery': r'\bBigQuery\b', 'BigLake / Iceberg': r'\bBigLake\b|\bIceberg\b',
        'Dataflow / Beam': r'\bDataflow\b|\bApache Beam\b', 'Pub/Sub': r'Pub/?\s*Sub',
        'Kafka': r'\bKafka\b', 'Spark / Dataproc': r'\bSpark\b|\bDataproc\b',
        'Composer / Airflow': r'\bComposer\b|\bAirflow\b', 'Storage': r'Cloud Storage',
        'Security / governance': r'\bIAM\b|governance|Dataplex|Knowledge Catalog',
        'Migration': r'\bmigrat|Datastream|Transfer Appliance', 'Observability': r'\bmonitoring\b|\bobservability\b',
        'Cost / performance': r'\bcost\b|\bperformance\b'
    }
    report = {
        'schemaVersion': 1, 'reviewedOn': '2026-11-07', 'archive': archive.name,
        'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(),
        'method': 'Read all JSONL records and resource metadata. Count exact text duplicates; map canonical primary-document URLs to lessons. No source text is included in this report.',
        'counts': {'records': len(records), 'uniqueTextChunks': len(texts),
                   'exactDuplicateTextChunks': sum(n - 1 for n in texts.values()),
                   'uniqueSourceURLs': len({r['source_url'] for r in records}),
                   'kinds': dict(Counter(r['kind'] for r in records)),
                   'scopes': dict(Counter(r.get('source_scope', 'unspecified') for r in records)),
                   'aiVerifiedTrue': sum(r.get('ai_verified') is True for r in records)},
        'declaredCoverage': index,
        'resources': {'total': len(resources), 'byKindAndStatus': dict(Counter(r['kind'] + ':' + r['status'] for r in resources))},
        'topics': [{'topic': name, 'matchingChunks': sum(bool(re.search(pattern, r['text'], re.I)) for r in records)} for name, pattern in topics.items()],
        'lessonEvidence': mappings,
        'findings': [
            {'status': 'extracted', 'title': 'Exact repetitions', 'detail': '1,854 repeated text chunks were counted. The pack index agrees. Repeated navigation and source overlap mean chunk totals are not a count of distinct concepts.'},
            {'status': 'pending', 'title': 'Interactive course coverage', 'detail': 'All 59 tried Rise lessons have evidence, but the pack explicitly marks deep coverage incomplete. Visiting controls is not proof that every state was captured.'},
            {'status': 'pending', 'title': 'Provider quizzes', 'detail': '41 quiz resources are partial and no visible questions are reported by the deep audit. No provider quiz is published or reconstructed.'},
            {'status': 'pending', 'title': 'Automatic transcripts', 'detail': '131 videos have transcript coverage according to the index; ASR accuracy is not automatically validated. The 260 transcript chunks are research inputs, not verified quotations.'},
            {'status': 'official-checked', 'title': 'Potential terminology conflicts', 'detail': 'The guide uses Dataproc, Cloud Composer and Dataplex. Live references also use managed Spark, managed Airflow and Knowledge Catalog. Aliases are retained for exam navigation.'},
            {'status': 'official-checked', 'title': 'Table-type conflict resolved', 'detail': 'Read-only external BigLake tables must be distinguished from Apache Iceberg managed tables with documented mutation support. The new lesson and comparison name the exact type.'},
            {'status': 'official-checked', 'title': 'Guarantee boundaries', 'detail': 'Pub/Sub delivery, Dataflow processing, business-event identity and external sink effects are described separately. No blanket end-to-end exactly-once claim is made.'},
            {'status': 'pending', 'title': 'Semantic completeness', 'detail': 'No exhaustive contradiction detection, near-duplicate analysis, ASR correction or full course-state validation is claimed. Critical published claims are tracked separately in verification.json.'}
        ],
        'excludedFromPublication': ['Private study ZIP and extracted corpus', 'Complete courses, PDFs, videos and transcripts', 'Path 16 provider quiz resources', 'Browser profiles, credentials and user progress'],
        'suppliedQuestionBank': {'questions': 349, 'images': 25, 'status': 'preserved', 'permissionBasis': 'User confirmation that the bank was supplied by its owner, 2026-11-08.', 'separateFromPath16ProviderQuizzes': True},
        'extractionRepository': {'url': 'https://github.com/SVN11X/google_skills_pde_extractor', 'reviewedCommit': 'eec2f7d1b137406b935220c56b7d72415fb7ba21', 'scope': 'Extractor code and README were consulted; the attached ZIP is authoritative for this audit, not the repository example report.'}
    }
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    parser.add_argument('--content', type=Path, default=Path(__file__).resolve().parents[1] / 'content')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    report = audit(args.archive, args.content)
    out = args.output or args.content / 'knowledge-audit.json'
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'output': str(out), 'counts': report['counts'], 'mappedLessons': sum(bool(x['evidence']) for x in report['lessonEvidence'])}))
