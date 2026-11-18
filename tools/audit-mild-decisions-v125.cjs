'use strict';
/* Read-only audit of currently saved mild plans; NEVER rewrites input JSON. */
const fs=require('node:fs');
const api=require('../research-mild-decision-v125.js');
const liveAudit=require('../research-mild-live-audit-v124.js');
const evidenceAudit=require('../research-mild-evidence-v123.js');
function run(portable){
 const plans=(portable?.personal?.plans||[]).filter(p=>p?.autoDesign21?.mode==='mild');
 const results=plans.map(plan=>({planId:plan.id,
  ...api.assess({plan,homebreds:portable?.personal?.homebreds||[],master:portable?.publicMaster?.records||[],liveAudit,evidenceAudit})}));
 return {schema:'dabimas-mild-decision-v125',sourceDate:portable?.exportedAt||null,total:plans.length,
  dataMatched:results.filter(r=>r.dataMatched).length,pendingReaudit:results.filter(r=>!r.dataMatched).length,
  gameVerifiedCount:0,gameVerifiedCountIsAutomatic:false,
  evidence:'ゲーム内確認情報の独立ソースは未収録。すべてのプランはゲーム内確認待ち',
  details:results};
}
if(require.main===module){const input=process.argv[2];if(!input)throw Error('Usage: node audit-mild-decisions-v125.cjs <portable.json>');
 const report=run(JSON.parse(fs.readFileSync(input,'utf8')));
 process.stdout.write(JSON.stringify(report,null,2)+'\n');}
module.exports={run};
