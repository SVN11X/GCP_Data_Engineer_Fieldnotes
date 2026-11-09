/* Spanish overlays for the 349 imported questions: source of truth is content/es/imported-d<N>.json, one file per domain.
   Shape: { "imp-<number>": { "<path>": { "es": "...", "src": "<12 hex of sha256(English)>" } } }.
   Paths come from src/scripts/imported-es.js, the same module the browser uses. The rules match scripts/question-es.mjs, plus:
   the html of a translated string must have the same tag sequence with the same attributes (so the same <img> src values), identical code and pre content,
   and the same markup entities. content/imported.json is only read, never written. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import '../src/scripts/lesson-es.js';
import '../src/scripts/imported-es.js';
import {sha12,protectedNames,numbers,termRe} from './lesson-es.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const IE=()=>globalThis.FieldImportedEs;
export const importedPaths=q=>IE().paths(q);
export const overlayFile=domain=>path.join(root,'content','es','imported-d'+domain+'.json');
export const readOverlay=domain=>fs.existsSync(overlayFile(domain))?JSON.parse(fs.readFileSync(overlayFile(domain),'utf8')):null;
/* Domains that have an imported overlay file. */
export const overlayDomains=()=>fs.existsSync(path.join(root,'content','es'))?fs.readdirSync(path.join(root,'content','es')).map(f=>/^imported-d(\d+)\.json$/.exec(f)?.[1]).filter(Boolean).map(Number).sort():[];
/* The English imported questions of one domain, in file order. */
export const englishImported=domain=>JSON.parse(fs.readFileSync(path.join(root,'content','imported.json'),'utf8')).questions.filter(q=>q.domain===domain);
const isHtml=p=>/(^|\.)html$/.test(p);
const ALLOWED=/^(html|choices\.\d+\.html|sourceExplanation|explanation|reviewNote|issues\.\d+)$/;
const tagsOf=h=>String(h).match(/<[^>]*>/g)||[];
const entitiesOf=h=>String(h).match(/&[#\w]+;/g)||[];
/* The text of an html string without tags and entities, for number, token and name checks. */
const stripped=h=>String(h).replace(/<[^>]*>/g,' ').replace(/&[#\w]+;/g,' ');
const codeBlocks=h=>String(h).match(/<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/g)||[];
/* Code-like tokens (identifiers with an underscore, function calls, urls) must stay as they are. */
const tokens=s=>[...new Set(String(s).match(/https?:\/\/[^\s)]+|gs:\/\/[^\s)]+|\b[A-Za-z]+(?:_[A-Za-z0-9]+)+\b|\b\w+\(\)/g)||[])];
const count=(list,x)=>list.filter(y=>y===x).length;
/* Returns a list of error strings. Empty means valid. questions are the English imported questions of ONE domain. */
export function validateOverlay(overlay,questions,names=protectedNames()){
 const errors=[],byId=new Map(questions.map(q=>[q.id,q]));
 if(!overlay||typeof overlay!=='object'||Array.isArray(overlay))return ['overlay must be an object keyed by question id'];
 for(const [id,entries] of Object.entries(overlay)){
  const q=byId.get(id);
  if(!q){errors.push(id+': unknown imported question id for this domain');continue;}
  const english=new Map(importedPaths(q));
  for(const [p,x] of Object.entries(entries||{})){
   const where=id+':'+p;
   if(!ALLOWED.test(p)){errors.push(where+': only the html, choice html, source explanation, explanation, review note and issues can be translated');continue;}
   if(!english.has(p)){errors.push(where+': path does not exist in the English question');continue;}
   const en=english.get(p);
   if(!x||typeof x.es!=='string'||!x.es.trim()){errors.push(where+': empty Spanish');continue;}
   if(Object.keys(x).some(k=>k!=='es'&&k!=='src'))errors.push(where+': unexpected field in entry');
   if(x.src!==sha12(en)){errors.push(where+': stale translation (English changed, hash '+x.src+' is not '+sha12(en)+')');continue;}
   const es=x.es,enText=isHtml(p)?stripped(en):en,esText=isHtml(p)?stripped(es):es;
   for(const t of names)if(termRe(t).test(enText)&&!termRe(t).test(esText))errors.push(where+': protected name "'+t+'" missing in Spanish');
   if(numbers(enText)!==numbers(esText))errors.push(where+': numbers differ (English '+numbers(enText)+', Spanish '+numbers(esText)+')');
   for(const t of tokens(enText))if(!esText.includes(t))errors.push(where+': code token "'+t+'" changed or missing in Spanish');
   if(/[;–—]/.test(isHtml(p)?es.replace(/&[#\w]+;/g,''):es))errors.push(where+': Spanish text has a semicolon or a long dash');
   if(isHtml(p)){
    const a=tagsOf(en),b=tagsOf(es);
    if(JSON.stringify(a)!==JSON.stringify(b))errors.push(where+': html tags differ from the English (same tags, attributes and order are required)');
    if(JSON.stringify(codeBlocks(en))!==JSON.stringify(codeBlocks(es)))errors.push(where+': code or pre content differs from the English');
    const rest=es.replace(/<[^>]*>/g,'');
    if(/[<>]/.test(rest)||/&(?![#\w]+;)/.test(rest))errors.push(where+': Spanish html has a raw <, > or & outside tags and entities');
    for(const ent of ['&lt;','&gt;','&amp;'])if(count(entitiesOf(en),ent)!==count(entitiesOf(es),ent))errors.push(where+': entity '+ent+' count differs from the English');
    if(entitiesOf(es).some(e=>!['&lt;','&gt;','&amp;','&quot;','&#x27;'].includes(e)))errors.push(where+': Spanish html uses an entity the English does not use');
   }else if(/[<>&]/.test(es)&&!/[<>&]/.test(en))errors.push(where+': Spanish text adds markup characters');
  }
  /* All choices of a question are translated, or none: same number of choices, same order. */
  const total=q.choices.filter(c=>c.html).length,done=q.choices.filter((c,i)=>entries?.['choices.'+i+'.html']).length;
  if(done&&done!==total)errors.push(id+': has '+total+' choice html strings but '+done+' translated');
  if(done&&!entries.html)errors.push(id+': choices are translated but the question html is not');
 }
 return errors;
}
/* Per path state: ok, missing or stale. */
export function status(overlay,questions){
 const out=[];
 for(const q of questions)for(const [p,en] of importedPaths(q)){
  const x=overlay?.[q.id]?.[p],src=sha12(en);
  out.push({id:q.id,path:p,en,src,state:!x||!x.es?'missing':x.src===src?'ok':'stale'});
 }
 return out;
}
export const coverage=(overlay,questions)=>{const s=status(overlay,questions);return {total:s.length,ok:s.filter(x=>x.state==='ok').length};};
/* Adds plain translations ({id:{path:"es"}}) to an overlay, stamping each with the hash of the current English. */
export function merge(overlay,plain,questions){
 const out=structuredClone(overlay||{}),byId=new Map(questions.map(q=>[q.id,new Map(importedPaths(q))]));
 for(const [id,entries] of Object.entries(plain)){
  const english=byId.get(id);if(!english)throw new Error('Unknown question id '+id);
  out[id]=out[id]||{};
  for(const [p,es] of Object.entries(entries)){
   if(!english.has(p))throw new Error('Unknown path '+id+':'+p);
   out[id][p]={es,src:sha12(english.get(p))};
  }
 }
 const sorted={};
 for(const q of questions)if(out[q.id])sorted[q.id]=Object.fromEntries([...byId.get(q.id).keys()].filter(p=>out[q.id][p]).map(p=>[p,out[q.id][p]]));
 return sorted;
}
