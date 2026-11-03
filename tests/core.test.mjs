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
 assert.deepEqual(s.completed,['least-privilege']);assert.deepEqual(s.bookmarks,['imp-243']);assert.deepEqual(Object.keys(s.vocab),['v1']);assert.equal(s.exam.deadline,7200100);assert.equal(s.exam.index,1);assert.equal(s.exam.answers.unknown,undefined);
 assert.throws(()=>C.validateProgress({version:8},[],[],[]));
 const bad=C.validateProgress({...input,exam:{...input.exam,ids:['imp-1']}},pack.lessons.map(l=>l.id),questions.map(q=>q.id),pack.glossary.map(g=>g.id));assert.equal(bad.exam,null);
});
test('imported key corrections preserve original answers and do not silently certify other keys',()=>{
 assert.deepEqual(map['imp-217'].sourceAnswer,['B']);assert.deepEqual(map['imp-217'].answer,['B','E']);
 assert.deepEqual(map['imp-228'].answer,['D','E']);assert.deepEqual(map['imp-231'].answer,['C','D']);
 for(const n of [54,69,103,326]){assert.equal(map['imp-'+n].gradable,false);assert.equal(map['imp-'+n].status,'disputed');}
 assert.equal(map['imp-243'].choices.filter(c=>c.transcription).length,4);
});
