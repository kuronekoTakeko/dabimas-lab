/* v6.3: read-only production start preflight. No theory or SP/ST inference. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasProductionReady63=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
const norm=s=>String(s||'').normalize('NFKC').trim().toLowerCase();
function analyze({plan,inventory={},resolve=null,theory=null}={}){
 const slots=plan?.routeDraft?.slots||{},ch=plan?.chain09||{},mares=ch.mares||{},x=ch.xId||plan?.routeDraft?.xSire||'';
 const parents=[slots.g3,'',slots.g4,'',slots.g5,'',x,'',''];
 const steps=[];let missing=0,zero=0,unknown=0;
 for(let n=1;n<=9;n++){
  const sire=parents[n-1],mare=mares[n]||'';
  if(!sire)continue; // produced sire on subsequent steps; check root-source rights only
  const rec=inventory[norm(sire)]||null,source=typeof resolve==='function'?resolve(sire):null;
  const owned=rec?.owned===true;
  const rights=rec&&Number.isFinite(Number(rec.rights))?Math.max(0,Number(rec.rights)):null;
  let status='要確認';
  if(!owned){status='所持確認が必要';missing++;}
  else if(rights===0){status='権利0：種付け前に補充が必要';zero++;}
  else if(rights===null){status='権利数未確認';unknown++;}
  else status='権利あり';
  steps.push({step:n,sire,mare,owned,rights,status,registered:!!source});
 }
 const theoryStatus=theory?.superPerfect==='成立'?'超完璧（条件上）':theory?.perfect==='成立'?'完璧（条件上）':theory?.superPerfect==='未確認'||theory?.perfect==='未確認'?'未確認':'不成立または未判定';
 const first=steps.find(s=>s.step===1)||null;
 return {schema:63,steps,missing,zero,unknown,first,closingTheory:theoryStatus,
  breedingReady:missing===0&&zero===0&&unknown===0&&!!first&&!!mares[1],
  gameVerified:false,notes:['所持・権利は現在のブラウザに登録された情報。消費済みの種付け分は計算しません。','途中配合理論と最終至高はゲーム画面で確認が必要です。']};
}
return Object.freeze({analyze});
});
