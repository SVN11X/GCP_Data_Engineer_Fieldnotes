import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sha12} from '../scripts/lesson-es.mjs';
import {questionPaths,validateOverlay,status,coverage,merge,readOverlay,englishQuestions,overlayDomains} from '../scripts/question-es.mjs';
import '../dist/assets/core.js';
import '../dist/assets/entry-core.js';
import '../dist/assets/loader.js';
const QE=globalThis.FieldQuestionEs,C=globalThis.FieldCore,EC=C;
const read=f=>JSON.parse(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'));
const COUNTS={1:27,2:38,3:29,4:17,5:26};
const authored=()=>read('content/curated.json').filter(q=>q.origin==='authored');
const overlays=()=>Object.fromEntries([1,2,3,4,5].map(d=>[d,readOverlay(d)]));
/* Everything but the translatable strings, so two copies can be compared field by field. */
const skeleton=q=>{const c=structuredClone(q);delete c.text;delete c.html;delete c.explanation;c.choices=c.choices.map(({letter})=>({letter}));return c;};
const demo=()=>({id:'demo',domain:1,origin:'authored',text:'Use BigQuery for 3 jobs with event_time.',explanation:'BigQuery fits.',choices:[{letter:'A',text:'BigQuery.',why:'It scans.'},{letter:'B',text:'None.',why:'It cannot.'}]});
const entry=(q,p,es)=>({es,src:sha12(new Map(questionPaths(q)).get(p))});
const demoOverlay=q=>({demo:{text:entry(q,'text','Usa BigQuery para 3 trabajos con event_time.'),'choices.0.text':entry(q,'choices.0.text','BigQuery.'),'choices.1.text':entry(q,'choices.1.text','Ninguno.')}});

test('there are 137 authored questions and one overlay file per domain',()=>{
 assert.equal(authored().length,137);
 assert.deepEqual(overlayDomains(),[1,2,3,4,5]);
 for(const d of [1,2,3,4,5])assert.equal(englishQuestions(d).length,COUNTS[d],'domain '+d);
 assert.equal(Object.values(COUNTS).reduce((a,b)=>a+b,0),137);
});
test('paths list only the learner-visible strings of a question',()=>{
 const q=read('content/curated.json').find(x=>x.id==='lab-1');
 assert.deepEqual(questionPaths(q).map(x=>x[0]),['text','choices.0.text','choices.0.why','choices.1.text','choices.1.why','choices.2.text','choices.2.why','choices.3.text','choices.3.why','explanation']);
});
test('every shipped overlay is valid, current and covers 100 percent of the 137 authored questions',()=>{
 let total=0,ok=0;
 for(const d of [1,2,3,4,5]){
  const o=readOverlay(d),qs=englishQuestions(d);
  assert.deepEqual(validateOverlay(o,qs),[],'domain '+d);
  assert.deepEqual(Object.keys(o),qs.map(q=>q.id),'every question of domain '+d+' in file order');
  const c=coverage(o,qs);total+=c.total;ok+=c.ok;
  assert.ok(status(o,qs).every(x=>x.state==='ok'),'no missing or stale string in domain '+d);
 }
 assert.equal(total,1370);assert.equal(ok,1370);
});
test('the overlay holds only strings: no answer, key, letter or flag fields',()=>{
 for(const [d,o] of Object.entries(overlays())){
  for(const [id,entries] of Object.entries(o)){
   assert.match(id,/^lab-\d+$/);
   for(const [p,x] of Object.entries(entries)){
    assert.match(p,/^(text|explanation|choices\.\d+\.(text|why))$/,id);
    assert.deepEqual(Object.keys(x).sort(),['es','src'],id+':'+p);
    assert.equal(typeof x.es,'string');
   }
  }
  const keys=new Set(Object.values(o).flatMap(e=>Object.keys(e)));
  for(const k of ['answer','sourceAnswer','required','letter','gradable','status','origin','domain','objective','lesson','difficulty','references','sources','reviewNote','issues','id'])assert.ok(!keys.has(k),'domain '+d+' has no '+k);
 }
});
test('every choice of every question is translated, in the same number and order',()=>{
 for(const [d,o] of Object.entries(overlays()))for(const q of englishQuestions(Number(d))){
  const e=o[q.id];
  assert.equal(q.choices.length,4);
  q.choices.forEach((c,i)=>{assert.ok(e['choices.'+i+'.text']?.es.trim(),q.id+' choice '+i);assert.ok(e['choices.'+i+'.why']?.es.trim(),q.id+' reason '+i);});
  assert.ok(e.text.es.trim()&&e.explanation.es.trim());
 }
});
test('Spanish keeps numbers, protected names and code tokens, and has no semicolon or long dash',()=>{
 const spot=[['lab-60','choices.0.why','800,000'],['lab-87','choices.1.text','66.7%'],['lab-99','text','09:30'],['lab-82','choices.3.text','ingestion_sequence'],['lab-80','text','order_total']];
 for(const [id,p,needle] of spot){const d=authored().find(q=>q.id===id).domain;assert.ok(readOverlay(d)[id][p].es.includes(needle),id+':'+p);}
 for(const o of Object.values(overlays()))for(const e of Object.values(o))for(const x of Object.values(e))assert.ok(!/[;–—]/.test(x.es),x.es);
});
test('the validator rejects stale, unknown, empty, unsafe and incomplete entries',()=>{
 const q=demo(),o=demoOverlay(q),run=x=>validateOverlay(x,[q]);
 assert.deepEqual(run(o),[]);
 assert.ok(run({demo:{...o.demo,text:{es:'Usa BigQuery para 3 trabajos con event_time.',src:'000000000000'}}}).some(e=>/stale translation/.test(e)));
 assert.ok(run({other:o.demo}).some(e=>/unknown authored question id/.test(e)));
 assert.ok(run({demo:{...o.demo,'choices.9.text':entry(q,'choices.0.text','x')}}).some(e=>/path does not exist/.test(e)));
 for(const p of ['answer','required','choices.0.letter','id','domain'])assert.ok(run({demo:{[p]:{es:'x',src:'0'}}}).some(e=>/only text, choice text/.test(e)),p);
 assert.ok(run({demo:{...o.demo,text:{es:'  ',src:o.demo.text.src}}}).some(e=>/empty Spanish/.test(e)));
 assert.ok(run({demo:{...o.demo,text:entry(q,'text','Usa el almacén para 3 trabajos con event_time.')}}).some(e=>/protected name "BigQuery"/.test(e)));
 assert.ok(run({demo:{...o.demo,text:entry(q,'text','Usa BigQuery para 4 trabajos con event_time.')}}).some(e=>/numbers differ/.test(e)));
 assert.ok(run({demo:{...o.demo,text:entry(q,'text','Usa BigQuery para 3 trabajos con la hora del evento.')}}).some(e=>/code token "event_time"/.test(e)));
 assert.ok(run({demo:{...o.demo,text:entry(q,'text','Usa BigQuery; es para 3 trabajos con event_time.')}}).some(e=>/semicolon or a long dash/.test(e)));
 const fewer=structuredClone(o);delete fewer.demo['choices.1.text'];
 assert.ok(run(fewer).some(e=>/has 2 choice texts but 1 translated/.test(e)));
 assert.ok(run([]).some(e=>/object keyed by question id/.test(e)));
});
test('a stale English text fails the check and merge stamps fresh hashes',()=>{
 const q=demo(),o=demoOverlay(q),changed=structuredClone(q);changed.text='Use BigQuery for 4 jobs with event_time.';
 assert.ok(validateOverlay(o,[changed]).some(e=>/stale translation/.test(e)));
 assert.equal(status(o,[changed]).find(x=>x.path==='text').state,'stale');
 const m=merge(null,{demo:{text:'Usa BigQuery para 3 trabajos con event_time.'}},[q]);
 assert.equal(m.demo.text.src,sha12(q.text));
 assert.throws(()=>merge(null,{demo:{answer:'x'}},[q]),/Unknown path/);
 assert.throws(()=>merge(null,{nope:{text:'x'}},[q]),/Unknown question id/);
});
test('applying the overlay changes only strings and English is restored exactly',async()=>{
 const o=overlays();let sameAsReason=0;
 for(const d of [1,2,3,4,5]){
  const english=englishQuestions(d),qs=structuredClone(english);
  const stale=await QE.apply(qs,o[d],true);
  assert.deepEqual(stale,[]);
  qs.forEach((q,i)=>{
   assert.deepEqual(skeleton(q),skeleton(english[i]),q.id+' answer data is untouched');
   assert.notEqual(q.text,english[i].text);assert.equal(q.html,q.text,'html follows text');
   q.choices.forEach((c,j)=>{if(c.text===english[i].choices[j].text)assert.ok(c.text.length<=40,q.id+' only a short name may stay the same');assert.equal(c.html,c.text);assert.ok(c.why);});
   if(q.explanation===q.choices.find(c=>q.answer.includes(c.letter)).why)sameAsReason++;
  });
  await QE.apply(qs,o[d],false);
  assert.deepEqual(qs,english,'English is restored for domain '+d);
 }
 assert.ok(sameAsReason>=70,'explanations that repeat a reason stay in step');
});
test('a stale or missing entry shows English and is listed as a gap',async()=>{
 const q=demo(),o=demoOverlay(q);o.demo.text.src='000000000000';delete o.demo['choices.1.text'];
 const qs=[structuredClone(q)];
 const stale=await QE.apply(qs,o,true);
 assert.deepEqual(stale,['demo:text']);
 assert.equal(qs[0].text,q.text);assert.equal(qs[0].choices[0].text,'BigQuery.');assert.equal(qs[0].choices[1].text,'None.');
 assert.equal(QE.stateOf(q.text),'stale source hash');
 assert.equal(QE.stateOf('None.'),'no entry in the overlay');
 await QE.apply(qs,null,true);
 assert.equal(QE.stateOf(q.text),'overlay not loaded');
 await QE.apply(qs,null,false);
 assert.equal(QE.stateOf(q.text),null);
});
test('report states: applied text is translated, unapplied text lists a reason, cut list rows still match',async()=>{
 const english=englishQuestions(1),qs=structuredClone(english),o=readOverlay(1);
 await QE.apply(qs,o,true);
 const first=qs[0];
 assert.equal(QE.stateOf(first.text),'translated');
 assert.equal(QE.stateOf(first.choices[0].why),'translated');
 assert.equal(QE.stateOf('  '+first.choices[1].text.replace(' ','   ')+' '),'translated','whitespace is collapsed');
 assert.equal(QE.stateOf(first.text.slice(0,40)+'…'),'translated','a cut list row is recognised');
 assert.equal(QE.stateOf('A sentence no question uses.'),null);
 await QE.apply(qs,o,false);
 assert.equal(QE.stateOf(first.text),null);
 await QE.apply(qs,null,true);
 assert.equal(QE.stateOf(english[0].text),'overlay not loaded');
 assert.equal(QE.stateOf(english[0].text.slice(0,40)+'…'),'overlay not loaded');
 await QE.apply(qs,null,false);
 const src=fs.readFileSync(new URL('../src/scripts/i18n.js',import.meta.url),'utf8');
 assert.ok(/QE\.stateOf\(core\)/.test(src)&&/FieldQuestionEs/.test(src),'report() reads the question overlay state');
});
test('scoring is identical with and without the overlay',async()=>{
 const english=authored(),o=overlays(),spanish=structuredClone(english),domains=read('content/domains.json');
 for(const d of [1,2,3,4,5])await QE.apply(spanish.filter(q=>q.domain===d),o[d],true);
 const map=list=>Object.fromEntries(list.map(q=>[q.id,q]));
 const en=map(english),es=map(spanish);
 /* A fixed pseudo random sequence, so the sample is the same on every run. */
 let seed=7;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const ids=C.makeExam(english,50,domains,random,'mixed');
 assert.ok(ids.some(id=>en[id].required>1),'the sample has multiple-select items');
 const answers={};ids.forEach((id,i)=>{const q=en[id];answers[id]=i%3===0?[...q.answer]:i%3===1?[q.choices.find(c=>!q.answer.includes(c.letter)).letter]:i%5===0?[]:[...q.answer].reverse().slice(0,1);});
 const a=C.scoreExam(ids,answers,en),b=C.scoreExam(ids,answers,es);
 assert.deepEqual(b,a);
 assert.ok(a.correct>0&&a.correct<a.total);
 for(const q of english){
  const s=es[q.id];
  assert.equal(C.equalAnswers(s.answer,q.answer),true);
  assert.equal(C.equalAnswers([...q.answer].reverse(),s.answer),true,'order of picks does not matter');
  assert.equal(C.equalAnswers([q.choices.find(c=>!q.answer.includes(c.letter)).letter],s.answer),false);
 }
 seed=11;const picks=EC.pickDiagnostic(english,domains,random);
 seed=11;const picksEs=EC.pickDiagnostic(spanish,domains,random);
 assert.deepEqual(picksEs,picks);
 const answersDx=picks.map((id,i)=>i%2?[en[id].answer[0]]:['Z']);
 assert.deepEqual(EC.scoreDiagnostic(picks,answersDx,es,domains),EC.scoreDiagnostic(picks,answersDx,en,domains));
});
test('the build ships one Spanish file per domain and lists them in the manifest',()=>{
 const sandbox={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),sandbox);
 const m=sandbox.FIELDNOTES_DATA.manifest;
 assert.equal(JSON.stringify(m.esQuestions),'[1,2,3,4,5]');assert.equal(m.questionsEs,'data/es/questions/domain-');
 for(const d of [1,2,3,4,5])assert.deepEqual(read('dist/data/es/questions/domain-'+d+'.json'),readOverlay(d));
 assert.ok(!/question-es/.test(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8')),'English pages never reference the Spanish question script');
});
test('the loader requests question overlays only in Spanish, only for the domains a route shows, and restores English',async()=>{
 const sandbox={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),sandbox);
 const data=JSON.parse(JSON.stringify(sandbox.FIELDNOTES_DATA)),calls=[],scripts=[];
 globalThis.document={createElement:()=>({}),head:{append:el=>{scripts.push(el.src);queueMicrotask(()=>el.onload());}}};
 const fetcher=async url=>{const f=new URL(url).pathname.split('/data/')[1];calls.push(f);return {ok:true,json:async()=>read('dist/data/'+f)};};
 const asked=()=>calls.filter(c=>c.startsWith('es/questions/')).map(c=>Number(/(\d)\.json/.exec(c)[1]));
 try{
  let lang='en';
  const loader=globalThis.FieldLoader.create(data,fetcher,'https://example.test/p/',()=>lang);
  const english=Object.fromEntries(authored().map(q=>[q.id,q.text]));
  await loader.ensure('practice');await loader.ensure('practice','lab-1');await loader.ensure('exam');await loader.ensure('diagnostic');
  assert.deepEqual(asked(),[],'English visitors request no Spanish question file');
  assert.ok(!scripts.some(s=>/question-es/.test(s)));
  lang='es';
  await loader.ensure('practice','lab-1');
  assert.deepEqual(asked(),[1],'a question page loads only its own domain');
  assert.ok(scripts.some(s=>/question-es/.test(s)));
  const lab1=data.questions.find(q=>q.id==='lab-1');
  assert.equal(lab1.text,readOverlay(1)['lab-1'].text.es);
  assert.equal(lab1.choices[1].why,readOverlay(1)['lab-1']['choices.1.why'].es);
  assert.deepEqual(lab1.answer,['B']);
  calls.length=0;
  await loader.ensure('practice');
  assert.deepEqual(asked().sort(),[2,3,4,5],'the list loads the other domains, domain 1 is cached');
  for(const q of data.questions.filter(q=>q.origin==='authored'))assert.equal(q.text,readOverlay(q.domain)[q.id].text.es,q.id+' row text');
  calls.length=0;await loader.ensure('practice');await loader.ensure('exam');await loader.ensure('diagnostic');await loader.ensure('progress');
  assert.deepEqual(asked(),[],'each overlay is requested once');
  assert.equal(data.questions.filter(q=>q.origin==='imported').length,349);
  lang='en';
  await loader.ensure('practice');
  for(const q of data.questions.filter(q=>q.origin==='authored'))assert.equal(q.text,english[q.id],q.id+' English restored');
  assert.deepEqual(data.questions.find(q=>q.id==='lab-1').choices.map(c=>c.text),authored().find(q=>q.id==='lab-1').choices.map(c=>c.text));
 }finally{delete globalThis.document;}
});
test('the quick challenge route loads the Spanish text of its lesson domain',async()=>{
 const sandbox={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),sandbox);
 const data=JSON.parse(JSON.stringify(sandbox.FIELDNOTES_DATA)),calls=[];
 globalThis.document={createElement:()=>({}),head:{append:el=>queueMicrotask(()=>el.onload())}};
 const fetcher=async url=>{const f=new URL(url).pathname.split('/data/')[1];calls.push(f);return {ok:true,json:async()=>read('dist/data/'+f)};};
 try{
  const loader=globalThis.FieldLoader.create(data,fetcher,'https://example.test/p/',()=>'es');
  await loader.ensure('focus','pipeline-contract');
  const lesson=data.lessons.find(l=>l.id==='pipeline-contract');
  assert.deepEqual(calls.filter(c=>c.startsWith('es/questions/')),['es/questions/domain-'+lesson.domain+'.json']);
  const q=data.questions.find(x=>x.lesson==='pipeline-contract'&&x.origin==='authored'&&x.choices.length);
  assert.equal(q.text,readOverlay(q.domain)[q.id].text.es);
 }finally{delete globalThis.document;}
});
test('the 349 imported questions are not part of the Spanish question overlays',()=>{
 const imported=read('content/imported.json');
 assert.equal(imported.questions.length,349);
 assert.deepEqual(imported.questions.map(q=>q.number),Array.from({length:349},(_,i)=>i+1));
 for(const o of Object.values(overlays()))for(const id of Object.keys(o))assert.ok(!/^imp-/.test(id));
});
