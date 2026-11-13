/* v5.2: Independent pre-save acceptance gate for the mild 9-stage route.
 * Inspects structural evidence only; does not certify in-game Shiko or SP/ST.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildGate51=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=v=>String(v??'').normalize('NFKC').trim();
const factors=v=>Array.isArray(v)?v.map(norm).filter(Boolean).sort().join('|'):'';
const positions=[['SSS','g3'],['DSSS','g4'],['DDDSS','g5']];
// v8.4: independently validate the exact 31 pedigree positions. `known:31`
// alone is never proof that the positions are unique and complete.
const expected=new Set();
for(let depth=1;depth<=5;depth++)for(let i=0;i<2**(depth-1);i++){
 let path='';for(let b=depth-2;b>=0;b--)path+=i&(1<<b)?'D':'S';
 expected.add(path+'S');
}
function verify31(pedigree){
 const rows=Array.isArray(pedigree?.rows)?pedigree.rows:[],seen=new Set();
 const errors=[];
 if(rows.length!==31||pedigree?.known!==31)errors.push('最終血統31枠が不足');
 for(const row of rows){
  const path=norm(row?.path);
  if(!expected.has(path))errors.push(`不正な祖先位置：${path||'未指定'}`);
  if(seen.has(path))errors.push(`祖先位置の重複：${path||'未指定'}`);
  seen.add(path);
  if(!norm(row?.name||row?.horse))errors.push(`${path||'祖先位置未指定'}：祖先名が未収録`);
 }
 for(const path of expected)if(!seen.has(path))errors.push(`祖先位置の欠落：${path}`);
 if(pedigree?.conflicts?.length)errors.push('最終血統の祖先情報が衝突');
 if(pedigree?.transmission){const t=pedigree.transmission;
  if(t.conflicts?.length||t.invalid?.length||t.duplicates?.length||t.unresolved?.length)
   errors.push('最終血統の親子継承に衝突・未解決がある');
 }
 return {ok:errors.length===0,errors,observed:seen.size,expected:31};
}
function inspect(plan,pedigree,homebreds,modules={}){
 const errors=[];
 if(!plan?.id||!plan?.chain09||!plan?.routeDraft?.slots)errors.push('9工程の計画情報が不足');
 const graph=modules.flowGuard?.verify?.(plan,homebreds,modules.reuseApi);
 const lineage=modules.lineage?.inspect?.(plan,homebreds,modules.stageResolver);
 if(!lineage?.ok)errors.push(...(lineage?.errors||['9工程の親子血統照合を利用できない']));
 if(!graph?.ok)errors.push(...(graph?.failures||['親子・工程検査が利用できない']));
 const rows=Array.isArray(pedigree?.rows)?pedigree.rows:[];
 const structural=verify31(pedigree);
 errors.push(...structural.errors);
 const positionsForPlan=plan?.routeDraft?.layout==='maternal-dds-g3'?[['DDS','g3'],['SSSS','g4'],['SDSSS','g5']]:plan?.routeDraft?.layout==='maternal-g3'?[['DSS','g3'],['SSSS','g4'],['SDSSS','g5']]:positions;
 const anchorIds=positionsForPlan.map(([path,slot])=>plan?.routeDraft?.slots?.[slot]);
 const members=anchorIds.map(id=>(plan?.source?.members||[]).find(m=>norm(m.id)===norm(id)));
 // A separate ID alone is not sufficient for three *different factor variants*.
 // Missing variant identifiers are unknown, not proof of distinct registrations.
 const variants=members.map(m=>norm(m?.variant));
 const distinctVariants=variants.every(Boolean)&&new Set(variants).size===3;
 if(!distinctVariants)errors.push('指定3頭の異因名が未収録・重複しています');
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
  if(!norm(row.factorVariant)||norm(member.variant)!==norm(row.factorVariant))
   errors.push(`${path}：異因名が未収録または登録と一致しません`);
 }
 return {ok:errors.length===0,errors,checkedPositions:structural.observed,checkedStages:graph?.checked||0,checkedLineageStages:lineage?.checked||0,distinctVariants,anchorFactorKinds:theory?.distinctFactorTypes??null,fullSiblingChecked:false,gameVerified:false,
  status:errors.length?'一次条件を満たさないため保存しない':'血統・工程の一次検査通過（ゲーム内未確認）'};
}
return Object.freeze({inspect,verify31});
});
