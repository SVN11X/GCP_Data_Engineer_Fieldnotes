import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const lessons=JSON.parse(fs.readFileSync(new URL('../content/lessons.json',import.meta.url),'utf8'));
const blocks=lessons.filter(l=>l.block);
test('the correct quick-check choice is not always in the same position',()=>{
 const positions=blocks.map(l=>l.block.check.choices.findIndex(c=>c.correct===true));
 assert.ok(positions.every(p=>p>=0),'every block has a correct choice');
 const counts=[0,1,2].map(i=>positions.filter(p=>p===i).length);
 if(blocks.length>=3){
  for(const [i,n] of counts.entries())assert.ok(n>=1,'position '+i+' is never correct');
  assert.ok(Math.max(...counts)<=Math.ceil(blocks.length*0.5),'one position holds more than half of the correct answers: '+counts.join(','));
 }
});
