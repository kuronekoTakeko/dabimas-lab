/* v7.5 | Optional real-horse reuse for the prerequisite sire/base mare.
 * Requires an identical real parent pair, sex and complete 31-slot pedigree.
 * For a prepared sire, personally observed factors are mandatory; an empty
 * unverified factor list is NOT evidence that the horse has no factors.
 * Actual closing theory and full nine-stage bloodline must be rechecked by the
 * caller after substituting a reused horse. Never mutate any real horse.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildPrepReuse75=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=s=>String(s??'').normalize('NFKC').trim().toLowerCase();
 function pick(records,request,signature){
  if(!request||typeof signature!=='function'||!Array.isArray(request.rows)||request.rows.length!==31||!['male','female'].includes(request.sex))return null;
  const target=signature(request.rows);if(!target||!request.fatherId||!request.motherId)return null;
  const exclude=new Set((request.excludeIds||[]).map(norm));
  for(const h of records||[]){
   if(!h?.id||exclude.has(norm(h.id))||h.mode!=='real'||h.sex!==request.sex)continue;
   if(norm(h.fatherId)!==norm(request.fatherId)||norm(h.motherId)!==norm(request.motherId))continue;
   if(request.lineage&&norm(h.lineage)!==norm(request.lineage))continue;
   if(request.sex==='male'&&(h.factorsVerified!==true||!Array.isArray(h.factors)||h.factors.some(f=>!String(f||'').trim())))continue;
   if(signature(h.ancestry)!==target)continue;
   return {id:h.id,sex:h.sex,verifiedPersonalFactors:request.sex==='male',factorsObserved:request.sex==='male'?h.factors.length:null,
    factorSignature:request.sex==='male'?[...h.factors].map(norm).sort().join('|'):'',
    fatherId:request.fatherId,motherId:request.motherId,lineage:request.lineage||'',pedigreeSignature:target,
    status:'記録済み実馬の再利用候補',gameVerified:false};
  }
  return null;
 }
 function stillValid(records,evidence,signature){
  if(!evidence?.id||!evidence.pedigreeSignature||typeof signature!=='function')return false;
  const h=(records||[]).find(v=>norm(v?.id)===norm(evidence.id));
  if(!h||h.mode!=='real'||h.sex!==evidence.sex||norm(h.fatherId)!==norm(evidence.fatherId)||norm(h.motherId)!==norm(evidence.motherId))return false;
  if(evidence.lineage&&norm(h.lineage)!==norm(evidence.lineage))return false;
  if(h.sex==='male'&&(h.factorsVerified!==true||!Array.isArray(h.factors)||h.factors.map(norm).sort().join('|')!==evidence.factorSignature))return false;
  return signature(h.ancestry)===evidence.pedigreeSignature;
 }
 return Object.freeze({pick,stillValid});
});
