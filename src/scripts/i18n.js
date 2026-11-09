/* Spanish interface layer. Loaded on demand, only when the language is Spanish.
   It replaces exact English strings (and simple patterns with placeholders) by the values of data/i18n-es.json.
   Lessons, services, comparisons, workshops and architecture patterns have their own Spanish overlays, applied to the data before it renders, so the translator skips them. Questions and code are skipped on purpose. Original strings are kept so English can be restored without a reload. */
(function(root){
'use strict';
const ATTRS=['aria-label','title','placeholder','alt'];
/* Routes whose chrome (labels, buttons, filters, notices) is translated. Their study content comes from its own overlay and question text stays English, see HARD. */
const COVERED=['home','missions','lab','exam','resources','orientation','diagnostic','review','progress','focus','learn','practice','workshops','english','compare','architectures','sources'];
/* Content that stays in English on purpose until its own stage. It is never translated and report() counts it as skipped. */
const HARD=[
 ['code','pre,code,.code,textarea,script,style,noscript'],
 ['diagram text','svg'],
 ['text already in Spanish','[lang="es"]:not(html)'],
 ['study content (own Spanish overlay or English) and question text','[data-english],[data-no-translate],.focus-choice'],
 ['glossary entries','#vocab-content h2,#vocab-content .vocab-definition,#vocab-content .vocab-example,.vocab-card h2,.vocab-card p,.flashcard h2,.flashcard p,.word-pill'],
 ['question list text','.question-row h3']
];
/* Titles, names and notes that are data, not interface. They are only used by report() to tell them from a missing string. */
const SOFT=[
 ['titles and names','.lesson-info,.lesson-body>h1,.lesson-section>h2,.workshop-card h2,.service-card h3,.source-card h3,a[href^="#learn/"],a[href^="#practice/"],a[href^="#workshops/"],a[target="_blank"],.source-list,#compare-left option,#compare-right option,.table-wrap th,.table-wrap td,.choice'],
 ['review and audit notes','.question-card .notice,.answer-box .small,.audit-status-grid,.claim,.detail-heading>p,.panel details p']
];
const SKIP=HARD.map(r=>r[1]).join(',');
/* Interface pieces that sit inside skipped content, such as the image buttons or the quick check label. They are translated. */
const ALLOW='.lb-feedback,.lb-question>strong,.image-transcription figcaption,.image-transcription caption,.image-transcription>button,.image-transcription summary,.image-caption,.asset-warning,.asset-warning a,.choice-result,.mission-scene text,.mission-scene title,.mission-scene desc';
const ALLOW_ATTR=ALLOW+',.image-open,.term';
const SITE=' '+String.fromCharCode(183)+' Data Engineer Fieldnotes';
const NUMERIC=/^(n|a|b|c|total|count|min|minutes|days|best|done|pct|weight|earned|step|size|hours)\d*$/;
const PLACEHOLDER=/\{(\w+)\}/g;
const escapeRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const plain=s=>String(s).replace(/\s+/g,' ').trim();
const placeholders=s=>[...String(s).matchAll(PLACEHOLDER)].map(m=>m[1]);

/* ---------- Pure part: no DOM needed ---------- */
function compile(dict){
 const patterns=Object.entries(dict.patterns||{}).map(([key,value])=>{
  const names=[];
  const source=key.split(/\{(\w+)\}/).map((part,i)=>{
   if(i%2===0)return escapeRe(part).replace(/ /g,'\\s+');
   names.push(part);
   return /^o\d*$/.test(part)?'(\\d+\\.\\d+)':NUMERIC.test(part)?'(\\d+(?:,\\d{3})*)':'(.+?)';
  }).join('');
  return {re:new RegExp('^'+source+'$','s'),names,value,weight:key.replace(PLACEHOLDER,'').length};
 }).sort((x,y)=>y.weight-x.weight);
 return {strings:new Map(Object.entries(dict.strings||{})),keep:new Set(dict.keep||[]),patterns};
}
/* Returns the Spanish text, or null when the string has no entry. Whitespace around the string is kept by translate(). */
function resolve(core,c,depth=0,info){
 if(!core)return null;
 if(c.keep.has(core))return core;
 if(c.strings.has(core))return c.strings.get(core);
 if(depth>=3)return null;
 for(const p of c.patterns){
  const r=p.re.exec(core);
  if(!r)continue;
  return p.value.replace(PLACEHOLDER,(whole,name)=>{
   const i=p.names.indexOf(name);
   if(i<0)return whole;
   const v=r[i+1];
   if(NUMERIC.test(name)||/^o\d*$/.test(name))return v;
   const inner=resolve(plain(v),c,depth+1,info);
   if(inner===null&&info&&/[A-Za-z]{2}/.test(v))info.fallback=true;
   return inner===null?v:inner;
  });
 }
 return null;
}
function translate(text,c){
 const s=String(text),m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s),out=resolve(plain(m[2]),c);
 return out===null?s:m[1]+out+m[3];
}
/* The page title is "<heading> - Data Engineer Fieldnotes". Only the heading is translated, the site name stays.
   A heading made of several sentences (a line break in the page) is translated sentence by sentence. */
function translateTitle(text,c){
 const s=String(text),i=s.lastIndexOf(SITE);
 if(i<=0||i+SITE.length!==s.length)return s;
 const head=plain(s.slice(0,i)),whole=resolve(head,c);
 if(whole!==null)return whole+SITE;
 const parts=(head.match(/[^.?!]+[.?!]*/g)||[]).map(x=>resolve(plain(x),c));
 return parts.length>1&&parts.every(x=>x!==null)?parts.join(' ')+SITE:s;
}
/* Name of the on-purpose English region an element belongs to, or null. Soft regions only count when asked. */
function regionOf(el,soft){
 if(!el||!el.closest)return null;
 for(const [name,sel] of soft?HARD.concat(SOFT):HARD)if(el.closest(sel))return name;
 return null;
}
/* Checks a dictionary. Returns a list of problems, empty when it is valid. */
function validate(dict){
 const errors=[],strings=dict&&dict.strings,patterns=dict&&dict.patterns,prot=dict&&dict.protected,keep=dict&&dict.keep;
 if(!strings||typeof strings!=='object')return ['strings must be an object'];
 if(!patterns||typeof patterns!=='object')return ['patterns must be an object'];
 if(!Array.isArray(prot)||!prot.length||prot.some(t=>typeof t!=='string'||!t.trim()))errors.push('protected must be a non-empty list of terms');
 if(!Array.isArray(keep)||keep.some(t=>typeof t!=='string'||!t.trim()))errors.push('keep must be a list of strings');
 const terms=(Array.isArray(prot)?prot:[]).map(t=>String(t).toLowerCase());
 for(const [kind,table] of [['strings',strings],['patterns',patterns]]){
  for(const [key,value] of Object.entries(table)){
   const where=kind+': "'+key+'"';
   if(typeof value!=='string'||!value.trim()){errors.push(where+' has an empty value');continue;}
   if(!key.trim()||key!==key.trim()||/\s{2,}/.test(key))errors.push(where+' key has stray whitespace');
   const k=placeholders(key),v=placeholders(value);
   if(kind==='strings'&&k.length)errors.push(where+' has a placeholder but is in strings');
   for(const name of k)if(!v.includes(name))errors.push(where+' loses {'+name+'}');
   for(const name of v)if(!k.includes(name))errors.push(where+' invents {'+name+'}');
   for(const term of terms)if(key.toLowerCase().includes(term)&&!value.toLowerCase().includes(term))errors.push(where+' alters protected term "'+term+'"');
   if(kind==='patterns'&&/\{\w+\}\{\w+\}/.test(key))errors.push(where+' has adjacent placeholders');
  }
 }
 for(const key of Object.keys(strings))if(key in patterns)errors.push('"'+key+'" is both a string and a pattern');
 for(const key of keep||[])if(key in strings)errors.push('"'+key+'" is both kept and translated');
 return errors;
}
/* Keys that appear twice in the raw JSON text (JSON.parse silently keeps the last one). */
function duplicateKeys(raw){
 const seen=new Set(),dupes=[],tokens=/"(?:[^"\\]|\\.)*"/g;let m;
 while((m=tokens.exec(raw))){
  if(!/^\s*:/.test(raw.slice(tokens.lastIndex,tokens.lastIndex+8)))continue;
  const key=JSON.parse(m[0]);
  if(key==='strings'||key==='patterns')continue;
  if(seen.has(key))dupes.push(key);else seen.add(key);
 }
 return dupes;
}

/* ---------- DOM part ---------- */
const st={c:null,on:false,token:0,observer:null,texts:new WeakMap(),attrs:new WeakMap(),loading:null,covered:true,titleNode:null};
const isCovered=()=>{const h=((root.location&&root.location.hash)||'').replace(/^#/,'').split('/')[0];return !h||COVERED.includes(h);};
const unscoped=el=>!st.covered&&!!el.closest('#main');
/* True when the translator must leave this element alone. Interface pieces inside skipped content (ALLOW) are the exception. */
function skipped(el,attr){
 if(!el)return true;
 if(unscoped(el))return true;
 const s=el.closest(SKIP);
 if(!s)return false;
 const a=el.closest(attr?ALLOW_ATTR:ALLOW);
 return !(a&&s.contains(a));
}
const isTitle=node=>!!node.parentElement&&node.parentElement.nodeName==='TITLE';
/* The lesson row title is a bare text node next to the meta line, so it is skipped by its parent. */
const lessonTitle=node=>!!node.parentElement.matches&&node.parentElement.matches('.lesson-info');
function processText(node){
 const title=isTitle(node);
 if(title){if(!st.covered)return;}
 else if(skipped(node.parentElement)||lessonTitle(node))return;
 const rec=st.texts.get(node),cur=node.nodeValue;
 if(rec&&cur===rec.tr)return;
 const out=title?translateTitle(cur,st.c):translate(cur,st.c);
 if(title)st.titleNode=node;
 if(out!==cur){st.texts.set(node,{orig:cur,tr:out});node.nodeValue=out;}else if(rec)st.texts.delete(node);
}
function processElement(el){
 if(skipped(el,true))return;
 let map=st.attrs.get(el);
 for(const name of ATTRS){
  if(!el.hasAttribute(name))continue;
  const cur=el.getAttribute(name),rec=map&&map[name];
  if(rec&&cur===rec.tr)continue;
  const out=translate(cur,st.c);
  if(out!==cur){if(!map){map={};st.attrs.set(el,map);}map[name]={orig:cur,tr:out};el.setAttribute(name,out);}else if(rec)delete map[name];
 }
}
function walk(start,visit){
 const doc=start.ownerDocument||start,w=doc.createTreeWalker(start,5,{acceptNode:n=>n.nodeType!==1||!n.closest?1:unscoped(n)?2:skipped(n,true)?3:1});
 if(start.nodeType===1)visit(start);
 while(w.nextNode())visit(w.currentNode);
}
function scan(node){
 if(node.nodeType===3){processText(node);return;}
 if(node.nodeType!==1||unscoped(node))return;
 walk(node,n=>n.nodeType===3?processText(n):processElement(n));
}
function onMutations(records){
 st.covered=isCovered();
 for(const r of records){
  if(r.type==='characterData')processText(r.target);
  else if(r.type==='attributes')processElement(r.target);
  else for(const n of r.addedNodes)scan(n);
 }
 st.observer.takeRecords();
}
function restore(){
 const body=root.document&&root.document.body;
 if(!body)return;
 const w=root.document.createTreeWalker(body,5);
 const els=[body];
 while(w.nextNode()){
  const n=w.currentNode;
  if(n.nodeType===3){const rec=st.texts.get(n);if(rec&&n.nodeValue===rec.tr)n.nodeValue=rec.orig;st.texts.delete(n);}
  else els.push(n);
 }
 const tn=st.titleNode;
 if(tn){const rec=st.texts.get(tn);if(rec&&tn.nodeValue===rec.tr)tn.nodeValue=rec.orig;st.texts.delete(tn);st.titleNode=null;}
 for(const el of els){
  const map=st.attrs.get(el);
  if(!map)continue;
  for(const name of Object.keys(map))if(el.getAttribute(name)===map[name].tr)el.setAttribute(name,map[name].orig);
  st.attrs.delete(el);
 }
}
function observe(){
 st.covered=isCovered();
 const title=root.document.querySelector('title');
 scan(root.document.body);
 if(title)scan(title);
 st.observer=st.observer||new root.MutationObserver(onMutations);
 st.observer.observe(root.document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
 if(title)st.observer.observe(title,{childList:true,subtree:true,characterData:true});
 st.observer.takeRecords();
}
/* Loads the dictionary once, then translates the page and keeps translating every change. */
function start(release){
 const token=++st.token;
 const ready=st.c?Promise.resolve():(st.loading=st.loading||root.fetch('data/i18n-es.json?v='+encodeURIComponent(release||''),{credentials:'omit'}).then(r=>{if(!r.ok)throw new Error('Dictionary request failed ('+r.status+').');return r.json();}).then(d=>{st.c=compile(d);}).catch(x=>{st.loading=null;throw x;}));
 return ready.then(()=>{if(token!==st.token)return;st.on=true;observe();});
}
function stop(){
 st.token++;st.on=false;
 if(st.observer)st.observer.disconnect();
 if(st.c)restore();
}
/* What is still English on this page. "missing" are strings that need an entry. "skipped" counts the text left in English on purpose
   (study content that has its own overlay, question text, code, titles and names), grouped by region, so a crawl can tell the two apart. */
function report(){
 if(!st.c)return null;
 st.covered=isCovered();
 const found=new Map(),left=new Map(),note=name=>left.set(name,(left.get(name)||0)+1);
 const add=(kind,attr,orig,el,node)=>{
  const core=plain(orig);
  if(!/[A-Za-z]{2}/.test(core)||el.closest('script,style,noscript'))return;
  if(unscoped(el))return note('route not translated yet');
  if(skipped(el,kind==='attr')||(node&&lessonTitle(node)))return note(regionOf(el,true)||'text left in English on purpose');
  const info={},out=resolve(core,st.c,0,info);
  if(out!==null){if(info.fallback)note('text captured inside a pattern');return;}
  const soft=regionOf(el,true);
  if(soft)return note(soft);
  const id=kind+'|'+attr+'|'+core,hit=found.get(id);
  if(hit)hit.count++;else found.set(id,{kind,attr,text:core,count:1});
 };
 const body=root.document.body,w=root.document.createTreeWalker(body,5),all=[body];
 while(w.nextNode())all.push(w.currentNode);
 for(const n of all){
  if(n.nodeType===3){if(n.parentElement){const rec=st.texts.get(n);add('text','',rec?rec.orig:n.nodeValue,n.parentElement,n);}continue;}
  const map=st.attrs.get(n);
  for(const name of ATTRS)if(n.hasAttribute(name))add('attr',name,map&&map[name]?map[name].orig:n.getAttribute(name),n,null);
 }
 const skippedList=[...left].map(([region,count])=>({region,count})),total=skippedList.reduce((t,x)=>t+x.count,0);
 return {route:(root.location&&root.location.hash)||'#home',covered:st.covered,partial:st.covered&&total>0,missing:[...found.values()],skipped:skippedList,skippedCount:total};
}
root.FieldI18n={compile,resolve,translate,translateTitle,regionOf,validate,duplicateKeys,start,stop,report,ATTRS,COVERED,HARD,SOFT,SKIP};
})(globalThis);
