/* Spanish overlays for services, comparisons, workshops and architecture patterns.
   Source of truth: content/es/<kind>.json, one file per kind. Shape: { "<itemId>": { "<path>": { "es": "...", "src": "<12 hex of sha256(English)>" } } }.
   Paths come from src/scripts/content-es.js, the same module the browser uses. The rules match scripts/lesson-es.mjs. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import '../src/scripts/lesson-es.js';
import '../src/scripts/content-es.js';
import '../src/scripts/compare.js';
import {sha12,protectedNames,numbers,termRe} from './lesson-es.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const KINDS=globalThis.FieldContentEs.KINDS;
export const contentPaths=(kind,item)=>globalThis.FieldContentEs.paths(kind,item);
export const overlayFile=kind=>path.join(root,'content','es',kind+'.json');
export const readOverlay=kind=>fs.existsSync(overlayFile(kind))?JSON.parse(fs.readFileSync(overlayFile(kind),'utf8')):null;
/* Kinds that have an overlay file. */
export const overlayKinds=()=>KINDS.filter(k=>fs.existsSync(overlayFile(k)));
const readContent=n=>JSON.parse(fs.readFileSync(path.join(root,'content',n+'.json'),'utf8'));
/* The English items of a kind. Each comparison carries the note of its latest verification entry as verification.note, the same entry its page shows. */
export function englishItems(kind,log=readContent('verification-log')){
 /* The resources page is one item. The loader links the source audit under "audit" at run time, so the same shape is built here. */
 if(kind==='resources'){const a=readContent('source-audit');return [{id:'resources',...readContent('resources'),audit:{method:a.method,scope:a.scope}}];}
 const items=readContent(kind);
 if(kind==='comparisons')for(const c of items){const entry=globalThis.FieldCompare.entryFor(log,c.id);if(entry&&entry.note)c.verification={note:entry.note};}
 return items;
}
/* "options.0.chooseWhen" becomes "options.*.chooseWhen". A path with a star belongs to a list of the item. */
const shape=p=>p.replace(/\.\d+(?=\.|$)/g,'.*');
/* Returns a list of error strings. Empty means valid. */
export function validateContentOverlay(kind,overlay,items,names=protectedNames()){
 const errors=[],byId=new Map(items.map(x=>[x.id,x]));
 if(!overlay||typeof overlay!=='object'||Array.isArray(overlay))return ['overlay must be an object keyed by item id'];
 for(const [id,entries] of Object.entries(overlay)){
  const item=byId.get(id);
  if(!item){errors.push(id+': unknown '+kind+' id');continue;}
  const english=new Map(contentPaths(kind,item));
  for(const [p,x] of Object.entries(entries||{})){
   const where=id+':'+p;
   if(!english.has(p)){errors.push(where+': path does not exist in the English '+kind);continue;}
   const en=english.get(p);
   if(!x||typeof x.es!=='string'||!x.es.trim()){errors.push(where+': empty Spanish');continue;}
   if(x.src!==sha12(en)){errors.push(where+': stale translation (English changed, hash '+x.src+' is not '+sha12(en)+')');continue;}
   for(const t of names)if(termRe(t).test(en)&&!termRe(t).test(x.es))errors.push(where+': protected name "'+t+'" missing in Spanish');
   if(numbers(en)!==numbers(x.es))errors.push(where+': numbers differ (English '+numbers(en)+', Spanish '+numbers(x.es)+')');
  }
  /* Lists (options, steps, nodes, edges, limitations) keep their length: a list field is translated for every entry or for none. */
  const groups=new Map();
  for(const p of english.keys()){const s=shape(p);if(s.includes('*')){const g=groups.get(s)||{total:0,done:0};g.total++;if(entries&&entries[p])g.done++;groups.set(s,g);}}
  for(const [s,g] of groups)if(g.done&&g.done!==g.total)errors.push(id+': '+s+' has '+g.total+' entries but '+g.done+' translated');
 }
 return errors;
}
/* Per path state: ok, missing or stale. */
export function status(kind,overlay,items){
 const out=[];
 for(const item of items)for(const [p,en] of contentPaths(kind,item)){
  const x=overlay?.[item.id]?.[p],src=sha12(en);
  out.push({id:item.id,path:p,en,src,state:!x||!x.es?'missing':x.src===src?'ok':'stale'});
 }
 return out;
}
export const coverage=(kind,overlay,items)=>{const s=status(kind,overlay,items);return {total:s.length,ok:s.filter(x=>x.state==='ok').length};};
/* Adds plain translations ({id:{path:"es"}}) to an overlay, stamping each with the hash of the current English. */
export function merge(kind,overlay,plain,items){
 const out=structuredClone(overlay||{}),byId=new Map(items.map(x=>[x.id,new Map(contentPaths(kind,x))]));
 for(const [id,entries] of Object.entries(plain)){
  const english=byId.get(id);if(!english)throw new Error('Unknown '+kind+' id '+id);
  out[id]=out[id]||{};
  for(const [p,es] of Object.entries(entries)){
   if(!english.has(p))throw new Error('Unknown path '+id+':'+p);
   out[id][p]={es,src:sha12(english.get(p))};
  }
 }
 for(const id of Object.keys(out)){const order=[...byId.get(id).keys()];out[id]=Object.fromEntries(order.filter(p=>out[id][p]).map(p=>[p,out[id][p]]));}
 return out;
}
