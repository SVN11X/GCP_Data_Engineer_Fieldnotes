/* Verification log: pure helpers plus a lazy line on lesson pages that shows when and where a topic was checked. Loaded on demand. */
(function(root){
'use strict';
const DAY=86400000,MAX_AGE_DAYS=90;
const METHODS={'google-developer-knowledge-mcp':'Google Developer Knowledge MCP','official-page':'an official Google page'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dayNumber=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));if(!m)return NaN;const t=Date.UTC(+m[1],+m[2]-1,+m[3]);const d=new Date(t);return d.getUTCFullYear()===+m[1]&&d.getUTCMonth()===+m[2]-1&&d.getUTCDate()===+m[3]?t/DAY:NaN;};
const ageInDays=(checkedOn,today)=>dayNumber(today)-dayNumber(checkedOn);
const isStale=(entry,today,maxDays=MAX_AGE_DAYS)=>{const age=ageInDays(entry?.checkedOn,today);return !Number.isFinite(age)||age>maxDays;};
/* Latest entry per kind and topic. Equal dates keep the entry written last. */
function latestByTopic(entries){
 const out=new Map();
 for(const x of Array.isArray(entries)?entries:[]){
  if(!x||typeof x.topic!=='string'||!Number.isFinite(dayNumber(x.checkedOn)))continue;
  const key=x.kind+':'+x.topic,cur=out.get(key);
  if(!cur||dayNumber(x.checkedOn)>=dayNumber(cur.checkedOn))out.set(key,x);
 }
 return out;
}
function lineHtml(entry){
 if(!entry)return '<span>Not yet verified against Google documentation.</span>';
 const url=Array.isArray(entry.sources)?entry.sources[0]:'';
 const link=/^https:\/\//.test(url||'')?` · <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">Source (opens in a new tab)</a>`:'';
 const scope=entry.note?` <span class="verify-scope">What was checked: ${esc(entry.note)}</span>`:'';
 return `<span>Checked ${esc(entry.checkedOn)} against ${esc(METHODS[entry.method]||'an official Google source')}</span>${link}${scope}`;
}
const api={MAX_AGE_DAYS,METHODS,dayNumber,ageInDays,isStale,latestByTopic,lineHtml};
root.FieldVerification=api;
if(typeof document==='undefined')return;
const src=document.currentScript?.src||'';
let log;
const load=()=>log||(log=fetch('data/verification-log.json'+(src.includes('?')?'?'+src.split('?')[1]:''),{credentials:'omit'}).then(r=>{if(!r.ok)throw new Error('status '+r.status);return r.json();}).then(latestByTopic));
async function show(){
 const parts=location.hash.slice(1).split('/'),host=document.querySelector('.lesson-body .meta');
 if(parts[0]!=='learn'||!parts[1]||!host||host.parentNode.querySelector('.verify-line'))return;
 let map;try{map=await load();}catch{log=null;return;}
 if(host.parentNode.querySelector('.verify-line')||!host.isConnected)return;
 const entry=map.get('lesson:'+decodeURIComponent(parts[1]));
 const p=document.createElement('p');p.className='verify-line muted';p.style.fontSize='.9375rem';p.innerHTML=lineHtml(entry);
 host.after(p);
}
const main=document.getElementById('main');
if(main)new MutationObserver(show).observe(main,{childList:true});
show();
})(globalThis);
