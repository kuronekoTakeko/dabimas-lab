/* v126 | Trace each same-name bilateral appearance through the mandatory
 * 3x4x5 anchors.  A path/identity audit, NEVER an in-game cross verdict.
 * Do not equate matching names or recorded factors with effective crosses.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildCrossOrigin126=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const arr=x=>Array.isArray(x)?x:[];
 const norm=v=>String(v??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const POS=Object.freeze({g3:'DDS',g4:'SSSS',g5:'SDSSS'});
 function idOf(row){const v=String(row?.variant||''),name=String(row?.name||'');return v&&/^(19|20)\d{2}$/.test(v)?norm(name+v):norm(name+(v?'-'+v+'-':''));}
 function classify({report}={}){
  // IMPORTANT: a parent 31-slot position becomes one generation deeper in the
  // child.  A parent 5th-generation entry is a CHILD 6th-generation entry.
  // Analyse the FINAL FOAL 31 slots, never a union of both parent 31-slot maps.
  const foal=arr(report?.parts?.foal?.ancestors),byPath=new Map(foal.map(r=>[String(r.path||''),r]));
  const anchors=Object.entries(POS).map(([slot,path])=>{
   const id=String(report?.anchorSlots?.[slot]||''),row=byPath.get(path);
   return {slot,path,id,name:String(row?.name||''),variant:String(row?.variant||''),registered:!!id&&!!row&&idOf(row)===norm(id)};
  });
  const validPaths=foal.length===31&&new Set(foal.map(r=>r.path)).size===31&&foal.every(r=>/^[SD]{0,4}S$/.test(r.path));
  const rootsValid=validPaths&&anchors.every(a=>a.registered);
  const knownAnchorNames=new Set(anchors.filter(a=>a.registered).map(a=>norm(a.name)));
  const groups=new Map();
  for(const r of foal){const name=String(r?.name||''),key=norm(name);if(!key||name==='未収録')continue;
   if(!groups.has(key))groups.set(key,{name,sire:[],mare:[]});
   const entry={foalPath:String(r.path),factorVariant:String(r.variant||''),factors:arr(r.factors).filter(Boolean)};
   groups.get(key)[r.path[0]==='S'?'sire':'mare'].push(entry);
  }
  const grouped=[];
  for(const c of groups.values()){
   if(!c.sire.length||!c.mare.length)continue;
   const origin=c.sire.concat(c.mare).map(e=>{
    const path=e.foalPath;
    const inheritedVia=anchors.filter(a=>a.registered&&path.length>a.path.length&&path.startsWith(a.path)).map(a=>a.slot);
    return {path,side:path.charAt(0),inheritedVia,anchorDerived:inheritedVia.length>0,offAnchor:!inheritedVia.length};
   });
   const offS=origin.filter(e=>e.side==='S'&&e.offAnchor).length,offD=origin.filter(e=>e.side==='D'&&e.offAnchor).length;
   const onS=origin.filter(e=>e.side==='S'&&e.anchorDerived).length,onD=origin.filter(e=>e.side==='D'&&e.anchorDerived).length;
   let kind='unknown',labelText='最終5代と指定3頭の照合が不完全なため由来未判定',needsReview=false;
   if(rootsValid){
    if(knownAnchorNames.has(norm(c.name))){kind='shiko-anchor';labelText='至高3×4×5の指定馬自身（追加クロスとして加点しない）';}
    else if(!offS&&!offD){kind='anchor-descendant';labelText='指定3頭の祖先として自動継承された重複（追加独立候補と扱わない）';}
    else if(offS&&offD){kind='outside-both';labelText='指定馬の経路外にも父母双方で記録（追加確認対象・効果未確認）';needsReview=true;}
    else {kind='outside-one';labelText='指定馬の経路外にも片側で記録（追加確認対象・効果未確認）';needsReview=true;}
   }
   const every=c.sire.concat(c.mare),knownVariants=[...new Set(every.map(x=>norm(x.factorVariant)).filter(Boolean))];
   grouped.push({name:c.name,kind,label:labelText,needsReview,sire:c.sire,mare:c.mare,paths:origin,
    knownVariants,differsByVariant:knownVariants.length>1,
    missingIdentity:every.filter(x=>!norm(x.factorVariant)).length,missingFactors:every.filter(x=>!x.factors.length).length,
    offAnchor:{sire:offS,mare:offD},viaAnchor:{sire:onS,mare:onD},
    independentCrossConfirmed:false,effectiveCrossConfirmed:false,
    documentedFactorsNotProof:c.sire.some(x=>x.factors.length)&&c.mare.some(x=>x.factors.length)});
  }
  grouped.sort((a,b)=>a.name.localeCompare(b.name,'ja'));
  const counts=Object.fromEntries(['shiko-anchor','anchor-descendant','outside-one','outside-both','unknown'].map(k=>[k,grouped.filter(x=>x.kind===k).length]));
  return {version:126,rootsValid,validPaths,anchors,counts,crosses:grouped,
   additionalReviewNames:grouped.filter(x=>x.needsReview).map(x=>x.name),
   documentedIndependentCrossCount:null,documentedEffectiveCrossCount:null,
   source:'保存された最終産駒の5代31枠のみ／至高3×4×5祖先経路',gameVerified:false,
   caveat:'父母それぞれの31枠は最終産駒から見ると6代目を含むため、最終産駒31枠のみでクロス候補を検査。必須至高馬に由来する重複は追加加点しません。アンカー外でも有効性・独立性・ゲーム内成立は未確認。'};
 }
 // For ranking *new* 31-slot candidate recipes, do not grant an
 // 'additional independent cross' research bonus for repetitions inherited
 // solely via the mandatory anchor trees, or with an outside occurrence on
 // only one side.  Unknown roots => no positive bonus (fail closed).
 function filterAdditional({rows=[],anchors=[],candidates=[]}={}){
  const byPath=new Map(arr(rows).map(r=>[String(r?.path||''),r]));
  const anchorRoots=arr(anchors).filter(a=>a?.path&&a?.name&&
   norm(byPath.get(a.path)?.name)===norm(a.name));
  const paths=arr(rows).map(r=>String(r?.path||''));
  const valid=paths.length===31&&new Set(paths).size===31&&paths.every(p=>/^[SD]{0,4}S$/.test(p))&&
   anchorRoots.length===3&&new Set(anchorRoots.map(a=>a.path)).size===3;
  const names=new Set(anchorRoots.map(a=>norm(a.name)));
  const detail=arr(candidates).map(c=>{
   const sites=arr(rows).filter(r=>norm(r?.name)===norm(c?.name));
   const outside=sites.filter(r=>!anchorRoots.some(a=>String(r.path).length>a.path.length&&String(r.path).startsWith(a.path)));
   const father=outside.filter(r=>String(r.path).startsWith('S')).length;
   const mother=outside.filter(r=>String(r.path).startsWith('D')).length;
   const approvedForRelativeBonus=valid&&!names.has(norm(c?.name))&&father>0&&mother>0&&sites.length>1;
   return {name:String(c?.name||''),outsideFather:father,outsideMother:mother,
    allowedForResearchBonus:approvedForRelativeBonus,gameVerified:false};
  });
  const included=detail.map((d,i)=>d.allowedForResearchBonus?candidates[i]:null).filter(Boolean);
  return {validRoots:valid,filtered:included,excludedCount:detail.length-included.length,detail,
   caveat:'独立・有効クロス認定ではなく、至高に必須の祖先から自動継承した重複の過大加点を防ぐ保守的フィルタ。'};
 }
 return Object.freeze({classify,filterAdditional});
});
