/* Lists the translatable strings of a lesson domain or of a content kind with their English text, hash and state (ok, missing, stale).
   Usage:
     node scripts/i18n-skeleton.mjs <domain 1-5|services|comparisons|workshops|architectures> [--missing] [--json]   list strings (only missing or stale with --missing)
     node scripts/i18n-skeleton.mjs <domain|kind> --merge <file.json>      add plain translations {id:{path:"es"}} with fresh hashes */
import fs from 'node:fs';
import {status,coverage,readOverlay,englishLessons,overlayFile,merge,validateOverlay} from './lesson-es.mjs';
import * as C from './content-es.mjs';
import * as Q from './question-es.mjs';
const args=process.argv.slice(2),domain=Number(args[0]),kind=C.KINDS.includes(args[0])?args[0]:null,qd=/^questions-([1-5])$/.exec(args[0]||'')?.[1];
if(!kind&&!qd&&(!Number.isInteger(domain)||domain<1||domain>5)){console.error('Usage: node scripts/i18n-skeleton.mjs <domain 1-5|'+C.KINDS.join('|')+'> [--missing] [--json] [--merge file.json]');process.exit(2);}
/* One adapter for both sources, so listing and merging work the same way. */
const src=qd?{
 items:Q.englishQuestions(Number(qd)),overlay:Q.readOverlay(Number(qd)),file:Q.overlayFile(Number(qd)),label:'Authored questions, domain '+qd,
 status:(o,i)=>Q.status(o,i),coverage:(o,i)=>Q.coverage(o,i),merge:(o,p,i)=>Q.merge(o,p,i),validate:(o,i)=>Q.validateOverlay(o,i)
}:kind?{
 items:C.englishItems(kind),overlay:C.readOverlay(kind),file:C.overlayFile(kind),label:kind,
 status:(o,i)=>C.status(kind,o,i),coverage:(o,i)=>C.coverage(kind,o,i),merge:(o,p,i)=>C.merge(kind,o,p,i),validate:(o,i)=>C.validateContentOverlay(kind,o,i)
}:{
 items:englishLessons(domain),overlay:readOverlay(domain),file:overlayFile(domain),label:'Domain '+domain,
 status:(o,i)=>status(o,i),coverage:(o,i)=>coverage(o,i),merge:(o,p,i)=>merge(o,p,i),validate:(o,i)=>validateOverlay(o,i)
};
const mi=args.indexOf('--merge');
if(mi>=0){
 const merged=src.merge(src.overlay,JSON.parse(fs.readFileSync(args[mi+1],'utf8')),src.items),errors=src.validate(merged,src.items);
 if(errors.length){console.error(errors.join('\n'));process.exit(1);}
 fs.mkdirSync(new URL('../content/es/',import.meta.url),{recursive:true});
 fs.writeFileSync(src.file,JSON.stringify(merged,null,1)+'\n');
 const c=src.coverage(merged,src.items);console.log('Wrote '+src.file+': '+c.ok+' of '+c.total+' strings translated.');
}else{
 let rows=src.status(src.overlay,src.items);
 if(args.includes('--missing'))rows=rows.filter(r=>r.state!=='ok');
 if(args.includes('--json'))console.log(JSON.stringify(rows,null,1));
 else{for(const r of rows)console.log(r.state.padEnd(7)+' '+r.src+' '+r.id+':'+r.path+'\n        '+r.en);const c=src.coverage(src.overlay,src.items);console.log('\n'+src.label+': '+c.ok+' of '+c.total+' strings translated.');}
}
