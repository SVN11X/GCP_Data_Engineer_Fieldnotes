import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sha12,lessonPaths,validateOverlay,status,coverage,merge,readOverlay,englishLessons,overlayDomains} from '../scripts/lesson-es.mjs';
const ES=globalThis.FieldLessonEs;
const lessons=JSON.parse(fs.readFileSync(new URL('../content/lessons.json',import.meta.url),'utf8'));
const sample=()=>({id:'demo',domain:1,title:'Use BigQuery with 3 tables',lead:'Read it.',sections:[{title:'Idea',body:'Dataflow writes 12 rows.'}],block:{diagram:{title:'T',description:'D',nodes:[{lines:['Pub/Sub','topic']}]},keyFact:'Fact',check:{question:'Which?',choices:[{text:'A',correct:false,why:'Because A.'},{text:'B',correct:true,why:'Because B.'}]}}});
const entry=(l,p,es)=>({es,src:sha12(new Map(lessonPaths(l)).get(p))});

test('paths list learner-visible strings and skip code, ids and references',()=>{
 const p=new Map(lessonPaths(sample()));
 assert.equal(p.get('sections.0.body'),'Dataflow writes 12 rows.');
 assert.equal(p.get('block.diagram.nodes.0.lines.1'),'topic');
 assert.equal(p.get('block.check.choices.1.why'),'Because B.');
 assert.ok(![...p.keys()].some(k=>/id$|code|references/.test(k)));
});
test('a good overlay validates and a hash is the first 12 hex chars of sha256',()=>{
 const l=sample(),o={demo:{title:entry(l,'title','Usa BigQuery con 3 tablas')}};
 assert.deepEqual(validateOverlay(o,[l]),[]);
 assert.match(sha12('x'),/^[0-9a-f]{12}$/);
});
test('the validator rejects bad overlays',()=>{
 const l=sample(),good=entry(l,'title','Usa BigQuery con 3 tablas');
 const bad=(o,re)=>assert.ok(validateOverlay(o,[l]).some(e=>re.test(e)),re+' in '+JSON.stringify(validateOverlay(o,[l])));
 bad({nope:{title:good}},/unknown lesson/);
 bad({demo:{'sections.5.body':good}},/path does not exist/);
 bad({demo:{title:{es:'  ',src:good.src}}},/empty Spanish/);
 bad({demo:{title:{es:'Usa BigQuery con 3 tablas',src:'000000000000'}}},/stale/);
 bad({demo:{title:entry(l,'title','Usa la base con 3 tablas')}},/protected name "BigQuery"/);
 bad({demo:{title:entry(l,'title','Usa BigQuery con 4 tablas')}},/numbers differ/);
 bad({demo:{'block.check.choices.0.text':entry(l,'block.check.choices.0.text','A')}},/2 choices but 1/);
 bad([],/object/);
});
test('a protected name inside a longer word does not count as present',()=>{
 const l=sample(),e=entry(l,'title','Usa BigQueryX con 3 tablas');
 assert.ok(validateOverlay({demo:{title:e}},[l]).some(x=>/protected name/.test(x)));
});
test('the correct choice keeps its index after translation',()=>{
 const l=sample(),o={demo:{}};
 for(const [p] of lessonPaths(l))if(p.startsWith('block.check.choices.'))o.demo[p]=entry(l,p,'Texto 1'.replace('1',''));
 assert.deepEqual(validateOverlay(o,[l]),[]);
 const copy=structuredClone(l);
 for(const p in o.demo)ES.setAt(copy,p,o.demo[p].es);
 assert.deepEqual(copy.block.check.choices.map(c=>c.correct),[false,true]);
});
test('apply shows Spanish, restores English and falls back on a stale hash',async()=>{
 const l=sample(),o={demo:{title:entry(l,'title','Usa BigQuery con 3 tablas'),lead:{es:'Lee esto.',src:'ffffffffffff'},'sections.0.body':entry(l,'sections.0.body','Dataflow escribe 12 filas.')}};
 const warn=console.warn;let said='';console.warn=m=>{said+=m;};
 try{
  const stale=await ES.apply([l],o,true);
  assert.equal(l.title,'Usa BigQuery con 3 tablas');
  assert.equal(l.sections[0].body,'Dataflow escribe 12 filas.');
  assert.equal(l.lead,'Read it.','stale entry keeps the English text');
  assert.deepEqual(stale,['demo:lead']);
  assert.match(said,/demo:lead/);
  assert.deepEqual(await ES.apply([l],o,false),[]);
  assert.equal(l.title,'Use BigQuery with 3 tables');
  assert.equal(l.sections[0].body,'Dataflow writes 12 rows.');
  await ES.apply([l],null,true);
  assert.equal(l.title,'Use BigQuery with 3 tables','no overlay leaves English');
 }finally{console.warn=warn;}
});
test('status marks ok, missing and stale and merge stamps fresh hashes',()=>{
 const l=sample(),o={demo:{title:{es:'Usa BigQuery con 3 tablas',src:'000000000000'},lead:entry(l,'lead','Lee esto.')}};
 const s=Object.fromEntries(status(o,[l]).map(r=>[r.path,r.state]));
 assert.equal(s.title,'stale');assert.equal(s.lead,'ok');assert.equal(s['sections.0.body'],'missing');
 const m=merge(o,{demo:{title:'Usa BigQuery con 3 tablas'}},[l]);
 assert.equal(m.demo.title.src,sha12('Use BigQuery with 3 tables'));
 assert.deepEqual(Object.keys(m.demo),['title','lead']);
 assert.throws(()=>merge({}, {demo:{nope:'x'}},[l]),/Unknown path/);
 assert.deepEqual(coverage(m,[l]),{total:status(m,[l]).length,ok:2});
});
test('every shipped overlay is valid and current against the English lessons',()=>{
 for(const d of overlayDomains()){
  const l=englishLessons(d),o=readOverlay(d);
  assert.deepEqual(validateOverlay(o,l),[],'domain '+d);
  assert.equal(status(o,l).filter(r=>r.state==='stale').length,0);
 }
});
test('English lesson ids still match the overlay structure',()=>{
 assert.equal(lessons.length,52);
 for(const l of lessons)assert.ok(lessonPaths(l).length>5,l.id);
});
