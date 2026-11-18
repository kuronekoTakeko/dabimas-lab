'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {inspect}=require('../research-mild-realism-v117.js');
const good={autoDesign21:{mode:'mild'}};
function parseFoal(source){
 const txt=fs.readFileSync(source,'utf8');
 const block=txt.split('【最終産駒：')[1].split('【v110')[0];
 const ancestors=block.split(/\r?\n/).map(x=>x.split('\t')).filter(c=>/^[SD]{1,5}$/.test(c[0]||'')).map(c=>({path:c[0],name:c[1],variant:c[2],factors:c[3]==='未確認'?[]:(c[3]||'').split('・')}));
 const lines=txt.match(/至高指定：g3=([^\s]+) \/ g4=([^\s]+) \/ g5=([^\s]+)/);
 return {parts:{foal:{ancestors}},anchorSlots:lines?{g3:lines[1],g4:lines[2],g5:lines[3]}:{}};
}
let cases=0;
function test(name,fn){fn();cases++;console.log('PASS',name)}
const base={plan:good,flow:{errors:[],virtualCount:0,unlinkedCount:0},readiness:{ok:true}};
const folders='/mnt/data';
for(const [filename,kind] of [
 ['dabimas_pedigree_crosscheck_f19613c8-a7c4-4f29-8f6c-86f3327af8a6.txt','ディープ芝2400'],
 ['dabimas_pedigree_crosscheck_9eeb2dc5-211d-4de2-956f_764551f2bd90.txt','bad']]){
 if(kind==='bad')continue;
 test(kind+' 実血統31枠',()=>{const r=inspect({...base,exportReport:parseFoal(path.join(folders,filename))});assert.equal(r.registeredSlots,31);assert.equal(r.unknownFactorCount,17);assert.ok(r.virtualCount>=3);assert.equal(r.mayStartProduction,false);});
}
test('キング芝3000 実血統31枠',()=>{const r=inspect({...base,exportReport:parseFoal(path.join(folders,'dabimas_pedigree_crosscheck_9eeb2dc5-211d-4de2-956f-764551f2bd90.txt'))});assert.equal(r.registeredSlots,31);assert.equal(r.unknownFactorCount,17);assert.ok(r.virtualCount>=3);});
test('未収録枠の検出',()=>{const r=inspect({...base,exportReport:{parts:{foal:{ancestors:Array.from({length:31},(_,i)=>({path:'P'+i,name:i===0?'':'既知',factors:['速']}))}}}});assert.equal(r.registeredSlots,30);assert.ok(r.problems.some(x=>x.includes('1枠')))});
test('出力なしは安全側',()=>{const r=inspect(base);assert.equal(r.hasExport,false);assert.equal(r.structuralReady,false);assert.equal(r.mayStartProduction,false)});
test('ゲーム確認や実生産を自動認証しない',()=>{const r=inspect({...base,exportReport:{parts:{foal:{ancestors:Array.from({length:31},(_,i)=>({path:'P'+i,name:'既知',factors:['速']}))}}}});assert.equal(r.verifiedInGame,false);assert.equal(r.mayStartProduction,false)});
test('旧モードは対象外',()=>assert.equal(inspect({plan:{autoDesign21:{mode:'hard'}}}),null));
console.log('v117 realism: '+cases+' tests PASS');
