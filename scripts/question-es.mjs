/* Spanish overlays for the 124 authored questions: source of truth is content/es/questions-d<N>.json, one file per domain.
   Shape: { "<questionId>": { "<path>": { "es": "...", "src": "<12 hex of sha256(English)>" } } }.
   Paths come from src/scripts/question-es.js, the same module the browser uses. The rules match scripts/lesson-es.mjs, plus:
   only strings are translatable (text, choice texts, choice reasons, explanation), so answers, letters, order and flags cannot change. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import '../src/scripts/lesson-es.js';
import '../src/scripts/question-es.js';
import {sha12,protectedNames,numbers,termRe} from './lesson-es.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const questionPaths=q=>globalThis.FieldQuestionEs.paths(q);
export const overlayFile=domain=>path.join(root,'content','es','questions-d'+domain+'.json');
export const readOverlay=domain=>fs.existsSync(overlayFile(domain))?JSON.parse(fs.readFileSync(overlayFile(domain),'utf8')):null;
/* Domains that have a question overlay file. */
export const overlayDomains=()=>fs.existsSync(path.join(root,'content','es'))?fs.readdirSync(path.join(root,'content','es')).map(f=>/^questions-d(\d+)\.json$/.exec(f)?.[1]).filter(Boolean).map(Number).sort():[];
/* The English authored questions of one domain, in file order. */
export const englishQuestions=domain=>JSON.parse(fs.readFileSync(path.join(root,'content','curated.json'),'utf8')).filter(q=>q.origin==='authored'&&q.domain===domain);
/* Code-like tokens (identifiers with an underscore, function calls, urls) and SQL-style upper case names must stay as they are. */
const tokens=s=>[...new Set(String(s).match(/https?:\/\/[^\s)]+|gs:\/\/[^\s)]+|\b[A-Za-z]+(?:_[A-Za-z0-9]+)+\b|\b\w+\(\)/g)||[])];
const ALLOWED=/^(text|explanation|choices\.\d+\.(text|why))$/;
/* Returns a list of error strings. Empty means valid. questions are the English authored questions of ONE domain. */
export function validateOverlay(overlay,questions,names=protectedNames()){
 const errors=[],byId=new Map(questions.map(q=>[q.id,q]));
 if(!overlay||typeof overlay!=='object'||Array.isArray(overlay))return ['overlay must be an object keyed by question id'];
 for(const [id,entries] of Object.entries(overlay)){
  const q=byId.get(id);
  if(!q){errors.push(id+': unknown authored question id for this domain');continue;}
  const english=new Map(questionPaths(q));
  for(const [p,x] of Object.entries(entries||{})){
   const where=id+':'+p;
   if(!ALLOWED.test(p)){errors.push(where+': only text, choice text, choice reason and explanation can be translated');continue;}
   if(!english.has(p)){errors.push(where+': path does not exist in the English question');continue;}
   const en=english.get(p);
   if(!x||typeof x.es!=='string'||!x.es.trim()){errors.push(where+': empty Spanish');continue;}
   if(Object.keys(x).some(k=>k!=='es'&&k!=='src'))errors.push(where+': unexpected field in entry');
   if(x.src!==sha12(en)){errors.push(where+': stale translation (English changed, hash '+x.src+' is not '+sha12(en)+')');continue;}
   for(const t of names)if(termRe(t).test(en)&&!termRe(t).test(x.es))errors.push(where+': protected name "'+t+'" missing in Spanish');
   if(numbers(en)!==numbers(x.es))errors.push(where+': numbers differ (English '+numbers(en)+', Spanish '+numbers(x.es)+')');
   for(const t of tokens(en))if(!x.es.includes(t))errors.push(where+': code token "'+t+'" changed or missing in Spanish');
   if(/[;–—]/.test(x.es))errors.push(where+': Spanish text has a semicolon or a long dash');
   if(/[<>&]/.test(x.es)&&!/[<>&]/.test(en))errors.push(where+': Spanish text adds markup characters');
  }
  /* All choices of a question are translated, or none: same number of choices, same order. */
  for(const k of ['text','why']){
   const total=q.choices.filter(c=>k==='text'||c.why).length,done=q.choices.filter((c,i)=>entries?.['choices.'+i+'.'+k]).length;
   if(done&&done!==total)errors.push(id+': has '+total+' choice '+(k==='text'?'texts':'reasons')+' but '+done+' translated');
  }
 }
 return errors;
}
/* Per path state: ok, missing or stale. */
export function status(overlay,questions){
 const out=[];
 for(const q of questions)for(const [p,en] of questionPaths(q)){
  const x=overlay?.[q.id]?.[p],src=sha12(en);
  out.push({id:q.id,path:p,en,src,state:!x||!x.es?'missing':x.src===src?'ok':'stale'});
 }
 return out;
}
export const coverage=(overlay,questions)=>{const s=status(overlay,questions);return {total:s.length,ok:s.filter(x=>x.state==='ok').length};};
/* Adds plain translations ({id:{path:"es"}}) to an overlay, stamping each with the hash of the current English. */
export function merge(overlay,plain,questions){
 const out=structuredClone(overlay||{}),byId=new Map(questions.map(q=>[q.id,new Map(questionPaths(q))]));
 for(const [id,entries] of Object.entries(plain)){
  const english=byId.get(id);if(!english)throw new Error('Unknown question id '+id);
  out[id]=out[id]||{};
  for(const [p,es] of Object.entries(entries)){
   if(!english.has(p))throw new Error('Unknown path '+id+':'+p);
   out[id][p]={es,src:sha12(english.get(p))};
  }
 }
 const order=questions.map(q=>q.id).filter(id=>out[id]);
 const sorted={};
 for(const id of order)sorted[id]=Object.fromEntries([...byId.get(id).keys()].filter(p=>out[id][p]).map(p=>[p,out[id][p]]));
 return sorted;
}
