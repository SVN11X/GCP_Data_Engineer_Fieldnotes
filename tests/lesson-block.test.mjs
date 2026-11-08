import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../dist/assets/lesson-block.js';
const L=globalThis.FieldLessonBlock;
const lessons=JSON.parse(fs.readFileSync(new URL('../content/lessons.json',import.meta.url),'utf8'));
const withBlock=lessons.filter(l=>l.block);
test('blocks cover four domain 1, eight domain 2 and ten domain 3 lessons only',()=>{
 assert.equal(withBlock.length,22);
 assert.equal(withBlock.filter(l=>l.domain===1).length,4);
 assert.equal(withBlock.filter(l=>l.domain===2).length,8);
 assert.equal(withBlock.filter(l=>l.domain===3).length,10);
 assert.ok(withBlock.every(l=>l.domain<=3));
});
test('every block has valid minutes, a connected diagram, a key fact and a three-choice check',()=>{
 for(const l of withBlock){
  const b=l.block,ids=new Set(b.diagram.nodes.map(n=>n.id));
  assert.ok(Number.isInteger(b.minutes)&&b.minutes>=2&&b.minutes<=5,l.id);
  assert.ok(b.diagram.nodes.length>=2&&ids.size===b.diagram.nodes.length,l.id);
  assert.ok(b.diagram.edges.every(x=>ids.has(x.from)&&ids.has(x.to)),l.id);
  assert.ok(b.diagram.title&&b.diagram.description&&b.diagram.width<=320,l.id);
  assert.ok(b.keyFact.trim().length>0,l.id);
  assert.equal(b.check.choices.length,3,l.id);
  assert.equal(b.check.choices.filter(c=>c.correct===true).length,1,l.id);
 }
});
test('rendering shows diagram, key fact and check, and nothing for lessons without a block',()=>{
 const html=L.render(withBlock[0]);
 assert.ok(html.indexOf('<svg')<html.indexOf('key-fact')&&html.indexOf('key-fact')<html.indexOf('lb-choice'));
 assert.match(html,/role="img"/);
 assert.equal((html.match(/data-lb-choice=/g)||[]).length,3);
 assert.equal(L.render(lessons.find(l=>!l.block)),'');
 assert.equal(L.render(null),'');
});
test('answers explain right and wrong choices and are pure',()=>{
 const l=withBlock[0],before=JSON.stringify(l);
 const right=l.block.check.choices.findIndex(c=>c.correct);
 assert.equal(L.answer(l,right).correct,true);
 assert.match(L.answer(l,right).text,/^Correct\./);
 const wrong=L.answer(l,(right+1)%3);
 assert.equal(wrong.correct,false);assert.match(wrong.text,/^Not quite\./);
 assert.equal(L.answer(l,9),null);
 assert.equal(JSON.stringify(l),before);
});
test('lesson text is escaped in the rendered block',()=>{
 const l={id:'x',block:{minutes:2,diagram:{title:'<t>',description:'d',width:280,height:100,nodes:[{id:'a',lines:['<b>'],x:0,y:0,w:100,h:40},{id:'b',lines:['c'],x:0,y:60,w:100,h:40}],edges:[{from:'a',to:'b'}]},keyFact:'<i>',check:{question:'q',choices:[{text:'a',correct:true,why:'w'},{text:'b',why:'w'},{text:'c',why:'w'}]}}};
 const html=L.render(l);
 assert.ok(!html.includes('<b>')&&!html.includes('<i>')&&!html.includes('<t>'));
});
test('data flow plan stays under 5 seconds and is off under reduced motion',()=>{
 const p=L.flowPlan(false);
 assert.equal(p.animate,true);
 assert.equal(p.passes,3);
 assert.ok(p.totalMs<5000&&p.totalMs===L.FLOW.passMs*L.FLOW.passes);
 assert.deepEqual(L.flowPlan(true),{animate:false,passes:0,totalMs:0,control:false});
});
test('data flow states toggle, stop at the end and never move under reduced motion',()=>{
 assert.equal(L.flowNext('playing','toggle',false),'paused');
 assert.equal(L.flowNext('paused','toggle',false),'playing');
 assert.equal(L.flowNext('playing','end',false),'done');
 assert.equal(L.flowNext('playing','toggle',true),'done');
 assert.equal(L.flowLabel('playing'),'Pause data flow');
 assert.equal(L.flowLabel('done'),'Play data flow');
});
test('render ships a flow button and one resting dot per edge, static by default',()=>{
 const l=withBlock[0],html=L.render(l);
 assert.match(html,/data-lb-flow[^>]*>Play data flow</);
 assert.equal((html.match(/class="lb-dot"/g)||[]).length,l.block.diagram.edges.length);
 assert.match(html,/data-flow="done"/);
});
