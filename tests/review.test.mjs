import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../dist/assets/core.js';
import '../dist/assets/review-core.js';
const C=globalThis.FieldCore,read=n=>JSON.parse(fs.readFileSync(new URL('../content/'+n+'.json',import.meta.url),'utf8'));
const domains=read('domains'),lessons=read('lessons'),weights=domains.map(d=>d.weight);
const sum=a=>a.reduce((x,y)=>x+y,0);
test('split sums exactly to the total for 60 and 120 and stays proportional',()=>{
 for(const total of [60,120]){
  const m=C.splitMinutes(total,weights);
  assert.equal(m.length,5);assert.equal(sum(m),total);
  m.forEach((v,i)=>assert.ok(Math.abs(v-total*weights[i]/100)<1,'within one minute of the exact share'));
 }
 assert.deepEqual(C.splitMinutes(120,weights),[26,30,24,18,22]);
 assert.deepEqual(C.splitMinutes(60,weights),[13,15,12,9,11]);
});
test('split rounds with largest remainder and is deterministic',()=>{
 assert.deepEqual(C.splitMinutes(10,[1,1,1]),[4,3,3]);
 assert.deepEqual(C.splitMinutes(10,[1,1,1]),C.splitMinutes(10,[1,1,1]));
 for(let t=0;t<=200;t++)assert.equal(sum(C.splitMinutes(t,weights)),t);
});
test('weights that do not sum to 100 still sum to the total',()=>{
 assert.equal(sum(C.splitMinutes(120,[1,2,3])),120);
 assert.equal(sum(C.splitMinutes(60,[50,50,50,50,50])),60);
 assert.deepEqual(C.splitMinutes(60,[3,1]),[45,15]);
});
test('split is safe for degenerate input',()=>{
 assert.deepEqual(C.splitMinutes(60,[]),[]);
 assert.deepEqual(C.splitMinutes(0,[1,2]),[0,0]);
 assert.equal(sum(C.splitMinutes(60,[0,0,0])),60);
 assert.equal(sum(C.splitMinutes(60,[NaN,-5,10])),60);
 assert.deepEqual(C.splitMinutes(NaN,[1,2]),[0,0]);
});
test('the plan reads weights, objectives and lessons from the loaded content',()=>{
 const plan=C.reviewPlan(domains,lessons,120);
 assert.equal(plan.length,5);assert.equal(sum(plan.map(r=>r.minutes)),120);
 plan.forEach((r,i)=>{
  assert.equal(r.weight,domains[i].weight);
  assert.deepEqual(r.objectives.map(o=>o.id),Object.keys(domains[i].objectives));
  assert.ok(r.lessons.length>0);
  assert.ok(r.lessons.every(l=>lessons.find(x=>x.id===l.id).domain===r.id));
 });
});
test('every domain 1 to 5 has a summary and key facts come only from existing blocks',()=>{
 for(const id of [1,2,3,4,5]){
  const s=C.domainSummary(domains,lessons,id);
  assert.ok(s&&s.lessons.length>0&&s.objectives.length>0);
  for(const l of s.lessons){
   const src=lessons.find(x=>x.id===l.id);
   assert.equal(l.title,src.title);
   if(src.block)assert.equal(l.keyFact,src.block.keyFact);else assert.equal(l.keyFact,null);
  }
 }
 assert.ok(C.domainSummary(domains,lessons,1).lessons.some(l=>l.keyFact));
 assert.equal(C.domainSummary(domains,lessons,6),null);
});
