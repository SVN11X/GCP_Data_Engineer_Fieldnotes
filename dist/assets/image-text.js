/* Readable alternatives are overlays; source images remain unchanged and accessible. */
(function(root){
'use strict';
function copyText(entry){
 if(entry.kind==='text')return entry.text;
 if(entry.kind==='table')return [entry.headers.join('\t'),...entry.groups.flatMap(g=>g.components.map((row,i)=>[i?'':g.row,i?'':g.id,i?'':g.name,...row].join('\t')))].join('\n');
 return '';
}
function textForHTML(html,assets){return [...String(html||'').matchAll(/assets\/images\/([^"/]+)"/g)].map(m=>assets[m[1]]?.transcription).filter(Boolean).map(copyText).join(' ');}
function render(html,assets,escape){
 return html.replace(/<img\s+[^>]*src="assets\/images\/([^"/]+)"[^>]*>/g,(whole,file)=>{
  const a=assets[file],src='assets/images/'+file,e=escape;
  if(a?.placeholder)return `<span class="asset-warning">The preserved source image is an unreadable ${a.width} × ${a.height} px placeholder.<a href="${e(src)}" target="_blank" rel="noopener">Open the original file ↗</a></span>`;
  const original=`<button type="button" class="image-open" data-action="open-image" data-file="${e(file)}" aria-label="Open original question image at full size">${whole}</button>`;
  const t=a?.transcription;
  if(!t)return original+'<span class="image-caption">Original supplied image · tap to inspect</span>';
  let content;
  if(t.kind==='table'){
   content=`<div class="table-wrap"><table class="transcribed-table"><caption>Data shown in the original table</caption><thead><tr>${t.headers.map(h=>`<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${t.groups.flatMap(g=>g.components.map((row,i)=>`<tr>${i?'':`<th scope="rowgroup" rowspan="${g.components.length}">${e(g.row)}</th><td rowspan="${g.components.length}">${e(g.id)}</td><td rowspan="${g.components.length}">${e(g.name)}</td>`}<td>${e(row[0])}</td><td>${e(row[1])}</td></tr>`)).join('')}</tbody></table></div>`;
  }else content=`<pre class="transcribed-code"><code>${e(t.text)}</code></pre>`;
  return `<figure class="image-transcription" data-source-image="${e(file)}"><figcaption>Selectable ${t.kind==='table'?'table':'text'} from the original image</figcaption>${content}<button type="button" class="button small" data-action="copy-image-text" data-file="${e(file)}">Copy ${t.kind==='table'?'table':'text'}</button><details class="original-image"><summary>View original image</summary>${original}</details></figure>`;
 });
}
root.FieldImageText={render,copyText,textForHTML};
})(globalThis);
