import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateLog,findGaps,findStale,warnings,latestByTopic,ageInDays,isStale} from '../scripts/verification-log.mjs';
import '../dist/assets/verification.js';
const V=globalThis.FieldVerification;
const log=JSON.parse(fs.readFileSync(new URL('../content/verification-log.json',import.meta.url),'utf8'));
const pack=JSON.parse(fs.readFileSync(new URL('../dist/data/study-pack.json',import.meta.url),'utf8'));
const ids={lesson:pack.lessons.map(l=>l.id),service:pack.services.map(s=>s.id),comparison:[]};
const good={topic:'capacity',kind:'lesson',checkedOn:'2026-11-08',method:'google-developer-knowledge-mcp',query:'q',sources:['https://docs.cloud.google.com/bigquery/docs/editions-intro'],result:'confirmed',note:'ok'};
const bad=patch=>validateLog([{...good,...patch}],ids);

test('the shipped log is valid and every entry points at a real topic',()=>{
 assert.deepEqual(validateLog(log,ids),[]);
 assert.equal(log.length,50);
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
 assert.ok(bad({kind:'comparison',topic:'storage'}).length);
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
test('gaps list lessons and services without an entry',()=>{
 const gaps=findGaps(log,ids);
 const done=log.filter(e=>e.kind==='lesson').length;
 assert.equal(gaps.lessons.length,ids.lesson.length-done);assert.ok(!gaps.lessons.includes('capacity'));
 assert.equal(gaps.services.length,ids.service.length);
 assert.deepEqual(findGaps([],{lesson:['a']}),{lessons:['a'],services:[]});
});
test('warnings report counts, the first 10 ids and entries older than 90 days with an injected date',()=>{
 const fresh=warnings(log,ids,'2026-11-08');const gapCount=ids.lesson.length-log.filter(e=>e.kind==='lesson').length;
 assert.equal(fresh.length,2);
 assert.ok(fresh[0].includes(`${ids.lesson.length-log.filter(e=>e.kind==='lesson').length} of ${ids.lesson.length} lessons`)&&fresh[0].includes(`First ${Math.min(10,gapCount)}`));
 assert.equal(fresh[0].split(': ').pop().split(', ').length,Math.min(10,gapCount));
 assert.ok(fresh[1].includes(`${ids.service.length} of ${ids.service.length} services`));
 assert.equal(findStale(log,'2026-11-08').length,0);
 const old=warnings(log,ids,'2027-03-01');
 assert.equal(old.length,3);assert.ok(old[2].includes('older than 90 days')&&old[2].includes('exam:exam'));
 assert.deepEqual(warnings([],{},'2026-11-08'),[]);
});
test('the lesson line is honest with and without an entry',()=>{
 assert.ok(V.lineHtml(undefined).includes('Not yet verified against Google documentation'));
 const html=V.lineHtml(log[1]);
 assert.ok(html.includes('Checked 2026-11-08 against Google Developer Knowledge MCP'));
 assert.ok(html.includes('href="https://docs.cloud.google.com/bigquery/docs/editions-intro"')&&html.includes('rel="noopener noreferrer"'));
 assert.ok(!V.lineHtml({...log[1],sources:['javascript:alert(1)']}).includes('<a '));
 assert.ok(!V.lineHtml({...log[1],checkedOn:'<b>'}).includes('<b>'));
});
