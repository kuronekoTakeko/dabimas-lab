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
  return JSON.stringify([set,layout,choices,norm(c.xId),norm(c.xPrep?.fatherId),norm(c.xPrep?.motherId),norm(c.marePrep?.fatherId),norm(c.marePrep?.motherId),norm(c.mareId),safe(c.additionalBirths)]);
 }
 function select(trials,{ranker,finish,goal='balance',qualityCompare=null,evidenceCompare=null,fallback=null}={}){
  const invalid={version:87,winner:null,stats:{version:87,gameVerified:false,reason:'比較可能な最終31枠がありません',eligible:0,distinct:0}};
  if(!ranker?.grade||!ranker?.oneExtraEvidence||!ranker?.compare||!finish?.metric)return invalid;
  const rows=[],seen=new Set();let duplicates=0,skipped=0;
  const nitro=typeof globalThis!=='undefined'?globalThis.DabimasMildNitro107:null;
  for(const trial of trials||[]){if(trial?.routeType!=='dds')continue;
   for(const rank of trial.ranked||[]){const c=rank?.candidate;
    if(!c||c.matches!==3||c.full?.known!==31||c.full?.conflicts?.length||
       c.full?.transmission?.conflicts?.length||c.full?.transmission?.invalid?.length||ranker.grade(c)<7||
       !finish.metric(c,goal)){skipped++;continue;}
    const k=identity(trial,rank);
    if(seen.has(k)){duplicates++;continue;}seen.add(k);
    // Local v107 approvals are not transferable to the global comparison.
    rows.push({trial,rank:{...rank,oneExtra85:null,nitro107:null,twoExtra111:null},originalRank:rank,identity:k});
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
  let compared=0,approved=0,nitroApproved=0,noReference=0;
  const reasons={};
  for(const row of rows){const c=row.rank.candidate;
   if(safe(c.additionalBirths)!==1||!(!!c.xPrep!==!!c.marePrep))continue;
   const reference=directByGrade.get(ranker.grade(c));
   if(!reference){noReference++;
    reasons.noDirect=(reasons.noDirect||0)+1;
    row.rank.oneExtra85={version:87,approved:false,compared:false,gameVerified:false,
     reason:'同じ理論の9工程対照を全DDS比較範囲でも確認できませんでした'};
    continue;
   }
   const evidence=ranker.oneExtraEvidence(c,reference.rank.candidate,{goal,finish});
   row.rank.oneExtra85={...evidence,version:87,scope:'同一作成操作中の全DDS・同理論の最良9工程案',
    baselineAnchor:reference.trial.anchor?.base||'',baselineSlots:{...(reference.trial.draft?.routeDraft?.slots||{})}};
   if(evidence.compared)compared++;
   if(evidence.approved)approved++;
   const stageEvidence=nitro?.oneExtra?.(c,reference.rank.candidate,{goal,finish})||null;
   row.rank.nitro107=stageEvidence;
   if(stageEvidence?.approved)nitroApproved++;
   if(!evidence.approved&&!stageEvidence?.approved){
    const why=stageEvidence?.reason||evidence.reason||'改善の根拠不足';
    reasons[why]=(reasons[why]||0)+1;
   }
  }
  // v111: independently compare BOTH-preparation matings to the best
  // verified one-preparation alternative of the SAME grade. No baseline:
  // preserve the option, but never invent a stage-gain approval.
  const oneByGrade=new Map();
  for(const row of rows){if(safe(row.rank.candidate.additionalBirths)!==1)continue;
   const grade=ranker.grade(row.rank.candidate),prev=oneByGrade.get(grade);
   if(!prev||ranker.compare(row.rank,prev.rank,opts)<0)oneByGrade.set(grade,row);
  }
  let twoCompared=0,twoApproved=0,twoNoBaseline=0;
  for(const row of rows){const c=row.rank.candidate;
   if(safe(c.additionalBirths)!==2||!c.xPrep||!c.marePrep)continue;
   const base=oneByGrade.get(ranker.grade(c));
   if(!base){twoNoBaseline++;row.rank.twoExtra111={version:111,approved:false,compared:false,gameVerified:false,reason:'同じ理論の1工程対照なし'};continue;}
   const evidence=nitro?.twoExtra?.(c,base.rank.candidate,{goal,finish,directBaseline:directByGrade.get(ranker.grade(c))?.rank.candidate||null})||null;
   row.rank.twoExtra111=evidence;
   if(evidence?.compared)twoCompared++;
   if(evidence?.approved)twoApproved++;
  }
  rows.sort((a,b)=>ranker.compare(a.rank,b.rank,opts)||a.identity.localeCompare(b.identity,'ja'));
  const winner=rows[0];
  // Limited, recorded evidence only. Do not suggest any candidate absent from
  // the bounded, fully validated comparison set.
  const familyKey=row=>norm(row.rank.candidate.xPrep?.fatherId||row.rank.candidate.xId||'未確認');
  const familyCounts=new Map(),birthCounts={0:0,1:0,2:0,other:0},gradeCounts={perfect:0,superPerfect:0};
  for(const row of rows){
   const f=familyKey(row);familyCounts.set(f,(familyCounts.get(f)||0)+1);
   const births=safe(row.rank.candidate.additionalBirths);
   if(births===0||births===1||births===2)birthCounts[births]++;else birthCounts.other++;
   if(ranker.grade(row.rank.candidate)===8)gradeCounts.superPerfect++;else gradeCounts.perfect++;
  }
  // v112: separate theoretical grade from preparation count. A two-prep
  // candidate without a SAME-grade one-prep comparator is unassessed, not
  // a documented inferior pedigree. Keep all rows and record both axes.
  const gradeBirthMatrix={superPerfect:{0:0,1:0,2:0},perfect:{0:0,1:0,2:0}};
  const routeCounts={direct:0,sireOnly:0,mareOnly:0,both:0};
  const routeGradeCounts={superPerfect:{direct:0,sireOnly:0,mareOnly:0,both:0},perfect:{direct:0,sireOnly:0,mareOnly:0,both:0}};
  const exemplarIndex=new Map();
  for(const row of rows){
   const c=row.rank.candidate,g=ranker.grade(c)===8?'superPerfect':'perfect';
   const births=safe(c.additionalBirths);
   if(births>=0&&births<=2)gradeBirthMatrix[g][births]++;
   const route=c.xPrep?(c.marePrep?'both':'sireOnly'):(c.marePrep?'mareOnly':'direct');
   routeCounts[route]++;routeGradeCounts[g][route]++;
   const key=g+'|'+route;
   if(!exemplarIndex.has(key)){
    const m=nitro?.inspect?.(c,goal)||null,fin=finish?.metric?.(c,goal)||null;
    exemplarIndex.set(key,{grade:g,route,additionalBirths:births,
     sire:c.xPrep?.fatherId||c.xId||'未確認',sireFoundationMare:c.xPrep?.motherId||null,
     mareFoundationFather:c.marePrep?.fatherId||null,mareFoundationMare:c.marePrep?.motherId||null,
     short:m?.counts?.['短']??null,fast:m?.counts?.['速']??null,long:m?.counts?.['長']??null,
     unknown:m?.missingFactorSlots??null,stageIndex:m?.researchIndex??null,
     independentCrossEvidence:fin?.independentCrossEvidence??null,
     rankPosition:rows.indexOf(row)+1});
   }
  }
  const gradeRouteExamples=[...exemplarIndex.values()].sort((a,b)=>a.rankPosition-b.rankPosition);
  // First ranked row of each father-family, for audit rather than an
  // instruction to breed. This grouping is not a completeness certificate.
  const representatives=[],familiesSeen=new Set();
  for(const row of rows){const family=familyKey(row);if(familiesSeen.has(family))continue;
   familiesSeen.add(family);
   const c=row.rank.candidate,m=nitro?.inspect?.(c,goal)||null,fin=finish?.metric?.(c,goal)||null;
   representatives.push({family,closingSire:c.xId||c.xPrep?.fatherId||'未確認',
    preparedSireFather:c.xPrep?.fatherId||null,preparedSireMare:c.xPrep?.motherId||null,
    baseMare:c.marePrep?.motherId||c.choices?.[1]||null,
    grade:ranker.grade(c)===8?'超完璧':'完璧',additionalBirths:safe(c.additionalBirths),
    short:m?.counts?.['短']??null,fast:m?.counts?.['速']??null,long:m?.counts?.['長']??null,
    missing:m?.missingFactorSlots??null,stageIndex:m?.researchIndex??null,stageShort:m?.stages?.['短']??null,stageFast:m?.stages?.['速']??null,stageLong:m?.stages?.['長']??null,independentCrossEvidence:fin?.independentCrossEvidence??null,shortCrossRisk:fin?.shortCrossRisk??null,rankPosition:rows.indexOf(row)+1,
    status:'記録済み血統・限定探索／ゲーム内未確認'});
   if(representatives.length>=6)break;
  }
  return {version:112,winner,stats:{version:112,gameVerified:false,eligible:rows.length,distinct:seen.size,
   skipped,duplicates,gradesWithDirect:[...directByGrade.keys()].sort(),oneExtraCompared:compared,
   oneExtraApproved:approved,oneExtraNitroApproved:nitroApproved,oneExtraWithoutDirect:noReference,
   twoExtraCompared:twoCompared,twoExtraApproved:twoApproved,twoExtraWithoutOne:twoNoBaseline,
   fatherFamilies:familyCounts.size,birthCounts,gradeCounts,gradeBirthMatrix,routeCounts,routeGradeCounts,gradeRouteExamples,representatives,
   extraRejectedReasons:Object.entries(reasons).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([reason,count])=>({reason,count})),
   winningGrade:ranker.grade(winner.rank.candidate),winningAdditionalBirths:safe(winner.rank.candidate.additionalBirths),
   winningBase:winner.trial.anchor?.base||'',rankingPolicy:'肌作りの超完璧・完璧を区別し、同じ理論の比較対照不在は改善未評価とし、同一理論と追加仕込みの承認条件が同じ場合は最終産駒のニトロ段階・独立クロス・リスクを工程数より先に比較。評価が同等なら少工程。',source:'同一クリック内で確認できたDDS・31枠・締め肌理論だけの限定横断比較。ゲーム内未確認。'}};
 }
 return Object.freeze({select,identity});
});
