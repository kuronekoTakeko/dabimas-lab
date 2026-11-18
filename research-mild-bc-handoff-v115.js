/* v115 | Read-only BC production handoff. Does not certify in-game theories.
 * Keeps plan/store unchanged. A failed/missing audit is NOT a passing audit.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildBCHandoff115=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 function inspect({plan,readiness,stageAudit,externalAudit}={}){
  if(plan?.autoDesign21?.mode!=='mild')return null;
  const problems=[],actions=[];
  const structural=readiness?.ok===true&&stageAudit?.ok===true&&plan?.mild94?.ok===true;
  if(readiness?.ok!==true)problems.push('現在の親子・血統・保存時条件の再検証が未通過：'+(readiness?.errors||[]).slice(0,2).join('／'));
  if(stageAudit?.ok!==true)problems.push('全工程の保存照合が未通過：'+(stageAudit?.errors||[]).slice(0,2).join('／'));
  if(plan?.mild94?.ok!==true)problems.push('保存直前の至高・締め肌の一次検査が未通過');
  const anchors=externalAudit?.anchors||[];
  const anchorComplete=anchors.length===3&&anchors.every(a=>a.status==='登録位置・異因名一致（外部未検証）');
  const notationOnly=anchors.some(a=>a.notationOnly===true||/表示形式一致/.test(a.status||''));
  if(!anchorComplete)actions.push(notationOnly?'年号・異因名のマスターIDを外部で確認':'至高の指定3枠と個別異因名を外部で確認');
  if(!externalAudit)problems.push('外部照合用の31枠監査が未実行');
  const publicSires=Array.isArray(readiness?.publicSires)?readiness.publicSires:[];
  const publicMares=Array.isArray(readiness?.publicMares)?readiness.publicMares:[];
  const rights=publicSires.filter(s=>s.owned===false);
  // v122: obtained sires are exchangeable; do not turn their recorded rights into a blocking action.
  if(publicMares.length)actions.push('公開繁殖牝馬を確保（'+publicMares.length+'種類・延べ'+publicMares.reduce((n,m)=>n+(Number(m.uses)||0),0)+'回）');
  const missingFactors=Array.isArray(externalAudit?.unknownFactors)?externalAudit.unknownFactors.length:null;
  if(missingFactors>0)actions.push('最終血統の因子未収録'+missingFactors+'枠を外部照合（0因子と扱わない）');
  actions.push('ゲーム内で締め肌の完璧・超完璧を確認');
  actions.push('ゲーム内で最終至高の成立と阻害条件を確認');
  actions.push('生産した肌馬の実能力・ゲノムを記録してから最終種付け');
  return {version:115,structural,anchorComplete,notationOnly,rights,publicMares,missingFactors,
   problems,actions,gameConfirmed:false,productionAuthorized:false,
   caveat:'構造が一致しても、ゲーム内の配合理論・実能力・公開牝馬の在庫・種付け権利の実残数は未確認。配合の成立確定や生産開始許可ではありません。'};
 }
 return Object.freeze({inspect});
});
