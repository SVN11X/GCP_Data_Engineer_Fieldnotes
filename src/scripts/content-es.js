/* Spanish overlays for services, comparisons, workshops, architecture patterns, the resources page and the sources notes. Loaded on demand with lesson-es.js, only when the language is Spanish.
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
 },
 /* The resources page is one item with the id "resources". The loader links the source audit method and scope under "audit". */
 resources(r,add){
  add('standard.experience',r.standard&&r.standard.experience);add('standard.validity',r.standard&&r.standard.validity);add('renewal.eligibility',r.renewal&&r.renewal.eligibility);
  each(r.items,(x,i)=>{for(const k of ['title','type','access','use','caution'])add('items.'+i+'.'+k,x[k]);});
  each(r.plan,(x,i)=>{add('plan.'+i+'.title',x.title);add('plan.'+i+'.outcome',x.outcome);});
  each(r.verificationNotes,(t,i)=>add('verificationNotes.'+i,t));
  add('audit.method',r.audit&&r.audit.method);add('audit.scope',r.audit&&r.audit.scope);
 },
 /* The sources page notes are one item with the id "sources". The loader wraps the lazy knowledge audit and verification files in it. */
 sources(x,add){
  const a=x.knowledgeAudit||{},v=x.verification||{};
  each(a.findings,(f,i)=>{add('knowledgeAudit.findings.'+i+'.title',f.title);add('knowledgeAudit.findings.'+i+'.detail',f.detail);});
  add('knowledgeAudit.extractionRepository.scope',a.extractionRepository&&a.extractionRepository.scope);
  add('verification.method',v.method);
  each(v.claims,(c,i)=>{add('verification.claims.'+i+'.claim',c.claim);add('verification.claims.'+i+'.note',c.note);});
 }
};
const KINDS=Object.keys(PATHS);
function paths(kind,item){
 const out=[];
 PATHS[kind](item,(p,v)=>{if(typeof v==='string'&&v)out.push([p,v]);});
 return out;
}
const english={};
/* Spanish text this file wrote (applied) and English text it left in place while Spanish was on (gaps: text -> reason), whitespace collapsed. FieldI18n.report() reads them. */
const applied=new Set(),gaps=new Map(),flat=t=>String(t).replace(/\s+/g,' ').trim();
/* English text per path. A workshop can first be a short list entry and later the full item, so new paths are added when they appear. */
function baseOf(kind,item){const b=english[kind+':'+item.id]||(english[kind+':'+item.id]={});for(const [p,v] of paths(kind,item))if(!(p in b))b[p]=v;return b;}
/* Puts Spanish (on=true) or English (on=false) into the given items. Returns the stale paths that fell back to English. */
async function apply(kind,items,overlay,on){
 const L=root.FieldLessonEs,stale=[];
 for(const item of items){
  const base=baseOf(kind,item);
  for(const p in base){L.setAt(item,p,base[p]);if(!on){applied.delete(flat(base[p]));gaps.delete(flat(base[p]));}}
  if(!on)continue;
  const entries=overlay?overlay[item.id]:null;
  for(const p in base){
   const x=entries&&entries[p],ok=x&&typeof x.es==='string'&&x.es.trim();
   if(!ok){gaps.set(flat(base[p]),overlay?'no entry in the overlay':'overlay not loaded');continue;}
   const h=await L.hash12(base[p]);
   if(h!==null&&h!==x.src){stale.push(item.id+':'+p);gaps.set(flat(base[p]),'stale source hash');continue;}
   L.setAt(item,p,x.es);L.note(x.es);applied.add(flat(x.es));gaps.delete(flat(base[p]));
  }
 }
 if(stale.length&&root.console)root.console.warn('Stale Spanish '+kind+' text fell back to English: '+stale.join(', '));
 return stale;
}
root.FieldContentEs={KINDS,paths,apply,applied,gaps};
})(globalThis);
