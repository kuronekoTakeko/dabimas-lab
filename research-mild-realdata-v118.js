/* v118 | Current-inventory evidence audit for mild BC breeding plans.
 * Pure/read-only. Never asserts game theory, mare availability or actual foal stats.
 * No remote requests, storage writes, record mutation or automatic clearance.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildRealdata118=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const key=v=>String(v??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const names=arr=>Array.isArray(arr)?arr:[];
 function auditInventory({owned={},master=[],homebreds=[]}={}){
  const ids=new Set(),duplicates=[];let stallions=0,mares=0;
  for(const r of names(master)){
   const id=key(r?.id);if(!id)continue;
   if(ids.has(id))duplicates.push(String(r.id));ids.add(id);
   if(r.sex==='male')stallions++;else if(r.sex==='female')mares++;
  }
  const acquired=Object.entries(owned||{}).filter(([,v])=>v?.owned===true);
  const unmatched=acquired.filter(([id])=>!ids.has(key(id))).map(([id,v])=>({id,rights:validRights(v?.rights)}));
  const zeroRights=acquired.filter(([,v])=>validRights(v?.rights)===0).length;
  const draft=names(homebreds).filter(h=>h?.mode!=='real').length;
  return {version:118,acquired:acquired.length,matched:acquired.length-unmatched.length,unmatched,zeroRights,
   totalRights:acquired.reduce((n,[,v])=>n+(validRights(v?.rights)||0),0),
   masterRecords:names(master).length,stallions,mares,duplicateIds:duplicates,
   homebreds:names(homebreds).length,draftHomebreds:draft,
   verifiedInGame:false,source:'端末の所持登録と公開マスターのID照合（完全一致・年号/異因名の推測統合なし）'};
 }
 function validRights(x){if(x==null||x==='')return null;const n=Number(x);return Number.isSafeInteger(n)&&n>=0?n:null;}
 function inspect({plan,stages=[],owned={},master=[],homebreds=[]}={}){
  if(plan?.autoDesign21?.mode!=='mild')return null;
  const inventory=auditInventory({owned,master,homebreds});
  const byMaster=new Map(names(master).filter(r=>r?.id).map(r=>[key(r.id),r]));
  const byHome=new Map(names(homebreds).filter(h=>h?.id).map(h=>[key(h.id),h]));
  const byOwned=new Map(Object.entries(owned||{}).map(([k,v])=>[key(k),v]));
  const errors=[],unknown=[],rights=new Map(),mareUses=new Map(),virtualOutputs=[],stageRows=[],outputAt=new Map();
  if(!Array.isArray(stages)||stages.length<9||stages.length>11||stages.filter(s=>s?.kind==='core').length!==9)
   errors.push('基幹9工程＋準備最大2工程が揃っていません');
  for(const [i,s] of names(stages).entries()){
   if(s?.outputId){const id=key(s.outputId);if(outputAt.has(id))errors.push(`工程${i+1}：産駒IDが重複`);else outputAt.set(id,i);}
  }
  for(const [i,s] of names(stages).entries()){
   const row={id:String(s?.id||''),label:String(s?.label||s?.id||`工程${i+1}`),sireId:String(s?.sireId||''),mareId:String(s?.mareId||''),outputId:String(s?.outputId||'')};
   const parents=[];
   for(const [role,id,wanted] of [['父',row.sireId,'male'],['母',row.mareId,'female']]){
    const k=key(id),publicHorse=byMaster.get(k),own=byOwned.get(k),homemade=byHome.get(k);
    let category='missing',entry=publicHorse||homemade;
    if(publicHorse){category='public';if(publicHorse.sex!==wanted)errors.push(row.label+`：${role}の性別が一致しません`);}
    else if(homemade){category='homebred';if(homemade.sex!==wanted)errors.push(row.label+`：${role}の性別が一致しません`);}
    else if(own?.owned===true){category='unmatched-owned';unknown.push(row.label+`：${role} ${id}（所持登録あり・公開血統未収録）`);}
    else{errors.push(row.label+`：${role} ${id||'未指定'} を公開/自家製データで特定できません`);}
    if(outputAt.has(k)&&outputAt.get(k)>=i)errors.push(row.label+`：${role}が後工程の産駒を参照`);
    if(category==='public'&&role==='父'){
     if(own?.owned!==true)errors.push(row.label+`：未所持の種牡馬 ${id}`);
     const rec=rights.get(k)||{id,uses:0,rights:validRights(own?.rights),owned:own?.owned===true};
     rec.uses+=1;rights.set(k,rec);
    }
    if(category==='public'&&role==='母'){
     const rec=mareUses.get(k)||{id,uses:0};rec.uses+=1;mareUses.set(k,rec);
    }
    if(category==='homebred'&&entry.mode!=='real')unknown.push(row.label+`：${role}の自家製馬は仮登録（${id}）`);
    parents.push({role,id,category,sex:entry?.sex||'unknown',registered:!!entry});
   }
   const output=byHome.get(key(row.outputId));
   if(!row.outputId||!output)unknown.push(row.label+'：産駒の登録IDを照合できません');
   else if(output.mode!=='real')virtualOutputs.push({label:row.label,id:row.outputId});
   if(output&&key(output.fatherId)!==key(row.sireId)||output&&key(output.motherId)!==key(row.mareId))
    errors.push(row.label+'：産駒の登録父母と工程指定が不一致');
   row.parents=parents;stageRows.push(row);
  }
  const sireDemands=[...rights.values()].map(r=>({...r,recordedShortage:r.rights==null?null:Math.max(0,r.uses-r.rights),shortage:r.owned?0:null,planningRights:r.owned?Math.max(10,r.uses):0,exchangeable:r.owned}));
  const missingRights=sireDemands.filter(r=>!r.owned); // v122: registered rights do not block owned horses
  const finalRows=plan?.externalReview48?.parts?.foal?.ancestors;
  const saved31=Array.isArray(finalRows)&&finalRows.length===31;
  if(!saved31)unknown.push('最終31枠の保存済み外部照合がありません');
  if(plan?.mild94?.ok!==true||plan?.mild97?.ok!==true||plan?.mild98?.ok!==true)
   unknown.push('保存時のv94/v97/v98検査結果が揃っていません（現在の再実行も必要）');
  const anchorPaths={g3:'DDS',g4:'SSSS',g5:'SDSSS'};
  const anchorRows=new Map(names(finalRows).filter(x=>x?.path).map(x=>[x.path,x]));
  const anchorIds=plan?.routeDraft?.slots||{};
  const anchors=Object.entries(anchorPaths).map(([role,p])=>{
   const id=String(anchorIds[role]||''),row=anchorRows.get(p),current=byMaster.get(key(id));
   const found=row?String(row.name||'')+(row.variant?'-'+row.variant+'-':''):'';
   // v119: A numeric release such as キングカメハメハ2012 is displayed
   // as キングカメハメハ-2012- in 31-slot exports. Accept ONLY a documented
   // year-suffix notation for the exact current master record. Do not merge
   // a different era or a different factor-name variant by base name alone.
   const yearNotation=!!current&&/^(?:19|20)\d{2}$/.test(String(row?.variant||''))&&
    key(id)===key(String(row?.name||'')+String(row?.variant||''))&&
    key(current.name)===key(row?.name)&&key(current.variant)===key(row?.variant);
   return {role,path:p,expected:id,observed:found,recordPresent:!!current,
    sameRegisteredId:!!id&&!!found&&!!current&&(key(id)===key(found)||yearNotation),
    notationOnly:yearNotation&&key(id)!==key(found),factorCount:current?.factors?.length??null};
  });
  const distinctAnchors=anchors.every(x=>x.expected)&&new Set(anchors.map(x=>key(x.expected))).size===3;
  if(!distinctAnchors)unknown.push('至高指定3枠の異なる登録IDを確認できません');
  if(anchors.some(a=>!a.sameRegisteredId))unknown.push('保存31枠の至高指定3頭と、現在の登録IDの一致が確認できません（年号表記は別途照合）');
  const knownFirst=stageRows[0]?.parents.every(p=>p.registered)?[{label:stageRows[0].label,sire:stageRows[0].sireId,mare:stageRows[0].mareId}]:[];
  return {version:118,inventory,stages:stageRows,errors:[...new Set(errors)],unconfirmed:[...new Set(unknown)],
   publicSires:sireDemands,rightsToConfirm:missingRights,publicMares:[...mareUses.values()],virtualOutputs,
   saved31,anchors,distinctAnchors,previousAuditsOk:plan?.mild94?.ok===true&&plan?.mild97?.ok===true&&plan?.mild98?.ok===true,
   proposedFirst:knownFirst[0]||null,structuralRefsOk:errors.length===0,canStartProduction:false,gameVerified:false,
   caveat:'所持・公開マスター・生産工程の現在の参照確認です。取得済み種牡馬はポイント交換可能として扱い、登録権利は変更しません。繁殖牝馬の確保・配合理論は別途照合してください。仮登録は実生産の証明ではありません。'};
 }
 return Object.freeze({auditInventory,inspect});
});
