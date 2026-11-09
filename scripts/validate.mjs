import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {validateLog,comparisonIds} from './verification-log.mjs';
import {validateComparisons} from './comparisons.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
const pack=JSON.parse(fs.readFileSync(path.join(dist,'data/study-pack.json'),'utf8'));
assert.equal(pack.version,2);assert.equal(pack.lessons.length,52);assert.equal(pack.questions.length,486);
assert.equal(pack.questions.filter(q=>q.origin==='authored').length,137);assert.equal(pack.questions.filter(q=>q.origin==='authored'&&q.timed!==false).length,124,'the timed pool keeps its 124 questions');
assert.equal(pack.glossary.length,161);assert.equal(pack.services.length,28);assert.equal(pack.architectures.length,4);assert.equal(pack.workshops.length,12);
for(const key of ['lessons','questions','glossary','services','architectures','workshops'])assert.equal(new Set(pack[key].map(x=>x.id)).size,pack[key].length,'Duplicate '+key+' identity');
assert.equal(pack.domains.reduce((n,d)=>n+d.weight,0),100);
const objectives=pack.domains.flatMap(d=>Object.keys(d.objectives));assert.equal(objectives.length,19);
for(const objective of objectives)assert.ok(pack.lessons.some(l=>l.objective===objective),'Uncovered '+objective);
const refs=ids=>{assert.ok(ids.length);for(const id of ids){assert.equal(pack.sources[id]?.kind,'official','Non-primary technical reference '+id);}};
for(const lesson of pack.lessons){
 assert.ok(objectives.includes(lesson.objective));assert.equal(lesson.domain,Number(lesson.objective[0]));
 assert.ok(lesson.exercise?.prompt&&lesson.exercise.answer&&lesson.exercise.checkpoints.length);
 assert.ok(lesson.briefing?.context&&lesson.briefing.whyItMatters&&lesson.briefing.takeaway);assert.ok(lesson.sections.length>=3);refs(lesson.references);
 for(const section of lesson.sections)if(section.references)refs(section.references);
 assert.ok(['retained-review','official-checked'].includes(lesson.review.status));
 if(lesson.block){const b=lesson.block,dg=b.diagram;assert.ok(Number.isInteger(b.minutes)&&b.minutes>=2&&b.minutes<=5,'Block minutes '+lesson.id);assert.ok(dg.title&&dg.description&&dg.nodes.length>=2,'Block diagram '+lesson.id);const ids=new Set(dg.nodes.map(n=>n.id));assert.equal(ids.size,dg.nodes.length);for(const x of dg.edges)assert.ok(ids.has(x.from)&&ids.has(x.to),'Block edge '+lesson.id);for(const n of dg.nodes)assert.ok(n.lines.length&&n.x>=0&&n.y>=0&&n.x+n.w<=dg.width&&n.y+n.h<=dg.height&&dg.width<=320,'Block node '+lesson.id);assert.ok(b.keyFact.trim());if(b.video){const v=b.video;for(const f of [v.src,v.poster])assert.ok(fs.existsSync(path.join(root,f)),'Block video file '+f);for(const t of v.tracks)assert.ok(fs.existsSync(path.join(root,'content/captions',path.basename(t.src))),'Block caption file '+t.src);assert.ok(v.title&&v.description&&v.width>0&&v.height>0&&v.tracks.length>=2,'Block video '+lesson.id);}assert.equal(b.check.choices.length,3);assert.equal(b.check.choices.filter(c=>c.correct===true).length,1);assert.ok(b.check.question&&b.check.choices.every(c=>c.text&&c.why));}
}
assert.equal(pack.lessons.filter(l=>l.review.status==='official-checked').length,12);
for(const question of pack.questions){
 assert.ok(question.explanation||question.sourceExplanation);assert.ok(pack.lessons.some(l=>l.id===question.lesson));
 assert.ok(question.references.length);for(const id of question.references)assert.ok(pack.sources[id]);
 assert.equal(new Set(question.answer).size,question.answer.length);assert.ok(question.answer.length>0);
 for(const answer of question.answer)assert.ok(question.choices.some(c=>c.letter===answer));
 if(question.gradable)assert.equal(question.required,question.answer.length);
 if(question.origin==='authored'){
  refs(question.references);assert.ok(['Foundation','Applied'].includes(question.difficulty));
  assert.ok(question.choices.every(c=>c.why?.length>10));
 }
 for(const html of [question.html,...question.choices.map(c=>c.html)]){
  assert.ok(!/<(?:script|iframe|object|embed|svg)\b|\son\w+=|javascript:/i.test(html),'Unsafe question HTML '+question.id);
  for(const match of html.matchAll(/<img[^>]+src="([^"]+)"/g)){assert.ok(match[1].startsWith('assets/images/'));assert.ok(fs.existsSync(path.join(dist,match[1])),'Missing source image '+match[1]);}
 }
}
for(const w of pack.workshops){assert.ok(w.lessons.every(id=>pack.lessons.some(l=>l.id===id)));refs(w.references);assert.ok(w.fixture&&w.prediction&&w.steps.length);}
for(const a of pack.architectures){
 const ids=new Set(a.nodes.map(n=>n.id));assert.equal(ids.size,a.nodes.length);refs(a.references);
 assert.ok(a.lessons.every(id=>pack.lessons.some(l=>l.id===id)));
 for(const edge of a.edges){assert.ok(ids.has(edge.from)&&ids.has(edge.to));assert.ok(['always','success','failure'].includes(edge.when));assert.ok(edge.label);}
 for(const node of a.nodes)assert.ok(node.x>=0&&node.y>=0&&node.x+270<=690&&node.y+74<=540);
}
for(const service of pack.services)refs([service.reference]);
for(const claim of pack.verification.claims){refs(claim.references);assert.equal(claim.status,'official-checked');}
for(const b of pack.resources.plan){assert.ok(b.lessons.every(id=>pack.lessons.some(l=>l.id===id)));assert.ok(b.workshops.every(id=>pack.workshops.some(w=>w.id===id)));}
for(const r of pack.resources.items)assert.ok(pack.sources[r.source]);
assert.deepEqual(pack.resources.standard.weights,pack.domains.map(d=>d.weight));
for(const source of Object.values(pack.sources))assert.equal(new URL(source.url).protocol,'https:');
assert.equal(new Set(pack.sourceAudit.results.map(r=>r.id)).size,Object.keys(pack.sources).length);
for(const r of pack.sourceAudit.results)assert.equal(r.requestedURL,pack.sources[r.id].url);
assert.equal(pack.knowledgeAudit.counts.records,15169);assert.equal(pack.knowledgeAudit.counts.exactDuplicateTextChunks,1854);assert.equal(pack.knowledgeAudit.counts.aiVerifiedTrue,0);
for(const m of pack.knowledgeAudit.lessonEvidence){assert.ok(pack.lessons.some(l=>l.id===m.lesson));for(const r of m.evidence){assert.ok(r.id&&r.source_url);assert.equal(r.ai_verified,false);assert.equal(r.text,undefined);}}
const imported=JSON.parse(fs.readFileSync(path.join(root,'content/imported.json'),'utf8'));
const preserved=pack.preservation;
assert.equal(preserved.requiredQuestions,349);assert.equal(preserved.requiredImages,25);
assert.deepEqual(pack.questions.filter(q=>q.origin==='imported'),imported.questions);
assert.deepEqual(imported.questions.map(q=>q.number).sort((a,b)=>a-b),Array.from({length:349},(_,i)=>i+1));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'content/imported.json'),'utf8').replace(/\r\n/g,'\n')).digest('hex'),preserved.originalContentSha256,'Imported source file changed');
assert.equal(Object.keys(pack.assets).length,25);
for(const a of preserved.assets){
 const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,'assets/images',a.file))).digest('hex');
 assert.equal(hash,a.sha256,'Original image changed: '+a.file);
 const t=pack.assets[a.file].transcription;if(t){assert.equal(t.sourceSha256,hash);assert.equal(t.review,'visually-checked');assert.ok(t.kind==='text'||t.kind==='table');}
}
assert.equal(Object.values(pack.assets).filter(a=>a.transcription?.kind==='text').length,10);
assert.equal(Object.values(pack.assets).filter(a=>a.transcription?.kind==='table').length,1);
const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){if(m[1].startsWith('http'))continue;assert.ok(fs.existsSync(path.join(dist,m[1])),'Missing asset '+m[1]);assert.ok(!m[1].startsWith('/'),'Absolute Pages asset path');}
assert.ok(html.includes("connect-src 'self'"));assert.ok(!html.includes('unsafe-eval'));
for(const file of ['app','core','data','knowledge','loader','study-ui','attention','image-text','entry','entry-core','review','review-core','compare'])new vm.Script(fs.readFileSync(path.join(dist,'assets/'+file+'.js'),'utf8'),{filename:file});
const context={};vm.runInNewContext(fs.readFileSync(path.join(dist,'assets/data.js'),'utf8'),context);const boot=context.FIELDNOTES_DATA;
assert.ok(boot.lessons.every(l=>!l.sections),'Lesson bodies must load on demand');
assert.ok(boot.questions.every(q=>!q.answer&&q.choices.length===0),'Answer bodies must load on demand');
assert.ok(boot.workshops.every(w=>!w.fixture));assert.equal(boot.searchIndex,undefined);assert.equal(boot.knowledgeAudit,null);
for(const d of pack.domains)for(const key of ['lessons','questions']){
 const subset=JSON.parse(fs.readFileSync(path.join(dist,'data',key,'domain-'+d.id+'.json'),'utf8'));
 assert.deepEqual(subset,pack[key].filter(x=>x.domain===d.id&&(key!=='questions'||x.origin==='authored')));
 if(key==='questions'){const bank=JSON.parse(fs.readFileSync(path.join(dist,'data/imported/domain-'+d.id+'.json'),'utf8'));assert.deepEqual(bank,pack.questions.filter(q=>q.domain===d.id&&q.origin==='imported'));}
}
const index=JSON.parse(fs.readFileSync(path.join(dist,'data/search-index.json'),'utf8'));
assert.equal(index.release,boot.release);assert.equal(new Set(index.documents.map(d=>d.type+':'+d.id)).size,index.documents.length);
for(const document of index.documents){assert.ok(document.href.startsWith('#'));assert.ok(document.search);}
const vlog=JSON.parse(fs.readFileSync(path.join(dist,'data/verification-log.json'),'utf8'));
assert.deepEqual(validateLog(vlog,{lesson:pack.lessons.map(l=>l.id),service:pack.services.map(x=>x.id),comparison:comparisonIds(path.join(root,'content'))}),[],'Verification log');
const cmp=JSON.parse(fs.readFileSync(path.join(dist,'data/comparisons.json'),'utf8'));
assert.deepEqual(validateComparisons(cmp,vlog,pack.lessons.map(l=>l.id)),[],'Comparisons');
assert.ok(fs.existsSync(path.join(dist,'assets/compare.js'))&&fs.existsSync(path.join(dist,'assets/compare.css')));assert.ok(!html.includes('compare.js')&&!html.includes('compare.css'),'compare assets must stay lazy');
assert.ok(fs.existsSync(path.join(dist,'assets/verification.js')));assert.ok(!html.includes('verification.js'),'verification.js must stay lazy');
const metrics=JSON.parse(fs.readFileSync(path.join(dist,'data/build-metrics.json'),'utf8'));
assert.ok(metrics.bootBytes<240000,'Catalog payload budget');
const initialAssets=[...html.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g)].map(m=>m[1]);
const initialBytes=Buffer.byteLength(html)+initialAssets.reduce((n,file)=>n+fs.statSync(path.join(dist,file)).size,0);
assert.ok(initialBytes<500000,'Initial static payload budget');
console.log(`Validated: 52 lessons / 19 objectives, 486 questions (349 imported + 137 original), 25 unchanged images, 11 readable image alternatives, 161 terms, 28 services, 12 workshops, 4 architectures, 115 source mappings. Catalog ${metrics.bootBytes} B; initial HTML and assets ${initialBytes} B; no full lessons, question answers or search index at startup.`);
