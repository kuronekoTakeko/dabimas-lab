/* v7.1 — bounded two-mare lookahead for the MILD DDS route.
 * Not a stronger in-game pedigree claim: every proposal is re-built and
 * validated by the caller. Never touches stored plans or user data.
 * Existing birth-count and confirmed perfect/super-perfect evidence outrank
 * this optional research-only ranking.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildEfficiency71=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const N=[3,4,5,6,7];
 const norm=x=>String(x??'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
 function improve({initial,mares=[],evaluate,goal='balance',maxTests=35,projectDDS=false,refiner}={}){
  const first=refiner?.metric?.(initial,goal);
  if(!first||typeof evaluate!=='function'||typeof refiner?.compare!=='function'||typeof refiner?.shortlist!=='function')
   return {winner:initial,audit:{version:71,error:'最終血統・締め肌理論の確認が必要',tested:0,gameVerified:false}};
  const limit=Math.min(90,Math.max(0,Math.trunc(Number(maxTests))||0));
  // Keep a small, lineage-diverse pool. We revisit EVERY pair of stages
  // before moving to higher-ranked replacement pairs, avoiding first-pair bias.
  const poolSize=Math.min(9,mares.length);
  const pools=new Map(N.map(n=>[n,projectDDS&&refiner.projectedShortlist?refiner.projectedShortlist(mares,goal,poolSize,initial,n):refiner.shortlist(mares,goal,poolSize)]));
  const pairs=[];for(let i=0;i<N.length;i++)for(let j=i+1;j<N.length;j++)pairs.push([N[i],N[j]]);
  const seen=new Set();let best=initial,tested=0,rejected=0,skipped=0;
  const byPair={};
  // Round robin one valid proposal per stage-pair per sweep, so invalid or
  // duplicate early choices do not consume the entire budget of other pairs.
  function* proposals(a,b){
   const base=initial.choices||{},pa=pools.get(a),pb=pools.get(b);
   if(!base[a]||!base[b])return;
   const used=new Set(Object.entries(base).filter(([n])=>Number(n)!==a&&Number(n)!==b).map(([,id])=>norm(id)));
   for(let layer=0;layer<pa.length+pb.length-1;layer++)for(let i=0;i<pa.length;i++){
    const j=layer-i;if(j<0||j>=pb.length)continue;
    const ma=norm(pa[i].id),mb=norm(pb[j].id);
    if(ma===mb||ma===norm(base[a])||mb===norm(base[b])||used.has(ma)||used.has(mb)){skipped++;continue;}
    yield {...base,[a]:pa[i].id,[b]:pb[j].id};
   }
  }
  const active=pairs.map(([a,b])=>({key:a+'-'+b,iter:proposals(a,b),done:false}));
  while(tested<limit&&active.some(x=>!x.done)){
   for(const x of active){if(x.done||tested>=limit)continue;
    let next;do{next=x.iter.next();if(next.done){x.done=true;break;}}while(seen.has(JSON.stringify(N.map(n=>norm(next.value[n])))));
    if(x.done)continue;
    const choices=next.value;seen.add(JSON.stringify(N.map(n=>norm(choices[n]))));tested++;byPair[x.key]=(byPair[x.key]||0)+1;
    const trial=evaluate(choices);
    if(!refiner.metric(trial,goal)){rejected++;continue;}
    if(refiner.compare(trial,best,goal)<0)best=trial;
   }
  }
  const changed=refiner.compare(best,initial,goal)<0;
  const winner=changed?best:initial;
  return {winner,audit:{version:140,projectDDS,byPair,tested,rejected,skipped,limit,limited:tested===limit,improved:changed,
   changedSteps:changed?N.filter(n=>norm(winner.choices?.[n])!==norm(initial.choices?.[n])):[],
   before:first,after:changed?refiner.metric(winner,goal):first,gameVerified:false,
   caveat:'2工程同時の限定探索。超完璧・完璧、親子関係、31枠、必要な新規生産数は従来検査をすべて通過した案だけを比較。実測SP/STやゲーム内成立の保証なし。'}};
 }
 return Object.freeze({improve});
});
