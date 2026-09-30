(()=>{
'use strict';
const $=s=>document.querySelector(s), feed=$('#feed'), search=$('#feedSearch'), status=$('#syncLabel'), count=$('#cardCount'), refresh=$('#refreshFeed');
const endpoint='https://monitor-phi.marvaseater.workers.dev';
const keys={collection:'phiShared:collection:v1',quanta:'newsPhi:quantaCloudCards:v1',profile:'omniPhi:profile:v1',research:'omniPhi:lastResearch:v1',shares:'controlPhi:shareFeed:v1'};
let stories=[], generatedAt='';
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}};
function seeds(){
 const p=read(keys.profile,{collected:[]}),r=read(keys.research,null),cards=[...read(keys.quanta,[]),...read(keys.shares,[]),...read(keys.collection,[]),...(p.collected||[]),...(r?.sources||[])],out=[];
 for(const c of cards){const t=clean(c.searchQuery||c.sourceTitle||c.title);if(t&&!out.includes(t))out.push(t)}
 return out.slice(0,24);
}
function esc(v){return clean(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function render(){
 const q=clean(search.value).toLowerCase(), visible=stories.filter(s=>!q||[s.title,s.excerpt,s.topic,s.source].some(v=>clean(v).toLowerCase().includes(q)));
 count.textContent=stories.length+' current stories';
 if(!visible.length){feed.innerHTML='<div class="empty-feed"><h2>'+(stories.length?'No stories match that filter':'No current stories returned')+'</h2><p>'+(stories.length?'Try another word.':'Refresh to ask Monitor for current source-backed news from your Phi interests.')+'</p></div>';return}
 feed.innerHTML=visible.map(s=>`<article class="news-card"><div class="card-grid">${s.image?`<img class="card-image" src="${esc(s.image)}" alt="" loading="lazy" onerror="this.remove()">`:''}<div class="card-body"><div class="card-meta"><span>${esc(s.source||'News')}</span><span>${esc(s.publishedAt||'Current retrieval')}</span><span>${esc(s.topic||'Phi')}</span></div><h2>${esc(s.title)}</h2><p class="card-excerpt">${esc(s.excerpt)}</p><div class="card-actions"><a class="full" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Open source</a></div></div></div></article>`).join('');
}
async function load(){
 if(refresh.disabled)return;refresh.disabled=true;refresh.textContent='Refreshing…';status.textContent='Asking Monitor for current news…';
 try{
  await window.NewsPhiQuantaCloud?.refresh?.().catch(()=>null);
  const chosen=seeds(); if(!chosen.length){stories=[];generatedAt='';status.textContent='No Phi activity seeds yet';render();return}
  const res=await fetch(endpoint+'/p/news/feed',{method:'POST',cache:'no-store',headers:{'content-type':'application/json','cache-control':'no-cache'},body:JSON.stringify({seeds:chosen,depth:2,requestId:Date.now()})});
  if(!res.ok)throw new Error('Monitor HTTP '+res.status);
  const data=await res.json();stories=Array.isArray(data.stories)?data.stories.filter(s=>clean(s.title)&&clean(s.url)):[];generatedAt=clean(data.generatedAt)||new Date().toISOString();
  status.textContent='Monitor / SearXNG · '+new Date(generatedAt).toLocaleString()+' · '+stories.length+' stories';render();
 }catch(e){stories=[];status.textContent='Monitor retrieval failed · '+clean(e.message);render()}
 finally{refresh.disabled=false;refresh.textContent='Refresh'}
}
search.addEventListener('input',render);refresh.addEventListener('click',load);load();
})();