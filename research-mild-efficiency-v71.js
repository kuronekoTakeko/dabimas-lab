/* v7.1 — bounded two-mare lookahead for the MILD DDS route.
 * Not a stronger in-game pedigree claim: every proposal is re-built and
 * validated by the caller. Never touches stored plans or user data.
 * Existing birth-count and confirmed perfect/super-perfect evidence outrank
 * this optional research-only ranking.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildEfficiency71=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const N=[3,4,5,6,7];
 const norm=x=>String(x??'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
 function improve({initial,mares=[],evaluate,goal='balance',maxTests=35,refiner}={}){
  const first=refiner?.metric?.(initial,goal);
  if(!first||typeof evaluate!=='function'||typeof refiner?.compare!=='function'||typeof refiner?.shortlist!=='function')
   return {winner:initial,audit:{version:71,error:'最終血統・締め肌理論の確認が必要',tested:0,gameVerified:false}};
  const limit=Math.min(90,Math.max(0,Math.trunc(Number(maxTests))||0));
  // Keep a small, lineage-diverse pool. We revisit EVERY pair of stages
  // before moving to higher-ranked replacement pairs, avoiding first-pair bias.
  const shortlist=refiner.shortlist(mares,goal,Math.min(9,Math.max(0,mares.length)));
  const pairs=[];for(let i=0;i<N.length;i++)for(let j=i+1;j<N.length;j++)pairs.push([N[i],N[j]]);
  const otherUsed=new Set(),seen=new Set();let best=initial,tested=0,rejected=0,skipped=0;
  // A diagonal interleaving visits all stage-pairs at each candidate rank.
  outer:for(let layer=0;layer<2*shortlist.length-1;layer++){
   for(const [a,b] of pairs){
    const choices0=initial.choices||{};
    if(!choices0[a]||!choices0[b])continue;
    for(let i=0;i<shortlist.length;i++){
     const j=layer-i;if(j<0||j>=shortlist.length)continue;
     const ma=shortlist[i],mb=shortlist[j];
     if(norm(ma.id)===norm(mb.id)||norm(ma.id)===norm(choices0[a])||norm(mb.id)===norm(choices0[b])){skipped++;continue;}
     otherUsed.clear();for(const [n,id] of Object.entries(choices0))if(Number(n)!==a&&Number(n)!==b&&id)otherUsed.add(norm(id));
     // The same named mare cannot be used twice where the existing DAG
     // already forbids duplicate public mare inputs.
     if(otherUsed.has(norm(ma.id))||otherUsed.has(norm(mb.id))){skipped++;continue;}
     const choices={...choices0,[a]:ma.id,[b]:mb.id};
     const signature=N.map(n=>norm(choices[n])).join('|');if(seen.has(signature))continue;
     seen.add(signature);if(tested>=limit)break outer;tested++;
     const trial=evaluate(choices);
     if(!refiner.metric(trial,goal)){rejected++;continue;}
     if(refiner.compare(trial,best,goal)<0)best=trial;
    }
   }
  }
  const changed=refiner.compare(best,initial,goal)<0;
  const winner=changed?best:initial;
  return {winner,audit:{version:71,tested,rejected,skipped,limit,limited:tested===limit,improved:changed,
   changedSteps:changed?N.filter(n=>norm(winner.choices?.[n])!==norm(initial.choices?.[n])):[],
   before:first,after:changed?refiner.metric(winner,goal):first,gameVerified:false,
   caveat:'2工程同時の限定探索。超完璧・完璧、親子関係、31枠、必要な新規生産数は従来検査をすべて通過した案だけを比較。実測SP/STやゲーム内成立の保証なし。'}};
 }
 return Object.freeze({improve});
});
