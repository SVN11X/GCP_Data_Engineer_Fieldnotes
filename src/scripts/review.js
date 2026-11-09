/* Fast review pages: #review (time plan) and #review/<domain> (one-page summary). Loaded on demand. Nothing is saved. */
(function(root){
'use strict';
root.FieldReview={create({D,C,e}){
 let hours=2;
 const back='<a href="#home" class="back-link">← Study home</a>';
 const diag='<a class="button" href="#diagnostic">Take the 10-question diagnostic first →</a>';
 function plan(){
  const total=hours*60,rows=C.reviewPlan(D.domains,D.lessons,total);
  const toggle=[2,1].map(h=>`<button type="button" class="button ${h===hours?'primary':''}" data-action="review-hours" data-id="${h}" aria-pressed="${h===hours}">${h} hour${h>1?'s':''}</button>`).join('');
  return `<div class="entry-page review-page">${back}<div class="eyebrow">FAST REVIEW</div><h1>Your ${hours}-hour review plan</h1><p class="lead">Minutes follow the exam weight of each domain and add up to ${total}. Ticks on this page are not saved.</p><div class="entry-actions" role="group" aria-label="Review length">${toggle}</div>${rows.map(r=>`<section class="lesson-section review-domain" aria-labelledby="rv-${r.id}"><h2 id="rv-${r.id}">Domain ${r.id}: ${e(r.name)}</h2><p class="review-minutes"><b>${r.minutes} min</b> · ${r.weight}% of the exam</p><h3>Objectives</h3><ul class="review-checks">${r.objectives.map(o=>`<li><label><input type="checkbox"> <span>${e(o.id)} ${e(o.title)}</span></label></li>`).join('')}</ul><h3>Lessons to open, in order</h3><ol class="entry-lessons">${r.lessons.map(l=>`<li><a href="#learn/${e(l.id)}">${e(l.title)}</a></li>`).join('')}</ol><a class="button small" href="#review/${r.id}">One-page summary →</a></section>`).join('')}<div class="entry-actions">${diag}</div></div>`;
 }
 function summary(id){
  const s=C.domainSummary(D.domains,D.lessons,id);
  if(!s)return plan();
  return `<div class="entry-page review-page"><a href="#review" class="back-link">← Review plan</a><div class="eyebrow">ONE-PAGE SUMMARY · ${s.weight}% OF THE EXAM</div><h1>Domain ${s.id}: ${e(s.name)}</h1><section class="lesson-section"><h2>Objectives</h2><ul class="review-list">${s.objectives.map(o=>`<li><b>${e(o.id)}</b> ${e(o.title)}</li>`).join('')}</ul></section><section class="lesson-section"><h2>Key facts by lesson</h2><ul class="review-list">${s.lessons.map(l=>`<li><a href="#learn/${e(l.id)}">${e(l.title)}</a>${l.keyFact?`<p>${e(l.keyFact)}</p>`:''}</li>`).join('')}</ul></section><div class="entry-actions"><a class="button" href="#practice">Practice questions →</a></div></div>`;
 }
 function onAction(button){
  if(button.dataset.action!=='review-hours')return false;
  hours=Number(button.dataset.id)===1?1:2;return 'redraw';
 }
 return {plan,summary,onAction};
}};
})(globalThis);
