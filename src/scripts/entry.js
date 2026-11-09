/* Entry paths: a first question, a newcomer orientation and a 10-question diagnostic. The choice is stored under its own key and never touches saved progress. */
(function(root){
'use strict';
const SIZE=10;
root.FieldEntry={create({D,C,e,tag,render,setPracticeDomain}){
 let path=null,skipped=false,machine=C.entryStart(),ids=[];
 try{path=C.parsePath(localStorage.getItem(C.PATH_KEY));}catch{}
 const go=hash=>{if(location.hash===hash)render(true);else location.hash=hash;};
 const send=event=>{machine=C.entryNext(machine,event);};
 function store(value){path=value;try{if(value)localStorage.setItem(C.PATH_KEY,C.serializePath(value));else localStorage.removeItem(C.PATH_KEY);}catch{}}
 function sync(target){
  if(target==='new'&&machine.name!=='orientation'){machine=C.entryStart();send({type:'choose-new'});}
  if(target==='know'&&machine.name!=='diagnostic'&&machine.name!=='result'){machine=C.entryStart();send({type:'choose-know'});ids=[];}
 }
 const label=p=>p==='new'?'New to the exam: orientation':'I know the exam: diagnostic';
 const switchButton=()=>`<button type="button" class="button entry-switch" data-action="entry-switch">Switch path</button>`;
 function panel(){
  if(!path&&skipped)return `<p class="entry-skipped"><button type="button" class="button small" data-action="entry-again">Choose your path</button></p>`;
  if(!path)return `<section class="entry-panel" aria-labelledby="entry-question"><div class="eyebrow">START HERE</div><h2 id="entry-question">Do you know the exam?</h2><p>Pick one path. You can switch at any time.</p><div class="entry-choices"><button type="button" class="button primary entry-big" data-action="entry-new"><b>I am new to the exam</b><span>Short guide and a study route</span></button><button type="button" class="button primary entry-big" data-action="entry-know"><b>I already know the exam</b><span>10 questions to find your weakest domain</span></button></div><button type="button" class="button quiet" data-action="entry-skip">Skip for now</button></section>`;
  const isNew=path==='new';
  return `<section class="entry-panel entry-chosen" aria-label="Your chosen path"><div><div class="mini-label">YOUR PATH</div><p class="entry-path-name">${e(label(path))}</p></div><div class="entry-actions"><a class="button primary" href="#${isNew?'orientation':'diagnostic'}">${isNew?'Open the orientation':'Start the diagnostic'} →</a>${switchButton()}</div></section>`;
 }
 function orientation(){
  sync('new');
  const dom=D.domains,lessons=D.lessons;
  return `<div class="entry-page"><a href="#home" class="back-link">← Study home</a><div class="page-heading"><div><div class="eyebrow">NEW TO THE EXAM</div><h1>Welcome. Start here.</h1><p class="lead">This page explains the exam and shows a simple route.</p></div></div>
<section class="lesson-section"><h2>What the exam is</h2><p>The Professional Data Engineer exam is a Google Cloud certification. It tests how you design, build and run data systems.</p><ul class="entry-facts"><li>It takes about 2 hours.</li><li>It has 40 to 50 questions. They are multiple choice and multiple select.</li><li>It is offered in English and Japanese.</li><li>You take it online or at a test center, with a proctor.</li><li>Google suggests 3 or more years in industry. That includes 1 or more years designing and managing data solutions on Google Cloud.</li><li>There are no prerequisites.</li></ul><p class="small muted">Checked 2026-11-08. Read the <a href="https://cloud.google.com/learn/certification/data-engineer" target="_blank" rel="noopener noreferrer">official certification page ↗</a> and the <a href="https://services.google.com/fh/files/misc/professional_data_engineer_exam_guide_english.pdf" target="_blank" rel="noopener noreferrer">exam guide (PDF) ↗</a> for current details.</p></section>
<section class="lesson-section"><h2>How to use this site in 3 steps</h2><ol class="entry-steps"><li><b>Learn.</b> Open one lesson in the <a href="#learn">Learning path</a>. Read the short block first.</li><li><b>Try.</b> Do a <a href="#missions">quick challenge</a> and change one thing to see what happens.</li><li><b>Practice.</b> Answer questions in the <a href="#practice">Practice bank</a>. Read every explanation, also when you are right.</li></ol></section>
<section class="lesson-section"><h2>The five exam domains</h2><p>The exam has five domains. The weight is the share of the exam.</p><ul class="entry-domains">${dom.map(d=>`<li><span class="entry-domain-name">${d.id}. ${e(d.name)}</span><span class="entry-weight">${d.weight}%</span><span class="entry-bar" aria-hidden="true"><i style="width:${d.weight*3}%"></i></span></li>`).join('')}</ul></section>
<section class="lesson-section"><h2>Your guided route</h2><p>Go in order. Take one lesson at a time.</p>${dom.map((d,i)=>`<details class="details entry-route" ${i===0?'open':''}><summary>Domain ${d.id}: ${e(d.name)} · ${d.weight}%</summary><ol>${lessons.filter(l=>l.domain===d.id).map(l=>`<li><a href="#learn/${e(l.id)}">${e(l.title)}</a> <span class="small muted">${l.minutes?l.minutes+' min':''}</span></li>`).join('')}</ol></details>`).join('')}</section>
<section class="entry-panel entry-chosen"><p class="entry-path-name">Want a test of what you know?</p><div class="entry-actions">${switchButton()}</div></section></div>`;
 }
 const qmap=()=>Object.fromEntries(D.questions.map(q=>[q.id,q]));
 function diagnostic(){
  sync('know');
  if(!ids.length){try{ids=C.pickDiagnostic(D.questions,D.domains);}catch{return `<div class="entry-page"><a href="#home" class="back-link">← Study home</a><h1>The diagnostic could not start.</h1><p>The practice questions did not load. Reload the page and try again.</p></div>`;}}
  const Q=qmap(),head=`<a href="#home" class="back-link">← Study home</a>`;
  if(machine.name==='result')return head+result(Q);
  const n=machine.step,q=Q[ids[n]],picked=machine.answers[n],done=picked!==undefined;
  const choices=q.choices.map(c=>{const right=done&&q.answer.includes(c.letter),wrong=done&&picked.includes(c.letter)&&!right;return `<button type="button" class="choice entry-choice ${right?'correct':''} ${wrong?'wrong':''}" data-action="dx-answer" data-id="${e(c.letter)}" ${done?'disabled':''}><span class="choice-letter">${e(c.letter)}.</span> <span>${e(c.text)}</span>${right?'<span class="choice-result">✓ Correct</span>':wrong?'<span class="choice-result">× Your answer</span>':''}</button>`;}).join('');
  const ok=done&&C.equalAnswers(picked,q.answer);
  const fb=done?`<section class="answer-box" id="dx-feedback" tabindex="-1" role="status"><div class="answer-key">${tag(ok?'✓ Right':'Not quite',ok?'green':'amber')}${tag('Answer: '+q.answer.join(', '),'blue')}</div><p>${e(q.explanation)}</p>${q.choices.filter(c=>c.why).map(c=>`<div class="reason-row"><strong>${e(c.letter)}${q.answer.includes(c.letter)?' ✓':''}</strong><p>${e(c.why)}</p></div>`).join('')}</section>`:'';
  return `${head}<div class="entry-page"><div class="eyebrow">DIAGNOSTIC · NOTHING IS SAVED</div><h1>Question ${n+1} of ${SIZE}</h1><progress class="entry-progress" max="${SIZE}" value="${n+(done?1:0)}" aria-label="Diagnostic progress, ${n+1} of ${SIZE}"></progress><p class="small muted">Domain ${q.domain}: ${e(D.domains.find(d=>d.id===q.domain)?.name||'')}</p><p class="entry-question">${e(q.text)}</p><div class="entry-choice-list" role="group" aria-label="Choose one answer">${choices}</div>${fb}<div class="entry-actions"><button type="button" class="button" data-action="dx-back">← Back</button>${done?`<button type="button" class="button primary" data-action="dx-next">${n>=SIZE-1?'See my result':'Next question'} →</button>`:''}${switchButton()}</div></div>`;
 }
 function result(Q){
  const s=C.scoreDiagnostic(ids,machine.answers,Q,D.domains),w=D.domains.find(d=>d.id===s.weakest);
  const rows=D.domains.map(d=>{const r=s.domains[d.id];return `<li><span class="entry-domain-name">${d.id}. ${e(d.name)}</span><span class="entry-weight">${r.correct} of ${r.total}</span><span class="entry-bar" aria-hidden="true"><i style="width:${r.total?100*r.correct/r.total:0}%"></i></span></li>`;}).join('');
  const lessons=w?D.lessons.filter(l=>l.domain===w.id):[];
  return `<div class="entry-page"><div class="eyebrow">DIAGNOSTIC RESULT</div><h1>You answered ${s.correct} of ${s.total} correctly.</h1><p class="lead">This is a short check, not an exam score. Nothing was saved.</p><section class="lesson-section"><h2>Score by domain</h2><ul class="entry-domains">${rows}</ul></section>${w?`<section class="entry-panel entry-chosen"><div><div class="mini-label">YOUR WEAKEST DOMAIN</div><p class="entry-path-name">Domain ${w.id}: ${e(w.name)}</p><p class="small muted">Ties go to the domain with the higher exam weight.</p></div><div class="entry-actions"><button type="button" class="button primary" data-action="dx-practice" data-id="${w.id}">Practice this domain →</button></div></section><section class="lesson-section"><h2>Lessons for this domain</h2><ol class="entry-lessons">${lessons.map(l=>`<li><a href="#learn/${e(l.id)}">${e(l.title)}</a></li>`).join('')}</ol></section>`:''}<div class="entry-actions"><button type="button" class="button" data-action="dx-back">← Back to question ${SIZE}</button><button type="button" class="button" data-action="dx-restart">Try 10 new questions</button>${switchButton()}</div></div>`;
 }
 function onAction(button){
  const a=button.dataset.action;
  switch(a){
   case'entry-new':machine=C.entryStart();send({type:'choose-new'});store('new');go('#orientation');return true;
   case'entry-know':machine=C.entryStart();send({type:'choose-know'});ids=[];store('know');go('#diagnostic');return true;
   case'entry-skip':skipped=true;render(false);return true;
   case'entry-again':skipped=false;store(null);machine=C.entryStart();render(false);return true;
   case'entry-switch':{
    const from=location.hash==='#orientation'?'new':location.hash==='#diagnostic'?'know':path||C.entryPath(machine)||'new';
    sync(from);send({type:'switch-path'});ids=[];
    const next=C.entryPath(machine);store(next);go(next==='new'?'#orientation':'#diagnostic');return true;}
   case'dx-answer':send({type:'answer',value:[button.dataset.id]});Promise.resolve(render(false)).then(()=>document.getElementById('dx-feedback')?.focus({preventScroll:true}));return true;
   case'dx-next':send({type:'next'});render(true);return true;
   case'dx-back':{const before=machine.name;send({type:'back'});if(before==='diagnostic'&&machine.name==='welcome'){machine=C.entryStart();go('#home');}else render(true);return true;}
   case'dx-restart':send({type:'restart'});ids=[];render(true);return true;
   case'dx-practice':setPracticeDomain(Number(button.dataset.id));go('#practice');return true;
  }
  return false;
 }
 return {panel,orientation,diagnostic,onAction};
}};
})(globalThis);
