import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../dist/assets/core.js';
const C=globalThis.FieldCore,pack=JSON.parse(fs.readFileSync(new URL('../dist/data/study-pack.json',import.meta.url),'utf8'));
const lessonIds=pack.lessons.map(l=>l.id),qIds=pack.questions.map(q=>q.id);
const load=x=>C.validateProgress(x,lessonIds,qIds,[],[]);
const touch=(s,d)=>C.touchStreak(s,d);
test('old state without rewards fields loads unchanged and gets defaults',()=>{
 const old={version:1,completed:[lessonIds[0]],bookmarks:[],attempts:[],vocab:{},english:true,theme:'dark'};
 const out=load(old);
 assert.deepEqual(out.streak,{days:0,last:null,best:0});
 assert.deepEqual(out.completed,[lessonIds[0]]);assert.equal(out.theme,'dark');assert.equal(out.version,1);
 assert.equal('marks' in out,false);
});
test('touchStreak handles same day, next day, gap, backwards clock and bad dates',()=>{
 let s=touch(C.defaultState(),'2026-03-01');assert.deepEqual(s.streak,{days:1,last:'2026-03-01',best:1});
 s=touch(s,'2026-03-01');assert.equal(s.streak.days,1);
 s=touch(s,'2026-03-02');s=touch(s,'2026-03-03');assert.deepEqual(s.streak,{days:3,last:'2026-03-03',best:3});
 const back=touch(s,'2026-02-20');assert.deepEqual(back.streak,s.streak);
 const gap=touch(s,'2026-03-09');assert.deepEqual(gap.streak,{days:1,last:'2026-03-09',best:3});
 for(const bad of ['','2026-13-01','2026-02-30','yesterday',null,undefined,20260301])assert.deepEqual(touch(s,bad).streak,s.streak);
 assert.equal(s.streak.days,3,'input is not mutated');
 assert.equal(touch({version:1},'2026-03-01').streak.days,1);
 assert.equal(touch(touch(C.defaultState(),'2026-02-28'),'2026-03-01').streak.days,2);
});
test('currentStreak reads as 0 after a missed day while best is kept',()=>{
 let s=touch(touch(C.defaultState(),'2026-03-01'),'2026-03-02');
 assert.equal(C.currentStreak(s,'2026-03-02'),2);assert.equal(C.currentStreak(s,'2026-03-03'),2);
 assert.equal(C.currentStreak(s,'2026-03-04'),0);assert.equal(s.streak.best,2);
 assert.equal(C.currentStreak(s,'2026-03-01'),0);assert.equal(C.currentStreak(s,'bad'),0);
});
test('export then restore keeps streak, and an old export still restores',()=>{
 const s=touch(touch(C.defaultState(),'2026-03-01'),'2026-03-02');s.completed=[lessonIds[1]];
 const back=load(JSON.parse(JSON.stringify(s)));
 assert.deepEqual(back.streak,s.streak);assert.deepEqual(back.completed,[lessonIds[1]]);
 const oldExport={version:1,completed:[lessonIds[0]],bookmarks:[],attempts:[],vocab:{},english:true,exam:null,labProgress:{},reviewTopics:[],briefed:[],missionCompletions:[],focus:null,theme:'system',retired:{bookmarks:[],attempts:[]}};
 const r=load(oldExport);assert.deepEqual(r.completed,[lessonIds[0]]);assert.deepEqual(r.streak,{days:0,last:null,best:0});
});
test('absurd or malformed streak values are clamped or defaulted',()=>{
 assert.deepEqual(load({version:1,streak:{days:1e12,last:'2026-03-01',best:-5}}).streak,{days:36500,last:'2026-03-01',best:36500});
 assert.deepEqual(load({version:1,streak:{days:5,last:'nope',best:2}}).streak,{days:0,last:null,best:2});
 assert.deepEqual(load({version:1,streak:{days:'x',last:'2026-03-01',best:'y'}}).streak,{days:0,last:'2026-03-01',best:0});
 for(const bad of [null,5,'x',[],{}])assert.deepEqual(load({version:1,streak:bad}).streak,{days:0,last:null,best:0});
 assert.deepEqual(load({version:1,streak:{days:2,last:'2026-03-01',best:1}}).streak,{days:2,last:'2026-03-01',best:2});
});
test('domainMarks are derived from completed lessons only',()=>{
 const doms=[{id:1},{id:2},{id:3}],lessons=[{id:'a',domain:1},{id:'b',domain:1},{id:'c',domain:2}];
 assert.deepEqual(C.domainMarks({completed:['a','c']},doms,lessons),{1:false,2:true,3:false});
 assert.deepEqual(C.domainMarks({completed:['a','b','c']},doms,lessons),{1:true,2:true,3:false});
 assert.deepEqual(C.domainMarks({},doms,lessons),{1:false,2:false,3:false});
});
test('rewards markup shows text labels and no warning wording',()=>{
 const esc=x=>String(x),s=touch(C.defaultState(),'2026-03-01');
 const html=C.rewardsHtml(s,pack.domains,pack.lessons,'2026-03-09',esc,true);
 assert.match(html,/Days studied in a row: 0/);assert.match(html,/not yet earned/);
 assert.doesNotMatch(html,/lost|broken|warning|danger|streak lost/i);
});
