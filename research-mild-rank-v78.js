/* v8.5 | Conservative final-pedigree evidence ordering for DDS mild.
 * Actual complete 31-slot mating validity is established by caller; this
 * module compares only those complete candidates. Never predicts SP/ST.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildRank78=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const safe=v=>Number.isFinite(Number(v))?Number(v):0;
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
  const tier=r=>safe(r.candidate?.additionalBirths)===0?1:
   safe(r.candidate?.additionalBirths)===1&&r.oneExtra85?.approved?0:2;
  const tx=tier(a),ty=tier(b);if(tx!==ty)return tx-ty;
  const births=safe(x.additionalBirths)-safe(y.additionalBirths);if(births)return births;
  if(typeof qualityCompare==='function'&&a.quality&&b.quality){
   const q=qualityCompare(a.quality,b.quality);if(q)return q;
  }
  const mx=finish?.metric?.(x,goal)||null,my=finish?.metric?.(y,goal)||null;
  if(mx&&my){
   // A documented, independent, nonconflicting factor cross is stronger
   // evidence than merely counting raw same-name or unresolved cross hits.
   if(mx.independentCrossEvidence!==my.independentCrossEvidence)
    return my.independentCrossEvidence-mx.independentCrossEvidence;
   if(mx.independentCrossEvidence>0&&my.independentCrossEvidence>0&&mx.crossFactorEvidence!==my.crossFactorEvidence)
    return my.crossFactorEvidence-mx.crossFactorEvidence;
   if(mx.score!==my.score)return my.score-mx.score;
  }
  if(typeof evidenceCompare==='function'&&a.evidence&&b.evidence){
   const e=evidenceCompare(a.evidence,b.evidence);if(e)return e;
  }
  return typeof fallback==='function'?fallback(x,y):0;
 }
 function snapshot(t,goal='balance',finish=null){
  const m=finish?.metric?.(t,goal)||null;
  return {version:78,gameVerified:false,goal,grade:grade(t),additionalBirths:safe(t?.additionalBirths),
   confirmedIndependentCrosses:m?.independentCrossEvidence??null,
   independentCrossCandidates:m?.independentCrossCandidates??null,
   knownCrossFactorIndex:m?.crossFactorEvidence??null,
   factorRowsRecorded:m?.ancestorFactorsRecorded??null,
   lineageFamilies:m?.childLineDiversity??null,
   researchScore:m?.score??null,
   caveat:'締め肌理論を先に比較。同じ理論でも、追加1工程が独立クロスの記録済み因子を増やし、評価・危険度・情報量に悪化がない時だけ採用する限定規則。SP/ST予測・効果倍率・ゲーム内成立の保証なし。'};
 }
 return Object.freeze({grade,oneExtraEvidence,compare,snapshot});
});
