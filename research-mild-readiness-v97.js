/* v97 | Read-only MILD production handoff and drift check.
 * A prior passing result is not proof that edited parents, imported master,
 * real-horse records, objectives, or saved plans still describe the same
 * matings. Passing means ONLY that documented pedigrees can be reassembled;
 * never game-verified theory, mare availability, or predicted SP/ST.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildReadiness97=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=v=>String(v??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const factors=x=>Array.isArray(x)?x.map(norm):[];
 function digest(value){const text=JSON.stringify(value),s=String(text||'');let h=2166136261;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return s.length+':'+h.toString(16).padStart(8,'0');
 }
 function pedigreeIdentity(ped){
  if(!Array.isArray(ped?.rows)||ped.rows.length!==31||ped.known!==31)return null;
  const ordered=ped.rows.map(r=>[norm(r?.path),norm(r?.name||r?.horse),norm(r?.factorVariant),norm(r?.line),norm(r?.parentSystem),factors(r?.factors)])
   .sort((a,b)=>a[0].localeCompare(b[0]));
  if(new Set(ordered.map(r=>r[0])).size!==31||ordered.some(r=>!r[0]||!r[1]))return null;
  if(ped.conflicts?.length||ped.transmission?.conflicts?.length||ped.transmission?.invalid?.length)return null;
  return digest(ordered);
 }
 function assess({plan,matings=[],finalPed,closingPed,stored=null,requireSaved=false,release=null,siblings=null,owned={},goal=null,race=null}={}){
  const errors=[],warnings=[];
  const original=plan?.autoDesign21||{},mild=original.mode==='mild';
  if(!mild)errors.push('マイルド型の自動設計プランではありません');
  if(plan?.steps?.length!==9)errors.push('基幹9工程の保存数が一致しません');
  const core=matings.filter(x=>x?.kind==='core'),prep=matings.filter(x=>x?.kind==='prep');
  if(core.length!==9||matings.length!==core.length+prep.length||prep.length>2)errors.push('基幹9工程・準備工程の数が一致しません');
  const allIds=new Set(matings.map(x=>String(x?.id||'')));
  if(allIds.size!==matings.length||allIds.has(''))errors.push('工程の識別子が重複または未設定');
  const numbers=core.map(x=>Number(x?.number)).sort((a,b)=>a-b);
  if(numbers.join(',')!=='1,2,3,4,5,6,7,8,9')errors.push('基幹工程番号が欠落・重複しています');
  const uniqueMares=new Map(),sireDemands=new Map();
  for(const m of matings){
   const label=String(m?.label||m?.id||'工程'),sireId=String(m?.sireId||''),mareId=String(m?.mareId||'');
   if(!sireId||!mareId)errors.push(label+'：父または母が未指定');
   if(m?.ready!==true||m?.pedigreeKnown!==31||m?.problems?.length)
    errors.push(label+'：血統31枠・親子関係の再検査に未通過'+(m?.problems?.length?'（'+m.problems.slice(0,2).join('／')+'）':''));
   if(m?.sireType==='unknown'||m?.mareType==='unknown')errors.push(label+'：父母の公開／自家製区分を確認できません');
   if(m?.mareType==='public'&&mareId){const k=norm(mareId);const x=uniqueMares.get(k)||{id:mareId,uses:0};x.uses++;uniqueMares.set(k,x);}
   if(m?.sireType==='public'&&sireId&&m?.reused!==true){
    const k=norm(sireId),rec=owned[k],row=sireDemands.get(k)||{id:sireId,uses:0,rights:null,owned:false};
    row.uses++;row.owned=rec?.owned===true;
    row.rights=rec?.rights!==''&&rec?.rights!=null&&Number.isSafeInteger(Number(rec.rights))&&Number(rec.rights)>=0?Number(rec.rights):null;
    sireDemands.set(k,row);
    if(!row.owned)errors.push(label+'：未所持の公開種牡馬 '+sireId);
   }
  }
  const finalFingerprint=pedigreeIdentity(finalPed),closingFingerprint=pedigreeIdentity(closingPed);
  if(!finalFingerprint)errors.push('最終産駒の血統31枠が未完成・矛盾');
  if(!closingFingerprint)errors.push('締め肌を生産する交配の血統31枠が未完成・矛盾');
  if(release?.ok!==true)errors.push('保存直前の配合理論・至高一次判定を確認できません');
  if(!siblings||siblings.version!==95)errors.push('既知の全兄弟姉妹チェックを実行できません（v95モジュールの読込・バージョンを確認）');
  else if(siblings.blocked){
   const details=(Array.isArray(siblings.conflicts)?siblings.conflicts:[]).map(c=>
    String(c.anchor||'対象馬')+'／'+String(c.sibling||'全兄弟姉妹')+'（'+String(c.path||'位置不明')+'）');
   errors.push('既知の全兄弟姉妹の衝突：'+(details.length?details.join('・'):'衝突情報が欠落（v95監査結果を確認）'));
  }
  const plannedGoal=String(original.goal||''),plannedRace=String(original.race||'');
  const actualGoal=String(goal??plan?.goal??''),actualRace=String(race??plan?.target??'').replace(/^公式BC想定[：:]\s*/, '');
  if(!plannedGoal||plannedGoal!==actualGoal)errors.push('能力方針が自動設計時から変更されています（再探索が必要）');
  if(!plannedRace||norm(plannedRace)!==norm(actualRace))errors.push('目標レース・距離が自動設計時から変更されています（再探索が必要）');
  const parentSignature=digest(matings.map(m=>[m.id,norm(m.sireId),norm(m.mareId),m.kind,m.number??null]));
  const current=digest([finalFingerprint,closingFingerprint,parentSignature,norm(plannedGoal),norm(plannedRace)]);
  if(requireSaved&&stored?.version!==97)errors.push('旧版のプラン：v97の保存時照合情報がありません（新しい自動設計で再検証してください）');
  if(stored?.version===97&&stored.fingerprint!==current)errors.push('保存時の血統・父母・目標条件から変更されています（再検証が必要）');
  const demands=[...sireDemands.values()].map(r=>({...r,recordedShortage:r.rights===null?null:Math.max(0,r.uses-r.rights),shortage:r.owned?0:null,exchangeable:r.owned,planningRights:r.owned?Math.max(10,r.uses):0}));
  // v122: recorded rights are not an acceptance criterion for acquired stallions.
  const mares=[...uniqueMares.values()].sort((a,b)=>a.id.localeCompare(b.id,'ja'));
  if(mares.length)warnings.push(`公開繁殖牝馬${mares.length}種類・延べ${mares.reduce((a,m)=>a+m.uses,0)}回：ゲーム内の確保・使用可否は未確認`);
  const failures=[...new Set(errors)],ok=failures.length===0;
  return {version:97,ok,status:ok?'再現可能な仮設計（ゲーム内未確認）':'再検証が必要',errors:failures,warnings,
   fingerprint:current,finalFingerprint,closingFingerprint,parentSignature,
   originalGoal:plannedGoal,originalRace:plannedRace,currentGoal:actualGoal,currentRace:actualRace,
   core:core.length,preparations:prep.length,plannedMatingCount:matings.length,
   publicSires:demands,publicMares:mares,gameVerified:false,actualFoalStatsVerified:false,
   evidence:'保存時の配合と、今この端末で再構築した父母・31枠・理論一次判定・所持登録を照合。所持種牡馬は登録権利0でもポイント交換を前提に探索します。',
   limitations:'ゲーム内の至高・完璧・超完璧成立、種付け権利の実残数、公開牝馬の確保、自家製馬の実生産、SP/ST能力は保証しません。'};
 }
 return Object.freeze({pedigreeIdentity,assess});
});
