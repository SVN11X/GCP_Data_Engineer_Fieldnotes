import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../dist/assets/core.js';
import '../dist/assets/attention.js';
import '../dist/assets/loader.js';
const A=globalThis.FieldAttentionModel,C=globalThis.FieldCore;
const pack=JSON.parse(fs.readFileSync(new URL('../dist/data/study-pack.json',import.meta.url),'utf8'));
test('replay mission changes business totals by stable identity without mutating its fixture',()=>{
 const before=JSON.stringify(A.FIXTURES.duplicates);
 const off=A.runMission('duplicates'),on=A.runMission('duplicates',{protected:true});
 assert.equal(off.result,70);assert.equal(off.count,4);assert.equal(on.result,60);assert.equal(on.count,3);assert.equal(on.rejected,1);
 assert.deepEqual(on.rows.filter(r=>r.included).map(r=>r.id),['A','B','C']);assert.equal(JSON.stringify(A.FIXTURES.duplicates),before);
});
test('quality mission separates publication from the explicit local validity rule',()=>{
 const off=A.runMission('quality'),on=A.runMission('quality',{protected:true});
 assert.equal(off.result,4);assert.equal(on.result,2);assert.equal(on.rejected,2);
 assert.deepEqual(on.rows.filter(r=>!r.included).map(r=>r.value),[null,-5]);
 assert.throws(()=>A.runMission('unknown'),/Unknown mission/);
});
test('scan mission keeps the baseline fixed and applies both selected filters with bounded units',()=>{
 for(const days of [1,7,30]){const off=A.runMission('scan',{days}),on=A.runMission('scan',{protected:true,days});assert.equal(off.result,300);assert.equal(on.result,days);assert.equal(on.baseline,300);}
 assert.equal(A.runMission('scan',{protected:true,days:-1}).result,1);assert.equal(A.runMission('scan',{protected:true,days:99}).result,30);
});
test('every full lesson has specific context, a reason to study and a gradable original short-session decision',()=>{
 for(const lesson of pack.lessons){
  assert.ok(lesson.briefing.context.length>35);assert.ok(lesson.briefing.whyItMatters.length>35);assert.ok(lesson.briefing.takeaway.length>35);
  const q=A.pickQuestion(lesson,pack.questions);assert.ok(q?.answer?.length,lesson.id);assert.equal(q.origin,'authored');assert.equal(q.objective,lesson.objective);
 }
 assert.equal(new Set(pack.lessons.map(l=>l.briefing.whyItMatters)).size,52);
});
test('a resumed short session retains its answer and place without marking a full chapter complete',()=>{
 const value={version:1,completed:['least-privilege'],briefed:['streaming-semantics','bad'],missionCompletions:['duplicates','bad'],focus:{lessonId:'streaming-semantics',questionId:'lab-105',step:2,selected:['B','B'],checked:true}};
 const restored=C.validateProgress(value,pack.lessons.map(l=>l.id),pack.questions.map(q=>q.id),pack.glossary.map(g=>g.id),pack.workshops);
 assert.deepEqual(restored.completed,['least-privilege']);assert.deepEqual(restored.briefed,['streaming-semantics']);assert.deepEqual(restored.missionCompletions,['duplicates']);
 assert.equal(restored.focus.step,2);assert.deepEqual(restored.focus.selected,['B']);assert.equal(restored.focus.checked,true);
 const again=C.validateProgress(restored,pack.lessons.map(l=>l.id),pack.questions.map(q=>q.id),pack.glossary.map(g=>g.id),pack.workshops);assert.deepEqual(again,restored);
});
