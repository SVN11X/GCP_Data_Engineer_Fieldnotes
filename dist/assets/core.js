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
  function makeExam(questions, size, domains, random = Math.random) {
    const counts = quotas(size, domains), result = [];
    for (const d of domains) {
      const pool = questions.filter(q => q.origin === 'authored' && q.gradable && q.domain === d.id);
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
  function defaultState() {return {version:1, completed:[], bookmarks:[], attempts:[], vocab:{}, english:true, exam:null};}
  function validateProgress(input, lessonIds, questionIds, termIds) {
    if (!input || input.version !== 1 || typeof input !== 'object') throw new Error('Unsupported progress file.');
    const out = defaultState(), l = new Set(lessonIds), q = new Set(questionIds), t = new Set(termIds);
    out.completed = [...new Set((Array.isArray(input.completed) ? input.completed : []).filter(x=>l.has(x)))];
    out.bookmarks = [...new Set((Array.isArray(input.bookmarks) ? input.bookmarks : []).filter(x=>q.has(x)))];
    out.english = input.english !== false;
    out.attempts = (Array.isArray(input.attempts) ? input.attempts : []).filter(a => a && q.has(a.id) && Array.isArray(a.selected) && a.selected.every(x => /^[A-Z]$/.test(x)) && Number.isFinite(a.at) && typeof a.correct === 'boolean').slice(-2000).map(a=>({id:a.id,selected:a.selected,correct:a.correct,at:a.at,verified:a.verified===true}));
    for (const [id, value] of Object.entries(input.vocab || {})) if (t.has(id) && value && typeof value === 'object') out.vocab[id]={known:value.known === true,saved:true};
    if (input.exam && Array.isArray(input.exam.ids) && input.exam.ids.length && input.exam.ids.length<=50 && input.exam.ids.every(id=>q.has(id)&&/^lab-\d+$/.test(id)) && new Set(input.exam.ids).size === input.exam.ids.length && Number.isFinite(input.exam.deadline) && Number.isFinite(input.exam.startedAt)) {
      const answers={}; for(const id of input.exam.ids) {const a=input.exam.answers?.[id]; if(Array.isArray(a) && a.every(x=>/^[A-Z]$/.test(x))) answers[id]=[...new Set(a)];}
      out.exam={ids:input.exam.ids,answers,index:Math.max(0,Math.min(input.exam.ids.length-1,Math.floor(Number(input.exam.index)||0))),startedAt:input.exam.startedAt,deadline:input.exam.deadline,finished:input.exam.finished === true,recorded:input.exam.recorded === true};
    }
    return out;
  }
  root.FieldCore = {equalAnswers, quotas, shuffle, makeExam, scoreExam, EVENTS, simulateStream, scanModel, defaultState, validateProgress};
})(globalThis);
