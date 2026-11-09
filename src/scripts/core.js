/* Pure study and simulation logic. Browser and Node share this implementation. */
(function (root) {
  'use strict';
  function equalAnswers(a, b) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && [...new Set(a)].length === a.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
  }
  function quotas(size, domains) {
    const parts = domains.map(d => ({id: d.id, exact: size * d.weight / 100, count: Math.floor(size * d.weight / 100)}));
    let remaining = size - parts.reduce((n, p) => n + p.count, 0);
    const order = [...parts].sort((a, b) => (b.exact - b.count) - (a.exact - a.count) || a.id - b.id);
    for (let i = 0; i < remaining; i++) order[i % order.length].count++;
    return Object.fromEntries(parts.map(p => [p.id, p.count]));
  }
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]];}
    return result;
  }
  function makeExam(questions, size, domains, random = Math.random, difficulty = 'mixed') {
    const counts = quotas(size, domains), result = [];
    for (const d of domains) {
      const pool = questions.filter(q => q.origin === 'authored' && q.timed !== false && q.gradable && q.domain === d.id && (difficulty === 'mixed' || q.difficulty === difficulty));
      if (pool.length < counts[d.id]) throw new Error('Not enough authored questions for domain ' + d.id);
      result.push(...shuffle(pool, random).slice(0, counts[d.id]));
    }
    return shuffle(result, random).map(q => q.id);
  }
  function scoreExam(ids, answers, questionMap) {
    const domains = {}, items = ids.map(id => {
      const q = questionMap[id], picked = answers[id] || [], correct = equalAnswers(picked, q.answer);
      const d = domains[q.domain] || (domains[q.domain] = {correct: 0, total: 0});
      d.total++; if (correct) d.correct++;
      return {id, correct, picked, unanswered: picked.length === 0};
    });
    const correct = items.filter(i => i.correct).length;
    return {correct, total: ids.length, percent: Math.round(100 * correct / (ids.length || 1)), unanswered: items.filter(i => i.unanswered).length, domains, items};
  }
  const EVENTS = [
    {id: 'A', time: 1, arrival: 1, value: 10}, {id: 'B', time: 4, arrival: 4, value: 20},
    {id: 'C', time: 9, arrival: 9, value: 30}, {id: 'D', time: 2, arrival: 10, value: 40},
    {id: 'E', time: 6, arrival: 11, value: 15}, {id: 'F', time: 12, arrival: 12, value: 25}
  ];
  function simulateStream(step, allowed = 3) {
    const windows = [{start:0,end:5,total:0,ids:[]},{start:5,end:10,total:0,ids:[]},{start:10,end:15,total:0,ids:[]}];
    let maxTime = 0, watermark = 0;
    const history = [];
    for (const event of EVENTS.slice(0, Math.max(0, Math.min(EVENTS.length, step)))) {
      const window = windows[Math.floor(event.time / 5)];
      const accepted = watermark < window.end + allowed;
      history.push({...event, watermarkBefore: watermark, accepted, late: event.time < watermark});
      if (accepted) {window.total += event.value; window.ids.push(event.id);}
      maxTime = Math.max(maxTime, event.time); watermark = Math.max(0, maxTime - 2);
    }
    return {windows: windows.map(w => ({...w,expired: watermark >= w.end + allowed})), history, watermark, dropped: history.filter(h=>!h.accepted).length, total: windows.reduce((n,w)=>n+w.total,0)};
  }
  function scanModel(days, country) {
    const n = Math.max(1, Math.min(30, Math.round(Number(days) || 1)));
    return {days:n, full:300, partitioned:10*n, clustered:10*n/(country === 'all' ? 1 : 10)};
  }
  function runWorkshop(f) {
    switch (f.type) {
      case 'dedup': {
        const latest = new Map();
        for (const row of f.rows) {const old=latest.get(row.id); if(!old || row.time>old.time || (row.time===old.time && row.sequence>old.sequence))latest.set(row.id,{...row});}
        const rows=[...latest.values()].sort((a,b)=>a.id.localeCompare(b.id)), total=rows.reduce((n,r)=>n+r.amount,0);
        return {retainedRows:rows,recordCount:rows.length,total,prediction:total};
      }
      case 'join': {
        const joined=f.orders.flatMap(o=>f.items.filter(i=>i.order===o.id).map(i=>({order:o.id,total:o.total,sku:i.sku})));
        const naive=joined.reduce((n,r)=>n+r.total,0),correct=f.orders.reduce((n,r)=>n+r.total,0);
        return {joinedRows:joined,naiveTotal:naive,orderGrainTotal:correct,prediction:naive};
      }
      case 'quality': {
        const counts=new Map();for(const r of f.rows)if(r.id!==null)counts.set(r.id,(counts.get(r.id)||0)+1);
        const failures=f.rows.map(r=>({row:r.row,reasons:[...(r.id===null?['missing ID']:[]),...(counts.get(r.id)>1?['duplicate ID']:[]),...(r.amount===null?['missing amount']:r.amount<0?['negative amount']:[]),...(!r.email.includes('@')?['toy email rule']:[])]})).filter(r=>r.reasons.length);
        return {invalidRows:failures,validCount:f.rows.length-failures.length,prediction:failures.length};
      }
      case 'merge': {
        const apply=target=>{const m=new Map(target.map(r=>[r.id,{...r}]));for(const r of f.changes){const old=m.get(r.id);if(!old || r.version>old.version)m.set(r.id,{...r});}return [...m.values()].sort((a,b)=>a.id.localeCompare(b.id));};
        const once=apply(f.target),twice=apply(once),total=once.reduce((n,r)=>n+r.amount,0);
        return {afterFirstRun:once,afterReplay:twice,total,prediction:total};
      }
      case 'late': {const zero=simulateStream(6,0),three=simulateStream(6,3);return {zeroLatenessTotal:zero.total,threeMinuteTotal:three.total,zeroLatenessDrops:zero.dropped,threeMinuteDrops:three.dropped,prediction:three.total};}
      case 'scan': {const model=scanModel(f.days,f.country);return {...model,prediction:model.clustered};}
      case 'identity': {const actor=f.operations.find(o=>(o.capabilities||[]).includes('source.read'));return {capabilityMap:f.operations,prediction:actor?.actor||'none'};}
      case 'dag': {
        const status={};let pending=[...f.nodes];
        while(pending.length){let progress=false;pending=pending.filter(n=>{if(!n.dependencies.every(id=>Object.hasOwn(status,id)))return true;status[n.id]=n.dependencies.some(id=>status[id]!=='succeeded')?'blocked':n.id===f.failure?'failed':'succeeded';progress=true;return false;});if(!progress)throw new Error('Dependency cycle or missing dependency.');}
        return {tasks:status,prediction:Object.keys(status).filter(id=>status[id]==='blocked').join(', ')};
      }
      case 'recovery': {const copies=f.snapshots.filter(s=>s.complete<=f.failureTime).sort((a,b)=>b.capture-a.capture);if(!copies.length)return {recoverableState:null,prediction:null};return {failureMinute:f.failureTime,latestCompletedCapture:copies[0].capture,dataAgeMinutes:f.failureTime-copies[0].capture,prediction:f.failureTime-copies[0].capture};}
      case 'metrics': {const predicted=f.truePositives+f.falsePositives,actual=f.truePositives+f.falseNegatives,precision=predicted?Math.round(1000*f.truePositives/predicted)/10:null,recall=actual?Math.round(1000*f.truePositives/actual)/10:null;return {precisionPercent:precision,recallPercent:recall,prediction:precision};}
      case 'retrieval': {const allowed=new Set(f.allowedAudiences),rows=f.chunks.filter(c=>allowed.has(c.audience)).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));return {authorizedChunks:rows,excludedCount:f.chunks.length-rows.length,prediction:rows[0]?.id||'none'};}
      case 'constraints':return {sentence:f.sentence,constraints:f.constraints,prediction:f.constraints.length};
      default:throw new Error('Unknown workshop fixture.');
    }
  }
  function checkPrediction(value, expected) {
    if(expected===null || expected===undefined || !String(value).trim())return false;
    if(typeof expected==='number'){const parsed=Number(String(value).trim().replace(',','.'));return Number.isFinite(parsed)&&Math.abs(parsed-expected)<0.051;}
    return String(value).trim().toLowerCase()===String(expected).trim().toLowerCase();
  }
  function defaultState() {return {version:1, completed:[], bookmarks:[], attempts:[], vocab:{}, english:true, exam:null,labProgress:{},reviewTopics:[],briefed:[],missionCompletions:[],focus:null,theme:'system',retired:{bookmarks:[],attempts:[]},streak:{days:0,last:null,best:0}};}
  function validateProgress(input, lessonIds, questionIds, termIds, workshopSpecs = []) {
    if (!input || input.version !== 1 || typeof input !== 'object') throw new Error('Unsupported progress file.');
    const out = defaultState(), l = new Set(lessonIds), q = new Set(questionIds), t = new Set(termIds);
    out.completed = [...new Set((Array.isArray(input.completed) ? input.completed : []).filter(x=>l.has(x)))];
    out.bookmarks = [...new Set([...(Array.isArray(input.bookmarks)?input.bookmarks:[]),...(Array.isArray(input.retired?.bookmarks)?input.retired.bookmarks:[])].filter(x=>q.has(x)))];
    out.english = input.english !== false;
    out.theme = ['light','dark','system'].includes(input.theme) ? input.theme : 'system';
    out.reviewTopics = [...new Set((Array.isArray(input.reviewTopics) ? input.reviewTopics : []).filter(id=>l.has(id)))];
    out.briefed = [...new Set((Array.isArray(input.briefed) ? input.briefed : []).filter(id=>l.has(id)))];
    out.missionCompletions = [...new Set((Array.isArray(input.missionCompletions) ? input.missionCompletions : []).filter(id=>['duplicates','scan','quality'].includes(id)))];
    if(input.focus&&l.has(input.focus.lessonId)&&(input.focus.questionId===null||q.has(input.focus.questionId))){
      out.focus={lessonId:input.focus.lessonId,questionId:input.focus.questionId,step:Math.max(0,Math.min(3,Math.floor(Number(input.focus.step)||0))),selected:[...new Set((Array.isArray(input.focus.selected)?input.focus.selected:[]).filter(x=>/^[A-Z]$/.test(x)))],checked:input.focus.checked===true};
    }
    // Restore live bookmarks and attempts from exports made before the supplied bank was reinstated.
    const retiredId=id=>typeof id==='string'&&/^imp-\d+$/.test(id)&&Number(id.slice(4))>=1&&Number(id.slice(4))<=349;
    out.retired.bookmarks=[...new Set([...(Array.isArray(input.bookmarks)?input.bookmarks:[]),...(Array.isArray(input.retired?.bookmarks)?input.retired.bookmarks:[])].filter(id=>retiredId(id)&&!q.has(id)))];
    out.retired.attempts=[...(Array.isArray(input.attempts)?input.attempts:[]),...(Array.isArray(input.retired?.attempts)?input.retired.attempts:[])].filter(a=>a&&retiredId(a.id)&&!q.has(a.id)&&Array.isArray(a.selected)&&a.selected.every(x=>/^[A-Z]$/.test(x))&&Number.isFinite(a.at)&&typeof a.correct==='boolean').slice(-2000).map(a=>({id:a.id,selected:a.selected,correct:a.correct,at:a.at,verified:false}));
    const candidates=[...(Array.isArray(input.retired?.attempts)?input.retired.attempts:[]).map(a=>a&&typeof a==='object'?{...a,verified:false}:a),...(Array.isArray(input.attempts)?input.attempts:[])];
    out.attempts=[...new Map(candidates.filter(a=>a&&q.has(a.id)&&Array.isArray(a.selected)&&a.selected.every(x=>/^[A-Z]$/.test(x))&&Number.isFinite(a.at)&&typeof a.correct==='boolean').map(a=>[a.id+'@'+a.at+'@'+a.selected.join(','),{id:a.id,selected:a.selected,correct:a.correct,at:a.at,verified:a.verified===true}])).values()].sort((a,b)=>a.at-b.at).slice(-2000);
    for (const [id, value] of Object.entries(input.vocab || {})) if (t.has(id) && value && typeof value === 'object') out.vocab[id]={known:value.known === true,saved:true};
    for(const w of workshopSpecs){const p=input.labProgress?.[w.id];if(p&&typeof p==='object')out.labProgress[w.id]={steps:[...new Set((Array.isArray(p.steps)?p.steps:[]).filter(id=>w.steps.some(s=>s.id===id)))],prediction:typeof p.prediction==='string'?p.prediction.slice(0,300):'',revealed:p.revealed===true,completed:p.completed===true};}
    if (input.exam && Array.isArray(input.exam.ids) && input.exam.ids.length && input.exam.ids.length<=50 && input.exam.ids.every(id=>q.has(id)&&/^lab-\d+$/.test(id)) && new Set(input.exam.ids).size === input.exam.ids.length && Number.isFinite(input.exam.deadline) && Number.isFinite(input.exam.startedAt)) {
      const answers={}; for(const id of input.exam.ids) {const a=input.exam.answers?.[id]; if(Array.isArray(a) && a.every(x=>/^[A-Z]$/.test(x))) answers[id]=[...new Set(a)];}
      out.exam={ids:input.exam.ids,answers,index:Math.max(0,Math.min(input.exam.ids.length-1,Math.floor(Number(input.exam.index)||0))),startedAt:input.exam.startedAt,deadline:input.exam.deadline,finished:input.exam.finished === true,recorded:input.exam.recorded === true,difficulty:['Foundation','Applied','mixed'].includes(input.exam.difficulty)?input.exam.difficulty:'mixed'};
    }
    out.streak=cleanStreak(input.streak);
    return out;
  }
  const MAX_STREAK=36500;
  function dayNumber(iso){
    if(typeof iso!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(iso))return null;
    const [y,m,d]=iso.split('-').map(Number),t=Date.UTC(y,m-1,d),dt=new Date(t);
    return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d&&y>=2000&&y<=2200?Math.round(t/86400000):null;
  }
  function cleanStreak(raw){
    const out={days:0,last:null,best:0};
    if(!raw||typeof raw!=='object')return out;
    const clamp=v=>Math.max(0,Math.min(MAX_STREAK,Math.floor(Number(v))||0));
    if(dayNumber(raw.last)!==null){out.last=raw.last;out.days=clamp(raw.days);}
    out.best=Math.max(clamp(raw.best),out.days);
    return out;
  }
  // Records one calendar day of study. A gap restarts the count at 1 for today and always keeps "best". Never mutates its input.
  function touchStreak(state,dateISO){
    const cur=cleanStreak(state&&state.streak),today=dayNumber(dateISO);
    if(today===null)return {...state,streak:cur};
    const last=cur.last===null?null:dayNumber(cur.last);
    let days;
    if(last===null)days=1;
    else if(today<last)return {...state,streak:cur};
    else if(today===last)days=Math.max(1,cur.days);
    else if(today-last===1)days=Math.min(MAX_STREAK,cur.days+1);
    else days=1;
    return {...state,streak:{days,last:today<last?cur.last:dateISO,best:Math.max(cur.best,days)}};
  }
  // Days to show today: a streak that was not continued yesterday or today reads as 0, without any message.
  function currentStreak(state,dateISO){
    const cur=cleanStreak(state&&state.streak),today=dayNumber(dateISO),last=cur.last===null?null:dayNumber(cur.last);
    return today!==null&&last!==null&&today-last<=1&&today>=last?cur.days:0;
  }
  // Marks are derived from completed lessons and never stored.
  function domainMarks(state,domains,lessons){
    const done=new Set(Array.isArray(state&&state.completed)?state.completed:[]),marks={};
    for(const d of domains){const own=lessons.filter(l=>l.domain===d.id);marks[d.id]=own.length>0&&own.every(l=>done.has(l.id));}
    return marks;
  }
  function localDate(d=new Date()){const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());}
  const MARK_SVG='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  // Gentle rewards markup: a study-days chip and one badge per domain. Static, text labels, no warnings.
  function rewardsHtml(state,domains,lessons,dateISO,esc,full){
    const days=currentStreak(state,dateISO),marks=domainMarks(state,domains,lessons),best=cleanStreak(state&&state.streak).best;
    const chip='<span class="reward-chip">Days studied in a row: '+days+(best>days?' <span class="reward-best">(best '+best+')</span>':'')+'</span>';
    const earned=domains.filter(d=>marks[d.id]);
    if(!full)return '<p class="rewards-line">'+chip+(earned.length?' <span class="reward-chip">'+earned.length+' of '+domains.length+' domain marks earned</span>':'')+'</p>';
    return '<section class="panel rewards"><h2>Gentle rewards</h2><p>'+chip+'</p><ul class="mark-list">'+domains.map(d=>'<li class="domain-mark'+(marks[d.id]?' earned':'')+'">'+(marks[d.id]?MARK_SVG+' ':'')+esc(d.name)+': '+(marks[d.id]?'mark earned':'not yet earned')+'</li>').join('')+'</ul><p class="small muted">A mark appears when every lesson in a domain is complete. Your count restarts quietly after a rest day and your best is kept.</p></section>';
  }
  const FOCUS_KEY = 'data-engineer-fieldnotes.focus.v1';
  function parseFocusPreference(raw) {return raw === '1';}
  function serializeFocusPreference(on) {return on === true ? '1' : '0';}
  function toggleFocus(on) {return on !== true;}
  function focusProgress(done, total) {
    const d = Number(done), t = Number(total);
    if (!Number.isFinite(d) || !Number.isFinite(t) || t <= 0) return 0;
    return Math.max(0, Math.min(1, d / t));
  }
  function isTypingTarget(el) {
    return !!(el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable === true));
  }
  function isFocusShortcut(ev) {
    return !!ev && ev.key === 'f' && !ev.ctrlKey && !ev.metaKey && !ev.altKey && !ev.shiftKey && !isTypingTarget(ev.target);
  }
  const LANG_KEY = 'data-engineer-fieldnotes.lang.v1';
  function parseLang(raw) {return raw === 'es' ? 'es' : 'en';}
  function serializeLang(lang) {return lang === 'es' ? 'es' : 'en';}
  function toggleLang(lang) {return lang === 'es' ? 'en' : 'es';}
  root.FieldCore = {LANG_KEY, parseLang, serializeLang, toggleLang, FOCUS_KEY, parseFocusPreference, serializeFocusPreference, toggleFocus, focusProgress, isFocusShortcut, equalAnswers, quotas, shuffle, makeExam, scoreExam, EVENTS, simulateStream, scanModel, runWorkshop, checkPrediction, defaultState, validateProgress, touchStreak, currentStreak, domainMarks, localDate, rewardsHtml};
})(globalThis);
