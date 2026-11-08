/* Spanish interface layer. Loaded on demand, only when the language is Spanish.
   It replaces exact English strings (and simple patterns with placeholders) by the values of data/i18n-es.json.
   Lessons, questions and code are skipped. Original strings are kept so English can be restored without a reload. */
(function(root){
'use strict';
const ATTRS=['aria-label','title','placeholder','alt'];
const COVERED=['home','orientation','diagnostic','review','progress','focus'];
const SKIP='pre,code,.code,svg,script,style,noscript,textarea,[data-no-translate],[data-english],a[href^="#learn/"],a[href^="#practice/"],.focus-choice,#vocab-content';
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
   return /^o\d*$/.test(part)?'(\\d+\\.\\d+)':NUMERIC.test(part)?'(\\d+)':'(.+?)';
  }).join('');
  return {re:new RegExp('^'+source+'$','s'),names,value,weight:key.replace(PLACEHOLDER,'').length};
 }).sort((x,y)=>y.weight-x.weight);
 return {strings:new Map(Object.entries(dict.strings||{})),keep:new Set(dict.keep||[]),patterns};
}
/* Returns the Spanish text, or null when the string has no entry. Whitespace around the string is kept by translate(). */
function resolve(core,c,depth=0){
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
   const inner=resolve(plain(v),c,depth+1);
   return inner===null?v:inner;
  });
 }
 return null;
}
function translate(text,c){
 const s=String(text),m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s),out=resolve(plain(m[2]),c);
 return out===null?s:m[1]+out+m[3];
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
const st={c:null,on:false,token:0,observer:null,texts:new WeakMap(),attrs:new WeakMap(),loading:null,covered:true};
const isCovered=()=>{const h=((root.location&&root.location.hash)||'').replace(/^#/,'').split('/')[0];return !h||COVERED.includes(h);};
const skipped=el=>!el||!!el.closest(SKIP)||(!st.covered&&!!el.closest('#main'));
function processText(node){
 if(skipped(node.parentElement))return;
 const rec=st.texts.get(node),cur=node.nodeValue;
 if(rec&&cur===rec.tr)return;
 const out=translate(cur,st.c);
 if(out!==cur){st.texts.set(node,{orig:cur,tr:out});node.nodeValue=out;}else if(rec)st.texts.delete(node);
}
function processElement(el){
 if(skipped(el))return;
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
 const doc=start.ownerDocument||start,w=doc.createTreeWalker(start,5,{acceptNode:n=>n.nodeType===1&&n.closest&&skipped(n)?2:1});
 if(start.nodeType===1)visit(start);
 while(w.nextNode())visit(w.currentNode);
}
function scan(node){
 if(node.nodeType===3){processText(node);return;}
 if(node.nodeType!==1||skipped(node))return;
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
 for(const el of els){
  const map=st.attrs.get(el);
  if(!map)continue;
  for(const name of Object.keys(map))if(el.getAttribute(name)===map[name].tr)el.setAttribute(name,map[name].orig);
  st.attrs.delete(el);
 }
}
function observe(){
 st.covered=isCovered();
 scan(root.document.body);
 st.observer=st.observer||new root.MutationObserver(onMutations);
 st.observer.observe(root.document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
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
/* Visible text and attributes on this page that still have no Spanish. Skipped content is ignored. */
function report(){
 if(!st.c)return null;
 st.covered=isCovered();
 const found=new Map(),add=(kind,attr,orig)=>{
  const core=plain(orig);
  if(!/[A-Za-z]{2}/.test(core)||resolve(core,st.c)!==null)return;
  const id=kind+'|'+attr+'|'+core,hit=found.get(id);
  if(hit)hit.count++;else found.set(id,{kind,attr,text:core,count:1});
 };
 walk(root.document.body,n=>{
  if(n.nodeType===3){const rec=st.texts.get(n);add('text','',rec?rec.orig:n.nodeValue);return;}
  const map=st.attrs.get(n);
  for(const name of ATTRS)if(n.hasAttribute(name))add('attr',name,map&&map[name]?map[name].orig:n.getAttribute(name));
 });
 return {route:(root.location&&root.location.hash)||'#home',covered:st.covered,missing:[...found.values()]};
}
root.FieldI18n={compile,resolve,translate,validate,duplicateKeys,start,stop,report,ATTRS,COVERED};
})(globalThis);
