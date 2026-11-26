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
 // v159: conservative same-evidence comparison of a proposed replacement.
 // No SP/ST conversion, no comparison between different missing masks, no
 // additional matings. Each dimension must be non-worse, with a strict gain.
 function dominance(a,b,{finish,goal='balance',nitro=globalThis.DabimasMildNitro107}={}){
  const x=a?.candidate,y=b?.candidate;if(!x||!y||!nitro?.comparable?.(x,y)||x.additionalBirths!==y.additionalBirths)return null;
  const tier=r=>[!!r.oneExtra85?.approved,!!r.nitro107?.approved,!!r.twoExtra111?.approved].join('|');
  if(tier(a)!==tier(b))return null;
  const xm=finish?.metric?.(x,goal),ym=finish?.metric?.(y,goal),xn=nitro.inspect(x,goal),yn=nitro.inspect(y,goal),xc=finish?.closingEvidence?.(x,goal),yc=finish?.closingEvidence?.(y,goal);
  if(!xm||!ym||!xn||!yn||!xc||!yc||JSON.stringify(xc.unknownPaths)!==JSON.stringify(yc.unknownPaths))return null;
  const xs=finish?.closingEvidence?.(x,goal,'sire'),ys=finish?.closingEvidence?.(y,goal,'sire');
  if(!xs||!ys||JSON.stringify(xs.unknownPaths)!==JSON.stringify(ys.unknownPaths))return null;
  const xl=xm.generationEvidence,yl=ym.generationEvidence;
  if(!xl||!yl||xl.length!==2||yl.length!==2||xl.some((g,i)=>g.depth!==yl[i].depth||g.slots!==yl[i].slots||JSON.stringify(g.knownPaths)!==JSON.stringify(yl[i].knownPaths)))return null;
  const pairs=[];const add=(k,u,v,sign=1)=>pairs.push([k,u,v,sign]);
  for(const k of ['短','速','長']){add('finalCount:'+k,xn.counts[k],yn.counts[k]);add('finalStage:'+k,xn.stages[k],yn.stages[k]);add('closingCount:'+k,xc.counts[k],yc.counts[k]);add('closingStage:'+k,xc.stages[k],yc.stages[k]);}
  for(const k of ['短','速','長']){add('sireCount:'+k,xs.counts[k],ys.counts[k]);add('sireStage:'+k,xs.stages[k],ys.stages[k]);}
  for(const k of ['走','中'])add('sireTotal:'+k,xs.recordedByDepth155?.total?.[k],ys.recordedByDepth155?.total?.[k]);
  for(const d of [4,5])for(const f of ['走','中'])add('final:'+f+d,xn.recordedByDepth155?.[d]?.[f],yn.recordedByDepth155?.[d]?.[f]);
  for(const k of ['走','中']){add('finalTotal:'+k,xn.recordedByDepth155?.total?.[k],yn.recordedByDepth155?.total?.[k]);add('closingTotal:'+k,xc.recordedByDepth155?.total?.[k],yc.recordedByDepth155?.total?.[k]);}
  for(let i=0;i<2;i++)add('line'+xl[i].depth,xl[i].distinct,yl[i].distinct);
  for(const k of ['independentCrossEvidence','crossFactorEvidence','fullDocumentedFactorSlots','ancestorFactorsRecorded'])add(k,xm[k],ym[k]);
  for(const k of ['shortCrossRisk','unresolvedCrossCandidates','unresolvedCrosses'])add(k,xm[k],ym[k],-1);
  if(pairs.some(([,u,v,sign])=>!Number.isFinite(u)||!Number.isFinite(v)||(u-v)*sign<0))return null;
  const gains=pairs.filter(([,u,v,sign])=>(u-v)*sign>0).map(([metric,after,before])=>({metric,before,after}));
  return gains.length?gains:null;
 }
 // v162: configurable research utility, not predicted ability. Unknown factors stay unknown.
 function utility(c,{finish,goal='balance',nitro=globalThis.DabimasMildNitro107}={}){
  const n=nitro?.inspect(c,goal),m=finish?.metric(c,goal);if(!n||!m)return null;
  const w=({speed:[3,3,0.7,2,1],balance:[1.5,2,2,1.5,1.5],stamina:[0.5,1,4,0.7,2]})[goal]||[1.5,2,2,1.5,1.5];
  const factors=e=>e?['短','速','長'].reduce((a,k,i)=>a+w[i]*(e.counts[k]+2*e.stages[k]),0)+w[3]*Math.min(5,e.recordedByDepth155?.total?.走||0)+w[4]*Math.min(goal==='stamina'?4:5,e.recordedByDepth155?.total?.中||0):0;
  const parts={final:factors(n),parents:0.2*(factors(finish.closingEvidence(c,goal))+factors(finish.closingEvidence(c,goal,'sire'))),lineage:0.6*(m.generationEvidence?.[0]?.distinct||0)+0.3*(m.generationEvidence?.[1]?.distinct||0),cross:2*m.independentCrossEvidence+m.crossFactorEvidence, risk:-6*m.shortCrossRisk-0.5*m.unresolvedCrossCandidates,effort:-8*safe(c.additionalBirths)};
  return {score:Object.values(parts).reduce((a,b)=>a+b,0),parts,missing:n.missingFactorSlots,gameVerified:false};
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
  const comparisonKey=c=>nitro?.comparisonKey?.(c)||null;
  for(const row of rows){const c=row.rank.candidate;
   if(safe(c.additionalBirths)!==0)continue;
   const grade=comparisonKey(c);if(grade===null)continue;const prev=directByGrade.get(grade);
   if(!prev||ranker.compare(row.rank,prev.rank,opts)<0)directByGrade.set(grade,row);
  }
  let compared=0,approved=0,nitroApproved=0,noReference=0;
  const reasons={};
  for(const row of rows){const c=row.rank.candidate;
   if(safe(c.additionalBirths)!==1||!(!!c.xPrep!==!!c.marePrep))continue;
   const reference=directByGrade.get(comparisonKey(c));
   if(!reference){noReference++;
    reasons.noDirect=(reasons.noDirect||0)+1;
    row.rank.oneExtra85={version:87,approved:false,compared:false,gameVerified:false,
     reason:'同じ指定3頭・理論・因子未収録位置の9工程対照を全DDS比較範囲でも確認できませんでした'};
    continue;
   }
   const evidence=ranker.oneExtraEvidence(c,reference.rank.candidate,{goal,finish});
   row.rank.oneExtra85={...evidence,version:87,scope:'同一作成操作中の全DDS・同指定3頭・同理論・同因子未収録位置の最良9工程案',
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
   const grade=comparisonKey(row.rank.candidate);if(grade===null)continue;const prev=oneByGrade.get(grade);
   if(!prev||ranker.compare(row.rank,prev.rank,opts)<0)oneByGrade.set(grade,row);
  }
  let twoCompared=0,twoApproved=0,twoNoBaseline=0;
  for(const row of rows){const c=row.rank.candidate;
   if(safe(c.additionalBirths)!==2||!c.xPrep||!c.marePrep)continue;
   const base=oneByGrade.get(comparisonKey(c));
   if(!base){twoNoBaseline++;row.rank.twoExtra111={version:111,approved:false,compared:false,gameVerified:false,reason:'同じ指定3頭・理論・因子未収録位置の1工程対照なし'};continue;}
   const evidence=nitro?.twoExtra?.(c,base.rank.candidate,{goal,finish,directBaseline:directByGrade.get(comparisonKey(c))?.rank.candidate||null})||null;
   row.rank.twoExtra111=evidence;
   if(evidence?.compared)twoCompared++;
   if(evidence?.approved)twoApproved++;
  }
  rows.sort((a,b)=>ranker.compare(a.rank,b.rank,opts)||a.identity.localeCompare(b.identity,'ja'));
  const originalWinner=rows[0];let winner=originalWinner;const promotions=[];
  // Keep the best available closing theory and structural safety tier. Within
  // that tier trade recorded research features against production effort.
  const grade=Math.max(...rows.map(r=>ranker.grade(r.rank.candidate)));
  const minRisk=Math.min(...rows.filter(r=>ranker.grade(r.rank.candidate)===grade).map(r=>finish.metric(r.rank.candidate,goal).shortCrossRisk));
  const eligible=rows.filter(r=>ranker.grade(r.rank.candidate)===grade&&finish.metric(r.rank.candidate,goal).shortCrossRisk===minRisk).map(r=>({r,u:utility(r.rank.candidate,{finish,goal,nitro})})).filter(x=>x.u);
  eligible.sort((a,b)=>b.u.score-a.u.score||safe(a.r.rank.candidate.additionalBirths)-safe(b.r.rank.candidate.additionalBirths)||a.r.identity.localeCompare(b.r.identity,'ja'));
  if(eligible.length)winner=eligible[0].r;
  if(winner!==originalWinner){promotions.push({from:originalWinner.identity,to:winner.identity,before:utility(originalWinner.rank.candidate,{finish,goal,nitro}),after:utility(winner.rank.candidate,{finish,goal,nitro})});rows.splice(rows.indexOf(winner),1);rows.unshift(winner);}
  const selection159={version:162,promoted:promotions.length>0,promotions,gameVerified:false,abilityVerdict:null,utility:utility(winner.rank.candidate,{finish,goal,nitro}),policy:'研究用の能力方針別総合指標（因子・ニトロ・両親・子系統多様性・独立クロス・追加工程負担）。未知因子は未確認。能力値ではなく、重みは開発仮説。'};
  const shortlist127=typeof globalThis!=='undefined'?globalThis.DabimasMildShortlist127?.fromRanked?.({rows,ranker,finish,goal,limit:3})||null:null;
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
     crossCandidateCount:fin?.independentCrossCandidates??null,
     crossUnresolvedCount:fin?.unresolvedCrossCandidates??null,
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
    missing:m?.missingFactorSlots??null,stageIndex:m?.researchIndex??null,stageShort:m?.stages?.['短']??null,stageFast:m?.stages?.['速']??null,stageLong:m?.stages?.['長']??null,independentCrossEvidence:fin?.independentCrossEvidence??null,crossCandidateCount:fin?.independentCrossCandidates??null,crossUnresolvedCount:fin?.unresolvedCrossCandidates??null,shortCrossRisk:fin?.shortCrossRisk??null,rankPosition:rows.indexOf(row)+1,
    status:'記録済み血統・限定探索／ゲーム内未確認'});
   if(representatives.length>=6)break;
  }
  return {version:112,winner,stats:{version:112,shortlist127,selection159,gameVerified:false,eligible:rows.length,distinct:seen.size,
   skipped,duplicates,gradesWithDirect:[...new Set([...directByGrade.values()].map(r=>ranker.grade(r.rank.candidate)))].sort((a,b)=>a-b),oneExtraCompared:compared,
   oneExtraApproved:approved,oneExtraNitroApproved:nitroApproved,oneExtraWithoutDirect:noReference,
   twoExtraCompared:twoCompared,twoExtraApproved:twoApproved,twoExtraWithoutOne:twoNoBaseline,
   fatherFamilies:familyCounts.size,birthCounts,gradeCounts,gradeBirthMatrix,routeCounts,routeGradeCounts,gradeRouteExamples,representatives,
   extraRejectedReasons:Object.entries(reasons).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([reason,count])=>({reason,count})),
   winningGrade:ranker.grade(winner.rank.candidate),winningAdditionalBirths:safe(winner.rank.candidate.additionalBirths),
   winningBase:winner.trial.anchor?.base||'',rankingPolicy:'締め肌理論と近親リスクを優先し、能力方針別の研究総合指標から追加工程負担を差し引いて選定。従来の厳格比較は参考記録として保持。',source:'同一クリック内で確認できたDDS・31枠・締め肌理論だけの限定横断比較。ゲーム内未確認。'}};
 }
 return Object.freeze({select,identity,dominance,utility});
});
