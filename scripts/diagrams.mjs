/* Renders content/diagrams/*.mmd to assets/diagrams/*.svg with Mermaid CLI. Run by hand: npm run diagrams.
   The SVG files are committed, so the build and CI never need a browser. Set PUPPETEER_EXECUTABLE_PATH to a local Chrome or Edge. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=process.env.PUPPETEER_EXECUTABLE_PATH;
if(!browser||!fs.existsSync(browser)){console.error('Set PUPPETEER_EXECUTABLE_PATH to an installed Chrome or Edge.');process.exit(2);}
const config=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'mmd-')),'puppeteer.json');
fs.writeFileSync(config,JSON.stringify({executablePath:browser,args:['--no-sandbox']}));
const mmdc=path.join(root,'node_modules','.bin',process.platform==='win32'?'mmdc.cmd':'mmdc');
const src=path.join(root,'content','diagrams'),out=path.join(root,'assets','diagrams');
fs.mkdirSync(out,{recursive:true});
let failed=0;
for(const f of fs.readdirSync(src).filter(n=>n.endsWith('.mmd'))){
 const target=path.join(out,f.replace(/\.mmd$/,'.svg'));
 const r=spawnSync(mmdc,['-i',path.join(src,f),'-o',target,'-p',config,'-b','transparent'],{stdio:'inherit',shell:process.platform==='win32'});
 if(r.status!==0){failed++;continue;}
 /* An image needs a fixed size: copy it from the viewBox so the page does not jump while loading. */
 let svg=fs.readFileSync(target,'utf8');const vb=/viewBox="[\d.\-]+ [\d.\-]+ ([\d.]+) ([\d.]+)"/.exec(svg);
 if(vb)svg=svg.replace(' width="100%"',` width="${Math.round(vb[1])}" height="${Math.round(vb[2])}"`).replace(/style="max-width: [\d.]+px; /,'style="');
 fs.writeFileSync(target,svg);console.log('Rendered',path.relative(root,target));
}
process.exit(failed?1:0);
