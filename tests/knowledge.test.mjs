import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import '../dist/assets/knowledge.js';
import '../dist/assets/loader.js';
import '../dist/assets/core.js';
const K=globalThis.FieldKnowledge,C=globalThis.FieldCore;
const read=file=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+file,import.meta.url),'utf8'));
const pack=read('study-pack.json'),index=read('search-index.json');
const boot=()=>{const sandbox={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),sandbox);return JSON.parse(JSON.stringify(sandbox.FIELDNOTES_DATA));};
test('ranked search matches services, lesson bodies and bilingual terms without regex injection',()=>{
 assert.equal(K.search(index.documents,'Kafka')[0].title,'Managed Service for Apache Kafka');
 assert.ok(K.search(index.documents,'Iceberg',{type:'Lesson'}).some(r=>r.id==='iceberg-contracts'));
 assert.ok(K.search(index.documents,'compatibilidad').some(r=>r.type==='Vocabulary'));
 assert.ok(K.search(index.documents,'exactly-once',{type:'Lesson',domain:2}).every(r=>r.domain===2&&r.type==='Lesson'));
 assert.equal(K.search(index.documents,'word-that-is-not-present').length,0);
 assert.deepEqual(K.search(index.documents,''),[]);
 assert.doesNotThrow(()=>K.search(index.documents,'[.*+?'));
});
test('the failed architecture path excludes curated output and preserves exception evidence',()=>{
 for(const a of pack.architectures){
  const good=K.architectureState(a,false),bad=K.architectureState(a,true);
  assert.ok(good.activeNodes.includes('sink'));assert.ok(!good.activeNodes.includes('reject'));
  assert.ok(bad.activeNodes.includes('reject'));assert.ok(!bad.activeNodes.includes('sink'));
  assert.ok(good.edges.some(e=>e.to==='sink'));assert.ok(!bad.edges.some(e=>e.to==='sink'));
  assert.notEqual(good.outcome,bad.outcome);
 }
});
test('progress derives pending lessons by stable IDs and preserves the supplied bank’s live identifiers',()=>{
 const input={version:1,completed:['least-privilege'],bookmarks:['imp-243','lab-101'],reviewTopics:['managed-kafka','invalid'],theme:'dark',attempts:[{id:'imp-1',selected:['A'],at:1,correct:true}]};
 const state=C.validateProgress(input,pack.lessons.map(l=>l.id),pack.questions.map(q=>q.id),pack.glossary.map(g=>g.id),pack.workshops);
 assert.deepEqual(state.bookmarks,['imp-243','lab-101']);assert.deepEqual(state.retired.bookmarks,[]);
 assert.equal(state.attempts.length,1);assert.equal(state.retired.attempts.length,0);
 assert.deepEqual(state.reviewTopics,['managed-kafka']);assert.equal(state.theme,'dark');
 const again=C.validateProgress(state,pack.lessons.map(l=>l.id),pack.questions.map(q=>q.id),pack.glossary.map(g=>g.id),pack.workshops);
 assert.deepEqual(again,state);
 const rows=K.pendingByDomain(pack.domains,pack.lessons,state.completed);assert.equal(rows.reduce((n,r)=>n+r.pending.length,0),51);
});
test('loader requests nothing for overview, preserves map identities and coalesces concurrent domain requests',async()=>{
 const data=boot(),calls=[];const original=data.lessons.find(l=>l.id==='managed-kafka');
 const fetcher=async url=>{calls.push(url);const parsed=new URL(url);return {ok:true,json:async()=>read(parsed.pathname.split('/data/')[1])};};
 const loader=globalThis.FieldLoader.create(data,fetcher,'https://example.test/GCP_Data_Engineer_Fieldnotes/');
 await loader.ensure('home');assert.equal(calls.length,0);
 await Promise.all([loader.ensure('learn','managed-kafka'),loader.ensure('learn','streaming-semantics')]);
 assert.equal(calls.length,1);assert.ok(calls[0].includes('/GCP_Data_Engineer_Fieldnotes/data/lessons/domain-2.json?v='));
 assert.equal(data.lessons.find(l=>l.id==='managed-kafka'),original);assert.ok(original.sections.length);
 assert.ok(data.questions.every(q=>!q.answer));assert.equal(data.searchIndex,undefined);
 await loader.ensure('search');assert.ok(data.searchIndex.length>300);assert.equal(calls.length,2);
});
test('loader supports explicit retry after an HTTP failure and rejects a stale search release',async()=>{
 const data=boot();let count=0;
 const loader=globalThis.FieldLoader.create(data,async()=>{count++;return count===1?{ok:false,status:503}:{ok:true,json:async()=>read('lessons/domain-2.json')};},'https://example.test/project/');
 await assert.rejects(loader.ensure('learn','managed-kafka'),/503/);
 await loader.ensure('learn','managed-kafka');assert.equal(count,2);
 const stale=globalThis.FieldLoader.create(boot(),async()=>({ok:true,json:async()=>({release:'old',documents:[]})}),'https://example.test/project/');
 await assert.rejects(stale.ensure('search'),/different versions/);
});
test('timed practice loads all domain answers while bank navigation loads metadata only',async()=>{
 const data=boot(),calls=[];
 const loader=globalThis.FieldLoader.create(data,async url=>{calls.push(url);return {ok:true,json:async()=>read(new URL(url).pathname.split('/data/')[1])};},'https://example.test/project/');
 await loader.ensure('practice');assert.equal(calls.length,1);assert.ok(calls[0].includes('/imported/catalog.json'));
 await loader.ensure('practice','lab-101');assert.equal(calls.length,2);assert.ok(data.questions.find(q=>q.id==='lab-101').answer);
 await loader.ensure('exam');assert.equal(calls.length,6);assert.ok(data.questions.filter(q=>q.origin==='authored').every(q=>q.answer));assert.ok(data.questions.filter(q=>q.origin==='imported').every(q=>!q.answer));
});
