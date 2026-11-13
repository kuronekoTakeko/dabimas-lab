/* v8.1 | Read-only, conservative start-order audit for DDS MILD plans.
 * A planned/draft horse is NEVER a completed game birth. Manual done flags
 * and an in-memory pedigree do not prove a foal was produced. A candidate
 * stage is not permission to start: mare availability, real rights and
 * mating theory must still be checked in the game.
 * Input is a dependency-ordered list of normalized crossings from app.js.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildExecution81=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const norm=v=>String(v??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const list=x=>Array.isArray(x)?x:[];
 function assess({stages=[],inventory={}}={}){
  const source=list(stages),seen=new Set(),normalized=[],errors=[],byId=new Map();
  for(const [i,s] of source.entries()){
   const id=String(s?.id||''),deps=list(s?.deps).map(String);
   if(!id||seen.has(id)){errors.push(`工程IDが不足または重複（${id||i+1}）`);continue;}
   seen.add(id);const node={...s,id,deps,label:String(s?.label||id),sireId:String(s?.sireId||''),mareId:String(s?.mareId||'')};
   normalized.push(node);byId.set(id,node);
  }
  for(const s of normalized)for(const d of s.deps)if(!byId.has(d))errors.push(`${s.label}：前工程${d}が存在しません`);
  // A dependency cycle must fail closed, rather than displaying an impossible
  // stage as a first action. Handle arbitrary order, not only topological input.
  const visited=new Set(),visiting=new Set(),ordered=[];
  function visit(s){if(visited.has(s.id))return; if(visiting.has(s.id)){errors.push(`${s.label}：前工程が循環しています`);return;}
   visiting.add(s.id);for(const id of s.deps){const d=byId.get(id);if(d)visit(d);}visiting.delete(s.id);visited.add(s.id);ordered.push(s);
  }
  normalized.forEach(visit);
  const nodes=new Map(),remainingRights=new Map();
  for(const s of ordered){
   const parentIssues=list(s.parentIssues).filter(Boolean).map(String);
   // v8.3: a newly produced descendant cannot complete a production DAG
   // while its own prerequisite births remain only draft/uncorroborated.
   // A strictly verified reused REAL horse is a legitimate exception.
   const pendingDeps=s.deps.filter(d=>!nodes.get(d)?.completed);
   const verifiedBirth=!!s.outputReal&&s.outputVerified===true;
   // v8.4: a birth with unresolved parentage cannot complete the chain,
   // even if a stale caller supplied outputVerified=true.
   const completed=verifiedBirth&&!parentIssues.length&&(s.pedigreeKnown===undefined||s.pedigreeKnown===31)&&
    !!s.sireId&&!!s.mareId&&(pendingDeps.length===0||s.outputReused===true);
   const invalidReal=!!s.outputReal&&!completed;
   const warnings=[],blocks=[];
   if(s.manualDone&&!completed)warnings.push('手動の「完了」だけでは実馬生産済みと確認できません');
   if(s.outputReused&&!completed)blocks.push('再利用実馬の照合が未完了です');
   if(invalidReal)blocks.push(verifiedBirth&&pendingDeps.length&&!s.outputReused?'先行工程に実馬記録がないため完了とは判定しません':'登録実馬の親子・血統を再照合してください');
   if(!s.sireId)blocks.push('父馬が未指定');
   if(!s.mareId)blocks.push('母馬が未指定');
   if(parentIssues.length)blocks.push(...parentIssues);
   if(s.pedigreeKnown!==undefined&&s.pedigreeKnown!==31)blocks.push('父母の血統31枠を確認してください');
   let owned=null,rights=null,sireStatus='未確認';
   if(s.sireType==='public'){
    const rec=inventory[norm(s.sireId)];owned=rec?.owned===true;
    rights=owned&&Number.isInteger(Number(rec?.rights))&&Number(rec.rights)>=0&&rec.rights!==''&&rec.rights!==null&&rec.rights!==undefined?Number(rec.rights):null;
    sireStatus=!owned?'所持未確認':rights===null?'権利数未確認':rights===0?'権利0':'登録上は権利あり';
    if(!completed){
     const k=norm(s.sireId);if(!remainingRights.has(k))remainingRights.set(k,{sireId:s.sireId,needed:0,rights,owned});
     remainingRights.get(k).needed++;
    }
    if(!owned)blocks.push('公開種牡馬の所持登録がありません');
    else if(rights===0)blocks.push('登録上の種付け権利が0回です');
    else if(rights===null)warnings.push('公開種牡馬の権利数をゲーム内で確認してください');
   }else if(s.sireType==='homebred'){
    sireStatus=s.sireReal===true?'自家製牡馬の供用確認待ち':'自家製牡馬の実馬化待ち';
    if(!s.sireReal)blocks.push('父の自家製種牡馬が実馬登録されていません');
    else warnings.push('自家製種牡馬の供用状態・権利はゲーム内で確認してください');
   }else{warnings.push('父馬の登録種別を確認してください');}
   if(s.mareType==='homebred'&&!s.mareReal)blocks.push('母の自家製牝馬が実馬登録されていません');
   // The app does not track actual possession, age, fertility or availability
   // of public mares, even if their pedigrees are in the imported CSV.
   if(s.mareType!=='homebred')warnings.push('公開繁殖牝馬の確保・使用可否は未確認');
   if(s.outputReal&&completed)warnings.length=0;
   const state=completed?'実馬記録あり':invalidReal||s.outputReused&&blocks.length?'記録要再照合':pendingDeps.length?'前工程待ち':blocks.length?'条件要確認':'先行準備候補';
   const node={id:s.id,label:s.label,sireId:s.sireId,mareId:s.mareId,completed,manualDone:!!s.manualDone,
    deps:[...s.deps],pendingDeps,state,owned,rights,sireStatus,blocks,warnings,gameVerified:false};
   nodes.set(s.id,node);
  }
  const all=[...nodes.values()],remaining=all.filter(x=>!x.completed),first=remaining.filter(x=>!x.pendingDeps.length),candidates=first.filter(x=>x.state==='先行準備候補');
  const inventoryRows=[...remainingRights.values()].map(r=>({...r,shortage:r.owned&&r.rights!==null?Math.max(0,r.needed-r.rights):null}));
  const missingRights=inventoryRows.filter(r=>r.shortage>0),missingOwned=inventoryRows.filter(r=>!r.owned);
  return {schema:81,applicable:!errors.length&&all.length>0,errors,stages:all,
   total:all.length,completed:all.filter(x=>x.completed).length,remaining:remaining.length,
   first,candidates,waiting:remaining.filter(x=>x.pendingDeps.length).length,
   inventoryRows,missingRights,missingOwned,
   gameVerified:false,
   note:'先行準備候補は生産の許可ではありません。繁殖牝馬の確保・種付け権利の実残数・配合理論・種牡馬の供用条件はゲーム内で別途確認してください。'};
 }
 return Object.freeze({assess});
});
