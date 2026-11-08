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
 assert.ok(Object.keys(dict.strings).length>250);
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
 const source=files.map(read).join('\n')+read('content/domains.json'),clean=s=>s.replace(/&amp;/g,'&');
 const text=clean(source),strip=x=>x.replace(/^[←→:·\s]+|[←→:·\s]+$/g,''),missing=[];
 // Arrows and some labels are joined with a variable in the source, so edges are trimmed. Pattern pieces may also be split across several literals.
 for(const k of Object.keys(dict.strings))if(!text.includes(strip(k)))missing.push(k);
 for(const k of Object.keys(dict.patterns))for(const part of k.split(/\{\w+\}/).map(strip).filter(x=>x.length>2))if(!text.includes(part)&&!part.split(' ').every(w=>text.includes(w)))missing.push(k+' -> '+part);
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
