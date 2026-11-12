/* v7.8 | Conservative final-pedigree evidence ordering for DDS mild.
 * Actual complete 31-slot mating validity is established by caller; this
 * module compares only those complete candidates. Never predicts SP/ST.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildRank78=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const safe=v=>Number.isFinite(Number(v))?Number(v):0;
 function grade(t){return t?.theory66?.blocked?0:t?.theory66?.superPerfect==='成立'?8:t?.theory66?.perfect==='成立'?7:0;}
 function compare(a,b,{goal='balance',finish=null,qualityCompare=null,evidenceCompare=null,fallback=null}={}){
  const x=a?.candidate,y=b?.candidate;if(!x)return y?1:0;if(!y)return -1;
  const ax=grade(x),by=grade(y);if(ax!==by)return by-ax;
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
   caveat:'締め肌の配合理論・工程数・31枠を先に優先し、裏付けのある独立クロスと4/5代目の研究用構成で比較。SP/ST予測、公式の効果倍率、ゲーム内成立を示さない。'};
 }
 return Object.freeze({grade,compare,snapshot});
});
