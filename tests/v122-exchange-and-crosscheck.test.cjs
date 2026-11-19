'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');let total=0;
const test=(s,fn)=>{fn();console.log('PASS',s);total++};
const jsonFile=process.env.DABIMAS_PORTABLE_JSON;
const deep=process.env.DABIMAS_CROSS_DEEP,king=process.env.DABIMAS_CROSS_KING;
const readiness=require('../research-mild-readiness-v97.js');
const execution=require('../research-mild-execution-v81.js');
const demand=require('../research-production-demand-v80.js');
const preflight=require('../research-production-ready-v63.js');
const handoff=require('../research-mild-bc-handoff-v115.js');
const variants=require('../research-mild-variants-v96.js');
const auditor=require('../tools/audit-crosscheck-v122.cjs');
const realdata=require('../research-mild-realdata-v118.js');
const portfolio=require('../research-mild-portfolio-v119.js');
test('権利0・所持trueは工程の開始順でブロックしない',()=>{
 const a=execution.assess({stages:[{id:'C:1',label:'工程1',sireId:'A',mareId:'M',sireType:'public',mareType:'public',pedigreeKnown:31,outputReal:false}],inventory:{a:{owned:true,rights:0}}});
 assert.equal(a.first.length,1);assert.equal(a.first[0].state,'先行準備候補');assert.equal(a.first[0].blocks.length,0);assert.equal(a.missingRights.length,0);
 assert.equal(a.inventoryRows[0].shortage,1,'元の権利不足数は参照可能');
});
test('権利数未記録も所持なら探索可能、未所持は不可',()=>{
 const x=execution.assess({stages:[{id:'C:1',sireId:'A',mareId:'M',sireType:'public',mareType:'public'}],inventory:{a:{owned:true}}});
 const y=execution.assess({stages:[{id:'C:1',sireId:'A',mareId:'M',sireType:'public',mareType:'public'}],inventory:{a:{owned:false,rights:10}}});
 assert.equal(x.candidates.length,1);assert.equal(y.candidates.length,0);assert.equal(y.missingOwned.length,1);
});
test('必要交配数は数えるが保存権利は判定に使わない',()=>{
 const inventory={a:{owned:true,rights:0}};
 const x=demand.audit({stages:[{sireId:'A'},{sireId:'A'}],inventory,resolve:()=>({id:'A'})});
 assert.equal(x.rows[0].count,2);assert.equal(x.rows[0].rights,0);assert.equal(x.rows[0].recordedShortage,2);
 assert.equal(x.rows[0].shortage,0);assert.equal(x.insufficient,0);assert.equal(inventory.a.rights,0);
});
test('開始前検査で所持0権利を不足としない',()=>{
 const x=preflight.analyze({plan:{routeDraft:{layout:'maternal-dds-g3',slots:{g3:'A'}},chain09:{mares:{1:'M'}}},inventory:{a:{owned:true,rights:0}}});
 assert.equal(x.zero,0);assert.equal(x.steps[0].owned,true);assert.match(x.steps[0].status,/交換可能/);
});
test('BC引継ぎでは権利補充を必須扱いしない',()=>{
 const a=handoff.inspect({plan:{autoDesign21:{mode:'mild'},mild94:{ok:true}},readiness:{ok:true,publicSires:[{id:'A',owned:true,rights:0,shortage:2}],publicMares:[]},stageAudit:{ok:true},externalAudit:{anchors:[{status:'登録位置・異因名一致（外部未検証）'},{status:'登録位置・異因名一致（外部未検証）'},{status:'登録位置・異因名一致（外部未検証）'}],unknownFactors:[]}});
 assert.equal(a.rights.length,0);assert(!a.actions.some(x=>x.includes('権利')));assert.equal(a.productionAuthorized,false);
});
test('同等の異因名候補は権利数によって順位を変えない',()=>{
 const a={sire:{id:'A',factors:['速']},trial:{},rights:0};const b={sire:{id:'B',factors:['速']},trial:{},rights:10};
 assert(variants.comparison(a,b,'speed',()=>({score:10,independentCrossEvidence:0,crossFactorEvidence:0,shortCrossRisk:0,unresolvedCrosses:0}))<0);
});
test('保存プラン一覧は権利数ではなく工程数優先',()=>{
 const plans=[0,1].map((x)=>({id:String(x),title:String(x),goal:'speed',autoDesign21:{mode:'mild',race:'芝1200m'},mild67:{extraSireBirths:x,extraMareBirths:0},mild78:{additionalBirths:x},mild94:{ok:true},mild97:{ok:true,finalFingerprint:'x'+x},mild98:{ok:true}}));
 const report=portfolio.inspect({plans,buildStages:()=>[],realdata:{inspect:()=>({structuralRefsOk:true,saved31:true,anchors:[{sameRegisteredId:true,recordPresent:true},{sameRegisteredId:true,recordPresent:true},{sameRegisteredId:true,recordPresent:true}],rightsToConfirm:[{id:'S',owned:true,rights:0,shortage:2}],publicMares:[],errors:[]})}});
 assert.equal(report.shortlist[0].additionalBirths,0);assert.equal(report.shortlist[0].shortageTypes,0);
});
test('最新端末データを一切書換えずに登録権利を参照',()=>{
 if(!jsonFile)return;
 const data=JSON.parse(fs.readFileSync(jsonFile,'utf8')),before=JSON.stringify(data.personal.owned);
 const a=realdata.auditInventory({owned:data.personal.owned,master:data.publicMaster.records,homebreds:data.personal.homebreds});
 assert.equal(a.acquired,330);assert.equal(a.zeroRights,277);assert.equal(a.masterRecords,2983);
 assert.equal(before,JSON.stringify(data.personal.owned));
});
if(jsonFile&&king&&deep){const j=JSON.parse(fs.readFileSync(jsonFile,'utf8'));for(const [name,file] of [['キングカメハメハ',king],['ディープインパクト',deep]]){
 test(name+' 添付TXTの親子30枠と公開マスター至高3頭',()=>{
  const x=auditor.audit(fs.readFileSync(file,'utf8'),j);
  assert.equal(x.errors.length,0,x.errors.join('\n'));assert.equal(x.inheritance.matched,30);
  assert.equal(x.sectionAudit.foal.rows,31);assert(x.anchorSource.every(a=>a.found&&a.factorsIdentical));
  assert.equal(x.uniquelyMatched,true,'最新版JSONに保存された仮番号・タイトルと一致');
  assert.equal(x.gameVerified,false);
 });
}
 test('TXTの親馬の継承を壊すと検出',()=>{
  const input=fs.readFileSync(deep,'utf8');const tampered=input.replace('SS\tディープインパクトマイル・工程3・仮37','SS\t別馬');
  const x=auditor.audit(tampered,j);assert(x.errors.some(s=>s.includes('最終産駒 SS')));
 });
 test('因子が食い違うと公開マスター照合で検出',()=>{
  const input=fs.readFileSync(deep,'utf8');const tampered=input.replace('DDS\tディープインパクト\t央獅\t中・速・短','DDS\tディープインパクト\t央獅\t底');
  const x=auditor.audit(tampered,j);assert(x.errors.some(s=>s.includes('g3 公開マスター')));
 });
}
test('v122アプリの資産参照',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert.match(html,/プランナー｜v127/);assert.match(html,/app.js\?v=127/);assert.match(sw,/dbms-v127-1/);
});
console.log(`v122 checks: ${total} PASS`);
