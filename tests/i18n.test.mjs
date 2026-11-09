import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../dist/assets/core.js';
import '../dist/assets/i18n.js';
const C=globalThis.FieldCore,I=globalThis.FieldI18n;
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const raw=read('content/i18n-es.json'),dict=JSON.parse(raw),c=I.compile(dict);

test('language uses its own storage key and only an exact es means Spanish',()=>{
 assert.equal(C.LANG_KEY,'data-engineer-fieldnotes.lang.v1');
 assert.notEqual(C.LANG_KEY,'data-engineer-fieldnotes.v1');
 assert.equal(C.parseLang('es'),'es');
 assert.equal(C.parseLang('en'),'en');
 for(const bad of [null,undefined,'','ES','spanish','1','true','{}',1,{},[]])assert.equal(C.parseLang(bad),'en');
 assert.equal(C.serializeLang('es'),'es');
 for(const other of ['en','fr',null,undefined,1])assert.equal(C.serializeLang(other),'en');
});
test('toggling the language flips it and a bad value counts as English',()=>{
 assert.equal(C.toggleLang('en'),'es');
 assert.equal(C.toggleLang('es'),'en');
 for(const bad of [undefined,null,'',{},'fr'])assert.equal(C.toggleLang(bad),'es');
 assert.equal(C.parseLang(C.serializeLang(C.toggleLang(C.toggleLang('en')))),'en');
});
test('the English help state and its key are untouched by the language helpers',()=>{
 const state=C.defaultState();
 assert.equal(typeof state.english,'boolean');
 assert.equal(C.validateProgress(state,[],[]).english,state.english);
 assert.deepEqual(Object.keys(C).filter(k=>/KEY$/.test(k)).sort().includes('LANG_KEY'),true);
});

test('translate replaces an exact string and keeps the surrounding whitespace',()=>{
 assert.equal(I.translate('Start here',c),'Empieza aquí');
 assert.equal(I.translate('  Start here \n',c),'  Empieza aquí \n');
 assert.equal(I.translate('Start   here',c),'Empieza aquí');
});
test('translate fills placeholders in simple patterns',()=>{
 assert.equal(I.translate('Question 3 of 10',c),'Pregunta 3 de 10');
 assert.equal(I.translate('12 of 52 lessons completed. Checkboxes record your study; practice results help choose what to revisit.',c),'12 de 52 lecciones completadas. Las casillas registran tu estudio. Los resultados de práctica ayudan a elegir qué repasar.');
 assert.equal(I.translate('Domain 2: Ingesting and processing the data',c),'Dominio 2: Ingesta y procesamiento de los datos');
 assert.equal(I.translate('Domain 3: Storing the data · 20%',c),'Dominio 3: Almacenamiento de los datos · 20%');
 assert.equal(I.translate('Your 2-hour review plan',c),'Tu plan de repaso de 2 h');
 assert.equal(I.translate('Theme: dark',c),'Tema: oscuro');
 assert.equal(I.translate('1.2 Designing for reliability and fidelity',c),'1.2 Diseño para confiabilidad y fidelidad');
});
test('placeholders only accept numbers where a number is expected',()=>{
 assert.equal(I.translate('Question x of 10',c),'Question x of 10');
 assert.equal(I.translate('Question 3 of ten',c),'Question 3 of ten');
});
test('unknown strings come back unchanged',()=>{
 for(const text of ['Pub/Sub delivers at least once.','','   ','Something nobody translated',"BigQuery's slot reservations"])assert.equal(I.translate(text,c),text);
});
test('captured free text that has no entry stays as it was',()=>{
 assert.equal(I.translate('Start: Pub/Sub basics →',c),'Empezar: Pub/Sub basics →');
 assert.equal(I.translate('Resume: Dataflow windows →',c),'Retomar: Dataflow windows →');
});
test('product and service names are never altered in dictionary output',()=>{
 for(const term of ['BigQuery','Dataflow','Pub/Sub','Managed Service for Apache Spark','Google Cloud','Google Developer Knowledge MCP'])assert.ok(dict.protected.includes(term),term+' is protected');
 assert.equal(I.translate('Checked 2026-11-08 against Google Developer Knowledge MCP',c),'Revisado el 2026-11-08 con Google Developer Knowledge MCP');
 assert.ok(I.translate('Independent site. Not affiliated with, endorsed by or sponsored by Google. Google Cloud and its product names are trademarks of Google LLC.',c).includes('Google Cloud'));
 assert.equal(I.translate('Google Cloud',c),'Google Cloud');
});

test('the dictionary is valid, with no empty values and no duplicate keys',()=>{
 assert.deepEqual(I.validate(dict),[]);
 assert.deepEqual(I.duplicateKeys(raw),[]);
 for(const [k,v] of [...Object.entries(dict.strings),...Object.entries(dict.patterns)]){assert.equal(typeof v,'string');assert.ok(v.trim(),'empty value for '+k);}
 assert.ok(Object.keys(dict.strings).length>550);
 assert.ok(Object.keys(dict.patterns).length>95);
});
test('every placeholder in a key is present in its value',()=>{
 for(const [k,v] of Object.entries(dict.patterns)){
  for(const name of k.match(/\{\w+\}/g)||[])assert.ok(v.includes(name),k+' loses '+name);
 }
});
test('protected terms found in a key survive in its value',()=>{
 for(const [k,v] of [...Object.entries(dict.strings),...Object.entries(dict.patterns)])
  for(const term of dict.protected)if(k.toLowerCase().includes(term.toLowerCase()))assert.ok(v.toLowerCase().includes(term.toLowerCase()),k+' alters '+term);
});
test('the validator catches the mistakes it exists for',()=>{
 const base={protected:['BigQuery'],keep:[],strings:{},patterns:{}};
 assert.ok(I.validate({...base,strings:{'Hello':' '}}).some(e=>/empty value/.test(e)));
 assert.ok(I.validate({...base,patterns:{'Item {n} of {total}':'Elemento {n}'}}).some(e=>/loses \{total\}/.test(e)));
 assert.ok(I.validate({...base,patterns:{'Item {n}':'Elemento {n} de {total}'}}).some(e=>/invents \{total\}/.test(e)));
 assert.ok(I.validate({...base,strings:{'Load it into BigQuery':'Cárgalo en el almacén'}}).some(e=>/protected term/.test(e)));
 assert.ok(I.validate({...base,strings:{'Load it into BigQuery':'Cárgalo en BigQuery'}}).length===0);
 assert.ok(I.validate({...base,strings:{'Same':'Igual'},patterns:{'Same':'Igual'}}).some(e=>/both a string and a pattern/.test(e)));
 assert.deepEqual(I.duplicateKeys('{"strings":{"A":"x","B":"y","A":"z"}}'),['A']);
});
test('every English string in the dictionary exists in the client source or the domain data',()=>{
 const files=['src/index.html',...fs.readdirSync(new URL('../src/scripts/',import.meta.url)).filter(f=>f.endsWith('.js')&&f!=='i18n.js').map(f=>'src/scripts/'+f)];
 const source=files.map(read).join('\n')+['domains','lessons','services','workshops','sources','glossary'].map(f=>read('content/'+f+'.json')).join('\n'),clean=s=>s.replace(/&amp;/g,'&');
 const text=clean(source),strip=x=>x.replace(/^[←→:·\s]+|[←→:·\s]+$/g,''),missing=[];
 // Arrows and some labels are joined with a variable in the source, so edges are trimmed. Pattern pieces may also be split across several literals.
 // image-text.js builds these four from 'Selectable ' + kind + ' from the original image' and 'Copy ' + kind.
 const composed=new Set(['Selectable text from the original image','Selectable table from the original image','Copy text','Copy table',
  // Built from a condition and two literals in app.js, attention.js and study-ui.js.
  'Value units · no events yet','Accepted into its event-time window.','Accepted into its event-time window despite its delay.','{concept} Rule enabled. The result is {n} {unit}.','{concept} Rule disabled. The result is {n} {unit}.','Question {n}, answered, current']);
 assert.ok(text.includes('Selectable ${t.kind===')&&text.includes('from the original image')&&text.includes('Copy ${t.kind==='));
 for(const k of Object.keys(dict.strings))if(!composed.has(k)&&!text.includes(strip(k)))missing.push(k);
 for(const k of Object.keys(dict.patterns))if(!composed.has(k))for(const part of k.split(/\{\w+\}/).map(strip).filter(x=>x.length>2))if(!text.includes(part)&&!part.split(' ').every(w=>text.includes(w)))missing.push(k+' -> '+part);
 assert.deepEqual(missing,[]);
});
test('the build copies the dictionary and English visitors never load it',()=>{
 const built=JSON.parse(fs.readFileSync(new URL('../dist/data/i18n-es.json',import.meta.url),'utf8'));
 assert.deepEqual(built,dict);
 const html=read('src/index.html');
 assert.ok(!/i18n/.test(html.replace('data-no-translate','')),'index.html must not load the translator');
 assert.ok(/assets\/i18n\.js/.test(read('src/scripts/app.js')));
 assert.ok(/lang!=='es'/.test(read('src/scripts/app.js')));
 assert.ok(fs.existsSync(new URL('../dist/assets/i18n.js',import.meta.url)));
});
test('the language switch is a named, pressed-state button',()=>{
 const html=read('src/index.html'),button=html.match(/<button id="lang-toggle"[^>]*>/)[0];
 assert.match(button,/aria-pressed="false"/);
 assert.match(button,/aria-label="[^"]+"/);
 assert.ok(Object.hasOwn(dict.strings,'Spanish interface'));
 assert.match(read('src/styles/styles.css'),/\.lang-toggle\{[^}]*min-height:44px/);
 assert.match(read('src/styles/styles.css'),/\.lang-toggle:focus-visible\{outline/);
});

const SITE=' '+String.fromCharCode(183)+' Data Engineer Fieldnotes';
test('the page title translates its heading and keeps the site name',()=>{
 assert.equal(I.translateTitle('Every answer needs a reason.'+SITE,c),'Cada respuesta necesita una razón.'+SITE);
 assert.equal(I.translateTitle('Practice 03'+SITE,c),'Práctica 03'+SITE);
 assert.equal(I.translateTitle('Learn with understanding'+SITE,c),'Aprende con comprensión'+SITE);
 // A heading with a line break reaches the title without a space, so it is split by sentence.
 assert.equal(I.translateTitle('Learn the decisions.Then learn the services.'+SITE,c),'Aprende las decisiones. Después aprende los servicios.'+SITE);
 assert.equal(I.translateTitle('Better English.Clearer decisions.'+SITE,c),'Mejor inglés. Decisiones más claras.'+SITE);
 assert.ok(I.translateTitle('Every answer needs a reason.'+SITE,c).endsWith('Data Engineer Fieldnotes'));
});
test('a title with no entry, a partial entry or another shape stays as it was',()=>{
 for(const t of ['Dataflow windows and triggers'+SITE,'Every answer needs a reason. Something else'+SITE,'Every answer needs a reason.','Every answer needs a reason. | Data Engineer Fieldnotes',SITE,'']){
  assert.equal(I.translateTitle(t,c),t);
 }
});
test('lesson and practice chrome patterns fill their numbers and keep free text',()=>{
 const t=x=>I.translate(x,c),dot=' '+String.fromCharCode(183)+' ';
 assert.equal(t('Objective 1.2'+dot+'Core'+dot+'8 min'),'Objetivo 1.2'+dot+'Base'+dot+'8 min');
 assert.equal(t('~25% of the exam'+dot+'Security, reliability, portability and migration'),'~25% del examen'+dot+'Seguridad, confiabilidad, portabilidad y migración');
 assert.equal(t('DOMAIN 01'+dot+'OBJECTIVE 1.1'),'DOMINIO 01'+dot+'OBJETIVO 1.1');
 assert.equal(t('8 minute lesson'),'Lección de 8 minutos');
 assert.equal(t('Quick lesson, about 5 minutes'),'Lección rápida, de unos 5 minutos');
 assert.equal(t('Correct. Event time is the clock of the source.'),'Correcto. Event time is the clock of the source.');
 assert.equal(t('Not quite. Try again.'),'No del todo. Try again.');
 assert.equal(t('Checked 2026-11-08 against an official Google source'),'Revisado el 2026-11-08 con una fuente oficial de Google');
 assert.equal(t('What was checked: Pub/Sub ordering keys.'),'Qué se comprobó: Pub/Sub ordering keys.');
 assert.equal(t('Not yet verified against Google documentation.'),'Aún no se verificó con la documentación de Google.');
 for(const [en,es] of [['Play data flow','Reproducir el flujo de datos'],['Pause data flow','Pausar el flujo de datos'],['Resume data flow','Reanudar el flujo de datos']])assert.equal(t(en),es);
 assert.equal(t('Practice 07'),'Práctica 07');
 assert.equal(t('Imported #243'),'Importada #243');
 assert.equal(t('Applied'+dot+'evidence-linked'),'Aplicado'+dot+'con evidencia enlazada');
 assert.equal(t('Practice 07'+dot+'try a scenario →'),'Práctica 07'+dot+'prueba un escenario →');
 assert.equal(t('349 supplied questions'),'349 preguntas aportadas');
 assert.equal(t('12 questions'+dot+'page 2 of 30'),'12 preguntas'+dot+'página 2 de 30');
 assert.equal(t('Select exactly 2 options.'),'Selecciona exactamente 2 opciones.');
 assert.equal(t('Google Cloud'+dot+'Primary source'),'Google Cloud'+dot+'Fuente primaria');
 assert.equal(t('Apache Beam'+dot+'Community'+dot+'secondary'),'Apache Beam'+dot+'Comunidad'+dot+'secundaria');
});
test('workshop, English studio, sources and compare chrome patterns',()=>{
 const t=x=>I.translate(x,c),dot=' '+String.fromCharCode(183)+' ';
 assert.equal(t('3 / 5 steps'),'3 / 5 pasos');
 assert.equal(t('25 min'+dot+'open workshop →'),'25 min'+dot+'abrir el taller →');
 assert.equal(t('Wordbook'+dot+'161 terms'),'Cuaderno de palabras'+dot+'161 términos');
 assert.equal(t('Your saved terms'+dot+'card 2 of 9'),'Tus términos guardados'+dot+'tarjeta 2 de 9');
 assert.equal(t('Listen to throughput'),'Escuchar throughput');
 assert.equal(t('28 service cards'),'28 fichas de servicio');
 assert.equal(t('Link responded'+dot+'2026-11-01'+dot+'HTTP 200'),'Enlace disponible'+dot+'2026-11-01'+dot+'HTTP 200');
 assert.equal(t('Link availability unconfirmed'+dot+'2026-11-01'),'Disponibilidad del enlace sin confirmar'+dot+'2026-11-01');
 // The archive counts are written with thousands separators.
 assert.equal(t('12,345 chunks'+dot+'9,876 distinct exact texts'+dot+'2,469 repeated chunks'+dot+'1,204 source URLs.'),'12,345 fragmentos'+dot+'9,876 textos exactos distintos'+dot+'2,469 fragmentos repetidos'+dot+'1,204 URL de origen.');
 assert.equal(t('Original supplied image'+dot+'640 × 480 px. No missing content has been reconstructed.'),'Imagen original aportada'+dot+'640 × 480 px. No se reconstruyó ningún contenido que falte.');
 // Field labels and category names of the service cards.
 for(const [en,es] of [['Use when','Úsalo cuando'],['Strength','Fortaleza'],['Check the limitation','Revisa la limitación'],['Storage','Almacenamiento'],['Orchestration','Orquestación']])assert.equal(t(en),es);
});
test('covered routes include the chrome added in this stage and nothing unreviewed',()=>{
 for(const route of ['learn','practice','workshops','english','compare','architectures','sources','home','progress','missions','lab','exam'])assert.ok(I.COVERED.includes(route),route);
 for(const route of ['resources','search'])assert.ok(!I.COVERED.includes(route),route+' is not translated yet');
});
test('skipped regions are named and the Spanish-text region excludes the page root',()=>{
 const has=sel=>({closest:s=>s.split(',').includes(sel)?{}:null});
 assert.equal(I.regionOf(has('[data-english]')),'study content (own Spanish overlay or English) and question text');
 assert.equal(I.regionOf(has('pre')),'code');
 assert.equal(I.regionOf(has('svg')),'diagram text');
 assert.equal(I.regionOf(has('.lesson-info')),null);
 assert.equal(I.regionOf(has('.lesson-info'),true),'titles and names');
 assert.equal(I.regionOf(null),null);
 // The page root has lang="es" in Spanish mode, so the Spanish-text region must not match it.
 assert.ok(I.HARD.some(([,sel])=>sel.includes('[lang="es"]:not(html)')));
 assert.ok(!I.SKIP.split(',').includes('[lang="es"]'));
});
test('lesson titles, question text, service names and source titles never match a dictionary entry',()=>{
 const own=new Set(Object.keys(dict.strings)),names=[];
 const lessons=JSON.parse(read('content/lessons.json'));
 for(const l of lessons){names.push(l.title);for(const sec of l.sections||[])names.push(sec.title);}
 for(const w of JSON.parse(read('content/workshops.json')))names.push(w.title);
 for(const s of JSON.parse(read('content/services.json')))names.push(s.name);
 for(const q of JSON.parse(read('content/curated.json')))names.push(q.text);
 for(const s of Object.values(JSON.parse(read('content/sources.json'))))names.push(s.title);
 // Glossary terms are shown as names. Glossary meanings only appear inside skipped regions, where a broad pattern such as "Save {term}" never runs.
 for(const g of JSON.parse(read('content/glossary.json')))names.push(g.term);
 const imported=JSON.parse(read('content/imported.json'));
 for(const q of Array.isArray(imported.questions)?imported.questions:[])names.push(q.text);
 const clash=names.filter(n=>typeof n==='string'&&!own.has(n)&&I.translate(n,c)!==n);
 assert.deepEqual(clash.slice(0,10),[]);
 assert.ok(names.length>300);
});

test('no render template in src/scripts contains a noscript element',()=>{
 const dir=new URL('../src/scripts/',import.meta.url);
 for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.js')))assert.ok(!/<\/?noscript\b/i.test(fs.readFileSync(new URL(f,dir),'utf8')),f+' has a noscript element inside a script');
});
