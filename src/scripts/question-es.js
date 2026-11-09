/* Spanish overlay for the 124 authored questions. Loaded on demand with lesson-es.js, only when the language is Spanish.
   An overlay maps question id -> path -> {es, src}. src is the first 12 hex chars of the sha256 of the English string it translates.
   Only strings are translated. Choice letters, order, answers, required counts, domain, objective, origin, status and source keys are never read from the overlay.
   A stale or missing entry falls back to English, so a changed English text never shows an old translation. */
(function(root){
'use strict';
/* Every learner-visible string of a question as [path, English text]. */
function paths(q){
 const out=[],add=(p,v)=>{if(typeof v==='string'&&v)out.push([p,v]);};
 add('text',q.text);
 (q.choices||[]).forEach((c,i)=>{add('choices.'+i+'.text',c.text);add('choices.'+i+'.why',c.why);});
 add('explanation',q.explanation);
 return out;
}
const getAt=(o,path)=>{for(const k of path.split('.')){if(o==null)return undefined;o=o[k];}return o;};
/* The html twin of a text path ("text" -> "html", "choices.1.text" -> "choices.1.html"). */
const twin=p=>p==='text'?'html':/\.text$/.test(p)?p.replace(/text$/,'html'):null;
const english={},same={};
const flat=t=>String(t).replace(/\s+/g,' ').trim();
/* Spanish text this file wrote (applied) and English text it left in place while Spanish was on (gaps: text -> reason), whitespace collapsed. FieldI18n.report() reads them. */
const applied=new Set(),gaps=new Map();
/* English text per path. A question can first be a short list entry (text only) and later the full question, so new paths are added when they appear.
   An html twin that equals the English text is rewritten with it. */
function baseOf(q){
 const b=english[q.id]||(english[q.id]={}),s=same[q.id]||(same[q.id]=new Set());
 for(const [p,v] of paths(q)){
  if(!(p in b))b[p]=v;
  const t=twin(p);
  if(t&&getAt(q,t)===b[p])s.add(p);
 }
 return b;
}
/* Looks a list text up in the applied and gap sets. List rows cut long text and add "…", so a cut text matches the start of an applied or gap text. */
function stateOf(core){
 const t=flat(core);
 if(applied.has(t))return 'translated';
 if(gaps.has(t))return gaps.get(t);
 const cut=t.replace(/…$/,'').trim();
 if(cut!==t&&cut.length>=20){
  for(const a of applied)if(a.startsWith(cut)||a.endsWith(cut))return 'translated';
  for(const [k,v] of gaps)if(k.startsWith(cut)||k.endsWith(cut))return v;
 }
 return null;
}
/* Puts Spanish (on=true) or English (on=false) into the given authored questions. Returns the stale paths that fell back to English. */
async function apply(questions,overlay,on){
 const L=root.FieldLessonEs,stale=[];
 for(const q of questions){
  const base=baseOf(q),tw=same[q.id];
  const put=(p,v)=>{L.setAt(q,p,v);const t=twin(p);if(t&&tw.has(p))L.setAt(q,t,v);};
  for(const p in base){put(p,base[p]);if(!on){applied.delete(flat(base[p]));gaps.delete(flat(base[p]));}}
  if(!on)continue;
  const entries=overlay?overlay[q.id]:null;
  for(const p in base){
   const x=entries&&entries[p],ok=x&&typeof x.es==='string'&&x.es.trim();
   if(!ok){gaps.set(flat(base[p]),overlay?'no entry in the overlay':'overlay not loaded');continue;}
   const h=await L.hash12(base[p]);
   if(h!==null&&h!==x.src){stale.push(q.id+':'+p);gaps.set(flat(base[p]),'stale source hash');continue;}
   put(p,x.es);L.note(x.es);applied.add(flat(x.es));gaps.delete(flat(base[p]));
  }
 }
 if(stale.length&&root.console)root.console.warn('Stale Spanish question text fell back to English: '+stale.join(', '));
 return stale;
}
root.FieldQuestionEs={paths,apply,applied,gaps,stateOf};
})(globalThis);
