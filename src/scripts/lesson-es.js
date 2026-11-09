/* Spanish lesson overlay. Loaded on demand, only when the language is Spanish.
   An overlay maps lesson id -> path -> {es, src}. src is the first 12 hex chars of the sha256 of the English string it translates.
   A stale or missing entry falls back to English, so a changed English text never shows an old translation. */
(function(root){
'use strict';
/* Every learner-visible string of a lesson as [path, English text]. Code, ids, urls, references and keywords are not translatable. */
function paths(l){
 const out=[],add=(p,v)=>{if(typeof v==='string'&&v)out.push([p,v]);};
 add('title',l.title);add('lead',l.lead);
 (l.sections||[]).forEach((s,i)=>{add('sections.'+i+'.title',s.title);add('sections.'+i+'.body',s.body);});
 add('trap',l.trap);
 if(l.exercise){add('exercise.prompt',l.exercise.prompt);add('exercise.answer',l.exercise.answer);(l.exercise.checkpoints||[]).forEach((c,i)=>add('exercise.checkpoints.'+i,c));}
 for(const k of ['context','whyItMatters','takeaway'])add('briefing.'+k,l.briefing?.[k]);
 add('review.scope',l.review?.scope);
 for(const k of ['useCase','advantage','limitation'])add('decision.'+k,l.decision?.[k]);
 const b=l.block;
 if(b){
  add('block.diagram.title',b.diagram?.title);add('block.diagram.description',b.diagram?.description);
  (b.diagram?.nodes||[]).forEach((n,i)=>(n.lines||[]).forEach((t,j)=>add('block.diagram.nodes.'+i+'.lines.'+j,t)));
  add('block.keyFact',b.keyFact);add('block.check.question',b.check?.question);
  (b.check?.choices||[]).forEach((c,i)=>{add('block.check.choices.'+i+'.text',c.text);add('block.check.choices.'+i+'.why',c.why);});
 }
 return out;
}
function setAt(o,path,value){const k=path.split('.');for(let i=0;i<k.length-1;i++)o=o[k[i]];o[k[k.length-1]]=value;}
const cache=new Map();
/* sha256 first 12 hex chars. Without WebCrypto (an http page) it returns null and the build-time check stands. */
async function hash12(text){
 const subtle=root.crypto?.subtle;if(!subtle)return null;
 if(!cache.has(text)){const d=await subtle.digest('SHA-256',new TextEncoder().encode(text));cache.set(text,[...new Uint8Array(d)].slice(0,6).map(b=>b.toString(16).padStart(2,'0')).join(''));}
 return cache.get(text);
}
const english={};
/* Puts Spanish (on=true) or English (on=false) into the given lesson objects. Returns the stale paths that fell back to English. */
async function apply(lessons,overlay,on){
 const stale=[];
 for(const l of lessons){
  const base=english[l.id]||(english[l.id]=Object.fromEntries(paths(l)));
  for(const p in base)setAt(l,p,base[p]);
  const entries=on&&overlay?overlay[l.id]:null;if(!entries)continue;
  for(const p in entries){
   const x=entries[p];if(!(p in base)||!x||typeof x.es!=='string'||!x.es.trim())continue;
   const h=await hash12(base[p]);
   if(h!==null&&h!==x.src){stale.push(l.id+':'+p);continue;}
   setAt(l,p,x.es);
  }
 }
 if(stale.length&&root.console)root.console.warn('Stale Spanish lesson text fell back to English: '+stale.join(', '));
 return stale;
}
root.FieldLessonEs={paths,setAt,hash12,apply};
})(globalThis);
