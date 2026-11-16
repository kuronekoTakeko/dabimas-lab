/* v99 | Read-only, exact-ID, preflight coverage of the imported public master.
 * No inferred IDs, no ownership mutation, no game capability claims.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildCoverage99=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=v=>String(v??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 function inspect({owned={},master=[],sexOf=null,selected=[]}={}){
  const source=Array.isArray(master)?master:[],ownedIds=Object.keys(owned||{}).filter(id=>owned[id]?.owned===true);
  const ids=new Map(),conflicts=[];
  for(const row of source){const k=norm(row?.id);if(!k)continue;if(ids.has(k))conflicts.push(row.id);else ids.set(k,row);}
  const missing=[],incomplete=[],usable=[],rightsZero=[];
  for(const id of ownedIds){const rec=owned[id],r=ids.get(norm(id));
   if(Number(rec.rights)===0)rightsZero.push(id);
   if(!r){missing.push(id);continue;}
   if(r.duplicateConflict86||r.ancestry?.length!==15||!(r.factors?.length>0))incomplete.push(id);
   else usable.push(id);
  }
  const determine=r=>typeof sexOf==='function'?sexOf(r):r.sex;
  const mares=source.filter(r=>determine(r)==='female');
  const completeMares=mares.filter(r=>Array.isArray(r.ancestry)&&r.ancestry.length===15&&!r.duplicateConflict86);
  const selectedMissing=selected.map(r=>String(r?.id||r)).filter(id=>!ids.has(norm(id)));
  const errors=[];
  if(!source.length)errors.push('公開マスターCSVがありません');
  if(!mares.length)errors.push('CSVに繁殖牝馬を確認できません');
  if(!completeMares.length)errors.push('祖先15枠のある公開繁殖牝馬を確認できません');
  if(!ownedIds.length)errors.push('取得済み種牡馬が登録されていません');
  if(selected.length&&selectedMissing.length===selected.length)errors.push('起点候補がすべて公開CSVにありません');
  const warnings=[];
  if(missing.length)warnings.push('所持馬のうちCSV未収録 '+missing.length+'頭');
  if(incomplete.length)warnings.push('所持馬のうち祖先・因子が不完全 '+incomplete.length+'頭');
  if(selectedMissing.length)warnings.push('起点候補の一部がCSV未収録 '+selectedMissing.length+'頭');
  if(conflicts.length)warnings.push('重複登録ID '+conflicts.length+'件');
  if(source.length&&completeMares.length!==mares.length)warnings.push('公開繁殖牝馬の祖先情報不完全 '+(mares.length-completeMares.length)+'頭');
  return {version:99,canRun:!errors.length,errors,warnings,ownedCount:ownedIds.length,matched:ownedIds.length-missing.length,usable:usable.length,missing,incomplete,zeroRights: rightsZero.length,mares:mares.length,completeMares:completeMares.length,masterCount:source.length,selectedMissing,duplicates:conflicts.length,
   limited:true,gameVerified:false,caveat:'公開CSVの収録範囲・品質の診断です。探索は起点候補や配置数の上限を持つ限定探索で、全315頭の全組合せ網羅・ゲーム内至高成立は保証しません。権利0は候補から除外しません。'};
 }
 return Object.freeze({inspect});
});
