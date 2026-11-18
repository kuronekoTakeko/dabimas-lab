/* v124 | Compare saved mild design with CURRENT registered draft/homebred records.
 * This is a conservative, read-only local-data consistency check.
 * Do not confuse cloned draft ancestries with externally verified game pedigrees.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildLiveAudit124=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const arr=x=>Array.isArray(x)?x:[],norm=x=>String(x??'').normalize('NFKC').trim().replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-');
 const fs=x=>arr(x).map(norm).filter(Boolean).sort().join('|');
 const sameRow=(a,b)=>!!a&&!!b&&norm(a.path)===norm(b.path)&&norm(a.name)===norm(b.horse)&&norm(a.variant)===norm(b.factorVariant)&&norm(a.line)===norm(b.line)&&fs(a.factors)===fs(b.factors);
 function assess({plan,homebreds=[],master=[]}={}){
  if(plan?.autoDesign21?.mode!=='mild')return null;
  const errors=[],unknown=[],hb=arr(homebreds),by=new Map(),dup=new Set();
  for(const h of hb){const id=norm(h?.id);if(!id)continue;if(by.has(id))dup.add(id);else by.set(id,h);}
  const stages=arr(plan?.mild98?.stages),out=plan?.chain09?.outputs||{},mares=plan?.chain09?.mares||{},slots=plan?.routeDraft?.slots||{};
  const prep=plan?.mild67?.prep,extra=arr(plan?.hard23?.preparations),number=x=>out[String(x)]||'';
  const expected=new Map([
   [1,[slots.g3,mares[1]]], [2,[plan?.chain09?.xId,number(1)]], [3,[slots.g4,mares[3]]],
   [4,[number(3),mares[4]]], [5,[slots.g5,mares[5]]], [6,[number(5),mares[6]]],
   [7,[number(6),mares[7]]], [8,[number(4),number(7)]], [9,[number(8),number(2)]]
  ]);
  const rows=[];let checkedParents=0,drafts=0,reals=0,ancestorsMatched=0,ancestorsChecked=0;
  const core=stages.filter(s=>s?.kind==='core'),preps=stages.filter(s=>s?.kind==='prep');
  if(stages.length===0){unknown.push('保存時のv98工程スナップショットがありません');}
  else if(core.length!==9||preps.length>2||stages.length!==core.length+preps.length)errors.push('保存工程が9基幹＋準備最大2の形ではありません');
  if(stages.length>0&&preps.length===0&&prep)errors.push('準備交配が保存工程から欠落しています');
  if(plan?.mild97?.ok!==true||plan?.mild98?.ok!==true||plan?.mild94?.ok!==true)unknown.push('保存時のv94/v97/v98検査が揃っていません');
  const matchedOutputs=new Set();
  for(const st of stages){
   const n=st.kind==='core'?Number(st.number):null;
   let outputId='',reference=null;
   if(st.kind==='core'){
    outputId=number(n);reference=expected.get(n);
    if(!Number.isInteger(n)||n<1||n>9){errors.push('基幹工程番号が不正');continue;}
    if(!reference||norm(st.sire)!==norm(reference[0])||norm(st.mare)!==norm(reference[1]))errors.push('工程'+n+'：現行プランの指定父母と保存工程の記録が不一致');
   }else if(st.id==='P:sire'){
    outputId=prep?.foalId||plan?.chain09?.xId||'';
    reference=[prep?.fatherId,prep?.motherId];
   }else if(st.id?.startsWith('P:hard:')){
    const i=Number(st.id.slice('P:hard:'.length)),p=extra[i];outputId=p?.foalId||p?.outputId||'';reference=[p?.father,p?.mother];
   }else{errors.push('準備工程の種別が未対応：'+String(st.id));}
   if(reference&&(norm(st.sire)!==norm(reference[0])||norm(st.mare)!==norm(reference[1])))errors.push(String(st.id)+'：現行プランと保存工程の父母指定が不一致');
   const output=by.get(norm(outputId));
   if(!outputId||!output){errors.push(String(st.id)+'：産駒登録が見つかりません');rows.push({stage:st.id,outputId,found:false});continue;}
   if(matchedOutputs.has(norm(outputId)))errors.push('別工程に同一産駒IDを使用：'+outputId);
   matchedOutputs.add(norm(outputId));
   if(dup.has(norm(outputId)))errors.push('自家製馬マスターの同一IDが重複：'+outputId);
   if(norm(output.planId)!==norm(plan.id))errors.push(String(st.id)+'：産駒のプランIDが不一致');
   if(st.kind==='core'&&Number(output.stepNo)!==n)errors.push(String(st.id)+'：産駒の工程番号が不一致');
   if(norm(output.fatherId)!==norm(st.sire)||norm(output.motherId)!==norm(st.mare))errors.push(String(st.id)+'：産駒の父母IDが保存工程と不一致');
   else checkedParents++;
   const desiredSex=st.kind==='core'?({1:'female',2:'female',3:'male',4:'male',5:'male',6:'male',7:'female',8:'male'}[n]||''):st.kind==='prep'?'male':'';
   if(desiredSex&&norm(output.sex)!==desiredSex)errors.push(String(st.id)+'：必要な産駒性別が不一致');
   if(output.mode==='real')reals++;else {drafts++;if(output.mode!=='draft')unknown.push(String(st.id)+'：仮登録か実馬か未確認');}
   rows.push({stage:st.id,outputId,found:true,mode:output.mode,fatherId:st.sire,motherId:st.mare});
  }
  // Compare current ancestry for both final parents and their final foal to the saved evidence.
  const e=plan?.externalReview48?.parts||{};
  for(const [part,n] of [['sire',8],['mare',2],['foal',9]]){
   const output=by.get(norm(number(n))),saved=arr(e[part]?.ancestors),now=arr(output?.ancestry);
   if(saved.length!==31||now.length!==31){unknown.push(part+'：外部照合31枠または現行祖先31枠が不足');continue;}
   const a=new Map(),b=new Map();for(const r of saved){if(a.has(r.path))errors.push(part+'：保存祖先位置が重複：'+r.path);a.set(r.path,r);}
   for(const r of now){if(b.has(r.path))errors.push(part+'：現行祖先位置が重複：'+r.path);b.set(r.path,r);}
   let count=0;for(const [path,row] of a){ancestorsChecked++;if(sameRow(row,b.get(path))){count++;ancestorsMatched++;}else errors.push(part+'：祖先'+path+'の馬名・異因名・因子・系統に差分');}
   if(count!==31)unknown.push(part+'：祖先'+count+'/31一致');
  }
  const publicIds=new Set(arr(master).map(r=>norm(r?.id)));
  const ownedConfirmed=Object.values(slots).filter(id=>publicIds.has(norm(id))).length;
  if(ownedConfirmed!==3)unknown.push('指定した至高3頭の公開マスターIDが不足');
  const fullyReconciled=stages.length>=9&&errors.length===0&&unknown.length===0&&checkedParents===stages.length&&ancestorsMatched===93;
  return {version:124,title:plan.title||'',checkedStages:stages.length,checkedParents,generated:rows.length,
   draftCount:drafts,realCount:reals,registeredAncestorMatches:ancestorsMatched,registeredAncestorsChecked:ancestorsChecked,
   anchorIdsInMaster:ownedConfirmed,fullyReconciled,rows,errors:[...new Set(errors)],unconfirmed:[...new Set(unknown)],
   gameVerified:false,authorizedForBreeding:false,confirmedEffectiveCrosses:null,
   firstMating:preps.length?{sire:preps[0].sire,mare:preps[0].mare,label:'追加準備'}:{sire:expected.get(1)[0],mare:expected.get(1)[1],label:'工程1'},
   caveat:'現行の自家製馬登録と保存血統を再照合。すべて一致しても仮馬の再現と登録資料の整合性に限られ、ゲーム内至高・締め肌理論・有効クロス・SP/ST・繁殖牝馬確保は未検証。'};
 }
 return Object.freeze({assess});
});
