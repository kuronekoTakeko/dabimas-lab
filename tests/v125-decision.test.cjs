'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),api=require('../research-mild-decision-v125.js'),live=require('../research-mild-live-audit-v124.js'),evidence=require('../research-mild-evidence-v123.js');
let ok=0;const check=(name,fn)=>{fn();ok++;console.log('PASS '+name);};
const data=process.env.DABIMAS_PORTABLE_JSON;
if(data){
 const p=JSON.parse(fs.readFileSync(data,'utf8')),plans=p.personal.plans,homebreds=p.personal.homebreds,master=p.publicMaster.records;
 const ids=['233ea3d7-9b09-43c9-99dc-221b9f9064d8','e78ca0b8-5f7a-47b9-863a-9ac2c919b6ac','b3a4425b-3b45-4778-bef4-e903a1a6d55f'];
 const rows=ids.map(id=>plans.find(x=>x.id===id));const inspect=(plan,b=homebreds)=>api.assess({plan,homebreds:b,master,liveAudit:live,evidenceAudit:evidence});
 check('3件とも保存プランがある',()=>assert(rows.every(Boolean)));
 check('現行登録に一致した3プランだけを確認待ちへ分類',()=>rows.forEach(v=>{const r=inspect(v);assert.equal(r.dataMatched,true,r.title);assert.equal(r.phase,'登録照合済／ゲーム内確認待ち')}));
 check('登録の因子未収録数を欠落と区別',()=>assert.deepEqual(rows.map(p=>inspect(p).missingFactorSlots),[19,17,17]));
 check('3×4×5の登録・6種因子をゲーム内成立と切り離す',()=>rows.forEach(p=>{const x=inspect(p);assert(x.recordedShikoBasis);assert.equal(x.distinctAnchorFactorTypes,6);assert.equal(x.confirmedShikoInGame,false);}));
 check('両側同名の種類数を効果本数に使わない',()=>assert.deepEqual(rows.map(p=>inspect(p).commonNameCrossCandidates),[7,5,5]));
 check('クロス候補の父母パスを最終産駒パスに変換',()=>{const c=inspect(rows[1]).crosses.find(c=>c.name==='ディープインパクト');assert(c);assert(c.sire.some(x=>x.foalPath==='SSSS'));assert(c.mare.some(x=>x.foalPath==='DDS'));});
 check('異因名を同一の種牡馬IDとして合体しない',()=>{const c=inspect(rows[1]).crosses.find(c=>c.name==='ディープインパクト');assert(c.differsByVariant);assert(c.knownVariants.includes('煌魂'));assert(c.knownVariants.includes('翔燕'));assert(c.knownVariants.includes('央獅'));assert.equal(c.independenceVerified,false);});
 check('因子なしを未収録として保持し、独立クロス確定にしない',()=>{const r=inspect(rows[1]);assert(r.crosses.some(c=>c.missingFactors>0));assert.equal(r.confirmedIndependentCrosses,null);assert.equal(r.confirmedEffectiveCrosses,null);});
 check('実馬0・仮馬10・登録一致でも生産承認しない',()=>rows.forEach(x=>{const r=inspect(x);assert.equal(r.recordedDraftHorses,10);assert.equal(r.recordedRealHorses,0);assert.equal(r.gameVerified,false);assert.equal(r.authorizedForBreeding,false)}));
 check('旧形式プランを登録一致とは表示しない',()=>{const old=plans.find(p=>p.autoDesign21?.mode==='mild'&&!p.mild98?.stages?.length);assert(old);const r=inspect(old);assert(!r.dataMatched);});
 check('現行仮馬改ざんで生産判断ゲートが停止',()=>{const changed=homebreds.map(h=>h.id===rows[1].chain09.outputs['4']?{...h,fatherId:'別馬'}:h);assert(!inspect(rows[1],changed).dataMatched)});
 check('同一目標レースでない計画に強さ順位をつけない',()=>{const a=inspect(rows[0]),b=inspect(rows[1]);const c=api.compare(a,b);assert(!c.comparable);assert.equal(c.winner,null);});
 check('同一目標レースの比較でも勝ち馬を捏造しない',()=>{const a=inspect(rows[1]),c=api.compare(a,a);assert(c.comparable);assert.equal(c.winner,null);});
 check('取得済みの権利数は判定を変えない',()=>{const r=inspect(rows[1]);const owned=JSON.stringify(p.personal.owned);assert(r.dataMatched);assert.equal(JSON.stringify(p.personal.owned),owned);});
 check('全プラン・自家製馬・公開マスターを変更しない',()=>{const before=JSON.stringify(p);rows.forEach(x=>inspect(x));assert.equal(JSON.stringify(p),before);});
}
check('v125 JS参照・UI呼出・PWAキャッシュが連動',()=>{const html=fs.readFileSync(root+'/index.html','utf8'),app=fs.readFileSync(root+'/app.js','utf8'),sw=fs.readFileSync(root+'/sw.js','utf8');assert.match(html,/research-mild-decision-v125\.js\?v=125/);assert.match(html,/app\.js\?v=127/);assert.match(app,/mild125DecisionHtml\(p\)/);assert.match(sw,/dbms-v127-1/);assert.match(sw,/research-mild-decision-v125\.js/);});
console.log('v125: '+ok+' checks PASS');
