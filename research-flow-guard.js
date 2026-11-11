/* v5.1: Strict 31-position mild DAG validation; saved plans are not mutated. */
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
const EXPECTED=(()=>{const out=new Set();for(let depth=1;depth<=5;depth++)for(let i=0;i<2**(depth-1);i++){
 let route='';for(let bit=depth-2;bit>=0;bit--)route+=i&(1<<bit)?'D':'S';out.add(route+'S');
}return out;})();
function validAncestry(rows){
 if(!Array.isArray(rows)||rows.length!==31)return false;
 const seen=new Set();
 for(const row of rows){const path=norm(row?.path);
  if(!EXPECTED.has(path)||seen.has(path)||!norm(row?.horse||row?.name))return false;
  seen.add(path);
 }
 return seen.size===31;
}
function verify(plan,homebreds,reuseApi=null){
 const failures=[],chain=plan?.chain09||{},output=chain.outputs||{},mares=chain.mares||{},slots=plan?.routeDraft?.slots||{};
 const byId=new Map((homebreds||[]).map(h=>[norm(h.id),h]));
 const seen=new Set();
 if(!Array.isArray(plan?.steps)||plan.steps.length<9)failures.push('通常9工程の計画が不足');
 const route=plan?.routeDraft?.layout==='maternal-g3';
 const defs=route&&globalThis.DabimasMaternal66?globalThis.DabimasMaternal66.definitions:definitions;
 for(const def of defs){
  const id=norm(output[def.n]),horse=byId.get(id);
  if(!id||!horse){failures.push(`工程${def.n}：産駒未連結`);continue;}
  if(seen.has(id))failures.push(`工程${def.n}：同じ産駒の再使用`);seen.add(id);
  const mark=chain.reused50?.[def.n];
  if(mark){
   const req={step:def.n,sex:def.n===9?(chain.finalSex||'male'):def.sex,
    sireId:def.sireStep?output[def.sireStep]:def.sireSlot?slots[def.sireSlot]:chain.xId,
    mareId:def.mareStep?output[def.mareStep]:mares[def.n],lineage:mark.lineage,rows:horse.ancestry};
   if(!reuseApi?.verifyLink?.(horse,mark,req))failures.push(`工程${def.n}：再利用実馬の検証が不一致`);
  }else if(norm(horse.planId)!==norm(plan.id)||Number(horse.stepNo)!==def.n)failures.push(`工程${def.n}：プランまたは工程番号の不一致`);
  const sex=def.n===9?(chain.finalSex||'male'):def.sex;
  if(horse.sex!==sex)failures.push(`工程${def.n}：産駒の性別不一致`);
  const sire=def.sireStep?output[def.sireStep]:def.sireSlot?slots[def.sireSlot]:chain.xId;
  const mare=def.mareStep?output[def.mareStep]:mares[def.n];
  if(!norm(sire)||!norm(mare))failures.push(`工程${def.n}：父母が未指定`);
  if(norm(horse.fatherId)!==norm(sire)||norm(horse.motherId)!==norm(mare))failures.push(`工程${def.n}：父母リンクが不一致`);
  if(!validAncestry(horse.ancestry))failures.push(`工程${def.n}：血統31枠の欠落・位置重複・不正`);
 }
 return {ok:failures.length===0,failures,checked:defs.length,linked:seen.size};
}
return Object.freeze({verify,validAncestry,definitions:Object.freeze(definitions.map(d=>Object.freeze({...d})))});
});
