/* Spanish overlays for services, comparisons, workshops and architecture patterns. Loaded on demand with lesson-es.js, only when the language is Spanish.
   An overlay maps item id -> path -> {es, src}. src is the first 12 hex chars of the sha256 of the English string it translates.
   A stale or missing entry falls back to English, so a changed English text never shows an old translation.
   Names, ids, urls, code, fixtures and simulation values are not translatable. */
(function(root){
'use strict';
const each=(list,fn)=>(Array.isArray(list)?list:[]).forEach(fn);
/* Every learner-visible string of one item as [path, English text]. */
const PATHS={
 services(s,add){for(const k of ['fit','signal','caution','strength'])add(k,s[k]);each(s.limitations,(t,i)=>add('limitations.'+i,t));},
 comparisons(c,add){
  for(const k of ['title','question','quickRule'])add(k,c[k]);
  each(c.options,(o,i)=>{add('options.'+i+'.chooseWhen',o.chooseWhen);add('options.'+i+'.beCarefulWhen',o.beCarefulWhen);});
  add('verification.note',c.verification&&c.verification.note);
 },
 workshops(w,add){
  add('title',w.title);add('goal',w.goal);
  each(w.steps,(s,i)=>add('steps.'+i+'.text',s.text));
  add('prediction.prompt',w.prediction&&w.prediction.prompt);add('prediction.unit',w.prediction&&w.prediction.unit);
  add('explanation',w.explanation);
 },
 architectures(a,add){
  for(const k of ['title','goal','success','failure','scope'])add(k,a[k]);
  each(a.nodes,(n,i)=>{for(const k of ['label','caption','detail'])add('nodes.'+i+'.'+k,n[k]);});
  each(a.edges,(x,i)=>add('edges.'+i+'.label',x.label));
 }
};
const KINDS=Object.keys(PATHS);
function paths(kind,item){
 const out=[];
 PATHS[kind](item,(p,v)=>{if(typeof v==='string'&&v)out.push([p,v]);});
 return out;
}
const english={};
/* English text per path. A workshop can first be a short list entry and later the full item, so new paths are added when they appear. */
function baseOf(kind,item){const b=english[kind+':'+item.id]||(english[kind+':'+item.id]={});for(const [p,v] of paths(kind,item))if(!(p in b))b[p]=v;return b;}
/* Puts Spanish (on=true) or English (on=false) into the given items. Returns the stale paths that fell back to English. */
async function apply(kind,items,overlay,on){
 const L=root.FieldLessonEs,stale=[];
 for(const item of items){
  const base=baseOf(kind,item);
  for(const p in base)L.setAt(item,p,base[p]);
  const entries=on&&overlay?overlay[item.id]:null;if(!entries)continue;
  for(const p in entries){
   const x=entries[p];if(!(p in base)||!x||typeof x.es!=='string'||!x.es.trim())continue;
   const h=await L.hash12(base[p]);
   if(h!==null&&h!==x.src){stale.push(item.id+':'+p);continue;}
   L.setAt(item,p,x.es);
  }
 }
 if(stale.length&&root.console)root.console.warn('Stale Spanish '+kind+' text fell back to English: '+stale.join(', '));
 return stale;
}
root.FieldContentEs={KINDS,paths,apply};
})(globalThis);
