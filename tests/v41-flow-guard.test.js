const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const guard=require('../research-flow-guard.js');
let count=0;function test(name,fn){fn();count++;console.log('PASS',name);}
const paths=[];for(let depth=1;depth<=5;depth++)for(let i=0;i<2**(depth-1);i++){
 let x='';for(let bit=depth-2;bit>=0;bit--)x+=i&(1<<bit)?'D':'S';paths.push(x+'S');
}

function sample(){const p={id:'PLAN-X',steps:Array.from({length:9},()=>({})),routeDraft:{slots:{g3:'S3',g4:'S4',g5:'S5'}},chain09:{xId:'X',mares:{},outputs:{},finalSex:'male'}};p.chain09.mares={1:'M1',2:'M2',3:'M3',4:'M4',5:'M5',6:'M6'};const h=[];for(const d of guard.definitions){const id='FOAL'+d.n;p.chain09.outputs[d.n]=id;h.push({id,planId:p.id,stepNo:d.n,sex:d.sex,fatherId:d.sireStep?p.chain09.outputs[d.sireStep]:d.sireSlot?p.routeDraft.slots[d.sireSlot]:p.chain09.xId,motherId:d.mareStep?p.chain09.outputs[d.mareStep]:p.chain09.mares[d.n],ancestry:paths.map((path,i)=>({path,horse:'A'+i}))});}return {p,h};}
test('complete DAG valid',()=>{const {p,h}=sample();assert.equal(guard.verify(p,h).ok,true);});
test('all nine steps checked',()=>{const {p,h}=sample();assert.equal(guard.verify(p,h).checked,9);});
test('missing last foal is invalid',()=>{const {p,h}=sample();h.pop();assert.equal(guard.verify(p,h).ok,false);});
test('broken sire dependency detected',()=>{const {p,h}=sample();h[1].fatherId='wrong';assert(guard.verify(p,h).failures.some(s=>s.includes('工程2：父母リンク')));});
test('broken mare dependency detected',()=>{const {p,h}=sample();h[7].motherId='wrong';assert.equal(guard.verify(p,h).ok,false);});
test('missing ancestor entry rejected',()=>{const {p,h}=sample();h[4].ancestry.pop();assert.equal(guard.verify(p,h).ok,false);});
test('duplicate position among 31 rows is rejected',()=>{const {p,h}=sample();h[0].ancestry[0].path=h[0].ancestry[1].path;assert.equal(guard.verify(p,h).ok,false);});
test('invalid position among 31 rows is rejected',()=>{const {p,h}=sample();h[0].ancestry[0].path='DDDDD';assert.equal(guard.verify(p,h).ok,false);});
test('wrong sex detected',()=>{const {p,h}=sample();h[5].sex='male';assert.equal(guard.verify(p,h).ok,false);});
test('plan ownership mismatch detected',()=>{const {p,h}=sample();h[2].planId='other';assert.equal(guard.verify(p,h).ok,false);});
test('duplicate output rejected',()=>{const {p,h}=sample();p.chain09.outputs[9]=p.chain09.outputs[8];assert.equal(guard.verify(p,h).ok,false);});
test('missing sire X detected',()=>{const {p,h}=sample();p.chain09.xId='';assert.equal(guard.verify(p,h).ok,false);});
test('non mutation',()=>{const {p,h}=sample();const a=JSON.stringify([p,h]);guard.verify(p,h);assert.equal(JSON.stringify([p,h]),a);});
test('atomic staging and rollback code integrated',()=>{const s=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');assert(s.includes('stagingAuto21=true'));assert(s.includes('stagingAuto21=false'));assert(s.includes('state.plans=oldPlans;state.homebreds=oldHomebreds'));assert(s.includes('flowGuard:window.DabimasFlowGuard41'));assert(s.includes('DabimasMildGate51?.inspect')); });
test('loader order and cache inclusion',()=>{const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');assert(html.indexOf('research-flow-guard.js?v=51')<html.indexOf('app.js?v=52'));assert(sw.includes('research-flow-guard.js'));});
console.log(count+' v4.1 tests passed');
