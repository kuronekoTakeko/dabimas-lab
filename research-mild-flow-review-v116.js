/* v116 | Read-only production dependency & actual/virtual lineage review.
 * Does not certify in-game theory, foal ability or production completion.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildFlowReview116=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const key=x=>String(x??'').normalize('NFKC').trim();
 function inspect({plan,stages=[],readiness=null,stageAudit=null}={}){
  if(plan?.autoDesign21?.mode!=='mild')return null;
  const errors=[],warnings=[],outputs=new Map(),seenStages=new Set();
  const core=stages.filter(s=>s?.kind==='core'),prep=stages.filter(s=>s?.kind==='prep');
  if(core.length!==9||prep.length>2||stages.length!==core.length+prep.length)errors.push('工程数が基本9・準備最大2の構成と一致しません');
  if(core.map(x=>Number(x.number)).join(',')!=='1,2,3,4,5,6,7,8,9')errors.push('基本工程1〜9の順序が不正です');
  for(const [i,s] of stages.entries()){
   const id=key(s.id),out=key(s.outputId);
   if(!id||seenStages.has(id))errors.push('工程のIDが重複または欠落：'+(id||i));seenStages.add(id);
   if(out){if(outputs.has(out))errors.push('同じ産駒IDを別工程で再使用：'+out);else outputs.set(out,i);}
  }
  const rows=stages.map((s,i)=>{
   const sireId=key(s.sireId),mareId=key(s.mareId),out=key(s.outputId),issues=[];
   if(!sireId||!mareId)issues.push('父母が未連結');
   if(sireId&&sireId===mareId)issues.push('同じ馬を父母に指定');
   for(const [role,id] of [['父',sireId],['母',mareId]]){
    if(!outputs.has(id))continue;
    const producer=outputs.get(id);
    if(producer>=i)issues.push(role+'が未生産の後工程を参照');
   }
   if(issues.length)errors.push(String(s.label||s.id||i)+'：'+issues.join('／'));
   const real=s.outputMode==='real';
   return {id:key(s.id),label:key(s.label||s.id),kind:s.kind,number:s.number??null,sireId,mareId,outputId:out,
    state:!out?'未連結':real?'実馬登録':'仮馬・未生産',reused:s.reused===true,issues};
  });
  const realCount=rows.filter(r=>r.state==='実馬登録').length,virtualCount=rows.filter(r=>r.state==='仮馬・未生産').length,
   unlinkedCount=rows.filter(r=>r.state==='未連結').length;
  if(readiness?.ok!==true||stageAudit?.ok!==true)warnings.push('保存時の血統・親子関係・至高一次検査が未通過です');
  if(virtualCount)warnings.push('仮馬'+virtualCount+'件はゲーム内生産済みではありません');
  if(unlinkedCount)warnings.push('産駒未連結'+unlinkedCount+'件を確認してください');
  return {version:116,ok:errors.length===0&&unlinkedCount===0&&readiness?.ok===true&&stageAudit?.ok===true,
   errors:[...new Set(errors)],warnings,rows,coreCount:core.length,prepCount:prep.length,realCount,virtualCount,unlinkedCount,
   gameConfirmed:false,productionAuthorized:false,
   caveat:'工程順と父母参照の登録上の検査です。実馬登録もゲーム内の配合理論・能力・生産結果を保証しません。仮馬を実馬扱いしません。'};
 }
 return Object.freeze({inspect});
});
