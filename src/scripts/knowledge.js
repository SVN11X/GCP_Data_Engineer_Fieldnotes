/* Pure search and architecture rules, shared with the behavior tests. */
(function(root){
  'use strict';
  const normalize=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9/+.-]+/g,' ').trim();
  function search(documents,query,{type='all',domain=0}={}){
    const tokens=[...new Set(normalize(query).split(/\s+/).filter(Boolean))].slice(0,12);
    if(!tokens.length)return [];
    return documents.filter(d=>(type==='all'||d.type===type)&&(!domain||d.domain===Number(domain)))
      .map(d=>{const title=normalize(d.title),text=normalize(d.search+' '+d.summary);return {document:d,score:tokens.every(t=>title.includes(t)||text.includes(t))?tokens.reduce((n,t)=>n+(title===t?30:title.includes(t)?10:1),0)+(tokens.some(t=>title.includes(t))?(d.type==='Service'?5:d.type==='Lesson'?3:0):0):0};})
      .filter(r=>r.score>0).sort((a,b)=>b.score-a.score||a.document.title.localeCompare(b.document.title)).map(r=>r.document);
  }
  function architectureState(architecture,failed=false){
    const edges=architecture.edges.filter(edge=>edge.when==='always'||edge.when===(failed?'failure':'success'));
    return {edges,activeNodes:[...new Set(edges.flatMap(edge=>[edge.from,edge.to]))],outcome:failed?architecture.failure:architecture.success};
  }
  function pendingByDomain(domains,lessons,completed){
    const done=new Set(completed);
    return domains.map(d=>({id:d.id,weight:d.weight,total:lessons.filter(l=>l.domain===d.id).length,pending:lessons.filter(l=>l.domain===d.id&&!done.has(l.id)).map(l=>l.id)}));
  }
  root.FieldKnowledge={normalize,search,architectureState,pendingByDomain};
})(globalThis);
