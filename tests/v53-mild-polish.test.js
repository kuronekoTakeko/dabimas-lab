'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const api=require('../research-mild-polish-v53.js');
const root=path.resolve(__dirname,'..');
let n=0;
function test(label,cb){cb();n++;console.log('PASS',label);}
const baseChoice={1:'P1',2:'P2',3:'Q1',4:'Q2',5:'R1',6:'R2'};
function candidate({choices=baseChoice,xId='ノウンファクト縮地',speed=0,stamina=0,lines=0}={}){
 return {matches:3,full:{known:31,factorCounts:[['短',5],['速',5],['長',5]]},choices:{...choices},xId,
    extraFactorCounts:{短:speed,長:stamina},extraEffective:speed||stamina?[{name:'バックパサー'}]:[],
    spL:lines,stL:lines,risk:0,unresolvedCount:0,conflictCount:0};
}
const before=candidate();
test('module can compute score but is never game ability predictor',()=>{
 const m=api.metric(before,'balance');assert(Number.isFinite(m.score));assert.equal(m.namedCrosses,0);
 assert.equal(api.metric({...before,matches:2},'balance'),null);
});
test('same nine steps can switch an owned X to an evidence-backed cross',()=>{
 const done=api.optimize({initial:before,mares:[],sires:['ノウンファクト縮地','バックパサー瞬天'],goal:'speed',
  evaluate:(m,x)=>candidate({choices:m,xId:x,speed:x==='バックパサー瞬天'?3:0}),budget:40});
 assert(done.improved);assert.equal(done.winner.xId,'バックパサー瞬天');assert.equal(done.audit.chosenX,'バックパサー瞬天');
 assert.equal(done.winner.choices[6],'R2');
});
test('excluded non-owned X is not probed or chosen',()=>{
 let tried=[];
 const done=api.optimize({initial:before,mares:[],sires:['ノウンファクト縮地'],
  evaluate:(m,x)=>{tried.push(x);return candidate({choices:m,xId:x,speed:9})}});
 assert.equal(done.winner.xId,'ノウンファクト縮地');assert.deepEqual(tried,[]);
});
test('public meihin beyond initial 36 can be selected as same-step substitute',()=>{
 const mares=Array.from({length:60},(_,i)=>'M'+i);
 const done=api.optimize({initial:before,mares,sires:[],goal:'balance',budget:500,
  evaluate:(m,x)=>candidate({choices:m,xId:x,stamina:m[2]==='M59'?5:0})});
 assert.equal(done.winner.choices[2],'M59');assert.equal(done.winner.choices[1],'P1');
 assert.equal(done.winner.choices[6],'R2');
});
test('duplicate mare use is not introduced',()=>{
 const done=api.optimize({initial:before,mares:['P1','M1'],sires:[],budget:50,
  evaluate:(m,x)=>candidate({choices:m,xId:x,stamina:m[2]==='P1'?50:0})});
 assert.notEqual(done.winner.choices[2],'P1');
});
test('invalid pedigrees and broken Shiko patterns cannot win',()=>{
 const done=api.optimize({initial:before,mares:['BAD'],sires:['BADX'],budget:50,
  evaluate:(m,x)=>({...candidate({choices:m,xId:x,speed:50}),matches:2})});
 assert(!done.improved);assert(done.audit.invalid>=1);
});
test('cap prevents unbounded candidate evaluations',()=>{
 let tried=0;
 const done=api.optimize({initial:before,mares:Array.from({length:100},(_,i)=>'M'+i),sires:[],budget:8,
  evaluate:(m,x)=>{tried++;return candidate({choices:m,xId:x})}});
 assert.equal(tried,8);assert.equal(done.audit.searched,8);assert(done.audit.limited);
});
test('goal weights can prefer different cross factors',()=>{
 const speedy=candidate({speed:3}),steady=candidate({stamina:3});
 assert(api.compare(speedy,steady,'speed')<0);
 assert(api.compare(steady,speedy,'stamina')<0);
});
test('unchanged scores preserve original horse choice',()=>{
 const result=api.optimize({initial:before,mares:['M1'],sires:['X2'],
  evaluate:(m,x)=>candidate({choices:m,xId:x})});
 assert(!result.improved);assert.deepEqual(result.winner.choices,before.choices);assert.equal(result.winner.xId,before.xId);
});
test('source is unchanged; application only wires mild path',()=>{
 const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert(src.includes("const api=window.DabimasMildPolish53"));
 assert(src.includes('const polished=await api.optimizeAsync')); 
 assert(src.includes('if(mild53)draft.mild53=mild53'));
 assert(src.includes("if(mode==='hard'){"));
 assert.equal(src.includes('localStorage.removeItem('),false);
});
test('v5.3 SW and html both load and cache module',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert(html.includes('research-mild-polish-v53.js?v=61'));
 assert(html.indexOf('research-mild-polish-v53.js?v=61')<html.indexOf('app.js?v=69'));
 assert(sw.includes('dbms-v69-1'));
 assert(sw.includes("'./research-mild-polish-v53.js'"));
});
console.log(`${n} v5.3 mild-polish tests passed`);
