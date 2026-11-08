// Comparison content rules shared by the build, the validator and the tests.
import {HOSTS} from './verification-log.mjs';
export const MIN_OPTIONS=3,MAX_OPTIONS=5,MAX_SOURCES=3;
const text=v=>typeof v==='string'&&v.trim().length>0;
const ID=/^[a-z][a-z0-9-]*$/;

/* list: parsed content/comparisons.json. log: the verification log. lessonIds: known lesson ids. Returns error strings. */
export function validateComparisons(list,log=[],lessonIds=null){
 const errors=[],seen=new Set();
 if(!Array.isArray(list))return ['Comparisons must be an array.'];
 if(!list.length)errors.push('Comparisons must not be empty.');
 const logged=new Set((Array.isArray(log)?log:[]).filter(x=>x&&x.kind==='comparison').map(x=>x.topic));
 list.forEach((c,i)=>{
  const at='Comparison '+(i+1)+(c&&c.id?' ('+c.id+')':'')+': ';
  if(!c||typeof c!=='object'||Array.isArray(c)){errors.push(at+'must be an object.');return;}
  if(!text(c.id)||!ID.test(c.id))errors.push(at+'id must be lowercase letters, digits and dashes.');
  else if(seen.has(c.id))errors.push(at+'duplicate id.');
  else{seen.add(c.id);if(!logged.has(c.id))errors.push(at+'no verification log entry of kind comparison.');}
  for(const k of ['title','question','quickRule'])if(!text(c[k]))errors.push(at+k+' is required.');
  if(c.lessons!==undefined){
   if(!Array.isArray(c.lessons))errors.push(at+'lessons must be an array.');
   else for(const id of c.lessons)if(lessonIds&&!lessonIds.includes(id))errors.push(at+'unknown lesson '+id+'.');
  }
  if(!Array.isArray(c.options)||c.options.length<MIN_OPTIONS||c.options.length>MAX_OPTIONS){errors.push(at+'needs '+MIN_OPTIONS+' to '+MAX_OPTIONS+' options.');return;}
  const names=new Set();
  c.options.forEach((o,j)=>{
   const oat=at+'option '+(j+1)+(o&&o.name?' ('+o.name+')':'')+': ';
   if(!o||typeof o!=='object'||Array.isArray(o)){errors.push(oat+'must be an object.');return;}
   for(const k of ['name','chooseWhen','beCarefulWhen'])if(!text(o[k]))errors.push(oat+k+' is required.');
   if(text(o.name)){if(names.has(o.name))errors.push(oat+'duplicate name.');names.add(o.name);}
   if(!Array.isArray(o.sources)||!o.sources.length||o.sources.length>MAX_SOURCES){errors.push(oat+'needs 1 to '+MAX_SOURCES+' sources.');return;}
   for(const u of o.sources){
    let url;try{url=new URL(u);}catch{errors.push(oat+'invalid source URL.');continue;}
    if(url.protocol!=='https:'||!HOSTS.includes(url.hostname))errors.push(oat+'source must be an https URL on an official Google host: '+u);
   }
  });
 });
 return errors;
}
