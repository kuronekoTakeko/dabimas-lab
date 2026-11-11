/* v3.5: deterministic and non-destructive candidate data-quality comparison.
 * Separates pedigree evidence from estimated breeding merit.
 * Does not infer in-game theory or SP/ST values.
 */
(function(root,factory){
 'use strict';
 const api=factory(root&&root.DabimasResearchAudit34);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DabimasResearchQuality35=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(auditApi){
 'use strict';
 function inspect(pedigree,anchorIds,anchorPaths){
  if(!auditApi||typeof auditApi.audit!=='function')return {unavailable:true,structural:0,coverage:0,summary:'血統監査が利用できません'};
  const a=auditApi.audit(pedigree,{anchorIds:anchorIds||[],anchorPaths});
  // Missing evidence and theory-blocker uncertainty cannot be treated as an
  // outright defect. Explicit broken pedigree structure is a different matter.
  const structural=a.errors.filter(s=>/祖先名の未収録|祖先位置に重複|祖先名の衝突|同名条件が未達|登録IDが独立/.test(s));
  const coverage=Math.max(0,a.known) / a.total;
  return {unavailable:false,structural:structural.length,coverage,
   missingNames:a.missing.names.length,missingLines:a.missing.lines.length,
   unresolvedFactorRows:a.missing.factorEvidence.length,
   factorKinds:a.anchors.factorKinds,verifiedTheory:false,
   summary:structural.length?'血統構造の要確認点あり':'血統の一次構造は確認済み',audit:a};
 }
 function compare(a,b){
  // Return negative for preferred candidate. Only use objective data-quality
  // evidence to break score ties or when structural defects would be promoted.
  if(a.structural!==b.structural)return a.structural-b.structural;
  if(a.missingNames!==b.missingNames)return a.missingNames-b.missingNames;
  if(a.coverage!==b.coverage)return b.coverage-a.coverage;
  return 0;
 }
 return Object.freeze({inspect,compare});
});
