import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sha12} from '../scripts/lesson-es.mjs';
import {importedPaths,validateOverlay,status,coverage,merge,readOverlay,englishImported,overlayDomains} from '../scripts/imported-es.mjs';
import '../dist/assets/core.js';
import '../dist/assets/loader.js';
const IE=globalThis.FieldImportedEs,C=globalThis.FieldCore;
const read=f=>JSON.parse(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'));
/* Domains whose imported overlay is shipped, and how many imported questions each domain has. */
const SHIPPED=[1,2,3,4,5],COUNTS={1:57,2:53,3:61,4:90,5:88};
const imported=()=>read('content/imported.json').questions;
/* Everything but the translatable strings, so two copies can be compared field by field. */
const skeleton=q=>{const c=structuredClone(q);for(const k of ['text','html','sourceExplanation','explanation','reviewNote','issues'])delete c[k];c.choices=c.choices.map(({letter})=>({letter}));return c;};
const demo=()=>({id:'imp-9',number:9,origin:'imported',domain:1,text:'Use BigQuery for 3 jobs with event_time.',html:'Use BigQuery for 3 jobs with event_time.<br><img src="assets/images/a.png" alt="Original diagram" loading="lazy"><br>See <code>SELECT 1</code>.',choices:[{letter:'A',text:'BigQuery.',html:'BigQuery.'},{letter:'B',text:'None.',html:'None.'}],sourceAnswer:['A'],answer:['A'],required:1,sourceExplanation:'It scans.',explanation:'',reviewNote:'Not verified.',issues:['A placeholder.'],status:'unreviewed',gradable:false});
const entry=(q,p,es)=>({es,src:sha12(new Map(importedPaths(q)).get(p))});
const goodHtml='Usa BigQuery para 3 trabajos con event_time.<br><img src="assets/images/a.png" alt="Original diagram" loading="lazy"><br>Mira <code>SELECT 1</code>.';
const demoOverlay=q=>({'imp-9':{html:entry(q,'html',goodHtml),'choices.0.html':entry(q,'choices.0.html','BigQuery.'),'choices.1.html':entry(q,'choices.1.html','Ninguno.'),reviewNote:entry(q,'reviewNote','Sin verificar.')}});
const run=(o,q=demo())=>validateOverlay(o,[q]);
const withHtml=(q,html)=>({...demoOverlay(q)['imp-9'],html:entry(q,'html',html)});

test('all five domains have a shipped overlay',()=>{
 assert.equal(imported().length,349);
 for(const d of [1,2,3,4,5])assert.equal(englishImported(d).length,COUNTS[d],'domain '+d);
 assert.equal(Object.values(COUNTS).reduce((a,b)=>a+b,0),349);
 assert.deepEqual(overlayDomains(),SHIPPED);
});
test('every shipped overlay is valid, current and covers 100 percent of its imported questions',()=>{
 for(const d of overlayDomains()){
  const o=readOverlay(d),qs=englishImported(d);
  assert.deepEqual(validateOverlay(o,qs),[],'domain '+d);
  assert.deepEqual(Object.keys(o),qs.map(q=>q.id),'every question of domain '+d+' in file order');
  const c=coverage(o,qs);
  assert.equal(c.ok,c.total,'domain '+d);
  assert.ok(status(o,qs).every(x=>x.state==='ok'));
 }
 const d1=coverage(readOverlay(1),englishImported(1));
 assert.equal(d1.total,412);
 const d2=coverage(readOverlay(2),englishImported(2));
 assert.equal(d2.total,383);assert.equal(d2.ok,383);
 assert.equal(Object.keys(readOverlay(2)).length,53);
 const d3=coverage(readOverlay(3),englishImported(3));
 assert.equal(d3.total,434);assert.equal(d3.ok,434);
 assert.equal(Object.keys(readOverlay(3)).length,61);
 const d4=coverage(readOverlay(4),englishImported(4));
 assert.equal(d4.total,640);assert.equal(d4.ok,640);
 assert.equal(Object.keys(readOverlay(4)).length,90);
 const d5=coverage(readOverlay(5),englishImported(5));
 assert.equal(d5.total,632);assert.equal(d5.ok,632);
 assert.equal(Object.keys(readOverlay(5)).length,88);
});
test('the overlay holds only strings: no id, key, letter, status or image field',()=>{
 for(const d of overlayDomains()){
  const o=readOverlay(d);
  for(const [id,entries] of Object.entries(o)){
   assert.match(id,/^imp-\d+$/);
   for(const [p,x] of Object.entries(entries)){
    assert.match(p,/^(html|choices\.\d+\.html|sourceExplanation|explanation|reviewNote|issues\.\d+)$/,id);
    assert.deepEqual(Object.keys(x).sort(),['es','src'],id+':'+p);
    assert.equal(typeof x.es,'string');assert.ok(x.es.trim());
   }
  }
  const keys=new Set(Object.values(o).flatMap(e=>Object.keys(e)));
  for(const k of ['answer','sourceAnswer','required','letter','gradable','status','origin','domain','lesson','references','sources','images','hasImages','id','number','text'])assert.ok(!keys.has(k),'domain '+d+' has no '+k);
 }
});
test('every translated html keeps the exact tags, attributes and image sources of the English',()=>{
 let images=0,breaks=0;
 for(const d of overlayDomains()){
  const o=readOverlay(d);
  for(const q of englishImported(d))for(const [p,en] of importedPaths(q)){
   if(!/html$/.test(p))continue;
   const es=o[q.id][p].es,tags=s=>s.match(/<[^>]*>/g)||[];
   assert.deepEqual(tags(es),tags(en),q.id+':'+p);
   images+=tags(en).filter(t=>t.startsWith('<img')).length;breaks+=tags(en).length;
  }
 }
 assert.equal(images,25,'the inline images of the five domains: 4, 5, 5, 5 and 6');
 assert.ok(breaks>300);
});
test('every choice of every question is translated, in the same number and order',()=>{
 for(const d of overlayDomains()){
  const o=readOverlay(d);
  for(const q of englishImported(d)){
   q.choices.forEach((c,i)=>assert.ok(o[q.id]['choices.'+i+'.html']?.es.trim(),q.id+' choice '+i));
   assert.ok(o[q.id].html.es.trim());
   if(q.sourceExplanation)assert.ok(o[q.id].sourceExplanation);
   if(q.explanation)assert.ok(o[q.id].explanation);
   if(q.reviewNote)assert.ok(o[q.id].reviewNote);
   q.issues.forEach((_,i)=>assert.ok(o[q.id]['issues.'+i]));
  }
 }
});
test('domain 2 overlay keeps code tokens, numbers and names, and holds no key field',()=>{
 const o=readOverlay(2);
 const has=(id,p,needle)=>assert.ok(o[id][p].es.includes(needle),id+':'+p+' '+needle);
 has('imp-9','choices.0.html','noaa_gsod');has('imp-56','choices.0.html','TABLE_DATE_RANGE');has('imp-246','choices.1.html','STREET_ADDRESS');has('imp-136','html','europe-west4');has('imp-143','choices.0.html','--update');has('imp-228','choices.3.html','retain-acked-messages');
 for(const e of Object.values(o))for(const p of Object.keys(e))assert.match(p,/^(html|choices\.\d+\.html|sourceExplanation|explanation|reviewNote|issues\.\d+)$/);
 const stale=structuredClone(o);stale['imp-3'].html.src='000000000000';
 assert.ok(validateOverlay(stale,englishImported(2)).some(e=>/stale translation/.test(e)));
});
test('domain 3 overlay keeps code tokens, tables of identifiers, numbers and names, and holds no key field',()=>{
 const o=readOverlay(3),qs=englishImported(3);
 assert.equal(qs.length,61);
 const has=(id,p,needle)=>assert.ok(o[id][p].es.includes(needle),id+':'+p+' '+needle);
 has('imp-8','choices.3.html','ROW_NUMBER');has('imp-44','choices.2.html','exclude_from_indexes');has('imp-99','choices.3.html','--maximum_bytes_billed');has('imp-207','html','location_id');has('imp-213','html','customer_order');has('imp-232','choices.0.html','constraints/gcp.resourceLocations');has('imp-267','choices.0.html','sales_transaction_header');has('imp-307','choices.0.html','0.0.0.0/0');has('imp-49','html','20,000');has('imp-123','html','1.5 PB');
 for(const e of Object.values(o))for(const p of Object.keys(e))assert.match(p,/^(html|choices\.\d+\.html|sourceExplanation|explanation|reviewNote|issues\.\d+)$/);
 for(const [id,e] of Object.entries(o))for(const k of ['answer','sourceAnswer','status','id','number','domain','images','letter'])assert.ok(!(k in e),id+' has no '+k);
 /* the five inline images keep their exact sources */
 const srcs=h=>[...h.matchAll(/src="([^"]+)"/g)].map(m=>m[1]);
 for(const q of qs)for(const [p,en] of importedPaths(q))if(/html$/.test(p))assert.deepEqual(srcs(o[q.id][p].es),srcs(en),q.id+':'+p);
 const stale=structuredClone(o);stale['imp-8'].html.src='000000000000';
 assert.ok(validateOverlay(stale,qs).some(e=>/stale translation/.test(e)));
 const broken=structuredClone(o);delete broken['imp-8']['choices.2.html'];
 assert.ok(validateOverlay(broken,qs).some(e=>/translated/.test(e)),'a missing choice fails');
 const lost=structuredClone(o);lost['imp-44']['choices.0.html'].es=lost['imp-44']['choices.0.html'].es.replace(/<img[^>]*>/,'');
 assert.ok(validateOverlay(lost,qs).some(e=>/html tags differ/.test(e)),'a dropped image tag fails');
});
test('domain 4 overlay is complete, keeps code tokens, options and numbers, and holds no key field',()=>{
 const o=readOverlay(4),qs=englishImported(4);
 assert.equal(qs.length,90);
 assert.deepEqual(Object.keys(o),qs.map(q=>q.id));
 const has=(id,p,needle)=>assert.ok(o[id][p].es.includes(needle),id+':'+p+' '+needle);
 has('imp-5','choices.2.html','max_bad_records');has('imp-156','choices.0.html','hdfs://');has('imp-172','choices.3.html','AfterWatermark.pastEndOfWindow ()');has('imp-229','choices.0.html','allow_non_incremental_definition');has('imp-229','choices.0.html','max_staleness');has('imp-328','choices.0.html','INSERT INTO ... SELECT * FROM external_table');has('imp-336','choices.0.html','--region=us-central1');has('imp-342','html','average_transaction_amount_last_24_hours');has('imp-343','choices.3.html','ML.GENERATE_TEXT');has('imp-282','html','1.5 GB');
 for(const e of Object.values(o))for(const p of Object.keys(e))assert.match(p,/^(html|choices\.\d+\.html|sourceExplanation|explanation|reviewNote|issues\.\d+)$/);
 for(const [id,e] of Object.entries(o))for(const k of ['answer','sourceAnswer','required','status','id','number','domain','images','letter','gradable','origin','lesson'])assert.ok(!(k in e),id+' has no '+k);
 /* image-only choices of imp-243 and the inline image of imp-63 keep their exact sources */
 const srcs=h=>[...h.matchAll(/src="([^"]+)"/g)].map(m=>m[1]);
 for(const q of qs)for(const [p,en] of importedPaths(q))if(/html$/.test(p))assert.deepEqual(srcs(o[q.id][p].es),srcs(en),q.id+':'+p);
 for(const e of Object.values(o))for(const x of Object.values(e))assert.ok(!/[;–—]/.test(x.es.replace(/&[#\w]+;/g,'')),x.es.slice(0,60));
 const stale=structuredClone(o);stale['imp-1'].html.src='000000000000';
 assert.ok(validateOverlay(stale,qs).some(e=>/stale translation/.test(e)),'a stale entry fails');
 const broken=structuredClone(o);delete broken['imp-1']['choices.2.html'];
 assert.ok(validateOverlay(broken,qs).some(e=>/translated/.test(e)),'a missing choice fails');
 const lost=structuredClone(o);lost['imp-63'].html.es=lost['imp-63'].html.es.replace(/<img[^>]*>/,'');
 assert.ok(validateOverlay(lost,qs).some(e=>/html tags differ/.test(e)),'a dropped image tag fails');
 const keyed=structuredClone(o);keyed['imp-1'].answer={es:'A',src:'000000000000'};
 assert.ok(validateOverlay(keyed,qs).some(e=>/only the html/.test(e)),'a key field is rejected');
});
test('Spanish keeps numbers, product names and code tokens, and has no semicolon or long dash',()=>{
 const o=readOverlay(1);
 const has=(id,p,needle)=>assert.ok(o[id][p].es.includes(needle),id+':'+p+' '+needle);
 has('imp-24','html','CLICK_STREAM');has('imp-24','choices.3.html','IS_NEW');has('imp-34','html','60 máquinas virtuales');has('imp-182','html','90 GB');
 has('imp-55','html','events_partitioned');has('imp-217','choices.2.html','filter_expression');has('imp-24','sourceExplanation','TIMESTAMP');
 for(const e of Object.values(o))for(const x of Object.values(e))assert.ok(!/[;–—]/.test(x.es.replace(/&[#\w]+;/g,'')),x.es.slice(0,60));
});
test('the validator rejects stale, unknown, empty, structural and unsafe entries',()=>{
 const q=demo(),o=demoOverlay(q);
 assert.deepEqual(run(o),[]);
 assert.ok(run({'imp-9':{...o['imp-9'],html:{es:goodHtml,src:'000000000000'}}}).some(e=>/stale translation/.test(e)));
 assert.ok(run({'imp-8':o['imp-9']}).some(e=>/unknown imported question id/.test(e)));
 assert.ok(run({'imp-9':{...o['imp-9'],'choices.9.html':entry(q,'choices.0.html','x')}}).some(e=>/path does not exist/.test(e)));
 for(const p of ['answer','sourceAnswer','status','text','choices.0.letter','choices.0.text','id','domain','images'])assert.ok(run({'imp-9':{[p]:{es:'x',src:'0'}}}).some(e=>/only the html/.test(e)),p);
 assert.ok(run({'imp-9':{...o['imp-9'],html:{es:'  ',src:o['imp-9'].html.src}}}).some(e=>/empty Spanish/.test(e)));
 assert.ok(run({'imp-9':{...o['imp-9'],html:{...o['imp-9'].html,extra:1}}}).some(e=>/unexpected field/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('Usa BigQuery','Usa el almacén'))}).some(e=>/protected name "BigQuery"/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('3 trabajos','4 trabajos'))}).some(e=>/numbers differ/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('event_time','la hora del evento'))}).some(e=>/code token "event_time"/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('trabajos con','trabajos; con'))}).some(e=>/semicolon or a long dash/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('trabajos con','trabajos — con'))}).some(e=>/semicolon or a long dash/.test(e)));
 /* structure: a removed, added, reordered or edited tag, a changed image source, a changed attribute, changed code content */
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('<br><img','<img'))}).some(e=>/tags differ/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml+'<br>')}).some(e=>/tags differ/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('a.png','b.png'))}).some(e=>/tags differ/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('alt="Original diagram"','alt="Diagrama original"'))}).some(e=>/tags differ/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace(' loading="lazy"',''))}).some(e=>/tags differ/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('<br>Mira','<b>Mira</b>'))}).some(e=>/tags differ/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('SELECT 1','SELECT 2'))}).some(e=>/code or pre content differs|numbers differ/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('SELECT 1','select 1'))}).some(e=>/code or pre content differs/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('trabajos','trabajos <script>'))}).some(e=>/tags differ|raw/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('trabajos','trabajos &amp; más'))}).some(e=>/entity &amp; count/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('trabajos','trabajos & más'))}).some(e=>/raw/.test(e)));
 assert.ok(run({'imp-9':withHtml(q,goodHtml.replace('trabajos','trabajos &copy; más'))}).some(e=>/entity the English does not use/.test(e)));
 const partial=structuredClone(o);delete partial['imp-9']['choices.1.html'];
 assert.ok(run(partial).some(e=>/has 2 choice html strings but 1 translated/.test(e)));
 const noHtml=structuredClone(o);delete noHtml['imp-9'].html;
 assert.ok(run(noHtml).some(e=>/choices are translated but the question html is not/.test(e)));
 assert.ok(run([]).some(e=>/object keyed by question id/.test(e)));
});
test('plain strings cannot add markup and html entities of the English are kept',()=>{
 const q=demo();q.html='Use the form &lt;key&gt; with it&#x27;s value.<br>';
 const base={html:entry(q,'html','Usa la forma &lt;key&gt; con su valor.<br>'),'choices.0.html':entry(q,'choices.0.html','BigQuery.'),'choices.1.html':entry(q,'choices.1.html','Ninguno.')};
 assert.deepEqual(run({'imp-9':base},q),[]);
 assert.ok(run({'imp-9':{...base,html:entry(q,'html','Usa la forma <key> con su valor.<br>')}},q).some(e=>/tags differ|raw/.test(e)));
 assert.ok(run({'imp-9':{...base,html:entry(q,'html','Usa la forma con su valor.<br>')}},q).some(e=>/entity &lt; count/.test(e)));
 assert.ok(run({'imp-9':{...base,reviewNote:entry(q,'reviewNote','Sin <b>verificar</b>.')}},q).some(e=>/adds markup characters/.test(e)));
});
test('a stale English text fails the check and merge stamps fresh hashes',()=>{
 const q=demo(),o=demoOverlay(q),changed=structuredClone(q);changed.sourceExplanation='It scans a lot.';changed.reviewNote='Changed note.';
 assert.ok(validateOverlay({'imp-9':{...o['imp-9'],reviewNote:o['imp-9'].reviewNote}},[changed]).some(e=>/stale translation/.test(e)));
 assert.equal(status(o,[changed]).find(x=>x.path==='reviewNote').state,'stale');
 const m=merge(null,{'imp-9':{html:goodHtml}},[q]);
 assert.equal(m['imp-9'].html.src,sha12(q.html));
 assert.throws(()=>merge(null,{'imp-9':{answer:'x'}},[q]),/Unknown path/);
 assert.throws(()=>merge(null,{'imp-1':{html:'x'}},[q]),/Unknown question id/);
});
test('applying the overlay changes only strings, derives the text from the html and restores English exactly',async()=>{
 const o=readOverlay(1),english=englishImported(1),qs=structuredClone(english);
 const stale=await IE.apply(qs,o,true);
 assert.deepEqual(stale,[]);
 qs.forEach((q,i)=>{
  const e=english[i];
  assert.deepEqual(skeleton(q),skeleton(e),q.id+' ids, keys, answers, status, images and letters are untouched');
  assert.deepEqual(q.sourceAnswer,e.sourceAnswer);assert.equal(q.status,e.status);assert.equal(q.hasImages,e.hasImages);
  assert.notEqual(q.html,e.html);assert.equal(q.text,IE.htmlToText(q.html),'text follows the html');
  q.choices.forEach((c,j)=>{assert.equal(c.letter,e.choices[j].letter);assert.equal(c.text,IE.htmlToText(c.html));});
  assert.equal(q.issues.length,e.issues.length);
 });
 await IE.apply(qs,o,false);
 assert.deepEqual(qs,english,'English is restored exactly');
 assert.equal(IE.status('imp-12'),null,'no label once English is back');
});
test('the original toggle swaps one question to its untouched English text and back, without reloading',async()=>{
 const o=readOverlay(1),english=englishImported(1),qs=structuredClone(english),q=qs.find(x=>x.id==='imp-12'),e=english.find(x=>x.id==='imp-12'),other=qs.find(x=>x.id==='imp-24');
 await IE.apply(qs,o,true);
 const spanish=structuredClone(q);
 assert.equal(IE.status('imp-12'),'es');
 assert.equal(IE.toggle(q),'en');
 assert.deepEqual(q,e,'the English question is byte for byte the supplied one');
 assert.notEqual(other.html,english.find(x=>x.id==='imp-24').html,'other questions stay Spanish');
 assert.equal(IE.status('imp-12'),'en');
 assert.equal(IE.stateOf(e.choices[0].text),'translated','the original shown by choice is not listed as missing');
 await IE.apply(qs,o,true);
 assert.deepEqual(q,e,'a re-render keeps the learner choice');
 assert.equal(IE.toggle(q),'es');
 assert.deepEqual(q,spanish);
 assert.equal(IE.toggle({id:'imp-999'}),null,'a question without Spanish has no toggle');
 await IE.apply(qs,o,false);
});
test('a stale, missing or unloaded entry shows English and is listed with its reason',async()=>{
 const o=structuredClone(readOverlay(1)),english=englishImported(1),qs=structuredClone(english).slice(0,2),a=qs[0];
 o[a.id].html.src='000000000000';delete o[a.id]['choices.1.html'];
 const stale=await IE.apply(qs,o,true);
 assert.deepEqual(stale,[a.id+':html']);
 assert.equal(a.html,english[0].html);assert.equal(a.choices[1].html,english[0].choices[1].html);assert.notEqual(a.choices[0].html,english[0].choices[0].html);
 assert.equal(IE.status(a.id),null,'no Spanish stem, no label');
 assert.equal(IE.stateOf(english[0].choices[1].text),'no entry in the overlay');
 assert.equal(IE.stateOf(IE.segments(english[0].html)[0]),'stale source hash');
 assert.equal(IE.stateOf(IE.htmlToText(a.choices[0].html)),'translated');
 await IE.apply(qs,null,true);
 assert.equal(IE.stateOf(english[0].choices[0].text),'overlay not loaded');
 assert.equal(IE.stateOf(IE.segments(english[1].html)[0]),'overlay not loaded');
 await IE.apply(qs,null,false);
 assert.equal(IE.stateOf(english[0].choices[0].text),null);
 const src=fs.readFileSync(new URL('../src/scripts/i18n.js',import.meta.url),'utf8');
 assert.ok(/IE\.stateOf\(core\)/.test(src)&&/FieldImportedEs/.test(src),'report() reads the imported overlay state');
});
test('report states: translated lines, cut list rows and html pieces split by line breaks',async()=>{
 const o=readOverlay(1),qs=structuredClone(englishImported(1)),q=qs[0];
 await IE.apply(qs,o,true);
 for(const piece of IE.segments(q.html))assert.equal(IE.stateOf(piece),'translated');
 assert.equal(IE.stateOf(q.text.slice(0,60)+'…'),'translated');
 assert.equal(IE.stateOf(q.sourceExplanation),'translated');
 assert.equal(IE.stateOf(q.reviewNote),'translated');
 assert.equal(IE.stateOf('A sentence no question uses.'),null);
 await IE.apply(qs,o,false);
});
test('scoring and answer checking are identical with and without the overlay',async()=>{
 const english=englishImported(1),o=readOverlay(1),spanish=structuredClone(english);
 await IE.apply(spanish,o,true);
 const map=list=>Object.fromEntries(list.map(q=>[q.id,q]));
 const en=map(english),es=map(spanish),ids=english.map(q=>q.id);
 const answers={};ids.forEach((id,i)=>{const q=en[id];answers[id]=i%3===0?[...q.answer]:i%3===1?[q.choices.find(c=>!q.answer.includes(c.letter)).letter]:i%5===0?[]:[...q.answer].reverse().slice(0,1);});
 const a=C.scoreExam(ids,answers,en),b=C.scoreExam(ids,answers,es);
 assert.deepEqual(b,a);
 assert.ok(a.correct>0&&a.correct<a.total);
 for(const q of english){
  const s=es[q.id];
  assert.deepEqual(s.answer,q.answer);assert.deepEqual(s.sourceAnswer,q.sourceAnswer);assert.equal(s.required,q.required);assert.equal(s.gradable,q.gradable);assert.equal(s.status,q.status);
  assert.equal(C.equalAnswers([...q.answer].reverse(),s.answer),true,'order of picks does not matter');
  assert.equal(C.equalAnswers([q.choices.find(c=>!q.answer.includes(c.letter)).letter],s.answer),false);
 }
 await IE.apply(spanish,o,false);
});
test('the build ships the Spanish imported file and lists it in the manifest, English pages never reference it',()=>{
 const sandbox={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),sandbox);
 const m=sandbox.FIELDNOTES_DATA.manifest;
 assert.equal(JSON.stringify(m.esImported),JSON.stringify(SHIPPED));assert.equal(m.importedEs,'data/es/imported/domain-');
 for(const d of SHIPPED)assert.deepEqual(read('dist/data/es/imported/domain-'+d+'.json'),readOverlay(d));
 assert.ok(!/imported-es/.test(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8')),'English pages never reference the Spanish imported script');
 assert.ok(!/imported-es/.test(fs.readFileSync(new URL('../dist/assets/app.js',import.meta.url),'utf8').replace(/FieldImportedEs/g,'')),'the app does not name the lazy script');
 for(const d of [1,2,3,4,5]){
  const bank=read('dist/data/imported/domain-'+d+'.json'),src=englishImported(d);
  assert.deepEqual(bank,src,'the English imported bank of domain '+d+' is built unchanged');
 }
});
test('the loader requests the imported overlay only in Spanish, only for the domain shown, and restores English',async()=>{
 const sandbox={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),sandbox);
 const data=JSON.parse(JSON.stringify(sandbox.FIELDNOTES_DATA)),calls=[],scripts=[];
 globalThis.document={createElement:()=>({}),head:{append:el=>{scripts.push(el.src);queueMicrotask(()=>el.onload());}}};
 const fetcher=async url=>{const f=new URL(url).pathname.split('/data/')[1];calls.push(f);return {ok:true,json:async()=>read('dist/data/'+f)};};
 const asked=()=>calls.filter(c=>c.startsWith('es/imported/')).map(c=>Number(/(\d)\.json/.exec(c)[1]));
 const o=readOverlay(1),d1=englishImported(1);
 try{
  let lang='en';
  const loader=globalThis.FieldLoader.create(data,fetcher,'https://example.test/p/',()=>lang);
  await loader.ensure('practice');await loader.ensure('practice','imp-12');await loader.ensure('practice','imp-16');
  assert.deepEqual(asked(),[],'English visitors request no Spanish imported file');
  assert.ok(!scripts.some(s=>/imported-es/.test(s)));
  lang='es';
  await loader.ensure('practice','imp-16');
  assert.deepEqual(asked(),[5],'domain 5 loads its own Spanish file');
  calls.length=0;
  await loader.ensure('practice','imp-12');
  assert.deepEqual(asked(),[1],'a question page loads only its own domain');
  assert.ok(scripts.some(s=>/imported-es/.test(s)));
  const q12=data.questions.find(q=>q.id==='imp-12');
  assert.equal(q12.html,o['imp-12'].html.es);assert.equal(q12.choices[0].html,o['imp-12']['choices.0.html'].es);
  assert.equal(q12.text,IE.htmlToText(o['imp-12'].html.es));
  assert.deepEqual(q12.answer,d1.find(q=>q.id==='imp-12').answer);assert.deepEqual(q12.sourceAnswer,d1.find(q=>q.id==='imp-12').sourceAnswer);
  assert.equal(IE.status('imp-12'),'es');
  /* the list merges English catalog text over loaded questions, the cached overlay is applied again without a new request */
  calls.length=0;
  await loader.ensure('practice');
  assert.deepEqual(asked(),[]);
  assert.equal(q12.text,IE.htmlToText(o['imp-12'].html.es),'row text stays Spanish after the catalog merge');
  assert.equal(data.questions.find(q=>q.id==='imp-16').choices.length>0,true);
  assert.equal(data.questions.find(q=>q.id==='imp-16').html,readOverlay(5)['imp-16'].html.es,'domain 5 shows its Spanish');
  calls.length=0;await loader.ensure('practice','imp-1');
  assert.deepEqual(asked(),[4],'domain 4 loads its own Spanish file');
  assert.equal(data.questions.find(q=>q.id==='imp-1').html,readOverlay(4)['imp-1'].html.es);
  calls.length=0;await loader.ensure('practice','imp-12');await loader.ensure('practice','imp-24');
  assert.deepEqual(asked(),[],'each overlay is requested once');
  lang='en';
  await loader.ensure('practice','imp-12');
  const back=d1.find(q=>q.id==='imp-12');
  assert.equal(q12.html,back.html);assert.deepEqual(q12.choices.map(c=>c.html),back.choices.map(c=>c.html));assert.equal(q12.sourceExplanation,back.sourceExplanation);assert.equal(q12.reviewNote,back.reviewNote);
  assert.equal(IE.status('imp-12'),null);
 }finally{delete globalThis.document;}
});
test('the question page shows the label, the swap control and keeps the source key and review label visible',()=>{
 const app=fs.readFileSync(new URL('../src/scripts/app.js',import.meta.url),'utf8');
 assert.ok(app.includes('Traducción al español de una pregunta aportada'));
 assert.ok(app.includes('Ver el original en inglés')&&app.includes('Ver la traducción'));
 assert.ok(/case'imported-view'/.test(app));
 assert.ok(/<h1>\$\{qlabel\(q\)\}<\/h1>\$\{importedBar\(q\)\}/.test(app),'the bar sits under the question title');
 assert.ok(/\$\{statusTag\(q\)\}/.test(app),'the review label chip is still rendered');
 assert.ok(/'Answer key: '|Editorial answer: /.test(app)&&/Matches the imported key/.test(app),'the source key wording is unchanged');
 const loader=fs.readFileSync(new URL('../src/scripts/loader.js',import.meta.url),'utf8');
 assert.ok(/localizeImported\(\[question\.domain\]\)/.test(loader));
});
test('the supplied imported collection and its images are not touched by this stage',()=>{
 const source=imported();
 assert.deepEqual(source.map(q=>q.number),Array.from({length:349},(_,i)=>i+1));
 for(const [file,meta] of Object.entries(read('content/imported.json').assetAudit))assert.ok(meta,file);
 assert.equal(fs.readdirSync(new URL('../assets/images/',import.meta.url)).length>=25,true);
 const scriptSource=fs.readFileSync(new URL('../scripts/imported-es.mjs',import.meta.url),'utf8');
 assert.ok(!/writeFileSync|copyFileSync|rmSync|unlinkSync/.test(scriptSource),'the validator module never writes files');
});
