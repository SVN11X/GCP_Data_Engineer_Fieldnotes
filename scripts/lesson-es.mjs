/* Spanish lesson overlays: source of truth is content/es/lessons-d<N>.json, one file per domain.
   Shape: { "<lessonId>": { "<path>": { "es": "...", "src": "<12 hex of sha256(English)>" } } }.
   Paths come from src/scripts/lesson-es.js, the same module the browser uses. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import '../src/scripts/lesson-es.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const sha12=text=>crypto.createHash('sha256').update(String(text)).digest('hex').slice(0,12);
export const lessonPaths=lesson=>globalThis.FieldLessonEs.paths(lesson);
/* Product names that must survive translation unchanged. Checked only when the English string contains them. */
const PRODUCTS=['BigQuery','Dataflow','Pub/Sub','Cloud Storage','Bigtable','Spanner','Dataproc','Cloud Composer','Data Fusion','Dataform','Looker','Vertex AI','Cloud Scheduler','Dataplex','Managed Service for Apache Airflow','Managed Service for Apache Spark','Managed Kafka','Cloud SQL','Datastream','Database Migration Service','Storage Transfer Service','Transfer Appliance','Cloud Run','Cloud KMS','Cloud Logging','Cloud Monitoring','Cloud Functions','Cloud Build','Compute Engine','Google Kubernetes Engine','Dataprep','Datastore','Firestore','Memorystore','Workflows','Eventarc','Analytics Hub','BigLake','Apache Beam','Apache Kafka','Apache Spark','Apache Airflow','Terraform','IAM','VPC Service Controls','Secret Manager','Security Command Center','Data Catalog','Cloud DLP','Sensitive Data Protection','Cloud Identity','Workload Identity Federation'];
const protectedNames=()=>{
 const dict=JSON.parse(fs.readFileSync(path.join(root,'content','i18n-es.json'),'utf8'));
 return [...new Set([...(dict.protected||[]).filter(t=>t!=='fieldnotes'&&t!=='Google LLC'),...PRODUCTS])];
};
const numbers=s=>(String(s).match(/\d+(?:[.,]\d+)?/g)||[]).sort().join('|');
const termRe=t=>new RegExp('(?<![\\w])'+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\w])');
/* Returns a list of error strings. Empty means valid. lessons are the English lessons of ONE domain. */
export function validateOverlay(overlay,lessons,names=protectedNames()){
 const errors=[],byId=new Map(lessons.map(l=>[l.id,l]));
 if(!overlay||typeof overlay!=='object'||Array.isArray(overlay))return ['overlay must be an object keyed by lesson id'];
 for(const [id,entries] of Object.entries(overlay)){
  const lesson=byId.get(id);
  if(!lesson){errors.push(id+': unknown lesson id for this domain');continue;}
  const english=new Map(lessonPaths(lesson));
  for(const [p,x] of Object.entries(entries||{})){
   const where=id+':'+p;
   if(!english.has(p)){errors.push(where+': path does not exist in the English lesson');continue;}
   const en=english.get(p);
   if(!x||typeof x.es!=='string'||!x.es.trim()){errors.push(where+': empty Spanish');continue;}
   if(x.src!==sha12(en)){errors.push(where+': stale translation (English changed, hash '+x.src+' is not '+sha12(en)+')');continue;}
   for(const t of names)if(termRe(t).test(en)&&!termRe(t).test(x.es))errors.push(where+': protected name "'+t+'" missing in Spanish');
   if(numbers(en)!==numbers(x.es))errors.push(where+': numbers differ (English '+numbers(en)+', Spanish '+numbers(x.es)+')');
  }
  const choices=lesson.block?.check?.choices;
  if(choices&&Object.keys(entries||{}).some(p=>p.startsWith('block.check.choices.'))){
   const done=choices.filter((_,i)=>entries['block.check.choices.'+i+'.text']).length;
   if(done!==choices.length)errors.push(id+': quick check has '+choices.length+' choices but '+done+' translated texts');
   const copy=structuredClone(lesson);
   for(const [p,x] of Object.entries(entries))if(english.has(p)&&x?.es)globalThis.FieldLessonEs.setAt(copy,p,x.es);
   if(copy.block.check.choices.length!==choices.length||copy.block.check.choices.some((c,i)=>c.correct!==choices[i].correct))errors.push(id+': correct choice moved');
  }
 }
 return errors;
}
/* Per path state: ok, missing or stale. */
export function status(overlay,lessons){
 const out=[];
 for(const lesson of lessons)for(const [p,en] of lessonPaths(lesson)){
  const x=overlay?.[lesson.id]?.[p],src=sha12(en);
  out.push({id:lesson.id,path:p,en,src,state:!x||!x.es?'missing':x.src===src?'ok':'stale'});
 }
 return out;
}
export const coverage=(overlay,lessons)=>{const s=status(overlay,lessons);return {total:s.length,ok:s.filter(x=>x.state==='ok').length};};
export const overlayFile=domain=>path.join(root,'content','es','lessons-d'+domain+'.json');
export function readOverlay(domain){const f=overlayFile(domain);return fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):null;}
export const englishLessons=domain=>JSON.parse(fs.readFileSync(path.join(root,'content','lessons.json'),'utf8')).filter(l=>l.domain===domain);
/* Domains that have an overlay file. */
export const overlayDomains=()=>fs.existsSync(path.join(root,'content','es'))?fs.readdirSync(path.join(root,'content','es')).map(f=>/^lessons-d(\d+)\.json$/.exec(f)?.[1]).filter(Boolean).map(Number).sort():[];
/* Adds plain translations ({id:{path:"es"}}) to an overlay, stamping each with the hash of the current English. */
export function merge(overlay,plain,lessons){
 const out=structuredClone(overlay||{}),byId=new Map(lessons.map(l=>[l.id,new Map(lessonPaths(l))]));
 for(const [id,entries] of Object.entries(plain)){
  const english=byId.get(id);if(!english)throw new Error('Unknown lesson id '+id);
  out[id]=out[id]||{};
  for(const [p,es] of Object.entries(entries)){
   if(!english.has(p))throw new Error('Unknown path '+id+':'+p);
   out[id][p]={es,src:sha12(english.get(p))};
  }
 }
 for(const id of Object.keys(out)){const order=[...byId.get(id).keys()];out[id]=Object.fromEntries(order.filter(p=>out[id][p]).map(p=>[p,out[id][p]]));}
 return out;
}
