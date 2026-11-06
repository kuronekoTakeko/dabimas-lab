/* v4.4: conservative read-only identification of reusable ACTUAL horses.
 * Matching a name alone, or even the same sire/dam labels, is not sufficient.
 * This analysis deliberately never rewires a saved plan or its production DAG. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasReuse44=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=x=>String(x??'').normalize('NFKC').trim();
const paths=(()=>{const out=[];function walk(p){if(p.length>4)return;out.push(p+'S');walk(p+'S');walk(p+'D');}walk('');return out.sort();})();
function signature(h){
 if(!Array.isArray(h?.ancestry)||h.ancestry.length!==31)return null;
 const m=new Map();
 for(const a of h.ancestry){const p=norm(a?.path);if(!paths.includes(p)||m.has(p)||!norm(a?.horse)||!Array.isArray(a?.factors))return null;
  // Factor data must be known, not simply omitted. Empty [] is ambiguous unless
  // an explicit verification marker distinguishes verified absence.
  if(!a.factors.length&&!a.factorVerified&&!a.factorsVerified)return null;
  if(!norm(a?.factorVariant)&&!a?.variantVerified)return null;
  if(!norm(a?.line)&&!a?.lineVerified)return null;
  m.set(p,[norm(a.horse),norm(a.factorVariant),norm(a.line),a.factors.map(norm).sort().join(',')].join('\u001f'));
 }
 if(m.size!==31||paths.some(p=>!m.has(p)))return null;
 return paths.map(p=>m.get(p)).join('\u001e');
}
function inspect(plan,homebreds){
 const results=[],outputs=plan?.chain09?.outputs||{};
 const records=Array.isArray(homebreds)?homebreds:[];
 for(let n=1;n<=9;n++){
  const draft=records.find(h=>norm(h?.id)===norm(outputs[n])&&norm(h?.planId)===norm(plan?.id)&&Number(h?.stepNo)===n);
  if(!draft)continue;
  const sig=signature(draft);
  const candidates=sig?records.filter(h=>h!==draft&&h.mode==='real'&&h.sex===draft.sex&&signature(h)===sig):[];
  results.push({step:n,complete:!!sig,candidates:candidates.map(h=>({id:h.id,name:h.name}))});
 }
 return {checked:results.length,comparable:results.filter(x=>x.complete).length,reusable:results.filter(x=>x.candidates.length),steps:results,automaticSubstitution:false};
}
return Object.freeze({inspect,signature,expectedPaths:()=>[...paths]});
});
