import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateComparisons,MIN_OPTIONS} from '../scripts/comparisons.mjs';
import {validateLog} from '../scripts/verification-log.mjs';
import '../dist/assets/compare.js';
const K=globalThis.FieldCompare;
const read=n=>JSON.parse(fs.readFileSync(new URL('../'+n,import.meta.url),'utf8'));
const items=read('content/comparisons.json'),log=read('content/verification-log.json'),pack=read('dist/data/study-pack.json');
const lessons=pack.lessons.map(l=>l.id);
const option={name:'A',chooseWhen:'x',beCarefulWhen:'y',sources:['https://docs.cloud.google.com/a']};
const make=(patch={},opts)=>[{id:'demo',title:'t',question:'q',quickRule:'r',options:opts||[option,{...option,name:'B'},{...option,name:'C'}],...patch}];
const logFor=ids=>ids.map(topic=>({kind:'comparison',topic}));
const bad=(list,l=logFor(['demo']))=>validateComparisons(list,l,lessons);

test('the shipped comparisons are valid and the build copied them',()=>{
 assert.deepEqual(validateComparisons(items,log,lessons),[]);
 assert.equal(items.length,4);
 assert.equal(fs.readFileSync(new URL('../dist/data/comparisons.json',import.meta.url),'utf8').trim(),JSON.stringify(items));
 assert.ok(!fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').includes('comparisons'));
});
test('comparison ids are unique and each has a verification log entry',()=>{
 assert.equal(new Set(items.map(c=>c.id)).size,items.length);
 for(const c of items){
  const entries=log.filter(x=>x.kind==='comparison'&&x.topic===c.id);
  assert.ok(entries.length>=1,c.id);
  assert.ok(entries.every(x=>x.note.length<=220&&x.sources.length>=1&&x.sources.length<=3),c.id);
 }
 assert.deepEqual(validateLog(log,{lesson:lessons,service:pack.services.map(s=>s.id),comparison:items.map(c=>c.id)}),[]);
 assert.ok(bad(make({id:'other'}),logFor(['demo'])).some(e=>e.includes('no verification log entry')));
 assert.ok(bad([...make(),...make()]).some(e=>e.includes('duplicate id')));
});
test('every option has both texts and 1 to 3 Google sources',()=>{
 for(const c of items){
  assert.ok(c.options.length>=MIN_OPTIONS&&c.options.length<=5,c.id);
  for(const o of c.options){assert.ok(o.chooseWhen&&o.beCarefulWhen&&o.sources.length>=1&&o.sources.length<=3,o.name);}
 }
});
test('schema rejects bad examples',()=>{
 for(const patch of [{id:''},{id:'Bad Id'},{title:''},{question:' '},{quickRule:undefined},{lessons:'x'},{lessons:['no-such-lesson']},{options:[option,option]},{options:[]},{options:undefined}])
  assert.ok(bad(make(patch)).length>0,JSON.stringify(patch));
 const withOption=patch=>make({},[{...option,...patch},{...option,name:'B'},{...option,name:'C'}]);
 for(const patch of [{name:''},{chooseWhen:''},{beCarefulWhen:undefined},{sources:[]},{sources:undefined},{sources:['http://cloud.google.com/x']},{sources:['https://example.com/x']},{sources:['https://evil.google.com.example.com/']},{sources:['not a url']},{sources:Array(4).fill('https://docs.cloud.google.com/a')},{name:'B'}])
  assert.ok(bad(withOption(patch)).length>0,JSON.stringify(patch));
 assert.ok(bad(make({},[option,{...option,name:'B'},{...option,name:'C'},{...option,name:'D'},{...option,name:'E'},{...option,name:'F'}])).length>0);
 assert.ok(validateComparisons({},[]).length);
 assert.ok(bad([null]).length);
 assert.deepEqual(bad(make()),[]);
});
test('current product names appear with the exam-guide name once',()=>{
 const text=JSON.stringify(items);
 assert.ok(text.includes('Managed Service for Apache Spark (formerly Dataproc)'));
 assert.ok(text.includes('Managed Service for Apache Airflow (formerly Cloud Composer)'));
});
test('columnsFor gives one column on phones and at most three on wide screens',()=>{
 assert.equal(K.columnsFor(360,5),1);assert.equal(K.columnsFor(719,5),1);assert.equal(K.columnsFor(720,5),2);
 assert.equal(K.columnsFor(1100,5),3);assert.equal(K.columnsFor(1100,2),2);assert.equal(K.columnsFor(1400,1),1);
 assert.equal(K.columnsFor(undefined,3),1);assert.equal(K.columnsFor(1200,0),1);
});
test('layoutRows keeps every option once, in order',()=>{
 const five=[1,2,3,4,5];
 assert.deepEqual(K.layoutRows(five,3),[[1,2,3],[4,5]]);
 assert.deepEqual(K.layoutRows(five,1),[[1],[2],[3],[4],[5]]);
 assert.deepEqual(K.layoutRows(five,9),[five]);
 assert.deepEqual(K.layoutRows([],3),[]);
 assert.deepEqual(K.layoutRows(five,0).flat(),five);
});
test('option cards, the verification line and the log lookup',()=>{
 const o=items[0].options[0],card=K.optionCard(o);
 assert.equal(card.name,o.name);assert.deepEqual(card.sections.map(s=>s.label),['Choose it when','Be careful when']);
 assert.ok(card.sources.every(s=>s.url.startsWith('https://')&&s.host.endsWith('google.com')));
 const entry=K.entryFor(log,'storage');
 assert.equal(K.checkedLine(entry),'Checked 2026-11-08 against Google Developer Knowledge MCP');
 assert.equal(K.checkedLine(null),'Not yet verified against Google documentation.');
 assert.equal(K.entryFor(log,'nope'),null);
 const old={...entry,checkedOn:'2026-01-01',note:'old'};
 assert.equal(K.entryFor([old,entry],'storage').note,entry.note);
});
test('the detail page renders every option, escapes text and links lessons',()=>{
 const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
 const ui=K.create({D:{lessons:pack.lessons},e,width:()=>1200});
 const c=items[0],html=ui.detail(c,K.entryFor(log,c.id));
 for(const o of c.options)assert.ok(html.includes(e(o.name)));
 assert.equal((html.match(/class="cmp-card"/g)||[]).length,c.options.length);
 assert.ok(html.includes('--cols:3')&&html.includes('--cols:2'));
 assert.ok(html.includes('Checked 2026-11-08 against Google Developer Knowledge MCP'));
 assert.ok(html.includes('href="#learn/storage-choice"'));
 assert.ok(!ui.detail({...c,title:'<b>x</b>'},null).includes('<b>x</b>'));
 assert.ok(ui.list(items).includes('#review/compare-storage'));
 assert.ok(K.create({D:{lessons:[]},e,width:()=>360}).detail(c,null).includes('--cols:1'));
});
