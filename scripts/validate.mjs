import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
const pack=JSON.parse(fs.readFileSync(path.join(dist,'data/study-pack.json'),'utf8'));
const q=pack.questions,imported=q.filter(x=>x.origin==='imported');
assert.equal(q.length,399);assert.equal(imported.length,349);assert.equal(q.filter(x=>x.origin==='authored').length,50);
assert.equal(new Set(q.map(x=>x.id)).size,399);
assert.deepEqual(imported.map(x=>x.number).sort((a,b)=>a-b),Array.from({length:349},(_,i)=>i+1));
assert.equal(pack.lessons.length,25);assert.equal(pack.glossary.length,101);assert.equal(pack.services.length,9);for(const service of pack.services)assert.ok(pack.sources[service.reference]);
assert.equal(Object.values(pack.domains).reduce((n,d)=>n+d.weight,0),100);
const objectives=pack.domains.flatMap(d=>Object.keys(d.objectives));assert.equal(objectives.length,19);
for(const objective of objectives)assert.ok(pack.lessons.some(l=>l.objective===objective));
for(const lesson of pack.lessons)for(const ref of lesson.references)assert.ok(pack.sources[ref],`Unknown lesson source ${ref}`);
for(const question of q){
 assert.ok(question.explanation||question.sourceExplanation,`Missing explanation ${question.id}`);
 assert.ok(question.domain>=1&&question.domain<=5);
 assert.ok(pack.lessons.some(l=>l.id===question.lesson),`Missing lesson ${question.id}`);
 assert.ok(question.references.length,`No related reading ${question.id}`);
 for(const ref of question.references)assert.ok(pack.sources[ref],`Unknown question source ${ref}`);
 const letters=question.choices.map(c=>c.letter);for(const a of question.answer)assert.ok(letters.includes(a),`Bad answer ${question.id}`);
 if(question.gradable)assert.equal(question.required,question.answer.length,`Answer count ${question.id}`);
 for(const html of [question.html,...question.choices.map(c=>c.html)]){
  assert.ok(!/<(?:script|iframe|object|embed|svg)\b|\son\w+=|javascript:/i.test(html),`Unsafe imported HTML ${question.id}`);
  for(const match of html.matchAll(/<img[^>]+src="([^"]+)"/g)){assert.ok(match[1].startsWith('assets/images/'));assert.ok(fs.existsSync(path.join(dist,match[1])),`Missing image ${match[1]}`);}
 }
 for(const s of question.sources)assert.equal(new URL(s).protocol,'https:');
}
for(const s of Object.values(pack.sources))assert.equal(new URL(s.url).protocol,'https:');
assert.equal(Object.keys(pack.assets).length,25);assert.equal(Object.values(pack.assets).filter(a=>a.placeholder).length,10);
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(m[1].startsWith('http'))continue;assert.ok(fs.existsSync(path.join(dist,m[1])),`Missing entry asset ${m[1]}`);}
for(const file of ['app.js','core.js','data.js'])new vm.Script(fs.readFileSync(path.join(dist,'assets',file),'utf8'),{filename:file});
const sandbox={};vm.runInNewContext(fs.readFileSync(path.join(dist,'assets/data.js'),'utf8'),sandbox);assert.equal(sandbox.FIELDNOTES_DATA.questions.length,399);
console.log('Validated: full numbering, 19-objective coverage, answer references, source provenance, 25 images, sanitized HTML and static entry assets.');
