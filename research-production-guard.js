/* v4.2: Validates a staged multi-generation production plan before saving.
 * Checks only structural evidence, not game breeding theory or ability. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasProductionGuard42=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=v=>String(v??'').normalize('NFKC').trim();
const validPath=p=>/^[SD]{0,4}S$/.test(p)&&p.length<=5;
function checkPaths(record){
 const paths=(record?.ancestry||[]).map(r=>norm(r?.path));
 if(paths.length!==31||new Set(paths).size!==31||paths.some(p=>!validPath(p)))return false;
 return paths.every(p=>record.ancestry.some(r=>norm(r?.path)===p&&norm(r?.horse)));
}
function verify(plan,prepared,existing=[]){
 const errors=[];
 const rows=Array.isArray(prepared)?prepared:[];
 const byId=new Map();const preExisting=new Set((existing||[]).map(h=>norm(h.id)));
 const staged=new Set();let lastPrepOrder=0;
 for(const [i,r] of rows.entries()){
  const id=norm(r?.id);if(!id){errors.push(`生成馬${i+1}: IDなし`);continue;}
  if(byId.has(id)||preExisting.has(id))errors.push(`生成馬${i+1}: ID重複`);
  byId.set(id,r);staged.add(id);
 }
 const steps=Array.isArray(plan?.hard23?.preparations)?plan.hard23.preparations:[];
 const expected=steps.length+9;
 if(rows.length!==expected)errors.push(`生成馬数が一致（${rows.length}/${expected}）しません`);
 if(!plan?.id)errors.push('プランIDなし');
 const output=plan?.chain09?.outputs||{};
 for(let n=1;n<=9;n++){
  const id=norm(output[n]),record=byId.get(id);
  if(!record||Number(record.stepNo)!==n)errors.push(`工程${n}: 産駒が未登録`);
 }
 const usedOutputs=new Set();
 for(let n=1;n<=9;n++){
  const id=norm(output[n]);if(usedOutputs.has(id))errors.push(`工程${n}: 産駒の重複利用`);usedOutputs.add(id);
 }
 for(let i=0;i<steps.length;i++){
  const step=steps[i];const rec=byId.get(norm(step.foal));
  if(!rec)errors.push(`仕込み${i+1}: 産駒未登録`);
  else if(norm(step.father)!==norm(rec.fatherId)||norm(step.mother)!==norm(rec.motherId))errors.push(`仕込み${i+1}: 父母リンク不一致`);
  if(!Number.isInteger(step.order)||step.order<=lastPrepOrder)errors.push(`仕込み${i+1}: 生産順の逆転`);
  lastPrepOrder=step.order;
 }
 const produced=new Set();
 for(const [i,r] of rows.entries()){
  if(norm(r.planId)!==norm(plan.id))errors.push(`生成馬${i+1}: 所属プラン不一致`);
  if(!norm(r.fatherId)||!norm(r.motherId))errors.push(`生成馬${i+1}: 父母が未指定`);
  if(norm(r.fatherId)===norm(r.id)||norm(r.motherId)===norm(r.id))errors.push(`生成馬${i+1}: 自分を親に指定`);
  if(!checkPaths(r))errors.push(`生成馬${i+1}: 血統31枠が不完全`);
  for(const parent of [r.fatherId,r.motherId]){
   const pid=norm(parent);
   if(staged.has(pid)&&!produced.has(pid))errors.push(`生成馬${i+1}: 生成前の仮馬を親に指定`);
  }
  produced.add(norm(r.id));
 }
 return {ok:!errors.length,errors,generated:rows.length,preparations:steps.length,gameVerified:false};
}
return Object.freeze({verify,checkPaths});
});
