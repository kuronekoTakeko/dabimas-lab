/* v7.6 | Verified real-horse reuse inside the nine-stage mild pedigree DAG.
 * Unlike the legacy v5.0 guard, a male real horse with VERIFIED NONZERO own
 * factors may be reused. Those observed factors MUST be included in every
 * descendant pedigree, and the caller MUST re-run final 31-slot, Shiko-anchor,
 * closing theory, incest/flow, and lineage validation before atomic save.
 * Old reuse markers remain verified by the legacy module unchanged.
 */
(function(root,factory){'use strict';
 const api=factory(root?.DabimasReuse50||(typeof module==='object'&&module.exports?require('./research-reuse-v50.js'):null));
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DabimasCoreReuse76=api;
})(typeof window!=='undefined'?window:globalThis,function(legacy){'use strict';
 const norm=v=>String(v??'').normalize('NFKC').trim();
 const ALLOWED=new Set(['短','速','底','長','走','中','強','雷','堅','難','適','丈','早','晩']);
 const factorSig=h=>Array.isArray(h?.factors)?h.factors.map(norm).sort().join('|'):null;
 const signature=rows=>legacy?.signature?.(rows)||null;
 function validFactorEvidence(h,step){
  if(h?.sex!=='male'||step===9)return true;
  return h.factorsVerified===true&&Array.isArray(h.factors)&&h.factors.length<=3&&
   h.factors.every(v=>typeof v==='string'&&ALLOWED.has(norm(v)));
 }
 function matches(h,req){
  if(!h||!req||h.mode!=='real'||!Number.isInteger(req.step)||req.step<1||req.step>9||
   !req.sireId||!req.mareId||!['male','female'].includes(req.sex)||h.sex!==req.sex||
   norm(h.fatherId)!==norm(req.sireId)||norm(h.motherId)!==norm(req.mareId)||
   norm(h.lineage)!==norm(req.lineage)||!validFactorEvidence(h,req.step))return false;
  const expected=signature(req.rows);
  return !!expected&&signature(h.ancestry)===expected;
 }
 function pick(records,request,excludedIds=[]){
  if(!legacy?.signature||!request||!Array.isArray(excludedIds))return null;
  const excluded=new Set(excludedIds.map(norm));
  for(const h of records||[]){
   if(!h?.id||excluded.has(norm(h.id))||!matches(h,request))continue;
   return {id:h.id,step:request.step,version:76,proofKind:'verified-real-core',
    signature:signature(h.ancestry),lineage:norm(h.lineage),
    personalFactorsVerified:h.sex==='male'&&request.step!==9,
    personalFactors:request.step!==9&&h.sex==='male'?factorSig(h):null,
    observedNonzeroFactors:request.step!==9&&h.sex==='male'?h.factors.length:0,
    gameVerified:false};
  }
  return null;
 }
 function verifyLink(h,mark,request){
  if(!mark||!h)return false;
  if(mark.version!==76)return legacy?.verifyLink?.(h,mark,request)===true;
  if(mark.proofKind!=='verified-real-core'||norm(mark.id)!==norm(h.id)||
   mark.step!==request?.step||!matches(h,request)||
   mark.signature!==signature(h.ancestry)||norm(mark.lineage)!==norm(h.lineage))return false;
  const needFactors=h.sex==='male'&&request.step!==9;
  if(mark.personalFactorsVerified!==needFactors)return false;
  if(needFactors&&(mark.personalFactors!==factorSig(h)||mark.observedNonzeroFactors!==h.factors.length))return false;
  return true;
 }
 return Object.freeze({signature,pick,verifyLink,matches,validFactorEvidence});
});
