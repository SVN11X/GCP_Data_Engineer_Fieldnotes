import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateLog,findGaps,gapErrors,assertNoGaps,comparisonIds,findStale,warnings,latestByTopic,ageInDays,isStale} from '../scripts/verification-log.mjs';
import '../dist/assets/verification.js';
const V=globalThis.FieldVerification;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const log=JSON.parse(fs.readFileSync(new URL('../content/verification-log.json',import.meta.url),'utf8'));
const pack=JSON.parse(fs.readFileSync(new URL('../dist/data/study-pack.json',import.meta.url),'utf8'));
const ids={lesson:pack.lessons.map(l=>l.id),service:pack.services.map(s=>s.id),comparison:['storage','processing','messaging','orchestration']};
const good={topic:'capacity',kind:'lesson',checkedOn:'2026-11-08',method:'google-developer-knowledge-mcp',query:'q',sources:['https://docs.cloud.google.com/bigquery/docs/editions-intro'],result:'confirmed',note:'ok'};
const bad=patch=>validateLog([{...good,...patch}],ids);

test('the shipped log is valid and every entry points at a real topic',()=>{
 assert.deepEqual(validateLog(log,ids),[]);
 assert.equal(log.length,85);
 assert.equal(fs.readFileSync(new URL('../dist/data/verification-log.json',import.meta.url),'utf8').trim(),JSON.stringify(log));
});
test('the browser copy is not part of the initial page',()=>{
 assert.ok(!fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').includes('verification.js'));
});
test('schema rejects bad dates, methods, sources, kinds, topics and results',()=>{
 for(const patch of [{checkedOn:'2026-13-01'},{checkedOn:'2026-02-30'},{checkedOn:'08/11/2026'},{checkedOn:undefined},
  {method:'blog'},{method:undefined},{result:'maybe'},{kind:'page'},{topic:'nope'},{topic:''},{query:' '},{note:''},{sources:[]},{sources:undefined},
  {sources:['http://cloud.google.com/x']},{sources:['https://example.com/x']},{sources:['https://evil.google.com.example.com/']},{sources:['not a url']},{sources:['https://docs.cloud.google.com/a','https://example.com/b']}])
  assert.ok(bad(patch).length>0,JSON.stringify(patch));
 assert.ok(validateLog({},ids).length);
 assert.ok(validateLog([null],ids).length);
});
test('exam and comparison topics follow their own rules',()=>{
 assert.deepEqual(bad({kind:'exam',topic:'exam'}),[]);
 assert.ok(bad({kind:'exam',topic:'capacity'}).length);
 assert.ok(bad({kind:'comparison',topic:'unknown-comparison'}).length);
 assert.deepEqual(validateLog([{...good,kind:'comparison',topic:'storage'}],{...ids,comparison:['storage']}),[]);
});
test('the same topic, method and date cannot appear twice',()=>{
 assert.ok(validateLog([good,{...good}],ids).some(e=>e.includes('duplicate')));
 assert.deepEqual(validateLog([good,{...good,checkedOn:'2026-11-09'}],ids),[]);
 assert.deepEqual(validateLog([good,{...good,method:'official-page'}],ids),[]);
});
test('age in days counts calendar days and rejects bad dates',()=>{
 assert.equal(ageInDays('2026-11-08','2026-11-08'),0);
 assert.equal(ageInDays('2026-08-10','2026-11-08'),90);
 assert.equal(ageInDays('2025-12-31','2026-01-01'),1);
 assert.equal(ageInDays('2024-02-28','2024-03-01'),2);
 assert.ok(Number.isNaN(ageInDays('x','2026-11-08')));
});
test('staleness starts after 90 days and treats unreadable dates as stale',()=>{
 assert.equal(isStale({checkedOn:'2026-08-10'},'2026-11-08'),false);
 assert.equal(isStale({checkedOn:'2026-08-09'},'2026-11-08'),true);
 assert.equal(isStale({checkedOn:'junk'},'2026-11-08'),true);
 assert.equal(isStale({checkedOn:'2026-11-01'},'2026-11-08',5),true);
 assert.equal(isStale(undefined,'2026-11-08'),true);
});
test('the latest entry per topic wins and equal dates keep the last written',()=>{
 const a={...good,checkedOn:'2026-01-01',note:'old'},b={...good,checkedOn:'2026-05-01',note:'new'},c={...good,checkedOn:'2026-05-01',note:'newer'};
 assert.equal(latestByTopic([b,a]).get('lesson:capacity').note,'new');
 assert.equal(latestByTopic([a,b,c]).get('lesson:capacity').note,'newer');
 assert.equal(latestByTopic([{...good,kind:'service'},good]).size,2);
 assert.equal(latestByTopic(null).size,0);
 assert.equal(latestByTopic([null,{topic:3},{...good,checkedOn:'bad'}]).size,0);
});
test('every lesson and service has a verification entry now',()=>{
 assert.equal(ids.lesson.length,52);assert.equal(ids.service.length,28);
 assert.deepEqual(findGaps(log,ids),{lessons:[],services:[],comparisons:[]});
 assert.deepEqual(gapErrors(log,ids),[]);
 assert.doesNotThrow(()=>assertNoGaps(log,ids));
 const have=latestByTopic(log);
 for(const id of ids.service)assert.ok(have.has('service:'+id),id);
});
test('a missing lesson or service entry fails the gate with the first 10 ids, without touching the real build',()=>{
 const without=(kind,topic)=>log.filter(e=>!(e.kind===kind&&e.topic===topic));
 assert.deepEqual(findGaps(without('lesson','capacity'),ids).lessons,['capacity']);
 assert.throws(()=>assertNoGaps(without('lesson','capacity'),ids),/Missing verification records[\s\S]*1 of 52 lessons[\s\S]*First 1: capacity/);
 assert.throws(()=>assertNoGaps(without('service','service-9'),ids),/1 of 28 services have no entry\. First 1: service-9/);
 const fakeIds={lesson:['a','b'],service:Array.from({length:12},(_,i)=>'s'+(i+1)),comparison:[]};
 const err=gapErrors([],fakeIds);
 assert.equal(err.length,2);
 assert.ok(err[0].includes('2 of 2 lessons')&&err[0].includes('First 2: a, b'));
 assert.ok(err[1].includes('12 of 12 services')&&err[1].includes('First 10: s1, s2, s3, s4, s5, s6, s7, s8, s9, s10')&&!err[1].includes('s11'));
 assert.throws(()=>assertNoGaps([],fakeIds),/lessons have no entry[\s\S]*services have no entry/);
 assert.deepEqual(findGaps([],{lesson:['a']}),{lessons:['a'],services:[],comparisons:[]});
 assert.deepEqual(gapErrors([],{}),[]);
});
test('comparison entries are required only when a comparison id list exists',()=>{
 assert.deepEqual(gapErrors(log,{...ids,comparison:[]}),[]);
 assert.ok(gapErrors(log,{...ids,comparison:['fake-comparison']})[0].includes('1 of 1 comparisons have no entry. First 1: fake-comparison'));
 const withIt=[...log,{...good,kind:'comparison',topic:'fake-comparison'}];
 assert.deepEqual(gapErrors(withIt,{...ids,comparison:['fake-comparison']}),[]);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fieldnotes-'));
 try{
  assert.deepEqual(comparisonIds(dir),[]);
  fs.writeFileSync(path.join(dir,'comparisons.json'),JSON.stringify([{id:'storage'},{id:'orchestration'}]));
  assert.deepEqual(comparisonIds(dir),['storage','orchestration']);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 assert.deepEqual(comparisonIds(path.join(root,'content')),ids.comparison);
});
test('warnings report only entries older than 90 days with an injected date',()=>{
 assert.deepEqual(warnings(log,ids,'2026-11-08'),[]);
 assert.equal(findStale(log,'2026-11-08').length,0);
 const old=warnings(log,ids,'2027-03-01');
 assert.equal(old.length,1);assert.ok(old[0].includes('older than 90 days')&&old[0].includes('exam:exam'));
 assert.deepEqual(warnings([],{},'2026-11-08'),[]);
 assert.deepEqual(warnings([],{lesson:['a']},'2026-11-08'),[]);
});
test('the lesson line is honest with and without an entry',()=>{
 assert.ok(V.lineHtml(undefined).includes('Not yet verified against Google documentation'));
 const html=V.lineHtml(log[1]);
 assert.ok(html.includes('Checked 2026-11-08 against Google Developer Knowledge MCP'));
 assert.ok(html.includes('href="https://docs.cloud.google.com/bigquery/docs/editions-intro"')&&html.includes('rel="noopener noreferrer"'));
 assert.ok(!V.lineHtml({...log[1],sources:['javascript:alert(1)']}).includes('<a '));
 assert.ok(!V.lineHtml({...log[1],checkedOn:'<b>'}).includes('<b>'));
});
