'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const api=require('../research-mild-realdata-v118.js');let count=0;
function test(label,fn){fn();console.log('PASS '+label);count++}
const stallion={id:'牡A',sex:'male'},stallionMissing={id:'牡B',sex:'male'},mare={id:'牝A',sex:'female'};
const records=[stallion,stallionMissing,mare];const owned={'牡A':{owned:true,rights:0},'牡B':{owned:true,rights:5},'孤立':{owned:true,rights:1}};
const h=Array.from({length:9},(_,i)=>({id:'H'+(i+1),sex:'male',mode:'draft',fatherId:'牡A',motherId:'牝A'}));
const plan={autoDesign21:{mode:'mild'},mild94:{ok:true},mild97:{ok:true},mild98:{ok:true},externalReview48:{parts:{foal:{ancestors:Array.from({length:31},(_,i)=>({path:'P'+i,name:'a'}))}}}};
const stages=Array.from({length:9},(_,i)=>({kind:'core',id:'C:'+(i+1),label:'工程'+(i+1),number:i+1,sireId:'牡A',mareId:'牝A',outputId:'H'+(i+1)}));
const base={plan,stages,owned,master:records,homebreds:h};
test('330頭等の全端末照合と0権利区別',()=>{const a=api.auditInventory(base);assert.equal(a.acquired,3);assert.equal(a.matched,2);assert.equal(a.unmatched[0].id,'孤立');assert.equal(a.zeroRights,1);assert.equal(a.totalRights,6);assert.equal(a.draftHomebreds,9)});
test('v122: 取得済み権利0は補充警告を出さず登録数のみ保持',()=>{const a=api.inspect(base);assert.equal(a.structuralRefsOk,true);assert.equal(a.rightsToConfirm.length,0);assert.equal(a.publicSires[0].recordedShortage,9);assert.equal(a.publicSires[0].shortage,0);assert.equal(a.canStartProduction,false);assert.equal(a.gameVerified,false)});
test('公開牝馬の予定使用回数',()=>{const a=api.inspect(base);assert.equal(a.publicMares[0].uses,9);assert.equal(a.virtualOutputs.length,9);assert.equal(a.saved31,true)});
test('個人記録・マスターを変更しない',()=>{const before=JSON.stringify(base);api.inspect(base);assert.equal(JSON.stringify(base),before)});
test('自家製の親子関係不一致を検出',()=>{const a=api.inspect({...base,homebreds:[{...h[0],motherId:'他'},...h.slice(1)]});assert.match(a.errors.join(' '),/登録父母と工程指定/)});
test('後工程参照を検出',()=>{const a=api.inspect({...base,stages:[{...stages[0],sireId:'H9'},...stages.slice(1)]});assert.match(a.errors.join(' '),/後工程/)});
test('公開マスター未収録の所有者は推定で補わない',()=>{const a=api.inspect({...base,stages:[{...stages[0],sireId:'孤立'},...stages.slice(1)]});assert.match(a.unconfirmed.join(' '),/公開血統未収録/)});
test('未所持の種牡馬を検出',()=>{const a=api.inspect({...base,owned:{'牡A':{owned:false,rights:0},'牡B':{owned:true,rights:5}}});assert.match(a.errors.join(' '),/未所持/)});
test('旧モードは対象外',()=>assert.equal(api.inspect({...base,plan:{autoDesign21:{mode:'hard'}}}),null));
const actual=process.env.DABIMAS_PORTABLE_JSON;
if(actual&&fs.existsSync(actual))test('提供330頭の端末移行JSONで実数検査',()=>{
 const j=JSON.parse(fs.readFileSync(actual,'utf8'));const a=api.auditInventory({owned:j.personal.owned,master:j.publicMaster.records,homebreds:j.personal.homebreds});
 assert.equal(a.acquired,330);assert.equal(a.masterRecords,j.publicMaster.records.length);assert.equal(a.stallions,2482);assert.equal(a.mares,501);assert.equal(a.unmatched.length,4);assert.equal(a.draftHomebreds,614);
});
const root=path.join(__dirname,'..');const html=fs.readFileSync(root+'/index.html','utf8'),js=fs.readFileSync(root+'/app.js','utf8'),sw=fs.readFileSync(root+'/sw.js','utf8');
test('v118をアプリ・HTML・SWに接続',()=>{
 assert.match(html,/research-mild-realdata-v118\.js\?v=122/);assert.match(js,/mild118RealdataHtml\(p\)/);
 assert.match(sw,/research-mild-realdata-v118\.js/);assert.match(sw,/dbms-v123-1/);
});
console.log('v118 tests: '+count+' PASS');
