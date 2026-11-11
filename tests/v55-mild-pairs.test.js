'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const pairs=require('../research-mild-pairs-v55.js');
const old=require('../research-mild-polish-v53.js');
const reuse=require('../research-reuse-v50.js');
const root=path.join(__dirname,'..');
let passed=0;
function test(label,fn){fn();passed++;console.log('PASS',label);}
const choices={1:'P1',2:'P2',3:'P3',4:'P4',5:'P5',6:'P6'};
function candidate(c=choices,xId='X0',short=0,known=31,matched=3){return {matches:matched,choices:{...c},xId,full:{known,factorCounts:[['速',1]],rows:[]},extraFactorCounts:{短:short},extraEffective:short?[{name:'独立クロスA'}]:[],spL:0,stL:0,risk:0,unresolvedCount:0,conflictCount:0};}
const initial=candidate();
test('bad inputs reject before invoking user evaluator',()=>{
 let calls=0;const out=pairs.optimize({initial:{...initial,matches:2},mares:['A'],evaluate:()=>{calls++;},compare:old.compare});
 assert(out.error);assert.equal(calls,0);
});
test('two simultaneous mare changes escape one-step local optimum',()=>{
 let singleBest=initial;
 const evalTrial=(m,x)=>candidate(m,x,m[1]==='A'&&m[2]==='B'?8:0);
 assert.equal(old.compare(evalTrial({...choices,1:'A'},'X0'),singleBest,'speed'),0);
 assert.equal(old.compare(evalTrial({...choices,2:'B'},'X0'),singleBest,'speed'),0);
 const results=pairs.optimize({initial,mares:['A','B','C','D'],evaluate:evalTrial,compare:old.compare,goal:'speed',budget:420});
 assert(results.improved);assert.equal(results.winner.choices[1],'A');assert.equal(results.winner.choices[2],'B');
 assert.equal(results.winner.xId,'X0');assert(results.audit.marePairTrials>0);
});
test('X plus mare interaction is explored without changing production stages',()=>{
 const r=pairs.optimize({initial,mares:['A','B'],sires:['X1','X2'],evaluate:(m,x)=>candidate(m,x,m[3]==='A'&&x==='X1'?5:0),compare:old.compare,budget:420});
 assert(r.improved);assert.equal(r.winner.choices[3],'A');assert.equal(r.winner.xId,'X1');assert(r.audit.xMareTrials>0);
});
test('invalid candidates never become winners even at huge synthetic score',()=>{
 const r=pairs.optimize({initial,mares:['A','B'],sires:[],evaluate:(m,x)=>candidate(m,x,50,30,2),compare:old.compare,budget:50});
 assert(!r.improved);assert.deepEqual(r.winner.choices,choices);assert(r.audit.invalid>0);
});
test('duplicate mares, budget and read-only behavior are enforced',()=>{
 const initialJson=JSON.stringify(initial);let n=0;
 const r=pairs.optimize({initial,mares:['A','B','P1','P2','P3'],evaluate:(m,x)=>{n++;return candidate(m,x);},compare:old.compare,budget:15});
 assert.equal(r.audit.checked,n);assert(n<=15);assert(!r.improved);
 assert.equal(JSON.stringify(initial),initialJson);
 assert(r.audit.duplicatesSkipped>=0);
});
test('empty lists and budget 0 preserve current pedigree',()=>{
 for(const args of [{mares:[],sires:[]},{mares:['A'],budget:0}]){
  const r=pairs.optimize({initial,evaluate:()=>{throw Error('should not call');},compare:old.compare,...args});
  assert(!r.error);assert(!r.improved);assert.strictEqual(r.winner,initial);
 }
});
test('candidate sampling respects factor weights and includes existing mares',()=>{
 const pool=pairs.diversityShortlist([{id:'AA',factors:['速','走']},{id:'BB',factors:['長']},{id:'CC',factors:['底']}],initial,'speed',3);
 assert.equal(pool[0],'AA');for(const id of Object.values(choices))assert(pool.includes(id));
});
const allPaths=[];for(let d=1;d<=5;d++)for(let i=0;i<2**(d-1);i++){
 let route='';for(let j=d-2;j>=0;j--)route+=i&(1<<j)?'D':'S';allPaths.push(route+'S');
}
const rows=()=>allPaths.map(p=>({path:p,horse:'H'+p,factors:[],factorVariant:'',line:''}));
const req={step:1,sireId:'ROOT',mareId:'MARE',lineage:'H系',ped:{known:31,rows:rows(),conflicts:[]}};
const real=(father='ROOT')=>({id:'R1',mode:'real',sex:'male',fatherId:father,motherId:'MARE',lineage:'H系',ancestry:rows(),factors:[],factorsVerified:true});
test('unrelated REAL horse does not suspend mild optimization',()=>{
 assert.equal(pairs.rootReuseCount({records:[real('UNRELATED')],roots:[req],reuseApi:reuse}),0);
});
test('exact reusable root protects the same-stage plan, unknown factors do not',()=>{
 assert.equal(pairs.rootReuseCount({records:[real()],roots:[req],reuseApi:reuse}),1);
 const h=real();h.factorsVerified=false;
 assert.equal(pairs.rootReuseCount({records:[h],roots:[req],reuseApi:reuse}),0);
});
test('root stage with partial pedigree never counts as reuse',()=>{
 assert.equal(pairs.rootReuseCount({records:[real()],roots:[{...req,ped:{known:30,rows:rows(),conflicts:[]}}],reuseApi:reuse}),0);
});
test('hard mode search remains separate and persistence schema is not reset',()=>{
 const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert(src.includes('const mild55Api=window.DabimasMildPairs55'));
 assert(src.includes("const mild53ReusePriority=mode==='mild'&&mild55ReusableRoots>0"));
 assert(src.includes('const paired=await mild55Api.optimizeAsync'));
 assert(src.includes("if(mode==='hard'){"));
 assert(!src.includes('localStorage.removeItem('));
});
test('scripts and offline cache include the v5.5 module',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert(html.includes('research-mild-pairs-v55.js?v=62'));
 assert(html.indexOf('research-mild-pairs-v55.js?v=62')<html.indexOf('app.js?v=69'));
 assert(sw.includes("'./research-mild-pairs-v55.js'"));assert(sw.includes('dbms-v69-1'));
});
console.log(`${passed} v5.5 mild two-slot tests passed`);
