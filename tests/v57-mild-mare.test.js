'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('../research-mild-mare-v57.js');
const root=path.resolve(__dirname,'..');let count=0;
function check(name,fn){fn();count++;console.log('PASS',name)}
const status=(perfect,superPerfect)=>({perfect,superPerfect,miracle:'成立',evidenceCount:5,missing:[]});
const theory={inspect:ped=>ped.verdict};
const test=(id,verdict,{matches=3,known=31,conflicts=[]}={})=>({id,choices:{1:'a',2:'b',3:'c',4:'d',5:'e',6:'f'},xId:'X',matches,full:{known:31},closingPed:{known,conflicts,verdict}});
const unk=test('unknown',status('未確認','未確認'));
const perfect=test('perfect',status('成立','不成立'));
const superp=test('super',status('成立','成立'));
const negative=test('no',status('不成立','不成立'));
check('super perfect > perfect > unknown > absent; miracle never scores',()=>{
 assert.equal(api.rank(superp.closingPed.verdict),3);assert.equal(api.rank(perfect.closingPed.verdict),2);
 assert.equal(api.rank(unk.closingPed.verdict),1);assert.equal(api.rank(negative.closingPed.verdict),0);
 assert(api.compare(superp,perfect,'balance',{theory})<0);
 assert(api.compare(perfect,unk,'balance',{theory})<0);
 assert(api.compare(unk,negative,'balance',{theory})<0);
});
check('theory incomplete does not become confirmed',()=>assert.equal(api.assess(unk,theory).superPerfect,'未確認'));
check('no promotion with incomplete stage 8 or stage 9',()=>{
 assert.equal(api.assess(test('bad',status('成立','成立'),{known:30}),theory),null);
 assert.equal(api.assess(test('bad2',status('成立','成立'),{matches:2}),theory),null);
 assert.equal(api.assess(test('bad3',status('成立','成立'),{conflicts:['x']}),theory),null);
});
check('same class retains research comparison and skips missing scores',()=>{
 const p=test('a',status('成立','不成立')),q=test('b',status('成立','不成立'));
 assert.equal(api.compare(p,q,'balance',{theory,compareResearch:(a,b)=>a.id==='a'?-1:1}),-1);
});
check('one-place swap can improve from unknown to verified super without stages',()=>{
 const init=unk;const mares=[{id:'a'},{id:'b'},{id:'c'},{id:'d'},{id:'e'},{id:'f'},{id:'g'}];
 const evalOne=(choices,x)=>choices[1]==='g'?{...superp,choices:{...choices},xId:x}:{...unk,choices:{...choices},xId:x};
 const result=api.optimize({initial:init,mares,sires:[{id:'X'}],evaluate:evalOne,theory,budget:100});
 assert.equal(result.winner.choices[1],'g');assert.equal(result.audit.end.superPerfect,'成立');
 assert.equal(result.audit.miracleIncluded,false);assert.equal(result.audit.stepsAdded,0);
});
check('invalid candidates are rejected, unchanged when no proven improvement',()=>{
 const init=perfect;
 const r=api.optimize({initial:init,mares:[{id:'g'}],sires:[],evaluate:()=>({matches:3,full:{known:30}}),theory,budget:20});
 assert.equal(r.winner,init);assert(r.audit.invalid>=1);
});
check('zero budget preserves original and inventory is never written',()=>{
 const before=JSON.stringify(unk);const r=api.optimize({initial:unk,mares:[{id:'g'}],evaluate:()=>{throw Error('should not run')},theory,budget:0});
 assert.equal(r.audit.tested,0);assert.equal(JSON.stringify(unk),before);
});
check('browser wiring includes stage8 pedigree, new module before app, PWA cache, no hard-mode changes',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert(app.includes('closingPed:selected[chain09ClosureStep(p)-1]'));assert(app.includes("if(mode==='mild'&&!isMaternal66(draft)&&!mild53ReusePriority&&window.DabimasMildMare57"));
 assert(html.indexOf('research-mild-mare-v57.js?v=62')<html.indexOf('app.js?v=610'));
 assert(sw.includes("'./research-mild-mare-v57.js'"));assert(sw.includes('dbms-v610-1'));
 assert(app.includes('if(mode===\'hard\'){'));assert(app.includes('const SAVE_KEY=\'dabimas_lab_v02_state\''));
});
console.log(`${count} v5.7 tests passed`);
