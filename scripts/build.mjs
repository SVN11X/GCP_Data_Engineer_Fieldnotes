import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateLog,warnings,assertNoGaps,comparisonIds} from './verification-log.mjs';
import {validateComparisons} from './comparisons.mjs';
import {validateOverlay,overlayDomains,readOverlay,esTitles} from './lesson-es.mjs';
import {validateOverlay as validateQuestionOverlay,overlayDomains as questionDomains,readOverlay as readQuestionOverlay,englishQuestions} from './question-es.mjs';
import {validateOverlay as validateImportedOverlay,overlayDomains as importedDomains,readOverlay as readImportedOverlay,englishImported} from './imported-es.mjs';
import {validateContentOverlay,overlayKinds,readOverlay as readContentOverlay,englishItems} from './content-es.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'content',n+'.json'),'utf8'));
const imported=read('imported'),imageText=read('image-text'),preservation=read('imported-preservation');
const data={version:2,updated:'2026-11-08',domains:read('domains'),lessons:read('lessons'),glossary:read('glossary'),sources:read('sources'),questions:[...read('curated'),...imported.questions],services:read('services'),workshops:read('workshops'),resources:read('resources'),sourceAudit:read('source-audit'),knowledgeAudit:read('knowledge-audit'),verification:read('verification'),architectures:read('architectures'),importAudit:{...imported.audit,scoredMockPool:'Timed sessions use the 124 authored questions; all 349 supplied questions remain available in the searchable practice bank.'},importProvenance:{sourceName:imported.sourceName,sha256:imported.sha256,reviewedOn:imported.reviewedOn,permissionBasis:preservation.permissionBasis},preservation,assets:Object.fromEntries(Object.entries(imported.assetAudit).map(([file,meta])=>[file,{...meta,...(imageText[file]?{transcription:imageText[file]}:{})}]))};
const codeExamples={
 'warehouse-model':"-- Illustrative GoogleSQL: use your own project and schema.\nCREATE TABLE `project.analytics.orders`\nPARTITION BY DATE(order_time)\nCLUSTER BY customer_id AS\nSELECT * FROM `project.staging.validated_orders`;",
 'fidelity':"-- Deterministic deduplication requires a stable ordering key.\nSELECT * EXCEPT(row_number)\nFROM (\n  SELECT *, ROW_NUMBER() OVER (\n    PARTITION BY event_id\n    ORDER BY event_time DESC, ingestion_sequence DESC\n  ) AS row_number\n  FROM `project.staging.events`\n)\nWHERE row_number = 1;",
 'features':"-- Keep valid missing-data semantics; zero is not always appropriate.\nSELECT\n  price / NULLIF(square_feet, 0) AS price_per_sqft,\n  IFNULL(feature1, 0) AS feature1_cleaned\nFROM `project.training.real_estate`;",
 'repeatability':"# Illustrative DAG dependencies, not a full deployable DAG.\nfetch_files >> decrypt_files >> load_staging >> transform_sql >> validate",
 'bad-records':"# Conceptual Beam flow: provide your own transform definitions.\nvalid, invalid = (\n    records\n    | beam.ParDo(ValidateRecord()).with_outputs(\n        'invalid', main='valid'\n    )\n)"
};
for (const l of data.lessons) if(codeExamples[l.id])l.code=codeExamples[l.id];

const output=path.join(root,'dist');
const dataDir=path.join(output,'data');
fs.mkdirSync(path.join(dataDir,'lessons'),{recursive:true});
fs.mkdirSync(path.join(dataDir,'questions'),{recursive:true});
fs.mkdirSync(path.join(dataDir,'imported'),{recursive:true});
// Build the deployable site: pages from src/, scripts and styles into dist/assets/, media from assets/.
const keep=file=>path.basename(file)!=='README.md';
fs.mkdirSync(path.join(output,'assets'),{recursive:true});
for(const page of ['index.html','credits.html'])fs.copyFileSync(path.join(root,'src',page),path.join(output,page));
fs.cpSync(path.join(root,'src/scripts'),path.join(output,'assets'),{recursive:true,filter:keep});
fs.copyFileSync(path.join(root,'src/styles/styles.css'),path.join(output,'assets/styles.css'));
for(const css of ['entry','review','compare'])fs.copyFileSync(path.join(root,'src/styles/'+css+'.css'),path.join(output,'assets/'+css+'.css'));
fs.cpSync(path.join(root,'assets'),path.join(output,'assets'),{recursive:true,filter:keep});
const write=(name,value)=>fs.writeFileSync(path.join(dataDir,name+'.json'),JSON.stringify(value)+'\n');
// Content-derived release keys prevent mixing a cached catalog with another release.
// Spanish lesson overlays (content/es/lessons-d<N>.json): a stale, unknown or unsafe entry fails the build. Missing entries fall back to English.
const esDomains=overlayDomains(),esOverlays=new Map(esDomains.map(d=>[d,readOverlay(d)]));
for(const [d,overlay] of esOverlays){const errors=validateOverlay(overlay,data.lessons.filter(l=>l.domain===d));if(errors.length)throw new Error('Invalid content/es/lessons-d'+d+'.json:'+String.fromCharCode(10)+errors.join(String.fromCharCode(10)));}
// Spanish overlays for services, comparisons, workshops and architectures (content/es/<kind>.json): same rules, same failure on a stale entry.
const esKinds=overlayKinds(),esContent=new Map(esKinds.map(k=>[k,readContentOverlay(k)]));
for(const [k,overlay] of esContent){const errors=validateContentOverlay(k,overlay,englishItems(k));if(errors.length)throw new Error('Invalid content/es/'+k+'.json:'+String.fromCharCode(10)+errors.join(String.fromCharCode(10)));}
// Spanish overlays for the authored questions (content/es/questions-d<N>.json): same rules, same failure on a stale entry.
const esQuestionDomains=questionDomains(),esQuestions=new Map(esQuestionDomains.map(d=>[d,readQuestionOverlay(d)]));
for(const [d,overlay] of esQuestions){const errors=validateQuestionOverlay(overlay,englishQuestions(d));if(errors.length)throw new Error('Invalid content/es/questions-d'+d+'.json:'+String.fromCharCode(10)+errors.join(String.fromCharCode(10)));}
// Spanish overlays for the imported questions (content/es/imported-d<N>.json): same rules plus html structure checks. A stale entry fails the build.
const esImportedDomains=importedDomains(),esImported=new Map(esImportedDomains.map(d=>[d,readImportedOverlay(d)]));
for(const [d,overlay] of esImported){const errors=validateImportedOverlay(overlay,englishImported(d));if(errors.length)throw new Error('Invalid content/es/imported-d'+d+'.json:'+String.fromCharCode(10)+errors.join(String.fromCharCode(10)));}
const release=crypto.createHash('sha256').update(JSON.stringify(data)).update(JSON.stringify([...esOverlays])).update(JSON.stringify([...esContent])).update(JSON.stringify([...esQuestions])).update(JSON.stringify([...esImported])).digest('hex').slice(0,16);
data.release=release;
for(const d of data.domains){write('lessons/domain-'+d.id,data.lessons.filter(l=>l.domain===d.id));write('questions/domain-'+d.id,data.questions.filter(q=>q.domain===d.id&&q.origin==='authored'));write('imported/domain-'+d.id,data.questions.filter(q=>q.domain===d.id&&q.origin==='imported'));}
for(const key of ['workshops','architectures','knowledgeAudit','verification'])write(key,data[key]);
fs.mkdirSync(path.join(dataDir,'es','lessons'),{recursive:true});
for(const [d,overlay] of esOverlays)write('es/lessons/domain-'+d,overlay);
// Titles index for list pages: lesson id -> Spanish title and lead (with the same hash rule), for every translated lesson of every domain.
write('es/titles',esTitles(esOverlays));
for(const [k,overlay] of esContent)write('es/'+k,overlay);
fs.mkdirSync(path.join(dataDir,'es','questions'),{recursive:true});
for(const [d,overlay] of esQuestions)write('es/questions/domain-'+d,overlay);
fs.mkdirSync(path.join(dataDir,'es','imported'),{recursive:true});
for(const [d,overlay] of esImported)write('es/imported/domain-'+d,overlay);
// Verification log: validated, then served as its own demand-loaded file. Missing records fail the build, entries older than 90 days only warn.
const verificationLog=read('verification-log'),logIds={lesson:data.lessons.map(l=>l.id),service:data.services.map(x=>x.id),comparison:comparisonIds(path.join(root,'content'))};
const logErrors=validateLog(verificationLog,logIds);
if(logErrors.length)throw new Error('Invalid content/verification-log.json:\n'+logErrors.join('\n'));
assertNoGaps(verificationLog,logIds);
write('verification-log',verificationLog);
// Comparisons: validated against the log and the lessons, then served as a demand-loaded file.
const comparisons=read('comparisons'),comparisonErrors=validateComparisons(comparisons,verificationLog,logIds.lesson);
if(comparisonErrors.length)throw new Error('Invalid content/comparisons.json:\n'+comparisonErrors.join('\n'));
write('comparisons',comparisons);
// Spanish interface dictionary: validated, then served as a demand-loaded file that only Spanish visitors request.
await import('../src/scripts/i18n.js');
const i18nRaw=fs.readFileSync(path.join(root,'content','i18n-es.json'),'utf8'),i18nDict=JSON.parse(i18nRaw);
const i18nErrors=[...globalThis.FieldI18n.validate(i18nDict),...globalThis.FieldI18n.duplicateKeys(i18nRaw).map(k=>'duplicate key "'+k+'"')];
if(i18nErrors.length)throw new Error('Invalid content/i18n-es.json:'+String.fromCharCode(10)+i18nErrors.join(String.fromCharCode(10)));
write('i18n-es',i18nDict);
// BUILD_DATE (YYYY-MM-DD) makes the 90 day rule reproducible in tests.
for(const line of warnings(verificationLog,logIds,process.env.BUILD_DATE||new Date().toISOString().slice(0,10)))console.warn('WARNING: '+line);
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const imageSearch=q=>[...new Set([...((q.html||'')+' '+q.choices.map(c=>c.html||'').join(' ')).matchAll(/assets\/images\/([^\"/]+)\"/g)].map(m=>m[1]))].map(file=>{const t=imageText[file];return !t?'':t.kind==='text'?t.text:t.groups.map(g=>[g.row,g.id,g.name,...g.components.flat()].join(' ')).join(' ');}).join(' ');
const search=[];
const add=(type,id,title,summary,href,domain,text)=>search.push({type,id,title,summary,href,domain,search:normalize(text)});
for(const l of data.lessons)add('Lesson',l.id,l.title,l.lead,'#learn/'+l.id,l.domain,[l.title,l.lead,...l.sections.map(s=>s.body),l.trap,...Object.values(l.briefing||{}),...(l.keywords||[])].join(' '));
for(const q of data.questions)add('Practice',q.id,q.text,q.origin==='authored'?'Original scenario · objective '+q.objective:'Imported #'+q.number+' · '+q.status,'#practice/'+q.id,q.domain,[q.text,...q.choices.map(c=>c.transcription||c.text),imageSearch(q)].join(' '));
for(const s of data.services)add('Service',s.id,s.name,s.fit,'#compare/'+s.id,0,[s.name,s.category,s.fit,s.signal,s.caution].join(' '));
for(const g of data.glossary)add('Vocabulary',g.id,g.term,g.meaning,'#english/'+g.id,0,[g.term,g.es,g.meaning,g.example].join(' '));
for(const w of data.workshops)add('Workshop',w.id,w.title,w.goal,'#workshops/'+w.id,w.domain,[w.title,w.goal,...w.steps.map(s=>s.text)].join(' '));
for(const a of data.architectures)add('Architecture',a.id,a.title,a.goal,'#architectures/'+a.id,a.domain,[a.title,a.goal,...a.nodes.map(n=>n.label+' '+n.detail)].join(' '));
for(const r of data.resources.items)add('Resource',r.id,r.title,r.use,'#resources',0,r.title+' '+r.use);
write('search-index',{release,documents:search});
const pick=(obj,keys)=>Object.fromEntries(keys.filter(k=>obj[k]!==undefined).map(k=>[k,obj[k]]));
const questionKeys=['id','number','origin','domain','objective','lesson','text','required','difficulty','gradable','status','references','hasImages'];
write('imported/catalog',imported.questions.map(q=>({...pick(q,questionKeys),choices:[],search:normalize(q.text+' '+q.choices.map(c=>c.transcription||c.text).join(' ')+' '+imageSearch(q))})));
const boot={...data,preservation:undefined,importedQuestionMeta:imported.questions.map(q=>[q.number,q.domain,q.lesson,q.required,q.status,q.gradable,q.hasImages]),lessons:data.lessons.map(l=>pick(l,['id','domain','objective','title','minutes','lead','level','reviewed','review','references','keywords'])),questions:data.questions.filter(q=>q.origin==='authored').map(q=>({...pick(q,questionKeys),choices:[],search:normalize(q.choices.map(c=>c.text).join(' '))})),workshops:data.workshops.map(w=>pick(w,['id','title','domain','lessons','goal','minutes','mode','steps','references'])),sourceAudit:{...data.sourceAudit,results:data.sourceAudit.results.map(r=>pick(r,['id','available','status']))},architectures:[],knowledgeAudit:null,verification:null,manifest:{release,lessons:'data/lessons/domain-',lessonsEs:'data/es/lessons/domain-',esTitles:'data/es/titles.json',esDomains,esContent:esKinds,esQuestions:esQuestionDomains,questionsEs:'data/es/questions/domain-',esImported:esImportedDomains,importedEs:'data/es/imported/domain-',questions:'data/questions/domain-',imported:'data/imported/domain-',importedCatalog:'data/imported/catalog.json',workshops:'data/workshops.json',architectures:'data/architectures.json',knowledgeAudit:'data/knowledgeAudit.json',verification:'data/verification.json',search:'data/search-index.json'}};
const encoded=JSON.stringify(boot).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
const seed='\nfor(const [number,domain,lesson,required,status,gradable,hasImages] of FIELDNOTES_DATA.importedQuestionMeta)FIELDNOTES_DATA.questions.push({id: "imp-"+number,number,domain,lesson,required,status,gradable,hasImages,origin:"imported",text:"",search:"",choices:[],references:[]});\ndelete FIELDNOTES_DATA.importedQuestionMeta;\n';
fs.writeFileSync(path.join(output,'assets/data.js'),'/* Generated catalog; full content is loaded by route. */\nglobalThis.FIELDNOTES_DATA = '+encoded+';'+seed);
write('study-pack',data);
const sourceLines=ids=>[...new Set(ids)].map(id=>'- '+data.sources[id].title+': '+data.sources[id].url);
const markdown=['# Data Engineer Fieldnotes','Independent learning notes. The supplied 349-question bank is preserved in the JSON study pack and interactive practice; course copies and complete video transcripts are not included.','Reviewed: '+data.updated,'## Learning route',...data.lessons.flatMap(l=>['\n### '+l.objective+' · '+l.title,l.lead,'Why it matters: '+l.briefing.whyItMatters,'Context: '+l.briefing.context,'Keep one idea: '+l.briefing.takeaway,'Review: '+l.review.status+' · '+l.review.checked,...l.sections.flatMap(s=>['\n**'+s.title+'**',s.body]),...(l.code?['```',l.code,'```']:[]),'Common trap: '+l.trap,'Try it: '+l.exercise.prompt,'Reasoning: '+l.exercise.answer,...l.exercise.checkpoints.map(x=>'- '+x),'References:',...sourceLines(l.references)]),'\n## Guided workshops','All fixtures are synthetic and run locally. No Google Cloud resources are executed.',...data.workshops.flatMap(w=>['\n### '+w.title,w.goal,...w.steps.map((s,i)=>`${i+1}. ${s.text}`),'```json',JSON.stringify(w.fixture,null,2),'```','Prediction: '+w.prediction.prompt,'Answer: '+w.prediction.answer+' '+w.prediction.unit,w.explanation,...(w.code?['```',w.code,'```']:[]),...sourceLines(w.references)])].join('\n');
fs.writeFileSync(path.join(dataDir,'study-notes.md'),markdown+'\n\n## Architecture patterns\n'+data.architectures.flatMap(a=>['\n### '+a.title,a.goal,...a.nodes.map((n,i)=>(i+1)+'. '+n.label+': '+n.detail),'Accepted path: '+a.success,'Rejected path: '+a.failure,a.scope,...sourceLines(a.references)]).join('\n')+'\n');
const guide=['# Data Engineer decision field guide','Reviewed: '+data.updated,...data.services.flatMap(s=>['\n## '+s.name+' · '+s.category,'Good fit: '+s.fit,'Signal: '+s.signal,'Check: '+s.caution,...sourceLines([s.reference])]),'\n## Review scope',data.verification.method].join('\n');
fs.writeFileSync(path.join(dataDir,'field-guide.md'),guide+'\n');
fs.writeFileSync(path.join(output,'.nojekyll'),'');
const inventory=['# Content inventory','Generated by npm run build. Original learning notes, cases and diagrams plus the 349 owner-supplied imported questions and 25 unchanged source images. The imported collection remains separately labelled.','## Lessons','| Objective | Lesson | Review | Primary references |','| --- | --- | --- | --- |',...data.lessons.map(l=>`| ${l.objective} | ${l.title} (${l.id}) | ${l.review.status}, ${l.review.checked} | ${l.references.map(id=>`[${id}](${data.sources[id].url})`).join(', ')} |`),'## Practice',`${data.questions.length} questions: 124 authored (100 retained and 24 new) plus all 349 supplied imports. Original source keys, review status and associated images are preserved. The private Path 16 provider quiz resources are a separate research input and are not reconstructed.`,'## Supplied image presentation',`${Object.keys(imageText).length} checked readable alternatives: 10 text/code images and one structured table. All 25 original image files remain byte-for-byte available, including diagrams and existing tiny placeholders.`, '## Other content',`52 original context / purpose briefings, four-step short sessions and 3 original native SVG / HTML playgrounds; ${data.glossary.length} English terms with Spanish support; ${data.services.length} service cards; ${data.workshops.length} retained synthetic workshops; ${data.architectures.length} original interactive architectures. All 19 objectives have at least one lesson.`,'## Private research input',`Archive SHA-256: ${data.knowledgeAudit.sha256}. ${data.knowledgeAudit.counts.records} chunks; ${data.knowledgeAudit.counts.exactDuplicateTextChunks} exact repetitions. The public audit contains metadata and chunk IDs only. A document overlap does not certify the lesson claim.`,'## Sources',...Object.values(data.sources).map(s=>`- [${s.title}](${s.url}) — ${s.publisher}; ${s.kind}; editorial date ${s.checked}.`)];
fs.mkdirSync(path.join(root,'docs/reports'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/reports/content-inventory.md'),inventory.join('\n')+'\n');
const metrics={release,bootBytes:fs.statSync(path.join(output,'assets/data.js')).size,searchBytes:fs.statSync(path.join(dataDir,'search-index.json')).size,fullPackBytes:fs.statSync(path.join(dataDir,'study-pack.json')).size,lessons:data.lessons.length,questions:data.questions.length,terms:data.glossary.length,services:data.services.length,architectures:data.architectures.length};
write('build-metrics',metrics);
console.log(JSON.stringify(metrics,null,2));
