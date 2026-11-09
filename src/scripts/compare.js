/* Service comparisons: #review/compare (list) and #review/compare-<id> (one comparison). Loaded on demand with its own data file. */
(function(root){
'use strict';
const METHODS={'google-developer-knowledge-mcp':'Google Developer Knowledge MCP','official-page':'an official Google page'};
/* How many option cards fit in one row. Phones always get one column. */
function columnsFor(width,count){
 const n=Math.max(1,Math.floor(count)||1);
 if(!(width>=720))return 1;
 return Math.min(n,width<1100?2:3);
}
/* Split the options into rows of at most `columns` cards. The last row may be shorter. */
function layoutRows(items,columns){
 const size=Math.max(1,Math.floor(columns)||1),rows=[];
 for(let i=0;i<items.length;i+=size)rows.push(items.slice(i,i+size));
 return rows;
}
/* The plain data one option card shows. No HTML here. */
function optionCard(option){
 return {name:option.name,sections:[{label:'Choose it when',text:option.chooseWhen},{label:'Be careful when',text:option.beCarefulWhen}],sources:option.sources.map(url=>({url,host:new URL(url).hostname}))};
}
function checkedLine(entry){
 if(!entry)return 'Not yet verified against Google documentation.';
 return 'Checked '+entry.checkedOn+' against '+(METHODS[entry.method]||'Google documentation');
}
/* The newest log entry of a comparison, or null. Dates are YYYY-MM-DD so a text compare orders them. */
function entryFor(log,id){
 return log.filter(x=>x.kind==='comparison'&&x.topic===id).sort((a,b)=>a.checkedOn<b.checkedOn?1:-1)[0]||null;
}
root.FieldCompare={columnsFor,layoutRows,optionCard,checkedLine,entryFor,
 create({D,e,width=()=>globalThis.innerWidth}){
  const back=to=>`<a href="${to}" class="back-link">← ${to==='#review'?'Review plan':'All comparisons'}</a>`;
  function list(items){
   return `<div class="entry-page cmp-page">${back('#review')}<div class="eyebrow">COMPARE SERVICES</div><h1>Pick the right service</h1><p class="lead">Four decisions that appear often. Each page has a quick rule, the options side by side and the Google documentation behind them.</p><ul class="cmp-list">${items.map(c=>`<li><a href="#review/compare-${e(c.id)}" data-no-translate><b>${e(c.title)}</b><span>${e(c.question)}</span></a></li>`).join('')}</ul></div>`;
  }
  function detail(c,entry){
   if(!c)return list([]);
   const cards=c.options.map(optionCard),rows=layoutRows(cards,columnsFor(width(),cards.length));
   const lessons=(c.lessons||[]).map(id=>(D.lessons||[]).find(l=>l.id===id)).filter(Boolean);
   const card=x=>`<article class="cmp-card"><h3 data-no-translate>${e(x.name)}</h3>${x.sections.map(s=>`<h4>${e(s.label)}</h4><p data-no-translate>${e(s.text)}</p>`).join('')}<h4>Sources</h4><ul class="cmp-sources">${x.sources.map(s=>`<li><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.host)}<span class="sr-only"> (opens in a new tab)</span> ↗</a></li>`).join('')}</ul></article>`;
   return `<div class="entry-page cmp-page">${back('#review/compare')}<div class="eyebrow">COMPARE SERVICES</div><h1 data-no-translate>${e(c.title)}</h1><p class="lead" data-no-translate>${e(c.question)}</p><p class="cmp-rule"><b>Quick rule.</b> <span data-no-translate>${e(c.quickRule)}</span></p>${rows.map(r=>`<div class="cmp-row" style="--cols:${r.length}">${r.map(card).join('')}</div>`).join('')}<section class="cmp-check" aria-label="Verification"><p><b>${e(checkedLine(entry))}</b></p>${entry?`<p data-no-translate>${e(entry.note)}</p>`:''}</section>${lessons.length?`<section class="lesson-section"><h2>Related lessons</h2><ul class="entry-lessons">${lessons.map(l=>`<li><a href="#learn/${e(l.id)}" data-no-translate>${e(l.title)}</a></li>`).join('')}</ul></section>`:''}</div>`;
  }
  return {list,detail};
 }};
})(globalThis);
