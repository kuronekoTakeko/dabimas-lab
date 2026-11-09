/* v5.5 | Mild-only bounded two-position refinement, after v5.3 single swaps.
 * Evaluates whole nine-stage pedigrees through the application's real trial
 * evaluator. No synthetic ability or parent-line theory is asserted.
 * The pair search preserves the starting plan when it finds no improvement.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DabimasMildPairs55=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const norm=v=>String(v??'').normalize('NFKC').replace(/\s+/g,'').toLowerCase();
 const W={speed:{'走':5,'中':4,'短':3,'速':3,'長':1},stamina:{'中':5,'長':4,'底':3,'速':2,'走':2},balance:{'走':4,'中':4,'速':3,'長':3,'短':2}};
 const idOf=v=>typeof v==='string'?v:v?.id;
 function diversityShortlist(entries,initial,goal,count=10,includeExisting=true){
  const seen=new Set();const baseNames=new Set((initial?.full?.rows||[]).map(r=>norm(r.name||r.horse)).filter(Boolean));
  const weights=W[goal]||W.balance;
  const ranked=[];
  for(const entry of entries||[]){const id=idOf(entry);if(!id||seen.has(norm(id)))continue;seen.add(norm(id));
   const factors=[...(entry?.factors||[]),...(entry?.ancestry||[]).flatMap(a=>a.factors||[])];
   const factorScore=factors.reduce((v,f)=>v+(weights[f]||0),0);
   const shared=(entry?.ancestry||[]).filter(a=>baseNames.has(norm(a.horse||a.name))).length;
   ranked.push({id,score:factorScore+shared*2});
  }
  ranked.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id,'ja'));
  const cap=Math.max(2,Math.min(16,Math.trunc(Number(count)||10)));
  // Keep strong candidates and a spread from the tail: two individually weak
  // alternatives can work well together, so top-K alone is not sufficient.
  const lead=Math.min(ranked.length,Math.max(2,cap-3));
  const selected=ranked.slice(0,lead);
  const tail=ranked.slice(lead),missing=cap-selected.length;
  for(let i=0;i<missing&&i<tail.length;i++){
   const j=Math.min(tail.length-1,Math.floor((i+0.5)*tail.length/missing));
   if(!selected.some(x=>norm(x.id)===norm(tail[j].id)))selected.push(tail[j]);
  }
  // Include existing choices so a pure two-slot swap is a candidate.
  for(const id of includeExisting?Object.values(initial?.choices||{}):[]){
   if(id&&!selected.some(x=>norm(x.id)===norm(id)))selected.push({id,score:-1});
  }
  return selected.map(x=>x.id);
 }
 function rootReuseCount({records=[],roots=[],reuseApi}={}){
  if(typeof reuseApi?.pick!=='function')return 0;
  let matched=0;const used=[];
  for(const req of roots||[]){
   if(!req||req.ready===false||req?.ped?.known!==31||req.ped?.conflicts?.length)continue;
   const picked=reuseApi.pick(records,{
    step:req.step,sex:'male',sireId:req.sireId,mareId:req.mareId,
    lineage:req.lineage||'',rows:req.ped.rows},used);
   if(picked){matched++;used.push(picked.id);}
  }
  return matched;
 }
 function optimize({initial,mares=[],sires=[],evaluate,compare,goal='balance',budget=420,perSlot=10}={}){
  if(!initial||initial.matches!==3||initial.full?.known!==31||!initial.choices||typeof evaluate!=='function'||typeof compare!=='function')
   return {error:'完全な9工程の初期配合または研究評価関数がありません'};
  const limit=Math.max(0,Math.min(1400,Math.trunc(Number(budget)||0)));
  const pool=diversityShortlist(mares,initial,goal,perSlot);
  const xs=diversityShortlist(sires,initial,goal,Math.min(6,perSlot),false);
  let tests=0,valid=0,invalid=0,duplicate=0,stagePairs=0,xPairs=0;
  let best=initial;const keys=new Set();
  const sig=(c,x)=>[1,2,3,4,5,6].map(n=>norm(c[n])).join('\u001f')+'\u001e'+norm(x);
  keys.add(sig(initial.choices,initial.xId));
  const jobs=[];
  for(let a=1;a<=6;a++)for(let b=a+1;b<=6;b++)jobs.push({kind:'mare',a,b});
  if(xs.length)for(let a=1;a<=6;a++)jobs.push({kind:'x',a});
  let incumbent=best;
  // Rotate through all 15 distinct mare pairs (+6 X/mare pairs), preventing
  // an early-step bias when a user's device hits the bounded search limit.
  const maxi=Math.max(pool.length*pool.length,pool.length*xs.length);
  for(let i=0;i<maxi&&tests<limit;i++){
   for(const job of jobs){if(tests>=limit)break;
    const choices={...initial.choices};let xId=initial.xId;
    if(job.kind==='mare'){
     if(!pool.length)continue;
     choices[job.a]=pool[(i+job.a*7+job.b*3)%pool.length];
     choices[job.b]=pool[(i*5+Math.floor(i/pool.length)+job.b)%pool.length];
     if(norm(choices[job.a])===norm(initial.choices[job.a])||norm(choices[job.b])===norm(initial.choices[job.b]))continue;
    }else{
     if(!xs.length||!pool.length)continue;
     choices[job.a]=pool[(i*3+job.a)%pool.length];xId=xs[(Math.floor(i/pool.length)+job.a)%xs.length];
     if(norm(choices[job.a])===norm(initial.choices[job.a])||norm(xId)===norm(initial.xId))continue;
    }
    const chosen=[1,2,3,4,5,6].map(n=>norm(choices[n]));
    if(new Set(chosen).size!==6){duplicate++;continue;}
    const token=sig(choices,xId);if(keys.has(token))continue;keys.add(token);
    tests++;if(job.kind==='mare')stagePairs++;else xPairs++;
    let candidate=null;try{candidate=evaluate(choices,xId);}catch(_){candidate=null;}
    if(!candidate||candidate.matches!==3||candidate.full?.known!==31){invalid++;continue;}
    valid++;
    if(compare(candidate,incumbent,goal)<0)incumbent=candidate;
   }
  }
  if(compare(incumbent,best,goal)<0)best=incumbent;
  const changed=compare(best,initial,goal)<0;
  return {winner:best,improved:changed,audit:{schema:55,kind:'mild-bounded-two-position',goal,
   checked:tests,valid,invalid,duplicatesSkipped:duplicate,marePairTrials:stagePairs,xMareTrials:xPairs,
   limit,limited:tests>=limit,availableMares:(mares||[]).length,availableSires:(sires||[]).length,
   sampledMares:pool.length,sampledSires:xs.length,improved:changed,
   gameVerified:false,scope:'2枠同時変更の部分探索（全数・能力保証なし）'}};
 }
 return Object.freeze({diversityShortlist,rootReuseCount,optimize});
});
