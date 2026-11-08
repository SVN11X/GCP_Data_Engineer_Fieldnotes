import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sha12,lessonPaths,validateOverlay,status,coverage,merge,readOverlay,englishLessons,overlayDomains,englishNotes,esTitles,NOTE_PATH} from '../scripts/lesson-es.mjs';
import '../dist/assets/loader.js';
import '../src/scripts/verification.js';
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
test('domain 1 has 100 percent coverage, no Spanish with semicolons or long dashes',()=>{
 const l=englishLessons(1),o=readOverlay(1),c=coverage(o,l);
 assert.equal(l.length,9);
 assert.equal(c.ok,c.total,'domain 1 translated '+c.ok+' of '+c.total);
 assert.ok(c.total>=254);
 for(const [id,entries] of Object.entries(o))for(const [p,x] of Object.entries(entries))assert.ok(!/[;–—]/.test(x.es),id+':'+p);
});
test('domain 2 has 100 percent coverage of translatable strings, notes included, and plain Spanish',()=>{
 const l=englishLessons(2),o=readOverlay(2),c=coverage(o,l);
 assert.equal(l.length,16);
 assert.equal(c.ok,c.total,'domain 2 translated '+c.ok+' of '+c.total);
 assert.ok(c.total>=475);
 assert.deepEqual(validateOverlay(o,l),[]);
 for(const [id,entries] of Object.entries(o))for(const [p,x] of Object.entries(entries))assert.ok(!/[;–—]/.test(x.es),id+':'+p);
});
test('every domain 1 and 2 lesson with a log note has a Spanish note under verification.note',()=>{
 const notes=englishNotes();
 for(const d of [1,2])for(const l of englishLessons(d)){
  assert.ok(notes.has(l.id),l.id+' has a log note');
  const x=readOverlay(d)[l.id]['verification.note'];
  assert.equal(x.src,sha12(notes.get(l.id)),l.id);
 }
});
test('a stale, bad or unknown verification note fails validation',()=>{
 const l=sample(),notes=new Map([['demo','Checked 7 days of retention for Pub/Sub.']]);
 const run=o=>validateOverlay(o,[l],undefined,notes);
 const ok={es:'Se comprobaron 7 días de retención de Pub/Sub.',src:sha12(notes.get('demo'))};
 assert.deepEqual(run({demo:{[NOTE_PATH]:ok}}),[]);
 assert.ok(run({demo:{[NOTE_PATH]:{...ok,src:'000000000000'}}}).some(e=>/stale/.test(e)));
 assert.ok(run({demo:{[NOTE_PATH]:{...ok,es:'Se comprobó la retención de Pub/Sub.'}}}).some(e=>/numbers differ/.test(e)));
 assert.ok(run({demo:{[NOTE_PATH]:{...ok,es:'Se comprobaron 7 días de retención.'}}}).some(e=>/protected name "Pub\/Sub"/.test(e)));
 assert.ok(validateOverlay({demo:{[NOTE_PATH]:ok}},[l],undefined,new Map()).some(e=>/path does not exist/.test(e)),'no log note, no path');
 assert.deepEqual(status({},[l],notes).filter(r=>r.path===NOTE_PATH).map(r=>r.state),['missing']);
});
test('the Spanish note shows only when its hash matches and otherwise falls back to English',async()=>{
 const V=globalThis.FieldVerification,entry={checkedOn:'2026-11-08',method:'official-page',sources:['https://cloud.google.com/x'],note:'Checked a thing.'};
 const es={'verification.note':{es:'Se comprobó una cosa.',src:sha12(entry.note)}};
 const hash=async t=>sha12(t);
 assert.equal(await V.spanishNote(entry,es,hash),'Se comprobó una cosa.');
 assert.equal(await V.spanishNote(entry,{'verification.note':{...es['verification.note'],src:'000000000000'}},hash),'');
 assert.equal(await V.spanishNote(entry,undefined,hash),'');
 assert.ok(V.lineHtml(entry,'Se comprobó una cosa.').includes('Se comprobó una cosa.'));
 assert.ok(V.lineHtml(entry,'').includes('Checked a thing.'));
 assert.ok(V.lineHtml(entry).includes('Checked a thing.'));
});
test('the build writes a titles index for all translated lessons and it matches the overlays',()=>{
 const idx=JSON.parse(fs.readFileSync(new URL('../dist/data/es/titles.json',import.meta.url),'utf8')),all=[1,2].flatMap(d=>englishLessons(d));
 assert.deepEqual(Object.keys(idx).sort(),all.map(l=>l.id).sort());
 for(const l of all){
  assert.deepEqual(Object.keys(idx[l.id]),['title','lead']);
  for(const k of ['title','lead'])assert.deepEqual(idx[l.id][k],{es:readOverlay(l.domain)[l.id][k].es,src:sha12(l[k])},l.id+':'+k);
 }
 assert.ok(fs.statSync(new URL('../dist/data/es/titles.json',import.meta.url)).size<30000,'the index stays small');
 assert.equal(JSON.stringify(esTitles(new Map([[1,{a:{title:{es:'x',src:'s'},'sections.0.body':{es:'y',src:'s'}},b:{'sections.0.body':{es:'y',src:'s'}}}]]))),'{"a":{"title":{"es":"x","src":"s"}}}');
 const boot={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),boot);
 assert.equal(boot.FIELDNOTES_DATA.manifest.esTitles,'data/es/titles.json');
});
test('titles apply to lesson lists, fall back per lesson on a missing or stale entry and restore English',async()=>{
 const mk=()=>[{id:'a',title:'Alpha',lead:'First'},{id:'b',title:'Beta',lead:'Second'},{id:'c',title:'Gamma',lead:'Third'}];
 const idx={a:{title:{es:'Alfa',src:sha12('Alpha')},lead:{es:'Primero',src:sha12('First')}},b:{title:{es:'Beta es',src:'000000000000'}}};
 const l=mk();
 await ES.applyTitles(l,idx,true);
 assert.deepEqual(l.map(x=>[x.title,x.lead]),[['Alfa','Primero'],['Beta','Second'],['Gamma','Third']],'a stale and a missing entry keep English');
 await ES.applyTitles(l,idx,false);
 assert.deepEqual(l,mk());
 await ES.applyTitles(l,null,true);
 assert.deepEqual(l,mk(),'no index leaves English');
});
test('the loader fetches the titles index once for lists, never a whole overlay, and only in Spanish',async()=>{
 const sandbox={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),sandbox);
 const data=JSON.parse(JSON.stringify(sandbox.FIELDNOTES_DATA)),calls=[],scripts=[];
 globalThis.document={createElement:()=>({}),head:{append:el=>{scripts.push(el.src);queueMicrotask(()=>el.onload());}}};
 const fetcher=async url=>{calls.push(new URL(url).pathname.split('/data/')[1]);return {ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+new URL(url).pathname.split('/data/')[1],import.meta.url),'utf8'))};};
 try{
  let lang='en';
  const loader=globalThis.FieldLoader.create(data,fetcher,'https://example.test/p/',()=>lang);
  const first=data.lessons.find(x=>x.id==='event-time').title;
  await loader.ensure('learn');
  assert.deepEqual(calls,[],'English visitors request no Spanish file');
  lang='es';
  await loader.ensure('learn');
  assert.deepEqual(calls,['es/titles.json']);
  assert.notEqual(data.lessons.find(x=>x.id==='event-time').title,first,'the list title is Spanish without opening the lesson');
  assert.ok(data.lessons.find(x=>x.id==='least-privilege').title.startsWith('Da a cada'));
  await loader.ensure('review');
  assert.ok(calls.every(c=>c==='es/titles.json'||c.startsWith('lessons/domain-')),calls.join());
  assert.ok(data.lessons.find(x=>x.id==='event-time').title!==first,'titles survive loading the full lessons');
  lang='en';
  await loader.ensure('learn');
  assert.equal(data.lessons.find(x=>x.id==='event-time').title,first,'English is restored');
 }finally{delete globalThis.document;}
});
