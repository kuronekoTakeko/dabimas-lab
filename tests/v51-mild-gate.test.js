'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const gate=require('../research-mild-gate-v51.js');
const flow=require('../research-flow-guard.js');
const theory=require('../research-validation.js');
let passed=0;function test(name,fn){fn();console.log('PASS '+name);passed++;}
const paths=[];for(let depth=1;depth<=5;depth++)for(let i=0;i<2**(depth-1);i++){
 let route='';for(let bit=depth-2;bit>=0;bit--)route+=i&(1<<bit)?'D':'S';paths.push(route+'S');
}
function scenario(){
 const names=['ディープインパクト-翔燕-','ディープインパクト-央獅-','ディープインパクト-煌魂-'];
 const variants=['翔燕','央獅','煌魂'];const factorSets=[['走','長','速'],['中','速','短'],['長','底','底']];
 const members=names.map((id,i)=>({id,name:'ディープインパクト',variant:variants[i],factors:factorSets[i]}));
 const slots={g3:names[0],g4:names[1],g5:names[2]};
 const rows=paths.map(p=>({path:p,name:'祖先_'+p,factors:['速'],factorVariant:'',line:'L'}));
 [['SSS',0],['DSSS',1],['DDDSS',2]].forEach(([p,i])=>{
  const r=rows.find(x=>x.path===p);r.name='ディープインパクト';r.factorVariant=variants[i];r.factors=[...factorSets[i]];
 });
 const pedigree={rows,known:31,conflicts:[],transmission:{conflicts:[],invalid:[],duplicates:[],unresolved:[]}};
 const outputs={},mares={1:'M1',2:'M2',3:'M3',4:'M4',5:'M5',6:'M6'};
 const plan={id:'PLAN',steps:Array.from({length:9},()=>({})),source:{members},routeDraft:{slots},chain09:{outputs,mares,xId:'X',finalSex:'male'}};
 const records=[];
 for(const def of flow.definitions){const id='F'+def.n;outputs[def.n]=id;
  records.push({id,planId:plan.id,stepNo:def.n,sex:def.sex,fatherId:def.sireStep?outputs[def.sireStep]:def.sireSlot?slots[def.sireSlot]:'X',motherId:def.mareStep?outputs[def.mareStep]:mares[def.n],ancestry:paths.map(p=>({path:p,horse:'馬_'+p}))});
 }
 return {plan,pedigree,records,dependencies:{flowGuard:flow,validation:theory}};
}
const inspect=x=>gate.inspect(x.plan,x.pedigree,x.records,x.dependencies);
test('complete mild nine-step pedigree passes as unverified premise',()=>{const x=scenario(),v=inspect(x);assert.equal(v.ok,true);assert.equal(v.gameVerified,false);assert.equal(v.checkedStages,9);assert.equal(v.checkedPositions,31);});
test('no mutation on analysis',()=>{const x=scenario(),before=JSON.stringify(x);inspect(x);assert.equal(JSON.stringify(x),before);});
test('missing game/graph theory checker always blocks saving',()=>{const x=scenario();x.dependencies.validation=null;assert.equal(inspect(x).ok,false);});
test('missing flow checker always blocks saving',()=>{const x=scenario();x.dependencies.flowGuard=null;assert.equal(inspect(x).ok,false);});
test('31 ancestor count is required',()=>{const x=scenario();x.pedigree.known=30;assert.equal(inspect(x).ok,false);});
test('duplicate ancestor path in one foal blocks saving',()=>{const x=scenario();x.records[0].ancestry[0].path=x.records[0].ancestry[1].path;assert.equal(inspect(x).ok,false);});
test('invalid ancestor path blocks saving',()=>{const x=scenario();x.records[7].ancestry[3].path='XXXXX';assert.equal(inspect(x).ok,false);});
test('broken parent link blocks saving',()=>{const x=scenario();x.records[7].motherId='WRONG';assert.equal(inspect(x).ok,false);});
test('wrong foal sex blocks saving',()=>{const x=scenario();x.records[6].sex='male';assert.equal(inspect(x).ok,false);});
test('same center stallion on all three generations is mandatory',()=>{const x=scenario();x.pedigree.rows.find(r=>r.path==='DSSS').name='別名';assert.equal(inspect(x).ok,false);});
test('six documented factor kinds required, not just nine entries',()=>{const x=scenario();const r=x.pedigree.rows.find(r=>r.path==='DDDSS');r.factors=['走','速','短'];x.plan.source.members[2].factors=[...r.factors];assert.equal(inspect(x).ok,false);});
test('same factor list but wrong registered variant is rejected',()=>{const x=scenario();x.pedigree.rows.find(r=>r.path==='DDDSS').factorVariant='違う異因名';assert.equal(inspect(x).ok,false);});
test('same base and factor kinds but altered factor multiplicity is rejected',()=>{const x=scenario();x.pedigree.rows.find(r=>r.path==='DDDSS').factors=['長','長','底'];assert.equal(inspect(x).ok,false);});
test('duplicate owned IDs are not three distinct anchors',()=>{const x=scenario();x.plan.routeDraft.slots.g4=x.plan.routeDraft.slots.g3;assert.equal(inspect(x).ok,false);});
test('final parent transmission conflict blocks saving',()=>{const x=scenario();x.pedigree.transmission.conflicts=[{path:'S',field:'name'}];assert.equal(inspect(x).ok,false);});
test('known inherited position missing blocks saving',()=>{const x=scenario();x.pedigree.transmission.unresolved=[{path:'S'}];assert.equal(inspect(x).ok,false);});
test('same variant with contradictory recorded factors blocks saving',()=>{const x=scenario();const r=x.pedigree.rows.find(r=>r.path==='DS');r.name='ディープインパクト';r.factorVariant='央獅';r.factors=['底','底'];assert.equal(inspect(x).ok,false);});
test('mild branch gate executes before first save and hard branch remains untouched',()=>{const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');const mild=app.indexOf('}else{\n   // Build all nine offspring in memory first.');const gateIndex=app.indexOf('DabimasMildGate51?.inspect(',mild);const saveIndex=app.indexOf('if(!persist()){',mild);assert(mild>0&&gateIndex>mild&&saveIndex>gateIndex);assert(app.includes("mode==='hard'"));});
test('v5.1 loader and service worker isolate new gate to changed assets',()=>{const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');assert(html.indexOf('research-mild-gate-v51.js?v=51')<html.indexOf('app.js?v=51'));assert(sw.includes('research-mild-gate-v51.js'));assert(sw.includes('dbms-v51-1'));});
console.log(`${passed} v5.1 mild gating tests passed`);
