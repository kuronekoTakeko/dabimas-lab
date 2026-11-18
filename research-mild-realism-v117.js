/* v117 | Evidence coverage / virtual ancestor gate for a proposed BC mating.
 * Read-only. This never certifies game theory, performance, or actual production.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildRealism117=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const str=x=>String(x??'').normalize('NFKC').trim();
 const isVirtual=x=>/仮(?:\d+)?(?:$|[^\p{L}\p{N}])|・工程\d+・仮|締め肌父仕込み・仮/u.test(str(x));
 function inspect({plan,exportReport,flow,readiness}={}){
  if(plan?.autoDesign21?.mode!=='mild')return null;
  const ancestors=exportReport?.parts?.foal?.ancestors;
  const hasExport=Array.isArray(ancestors)&&ancestors.length===31;
  const rows=hasExport?ancestors:[];
  const missing=rows.filter(r=>!str(r?.name));
  const placeholders=rows.filter(r=>isVirtual(r?.name)).map(r=>({path:str(r.path),name:str(r.name)}));
  const noFactor=rows.filter(r=>str(r?.name)&&(!Array.isArray(r?.factors)||r.factors.length===0)).map(r=>str(r.path));
  const fixedSlots=[['g3','DDS'],['g4','SSSS'],['g5','SDSSS']];
  const anchorRows=rows.length?new Map(rows.map(r=>[str(r.path),r])):new Map();
  const expected=exportReport?.anchorSlots||{};
  const anchors=fixedSlots.map(([role,path])=>({role,path,expected:str(expected[role]),found:str(anchorRows.get(path)?.name),variant:str(anchorRows.get(path)?.variant)}));
  const problems=[];
  if(!hasExport)problems.push('最終31枠の出力記録がないため実データ監査ができません');
  if(missing.length)problems.push(`馬名が未収録の祖先：${missing.length}枠`);
  if(placeholders.length)problems.push(`仮馬名の祖先が最終5代血統に${placeholders.length}枠含まれます`);
  if(noFactor.length)problems.push(`因子未収録：${noFactor.length}枠（因子0とみなしません）`);
  if(anchors.some(a=>!a.expected||!a.found))problems.push('至高指定3枠の情報が不足しています');
  if(flow?.errors?.length)problems.push('生産工程の登録・順序に不整合があります');
  if(readiness?.ok!==true)problems.push('保存プランの現時点での血統再照合が未通過です');
  const tasks=[];
  if(placeholders.length)tasks.push('仮馬名の各祖先について工程順と実生産状況を照合し、実馬ID・性別・系譜を登録する');
  if(noFactor.length||missing.length)tasks.push('不足する祖先・因子を資料とゲーム内表示で照合する');
  tasks.push('至高指定3枠の馬ID・異因名・子系統と阻害条件を外部照合する');
  tasks.push('肌作りの配合理論と最終至高の成立をゲーム内で確認する');
  const structuralReady=hasExport&&missing.length===0&&flow?.errors?.length===0&&readiness?.ok===true;
  return {version:117,hasExport,registeredSlots:rows.length-missing.length,virtualPositions:placeholders,virtualCount:placeholders.length,
   unknownFactorPositions:noFactor,unknownFactorCount:noFactor.length,anchors,problems,tasks,
   structuralReady,allHorsesProduced:placeholders.length===0&&flow?.virtualCount===0&&flow?.unlinkedCount===0,
   verifiedInGame:false,mayStartProduction:false,
   caveat:'これは登録血統と仮馬の不足状況の監査です。全枠が登録済みでも、ゲーム内の至高・完璧・超完璧、実際の産駒能力は確定しません。'};
 }
 return Object.freeze({inspect});
});
