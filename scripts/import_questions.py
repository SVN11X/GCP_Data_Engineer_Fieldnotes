"""Import a user-provided ExamBase archive without executing its HTML.

Usage: python scripts/import_questions.py /absolute/path/result.zip
Original numbering, source keys, explanations and local diagrams are retained.
The answer key is not considered technically verified by this importer.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse
from html import escape, unescape
import sys, json, zipfile, re, hashlib

ROOT = Path(__file__).resolve().parents[1]

class SafeHTML(HTMLParser):
    allowed = {'br','p','div','span','strong','b','em','i','code','pre','ul','ol','li','table','thead','tbody','tr','td','th','sub','sup','blockquote'}
    def __init__(self, asset_map, number):
        super().__init__(convert_charrefs=True)
        self.assets, self.number, self.out, self.skip = asset_map, number, [], 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in {'script','style','iframe','object','embed','svg'}:
            self.skip += 1
            return
        if self.skip: return
        if tag == 'img':
            src = self.assets.get(a.get('src','')) or self.assets.get(urlparse(a.get('src','')).path)
            if src:
                alt = a.get('alt') or f'Original diagram for imported question {self.number}. Open the full-size image to inspect the details.'
                self.out.append(f'<img src="{escape(src,quote=True)}" alt="{escape(alt,quote=True)}" loading="lazy">')
            else: self.out.append('<span class="notice">[Original image could not be resolved]</span>')
        elif tag in self.allowed: self.out.append(f'<{tag}>')
        else: self.out.append(escape(self.get_starttag_text()))
    def handle_endtag(self, tag):
        if tag in {'script','style','iframe','object','embed','svg'}:
            self.skip = max(0,self.skip-1)
        elif not self.skip and tag in self.allowed and tag != 'br': self.out.append(f'</{tag}>')
    def handle_startendtag(self,tag,attrs): self.handle_starttag(tag,attrs)
    def handle_data(self,data):
        if not self.skip: self.out.append(escape(data))
    def value(self): return ''.join(self.out)

def main(archive):
    with zipfile.ZipFile(archive) as z:
        filename = next(n for n in z.namelist() if n.endswith('/preguntas.json'))
        prefix = filename.rsplit('/',1)[0]+'/'
        original = json.loads(z.read(filename))
        assets = {}
        for aid,a in original['assets'].items():
            relative = a.get('local_path','')
            suffix = Path(relative).suffix.lower()
            if not relative or suffix not in {'.png','.jpg','.jpeg','.webp'}: continue
            dest = ROOT/'dist'/'assets'/'images'/(aid+suffix)
            dest.write_bytes(z.read(prefix+relative))
            local = 'assets/images/'+dest.name
            assets[a['source_url']] = local
            assets[urlparse(a['source_url']).path] = local
        def clean(s,n):
            p=SafeHTML(assets,n);p.feed(s);p.close();return p.value()
        questions=[]
        for q in original['questions']:
            n=q['number']
            choices=[{'letter':c['letter'],'text':c['text'],'html':clean(c.get('html') or escape(c['text']),n)} for c in q['choices']]
            requested=re.search(r'choose\s+(two|three|four|five|\d+)',q['question_text'],re.I)
            count=({'two':2,'three':3,'four':4,'five':5}.get(requested[1].lower()) or (int(requested[1]) if requested[1].isdigit() else 1)) if requested else len(q['correct_choices'])
            issues=[]
            if count!=len(q['correct_choices']): issues.append('The prompt requests '+str(count)+' choices but the imported key contains '+str(len(q['correct_choices']))+'.')
            questions.append({'id':'imp-'+str(n),'number':n,'origin':'imported','text':q['question_text'],'html':clean(q['question_html'],n),
                'choices':choices,'sourceAnswer':q['correct_choices'],'answer':q['correct_choices'], 'required':count,
                'sourceExplanation':q['explanation_text'],'explanation':'','sources':[s['url'] for s in q['sources']],
                'references':[],'domain':0,'status':'unreviewed','issues':issues,'hasImages':bool(q['image_refs']),
                'gradable':False,'reviewNote':''})
        report=json.loads(z.read(prefix+'informe_validacion.json'))
    output={'schemaVersion':1,'sourceName':'ExamBase — user-supplied archive','sourceArchive':Path(archive).name,
       'sha256':hashlib.sha256(Path(archive).read_bytes()).hexdigest(),'sourceGeneratedAt':original.get('generated_at'),
       'questionCount':len(questions),'imageCount':len(set(assets.values())), 'missingOriginalExplanations':report['missing_explanations'],
       'warnings':['Imported answer keys are third-party claims, not official Google answers.',
          'The extraction report flags contextual and image review. Topic metadata is not assumed to be a missing case study.',
          'Domain tags are editorial keyword assignments, not an official classification.'], 'questions':questions}
    (ROOT/'content'/'imported.json').write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'questions':len(questions),'images':output['imageCount'],'missingExplanations':len(report['missing_explanations']),
                     'inconsistentKeys':[q['number'] for q in questions if q['issues']]}))

if __name__=='__main__':main(sys.argv[1])
