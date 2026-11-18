/* v119 — Evidence-aware portfolio of SAVED mild plans (no automatic mutation).
 * Never compare SP/ST with research scores. Never certify official BC or 至高.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildPortfolio119=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const n=x=>Number.isFinite(Number(x))?Number(x):null;
 const route=x=>{const s=n(x?.extraSireBirths),m=n(x?.extraMareBirths);
  if(s===null||m===null||![0,1].includes(s)||![0,1].includes(m))return 'unknown';
  return s?(m?'both':'sireOnly'):(m?'mareOnly':'direct');};
 const routes=()=>({direct:0,sireOnly:0,mareOnly:0,both:0,unknown:0});
 function inspect({plans=[],owned={},master=[],homebreds=[],buildStages=null,realdata=null}={}){
  const mids=(Array.isArray(plans)?plans:[]).filter(x=>x?.autoDesign21?.mode==='mild');
  const distribution=routes(),rows=[],signatureSet=new Map();
  for(const p of mids){
   const path=route(p.mild67),births=Number.isInteger(Number(p?.mild78?.additionalBirths))?Number(p.mild78.additionalBirths):null;
   distribution[path]++;
   const savedAudits=p.mild94?.ok===true&&p.mild97?.ok===true&&p.mild98?.ok===true;
   let current=null;
   if(savedAudits&&typeof buildStages==='function'&&typeof realdata?.inspect==='function'){
    const stages=buildStages(p);
    current=realdata.inspect({plan:p,stages,owned,master,homebreds});
   }
   const anchorOk=current?.anchors?.length===3&&current.anchors.every(a=>a.sameRegisteredId&&a.recordPresent);
   const currentlyStructural=savedAudits===true&&current?.structuralRefsOk===true&&current?.saved31===true&&anchorOk===true;
   const shortage=(current?.rightsToConfirm||[]).filter(x=>x.shortage===null||x.shortage>0);
   const needed=shortage.reduce((s,x)=>s+(x.shortage||0),0);
   const code=p.mild97?.finalFingerprint||'';
   const dedupKey=code?JSON.stringify([p.autoDesign21?.race,p.goal,code]):'';
   const duplicateOf=dedupKey&&signatureSet.has(dedupKey)?signatureSet.get(dedupKey):null;
   if(dedupKey&&!duplicateOf)signatureSet.set(dedupKey,p.id);
   rows.push({id:String(p.id||''),title:String(p.title||''),race:String(p.autoDesign21?.race||''),goal:String(p.goal||''),
    updatedAt:p.updatedAt||'',route:path,additionalBirths:births,
    stageAuditPresent:savedAudits,structural:currentlyStructural,
    missingRights:shortage.map(x=>({id:x.id,uses:x.uses,rights:x.rights,shortage:x.shortage})),
    shortageTypes:shortage.length,shortageTotal:needed,publicMareTypes:current?.publicMares?.length??null,
    unresolved:current?.unconfirmed?.length??null,validationErrors:current?.errors?.length??null,
    nitroStages:p.mildNitro107?.stages||null,nitroUnknown:p.mildNitro107?.missingFactorSlots??null,
    independentCrossEvidence:p.mild78?.confirmedIndependentCrosses??null,
    crossCandidates:p.mild78?.independentCrossCandidates??null,
    saved31:current?.saved31===true,duplicateOf,gameVerified:false,productionAuthorized:false});
  }
  const filtered=rows.filter(r=>r.structural);
  // Preparation ORDER only: fewer known missing rights, fewer additional births,
  // no invented ability comparison or automatic breed recommendation.
  filtered.sort((a,b)=>a.shortageTypes-b.shortageTypes||a.shortageTotal-b.shortageTotal||
   (a.additionalBirths??99)-(b.additionalBirths??99)||String(a.race).localeCompare(String(b.race),'ja')||
   String(a.id).localeCompare(String(b.id),'ja'));
  return {version:119,total:rows.length,withSavedAudits:rows.filter(r=>r.stageAuditPresent).length,
   currentStructural:filtered.length,unreviewed:rows.filter(r=>!r.stageAuditPresent).length,
   currentIssues:rows.filter(r=>r.stageAuditPresent&&!r.structural).length,
   duplicateRecords:rows.filter(r=>r.duplicateOf).length,
   distribution,rows,shortlist:filtered.slice(0,20),gameVerified:false,productionAuthorized:false,
   caveat:'保存済み候補の現時点の「再確認作業が少ない順」です。初期探索の候補を生成し直した結果ではありません。権利不足0でも牝馬入手・ゲーム内至高・能力は未確認。ニトロ/クロスは根拠水準が異なるため横断スコアに換算しません。'};
 }
 return Object.freeze({inspect,route});
});
