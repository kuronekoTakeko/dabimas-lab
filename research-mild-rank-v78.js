/* v8.5 | Conservative final-pedigree evidence ordering for DDS mild.
 * Actual complete 31-slot mating validity is established by caller; this
 * module compares only those complete candidates. Never predicts SP/ST.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildRank78=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const safe=v=>Number.isFinite(Number(v))?Number(v):0;
 const nitro=()=>typeof globalThis!=='undefined'?globalThis.DabimasMildNitro107:null;
 function grade(t){return t?.theory66?.blocked?0:t?.theory66?.superPerfect==='成立'?8:t?.theory66?.perfect==='成立'?7:0;}
 // A single extra preparation is acceptable ONLY when the full 31-slot
 // evidence shows an additional documented independent factor cross without
 // losing existing cross strength, recorded coverage or safety. This is NOT
 // a prediction of in-game SP/ST or a proof of the breeding theory.
 function oneExtraEvidence(extra,short,{goal='balance',finish=null}={}){
  const eBirth=safe(extra?.additionalBirths),sBirth=safe(short?.additionalBirths);
  const result={version:85,approved:false,compared:false,additionalBirths:eBirth,
   baselineBirths:sBirth,goal,gameVerified:false,reason:'比較に必要な候補がありません'};
  if(eBirth!==sBirth+1||eBirth>1||grade(extra)!==grade(short)||grade(extra)<7){
   result.reason='同じ締め肌理論・0工程対1工程の比較ではありません';return result;}
  const em=finish?.metric?.(extra,goal)||null,sm=finish?.metric?.(short,goal)||null;
  if(!em||!sm){result.reason='最終31枠または研究評価に欠落があります';return result;}
  result.compared=true;
  result.extra={independentCrossEvidence:em.independentCrossEvidence,crossFactorEvidence:em.crossFactorEvidence,
   shortCrossRisk:em.shortCrossRisk,unresolvedCrosses:em.unresolvedCrosses,ancestorFactorsRecorded:em.ancestorFactorsRecorded,
   score:em.score};
  result.baseline={independentCrossEvidence:sm.independentCrossEvidence,crossFactorEvidence:sm.crossFactorEvidence,
   shortCrossRisk:sm.shortCrossRisk,unresolvedCrosses:sm.unresolvedCrosses,ancestorFactorsRecorded:sm.ancestorFactorsRecorded,
   score:sm.score};
  const noLoss=em.crossFactorEvidence>=sm.crossFactorEvidence &&
   em.shortCrossRisk<=sm.shortCrossRisk && em.unresolvedCrosses<=sm.unresolvedCrosses &&
   em.ancestorFactorsRecorded>=sm.ancestorFactorsRecorded && em.score>sm.score;
  const newDocumentedCross=em.independentCrossEvidence>sm.independentCrossEvidence;
  result.approved=!!(noLoss&&newDocumentedCross);
  result.reason=result.approved?'31枠の記録済み独立クロスが増加し、因子評価・短距離近親リスク・未確認クロス・記録済み枠の悪化なし':
   '同じ理論なら追加工程を正当化できる独立クロスの改善証拠が不足';
  return result;
 }
 function compare(a,b,{goal='balance',finish=null,qualityCompare=null,evidenceCompare=null,fallback=null}={}){
  const x=a?.candidate,y=b?.candidate;if(!x)return y?1:0;if(!y)return -1;
  const ax=grade(x),by=grade(y);if(ax!==by)return by-ax;
  // Use one immutable baseline per theory grade, assigned by caller after
  // all candidates have been checked. This produces a stable ranking and
  // prevents candidate-by-candidate preference cycles.
  const tier=r=>{
   const births=safe(r.candidate?.additionalBirths);
   if(births===0)return 1;
   if(births===1)return r.nitro107?.approved||r.oneExtra85?.approved?0:2;
   if(births===2)return r.twoExtra111?.approved?0:3;
   return 4;
  };
  const tx=tier(a),ty=tier(b);if(tx!==ty)return tx-ty;
  // Validated nitro improvement may justify one extra mating; do not
  // let raw mating count erase documented stage gains.
  if(tx===0&&ty===1)return -1;if(ty===0&&tx===1)return 1;
  // v109: Within the SAME theory and preparation-evidence tier, assess
  // documented final-foal evidence BEFORE using the number of matings as a
  // tie-break. The tier above already prevents an unapproved extra mating
  // from beating a comparable direct candidate merely on raw factor totals.
  // Factor counts have no claimed SP/ST conversion; compare recorded nitro
  // stages only when annotation coverage is comparable.
  const n=nitro();if(n?.compare){const d=n.compare(x,y,goal);if(d)return d;}
  const mx=finish?.metric?.(x,goal)||null,my=finish?.metric?.(y,goal)||null;
  if(mx&&my){
   // Avoid upgrading a candidate with worsened documented short-cross risk.
   const axRisk=safe(mx.shortCrossRisk),byRisk=safe(my.shortCrossRisk);
   if(axRisk!==byRisk)return axRisk-byRisk;
   if(mx.independentCrossEvidence!==my.independentCrossEvidence)
    return safe(my.independentCrossEvidence)-safe(mx.independentCrossEvidence);
   if(mx.independentCrossEvidence>0&&my.independentCrossEvidence>0&&mx.crossFactorEvidence!==my.crossFactorEvidence)
    return safe(my.crossFactorEvidence)-safe(mx.crossFactorEvidence);
   if(mx.score!==my.score)return safe(my.score)-safe(mx.score);
  }
  if(typeof qualityCompare==='function'&&a.quality&&b.quality){
   const q=qualityCompare(a.quality,b.quality);if(q)return q;
  }
  // Same evidential quality: prefer fewer preparation matings.
  const births=safe(x.additionalBirths)-safe(y.additionalBirths);if(births)return births;
  if(typeof evidenceCompare==='function'&&a.evidence&&b.evidence){
   const e=evidenceCompare(a.evidence,b.evidence);if(e)return e;
  }
  return typeof fallback==='function'?fallback(x,y):0;
 }
 function snapshot(t,goal='balance',finish=null){
  const m=finish?.metric?.(t,goal)||null;
  return {version:109,gameVerified:false,goal,grade:grade(t),additionalBirths:safe(t?.additionalBirths),
   confirmedIndependentCrosses:m?.independentCrossEvidence??null,
   independentCrossCandidates:m?.independentCrossCandidates??null,
   knownCrossFactorIndex:m?.crossFactorEvidence??null,
   candidateCrossFactorIndex:m?.candidateCrossFactorIndex??null,
   unresolvedCrossCandidates:m?.unresolvedCrossCandidates??null,
   factorRowsRecorded:m?.ancestorFactorsRecorded??null,
   lineageFamilies:m?.childLineDiversity??null,
   researchScore:m?.score??null,
   caveat:'締め肌の完璧／超完璧は独立評価。同じ理論・追加工程の根拠段階では最終産駒の記録済みニトロ段階と独立クロスを比較し、実質同程度なら少工程を優先。SP/ST予測・効果倍率・ゲーム内成立の保証なし。'};
 }
 return Object.freeze({grade,oneExtraEvidence,compare,snapshot});
});
