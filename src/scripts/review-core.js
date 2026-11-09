/* Fast review, pure part: split review minutes by exam weight and build one-page domain summaries. Loaded on demand and added to FieldCore. Nothing here is stored. */
(function (root) {
  'use strict';
  /* Largest remainder split: whole minutes that add up to the total. Ties go to the heavier weight, then the lower position. */
  function splitMinutes(total, weights) {
    const n = Array.isArray(weights) ? weights.length : 0, t = Number.isFinite(total) && total > 0 ? Math.floor(total) : 0;
    if (!n) return [];
    const w = weights.map(x => (Number.isFinite(x) && x > 0 ? x : 0)), sum = w.reduce((a, b) => a + b, 0);
    const share = w.map(x => (sum > 0 ? t * x / sum : t / n)), out = share.map(Math.floor);
    let left = t - out.reduce((a, b) => a + b, 0);
    const order = share.map((s, i) => i).sort((a, b) => (share[b] - out[b]) - (share[a] - out[a]) || w[b] - w[a] || a - b);
    for (let k = 0; left > 0; k = (k + 1) % n, left--) out[order[k]]++;
    return out;
  }
  const objectivesOf = d => Object.entries(d.objectives || {}).map(([id, title]) => ({id, title}));
  const lessonsOf = (lessons, id) => lessons.filter(l => l.domain === id);
  /* Time plan: one row per domain with its minutes, official objectives and lessons in order. */
  function reviewPlan(domains, lessons, total) {
    const mins = splitMinutes(total, domains.map(d => d.weight));
    return domains.map((d, i) => ({id: d.id, name: d.name, weight: d.weight, minutes: mins[i], objectives: objectivesOf(d), lessons: lessonsOf(lessons, d.id).map(l => ({id: l.id, title: l.title, objective: l.objective}))}));
  }
  /* One-page summary: key facts are copied from existing lesson blocks only. Lessons without a block carry a null key fact. */
  function domainSummary(domains, lessons, id) {
    const d = domains.find(x => x.id === id);
    if (!d) return null;
    return {id: d.id, name: d.name, weight: d.weight, objectives: objectivesOf(d), lessons: lessonsOf(lessons, d.id).map(l => ({id: l.id, title: l.title, keyFact: l.block && l.block.keyFact ? l.block.keyFact : null}))};
  }
  Object.assign(root.FieldCore, {splitMinutes, reviewPlan, domainSummary});
})(globalThis);
