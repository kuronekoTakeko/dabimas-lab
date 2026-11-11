/* v5.2: Independent pre-save acceptance gate for the mild 9-stage route.
 * Inspects structural evidence only; does not certify in-game Shiko or SP/ST.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildGate51=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=v=>String(v??'').normalize('NFKC').trim();
const factors=v=>Array.isArray(v)?v.map(norm).filter(Boolean).sort().join('|'):'';
const positions=[['SSS','g3'],['DSSS','g4'],['DDDSS','g5']];
function inspect(plan,pedigree,homebreds,modules={}){
 const errors=[];
 if(!plan?.id||!plan?.chain09||!plan?.routeDraft?.slots)errors.push('9工程の計画情報が不足');
 const graph=modules.flowGuard?.verify?.(plan,homebreds,modules.reuseApi);
 const lineage=modules.lineage?.inspect?.(plan,homebreds,modules.stageResolver);
 if(!lineage?.ok)errors.push(...(lineage?.errors||['9工程の親子血統照合を利用できない']));
 if(!graph?.ok)errors.push(...(graph?.failures||['親子・工程検査が利用できない']));
 const rows=Array.isArray(pedigree?.rows)?pedigree.rows:[];
 if(pedigree?.known!==31||rows.length!==31||pedigree?.conflicts?.length)errors.push('最終血統31枠または祖先位置に不整合');
 if(pedigree?.transmission){const x=pedigree.transmission;
  if(x.conflicts?.length||x.invalid?.length||x.duplicates?.length||x.unresolved?.length)errors.push('親子血統の継承に不整合または未収録がある');
 }
 const positionsForPlan=plan?.routeDraft?.layout==='maternal-g3'?[['DSS','g3'],['SSSS','g4'],['SDSSS','g5']]:positions;
 const anchorIds=positionsForPlan.map(([path,slot])=>plan?.routeDraft?.slots?.[slot]);
 const theory=modules.validation?.inspect?.(pedigree,anchorIds,positionsForPlan.map(([path])=>path));
 if(!theory?.sameName||!theory?.idsDistinct||!theory?.sixKindCase||theory?.variantFactorConflicts?.length)errors.push('3×4×5・異因名・6因子種類の一次条件が不足');
 const byPath=new Map(rows.map(r=>[r.path,r]));
 for(const [path,slot] of positionsForPlan){
  const id=norm(plan?.routeDraft?.slots?.[slot]);
  const member=(plan?.source?.members||[]).find(m=>norm(m.id)===id);
  const row=byPath.get(path);
  if(!id||!member||!row||norm(row.name)!==norm(member.name)||!factors(row.factors)||factors(row.factors)!==factors(member.factors)){
   errors.push(`${path}：登録種牡馬の馬名・因子が一致しない`);continue;
  }
  if(norm(member.variant)&&norm(row.factorVariant)&&norm(member.variant)!==norm(row.factorVariant))errors.push(`${path}：異因名の不一致`);
 }
 return {ok:errors.length===0,errors,checkedPositions:rows.length,checkedStages:graph?.checked||0,checkedLineageStages:lineage?.checked||0,gameVerified:false,
  status:errors.length?'一次条件を満たさないため保存しない':'血統・工程の一次検査通過（ゲーム内未確認）'};
}
return Object.freeze({inspect});
});
