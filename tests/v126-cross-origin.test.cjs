'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),api=require('../research-mild-cross-origin-v126.js'),decision=require('../research-mild-decision-v125.js');
let n=0;const check=(label,fn)=>{fn();n++;console.log('PASS '+label)};
const jsonPath=process.env.DABIMAS_PORTABLE_JSON;
if(jsonPath){
 const data=JSON.parse(fs.readFileSync(jsonPath,'utf8'));
 const ids=['233ea3d7-9b09-43c9-99dc-221b9f9064d8','e78ca0b8-5f7a-47b9-863a-9ac2c919b6ac','b3a4425b-3b45-4778-bef4-e903a1a6d55f'];
 const plans=ids.map(id=>data.personal.plans.find(p=>p.id===id));
 const evaluate=p=>api.classify({report:p.externalReview48,crosses:decision.crosses(p.externalReview48)});
 check('3プランと現在の仮馬番号を照合',()=>{assert(plans.every(Boolean));assert(plans.every(p=>p.externalReview48?.parts?.foal?.ancestors?.length===31));});
 const output=plans.map(evaluate);
 check('3×4×5の異因名・配置が構造上一致',()=>{assert(output.every(x=>x.rootsValid));assert(output.every(x=>x.anchors.length===3&&x.anchors.every(a=>a.registered)));});
 check('全候補の名前リストと由来分類が矛盾しない',()=>{assert.deepEqual(output.map(x=>x.crosses.length),[2,2,2]);assert(output.every(x=>Object.values(x.counts).reduce((a,b)=>a+b,0)===x.crosses.length));});
 check('ディープ1200：必須1・片側外1・両側外0',()=>assert.deepEqual(output[0].counts,{'shiko-anchor':1,'anchor-descendant':0,'outside-one':1,'outside-both':0,unknown:0}));
 check('ディープ2200：必須1・継承1・両側外0',()=>assert.deepEqual(output[1].counts,{'shiko-anchor':1,'anchor-descendant':1,'outside-one':0,'outside-both':0,unknown:0}));
 check('キング3000：必須1・継承1・両側外0',()=>assert.deepEqual(output[2].counts,{'shiko-anchor':1,'anchor-descendant':1,'outside-one':0,'outside-both':0,unknown:0}));
 check('ディープ2200のリローンチは6代目なので最終5代の候補から除外',()=>{assert.deepEqual(output[1].additionalReviewNames,[]);assert(!output[1].crosses.some(x=>x.name==='リローンチ'));});
 check('ディープ2200のサンデーサイレンスは必須アンカー由来',()=>assert.equal(output[1].crosses.find(x=>x.name==='サンデーサイレンス').kind,'anchor-descendant'));
 check('キング3000のキングマンボは必須アンカー由来',()=>assert.equal(output[2].crosses.find(x=>x.name==='キングマンボ').kind,'anchor-descendant'));
 check('ディープ1200のサンデーは片側に追加経路があるため要確認',()=>assert.deepEqual(output[0].additionalReviewNames,['サンデーサイレンス']));
 check('全分類は独立クロス・有効クロスを確定させない',()=>{assert(output.every(x=>x.gameVerified===false&&x.documentedIndependentCrossCount===null&&x.crosses.every(c=>!c.independentCrossConfirmed&&!c.effectiveCrossConfirmed)));});
 const anchors=p=>Object.entries({g3:'DDS',g4:'SSSS',g5:'SDSSS'}).map(([slot,path])=>({path,name:p.externalReview48.parts.foal.ancestors.find(r=>r.path===path).name}));
 const cands=p=>decision.crosses(p.externalReview48).map(x=>({name:x.name,counts:{'速':1},counted:[1]}));
 check('父母側の6代目由来を追加研究加点から排除',()=>{const p=plans[1],f=api.filterAdditional({rows:p.externalReview48.parts.foal.ancestors,anchors:anchors(p),candidates:cands(p)});assert(f.validRoots);assert.deepEqual(f.filtered.map(x=>x.name),[]);assert.equal(f.excludedCount,5);});
 check('ディープ1200の6代目Prince Johnとリローンチも加点しない',()=>{const p=plans[0],f=api.filterAdditional({rows:p.externalReview48.parts.foal.ancestors,anchors:anchors(p),candidates:cands(p)});assert.equal(f.filtered.length,0);});
 check('片側だけ外のサンデーサイレンスは追加加点しない',()=>{const p=plans[0],f=api.filterAdditional({rows:p.externalReview48.parts.foal.ancestors,anchors:anchors(p),candidates:cands(p)});assert.equal(f.detail.find(x=>x.name==='サンデーサイレンス').allowedForResearchBonus,false);});
 check('反例：父母双方に外側の5代祖先があれば研究候補として保持',()=>{const p=plans[1],rows=structuredClone(p.externalReview48.parts.foal.ancestors);rows.find(r=>r.path==='SSDS').name='テスト祖先';rows.find(r=>r.path==='DSDS').name='テスト祖先';const f=api.filterAdditional({rows,anchors:anchors(p),candidates:[{name:'テスト祖先'}]});assert.deepEqual(f.filtered.map(x=>x.name),['テスト祖先']);});
 check('指定祖先が欠落すると順位用追加加点は停止',()=>{const p=plans[1],a=anchors(p);a[0].name='完全に別の馬';const f=api.filterAdditional({rows:p.externalReview48.parts.foal.ancestors,anchors:a,candidates:cands(p)});assert(!f.validRoots);assert.equal(f.filtered.length,0);});
 check('記録済みの血統・因子・保存プラン・所持権利数を不変にする',()=>{const before=JSON.stringify(data);plans.forEach(p=>{evaluate(p);api.filterAdditional({rows:p.externalReview48.parts.foal.ancestors,anchors:anchors(p),candidates:cands(p)});});assert.equal(JSON.stringify(data),before);});
}
check('新スクリプト・画面・SWキャッシュ・アプリ順位フィルタを参照',()=>{
 const html=fs.readFileSync(root+'/index.html','utf8'),app=fs.readFileSync(root+'/app.js','utf8'),sw=fs.readFileSync(root+'/sw.js','utf8');
 assert.match(html,/research-mild-cross-origin-v126\.js\?v=126/);assert.match(html,/app\.js\?v=126/);
 assert.match(app,/DabimasMildCrossOrigin126\?\.classify/);assert.match(app,/DabimasMildCrossOrigin126\?\.filterAdditional/);
 assert.match(sw,/dbms-v126-1/);assert.match(sw,/research-mild-cross-origin-v126\.js/);
});
console.log(`v126: ${n} checks PASS`);
