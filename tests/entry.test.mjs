import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../dist/assets/core.js';
import '../dist/assets/entry-core.js';
const C=globalThis.FieldCore,pack=JSON.parse(fs.readFileSync(new URL('../dist/data/study-pack.json',import.meta.url),'utf8'));
const run=(events,s=C.entryStart())=>events.reduce((x,ev)=>C.entryNext(x,typeof ev==='string'?{type:ev}:ev),s);
const qmap=Object.fromEntries(pack.questions.map(q=>[q.id,q]));
test('path choice uses its own key and parses only new or know',()=>{
 assert.equal(C.PATH_KEY,'data-engineer-fieldnotes.path.v1');
 assert.notEqual(C.PATH_KEY,'data-engineer-fieldnotes.v1');
 assert.equal(C.parsePath('new'),'new');assert.equal(C.parsePath('know'),'know');
 for(const bad of [null,undefined,'','NEW','yes','{}',1,{},['new']])assert.equal(C.parsePath(bad),null);
 assert.equal(C.serializePath('know'),'know');assert.equal(C.serializePath('x'),'');assert.equal(C.serializePath(undefined),'');
});
test('welcome moves to the chosen path and ignores other events',()=>{
 assert.equal(run(['choose-new']).name,'orientation');
 const know=run(['choose-know']);assert.equal(know.name,'diagnostic');assert.equal(know.step,0);
 for(const ev of ['next','back','switch-path','restart',{type:'answer',value:['A']},'bogus'])assert.deepEqual(run([ev]),C.entryStart());
});
test('illegal events leave the state unchanged and never throw',()=>{
 const o=run(['choose-new']);
 for(const ev of ['choose-new','choose-know','next','restart',{type:'answer',value:['A']},{type:'nope'},{},null,undefined,'x',42])assert.deepEqual(C.entryNext(o,ev),o);
 const d=run(['choose-know']);
 for(const ev of ['choose-new','choose-know','next',{type:'answer'},{type:'answer',value:[]},{type:'answer',value:[1]},{type:'answer',value:'A'}])assert.deepEqual(C.entryNext(d,ev),d);
 for(const bad of [null,undefined,{},{name:'zzz'},'x',7])assert.doesNotThrow(()=>C.entryNext(bad,{type:'next'}));
 assert.equal(C.entryNext(null,{type:'choose-new'}).name,'orientation');
});
test('diagnostic answers once per step, next needs an answer, and ten steps end in a result',()=>{
 let s=run(['choose-know']);
 s=run(['next'],s);assert.equal(s.step,0);
 s=run([{type:'answer',value:['A']}],s);assert.deepEqual(s.answers[0],['A']);
 s=run([{type:'answer',value:['B']}],s);assert.deepEqual(s.answers[0],['A']);
 for(let i=0;i<9;i++){s=run(['next',{type:'answer',value:['B']}],s);assert.equal(s.step,i+1);assert.equal(s.name,'diagnostic');}
 s=run(['next'],s);assert.equal(s.name,'result');assert.equal(s.answers.length,10);
 assert.equal(run(['back'],s).name,'diagnostic');assert.equal(run(['back'],s).step,9);
 assert.equal(run(['restart'],s).step,0);assert.deepEqual(run(['restart'],s).answers,[]);
});
test('back and switch-path move between paths',()=>{
 const o=run(['choose-new']);
 assert.equal(run(['back'],o).name,'welcome');
 assert.equal(run(['switch-path'],o).name,'diagnostic');
 const d=run(['choose-know',{type:'answer',value:['A']},'next']);
 assert.equal(d.step,1);assert.equal(run(['back'],d).step,0);assert.equal(run(['back'],run(['choose-know'])).name,'welcome');
 const back=run(['switch-path'],d);assert.equal(back.name,'orientation');assert.deepEqual(back.answers,[]);
 assert.equal(C.entryPath(o),'new');assert.equal(C.entryPath(d),'know');assert.equal(C.entryPath(C.entryStart()),null);
});
test('diagnostic picks ten distinct authored questions spread by weight',()=>{
 assert.deepEqual(pack.domains.map(d=>d.weight),[22,25,20,15,18]);
 for(const seed of [1,2,3,99]){
  const ids=C.pickDiagnostic(pack.questions,pack.domains,C.seededRandom(seed));
  assert.equal(ids.length,10);assert.equal(new Set(ids).size,10);
  const per={};
  for(const id of ids){const q=qmap[id];assert.equal(q.origin,'authored');assert.equal(q.gradable,true);assert.equal(q.required,1);per[q.domain]=(per[q.domain]||0)+1;}
  assert.deepEqual([1,2,3,4,5].map(d=>per[d]),[2,3,2,1,2]);
 }
 assert.deepEqual(C.pickDiagnostic(pack.questions,pack.domains,C.seededRandom(7)),C.pickDiagnostic(pack.questions,pack.domains,C.seededRandom(7)));
 assert.notDeepEqual(C.pickDiagnostic(pack.questions,pack.domains,C.seededRandom(7)),C.pickDiagnostic(pack.questions,pack.domains,C.seededRandom(8)));
});
test('diagnostic never reads imported questions and does not change any question',()=>{
 const imported=pack.questions.filter(q=>q.origin==='imported');
 const before=JSON.stringify(pack.questions);
 assert.throws(()=>C.pickDiagnostic(imported,pack.domains,C.seededRandom(1)));
 C.pickDiagnostic(pack.questions,pack.domains,C.seededRandom(1));
 assert.equal(JSON.stringify(pack.questions),before);
 assert.equal(imported.length,349);
});
test('weakest domain uses the lowest share and breaks ties by exam weight',()=>{
 const dom=pack.domains,per=a=>Object.fromEntries(a.map((c,i)=>[i+1,{correct:c[0],total:c[1]}]));
 assert.equal(C.weakestDomain(per([[2,2],[3,3],[0,2],[1,1],[2,2]]),dom),3);
 assert.equal(C.weakestDomain(per([[1,2],[3,3],[1,2],[1,1],[2,2]]),dom),1,'tie of 1 and 3 goes to weight 22 over 20');
 assert.equal(C.weakestDomain(per([[2,2],[0,3],[0,2],[1,1],[2,2]]),dom),2,'tie goes to weight 25');
 assert.equal(C.weakestDomain(per([[2,2],[3,3],[2,2],[1,1],[2,2]]),dom),2,'all perfect: heaviest weight');
 assert.equal(C.weakestDomain(per([[0,0],[0,0],[0,0],[0,0],[0,0]]),dom),null);
});
test('scoring counts unanswered as wrong and reports every domain',()=>{
 const ids=C.pickDiagnostic(pack.questions,pack.domains,C.seededRandom(5));
 const answers=ids.map((id,i)=>i<4?[...qmap[id].answer]:undefined);
 const s=C.scoreDiagnostic(ids,answers,qmap,pack.domains);
 assert.equal(s.correct,4);assert.equal(s.total,10);
 assert.equal(Object.values(s.domains).reduce((n,x)=>n+x.total,0),10);
 assert.ok(pack.domains.some(d=>d.id===s.weakest));
});
test('the entry code never touches the progress key and the old save stays unchanged',()=>{
 const src=fs.readFileSync(new URL('../src/scripts/entry.js',import.meta.url),'utf8');
 assert.ok(!src.includes('data-engineer-fieldnotes.v1'));
 assert.ok(!/getState|save\(|localStorage\.setItem\((?!C\.PATH_KEY)/.test(src));
 const old=C.defaultState(),saved=JSON.stringify(old);
 C.pickDiagnostic(pack.questions,pack.domains,C.seededRandom(3));C.entryNext(C.entryStart(),{type:'choose-know'});
 assert.equal(JSON.stringify(old),saved);
 assert.deepEqual(Object.keys(old).sort(),Object.keys(C.defaultState()).sort());
});
