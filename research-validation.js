/* v3.8: additional independent pedigree-evidence validation.
 * No imported third-party code/data. No inference of in-game theory or horse ability.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DabimasResearchValidation38=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const normalize=x=>String(x==null?'':x).normalize('NFKC').replace(/[\s　]/g,'').toLowerCase();
 const anchors=['SSS','DSSS','DDDSS'];
 const factorSet=x=>[...new Set((Array.isArray(x)?x:[]).filter(Boolean).map(normalize))].sort().join('|');
 function inspect(pedigree,anchorIds){
  const rows=Array.isArray(pedigree&&pedigree.rows)?pedigree.rows:[];
  const idList=Array.isArray(anchorIds)?anchorIds:[];
  const byPath=new Map(),conflicts=[],fingerprints=new Map();
  for(const row of rows){
   if(!row||!row.name)continue;
   const base=normalize(row.name),variant=normalize(row.factorVariant);
   // If the same registered name and factor-variant recur with different known
   // factor sets, evidence is inconsistent; missing arrays are UNKNOWN, not zero.
   if(variant&&Array.isArray(row.factors)&&row.factors.length){
    const k=base+'|'+variant,signature=factorSet(row.factors);
    if(fingerprints.has(k)&&fingerprints.get(k).signature!==signature){
     const prev=fingerprints.get(k);
     conflicts.push({name:row.name,variant:row.factorVariant,paths:[prev.path,row.path]});
    }else if(!fingerprints.has(k))fingerprints.set(k,{signature,path:row.path});
   }
   if(!byPath.has(row.path))byPath.set(row.path,row);
  }
  const trio=anchors.map(p=>byPath.get(p));
  const knownTrio=trio.every(x=>x&&normalize(x.name));
  const sameName=knownTrio&&trio.every(x=>normalize(x.name)===normalize(trio[0].name));
  const idsComplete=idList.length===3&&idList.every(normalize);
  const idsDistinct=idsComplete&&new Set(idList.map(normalize)).size===3;
  const factorCounts=trio.map(x=>x&&Array.isArray(x.factors)?x.factors.length:0);
  const totalKnownFactors=factorCounts.reduce((a,b)=>a+b,0);
  const distinctFactorTypes=new Set(trio.flatMap(x=>x&&Array.isArray(x.factors)?x.factors.filter(Boolean).map(normalize):[])).size;
  const factorEvidenceComplete=trio.every(x=>x&&Array.isArray(x.factors)&&x.factors.length);
  // 4 kinds and >=6 instances has PLAYER-REPORTED examples, not independently
  // verified game criteria. Never upgrade such cases to confirmed Shiko.
  const reportedFourKindCase=sameName&&idsDistinct&&factorEvidenceComplete&&distinctFactorTypes>=4&&totalKnownFactors>=6&&distinctFactorTypes<6;
  const sixKindCase=sameName&&idsDistinct&&factorEvidenceComplete&&distinctFactorTypes>=6;
  return {schema:1,anchorPaths:anchors.slice(),sameName,idsComplete,idsDistinct,
   factorEvidenceComplete,totalKnownFactors,distinctFactorTypes,reportedFourKindCase,sixKindCase,
   variantFactorConflicts:conflicts,gameVerified:false,
   state:conflicts.length?'血統データ矛盾':sixKindCase?'6種類の研究上の一次条件':reportedFourKindCase?'4種類・計6因子の報告例に類似（未検証）':'根拠不足・未確認'};
 }
 function compare(a,b){
  if(!a||!b)return 0;
  if(a.variantFactorConflicts.length!==b.variantFactorConflicts.length)return a.variantFactorConflicts.length-b.variantFactorConflicts.length;
  // Comparison only of evidence quality. Reported 4-kind cases are never
  // ranked above an otherwise equivalent, better-evidenced six-kind case.
  if(a.sixKindCase!==b.sixKindCase)return a.sixKindCase?-1:1;
  if(a.factorEvidenceComplete!==b.factorEvidenceComplete)return a.factorEvidenceComplete?-1:1;
  return 0;
 }
 return Object.freeze({inspect,compare});
});
