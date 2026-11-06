/* v4.1: Pure nine-step DAG validation for provisional horse production. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasFlowGuard41=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const definitions=[
 {n:1,sireSlot:'g3',mareInput:true,sex:'male'},
 {n:2,sireStep:1,mareInput:true,sex:'male'},
 {n:3,sireSlot:'g4',mareInput:true,sex:'male'},
 {n:4,sireStep:3,mareInput:true,sex:'male'},
 {n:5,sireSlot:'g5',mareInput:true,sex:'male'},
 {n:6,sireStep:5,mareInput:true,sex:'female'},
 {n:7,sireInput:true,mareStep:6,sex:'female'},
 {n:8,sireStep:4,mareStep:7,sex:'female'},
 {n:9,sireStep:2,mareStep:8,sex:'male'}
];
const norm=v=>String(v??'').normalize('NFKC').trim();
function verify(plan,homebreds){
 const failures=[],chain=plan?.chain09||{},output=chain.outputs||{},mares=chain.mares||{},slots=plan?.routeDraft?.slots||{};
 const byId=new Map((homebreds||[]).map(h=>[norm(h.id),h]));
 const seen=new Set();
 if(!Array.isArray(plan?.steps)||plan.steps.length<9)failures.push('通常9工程の計画が不足');
 for(const def of definitions){
  const id=norm(output[def.n]),horse=byId.get(id);
  if(!id||!horse){failures.push(`工程${def.n}：産駒未連結`);continue;}
  if(seen.has(id))failures.push(`工程${def.n}：同じ産駒の再使用`);seen.add(id);
  if(norm(horse.planId)!==norm(plan.id)||Number(horse.stepNo)!==def.n)failures.push(`工程${def.n}：プランまたは工程番号の不一致`);
  const sex=def.n===9?(chain.finalSex||'male'):def.sex;
  if(horse.sex!==sex)failures.push(`工程${def.n}：産駒の性別不一致`);
  const sire=def.sireStep?output[def.sireStep]:def.sireSlot?slots[def.sireSlot]:chain.xId;
  const mare=def.mareStep?output[def.mareStep]:mares[def.n];
  if(!norm(sire)||!norm(mare))failures.push(`工程${def.n}：父母が未指定`);
  if(norm(horse.fatherId)!==norm(sire)||norm(horse.motherId)!==norm(mare))failures.push(`工程${def.n}：父母リンクが不一致`);
  if(!Array.isArray(horse.ancestry)||horse.ancestry.filter(a=>a&&a.path&&a.horse).length<31)failures.push(`工程${def.n}：血統31枠が不足`);
 }
 return {ok:failures.length===0,failures,checked:definitions.length,linked:seen.size};
}
return Object.freeze({verify,definitions:Object.freeze(definitions.map(d=>Object.freeze({...d})))});
});
