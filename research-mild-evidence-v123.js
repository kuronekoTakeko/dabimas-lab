/* v123 | Registered 5-generation evidence audit, read-only.
 * Distinguish same-name bilateral appearances from a validated effective cross.
 * Unknown factor fields and generated draft horses never establish game mechanics.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildEvidence123=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=v=>String(v??'').normalize('NFKC').trim().replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-');
 const PATHS=[];for(let n=1;n<=5;n++){let a=[''];for(let i=0;i<n-1;i++)a=a.flatMap(x=>[x+'S',x+'D']);for(const x of a)PATHS.push(x+'S');}
 const expected=new Set(PATHS),sites=Object.freeze({g3:'DDS',g4:'SSSS',g5:'SDSSS'});
 const list=r=>Array.isArray(r)?r:[];
 const factors=a=>list(a).map(norm).filter(Boolean).sort().join('|');
 const same=(a,b)=>norm(a?.name)===norm(b?.name)&&norm(a?.variant)===norm(b?.variant)&&factors(a?.factors)===factors(b?.factors)&&norm(a?.line)===norm(b?.line);
 const horseId=r=>norm(r?.name)+(r?.variant?'-'+norm(r.variant)+'-':'');
 const recorded=(r)=>!!r&&norm(r.name)&&r.name!=='未収録';
 function study(report,master=[]){
  const errors=[],issues=[],parts={},maps={};
  if(report?.schema!=='dabimas-crosscheck-v1')return {version:123,structural:false,errors:['外部照合形式が未対応です'],gameVerified:false};
  for(const [name,part] of Object.entries({sire:report.parts?.sire,mare:report.parts?.mare,foal:report.parts?.foal})){
   const rows=list(part?.ancestors),paths=rows.map(r=>String(r?.path||''));const ids=new Set(paths);
   if(rows.length!==31||ids.size!==31||paths.some(p=>!expected.has(p)))errors.push(name+'：31枠の位置が不足・重複・不正です');
   if(list(part?.conflicts).length)errors.push(name+'：同一位置の登録衝突 '+part.conflicts.join('、'));
   const map=new Map(rows.filter(r=>r?.path).map(r=>[r.path,r]));maps[name]=map;
   const known=rows.filter(recorded).length,unknown=rows.filter(r=>recorded(r)&&!list(r.factors).length).map(r=>r.path);
   const virtual=rows.filter(r=>/仮\d+|^自家製[:：]/.test(String(r?.name||''))).map(r=>r.path);
   parts[name]={rows:rows.length,registered:known,missingFactors:unknown.length,missingFactorPaths:unknown,virtualPositions:virtual,
    unknownVariants:rows.filter(r=>recorded(r)&&!norm(r.variant)).length};
   if(known!==31)issues.push(name+'：馬名未収録 '+(31-known)+'枠');
  }
  let inherited=0;const inheritedErrors=[];
  for(const row of maps.foal?.values()||[]){if(row.path.length<2)continue;
   const parent=maps[row.path[0]==='S'?'sire':'mare']?.get(row.path.slice(1));
   if(parent&&same(row,parent)){inherited++;}else inheritedErrors.push(row.path);
  }
  if(inherited!==30||inheritedErrors.length)errors.push('最終産駒の父母継承が不一致：'+inheritedErrors.join('、'));
  const byId=new Map(list(master).filter(r=>r?.id).map(r=>[norm(r.id),r]));
  const anchors=Object.entries(sites).map(([slot,path])=>{
   const desired=norm(report.anchorSlots?.[slot]),row=maps.foal?.get(path),entry=byId.get(desired);
   const display=horseId(row),year=!!row&&/^(?:19|20)\d{2}$/.test(String(row.variant||''))&&norm(row.name)+norm(row.variant)===desired;
   const positionOk=!!desired&&!!row&&(display===desired||year);
   const masterOk=!!entry&&norm(entry.name)===norm(row?.name)&&norm(entry.variant)===norm(row?.variant)&&factors(entry.factors)===factors(row?.factors);
   if(!positionOk)errors.push(slot+'：指定馬と祖先位置が不一致');
   if(!masterOk)errors.push(slot+'：公開マスターのID・異因名・因子の裏付け不足');
   return {slot,path,id:report.anchorSlots?.[slot]||'',positionOk,masterOk,yearNotationOnly:year,recordedFactors:list(row?.factors),gameVerified:false};
  });
  const parentSites={};for(const side of ['sire','mare']){
   const groups=new Map();for(const r of maps[side]?.values()||[]){if(!recorded(r))continue;const k=norm(r.name);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
   parentSites[side]=groups;
  }
  const shared=[];
  for(const [key,a] of parentSites.sire||[]){const b=parentSites.mare?.get(key);if(!b)continue;
   const variants=[...new Set([...a,...b].map(r=>norm(r.variant)).filter(Boolean))];
   shared.push({name:a[0].name,sirePaths:a.map(r=>r.path),marePaths:b.map(r=>r.path),variantNames:variants,
    sireFactorRecords:a.filter(r=>list(r.factors).length).length,mareFactorRecords:b.filter(r=>list(r.factors).length).length,
    kind:variants.length>1?'異因名を含む同名祖先':'同名祖先の両側出現',
    validatedIndependent:false,validatedEffective:false});
  }
  const sharedFactorCoverage=shared.filter(x=>x.sireFactorRecords>0&&x.mareFactorRecords>0).length;
  const observedCounts={};for(const r of maps.foal?.values()||[])for(const t of list(r.factors)){
   const factor=norm(t);if(factor)observedCounts[factor]=(observedCounts[factor]||0)+1;
  }
  const structural=errors.length===0&&inherited===30&&Object.values(parts).every(x=>x.registered===31);
  return {version:123,title:report.planTitle||'',structural,parts,inherited:{matched:inherited,checked:30,errors:inheritedErrors},
   anchors,sharedNames:shared,sharedFactorCoverage,observedFactorCounts:observedCounts,verifiedEffectiveCrosses:null,verifiedIndependentCrosses:null,
   errors,issues,gameVerified:false,externalGameCheckComplete:false,
   caveat:'登録血統の構造・継承・指定3頭を照合。父母双方の同名馬は有効クロス・独立クロス・因子効果の確定数ではありません。未収録因子は因子なしとしません。'};
 }
 function compare(a,b,master=[]){
  const A=study(a,master),B=study(b,master),sameSlots=JSON.stringify(a?.anchorSlots||{})===JSON.stringify(b?.anchorSlots||{});
  const ra=new Map(list(a?.parts?.foal?.ancestors).map(r=>[r.path,r]));
  const rb=new Map(list(b?.parts?.foal?.ancestors).map(r=>[r.path,r]));
  const changed=PATHS.filter(p=>{
   const x=ra.get(p),y=rb.get(p);
   if(!x||!y)return true;
   // Different plan-local draft identifiers do not count as substantive ancestor evidence.
   const local=v=>/^自家製[:：]|仮\d+/.test(String(v?.name||''));
   return !(local(x)&&local(y))&&!same(x,y);
  }).map(path=>({path,from:ra.get(path)?.name||'',to:rb.get(path)?.name||''}));
  return {version:123,sameAnchorSet:sameSlots,a:A,b:B,changedPublishedRows:changed,
   unknownFactorDelta:(B.parts?.foal?.missingFactors??0)-(A.parts?.foal?.missingFactors??0),
   commonNameDelta:B.sharedNames.length-A.sharedNames.length,
   recordedNitroRelated:{short:[A.observedFactorCounts['短']||0,B.observedFactorCounts['短']||0],
    fast:[A.observedFactorCounts['速']||0,B.observedFactorCounts['速']||0],
    long:[A.observedFactorCounts['長']||0,B.observedFactorCounts['長']||0]},
   recommendedWinner:null,gameVerified:false,
   caveat:'因子未収録枠が減ることや同名祖先が変わることは、SP/ST・ニトロ・有効クロス・公式BC適性の改善を証明しません。順位は未判定です。'};
 }
 return Object.freeze({study,compare,PATHS});
});
