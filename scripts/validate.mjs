import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
const pack=JSON.parse(fs.readFileSync(path.join(dist,'data/study-pack.json'),'utf8'));
const q=pack.questions,imported=q.filter(x=>x.origin==='imported');
assert.equal(q.length,449);assert.equal(imported.length,349);assert.equal(q.filter(x=>x.origin==='authored').length,100);
assert.equal(new Set(q.map(x=>x.id)).size,q.length);
assert.deepEqual(imported.map(x=>x.number).sort((a,b)=>a-b),Array.from({length:349},(_,i)=>i+1));
assert.equal(pack.lessons.length,40);assert.equal(pack.glossary.length,150);assert.equal(pack.services.length,22);for(const service of pack.services)assert.ok(pack.sources[service.reference]);
assert.equal(new Set(pack.lessons.map(l=>l.id)).size,pack.lessons.length);assert.equal(new Set(pack.glossary.map(g=>g.id)).size,pack.glossary.length);
assert.equal(Object.values(pack.domains).reduce((n,d)=>n+d.weight,0),100);
const objectives=pack.domains.flatMap(d=>Object.keys(d.objectives));assert.equal(objectives.length,19);
for(const objective of objectives)assert.ok(pack.lessons.some(l=>l.objective===objective));
for(const lesson of pack.lessons){
 assert.ok(lesson.exercise?.prompt&&lesson.exercise.answer&&lesson.exercise.checkpoints.length);
 assert.ok(lesson.sections.length>=3);
 for(const ref of [...lesson.references,...lesson.sections.flatMap(s=>s.references||[])]){assert.ok(pack.sources[ref],`Unknown lesson source ${ref}`);assert.equal(pack.sources[ref].kind,'official',`Non-primary technical support ${ref}`);}
}
for(const question of q){
 assert.ok(question.explanation||question.sourceExplanation,`Missing explanation ${question.id}`);
 assert.ok(question.domain>=1&&question.domain<=5);
 assert.ok(pack.lessons.some(l=>l.id===question.lesson),`Missing lesson ${question.id}`);
 assert.ok(question.references.length,`No related reading ${question.id}`);
 for(const ref of question.references)assert.ok(pack.sources[ref],`Unknown question source ${ref}`);
 const letters=question.choices.map(c=>c.letter);for(const a of question.answer)assert.ok(letters.includes(a),`Bad answer ${question.id}`);
 if(question.gradable)assert.equal(question.required,question.answer.length,`Answer count ${question.id}`);
 if(question.origin==='authored'){
  assert.ok(['Foundation','Applied'].includes(question.difficulty));
  assert.equal(new Set(question.answer).size,question.answer.length);
  assert.ok(question.choices.every(c=>c.why?.length>10));
  for(const ref of question.references)assert.equal(pack.sources[ref].kind,'official');
 }
 for(const html of [question.html,...question.choices.map(c=>c.html)]){
  assert.ok(!/<(?:script|iframe|object|embed|svg)\b|\son\w+=|javascript:/i.test(html),`Unsafe imported HTML ${question.id}`);
  for(const match of html.matchAll(/<img[^>]+src="([^"]+)"/g)){assert.ok(match[1].startsWith('assets/images/'));assert.ok(fs.existsSync(path.join(dist,match[1])),`Missing image ${match[1]}`);}
 }
 for(const s of question.sources)assert.equal(new URL(s).protocol,'https:');
}
for(const s of Object.values(pack.sources))assert.equal(new URL(s.url).protocol,'https:');
assert.equal(pack.questions.filter(q=>q.origin==='authored'&&q.difficulty==='Applied'&&q.required>1).length,17);
assert.equal(pack.workshops.length,12);assert.equal(new Set(pack.workshops.map(w=>w.id)).size,12);
for(const w of pack.workshops){
 assert.ok(w.lessons.every(id=>pack.lessons.some(l=>l.id===id)));
 assert.ok(w.references.length&&w.references.every(id=>pack.sources[id]?.kind==='official'));
 assert.equal(new Set(w.steps.map(s=>s.id)).size,w.steps.length);assert.equal(w.steps.length,4);
 assert.ok(w.prediction.prompt&&w.prediction.answer&&w.explanation&&w.cloudNote);
}
for(const r of pack.resources.items)assert.ok(pack.sources[r.source]);
for(const b of pack.resources.plan){assert.ok(b.lessons.every(id=>pack.lessons.some(l=>l.id===id)));assert.ok(b.workshops.every(id=>pack.workshops.some(w=>w.id===id)));}
assert.deepEqual(pack.resources.standard.weights,pack.domains.map(d=>d.weight));
assert.equal(pack.resources.renewal.weights.reduce((n,w)=>n+w,0),100);
assert.equal(new Set(pack.sourceAudit.results.map(r=>r.id)).size,Object.keys(pack.sources).length);
for(const r of pack.sourceAudit.results)assert.equal(r.requestedURL,pack.sources[r.id].url);
assert.equal(Object.keys(pack.assets).length,25);assert.equal(Object.values(pack.assets).filter(a=>a.placeholder).length,10);
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(m[1].startsWith('http'))continue;assert.ok(fs.existsSync(path.join(dist,m[1])),`Missing entry asset ${m[1]}`);}
for(const file of ['app.js','core.js','data.js'])new vm.Script(fs.readFileSync(path.join(dist,'assets',file),'utf8'),{filename:file});
const sandbox={};vm.runInNewContext(fs.readFileSync(path.join(dist,'assets/data.js'),'utf8'),sandbox);assert.equal(sandbox.FIELDNOTES_DATA.questions.length,449);
for(const file of ['study-pack.json','study-notes.md','field-guide.md'])assert.ok(fs.statSync(path.join(dist,'data',file)).size>1000);
console.log('Validated: 40 lessons across 19 objectives, 449 questions, 150 terms, 12 workshops, resource mappings, 102 source responses, original image provenance and static assets.');
