/* v128 | Bounded independent-father comparison rescue for DDS mild.
 * This module NEVER asserts game theory, SP/ST, cross effects or exhaustive search.
 * Pure/read-only: ownership, saved plans and public masters are not changed.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildRescue128=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const positive=(v,def=0)=>Number.isFinite(Number(v))?Math.max(0,Math.trunc(Number(v))):def;
 const normalize=v=>String(v??'').normalize('NFKC').trim().toLowerCase();
 function shouldInspect({index,bestGrade=0,grade3Families=0,availableFamilies=0,primary=100,reserve=60,diversityReserve=40,targetFamilies=3}={}){
  const i=Number(index),p=positive(primary),r=positive(reserve),d=Math.min(r,positive(diversityReserve)),target=Math.max(2,positive(targetFamilies,3));
  if(!Number.isInteger(i)||i<0||i>=p+r)return false;
  if(i<p)return true;
  // Never stop when a documentary grade-8 pedigree was not yet reached.
  if(Number(bestGrade)<3)return true;
  // After grade-8: spend at most a bounded portion of the reserve to inspect
  // an independent father family; only if precheck shows enough families.
  return positive(availableFamilies)>=target&&positive(grade3Families)<target&&i<p+d;
 }
 function snapshot({offered=0,inspected=0,primary=100,reserve=60,diversityReserve=40,availableFamilies=0,primaryGrade3Families=0,grade3Families=0,primaryGrade=0,finalGrade=0,prechecked=0}={}){
  const inspectedN=positive(inspected),offeredN=positive(offered);
  const observedExtra=Math.max(0,inspectedN-positive(primary));
  const result={version:128,policy:'同一条件・同じ超完璧一次判定の別父系を、有限の予備枠で探す',
   primaryLimit:positive(primary),maxReserve:positive(reserve),diversityReserve:Math.min(positive(reserve),positive(diversityReserve)),
   offered:offeredN,inspected:inspectedN,extraInspected:observedExtra,
   availableFatherFamilies:positive(availableFamilies),primaryGrade3Families:positive(primaryGrade3Families),
   completedGrade3Families:positive(grade3Families),newGrade3Families:Math.max(0,positive(grade3Families)-positive(primaryGrade3Families)),
   primaryGrade:positive(primaryGrade),finalGrade:positive(finalGrade),
   notReviewed:Math.max(0,offeredN-inspectedN),outsideShortlist:Math.max(0,positive(prechecked)-offeredN),
   gameVerified:false,fullSearch:false,crossEffectVerified:false};
  result.reason=positive(primaryGrade)<3?'超完璧の一次候補が未検出のため予備枠を確保':
   positive(availableFamilies)<3?'比較可能な事前父系の種類が不足':
   positive(primaryGrade3Families)>=3?'最初の検査枠で別父系3種類以上を確認':
   observedExtra?'別父系の超完璧一次候補を追加調査':'別父系を追加確認する前に候補リストを終了';
  result.caveat='父系種類数は血統の強さではありません。31枠・理論は登録データの一次検査で、ゲーム内至高、独立クロス、SP/STを保証しません。候補リスト外は未探索です。';
  return result;
 }
 function fromSaved(plan){
  if(plan?.autoDesign21?.mode!=='mild')return null;
  const raw=plan?.mild128||plan?.mild89?.rescue128||plan?.mild67?.inverse69?.coverage89?.rescue128||null;
  if(raw?.version!==128)return {version:128,fresh:false,needsReSearch:true,gameVerified:false,reason:'旧探索記録。v128の別父系予備検査は未実行'};
  return {...raw,fresh:true,needsReSearch:false,gameVerified:false};
 }
 return Object.freeze({shouldInspect,snapshot,fromSaved,normalize});
});
