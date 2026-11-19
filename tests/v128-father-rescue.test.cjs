'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),api=require('../research-mild-rescue-v128.js');
let n=0;function check(label,fn){fn();n++;console.log('PASS '+label)}
const at=(index,bestGrade=3,grade3Families=2,availableFamilies=89)=>api.shouldInspect({index,bestGrade,grade3Families,availableFamilies,primary:100,reserve:60,diversityReserve:40,targetFamilies:3});
check('通常100件の検査枠は必ず使用',()=>{for(let i=0;i<100;i++)assert(at(i,3,99,89));});
check('超完璧・父系2種類なら101〜140件目まで追加確認',()=>{assert(at(100));assert(at(139));assert(!at(140));});
check('父系が3種類に揃えば予備検査停止',()=>{assert(!at(100,3,3,89));assert(!at(120,3,4,89));});
check('事前探索の父系が2以下ならむだな予備調査はしない',()=>{assert(!at(100,3,2,2));});
check('超完璧を発見できない時は最大160件まで救済',()=>{assert(at(100,2,1));assert(at(159,2,0));assert(!at(160,2,0));});
check('不正なインデックス・上限越えは実行しない',()=>{for(const i of [-1,160,Infinity,NaN,1.5])assert(!at(i));});
check('状態変化に応じて予備枠を途中で終える',()=>{let seen=2,extra=0;for(let i=100;i<160;i++){if(!at(i,3,seen))break;extra++;if(i===113)seen=3;}assert.equal(extra,14);});
check('監査に探索未確認の数を残し全探索や至高と誤表示しない',()=>{
 const s=api.snapshot({offered:160,inspected:140,primary:100,reserve:60,diversityReserve:40,availableFamilies:89,primaryGrade3Families:2,grade3Families:2,primaryGrade:3,finalGrade:3,prechecked:650});
 assert.equal(s.extraInspected,40);assert.equal(s.notReviewed,20);assert.equal(s.outsideShortlist,490);assert.equal(s.fullSearch,false);assert.equal(s.gameVerified,false);
});
check('検査記録は読み取り専用',()=>{const x={offered:160,inspected:140};const before=JSON.stringify(x);api.snapshot(x);assert.equal(JSON.stringify(x),before);});
check('旧保存プランを自動再評価済みにしない',()=>{const p={autoDesign21:{mode:'mild'},mild89:{}};const s=api.fromSaved(p);assert(!s.fresh&&s.needsReSearch);});
check('新しい保存結果のみ新方式と表示',()=>{const p={autoDesign21:{mode:'mild'},mild89:{rescue128:api.snapshot({offered:160,inspected:130})}};const s=api.fromSaved(p);assert(s.fresh);assert.equal(s.inspected,130);assert.equal(s.gameVerified,false);});
check('完了扱いにしない4工程の探索制約を保持',()=>{const p={autoDesign21:{mode:'mild'},mild128:api.snapshot({offered:160,inspected:160,prechecked:650})};assert.equal(api.fromSaved(p).fullSearch,false);});
const j=process.env.DABIMAS_PORTABLE_JSON;
if(j){const data=JSON.parse(fs.readFileSync(j,'utf8'));check('実データ65保存・330所持・公開2983件を一切変更しない',()=>{
 const before=JSON.stringify(data),plans=data.personal?.plans||[],owned=Object.values(data.personal?.owned||{}).filter(v=>v.owned).length;
 assert.equal(plans.length,65);assert.equal(owned,330);
 for(const p of plans)api.fromSaved(p);
 assert.equal(JSON.stringify(data),before);
 });}
check('アプリ・HTML・Service Workerを順序を守って読み込む',()=>{
 const h=fs.readFileSync(root+'/index.html','utf8'),app=fs.readFileSync(root+'/app.js','utf8'),sw=fs.readFileSync(root+'/sw.js','utf8');
 assert.match(h,/v128/);assert.match(h,/research-mild-rescue-v128\.js\?v=128/);
 assert(h.indexOf('research-mild-rescue-v128.js')<h.indexOf('app.js?v=128'));
 assert.match(app,/DabimasMildRescue128\?\.shouldInspect/);assert.match(app,/draft\.mild128=/);
 assert.match(sw,/dbms-v128-1/);assert.match(sw,/research-mild-rescue-v128\.js/);
});
console.log('v128: '+n+' checks PASS');
