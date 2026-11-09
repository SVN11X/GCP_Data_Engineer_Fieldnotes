/* Same-origin, demand-loaded content. */
(function(root){
  'use strict';
  function create(data, fetcher, baseURL, getLang) {
    const pending=new Map();
    const merge=(target,items)=>{for(const item of items){const current=target.find(x=>x.id===item.id);if(current){if(current.choices?.length&&Array.isArray(item.choices)&&!item.choices.length){const {choices,...metadata}=item;Object.assign(current,metadata);}else Object.assign(current,item);}else target.push(item);}};
    function load(file,apply){
      if(pending.has(file))return pending.get(file);
      const url=new URL(file,baseURL);url.searchParams.set('v',data.release);
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),15000);
      const task=Promise.resolve().then(()=>fetcher(url.href,{signal:controller.signal,credentials:'omit'})).then(response=>{
        if(!response.ok)throw new Error('Content request failed ('+response.status+').');
        return response.json();
      }).then(value=>{apply(value);return value;}).catch(error=>{pending.delete(file);throw error;}).finally(()=>clearTimeout(timer));
      pending.set(file,task);return task;
    }
    function questions(domain){return load(data.manifest.questions+domain+'.json',v=>merge(data.questions,v));}
    function importedQuestions(domain){return load(data.manifest.imported+domain+'.json',v=>merge(data.questions,v));}
    function importedCatalog(){return load(data.manifest.importedCatalog,v=>merge(data.questions,v));}
    function lessons(domain){return load(data.manifest.lessons+domain+'.json',v=>merge(data.lessons,v));}
    /* Spanish lesson text: only for Spanish visitors and only for the domain being opened. Any failure leaves the English text. */
    async function localize(domain){
      const on=getLang?.()==='es';
      if(!on&&!pending.has('s'))return;
      try{
        if(!pending.has('s'))pending.set('s',add('script','lesson-es.js').catch(x=>{pending.delete('s');throw x;}));
        await pending.get('s');
        const known=(data.manifest.esDomains||[]).includes(domain);
        const overlay=on&&known?await load(data.manifest.lessonsEs+domain+'.json',()=>{}):null;
        await globalThis.FieldLessonEs.apply(data.lessons.filter(l=>l.domain===domain),overlay,on);
        globalThis.FieldLessonEs.overlay=overlay;
      }catch{}
    }
    /* Spanish titles and leads for lists. One small index for all domains, so list pages never load whole overlays. Any failure leaves English. */
    async function localizeTitles(){
      const on=getLang?.()==='es';
      if(!on&&!pending.has('s'))return;
      try{
        if(!pending.has('s'))pending.set('s',add('script','lesson-es.js').catch(x=>{pending.delete('s');throw x;}));
        await pending.get('s');
        const titles=on&&data.manifest.esTitles?await load(data.manifest.esTitles,()=>{}):null;
        await globalThis.FieldLessonEs.applyTitles(data.lessons,titles,on);
      }catch{}
    }
    /* Spanish text of the authored questions: only for Spanish visitors and only for the domains the route shows. Back in English every domain is restored. Any failure leaves English. */
    async function localizeQuestions(domains){
      const on=getLang?.()==='es';
      if(!on&&!pending.has('q'))return;
      try{
        if(!pending.has('s'))pending.set('s',add('script','lesson-es.js').catch(x=>{pending.delete('s');throw x;}));
        if(!pending.has('q'))pending.set('q',pending.get('s').then(()=>add('script','question-es.js')).catch(x=>{pending.delete('q');throw x;}));
        await pending.get('q');
        for(const d of on?domains:data.domains.map(x=>x.id)){
          const overlay=on&&(data.manifest.esQuestions||[]).includes(d)?await load(data.manifest.questionsEs+d+'.json',()=>{}):null;
          await globalThis.FieldQuestionEs.apply(data.questions.filter(q=>q.domain===d&&q.origin==='authored'),overlay,on);
        }
      }catch{}
    }
    /* Spanish text of the imported questions: only for Spanish visitors and only for domains whose imported bank is loaded.
       fetchIt=false only re-applies overlays that are already loaded (the list page merges English catalog text over loaded questions). Back in English every loaded domain is restored. Any failure leaves English. */
    async function localizeImported(domains,fetchIt=true){
      const on=getLang?.()==='es';
      if(!on&&!pending.has('i'))return;
      const todo=(on?domains:data.domains.map(x=>x.id)).filter(d=>pending.has(data.manifest.imported+d+'.json'));
      if(!todo.length)return;
      try{
        if(!pending.has('s'))pending.set('s',add('script','lesson-es.js').catch(x=>{pending.delete('s');throw x;}));
        if(!pending.has('i'))pending.set('i',pending.get('s').then(()=>add('script','imported-es.js')).catch(x=>{pending.delete('i');throw x;}));
        await pending.get('i');
        for(const d of todo){
          const file=(data.manifest.importedEs||'')+d+'.json',known=(data.manifest.esImported||[]).includes(d);
          if(on&&known&&!fetchIt&&!pending.has(file))continue;
          const overlay=on&&known?await load(file,()=>{}):null;
          await globalThis.FieldImportedEs.apply(data.questions.filter(q=>q.domain===d&&q.origin==='imported'&&q.choices.length),overlay,on);
        }
      }catch{}
    }
    /* Spanish text of services, comparisons, workshops and architectures. Only for Spanish visitors and only on the route that shows it. Any failure leaves English. */
    async function localizeContent(kind,items){
      const on=getLang?.()==='es';
      if(!on&&!pending.has('c'))return;
      try{
        if(!pending.has('s'))pending.set('s',add('script','lesson-es.js').catch(x=>{pending.delete('s');throw x;}));
        if(!pending.has('c'))pending.set('c',pending.get('s').then(()=>add('script','content-es.js')).catch(x=>{pending.delete('c');throw x;}));
        await pending.get('c');
        const overlay=on&&(data.manifest.esContent||[]).includes(kind)?await load('data/es/'+kind+'.json',()=>{}):null;
        await globalThis.FieldContentEs.apply(kind,items,overlay,on);
      }catch{}
    }
    const add=(t,f)=>new Promise((ok,no)=>{const el=document.createElement(t);if(t==='link'){el.rel='stylesheet';el.href='assets/'+f+'?v='+data.release;}else el.src='assets/'+f+'?v='+data.release;el.onload=ok;el.onerror=no;document.head.append(el);});
    const entry=()=>pending.get('e')||pending.set('e',Promise.all([add('link','entry.css'),add('script','entry-core.js')]).then(()=>add('script','entry.js')).catch(x=>{pending.delete('e');throw x;})).get('e');
    async function ensure(route,id){await ensureRoute(route,id);await localizeTitles();}
    async function ensureRoute(route,id){
      if(['home','orientation','diagnostic','review'].includes(route)){const p=entry();await(route==='home'?p.catch(()=>{}):p);}
      if(route==='focus'){
        const lesson=data.lessons.find(l=>l.id===(id||'pipeline-contract'))||data.lessons.find(l=>l.id==='pipeline-contract');
        if(lesson){await Promise.all([lessons(lesson.domain),questions(lesson.domain)]);await localize(lesson.domain);await localizeQuestions([lesson.domain]);}
      }
      if(route==='learn'&&id){pending.get('v')||pending.set('v',add('script','verification.js').catch(()=>{}));const lesson=data.lessons.find(l=>l.id===id);if(lesson){await lessons(lesson.domain);await localize(lesson.domain);}}
      if(route==='practice'&&id){const question=data.questions.find(q=>q.id===id);if(question){await(question.origin==='imported'?importedQuestions(question.domain):questions(question.domain));if(question.origin==='authored')await localizeQuestions([question.domain]);else await localizeImported([question.domain]);}}
      if((route==='practice'&&!id)||route==='progress'){await importedCatalog();await localizeQuestions(data.domains.map(d=>d.id));await localizeImported(data.domains.map(d=>d.id),false);}
      if(['diagnostic','exam','review'].includes(route)){await Promise.all(data.domains.map(d=>route==='review'?lessons(d.id):questions(d.id)));if(route!=='review')await localizeQuestions(data.domains.map(d=>d.id));}
      if(route==='resources'){data.resources.id='resources';data.resources.audit=data.sourceAudit;await localizeContent('resources',[data.resources]);await localizeContent('workshops',data.workshops);await localizeContent('services',data.services);}
      if(route==='compare')await localizeContent('services',data.services);
      if(route==='workshops'){await load(data.manifest.workshops,v=>merge(data.workshops,v));await localizeContent('workshops',data.workshops);}
      if(route==='architectures'){await load(data.manifest.architectures,v=>{data.architectures=v;});await localizeContent('architectures',data.architectures);}
      if(route==='sources')await Promise.all([
        load(data.manifest.knowledgeAudit,v=>{data.knowledgeAudit=v;}),
        load(data.manifest.verification,v=>{data.verification=v;})
      ]).then(()=>localizeContent('sources',[{id:'sources',knowledgeAudit:data.knowledgeAudit,verification:data.verification}]));
      if(route==='search')await load(data.manifest.search,v=>{
        if(v.release!==data.release)throw new Error('This page and its search index have different versions. Reload the page.');
        data.searchIndex=v.documents;
      });
    }
    return {ensure,content:localizeContent};
  }
  root.FieldLoader={create};
})(globalThis);
