import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../dist/assets/core.js';
const C=globalThis.FieldCore,pack=JSON.parse(fs.readFileSync(new URL('../dist/data/study-pack.json',import.meta.url),'utf8'));
const questions=pack.questions,map=Object.fromEntries(questions.map(q=>[q.id,q]));
test('answer evaluation is order-independent, exact and rejects duplicate selections',()=>{
 assert.equal(C.equalAnswers(['C','A'],['A','C']),true);
 assert.equal(C.equalAnswers(['A'],['A','C']),false);
 assert.equal(C.equalAnswers(['A','A'],['A','B']),false);
 assert.equal(C.equalAnswers([],['B']),false);
});
test('mock allocation follows the guide and never includes imported or duplicate items',()=>{
 for(const n of [10,20,40,50]){
  const ids=C.makeExam(questions,n,pack.domains,()=>.417),counts=C.quotas(n,pack.domains);
  assert.equal(ids.length,n);assert.equal(new Set(ids).size,n);
  assert.ok(ids.every(id=>map[id].origin==='authored'&&map[id].gradable));
  for(const d of pack.domains)assert.equal(ids.filter(id=>map[id].domain===d.id).length,counts[d.id]);
 }
 assert.deepEqual(C.quotas(40,pack.domains),{1:9,2:10,3:8,4:6,5:7});
 assert.deepEqual(C.quotas(50,pack.domains),{1:11,2:13,3:10,4:7,5:9});
});
test('scoring includes unanswered questions without partial credit',()=>{
 const ids=['lab-1','lab-2','lab-3'];const a={'lab-1':map['lab-1'].answer,'lab-2':['Z']};
 const s=C.scoreExam(ids,a,map);assert.equal(s.correct,1);assert.equal(s.total,3);assert.equal(s.unanswered,1);assert.equal(s.percent,33);
});
test('late-event policy changes the correct historical window, not event identity',()=>{
 const zero=C.simulateStream(6,0),three=C.simulateStream(6,3);
 assert.equal(zero.dropped,1);assert.equal(zero.total,100);assert.equal(zero.windows[0].total,30);
 assert.equal(three.dropped,0);assert.equal(three.total,140);assert.equal(three.windows[0].total,70);
 assert.deepEqual(three.windows[0].ids,['A','B','D']);assert.equal(three.history[3].watermarkBefore,7);
 assert.equal(C.simulateStream(0,3).total,0);assert.equal(C.simulateStream(0,3).watermark,0);
 assert.equal(C.simulateStream(999,3).history.length,6);
});
test('scan model respects bounds, units and filter removal',()=>{
 assert.deepEqual(C.scanModel(7,'CL'),{days:7,full:300,partitioned:70,clustered:7});
 assert.equal(C.scanModel(30,'all').clustered,300);assert.equal(C.scanModel(1,'CL').clustered,1);
 assert.equal(C.scanModel(-1,'CL').days,1);assert.equal(C.scanModel(200,'CL').days,30);
});
test('progress restore preserves a running deadline and rejects unknown identities',()=>{
 const input={version:1,completed:['least-privilege','bad-id'],bookmarks:['imp-243','unknown'],vocab:{v1:{known:true},evil:{known:true}},attempts:[{id:'lab-1',selected:['B'],correct:true,verified:true,at:42}],exam:{ids:['lab-1','lab-2'],answers:{'lab-1':['B'],'unknown':['A']},index:1,startedAt:100,deadline:7200100,finished:false,recorded:false}};
 const s=C.validateProgress(input,pack.lessons.map(l=>l.id),questions.map(q=>q.id),pack.glossary.map(g=>g.id));
 assert.deepEqual(s.completed,['least-privilege']);assert.deepEqual(s.bookmarks,['imp-243']);assert.deepEqual(s.retired.bookmarks,[]);assert.deepEqual(Object.keys(s.vocab),['v1']);assert.equal(s.exam.deadline,7200100);assert.equal(s.exam.index,1);assert.equal(s.exam.answers.unknown,undefined);
 assert.throws(()=>C.validateProgress({version:8},[],[],[]));
 const bad=C.validateProgress({...input,exam:{...input.exam,ids:['imp-1']}},pack.lessons.map(l=>l.id),questions.map(q=>q.id),pack.glossary.map(g=>g.id));assert.equal(bad.exam,null);
});
test('all 349 supplied questions and their source keys remain alongside the original scenarios',()=>{
 assert.equal(questions.filter(q=>q.origin==='imported').length,349);assert.equal(questions.length,486);
 assert.equal(questions.filter(q=>q.origin==='authored'&&q.number<=100).length,100);
 assert.equal(questions.filter(q=>q.origin==='authored'&&q.number>100&&q.timed!==false).length,24);assert.equal(questions.filter(q=>q.origin==='authored'&&q.timed===false).length,13);
 assert.deepEqual(map['imp-217'].sourceAnswer,['B']);assert.deepEqual(map['imp-217'].answer,['B','E']);
 for(const n of [54,69,103,326]){assert.equal(map['imp-'+n].gradable,false);assert.equal(map['imp-'+n].status,'disputed');}
});
test('each workshop produces its documented prediction without changing its input',()=>{
 for(const w of pack.workshops){
  const before=JSON.stringify(w.fixture),result=C.runWorkshop(w.fixture);
  assert.ok(C.checkPrediction(w.prediction.answer,result.prediction),w.id);
  assert.equal(JSON.stringify(w.fixture),before,w.id+' mutated the fixture');
 }
 assert.equal(C.checkPrediction('',0),false);assert.equal(C.checkPrediction('66,7',66.7),true);
 assert.equal(C.checkPrediction('66.8',66.7),false);assert.equal(C.checkPrediction(' WORKER ','worker'),true);
 assert.equal(C.checkPrediction('NaN',3),false);assert.equal(C.checkPrediction('anything',null),false);
});
test('latest-state decisions are stable under reordering and identical replay',()=>{
 const dedup=pack.workshops.find(w=>w.id==='dedup-latest').fixture;
 assert.deepEqual(C.runWorkshop({...dedup,rows:[...dedup.rows].reverse()}),C.runWorkshop(dedup));
 const merge=pack.workshops.find(w=>w.id==='merge-replay').fixture,result=C.runWorkshop(merge);
 assert.deepEqual(result.afterFirstRun,result.afterReplay);assert.equal(result.total,42);
 assert.deepEqual(C.runWorkshop({...merge,changes:[...merge.changes].reverse()}).afterFirstRun,result.afterFirstRun);
});
test('grain, quality and authorization models expose the failed assumption',()=>{
 const run=id=>C.runWorkshop(pack.workshops.find(w=>w.id===id).fixture);
 assert.equal(run('join-grain').naiveTotal,280);assert.equal(run('join-grain').orderGrainTotal,180);
 assert.equal(run('quality-contract').validCount,1);assert.equal(run('quality-contract').invalidRows.length,4);
 const r=run('authorized-retrieval');assert.equal(r.prediction,'policy-public');assert.equal(r.excludedCount,1);assert.ok(r.authorizedChunks.every(c=>c.audience==='all'));
});
test('dependency and recovery rules include blocked output and incomplete snapshots',()=>{
 const dag=pack.workshops.find(w=>w.id==='quality-gate').fixture,result=C.runWorkshop(dag);
 assert.equal(result.tasks.assert,'failed');assert.equal(result.tasks.publish,'blocked');
 assert.deepEqual(C.runWorkshop({...dag,nodes:[...dag.nodes].reverse()}),result);
 assert.throws(()=>C.runWorkshop({type:'dag',failure:'',nodes:[{id:'a',dependencies:['b']},{id:'b',dependencies:['a']}]}),/cycle/);
 const recovery=pack.workshops.find(w=>w.id==='rpo-ledger').fixture;
 assert.equal(C.runWorkshop(recovery).dataAgeMinutes,33);
 assert.equal(C.runWorkshop({...recovery,failureTime:65}).dataAgeMinutes,5);
 assert.equal(C.runWorkshop({...recovery,failureTime:0}).recoverableState,null);
 const empty=C.runWorkshop({type:'metrics',truePositives:0,falsePositives:0,falseNegatives:0});
 assert.equal(empty.precisionPercent,null);assert.equal(empty.recallPercent,null);
});
test('both question levels support every session length and Applied includes multiple-select',()=>{
 for(const level of ['Foundation','Applied','mixed'])for(const n of [10,20,40,50]){
  const ids=C.makeExam(questions,n,pack.domains,()=>.417,level),counts=C.quotas(n,pack.domains);
  assert.equal(ids.length,n);assert.equal(new Set(ids).size,n);
  assert.ok(ids.every(id=>map[id].origin==='authored'&&(level==='mixed'||map[id].difficulty===level)));
  for(const d of pack.domains)assert.equal(ids.filter(id=>map[id].domain===d.id).length,counts[d.id]);
  if(level==='Applied'&&n===50)assert.ok(ids.some(id=>map[id].required>1));
 }
 const multiple=pack.questions.find(q=>q.difficulty==='Applied'&&q.required===2);
 assert.equal(C.scoreExam([multiple.id],{[multiple.id]:[multiple.answer[0]]},map).correct,0);
 assert.equal(C.scoreExam([multiple.id],{[multiple.id]:[...multiple.answer].reverse()},map).correct,1);
});
test('expanded progress preserves old records and validates workshop steps',()=>{
 const ids=[pack.lessons.map(l=>l.id),questions.map(q=>q.id),pack.glossary.map(g=>g.id)],legacy={version:1,completed:['least-privilege'],bookmarks:['imp-243'],vocab:{v1:{known:true}}};
 const old=C.validateProgress(legacy,...ids,pack.workshops);assert.deepEqual(old.labProgress,{});assert.deepEqual(old.completed,legacy.completed);
 const s=C.validateProgress({...legacy,labProgress:{'dedup-latest':{steps:['step-1','unknown','step-1'],prediction:'45',revealed:true,completed:false},evil:{completed:true}}},...ids,pack.workshops);
 assert.deepEqual(s.labProgress['dedup-latest'],{steps:['step-1'],prediction:'45',revealed:true,completed:false});assert.equal(s.labProgress.evil,undefined);
 const resumed=C.validateProgress({...s,exam:{ids:['lab-51','lab-52'],answers:{'lab-51':['A','C']},index:1,startedAt:100,deadline:9999999999999,difficulty:'Applied'}},...ids,pack.workshops);
 assert.equal(resumed.exam.difficulty,'Applied');assert.deepEqual(resumed.exam.answers['lab-51'],['A','C']);
});
test('the 13 added scenarios cover objectives up to five questions each and never enter a timed or diagnostic pool',()=>{
 const authored=questions.filter(q=>q.origin==='authored');
 const per={};for(const q of authored)per[q.objective]=(per[q.objective]||0)+1;
 for(const [o,n] of Object.entries(per))assert.ok(n>=5,'objective '+o+' has '+n);
 const extra=authored.filter(q=>q.timed===false);
 assert.equal(extra.length,13);
 for(let i=0;i<20;i++){
  const ids=new Set(C.makeExam(questions,50,pack.domains).map(q=>q.id));
  for(const q of extra)assert.ok(!ids.has(q.id),q.id);
 }
});
