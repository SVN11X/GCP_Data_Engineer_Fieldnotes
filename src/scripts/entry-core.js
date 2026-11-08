/* Entry paths, pure part: a stored choice, a small total state machine and the diagnostic helpers. Loaded on demand and added to FieldCore. */
(function (root) {
  'use strict';
  const FC = () => root.FieldCore;
  /* Entry paths: a stored choice plus a small, total state machine. Nothing here touches saved progress. */
  const PATH_KEY = 'data-engineer-fieldnotes.path.v1', DIAGNOSTIC_SIZE = 10;
  function parsePath(value) {return value === 'new' || value === 'know' ? value : null;}
  function serializePath(path) {return parsePath(path) || '';}
  const entryStart = () => ({name: 'welcome', step: 0, answers: []});
  function entryPath(s) {return s && s.name === 'orientation' ? 'new' : s && (s.name === 'diagnostic' || s.name === 'result') ? 'know' : null;}
  function entryNext(s, event) {
    try {
      const st = s && typeof s.name === 'string' && ['welcome', 'orientation', 'diagnostic', 'result'].includes(s.name) ? s : entryStart();
      const t = event && event.type, step = Number.isInteger(st.step) ? st.step : 0, answers = Array.isArray(st.answers) ? st.answers : [];
      const diagnostic = (n, a) => ({name: 'diagnostic', step: n, answers: a});
      switch (t) {
        case 'choose-new': return st.name === 'welcome' ? {name: 'orientation', step: 0, answers: []} : st;
        case 'choose-know': return st.name === 'welcome' ? diagnostic(0, []) : st;
        case 'answer': {
          const v = event.value;
          if (st.name !== 'diagnostic' || !Array.isArray(v) || !v.length || !v.every(x => typeof x === 'string' && x) || answers[step] !== undefined) return st;
          const a = [...answers]; a[step] = [...v]; return diagnostic(step, a);
        }
        case 'next':
          if (st.name !== 'diagnostic' || answers[step] === undefined) return st;
          return step >= DIAGNOSTIC_SIZE - 1 ? {name: 'result', step: DIAGNOSTIC_SIZE - 1, answers} : diagnostic(step + 1, answers);
        case 'back':
          if (st.name === 'orientation') return entryStart();
          if (st.name === 'result') return diagnostic(DIAGNOSTIC_SIZE - 1, answers);
          if (st.name === 'diagnostic') return step > 0 ? diagnostic(step - 1, answers) : entryStart();
          return st;
        case 'switch-path':
          if (st.name === 'orientation') return diagnostic(0, []);
          if (st.name === 'diagnostic' || st.name === 'result') return {name: 'orientation', step: 0, answers: []};
          return st;
        case 'restart': return st.name === 'diagnostic' || st.name === 'result' ? diagnostic(0, []) : st;
        default: return st;
      }
    } catch (error) {return entryStart();}
  }
  function seededRandom(seed) {
    let a = (Number(seed) >>> 0) || 1;
    return () => {a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296;};
  }
  /* Reads authored, gradable questions only. Imported questions are never used. Only single-answer items are used, so each screen takes one click. */
  function pickDiagnostic(questions, domains, random = Math.random, size = DIAGNOSTIC_SIZE) {
    const counts = FC().quotas(size, domains), ids = [];
    for (const d of domains) {
      const all = questions.filter(q => q.origin === 'authored' && q.gradable === true && q.domain === d.id && Array.isArray(q.choices) && q.choices.length);
      const pool = all.filter(q => q.required === 1);
      if (pool.length < counts[d.id]) throw new Error('Not enough authored questions for domain ' + d.id);
      ids.push(...FC().shuffle(pool, random).slice(0, counts[d.id]).map(q => q.id));
    }
    return FC().shuffle(ids, random);
  }
  function scoreDiagnostic(ids, answers, questionMap, domains) {
    const per = Object.fromEntries(domains.map(d => [d.id, {correct: 0, total: 0}]));
    let correct = 0;
    ids.forEach((id, i) => {
      const q = questionMap[id]; if (!q || !per[q.domain]) return;
      const ok = answers && answers[i] !== undefined && FC().equalAnswers(answers[i], q.answer);
      per[q.domain].total++; if (ok) {per[q.domain].correct++; correct++;}
    });
    return {correct, total: ids.length, domains: per, weakest: weakestDomain(per, domains)};
  }
  /* Lowest share correct wins. Ties go to the heavier exam weight, then the lower id. Domains with no questions are ignored. */
  function weakestDomain(per, domains) {
    const rows = domains.filter(d => per[d.id] && per[d.id].total > 0).map(d => ({id: d.id, weight: d.weight, ratio: per[d.id].correct / per[d.id].total}));
    rows.sort((a, b) => a.ratio - b.ratio || b.weight - a.weight || a.id - b.id);
    return rows.length ? rows[0].id : null;
  }
  Object.assign(root.FieldCore, {PATH_KEY, DIAGNOSTIC_SIZE, parsePath, serializePath, entryStart, entryNext, entryPath, seededRandom, pickDiagnostic, scoreDiagnostic, weakestDomain});
})(globalThis);
