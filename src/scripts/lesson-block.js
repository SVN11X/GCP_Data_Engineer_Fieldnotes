/* Lesson block pilot: a small diagram, one key fact and one quick check. Nothing is scored or saved. */
(function(root){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* Data flow plan: one pass is 1.6 s and it repeats 3 times, so 4.8 s in total, under the 5 s limit. */
const FLOW={passMs:1600,passes:3};
function flowPlan(reduced){return reduced?{animate:false,passes:0,totalMs:0,control:false}:{animate:true,passes:FLOW.passes,totalMs:FLOW.passMs*FLOW.passes,control:true};}
function flowNext(state,action,reduced){
 if(reduced)return 'done';
 if(action==='toggle')return state==='playing'?'paused':state==='paused'?'playing':'playing';
 if(action==='end')return 'done';
 return state;
}
function flowLabel(state){return state==='playing'?'Pause data flow':state==='paused'?'Resume data flow':'Play data flow';}
function diagram(d,id){
 const nodes=new Map(d.nodes.map(n=>[n.id,n])),mark='lb-arrow-'+id;
 const edges=d.edges.map(x=>{const a=nodes.get(x.from),b=nodes.get(x.to);return `<line class="lb-edge" x1="${a.x+a.w/2}" y1="${a.y+a.h}" x2="${b.x+b.w/2}" y2="${b.y-2}" marker-end="url(#${mark})"/>`;}).join('');
 const dots=d.edges.map(x=>{const a=nodes.get(x.from),b=nodes.get(x.to),x1=a.x+a.w/2,y1=a.y+a.h,x2=b.x+b.w/2,y2=b.y-2;return `<circle class="lb-dot" r="4" cx="${x1}" cy="${y1}" style="--dx:${x2-x1}px;--dy:${y2-y1}px" aria-hidden="true"/>`;}).join('');
 const boxes=d.nodes.map(n=>{const first=n.y+n.h/2-(n.lines.length-1)*9+5;return `<g class="lb-node"><rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6"/>${n.lines.map((t,i)=>`<text x="${n.x+n.w/2}" y="${first+i*18}" text-anchor="middle">${esc(t)}</text>`).join('')}</g>`;}).join('');
 return `<svg class="lb-diagram" data-flow="done" role="img" aria-labelledby="${mark}-t ${mark}-d" width="${d.width}" height="${d.height}" viewBox="0 0 ${d.width} ${d.height}"><title id="${mark}-t">${esc(d.title)}</title><desc id="${mark}-d">${esc(d.description)}</desc><defs><marker id="${mark}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path class="lb-head" d="M0,0 L8,4 L0,8 z"/></marker></defs>${edges}${dots}${boxes}</svg>`;
}
function video(v){
 if(!v)return '';
 const tracks=v.tracks.map(t=>`<track kind="captions" srclang="${esc(t.lang)}" label="${esc(t.label)}" src="${esc(t.src)}">`).join('');
 return `<figure class="lb-video"><video controls preload="none" width="${v.width}" height="${v.height}" poster="${esc(v.poster)}" aria-label="${esc(v.title)}"><source src="${esc(v.src)}" type="video/webm">${tracks}Your browser cannot play this video. ${esc(v.description)}</video><figcaption>${esc(v.title)}. It starts only when you press play and has captions in English and Spanish. ${esc(v.description)}</figcaption></figure>`;
}
function render(l){
 const b=l&&l.block;if(!b)return '';
 const c=b.check,q='lb-q-'+l.id;
 return `<section class="lesson-block" aria-label="Quick lesson, about ${b.minutes} minutes"><div class="mini-label">QUICK LESSON · ABOUT ${b.minutes} MINUTES</div>${diagram(b.diagram,l.id)}<button type="button" class="button small lb-flow" data-lb-flow>Play data flow</button>${video(b.video)}<p class="lb-fact"><span class="key-fact" data-english>${esc(b.keyFact)}</span></p><div class="lb-check" role="group" aria-labelledby="${q}"><p id="${q}" class="lb-question" data-english><strong>Quick check:</strong> ${esc(c.question)}</p><div class="lb-choices">${c.choices.map((x,i)=>`<button type="button" class="lb-choice" data-lb-choice="${i}" data-english>${esc(x.text)}</button>`).join('')}</div><p class="lb-feedback" role="status" aria-live="polite" data-english></p></div></section>`;
}
function answer(l,index){
 const x=l&&l.block&&l.block.check.choices[index];
 return x?{correct:x.correct===true,text:(x.correct===true?'Correct. ':'Not quite. ')+x.why}:null;
}
const reducedNow=()=>!!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);
function setFlow(sec,state){
 const svg=sec.querySelector('.lb-diagram'),btn=sec.querySelector('[data-lb-flow]');if(!svg)return;
 svg.dataset.flow=state;
 if(btn){btn.textContent=flowLabel(state);btn.setAttribute('aria-pressed',state==='playing'?'true':'false');btn.hidden=!flowPlan(reducedNow()).control;}
}
function startFlow(sec){
 const svg=sec.querySelector('.lb-diagram');if(!svg)return;
 if(!flowPlan(reducedNow()).animate){setFlow(sec,'done');return;}
 svg.dataset.flow='done';void svg.getBoundingClientRect();setFlow(sec,'playing');
}
function onClick(ev){
 const fb=ev.target&&ev.target.closest&&ev.target.closest('[data-lb-flow]');
 if(fb){const sec=fb.closest('.lesson-block'),svg=sec.querySelector('.lb-diagram'),st=svg.dataset.flow;if(st==='done')startFlow(sec);else setFlow(sec,flowNext(st,'toggle',reducedNow()));return;}
 const btn=ev.target&&ev.target.closest&&ev.target.closest('[data-lb-choice]');if(!btn)return;
 const sec=btn.closest('.lesson-block'),lesson=root.FieldLessonBlock.current;
 const r=lesson&&answer(lesson,Number(btn.dataset.lbChoice));if(!r)return;
 for(const o of sec.querySelectorAll('.lb-choice')){o.classList.remove('right','wrong');o.removeAttribute('aria-pressed');}
 btn.classList.add(r.correct?'right':'wrong');btn.setAttribute('aria-pressed','true');
 const f=sec.querySelector('.lb-feedback');f.textContent=r.text;f.classList.toggle('right',r.correct);f.classList.toggle('wrong',!r.correct);
}
const api={render,diagram,answer,flowPlan,flowNext,flowLabel,FLOW,current:null};
if(typeof document!=='undefined'){
 document.addEventListener('click',onClick);
 document.addEventListener('animationend',ev=>{const d=ev.target;if(d&&d.classList&&d.classList.contains('lb-dot')&&d===d.parentNode.querySelector('.lb-dot')){const sec=d.closest('.lesson-block');if(sec)setFlow(sec,flowNext('playing','end',false));}});
 if(typeof MutationObserver!=='undefined')new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType!==1)continue;const secs=n.matches&&n.matches('.lesson-block')?[n]:(n.querySelectorAll?n.querySelectorAll('.lesson-block'):[]);for(const s of secs)startFlow(s);}}).observe(document.documentElement,{childList:true,subtree:true});
}
root.FieldLessonBlock=api;
})(globalThis);
