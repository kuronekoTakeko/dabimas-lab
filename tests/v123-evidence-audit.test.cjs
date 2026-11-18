'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');let passed=0;const test=(label,f)=>{f();console.log('PASS',label);passed++};
const api=require('../research-mild-evidence-v123.js'),cli=require('../tools/compare-mild-crosscheck-v123.cjs');
const data=process.env.DABIMAS_PORTABLE_JSON,deep=process.env.DABIMAS_CROSS_DEEP,other=process.env.DABIMAS_CROSS_2200,king=process.env.DABIMAS_CROSS_KING;
if(data&&deep&&other&&king){
 const portable=JSON.parse(fs.readFileSync(data,'utf8'));
 const inputs=[deep,other,king].map(f=>({file:path.basename(f),text:fs.readFileSync(f,'utf8')}));
 const report=cli.run(portable,inputs);
 test('最新3血統表：すべて31/31・親からの継承30/30',()=>{assert.equal(report.cases.length,3);for(const x of report.cases){assert.equal(x.foal.registered,31);assert.equal(x.inheritance.matched,30);assert.equal(x.errors.length,0,x.errors.join('\n'));}});
 test('すべての指定3頭は同一ID・因子で公開マスターと一致',()=>{for(const x of report.cases)assert(x.anchors.every(a=>a.positionOk&&a.masterOk));});
 test('最新版端末移行JSONの新規3プランと血統表が一致',()=>assert(report.cases.every(x=>x.registeredPlanMatched)));
 test('未収録因子の差異：1200 19枠、2200 17枠',()=>{assert.equal(report.cases[0].foal.missingFactors,19);assert.equal(report.cases[1].foal.missingFactors,17);});
 test('記録済み短速長因子は1200と2200で同数',()=>{const A=report.cases[0].observedFactorCounts,B=report.cases[1].observedFactorCounts;for(const k of ['短','速','長'])assert.equal(A[k],B[k]);assert.deepEqual([A['短'],A['速'],A['長']],[2,5,5]);});
 test('同名両側祖先：1200 7種類、2200 5種類、3000 5種類',()=>assert.deepEqual(report.cases.map(x=>x.crossNames.length),[7,5,5]));
 test('同じディープ至高セットの比較だけを出す',()=>{assert.equal(report.comparisons.length,1);assert(report.comparisons[0].sameAnchorSet);assert.equal(report.comparisons[0].unknownFactorDelta,-2);assert.equal(report.comparisons[0].commonNameDelta,-2);assert.equal(report.comparisons[0].recommendedWinner,null);});
 test('因子のない祖先をクロス未成立と断定しない',()=>{const r=cli.toReport(inputs[0].text),x=api.study(r,portable.publicMaster.records);assert.equal(x.verifiedEffectiveCrosses,null);assert.equal(x.verifiedIndependentCrosses,null);assert.equal(x.gameVerified,false);});
 test('親からの継承1箇所を改ざんすると不一致検出',()=>{const r=cli.toReport(inputs[0].text);const row=r.parts.foal.ancestors.find(z=>z.path==='SS');row.name='架空の別馬';const x=api.study(r,portable.publicMaster.records);assert(!x.structural);assert(x.inherited.errors.includes('SS'));});
 test('親からの子系統継承の改ざんも不一致として検出',()=>{const r=cli.toReport(inputs[0].text);r.parts.foal.ancestors.find(z=>z.path==='SS').line='架空系統';const x=api.study(r,portable.publicMaster.records);assert(x.inherited.errors.includes('SS'));});
 test('指定祖先の本人因子を改ざんすると公開マスター不一致',()=>{const r=cli.toReport(inputs[0].text);r.parts.foal.ancestors.find(z=>z.path==='DDS').factors=['底'];const x=api.study(r,portable.publicMaster.records);assert(!x.structural);assert(x.errors.some(s=>s.includes('g3')));});
 test('同じ馬名の異因名を同一の種牡馬IDとして推定しない',()=>{const r=cli.toReport(inputs[0].text);r.parts.foal.ancestors.find(z=>z.path==='DDS').variant='煌魂';const x=api.study(r,portable.publicMaster.records);assert(x.anchors.some(z=>z.slot==='g3'&&!z.positionOk));});
 test('解析で個人の所持・プラン・マスターを一切変更しない',()=>{const before=JSON.stringify(portable);cli.run(portable,inputs);assert.equal(JSON.stringify(portable),before);});
}
test('v123 UI とキャッシュへのモジュール接続',()=>{const html=fs.readFileSync(root+'/index.html','utf8'),app=fs.readFileSync(root+'/app.js','utf8'),sw=fs.readFileSync(root+'/sw.js','utf8');
 assert.match(html,/research-mild-evidence-v123\.js\?v=123/);assert.match(html,/app\.js\?v=126/);
 assert.match(app,/mild123EvidenceHtml\(p\)/);assert.match(sw,/dbms-v126-1/);assert.match(sw,/research-mild-evidence-v123\.js/);
});
console.log(`v123 new checks: ${passed} PASS`);
