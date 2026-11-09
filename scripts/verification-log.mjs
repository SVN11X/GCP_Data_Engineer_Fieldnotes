// Verification log rules shared by the build, the validator and the tests.
import fs from 'node:fs';
import path from 'node:path';
import '../src/scripts/verification.js';
const V=globalThis.FieldVerification;
export const METHODS=Object.keys(V.METHODS);
export const KINDS=['lesson','service','comparison','exam'];
export const RESULTS=['confirmed','updated','unverifiable'];
export const HOSTS=['google.com','services.google.com','cloud.google.com','docs.cloud.google.com','developers.google.com','ai.google.dev'];
export const MAX_AGE_DAYS=V.MAX_AGE_DAYS;
export const latestByTopic=V.latestByTopic;
export const ageInDays=V.ageInDays;
export const isStale=V.isStale;

/* ids: {lesson:[...], service:[...], comparison:[...]}. Returns a list of error strings. */
export function validateLog(log,ids={}){
 const errors=[],seen=new Set();
 if(!Array.isArray(log))return ['The log must be an array.'];
 log.forEach((x,i)=>{
  const at='Entry '+(i+1)+(x&&x.topic?' ('+x.topic+')':'')+': ';
  if(!x||typeof x!=='object'||Array.isArray(x)){errors.push(at+'must be an object.');return;}
  if(typeof x.topic!=='string'||!x.topic)errors.push(at+'topic is required.');
  if(!KINDS.includes(x.kind))errors.push(at+'kind must be one of '+KINDS.join(', ')+'.');
  else if(x.kind==='exam'){if(x.topic!=='exam')errors.push(at+'the exam topic must be "exam".');}
  else if(!(ids[x.kind]||[]).includes(x.topic))errors.push(at+'unknown '+x.kind+' topic.');
  if(!Number.isFinite(V.dayNumber(x.checkedOn)))errors.push(at+'checkedOn must be a real date as YYYY-MM-DD.');
  if(!METHODS.includes(x.method))errors.push(at+'method must be one of '+METHODS.join(', ')+'.');
  if(typeof x.query!=='string'||!x.query.trim())errors.push(at+'query is required.');
  if(!RESULTS.includes(x.result))errors.push(at+'result must be one of '+RESULTS.join(', ')+'.');
  if(typeof x.note!=='string'||!x.note.trim())errors.push(at+'note is required.');
  if(!Array.isArray(x.sources)||!x.sources.length)errors.push(at+'sources needs at least one URL.');
  else for(const u of x.sources){
   let url;try{url=new URL(u);}catch{errors.push(at+'invalid source URL.');continue;}
   if(url.protocol!=='https:'||!HOSTS.includes(url.hostname))errors.push(at+'source must be an https URL on an official Google host: '+u);
  }
  const key=[x.kind,x.topic,x.method,x.checkedOn].join('|');
  if(seen.has(key))errors.push(at+'duplicate topic, method and date.');
  seen.add(key);
 });
 return errors;
}

/* Gap check. Missing records fail the build (see gapErrors). This is the one place that decides what counts as a gap.
   comparison ids are checked only when a comparisons content file supplies them, so ids.comparison is empty until then. */
export function findGaps(log,ids){
 const have=latestByTopic(log),missing=kind=>(ids[kind]||[]).filter(id=>!have.has(kind+':'+id));
 return {lessons:missing('lesson'),services:missing('service'),comparisons:missing('comparison')};
}
/* Error lines for the build gate, one per kind that has gaps, each naming the first 10 missing ids. Empty when covered. */
export function gapErrors(log,ids){
 const gaps=findGaps(log,ids),out=[];
 for(const [name,list,total] of [['lessons',gaps.lessons,(ids.lesson||[]).length],['services',gaps.services,(ids.service||[]).length],['comparisons',gaps.comparisons,(ids.comparison||[]).length]])
  if(list.length)out.push(`Verification log: ${list.length} of ${total} ${name} have no entry. First ${Math.min(10,list.length)}: ${list.slice(0,10).join(', ')}`);
 return out;
}
/* Throws one Error that lists every gap line. The build calls this before it writes anything. */
export function assertNoGaps(log,ids){
 const errors=gapErrors(log,ids);
 if(errors.length)throw new Error('Missing verification records in content/verification-log.json:\n'+errors.join('\n'));
}
/* Ids of the comparisons content file, or an empty list while that file does not exist yet. */
export function comparisonIds(contentDir){
 const file=path.join(contentDir,'comparisons.json');
 return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')).map(x=>x.id):[];
}
export function findStale(log,today,maxDays=MAX_AGE_DAYS){
 return [...latestByTopic(log).values()].filter(x=>V.isStale(x,today,maxDays));
}
/* Warning lines for the build. Only entries older than 90 days warn. Does not throw and does not decide pass or fail. */
export function warnings(log,ids,today){
 const out=[],stale=findStale(log,today);
 if(stale.length)out.push(`Verification log: ${stale.length} entries are older than ${MAX_AGE_DAYS} days: ${stale.slice(0,10).map(x=>x.kind+':'+x.topic).join(', ')}`);
 return out;
}
