/* v8.7 | Cross-anchor DDS shortlist comparison after complete 31-slot validation.
 * Compare all eligible DDS routes within ONE create click rather than using
 * independent 9-step baselines per anchor/permutation. This is a bounded,
 * evidence-based ranking, not a game-verified breeding theory or SP/ST forecast.
 * No user data, master records or input trials are mutated by select().
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildGlobal87=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const safe=v=>Number.isFinite(Number(v))?Number(v):0;
 const norm=v=>String(v??'').normalize('NFKC').trim().toLowerCase();
 function identity(trial,rank){
  const c=rank.candidate;
  const set=(trial.anchor?.set||[]).map(x=>norm(x.id)).sort().join('|');
  const layout=['g3','g4','g5'].map(k=>norm(trial.draft?.routeDraft?.slots?.[k])).join('|');
  const choices=Object.entries(c.choices||{}).map(([n,id])=>[n,norm(id)]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  return JSON.stringify([set,layout,choices,norm(c.xId||c.xPrep?.fatherId),norm(c.marePrep?.fatherId),safe(c.additionalBirths)]);
 }
 function select(trials,{ranker,finish,goal='balance',qualityCompare=null,evidenceCompare=null,fallback=null}={}){
  const invalid={version:87,winner:null,stats:{version:87,gameVerified:false,reason:'比較可能な最終31枠がありません',eligible:0,distinct:0}};
  if(!ranker?.grade||!ranker?.oneExtraEvidence||!ranker?.compare||!finish?.metric)return invalid;
  const rows=[],seen=new Set();let duplicates=0,skipped=0;
  for(const trial of trials||[]){if(trial?.routeType!=='dds')continue;
   for(const rank of trial.ranked||[]){const c=rank?.candidate;
    if(!c||c.matches!==3||c.full?.known!==31||c.full?.conflicts?.length||
       c.full?.transmission?.conflicts?.length||c.full?.transmission?.invalid?.length||ranker.grade(c)<7||
       !finish.metric(c,goal)){skipped++;continue;}
    const k=identity(trial,rank);
    if(seen.has(k)){duplicates++;continue;}seen.add(k);
    rows.push({trial,rank:{...rank,oneExtra85:null},originalRank:rank,identity:k});
   }
  }
  if(!rows.length)return {...invalid,stats:{...invalid.stats,skipped,duplicates}};
  const opts={goal,finish,qualityCompare,evidenceCompare,fallback};
  const directByGrade=new Map();
  for(const row of rows){const c=row.rank.candidate;
   if(safe(c.additionalBirths)!==0)continue;
   const grade=ranker.grade(c),prev=directByGrade.get(grade);
   if(!prev||ranker.compare(row.rank,prev.rank,opts)<0)directByGrade.set(grade,row);
  }
  let compared=0,approved=0,noReference=0;
  for(const row of rows){const c=row.rank.candidate;
   if(safe(c.additionalBirths)!==1||!c.xPrep||c.marePrep)continue;
   const reference=directByGrade.get(ranker.grade(c));
   if(!reference){noReference++;
    row.rank.oneExtra85={version:87,approved:false,compared:false,gameVerified:false,
     reason:'同じ理論の9工程対照を全DDS比較範囲でも確認できませんでした'};
    continue;
   }
   const evidence=ranker.oneExtraEvidence(c,reference.rank.candidate,{goal,finish});
   row.rank.oneExtra85={...evidence,version:87,scope:'同一作成操作中の全DDS・同理論の最良9工程案',
    baselineAnchor:reference.trial.anchor?.base||'',baselineSlots:{...(reference.trial.draft?.routeDraft?.slots||{})}};
   if(evidence.compared)compared++;
   if(evidence.approved)approved++;
  }
  rows.sort((a,b)=>ranker.compare(a.rank,b.rank,opts)||a.identity.localeCompare(b.identity,'ja'));
  const winner=rows[0];
  return {version:87,winner,stats:{version:87,gameVerified:false,eligible:rows.length,distinct:seen.size,
   skipped,duplicates,gradesWithDirect:[...directByGrade.keys()].sort(),oneExtraCompared:compared,
   oneExtraApproved:approved,oneExtraWithoutDirect:noReference,
   winningGrade:ranker.grade(winner.rank.candidate),winningAdditionalBirths:safe(winner.rank.candidate.additionalBirths),
   winningBase:winner.trial.anchor?.base||'',source:'同一クリック内で確認できたDDS・31枠・締め肌理論だけの限定横断比較。ゲーム内未確認。'}};
 }
 return Object.freeze({select,identity});
});
