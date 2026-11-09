import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sha12} from '../scripts/lesson-es.mjs';
import {KINDS,contentPaths,validateContentOverlay,status,coverage,merge,readOverlay,englishItems,overlayKinds} from '../scripts/content-es.mjs';
import '../dist/assets/loader.js';
const CE=globalThis.FieldContentEs;
const read=f=>JSON.parse(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8'));
const COUNTS={services:28,comparisons:4,workshops:12,architectures:4};
const entry=(kind,item,p,es)=>({es,src:sha12(new Map(contentPaths(kind,item)).get(p))});
const demoComparison=()=>({id:'demo',title:'Where to store 3 things',question:'Which one?',quickRule:'Use BigQuery first.',options:[{name:'A',chooseWhen:'You need BigQuery.',beCarefulWhen:'It may cost 5 units.',sources:['https://cloud.google.com/x']},{name:'B',chooseWhen:'You need B.',beCarefulWhen:'Careful.',sources:[]}],verification:{note:'Checked 2 pages.'}});

test('the four overlay kinds exist, are listed and have the expected item counts',()=>{
 assert.deepEqual([...KINDS],['services','comparisons','workshops','architectures']);
 assert.deepEqual(overlayKinds(),[...KINDS]);
 for(const k of KINDS)assert.equal(englishItems(k).length,COUNTS[k],k);
});
test('paths list learner-visible strings and skip names, ids, urls, code and fixtures',()=>{
 const w=new Map(contentPaths('workshops',read('content/workshops.json')[0]));
 assert.ok(w.has('title')&&w.has('steps.0.text')&&w.has('prediction.unit')&&w.has('explanation'));
 assert.ok(![...w.keys()].some(k=>/fixture|code|references|answer|mode|cloudNote/.test(k)));
 const c=new Map(contentPaths('comparisons',demoComparison()));
 assert.deepEqual([...c.keys()],['title','question','quickRule','options.0.chooseWhen','options.0.beCarefulWhen','options.1.chooseWhen','options.1.beCarefulWhen','verification.note']);
 const s=new Map(contentPaths('services',read('content/services.json')[0]));
 assert.ok(!s.has('name')&&!s.has('reference')&&!s.has('category')&&s.has('limitations.0'));
 const a=new Map(contentPaths('architectures',read('content/architectures.json')[0]));
 assert.ok(a.has('nodes.5.detail')&&a.has('edges.4.label')&&!a.has('nodes.0.id')&&!a.has('nodes.0.x'));
});
test('every shipped overlay is valid, current and has 100 percent coverage of its translatable strings',()=>{
 for(const k of KINDS){
  const items=englishItems(k),o=readOverlay(k),c=coverage(k,o,items);
  assert.deepEqual(validateContentOverlay(k,o,items),[],k);
  assert.equal(status(k,o,items).filter(r=>r.state==='stale').length,0,k);
  assert.equal(c.ok,c.total,k+' translated '+c.ok+' of '+c.total);
  assert.deepEqual(Object.keys(o).sort(),items.map(x=>x.id).sort(),k+' covers every item');
 }
 assert.equal(coverage('services',readOverlay('services'),englishItems('services')).total,140);
 assert.equal(coverage('comparisons',readOverlay('comparisons'),englishItems('comparisons')).total,44);
});
test('no shipped Spanish is empty, copies a long English sentence or uses semicolons and long dashes',()=>{
 for(const k of KINDS){
  const items=englishItems(k),o=readOverlay(k);
  for(const item of items)for(const [p,en] of contentPaths(k,item)){
   const x=o[item.id][p];
   assert.ok(x.es.trim(),item.id+':'+p);
   assert.ok(!/[;–—]/.test(x.es),k+' '+item.id+':'+p);
   if(en.length>60)assert.notEqual(x.es,en,k+' '+item.id+':'+p+' is still English');
  }
 }
});
test('the validator rejects bad content overlays',()=>{
 const c=demoComparison(),items=[c];
 const bad=(o,re)=>assert.ok(validateContentOverlay('comparisons',o,items).some(e=>re.test(e)),re+' in '+JSON.stringify(validateContentOverlay('comparisons',o,items)));
 const good=entry('comparisons',c,'title','Dónde guardar 3 cosas');
 assert.deepEqual(validateContentOverlay('comparisons',{demo:{title:good}},items),[]);
 bad({nope:{title:good}},/unknown comparisons id/);
 bad({demo:{'options.9.chooseWhen':good}},/path does not exist/);
 bad({demo:{title:{es:'  ',src:good.src}}},/empty Spanish/);
 bad({demo:{title:{es:'Dónde guardar 3 cosas',src:'000000000000'}}},/stale/);
 bad({demo:{quickRule:entry('comparisons',c,'quickRule','Usa la base primero.')}},/protected name "BigQuery"/);
 bad({demo:{title:entry('comparisons',c,'title','Dónde guardar 4 cosas')}},/numbers differ/);
 bad({demo:{'options.0.chooseWhen':entry('comparisons',c,'options.0.chooseWhen','Necesitas BigQuery.')}},/options\.\*\.chooseWhen has 2 entries but 1 translated/);
 bad([],/object/);
});
test('a stale English change fails and a changed verification note makes the Spanish note stale',()=>{
 const c=demoComparison(),o={demo:{'verification.note':entry('comparisons',c,'verification.note','Se revisaron 2 páginas.')}};
 assert.deepEqual(validateContentOverlay('comparisons',o,[c]),[]);
 c.verification.note='Checked 2 pages and more.';
 assert.ok(validateContentOverlay('comparisons',o,[c]).some(e=>/demo:verification\.note: stale/.test(e)));
 assert.deepEqual(status('comparisons',o,[c]).filter(r=>r.path==='verification.note').map(r=>r.state),['stale']);
 const real=structuredClone(readOverlay('services'));real['service-1'].fit.src='000000000000';
 assert.ok(validateContentOverlay('services',real,englishItems('services')).some(e=>/service-1:fit: stale/.test(e)));
});
test('status marks ok, missing and stale and merge stamps fresh hashes in path order',()=>{
 const c=demoComparison(),o={demo:{title:{es:'Dónde guardar 3 cosas',src:'000000000000'},question:entry('comparisons',c,'question','¿Cuál?')}};
 const s=Object.fromEntries(status('comparisons',o,[c]).map(r=>[r.path,r.state]));
 assert.equal(s.title,'stale');assert.equal(s.question,'ok');assert.equal(s.quickRule,'missing');
 const m=merge('comparisons',o,{demo:{title:'Dónde guardar 3 cosas'}},[c]);
 assert.equal(m.demo.title.src,sha12('Where to store 3 things'));
 assert.deepEqual(Object.keys(m.demo),['title','question']);
 assert.throws(()=>merge('comparisons',{},{demo:{nope:'x'}},[c]),/Unknown path/);
 assert.throws(()=>merge('comparisons',{},{zzz:{title:'x'}},[c]),/Unknown comparisons id/);
});
test('comparison notes are Spanish, hash against the latest English note and keep the product names',()=>{
 const log=read('content/verification-log.json'),o=readOverlay('comparisons');
 for(const c of englishItems('comparisons')){
  const latest=globalThis.FieldCompare.entryFor(log,c.id),x=o[c.id]['verification.note'];
  assert.ok(latest&&x,c.id);
  assert.equal(x.src,sha12(latest.note),c.id);
  assert.notEqual(x.es,latest.note,c.id+' note is translated');
  assert.ok(/\b(se|los|las|de|que|no)\b/i.test(x.es)&&/\bSe revis/.test(x.es),c.id+' note reads as Spanish');
 }
 assert.ok(/Dataproc/.test(o.processing['verification.note'].es)&&/Cloud Composer/.test(o.orchestration['verification.note'].es));
});
test('comparison options keep their count, names stay English and qualifiers survive',()=>{
 const o=readOverlay('comparisons'),items=englishItems('comparisons');
 for(const c of items){
  const options=c.options.length;
  for(let i=0;i<options;i++)for(const k of ['chooseWhen','beCarefulWhen'])assert.ok(o[c.id]['options.'+i+'.'+k],c.id+' option '+i+' '+k);
  assert.ok(!Object.keys(o[c.id]).some(p=>new RegExp('^options\\.(?!['+'0-'+(options-1)+']\\.)\\d').test(p)),c.id+' has no extra options');
  assert.ok(!Object.keys(o[c.id]).some(p=>/name|sources/.test(p)),'names and sources are not in the overlay');
 }
 const s=o.storage;
 assert.ok(/Cada instancia de Cloud SQL funciona con una máquina virtual, así que compara con Spanner/.test(s['options.3.beCarefulWhen'].es));
 assert.ok(/puede consultarlos/.test(s['options.0.beCarefulWhen'].es)&&/quizá no necesites/.test(s['options.0.beCarefulWhen'].es),'can and may stay qualified');
 assert.ok(/La documentación dice que Firestore puede ser mejor/.test(s['options.1.beCarefulWhen'].es),'the docs say, may');
 assert.ok(/Por defecto, Data Fusion/.test(o.processing['options.2.beCarefulWhen'].es),'by default');
 assert.ok(/La documentación dice que es mejor/.test(o.orchestration['options.0.beCarefulWhen'].es));
 const names=c=>c.options.map(x=>x.name);
 assert.ok(names(items[1]).includes('Managed Service for Apache Spark (formerly Dataproc)'));
 assert.ok(names(items[3]).includes('Managed Service for Apache Airflow (formerly Cloud Composer)'));
});
test('service cards keep fit and strength together and caution with the first limitation',()=>{
 const o=readOverlay('services');
 for(const s of englishItems('services')){
  assert.equal(o[s.id].fit.es,o[s.id].strength.es,s.id);
  assert.equal(o[s.id].caution.es,o[s.id]['limitations.0'].es,s.id);
 }
 assert.ok(/Managed Kafka/.test(o['service-23'].fit.es)&&/Cloud Storage/.test(o['service-25'].fit.es));
});
test('workshops keep literal data, steps and numbers and architectures keep nodes and edges',()=>{
 const w=readOverlay('workshops'),a=readOverlay('architectures');
 for(const x of englishItems('workshops')){
  for(let i=0;i<x.steps.length;i++)assert.ok(w[x.id]['steps.'+i+'.text'],x.id+' step '+i);
  assert.ok(!Object.keys(w[x.id]).some(p=>/fixture|code|answer|mode|cloudNote/.test(p)),x.id);
 }
 assert.ok(/SUM\(DISTINCT amount\)/.test(w['join-grain']['steps.3.text'].es)&&/a\/sequence 2/.test(w['dedup-latest'].explanation.es));
 assert.ok(/finance-private/.test(w['authorized-retrieval'].explanation.es)&&/policy-public/.test(w['authorized-retrieval'].explanation.es));
 assert.ok(/Dataflow/.test(w['late-corrections']['steps.3.text'].es)&&/Owner/.test(w['identity-map']['steps.3.text'].es));
 for(const x of englishItems('architectures')){
  assert.equal(Object.keys(a[x.id]).filter(p=>/^nodes\.\d+\.label$/.test(p)).length,x.nodes.length,x.id);
  assert.equal(Object.keys(a[x.id]).filter(p=>/^edges\.\d+\.label$/.test(p)).length,x.edges.length,x.id);
 }
 assert.ok(/Pub\/Sub/.test(a.streaming['nodes.1.label'].es)&&/BigLake/.test(a.lakehouse['nodes.1.label'].es)&&/Datastream/.test(a.cdc['nodes.1.label'].es));
});
test('the build writes one overlay file per kind and lists the kinds in the manifest',()=>{
 for(const k of KINDS)assert.deepEqual(JSON.parse(fs.readFileSync(new URL('../dist/data/es/'+k+'.json',import.meta.url),'utf8')),readOverlay(k),k);
 const boot={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),boot);
 assert.deepEqual([...boot.FIELDNOTES_DATA.manifest.esContent],[...KINDS]);
 assert.ok(fs.existsSync(new URL('../dist/assets/content-es.js',import.meta.url)));
});
test('apply shows Spanish, restores English and falls back on a stale hash',async()=>{
 const c=demoComparison(),o={demo:{title:entry('comparisons',c,'title','Dónde guardar 3 cosas'),question:{es:'¿Cuál?',src:'ffffffffffff'},'verification.note':entry('comparisons',c,'verification.note','Se revisaron 2 páginas.')}};
 const warn=console.warn;let said='';console.warn=m=>{said+=m;};
 try{
  const stale=await CE.apply('comparisons',[c],o,true);
  assert.equal(c.title,'Dónde guardar 3 cosas');
  assert.equal(c.verification.note,'Se revisaron 2 páginas.');
  assert.equal(c.question,'Which one?','a stale entry keeps English');
  assert.deepEqual(stale,['demo:question']);
  assert.match(said,/demo:question/);
  assert.deepEqual(await CE.apply('comparisons',[c],o,false),[]);
  assert.deepEqual(c,demoComparison());
  await CE.apply('comparisons',[c],null,true);
  assert.deepEqual(c,demoComparison(),'no overlay leaves English');
 }finally{console.warn=warn;}
});
test('a workshop first loaded as a short list entry keeps its English base when the full item merges in',async()=>{
 const full=read('content/workshops.json')[0],list={id:full.id,title:full.title,goal:full.goal,steps:full.steps.map(s=>({...s}))};
 const o=readOverlay('workshops');
 await CE.apply('workshops',[list],o,true);
 assert.equal(list.title,o[full.id].title.es);
 const merged=Object.assign(list,structuredClone(full));
 await CE.apply('workshops',[merged],o,true);
 assert.equal(merged.explanation,o[full.id].explanation.es);
 assert.equal(merged.steps[2].text,o[full.id]['steps.2.text'].es);
 await CE.apply('workshops',[merged],o,false);
 assert.deepEqual(merged,full);
});
test('the loader requests Spanish content only in Spanish, only on its route and restores English',async()=>{
 const sandbox={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),sandbox);
 const data=JSON.parse(JSON.stringify(sandbox.FIELDNOTES_DATA)),calls=[],scripts=[];
 globalThis.document={createElement:()=>({}),head:{append:el=>{scripts.push(el.src);queueMicrotask(()=>el.onload());}}};
 const fetcher=async url=>{const f=new URL(url).pathname.split('/data/')[1];calls.push(f);return {ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL('../dist/data/'+f,import.meta.url),'utf8'))};};
 try{
  let lang='en';
  const loader=globalThis.FieldLoader.create(data,fetcher,'https://example.test/p/',()=>lang);
  const english=data.services.map(s=>s.signal);
  await loader.ensure('compare');await loader.ensure('workshops');await loader.ensure('architectures');
  assert.deepEqual(calls,['workshops.json','architectures.json'],'English visitors request no Spanish file');
  assert.deepEqual(scripts,[]);
  calls.length=0;lang='es';
  await loader.ensure('home');await loader.ensure('learn');
  assert.ok(!calls.some(c=>/^es\/(services|comparisons|workshops|architectures)/.test(c)),'other routes do not load the content overlays');
  calls.length=0;
  await loader.ensure('compare');
  assert.deepEqual(calls,['es/services.json']);
  assert.notDeepEqual(data.services.map(s=>s.signal),english);
  assert.equal(data.services[10].name,'Pub/Sub','names stay English');
  await loader.ensure('workshops');await loader.ensure('architectures');
  assert.deepEqual(calls.filter(c=>c.startsWith('es/')),['es/services.json','es/workshops.json','es/architectures.json']);
  assert.ok(data.workshops.every(w=>w.title!==read('content/workshops.json').find(x=>x.id===w.id).title));
  assert.ok(data.architectures.every(a=>a.title!==read('content/architectures.json').find(x=>x.id===a.id).title));
  assert.deepEqual(data.workshops.map(w=>w.steps.length),read('content/workshops.json').map(w=>w.steps.length));
  const before=calls.length;await loader.ensure('compare');assert.equal(calls.length,before,'an overlay is requested once');
  lang='en';
  await loader.ensure('compare');await loader.ensure('workshops');await loader.ensure('architectures');
  assert.deepEqual(data.services.map(s=>s.signal),english,'English is restored');
  assert.deepEqual(data.workshops.map(w=>w.title),read('content/workshops.json').map(w=>w.title));
  assert.deepEqual(data.architectures,read('content/architectures.json'));
 }finally{delete globalThis.document;}
});
test('the compare page shows the Spanish verification note only for the matching English note',async()=>{
 const o=readOverlay('comparisons'),log=read('content/verification-log.json'),items=englishItems('comparisons');
 await CE.apply('comparisons',items,o,true);
 const c=items.find(x=>x.id==='storage'),latest=globalThis.FieldCompare.entryFor(log,'storage');
 assert.equal(c.verification.note,o.storage['verification.note'].es);
 const html=globalThis.FieldCompare.create({D:{lessons:[]},e:s=>String(s)}).detail(c,{...latest,note:c.verification.note});
 assert.ok(html.includes('Se revisó para qué sirve cada servicio'));
 await CE.apply('comparisons',items,o,false);
 assert.equal(c.verification.note,latest.note);
});
