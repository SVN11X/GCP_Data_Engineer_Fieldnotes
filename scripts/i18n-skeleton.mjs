/* Lists the translatable strings of a domain with their English text, hash and state (ok, missing, stale).
   Usage:
     node scripts/i18n-skeleton.mjs <domain> [--missing] [--json]   list strings (only missing or stale with --missing)
     node scripts/i18n-skeleton.mjs <domain> --merge <file.json>      add plain translations {id:{path:"es"}} with fresh hashes */
import fs from 'node:fs';
import {status,coverage,readOverlay,englishLessons,overlayFile,merge,validateOverlay} from './lesson-es.mjs';
const args=process.argv.slice(2),domain=Number(args[0]);
if(!Number.isInteger(domain)||domain<1||domain>5){console.error('Usage: node scripts/i18n-skeleton.mjs <domain 1-5> [--missing] [--json] [--merge file.json]');process.exit(2);}
const lessons=englishLessons(domain),overlay=readOverlay(domain);
const mi=args.indexOf('--merge');
if(mi>=0){
 const merged=merge(overlay,JSON.parse(fs.readFileSync(args[mi+1],'utf8')),lessons),errors=validateOverlay(merged,lessons);
 if(errors.length){console.error(errors.join('\n'));process.exit(1);}
 fs.mkdirSync(new URL('../content/es/',import.meta.url),{recursive:true});
 fs.writeFileSync(overlayFile(domain),JSON.stringify(merged,null,1)+'\n');
 const c=coverage(merged,lessons);console.log('Wrote '+overlayFile(domain)+': '+c.ok+' of '+c.total+' strings translated.');
}else{
 let rows=status(overlay,lessons);
 if(args.includes('--missing'))rows=rows.filter(r=>r.state!=='ok');
 if(args.includes('--json'))console.log(JSON.stringify(rows,null,1));
 else{for(const r of rows)console.log(r.state.padEnd(7)+' '+r.src+' '+r.id+':'+r.path+'\n        '+r.en);const c=coverage(overlay,lessons);console.log('\nDomain '+domain+': '+c.ok+' of '+c.total+' strings translated.');}
}
