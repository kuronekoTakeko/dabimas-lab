/* v94 | Fail-closed final MILD release check.
 * This is a read-only, post-assembly audit. It NEVER claims game-verified
 * Shiko/perfect/super-perfect or horse abilities. Rights 0 does not remove
 * an owned sire from exploration; it is a production warning, not a save ban.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildRelease94=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=x=>String(x??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const yes='成立',unknown='未確認';
 const rank=x=>x?.blocked?0:x?.superPerfect===yes?3:x?.perfect===yes?2:0;
 function assess({plan,pedigree,gate,closing,expected,stages=[],inventory={},siblings}={}){
  const errors=[],warnings=[];
  const rows=Array.isArray(pedigree?.rows)?pedigree.rows:[];
  const paths=new Set(rows.map(x=>x?.path));
  if(!plan?.id||plan?.autoDesign21?.mode==='hard')errors.push('マイルド型の計画が未指定');
  if(pedigree?.known!==31||rows.length!==31||paths.size!==31||rows.some(r=>!r?.path||!r?.name)||
     pedigree?.conflicts?.length||pedigree?.transmission?.conflicts?.length||pedigree?.transmission?.invalid?.length)
    errors.push('最終31枠の血統が未完成または矛盾');
  if(!gate?.ok)errors.push('親子・異因名・6因子種類の独立検査に未通過：'+(gate?.errors||[]).slice(0,3).join('／'));
  if(!siblings||siblings.version!==95)errors.push('全兄弟姉妹の既知事例チェックが実行できません');
  else if(siblings.blocked)errors.push('既知の全兄弟姉妹に衝突：'+siblings.conflicts.map(x=>`${x.anchor}／${x.sibling}（${x.path}）`).join('・'));
  if(!closing?.ready||!closing?.ped||closing.ped.known!==31||closing.problems?.length)
    errors.push('締め肌の実際の交配と血統を再連結できません');
  if(!expected||rank(expected)<2)errors.push('採用元の締め肌完璧・超完璧の根拠がありません');
  if(!closing?.theory||closing.theory.blocked||rank(closing.theory)<2)
    errors.push('最終連結後の締め肌完璧・超完璧を確認できません');
  else if(expected&&(expected.perfect!==closing.theory.perfect||expected.superPerfect!==closing.theory.superPerfect))
    errors.push('締め肌の配合理論が探索時の結果から変化しました');
  if(!Array.isArray(stages)||stages.length<9)errors.push('生産工程が不足しています');
  const demands=new Map();
  for(const s of stages||[]){
   if(s?.reused===true)continue;
   const id=String(s?.sireId||'').trim(),phase=String(s?.phase||'工程');
   if(!id){errors.push(`${phase}：父馬が未指定`);continue;}
   if(s?.sireType==='homebred')continue;
   if(s?.sireType!=='public'){errors.push(`${phase}：父馬の公開／自家製区分が未確認`);continue;}
   const k=norm(id),rec=inventory?.[k];
   if(rec?.owned!==true){errors.push(`${phase}：未所持の公開種牡馬 ${id}`);continue;}
   if(!demands.has(k))demands.set(k,{id,needed:0,rights:null});
   const row=demands.get(k);row.needed++;
   if(rec.rights!==''&&rec.rights!==null&&rec.rights!==undefined&&Number.isSafeInteger(Number(rec.rights))&&Number(rec.rights)>=0)
    row.rights=Number(rec.rights);
  }
  const required=[...demands.values()].map(r=>({...r,recordedShortage:r.rights===null?null:Math.max(0,r.needed-r.rights),shortage:0,exchangeable:true,planningRights:Math.max(10,r.needed)}));
  // v122: acquired sire rights are exchangeable; preserve the original rights in the returned audit.
  const anchors=(plan?.source?.members||[]).map(x=>({id:String(x.id||''),factors:Array.isArray(x.factors)?[...x.factors]:[],variant:String(x.variant||'')}));
  return {version:94,ok:errors.length===0,errors,warnings,
   route:plan?.routeDraft?.layout||'未確認',closingStep:closing?.step||null,siblingScope:siblings?.status||'未確認',
   expectedPerfect:expected?.perfect||unknown,expectedSuperPerfect:expected?.superPerfect||unknown,
   actualPerfect:closing?.theory?.perfect||unknown,actualSuperPerfect:closing?.theory?.superPerfect||unknown,
   anchorFactorKinds:gate?.anchorFactorKinds??null,anchors,
   finalRows:paths.size,stagesChecked:stages.length,plannedPublicUses:required.reduce((s,r)=>s+r.needed,0),
   publicSires:required,gameVerified:false,
   caveat:'最終保存直前の31枠・9基幹工程・締め肌の再照合。ゲーム内の至高・完璧・超完璧、全兄弟姉妹、実SP/ST・ニトロ、繁殖牝馬の入手は未確認。'};
 }
 return Object.freeze({assess,rank});
});
