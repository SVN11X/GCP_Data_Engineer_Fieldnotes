/* Same-origin, demand-loaded content. No framework or remote search service. */
(function(root){
  'use strict';
  function create(data, fetcher, baseURL) {
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
    const add=(t,f)=>new Promise((ok,no)=>{const el=document.createElement(t);if(t==='link'){el.rel='stylesheet';el.href='assets/'+f+'?v='+data.release;}else el.src='assets/'+f+'?v='+data.release;el.onload=ok;el.onerror=no;document.head.append(el);});
    const entry=()=>pending.get('e')||pending.set('e',Promise.all([add('link','entry.css'),add('script','entry-core.js')]).then(()=>add('script','entry.js')).catch(x=>{pending.delete('e');throw x;})).get('e');
    async function ensure(route,id){
      if(['home','orientation','diagnostic'].includes(route)){const p=entry();await(route==='home'?p.catch(()=>{}):p);}
      if(route==='focus'){
        const lesson=data.lessons.find(l=>l.id===(id||'pipeline-contract'))||data.lessons.find(l=>l.id==='pipeline-contract');
        if(lesson)await Promise.all([lessons(lesson.domain),questions(lesson.domain)]);
      }
      if(route==='learn'&&id){const lesson=data.lessons.find(l=>l.id===id);if(lesson)await lessons(lesson.domain);}
      if(route==='practice'&&id){const question=data.questions.find(q=>q.id===id);if(question)await(question.origin==='imported'?importedQuestions(question.domain):questions(question.domain));}
      if((route==='practice'&&!id)||route==='progress')await importedCatalog();
      if(route==='diagnostic')await Promise.all(data.domains.map(d=>questions(d.id)));
      if(route==='exam')await Promise.all(data.domains.map(d=>questions(d.id)));
      if(route==='workshops')await load(data.manifest.workshops,v=>merge(data.workshops,v));
      if(route==='architectures')await load(data.manifest.architectures,v=>{data.architectures=v;});
      if(route==='sources')await Promise.all([
        load(data.manifest.knowledgeAudit,v=>{data.knowledgeAudit=v;}),
        load(data.manifest.verification,v=>{data.verification=v;})
      ]);
      if(route==='search')await load(data.manifest.search,v=>{
        if(v.release!==data.release)throw new Error('This page and its search index have different versions. Reload the page.');
        data.searchIndex=v.documents;
      });
    }
    return {ensure};
  }
  root.FieldLoader={create};
})(globalThis);
