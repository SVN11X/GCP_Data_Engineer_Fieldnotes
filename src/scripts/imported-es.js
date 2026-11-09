/* Spanish overlay for the 349 imported (owner-supplied) questions. Loaded on demand, only when the language is Spanish.
   An overlay maps question id -> path -> {es, src}. src is the first 12 hex chars of the sha256 of the English string it translates.
   Only learner-visible strings can be translated: the html of the stem, the html of each choice, the source explanation, the explanation,
   the review note and the issue notes. Ids, numbers, letters, order, source keys, answers, status, images and sources are never read from the overlay.
   The plain text of the stem and of each choice follows from the translated html, so text and html cannot disagree.
   A stale or missing entry falls back to English. The learner can also swap one question back to the untouched English text without reloading. */
(function(root){
'use strict';
const decode=s=>String(s).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&amp;/g,'&');
const flat=t=>String(t).replace(/\s+/g,' ').trim();
/* The plain text of an html string: images dropped, line breaks kept, tags removed, entities decoded. */
const htmlToText=h=>decode(String(h).replace(/<img\b[^>]*>/g,'').replace(/<br\s*\/?>/g,'\n').replace(/<[^>]*>/g,'')).trim();
/* The visible text pieces of an html string, as the page shows them between tags and line breaks. */
const segments=h=>String(h).split(/<[^>]*>/).map(s=>flat(decode(s))).filter(Boolean);
/* Every learner-visible string of an imported question as [path, English text]. */
function paths(q){
 const out=[],add=(p,v)=>{if(typeof v==='string'&&v)out.push([p,v]);};
 add('html',q.html);
 (q.choices||[]).forEach((c,i)=>add('choices.'+i+'.html',c.html));
 add('sourceExplanation',q.sourceExplanation);add('explanation',q.explanation);add('reviewNote',q.reviewNote);
 (q.issues||[]).forEach((s,i)=>add('issues.'+i,s));
 return out;
}
const isHtml=p=>/(^|\.)html$/.test(p);
/* The plain text twin of an html path ("html" -> "text", "choices.1.html" -> "choices.1.text"). */
const twin=p=>isHtml(p)?p.replace(/html$/,'text'):null;
const getAt=(o,path)=>{for(const k of path.split('.')){if(o==null)return undefined;o=o[k];}return o;};
const english={},spanish={},reasons={},owned={},view=new Set(),marks=new Map();
/* The overlay-able keys of a captured English base: everything except the text twins. */
const overlayKeys=b=>Object.keys(b).filter(p=>!/(^|\.)text$/.test(p));
let active=false;
/* English values of every path, plus the text twins. Captured the first time a question is seen, so later writes never become the "English". */
function baseOf(q){
 const b=english[q.id]||(english[q.id]={});
 for(const [p] of paths(q)){
  if(!(p in b))b[p]=getAt(q,p);
  const t=twin(p);
  if(t&&!(t in b))b[t]=getAt(q,t);
 }
 return b;
}
/* Writes Spanish (where the overlay has an entry and the learner has not asked for the original) or English into the question. */
function show(q){
 const L=root.FieldLessonEs,b=english[q.id]||{},es=spanish[q.id]||{},sp=active&&!view.has(q.id);
 for(const p in b)L.setAt(q,p,sp&&es[p]!==undefined?es[p]:b[p]);
 register(q);
}
/* What FieldI18n.report() reads. A string is "translated" when the Spanish is on screen, or when the learner asked for the original. Otherwise the reason is listed. */
function register(q){
 const id=q.id;(owned[id]||[]).forEach(k=>marks.delete(k));
 const own=owned[id]=[];
 if(!active)return;
 const mark=(text,state,html)=>{for(const s of html?segments(text):[flat(text)]){if(s){marks.set(s,state);own.push(s);}}};
 const b=english[id],es=spanish[id]||{},original=view.has(id);
 for(const p of overlayKeys(b)){
  const en=b[p];
  const h=isHtml(p);
  if(original){mark(en,'translated',h);continue;}
  if(es[p]!==undefined){mark(es[p],'translated',h);if(h)mark(es[twin(p)],'translated',false);}
  else mark(en,(reasons[id]&&reasons[id][p])||'overlay not loaded',h);
 }
}
/* Puts Spanish (on=true) or English (on=false) into the given imported questions. Returns the stale paths that fell back to English. */
async function apply(questions,overlay,on){
 const L=root.FieldLessonEs,stale=[];
 for(const q of questions){
  const b=baseOf(q),entries=overlay?overlay[q.id]:null;
  spanish[q.id]={};reasons[q.id]={};
  if(!on){active=false;delete spanish[q.id];delete reasons[q.id];for(const p in b)L.setAt(q,p,b[p]);(owned[q.id]||[]).forEach(k=>marks.delete(k));delete owned[q.id];continue;}
  active=true;
  for(const p of overlayKeys(b)){
   const x=entries&&entries[p],ok=x&&typeof x.es==='string'&&x.es.trim();
   if(!ok){reasons[q.id][p]=overlay?'no entry in the overlay':'overlay not loaded';continue;}
   const h=await L.hash12(b[p]);
   if(h!==null&&h!==x.src){stale.push(q.id+':'+p);reasons[q.id][p]='stale source hash';continue;}
   spanish[q.id][p]=x.es;L.note(x.es);
   if(isHtml(p))spanish[q.id][twin(p)]=htmlToText(x.es);
  }
  show(q);
 }
 if(stale.length&&root.console)root.console.warn('Stale Spanish imported question text fell back to English: '+stale.join(', '));
 return stale;
}
/* 'es' while the Spanish translation is shown, 'en' while the learner looks at the original, null when no Spanish exists for the question. */
function status(id){
 if(!active||!spanish[id]||spanish[id].html===undefined)return null;
 return view.has(id)?'en':'es';
}
/* Swaps one question between its Spanish translation and the untouched English text. Nothing is reloaded and no answer, key or label changes. */
function toggle(q){
 if(!status(q.id))return null;
 if(view.has(q.id))view.delete(q.id);else view.add(q.id);
 show(q);
 return status(q.id);
}
/* Looks a list text up in the marks. List rows cut long text and add "…", so a cut text matches the start of a marked text. */
function stateOf(core){
 const t=flat(core);
 if(marks.has(t))return marks.get(t);
 const cut=t.replace(/…$/,'').trim();
 if(cut!==t&&cut.length>=20)for(const [k,v] of marks)if(k.startsWith(cut)||k.endsWith(cut))return v;
 return null;
}
root.FieldImportedEs={paths,htmlToText,segments,apply,status,toggle,stateOf,marks};
})(globalThis);
