/* v135 | First in-game review sheet from the EXISTING saved mild DDS plan.
 * No breeding permission, no new optimization, no game-side certification.
 * Read-only: preserve 9 core DAG steps, optional 1-generation preparations,
 * saved holdings/rights, homebreds and factor coverage exactly as recorded.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildFirstCheck135=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=x=>String(x??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const sexLabel={female:'牝',male:'牡'};
 const ordinary=x=>String(x??'').trim();
 function build(plan,{definitions=[],owned=null}={}){
  const errors=[],warnings=[];
  if(plan?.autoDesign21?.mode!=='mild'||plan?.routeDraft?.layout!=='maternal-dds-g3')
   return {available:false,errors:['母側DDSのマイルド型保存プラン専用です'],gameVerified:false,productionApproved:false};
  if(!Array.isArray(definitions)||definitions.length!==9||definitions.some((d,i)=>d?.n!==i+1))
   errors.push('基幹9工程の定義が不足・順番不一致です');
  const slots=plan.routeDraft?.slots||{},ch=plan.chain09||{},m67=plan.mild67||{};
  if(!ch.outputs||!ch.mares)errors.push('連結した親子・産駒の保存情報が不足しています');
  const preps=[];
  for(const [kind,source,sex,which] of [
   ['sire',m67.prep,'牡','工程2の父'],['mare',m67.marePrep,'牝','工程1の母']]){
   if(!source)continue;
   const row={id:'P:'+kind,label:kind==='sire'?'準備：締め肌の父':'準備：基礎牝馬',
    sire:ordinary(source.fatherId),mare:ordinary(source.motherId),
    sex,output:'準備産駒 → '+which,outputId:ordinary(source.foalId),deps:[]};
   if(!row.sire||!row.mare||!row.outputId)errors.push(row.label+'の父・母・産駒IDが不足');
   preps.push(row);
  }
  if(m67.prep&&norm(ch.xId)!==norm(m67.prep.foalId))errors.push('準備した締め肌の父と工程2の父が一致しません');
  if(m67.marePrep&&norm(ch.mares?.[1])!==norm(m67.marePrep.foalId))errors.push('準備した基礎牝馬と工程1の母が一致しません');
  const rows=[...preps],ids=new Set(rows.map(x=>x.id));
  if(!errors.some(x=>x.includes('定義が不足'))){
   for(const def of definitions){
    if(def.sireStep&&(def.sireStep>=def.n||definitions[def.sireStep-1]?.sex!=='male'))
     errors.push('工程'+def.n+'の父系参照が不正');
    if(def.mareStep&&(def.mareStep>=def.n||definitions[def.mareStep-1]?.sex!=='female'))
     errors.push('工程'+def.n+'の母系参照が不正');
    const id='C:'+def.n,depNames=[];
    if(def.sireStep)depNames.push('C:'+def.sireStep);
    if(def.mareStep)depNames.push('C:'+def.mareStep);
    if(def.n===1&&m67.marePrep)depNames.push('P:mare');
    if(def.n===2&&m67.prep)depNames.push('P:sire');
    for(const d of depNames)if(!ids.has(d))errors.push('工程'+def.n+'の親工程が未作成：'+d);
    const sire=def.sireSlot?ordinary(slots[def.sireSlot]):def.sireStep?'工程'+def.sireStep+'産駒':ordinary(ch.xId);
    const mare=def.mareStep?'工程'+def.mareStep+'産駒':ordinary(ch.mares?.[def.n]);
    const sex=def.n===9?(ch.finalSex==='female'?'牝（保存設定）':ch.finalSex==='male'?'牡（保存設定）':'不問（保存設定）'):(sexLabel[def.sex]||'未確認');
    if(!sire||!mare)errors.push('工程'+def.n+'の父または母が未指定');
    if(!ordinary(ch.outputs?.[def.n]))errors.push('工程'+def.n+'の産駒連結IDが不足');
    rows.push({id,label:'工程'+def.n+(def.n===9?'：最終配合':''),sire,mare,sex,
     output:ordinary(def.output)||'産駒',outputId:ordinary(ch.outputs?.[def.n]),deps:depNames});
    ids.add(id);
   }
  }
  if(plan.mild97?.plannedMatingCount!=null&&rows.length!==Number(plan.mild97.plannedMatingCount))
   errors.push('保存された予定交配数と工程数が不一致');
  const active=plan.mild134?.reviewPriority;
  if(active&&active.route==='sireOnly'&&m67.prep&&
    (norm(active.prepFirst?.sire)!==norm(m67.prep.fatherId)||norm(active.prepFirst?.mare)!==norm(m67.prep.motherId)))
   warnings.push('v134の確認優先候補と現在の保存プランの準備交配は異なります');
  if(plan.mild97?.ok!==true||plan.mild94?.ok!==true)
   warnings.push('現在の保存プランには構造監査の再照合が必要です');
  const studUses=(plan.mild97?.publicSires||[]).map(s=>{
   const record=owned&&Object.entries(owned).find(([id])=>norm(id)===norm(s.id));
   const current=record?record[1]:null;
   return {id:ordinary(s.id),uses:Number(s.uses)||0,owned:current?current.owned===true:null,
    rights:current&&Number.isFinite(Number(current.rights))?Number(current.rights):null};
  });
  return {version:135,available:errors.length===0,errors,warnings,rows,
   preparations:preps.length,core:9,matings:rows.length,
   priority:active?.family||null,anchorSlots:{...slots},studUses,
   structuralAtSave:plan.mild97?.ok===true&&plan.mild94?.ok===true,
   gameVerified:false,productionApproved:false,unknownIsZero:false,
   caveat:'これは登録済みの親子関係から再構成した照合用手順であり、生産指示ではありません。各工程の配合理論・実産駒・本人因子・SP/ST・牝馬の確保・種付け権利をゲーム内で確認してください。'};
 }
 function toText(report,title='マイルド配合プラン'){
  if(!report?.available)return '照合表を作成できません：'+(report?.errors||['未確認']).join('／');
  const lines=[
   'ダビマス配合研究所 v135｜ゲーム内確認用・全交配手順',
   'プラン：'+ordinary(title),
   '重要：登録データの一次設計です。至高・超完璧・SP/STのゲーム内成立未確認。生産着手の承認ではありません。',
   '基幹'+report.core+'工程＋準備'+report.preparations+'工程＝全'+report.matings+'交配',
   '至高指定：3代 '+(report.anchorSlots.g3||'未確認')+'／4代 '+(report.anchorSlots.g4||'未確認')+'／5代 '+(report.anchorSlots.g5||'未確認'),
   ''
  ];
  for(const [i,r] of report.rows.entries()){
   lines.push(String(i+1).padStart(2,'0')+'｜'+r.label+'｜必要な産駒 '+r.sex);
   lines.push('    '+r.sire+' × '+r.mare+' → '+r.output);
   lines.push('    [ ] 父母の所持・血統・親子継承を確認  [ ] 種付け可否と理論表示をゲーム内確認');
   lines.push('    [ ] 必要な性別と実産駒の結果を確認  [ ] 因子・SP/ST（判明した場合のみ）を記録');
   if(r.deps.length)lines.push('    前提：'+r.deps.join('、'));
  }
  lines.push('', '種牡馬（保存プランでの予定使用数／最新端末記録の残権利）');
  for(const s of report.studUses)lines.push('・'+s.id+'：'+s.uses+'回／'+(s.rights==null?'未確認':s.rights+'回')+(s.owned===true?'［取得済み・権利0でも交換候補］':s.owned===false?'［未所持の記録］':'［所持未確認］'));
  if(report.warnings.length)lines.push('',...report.warnings.map(s=>'注意：'+s));
  lines.push('',report.caveat,'保存プラン・権利数・自家製馬・公開マスターはこの照合表の作成では変更しません。');
  return lines.join('\n')+'\n';
 }
 return Object.freeze({build,toText});
});
