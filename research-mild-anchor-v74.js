/* v7.4 | Mild-only Deep 3x4x5 placement comparison.
 * The two g4/g5 assignments sharing the same g3 are compared through the
 * existing full nine-mating/31-position validation, not accepted by scoring.
 * Factor placement priority is an explicitly UNVERIFIED research hypothesis,
 * not predicted SP/ST or an assertion of an in-game generational multiplier.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildAnchor74=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=x=>String(x??'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
 const priorities={
  speed:{'走':5,'速':4,'短':3,'中':2,'長':1,'底':1},
  stamina:{'長':5,'中':4,'底':3,'走':1,'速':1,'短':1},
  balance:{'走':4,'速':3,'短':2,'中':4,'長':4,'底':2}
 };
 const weights={fourth:1,fifth:0.6}; // ONLY a provisional ordering, not game effect sizes.
 function slotsEqual(a,b){return ['g3','g4','g5'].every(k=>norm(a?.[k])===norm(b?.[k]));}
 function isSwap(a,b){return !!a?.g3&&norm(a.g3)===norm(b?.g3)&&norm(a.g4)===norm(b?.g5)&&norm(a.g5)===norm(b?.g4)&&norm(a.g4)!==norm(a.g5);}
 function factorWeights(goal){return priorities[goal]||priorities.balance;}
 function inspect(slots,getMember,goal='balance'){
  const get=typeof getMember==='function'?getMember:()=>null;
  const members=['g3','g4','g5'].map(k=>get(slots?.[k]));
  const full=members.every(m=>m&&Array.isArray(m.factors)&&m.factors.length>0);
  if(!slots?.g3||!slots?.g4||!slots?.g5||!full)return {valid:false,score:null,reason:'至高3頭の因子資料不足',gameVerified:false};
  const known=[...new Set(members.flatMap(m=>m.factors||[]))];
  if(known.length<6)return {valid:false,score:null,reason:'指定祖先の因子6種類を確認できない',gameVerified:false};
  const w=factorWeights(goal);
  const forSlot=(slot,scale)=>members[slot].factors.reduce((s,f)=>s+(w[f]||0)*scale,0);
  const fourth=forSlot(1,weights.fourth),fifth=forSlot(2,weights.fifth);
  return {valid:true,score:Math.round((fourth+fifth)*100)/100,goal,distinct:known.length,
   g3:slots.g3,g4:slots.g4,g5:slots.g5,
   fourthFactors:[...members[1].factors],fifthFactors:[...members[2].factors],
   fourthScore:Math.round(fourth*100)/100,fifthScore:Math.round(fifth*100)/100,
   source:'公開・所持種牡馬の記録済み因子',
   caveat:'4代目を優先する研究用の仮順位。公式の世代別効果倍率・産駒SP/ST能力を示さない。',gameVerified:false};
 }
 // Keep exactly two matched placements for a chosen maternal g3. In the user's
 // current Deep trio, 央獅 is the stable 3rd-generation candidate; otherwise use
 // the preflight winner's g3. Never use this shortcut for the hard-mode route.
 function selectDDS(entries,baseEntries,members){
  const pool=(entries||[]).filter(e=>e?.slots?.g3&&e?.slots?.g4&&e?.slots?.g5);
  const special=(members||[]).find(m=>m?.variant==='央獅')?.id||'';
  const preferred=special&&pool.some(e=>norm(e.slots.g3)===norm(special))?special:baseEntries?.[0]?.slots?.g3||pool[0]?.slots?.g3;
  const first=pool.find(e=>norm(e.slots.g3)===norm(preferred))||pool[0];
  if(!first)return [];
  const second=pool.find(e=>isSwap(e.slots,first.slots));
  // Preserve the v7.3 shortlist as fallback; imposing a particular g3 must
  // never silently remove a formerly searchable pedigree. The pair is first,
  // then the original shortlist (up to six total permutations).
  const picked=[];
  for(const item of [first,second,...(baseEntries||[])]){
   if(!item||picked.some(x=>slotsEqual(x.slots,item.slots)))continue;
   picked.push(item);
  }
  return picked;
 }
 // This is deliberately defined ONLY for the two otherwise equivalent swaps;
 // final legitimacy, closing theory and additional births are decided by caller.
 function compareSwap(a,b,getMember,goal='balance'){
  if(!isSwap(a,b))return null;
  const x=inspect(a,getMember,goal),y=inspect(b,getMember,goal);
  if(!x.valid||!y.valid)return null;
  return x.score===y.score?0:x.score>y.score?-1:1;
 }
 function report(selected,entries,getMember,goal){
  const current=inspect(selected,getMember,goal);
  const comparable=(entries||[]).filter(x=>slotsEqual(x.slots,selected)||isSwap(x.slots,selected));
  return {version:74,layout:'maternal-dds-g3',goal,selected:{...selected},selectedFactors:current,
   variants:comparable.map(x=>({slots:{...x.slots},qualified:!!x.qualified,
    theory:x.theory||'未確認',additionalBirths:x.additionalBirths??null,
    factor:inspect(x.slots,getMember,goal),reason:x.reason||''})),
   compared:comparable.length,gameVerified:false,
   caveat:'至高3頭の位置・9基幹工程・締め肌・31枠を全再検査して採用。因子の4代優先は未検証の相対仮説。全探索ではありません。'};
 }
 return Object.freeze({inspect,selectDDS,isSwap,compareSwap,report,priorities});
});
