#!/usr/bin/env node
/* Compare independently exported 5-generation TXT evidence, never certify game effects. */
'use strict';
const fs=require('node:fs');
const old=require('./audit-crosscheck-v122.cjs');
const evaluator=require('../research-mild-evidence-v123.js');
function toReport(text){const p=old.parse(text);return {schema:'dabimas-crosscheck-v1',planTitle:p.title,
 anchorSlots:p.anchors,parts:Object.fromEntries(Object.entries(p.sections).map(([k,ancestors])=>[k,{ancestors,known:ancestors.filter(r=>r.name).length,conflicts:[]}]))};}
function run(portable,inputs){
 const master=portable?.publicMaster?.records||[];
 const checked=inputs.map(item=>{const report=toReport(item.text),study=evaluator.study(report,master);
  return {file:item.file,report,study,registeredAudit:old.audit(item.text,portable)};
 });
 const comparisons=[];
 for(let a=0;a<checked.length;a++)for(let b=a+1;b<checked.length;b++){
  if(JSON.stringify(checked[a].report.anchorSlots)!==JSON.stringify(checked[b].report.anchorSlots))continue;
  const pair=evaluator.compare(checked[a].report,checked[b].report,master);
  comparisons.push({files:[checked[a].file,checked[b].file],sameAnchorSet:pair.sameAnchorSet,
   changedPublishedRows:pair.changedPublishedRows,unknownFactorDelta:pair.unknownFactorDelta,recordedNitroRelated:pair.recordedNitroRelated,
   commonNameDelta:pair.commonNameDelta,recommendedWinner:null});
 }
 return {version:123,source:'外部照合用TXTと公開登録マスターの構造・証拠比較',gameVerified:false,
  cases:checked.map(x=>({file:x.file,title:x.report.planTitle,registeredPlanMatched:x.registeredAudit.uniquelyMatched,
   structural:x.study.structural,inheritance:x.study.inherited,anchors:x.study.anchors,
   foal:x.study.parts.foal,crossNames:x.study.sharedNames,observedFactorCounts:x.study.observedFactorCounts,errors:x.study.errors,
   missingEvidence:x.registeredAudit.warnings})),comparisons,
  conclusion:'同名祖先の増減や未収録枠の減少ではBC能力・至高成立・有効クロスを証明できません。勝者判定は保留。'};
}
if(require.main===module){const [json,...paths]=process.argv.slice(2);
 if(!json||!paths.length)throw new Error('Usage: node tools/compare-mild-crosscheck-v123.cjs portable.json cross1.txt [cross2.txt...]');
 const result=run(JSON.parse(fs.readFileSync(json,'utf8')),paths.map(f=>({file:f.split(/[\\/]/).pop(),text:fs.readFileSync(f,'utf8')})));
 process.stdout.write(JSON.stringify(result,null,2)+'\n');if(result.cases.some(c=>c.errors.length))process.exitCode=1;
}
module.exports={toReport,run};
