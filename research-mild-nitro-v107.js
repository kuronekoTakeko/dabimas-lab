/* v107: Mild-mode recorded nitro-stage comparison (research hypothesis).
 * Only final 31 sire-ancestor slots are counted; absent factor annotations are
 * unknown rather than zero-ability. This is not a game SP/ST prediction.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildNitro107=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const thresholds=Object.freeze({'短':[4,6,8,9,10],'速':[4,8,12,16,20],'長':[3,6,9]});
 const weights=Object.freeze({speed:{'短':9,'速':5,'長':1},stamina:{'長':9,'速':5,'短':1},balance:{'速':7,'長':7,'短':2}});
 const paths=new Set();for(let n=1;n<=5;n++){for(let i=0;i<(1<<(n-1));i++){let s='';for(let bit=n-2;bit>=0;bit--)s+=(i&(1<<bit))?'D':'S';paths.add(s+'S');}}
 const grade=c=>c?.theory66?.blocked?0:c?.theory66?.superPerfect==='成立'?8:c?.theory66?.perfect==='成立'?7:0;
 function inspect(c,goal='balance'){
  if(!c||c.matches!==3||c.full?.known!==31||c.full?.conflicts?.length||c.full?.transmission?.conflicts?.length||c.full?.transmission?.invalid?.length||grade(c)<7)return null;
  const rows=c.full.rows||[],seen=new Set(),counts={'短':0,'速':0,'長':0};let missing=0;
  for(const row of rows){const path=String(row?.path||'');if(!paths.has(path)||seen.has(path))continue;seen.add(path);
   const fs=Array.isArray(row.factors)?row.factors.filter(Boolean):[];
   if(!fs.length)missing++;
   for(const f of fs)if(Object.prototype.hasOwnProperty.call(counts,f))counts[f]++;
  }
  if(seen.size!==31)return null;
  const stages=Object.fromEntries(Object.keys(counts).map(k=>[k,thresholds[k].filter(t=>counts[k]>=t).length]));
  const w=weights[goal]||weights.balance;
  const researchIndex=Object.keys(stages).reduce((s,k)=>s+stages[k]*w[k],0);
  return {version:107,goal,counts,stages,missingFactorSlots:missing,knownFactorSlots:31-missing,
   researchIndex,thresholds,gameVerified:false,limited:missing>0,
   caveat:'記録済み31祖先枠の短・速・長の段階による研究指標。未収録は0因子と断定できず、SP/ST能力・ゲーム内ボーナスを保証しません。'};
 }
 function compare(a,b,goal='balance'){
  const x=inspect(a,goal),y=inspect(b,goal);if(!x)return y?1:0;if(!y)return -1;
  if(x.missingFactorSlots!==y.missingFactorSlots)return 0; // do not favor missing annotations as evidence
  return y.researchIndex-x.researchIndex;
 }
 function oneExtra(extra,baseline,{goal='balance',finish=null}={}){
  const result={version:107,approved:false,compared:false,gameVerified:false,reason:'条件未確認'};
  if(grade(extra)<7||grade(extra)!==grade(baseline)||Number(extra?.additionalBirths)!==1||Number(baseline?.additionalBirths)!==0){result.reason='同じ完璧／超完璧で追加1工程の比較ではありません';return result;}
  const e=inspect(extra,goal),b=inspect(baseline,goal),em=finish?.metric?.(extra,goal),bm=finish?.metric?.(baseline,goal);
  if(!e||!b||!em||!bm){result.reason='最終31枠・クロス根拠が不足';return result;}
  result.compared=true;result.extra=e;result.baseline=b;
  if(e.missingFactorSlots!==b.missingFactorSlots){result.reason='因子未収録枠の数が異なるため、改善と断定できません';return result;}
  const keys=goal==='speed'?['短','速','長']:goal==='stamina'?['長','速','短']:['速','長','短'];
  const prioritized=keys.some(k=>e.stages[k]>b.stages[k]);
  const noLoss=keys.every(k=>e.stages[k]>=b.stages[k])&&em.independentCrossEvidence>=bm.independentCrossEvidence&&
   em.crossFactorEvidence>=bm.crossFactorEvidence&&em.shortCrossRisk<=bm.shortCrossRisk&&
   em.unresolvedCrosses<=bm.unresolvedCrosses&&em.ancestorFactorsRecorded>=bm.ancestorFactorsRecorded;
  result.approved=prioritized&&noLoss&&e.researchIndex>b.researchIndex;
  result.reason=result.approved?'記録済みニトロ段階が改善し、クロス・安全性・情報量の悪化なし':
   'ニトロ段階改善またはクロス・安全性維持の根拠不足';return result;
 }
 // v111: a second preparation is accepted only against the strongest
 // documented ONE-preparation comparator of the same closing-mare theory.
 // Missing annotation coverage or worsening cross evidence prevents promotion.
 function twoExtra(extra,baseline,{goal='balance',finish=null,directBaseline=null}={}){
  const result={version:111,approved:false,compared:false,gameVerified:false,reason:'対照候補が未確認'};
  if(grade(extra)<7||grade(extra)!==grade(baseline)||Number(extra?.additionalBirths)!==2||Number(baseline?.additionalBirths)!==1){
   result.reason='同じ理論の追加1工程と追加2工程の比較ではありません';return result;}
  const e=inspect(extra,goal),b=inspect(baseline,goal),em=finish?.metric?.(extra,goal),bm=finish?.metric?.(baseline,goal);
  if(!e||!b||!em||!bm){result.reason='31枠とクロスの比較記録が不足';return result;}
  result.compared=true;result.extra=e;result.baseline=b;
  if(e.missingFactorSlots!==b.missingFactorSlots){result.reason='因子未収録数が異なり改善未確定';return result;}
  const keys=goal==='speed'?['短','速','長']:goal==='stamina'?['長','速','短']:['速','長','短'];
  const nondecreasing=keys.every(k=>e.stages[k]>=b.stages[k]);
  const better=keys.some(k=>e.stages[k]>b.stages[k]);
  const crossSafe=em.independentCrossEvidence>=bm.independentCrossEvidence&&
   em.crossFactorEvidence>=bm.crossFactorEvidence&&em.shortCrossRisk<=bm.shortCrossRisk&&
   em.unresolvedCrosses<=bm.unresolvedCrosses&&em.ancestorFactorsRecorded>=bm.ancestorFactorsRecorded;
  // A superior 1-stage rival alone is insufficient: where a validated
  // direct route exists, 2-stage evidence must also beat that direct route.
  let strongerThanDirect=true;
  if(directBaseline){
   const d=inspect(directBaseline,goal),dm=finish?.metric?.(directBaseline,goal);
   strongerThanDirect=!!(d&&dm&&d.missingFactorSlots===e.missingFactorSlots&&
    keys.every(k=>e.stages[k]>=d.stages[k])&&e.researchIndex>d.researchIndex&&
    em.independentCrossEvidence>=dm.independentCrossEvidence&&em.crossFactorEvidence>=dm.crossFactorEvidence&&
    em.shortCrossRisk<=dm.shortCrossRisk&&em.unresolvedCrosses<=dm.unresolvedCrosses&&
    em.ancestorFactorsRecorded>=dm.ancestorFactorsRecorded);
  }
  result.approved=nondecreasing&&better&&crossSafe&&strongerThanDirect&&e.researchIndex>b.researchIndex;
  result.reason=result.approved?'同一理論・同等因子収録率で段階改善、クロス・危険度の悪化なし':
   '追加1工程より高い評価と安全性維持を確認できない';
  return result;
 }
 return Object.freeze({thresholds,weights,inspect,compare,oneExtra,twoExtra});
});
