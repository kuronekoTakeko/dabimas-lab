/* v4.3 research-only: retain alternative owned variant triples, with per-family diversity. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasCandidateSelector43=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=s=>String(s??'').normalize('NFKC').trim().toLowerCase();
const signature=c=>(c?.set||[]).map(r=>norm(r.id)).sort().join('|');
const weights={speed:{'短':5,'速':3,'走':2,'中':1},stamina:{'長':5,'中':3,'底':2,'走':1},balance:{'短':3,'速':3,'長':3,'走':2,'中':2,'底':1}};
function choose(candidates,goal='balance',perFamily=4,maxTotal=120){
 const w=weights[goal]||weights.balance,seen=new Set(),families=new Map();
 for(const c of candidates||[]){
  if(!Array.isArray(c?.set)||c.set.length!==3||new Set(c.set.map(r=>norm(r.id))).size!==3)continue;
  const all=c.set.flatMap(r=>Array.isArray(r.factors)?r.factors:[]);
  if(new Set(all).size<6)continue;
  const name=norm(c.base||c.set[0]?.name),sig=signature(c);if(!name||seen.has(sig))continue;seen.add(sig);
  const score=all.reduce((n,f)=>n+(w[f]||0),0);
  const entry={...c,researchScore:score,signature:sig};if(!families.has(name))families.set(name,[]);families.get(name).push(entry);
 }
 const order=(a,b)=>b.researchScore-a.researchScore||b.kinds?.length-a.kinds?.length||a.signature.localeCompare(b.signature,'ja');
 const pool=[...families.values()].flatMap(xs=>xs.sort(order).slice(0,Math.max(1,perFamily)));
 pool.sort(order);
 return pool.slice(0,Math.max(1,maxTotal));
}
return Object.freeze({choose,signature});
});
