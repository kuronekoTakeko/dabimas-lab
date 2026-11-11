/* v3.7: local research-evidence comparison (not an ability prediction).
 * No game mechanics or third-party source code is assumed/copied.
 */
(function(root,factory){
 'use strict';
 const api=factory(root&&root.DabimasResearchAudit34,root&&root.DabimasResearchCrossCheck36);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DabimasResearchEvidence37=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(auditApi,crossApi){
 'use strict';
 function inspect(ped,anchorIds,anchorPaths){
  if(!auditApi||!crossApi||typeof auditApi.audit!=='function'||typeof crossApi.inspect!=='function')
   return {unavailable:true,reason:'血統・クロスの検証モジュールが未読込です'};
  const audit=auditApi.audit(ped,{anchorIds:Array.isArray(anchorIds)?anchorIds:[],anchorPaths});
  const cross=crossApi.inspect(ped);
  const sameName=!!audit.anchors.sameName;
  const distinctIds=audit.anchors.distinctRegisteredIds===true;
  const knownKinds=audit.anchors.factorKinds;
  const anchorObserved=sameName&&distinctIds&&knownKinds>=6;
  const bothSideNames=cross.crossSide.length;
  // Missing variant/factor data means unknown, not a non-existent cross.
  const fullyDocumented=cross.crossSide.filter(x=>!x.withoutVariant.length&&!x.withoutFactors.length).length;
  const malformed=audit.invalidPaths.length+audit.duplicatePaths.length+cross.badPaths.length+cross.duplicates.length;
  return {schema:1,unavailable:false,anchorObserved,anchorSameName:sameName,
   anchorDistinctIds:distinctIds,anchorFactorKinds:knownKinds,
   bothSideNames,fullyDocumented,unresolvedCrossNames:cross.unresolved.length,
   malformed,gameVerified:false,
   explanation:'指定3箇所の同名・登録ID・判明因子と父母共通祖先を照合。至高成立・独立クロスのゲーム内有効性・能力値は未確認。'};
 }
 function compare(a,b){
  // Negative means a is preferred. Only use after structural-quality ranking.
  if(!a||!b||a.unavailable||b.unavailable)return 0;
  if(a.anchorObserved!==b.anchorObserved)return a.anchorObserved?-1:1;
  if(a.malformed!==b.malformed)return a.malformed-b.malformed;
  if(a.fullyDocumented!==b.fullyDocumented)return b.fullyDocumented-a.fullyDocumented;
  if(a.bothSideNames!==b.bothSideNames)return b.bothSideNames-a.bothSideNames;
  if(a.unresolvedCrossNames!==b.unresolvedCrossNames)return a.unresolvedCrossNames-b.unresolvedCrossNames;
  return 0;
 }
 return Object.freeze({inspect,compare});
});
