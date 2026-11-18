/* v125 | Decision-oriented, read-only mild plan dossier.
 * The two existing auditors are deliberately independent. Matching copied
 * pedigree records is NOT evidence of effectiveness or in-game Shiko.
 * A common name is never certified as an effective/independent cross here.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildDecision125=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const arr=x=>Array.isArray(x)?x:[];
 const norm=x=>String(x??'').normalize('NFKC').replace(/[\s\u3000]/g,'').trim().toLowerCase();
 const rowName=r=>String(r?.name||'');
 const known=r=>!!norm(rowName(r))&&norm(rowName(r))!==norm('未収録');
 function crosses(report){
  const sire=arr(report?.parts?.sire?.ancestors),mare=arr(report?.parts?.mare?.ancestors);
  const groups=new Map();
  for(const [side,rows] of [['S',sire],['D',mare]])for(const r of rows){
   if(!known(r)||!r?.path)continue;
   const key=norm(r.name);if(!groups.has(key))groups.set(key,{name:r.name,S:[],D:[]});
   groups.get(key)[side].push({path:String(r.path),foalPath:side+String(r.path),factorVariant:String(r.variant||''),factors:arr(r.factors).filter(Boolean)});
  }
  const result=[];
  for(const g of groups.values()){
   if(!g.S.length||!g.D.length)continue;
   const both=[...g.S,...g.D];
   const knownVariants=[...new Set(both.map(x=>norm(x.factorVariant)).filter(Boolean))];
   const missingIdentity=both.filter(x=>!norm(x.factorVariant)).length;
   const missingFactors=both.filter(x=>!x.factors.length).length;
   // Preserve every recorded endpoint. Do not count sire x mare path pairs as
   // separate effective crosses: one historical individual may recur by descent.
   result.push({name:g.name,sire:g.S,mare:g.D,knownVariants,
    differsByVariant:knownVariants.length>1,missingIdentity,missingFactors,
    candidateOnly:true,independenceVerified:false,effectVerified:false});
  }
  return result.sort((a,b)=>a.name.localeCompare(b.name,'ja'));
 }
 function assess({plan,homebreds=[],master=[],liveAudit=null,evidenceAudit=null}={}){
  if(plan?.autoDesign21?.mode!=='mild')return null;
  const live=liveAudit?.assess?.({plan,homebreds,master})||null;
  const evidence=evidenceAudit?.study?.(plan.externalReview48,master)||null;
  const structural=live?.fullyReconciled===true&&evidence?.structural===true&&
   evidence.anchors?.length===3&&evidence.anchors.every(a=>a.positionOk&&a.masterOk);
  const list=crosses(plan.externalReview48);
  const route=plan.mild67?.extraSireBirths!=null||plan.mild67?.extraMareBirths!=null?
   Number(plan.mild67?.extraSireBirths||0)+Number(plan.mild67?.extraMareBirths||0):null;
  const savedStages=arr(plan.mild98?.stages);
  const first=live?.firstMating||null;
  const grade=plan.mild94?.actualSuperPerfect==='成立'?'超完璧・一次判定':
   plan.mild94?.actualPerfect==='成立'?'完璧・一次判定':'理論一次判定未確認';
  const issues=[];
  if(!structural)issues.push('現行の仮馬・31枠・公開マスターの一致を再確認');
  if(!plan?.mild98?.ok)issues.push('保存工程の監査記録を再確認');
  // Even an apparently complete structural record does not certify the game.
  issues.push('ゲーム内で至高・締め肌理論の成立表示を確認');
  issues.push('公開繁殖牝馬の確保・各工程の実生産を確認');
  issues.push('同名祖先の有効クロス・異因名・独立性は未検証として扱う');
  const anchorRows=arr(evidence?.anchors);
  const distinctAnchorFactors=[...new Set(anchorRows.flatMap(a=>arr(a.recordedFactors)).map(norm).filter(Boolean))];
  const anchorIds=Object.values(plan.routeDraft?.slots||{}).map(norm).filter(Boolean);
  const uniqueAnchorIds=new Set(anchorIds).size===3&&anchorIds.length===3;
  const recordedShikoBasis=anchorRows.length===3&&anchorRows.every(a=>a.positionOk&&a.masterOk)&&
   uniqueAnchorIds&&distinctAnchorFactors.length>=6;
  const real=Number(live?.realCount||0),draft=Number(live?.draftCount||0);
  return {version:125,title:String(plan.title||''),race:String(plan.target||''),goal:plan.goal||'',
   dataMatched:structural,phase:structural?'登録照合済／ゲーム内確認待ち':'構造再監査が必要',
   grade,baseStages:9,extraBirths:route,registeredMatings:savedStages.length||null,
   registeredFoalAncestors:evidence?.parts?.foal?.registered??null,
   missingFactorSlots:evidence?.parts?.foal?.missingFactors??null,
   anchorDataMatched:evidence?.anchors?.filter(a=>a.positionOk&&a.masterOk).length??0,
   anchorPositionPaths:anchorRows.map(a=>a.path),distinctAnchorFactorTypes:distinctAnchorFactors.length,
   distinctAnchorFactors,recordedShikoBasis,confirmedShikoInGame:false,
   commonNameCrossCandidates:list.length,sharedFactorCoverage:evidence?.sharedFactorCoverage??null,
   crosses:list,observedFactors:{...(evidence?.observedFactorCounts||{})},
   savedNitroStages:plan.mildNitro107?.stages||null,
   confirmedIndependentCrosses:null,confirmedEffectiveCrosses:null,
   recordedRealHorses:real,recordedDraftHorses:draft,
   firstMating:first,issues,gameVerified:false,authorizedForBreeding:false,
   searchComplete:plan.fastSearch59?.complete===true&&plan.mild89?.exhaustive===true,
   caveat:'登録資料・工程の照合結果はゲーム内至高成立、有効クロス、SP/ST能力や最適配合の証明ではありません。取得済み種牡馬の権利数は順位付け・却下条件に使いません。'};
 }
 // The comparison is a review queue, not a strength ranking. Review only
 // like-for-like races/goals; do not prefer missing/empty factor annotations.
 function compare(a,b){
  if(!a||!b)return {comparable:false,reason:'比較データが不足',winner:null};
  if(a.race!==b.race||a.goal!==b.goal)return {comparable:false,reason:'目標レース・能力方針が異なるため競走能力の順位付けをしません',winner:null};
  if(!a.dataMatched||!b.dataMatched)return {comparable:false,reason:'構造監査が未完了',winner:null};
  const stageSame=JSON.stringify(a.savedNitroStages)===JSON.stringify(b.savedNitroStages);
  return {comparable:true,stageSame,gameVerified:false,winner:null,
   extraBirthDifference:(a.extraBirths??null)!==null&&(b.extraBirths??null)!==null?a.extraBirths-b.extraBirths:null,
   missingFactorDifference:(a.missingFactorSlots??null)!==null&&(b.missingFactorSlots??null)!==null?a.missingFactorSlots-b.missingFactorSlots:null,
   reason:'同一条件の登録根拠を横並びに提示します。未収録因子数、同名クロス数、工程数だけで強さを確定しません。'};
 }
 return Object.freeze({crosses,assess,compare});
});
