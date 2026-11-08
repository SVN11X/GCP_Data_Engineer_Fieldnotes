import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import '../dist/assets/core.js';
import '../dist/assets/loader.js';
import '../dist/assets/image-text.js';
const read=file=>JSON.parse(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'));
const pack=read('dist/data/study-pack.json'),source=read('content/imported.json'),preserved=read('content/imported-preservation.json'),I=globalThis.FieldImageText;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const img=file=>`<img src="assets/images/${file}" alt="Original source image" loading="lazy">`;
test('all supplied questions and all 25 original image bytes are preserved',()=>{
 assert.deepEqual(pack.questions.filter(q=>q.origin==='imported'),source.questions);
 assert.equal(source.questions.length,349);assert.equal(preserved.assets.length,25);
 for(const a of preserved.assets){const bytes=fs.readFileSync(new URL('../dist/assets/images/'+a.file,import.meta.url));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256,a.file);}
});
test('text-only image alternatives preserve source access and safely display SQL placeholders',()=>{
 const file='a947b8821c3294d68bf8.png',asset=pack.assets[file],html=I.render(img(file),pack.assets,escape);
 assert.ok(html.includes('&lt;country_name&gt;'));assert.ok(!html.includes('<country_name>'));
 assert.ok(html.includes('<pre'));assert.ok(html.includes('View original image'));assert.ok(html.includes('src="assets/images/'+file+'"'));
 assert.equal(I.copyText(asset.transcription),asset.transcription.text);assert.equal(I.textForHTML(img(file),pack.assets),asset.transcription.text);
 assert.ok(I.copyText(asset.transcription).includes("username = '<username>'"));
 const index=read('dist/data/search-index.json');assert.ok(index.documents.some(d=>d.id==='imp-248'&&d.search.includes('vm02781')));
});
test('real diagrams stay visual and tiny placeholders are retained without invented text',()=>{
 const graphic=I.render(img('a7c13dca0a5fbb46c6ee.jpg'),pack.assets,escape),tiny=I.render(img('dc345977d1d2c299d601.png'),pack.assets,escape);
 assert.ok(graphic.includes('data-action="open-image"'));assert.ok(!graphic.includes('Selectable text'));
 assert.ok(tiny.includes('9 × 6'));assert.ok(tiny.includes('assets/images/dc345977d1d2c299d601.png'));assert.ok(!tiny.includes('<pre'));
 assert.equal(Object.values(pack.assets).filter(a=>a.transcription?.kind==='text').length,10);
});
test('the readable table preserves grouped IDs and only the eleven visible component rows',()=>{
 const file='e2f4b76a2f2a21b880f3.png',t=pack.assets[file].transcription,html=I.render(img(file),pack.assets,escape),text=I.copyText(t);
 assert.equal(t.groups.length,3);assert.equal(t.groups.flatMap(g=>g.components).length,11);
 assert.ok(html.includes('scope="rowgroup" rowspan="4"'));assert.ok(html.includes('scope="rowgroup" rowspan="3"'));
 assert.equal((html.match(/vm18130/g)||[]).length,1);assert.ok(text.includes('components.name\tcomponents.qty'));
 assert.deepEqual(t.groups[2].components,[['vcpu','8'],['memory','8'],['boot_disk','10']]);
});
test('opening the bank catalog after an image question does not erase its loaded choices',async()=>{
 const ctx={};vm.runInNewContext(fs.readFileSync(new URL('../dist/assets/data.js',import.meta.url),'utf8'),ctx);
 const data=JSON.parse(JSON.stringify(ctx.FIELDNOTES_DATA)),q=data.questions.find(q=>q.id==='imp-243'),calls=[];
 const loader=globalThis.FieldLoader.create(data,async url=>{calls.push(url);return {ok:true,json:async()=>read('dist/data/'+new URL(url).pathname.split('/data/')[1])};},'https://example.test/GCP_Data_Engineer_Fieldnotes/');
 await loader.ensure('practice','imp-243');assert.equal(q.choices.length,4);const full=JSON.stringify(q.choices);
 await loader.ensure('practice');await loader.ensure('practice','imp-243');assert.equal(q.choices.length,4);assert.equal(JSON.stringify(q.choices),full);assert.equal(calls.length,2);
 assert.ok(calls[0].includes('/imported/domain-4.json'));assert.ok(q.html.includes('BigQueryML'));
});
test('progress from the prior delivery restores supplied-question bookmarks and attempts without duplication',()=>{
 const input={version:1,bookmarks:['lab-1'],retired:{bookmarks:['imp-243','imp-243'],attempts:[{id:'imp-9',selected:['A'],at:1,correct:false,verified:true}]}};
 const args=[pack.lessons.map(l=>l.id),pack.questions.map(q=>q.id),pack.glossary.map(g=>g.id),pack.workshops];
 const restored=globalThis.FieldCore.validateProgress(input,...args);
 assert.deepEqual(restored.bookmarks,['lab-1','imp-243']);assert.equal(restored.attempts.length,1);assert.equal(restored.attempts[0].id,'imp-9');assert.equal(restored.attempts[0].verified,false);assert.deepEqual(restored.retired,{bookmarks:[],attempts:[]});
 assert.deepEqual(globalThis.FieldCore.validateProgress(restored,...args),restored);
});
