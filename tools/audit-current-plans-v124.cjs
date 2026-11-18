#!/usr/bin/env node
'use strict';
/* Read-only current-portable audit: no game verification, no storage changes. */
const fs=require('node:fs'),live=require('../research-mild-live-audit-v124.js'),evidence=require('../research-mild-evidence-v123.js');
function run(portable){
 const user=portable.personal||{},plans=Array.isArray(user.plans)?user.plans:[],homebreds=user.homebreds||[],master=portable.publicMaster?.records||[];
 const mild=plans.filter(p=>p?.autoDesign21?.mode==='mild');
 const candidates=mild.map(p=>{
  const x=live.assess({plan:p,homebreds,master});const e=p.externalReview48?evidence.study(p.externalReview48,master):null;
  const readable=p.mild98?.ok===true&&p.mild97?.ok===true&&p.mild94?.ok===true;
  return {id:p.id,title:p.title,target:p.target,goal:p.goal,hasStoredAudits:readable,
   localCurrentMatched:x?.fullyReconciled===true,stages:x?.checkedStages||0,parentRefs:x?.checkedParents||0,
   factorRowsCompared:x?.registeredAncestorsChecked||0,factorRowsMatched:x?.registeredAncestorMatches||0,
   virtual:x?.draftCount||0,real:x?.realCount||0,
   gameVerified:false,anchorEvidence:e?.anchors?.every(a=>a.positionOk&&a.masterOk)===true,
   errors:x?.errors||[],unconfirmed:x?.unconfirmed||[],evidenceErrors:e?.errors||[]};
 });
 return {version:124,exportedAt:portable.exportedAt||'',inventory:{owned:Object.values(user.owned||{}).filter(x=>x?.owned===true).length,plans:plans.length,mildPlans:mild.length,homebreds:homebreds.length,publicMaster:master.length},
  coverage:{storedAudits:candidates.filter(x=>x.hasStoredAudits).length,liveMatched:candidates.filter(x=>x.localCurrentMatched).length,oldUnverified:candidates.filter(x=>!x.hasStoredAudits).length,
   notCurrentMatched:candidates.filter(x=>x.hasStoredAudits&&!x.localCurrentMatched).length},
  plans:candidates,source:'現在の端末移行JSON内の保存プラン・仮馬・31枠を独立再照合',gameVerified:false,
  caveat:'登録上の一致＝ゲーム内至高・完璧・超完璧成立や産駒能力・クロス効果を保証しません。仮馬は生産済みではありません。'};
}
if(require.main===module){if(!process.argv[2])throw Error('Usage node tools/audit-current-plans-v124.cjs portable.json [out.json]');const obj=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const report=run(obj),txt=JSON.stringify(report,null,2)+'\n';if(process.argv[3])fs.writeFileSync(process.argv[3],txt);else process.stdout.write(txt);}
module.exports={run};
