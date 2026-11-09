import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import '../dist/assets/core.js';
const C=globalThis.FieldCore,pack=JSON.parse(fs.readFileSync(new URL('../dist/data/study-pack.json',import.meta.url),'utf8'));
test('focus mode uses its own storage key and parses only an exact on value',()=>{
 assert.equal(C.FOCUS_KEY,'data-engineer-fieldnotes.focus.v1');
 assert.notEqual(C.FOCUS_KEY,'data-engineer-fieldnotes.v1');
 assert.equal(C.parseFocusPreference('1'),true);
 for(const bad of [null,undefined,'','0','true','on','{}',1,{}])assert.equal(C.parseFocusPreference(bad),false);
 assert.equal(C.serializeFocusPreference(true),'1');
 assert.equal(C.serializeFocusPreference(false),'0');
 assert.equal(C.serializeFocusPreference('yes'),'0');
});
test('toggling focus mode flips the value and treats anything but true as off',()=>{
 assert.equal(C.toggleFocus(false),true);
 assert.equal(C.toggleFocus(true),false);
 assert.equal(C.toggleFocus(undefined),true);
 assert.equal(C.toggleFocus('1'),true);
});
test('focus progress is clamped between zero and one and survives bad input',()=>{
 assert.equal(C.focusProgress(0,4),0);
 assert.equal(C.focusProgress(2,4),0.5);
 assert.equal(C.focusProgress(9,4),1);
 assert.equal(C.focusProgress(-3,4),0);
 for(const [d,t] of [[1,0],[1,-2],[NaN,4],[1,NaN],[Infinity,4],['x',4],[undefined,undefined]])assert.equal(C.focusProgress(d,t),0);
});
test('the f shortcut ignores typing targets, modifier keys and other keys',()=>{
 const key=(over)=>({key:'f',ctrlKey:false,metaKey:false,altKey:false,shiftKey:false,target:{tagName:'BODY'},...over});
 assert.equal(C.isFocusShortcut(key()),true);
 assert.equal(C.isFocusShortcut(key({key:'g'})),false);
 assert.equal(C.isFocusShortcut(key({ctrlKey:true})),false);
 assert.equal(C.isFocusShortcut(key({metaKey:true})),false);
 assert.equal(C.isFocusShortcut(key({altKey:true})),false);
 assert.equal(C.isFocusShortcut(key({shiftKey:true})),false);
 for(const tagName of ['INPUT','TEXTAREA','SELECT'])assert.equal(C.isFocusShortcut(key({target:{tagName}})),false);
 assert.equal(C.isFocusShortcut(key({target:{tagName:'DIV',isContentEditable:true}})),false);
 assert.equal(C.isFocusShortcut(null),false);
});
test('saved progress from before focus mode loads unchanged and gains no focus key',()=>{
 const old={version:1,completed:['least-privilege'],bookmarks:[],attempts:[],vocab:{},english:true,exam:null,labProgress:{},reviewTopics:[],briefed:['streaming-semantics'],missionCompletions:[],focus:null};
 const ids=[pack.lessons.map(l=>l.id),pack.questions.map(q=>q.id),pack.glossary.map(g=>g.id),pack.workshops];
 const restored=C.validateProgress(old,...ids);
 assert.deepEqual(restored.completed,['least-privilege']);
 assert.deepEqual(restored.briefed,['streaming-semantics']);
 assert.equal(restored.english,true);
 assert.equal('focusMode' in restored,false);
 assert.deepEqual(C.validateProgress(restored,...ids),restored);
});
