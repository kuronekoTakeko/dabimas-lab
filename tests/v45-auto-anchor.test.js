'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const owned=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
let count=0;
function test(name,cb){cb();count++;console.log('PASS',name)}
test('auto selection option retained alongside family selection',()=>{
 assert(js.includes('中心馬の馬名も自動選択（上位6組）'));
 assert(js.includes('family:${encodeURIComponent(f.name)}'));
 assert(js.includes("if(previousValue==='auto')sel.value='auto'"));
});
test('auto selection compares foundations not just the sire factor total',()=>{
 assert(js.includes('function foundationFor(anchor)'));
 assert(js.includes("opt10Find(draft,fast?'meihin_fast':'meihin')"));
 assert(js.includes('auto35CompareQuality(a.quality,b.quality)'));
 assert(js.includes('auto37Compare(a.evidence,b.evidence)'));
 assert(js.includes('opt10Sort(a.candidate,b.candidate)'));
});
test('auto selection has explicit upper limit',()=>{
 assert(js.includes('selectionInfo.pool'));
 assert(js.includes('searchCap:selectionInfo.limit')); 
 assert(js.includes('完全網羅探索でもありません')); 
});
test('auto search stores evidence and reports game status honestly',()=>{
 assert(js.includes('autoAnchor45:{enabled:autoPick||familyPick')); 
 assert(js.includes('verifiedGame:false'));
 assert(js.includes('ゲーム内成立は未確認'));
});
test('no valid anchor keeps existing user records and warns',()=>{
 assert(js.includes('保存データは変更していません'));
 assert(js.includes('if(!initial)'));
});
test('original owner state and zero rights remain preserved',()=>{
 assert.equal(Object.keys(owned.owned).length,315);
 assert(Object.values(owned.owned).some(v=>v.owned&&v.rights===0));
 assert.equal(owned.plans.length,0);
});
test('cache, UI and script revision consistent',()=>{
 assert(html.includes('app.js?v=69'));
 assert(html.includes('馬名を選択')); 
 assert(sw.includes("dbms-v69-1"));
});
test('javascript parses without execution or storage mutations',()=>{
 const {execFileSync}=require('node:child_process');
 execFileSync('node',['--check',path.join(root,'app.js')]);
 execFileSync('node',['--check',path.join(root,'sw.js')]);
});
console.log(`${count} v4.5 tests passed`);
