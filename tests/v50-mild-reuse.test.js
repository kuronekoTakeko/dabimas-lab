'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const reuse=require('../research-reuse-v50.js');
const guard=require('../research-flow-guard.js');
const root=path.join(__dirname,'..');
let passed=0;function test(name,fn){fn();passed++;console.log('PASS '+name);}
const paths=[];for(let n=1;n<=5;n++)for(let i=0;i<2**(n-1);i++){
 let s='';for(let j=n-2;j>=0;j--)s+=(i&(1<<j))?'D':'S';paths.push(s+'S');}
const rows=()=>paths.map(p=>({path:p,horse:'Ancestor '+p,factors:['速','長'],line:'ヘイルトゥリーズン系',factorVariant:'覇煌'}));
const request=(step=6,sex='female')=>({step,sex,sireId:'A',mareId:'B',lineage:'ヘイルトゥリーズン系',rows:rows()});
const real=(step=6,sex='female')=>({id:'REAL',mode:'real',sex,fatherId:'A',motherId:'B',lineage:'ヘイルトゥリーズン系',ancestry:rows(),factors:[],factorsVerified:false,planId:'OLD'});
test('exact 31 male-ancestor slots and factor lists match',()=>{const r=request(),h=real();assert.equal(reuse.signature(h.ancestry),reuse.signature(r.rows));assert.equal(reuse.canReuse(h,r),true);});
test('factor order does not change pedigree',()=>{const a=rows(),b=rows();b[0].factors.reverse();assert.equal(reuse.signature(a),reuse.signature(b));});
test('31/31 path identity is mandatory',()=>{const r=rows();r[10].path=r[11].path;assert.equal(reuse.signature(r),null);assert.equal(reuse.signature(rows().slice(0,30)),null);});
test('wrong parent, female vs male, or draft cannot be reused',()=>{const r=request();for(const f of [h=>h.fatherId='OTHER',h=>h.motherId='OTHER',h=>h.sex='male',h=>h.mode='draft']){const h=real();f(h);assert.equal(reuse.canReuse(h,r),false);}});
test('different variant, factor, line or name cannot pass',()=>{const r=request();for(const f of [h=>h.ancestry[5].factorVariant='別因名',h=>h.ancestry[2].factors=['速'],h=>h.ancestry[8].line='別系統',h=>h.ancestry[0].horse='別馬']){const h=real();f(h);assert.equal(reuse.canReuse(h,r),false);}});
test('a real horse with changed own lineage is not equivalent',()=>{const h=real();h.lineage='別系統';assert.equal(reuse.canReuse(h,request()),false);});
test('unknown own factors forbid earlier male replacement',()=>{const h=real(2,'male');assert.equal(reuse.canReuse(h,request(2,'male')),false);});
test('verified zero own factors permit earlier male replacement',()=>{const h=real(2,'male');h.factorsVerified=true;assert.equal(reuse.canReuse(h,request(2,'male')),true);});
test('verified nonzero own factor is NOT treated as equivalent',()=>{const h=real(2,'male');h.factorsVerified=true;h.factors=['速'];assert.equal(reuse.canReuse(h,request(2,'male')),false);});
test('final foal may have observed personal factors',()=>{const h=real(9,'male');h.factors=['速','短'];h.factorsVerified=true;assert.equal(reuse.canReuse(h,request(9,'male')),true);});
test('pick excludes already used horse and never modifies records',()=>{const h=real(),orig=JSON.stringify(h);assert.equal(reuse.pick([h],request(),['REAL']),null);assert.equal(reuse.pick([h],request()).id,'REAL');assert.equal(JSON.stringify(h),orig);});
test('stale source record or bad snapshot is rejected',()=>{const h=real(),mark=reuse.pick([h],request());assert.equal(reuse.verifyLink(h,mark,request()),true);h.ancestry[0].horse='BAD';assert.equal(reuse.verifyLink(h,mark,request()),false);});
test('changed parents invalidate a previously linked real horse',()=>{const h=real(),mark=reuse.pick([h],request());const req={...request(),sireId:'CHANGED'};assert.equal(reuse.verifyLink(h,mark,req),false);});
test('source becoming a draft or missing factor evidence invalidates link',()=>{const h=real(2,'male');h.factorsVerified=true;const mark=reuse.pick([h],request(2,'male'));assert(mark);h.factorsVerified=false;assert.equal(reuse.verifyLink(h,mark,request(2,'male')),false);});
const definitions=guard.definitions;
function graph(){const outputs={},all=[],mares={};const slots={g3:'SIRE3',g4:'SIRE4',g5:'SIRE5'};let planId='NEW';for(const def of definitions){const id='F'+def.n;outputs[def.n]=id;mares[def.n]='MARE'+def.n;
 const fatherId=def.sireStep?'F'+def.sireStep:def.sireSlot?slots[def.sireSlot]:'X';const motherId=def.mareStep?'F'+def.mareStep:mares[def.n];
 all.push({id,mode:'draft',sex:def.sex,planId,stepNo:def.n,fatherId,motherId,lineage:'L',ancestry:rows(),factors:[]});}
 return {plan:{id:planId,steps:Array.from({length:9},()=>({})),routeDraft:{slots},chain09:{outputs,mares,xId:'X'}},all};}
test('nine-step flow guard accepts unchanged old draft graph',()=>{const {plan,all}=graph();assert.equal(guard.verify(plan,all).ok,true);});
test('flow guard accepts one exact existing real horse with reuse marker',()=>{const {plan,all}=graph(),source=all[5];source.mode='real';source.planId='OTHER';source.stepNo=0;source.factors=[];source.lineage='L';const req={step:6,sex:'female',sireId:source.fatherId,mareId:source.motherId,lineage:'L',rows:source.ancestry};const mark=reuse.pick([source],req);assert(mark);plan.chain09.reused50={6:mark};assert.equal(guard.verify(plan,all,reuse).ok,true);});
test('flow guard rejects real horse without metadata or changed proof',()=>{const {plan,all}=graph(),source=all[5];source.mode='real';source.planId='OTHER';source.stepNo=0;const req={step:6,sex:'female',sireId:source.fatherId,mareId:source.motherId,lineage:'L',rows:source.ancestry};const mark=reuse.pick([source],req);assert(mark);assert.equal(guard.verify(plan,all,reuse).ok,false);plan.chain09.reused50={6:mark};assert.equal(guard.verify(plan,all).ok,false);source.ancestry[0].factors=['底'];assert.equal(guard.verify(plan,all,reuse).ok,false);});
test('flow guard catches reused horse assigned to a second stage',()=>{const {plan,all}=graph();plan.chain09.outputs[7]=plan.chain09.outputs[6];assert.equal(guard.verify(plan,all).ok,false);});
test('manual re-generation removes stale reuse marker (source inspection)',()=>{const app=fs.readFileSync(path.join(root,'app.js'),'utf8');assert(app.includes('if(ch.reused50)delete ch.reused50[n]'));assert(app.includes('if(oldReuse)ch.reused50[n]=oldReuse'));});
test('one logical reused stage skips one birth, no mutation',()=>{const app=fs.readFileSync(path.join(root,'app.js'),'utf8');const start=app.indexOf('function mild50ReuseStep('),end=app.indexOf('function setupChainPlanner09(',start);assert(start>0&&end>start);
 const candidate=real(6,'female');const plan={id:'PLAN',chain09:{outputs:{}}};const old=JSON.stringify(candidate);
 const environment={window:{DabimasReuse50:reuse},state:{homebreds:[candidate]},chain09Data:p=>p.chain09,chain09Parents:()=>({ready:true,sireId:'A',mareId:'B',sire:{lineage:'ヘイルトゥリーズン系'},ped:{rows:rows()}}),chain09ExpectedSex:()=> 'female',chain09Output:p=>({horse:candidate})};
 vm.createContext(environment);vm.runInContext(app.slice(start,end),environment);
 const result=vm.runInContext('mild50ReuseStep',environment)(plan,6);
 assert.equal(result.reused,true);assert.equal(plan.chain09.outputs[6],'REAL');assert.equal(plan.chain09.reused50[6].step,6);assert.equal(JSON.stringify(candidate),old);
});
test('mild reuse search falls back cleanly when no actual horse matches',()=>{const app=fs.readFileSync(path.join(root,'app.js'),'utf8');const start=app.indexOf('function mild50ReuseStep('),end=app.indexOf('function setupChainPlanner09(',start);
 const plan={id:'PLAN',chain09:{outputs:{}}};const context={window:{DabimasReuse50:reuse},state:{homebreds:[]},chain09Data:p=>p.chain09,chain09Parents:()=>({ready:true,sireId:'A',mareId:'B',sire:{lineage:'ヘイルトゥリーズン系'},ped:{rows:rows()}}),chain09ExpectedSex:()=> 'female',chain09Output:()=>({horse:null})};vm.createContext(context);vm.runInContext(app.slice(start,end),context);
 assert.equal(vm.runInContext('mild50ReuseStep',context)(plan,6).reused,false);assert.equal(Object.keys(plan.chain09.outputs).length,0);
});
test('new assets load in correct order; v4.9 master and JSON not bundled into diff',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');assert(html.indexOf('research-reuse-v50.js?v=50')<html.indexOf('app.js?v=610'));assert(sw.includes('research-reuse-v50.js'));assert(sw.includes('dbms-v610-1'));});
console.log(`${passed} v5.0 mild reuse tests passed`);
