'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const api=require('../research-mild-lineage-v52.js');
let n=0;function test(title,fn){fn();console.log('PASS',title);n++;}
const rows=(prefix='祖先')=>api.PATHS.map((p,i)=>({path:p,horse:prefix+p,factors:['速','速'],factorVariant:'覇煌',line:'ハイペリオン系'}));
function setup(){const chain09={outputs:{}};const records=[];const pairs={};for(let i=1;i<=9;i++){
 const id='F'+i,anc=rows('G'+i);chain09.outputs[i]=id;
 records.push({id,ancestry:anc.map(r=>({...r,factors:r.factors.slice()}))});
 pairs[i]={ready:true,ped:{rows:anc,conflicts:[],transmission:{conflicts:[],invalid:[],duplicates:[],unresolved:[]}}};
 }return {plan:{chain09},records,pairs,resolve:i=>pairs[i]};}
test('exactly 31 canonical paths including one S at each position',()=>{assert.equal(api.PATHS.length,31);assert.equal(new Set(api.PATHS).size,31);assert(api.PATHS.includes('DDDSS'));});
test('matching parents across nine stages verified, no game claim',()=>{const x=setup(),res=api.inspect(x.plan,x.records,x.resolve);assert.equal(res.ok,true);assert.equal(res.checked,9);assert.equal(res.gameVerified,false);});
test('independent analysis is read-only',()=>{const x=setup(),before=JSON.stringify([x.plan,x.records,x.pairs]);api.inspect(x.plan,x.records,x.resolve);assert.equal(JSON.stringify([x.plan,x.records,x.pairs]),before);});
test('incorrect inherited ancestor name is rejected at stage 4',()=>{const x=setup();x.records[3].ancestry[4].horse='別馬';assert.match(api.inspect(x.plan,x.records,x.resolve).errors.join(','),/工程4/);});
test('incorrect inherited factor multiplicity is rejected',()=>{const x=setup();x.records[0].ancestry[3].factors=['速','長'];assert.match(api.inspect(x.plan,x.records,x.resolve).errors.join(','),/祖先因子/);});
test('known factor disappearing is rejected; unknown is not zero',()=>{const x=setup();x.records[1].ancestry[0].factors=[];assert.equal(api.inspect(x.plan,x.records,x.resolve).ok,false);});
test('unknown parent factors do not invent or reject observed factors',()=>{const a=rows(),b=rows();a[1].factors=[];assert.equal(api.compare(b,a).ok,true);});
test('different variant detected',()=>{const x=setup();x.records[1].ancestry[2].factorVariant='違う';assert.equal(api.inspect(x.plan,x.records,x.resolve).ok,false);});
test('different subline detected',()=>{const x=setup();x.records[8].ancestry[1].line='クラリオン系';assert.equal(api.inspect(x.plan,x.records,x.resolve).ok,false);});
test('missing step blocks success',()=>{const x=setup();x.records.pop();assert.equal(api.inspect(x.plan,x.records,x.resolve).ok,false);});
test('unknown stage resolver blocks success',()=>{const x=setup();assert.equal(api.inspect(x.plan,x.records,null).ok,false);});
test('unready sire/mare blocks success',()=>{const x=setup();x.pairs[5].ready=false;assert.equal(api.inspect(x.plan,x.records,x.resolve).ok,false);});
test('parents transmission disagreements block',()=>{const x=setup();x.pairs[2].ped.transmission.conflicts=[{path:'SS'}];assert.equal(api.inspect(x.plan,x.records,x.resolve).ok,false);});
test('duplicated path blocks',()=>{const x=setup();x.records[6].ancestry[3].path=x.records[6].ancestry[4].path;assert.equal(api.inspect(x.plan,x.records,x.resolve).ok,false);});
test('source includes read-only nine-stage lineage audit before save',()=>{
 const s=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),m=s.indexOf('const inspection=window.DabimasMildGate51?.inspect('),l=s.indexOf('lineage:window.DabimasMildLineage52',m),persist=s.indexOf("if(mode==='mild'&&!persist()){",m);
 assert(m>0&&l>m&&persist>l);assert(s.includes('mildRollback={plans:oldPlans,homebreds:oldHomebreds}'));
});
test('saved plan version and ownership-compatible storage unchanged',()=>{
 const s=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
 assert(s.includes('draft.mildAcceptance51={version:52'));
 assert(s.includes('function productionDataBackup(){return {version:13,owned:state.owned'));
});
test('browser loads module before app and cache is isolated',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
 assert(html.indexOf('research-mild-lineage-v52.js?v=52')<html.indexOf('app.js?v=55'));assert(sw.includes('research-mild-lineage-v52.js'));assert(sw.includes('dbms-v55-1'));
});
console.log(n+' v5.2 tests passed');
