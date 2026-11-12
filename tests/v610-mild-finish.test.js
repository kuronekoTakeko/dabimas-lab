'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('../research-mild-finish-v610.js');
const root=path.join(__dirname,'..'),get=n=>fs.readFileSync(path.join(root,n),'utf8');
let checks=0;function test(name,fn){fn();checks++;console.log('PASS',name);}
function trial({theory=8,births=1,score=0,risk=0,factors=['速'],extra=1,unresolved=0,choices={1:'基礎',3:'初期3',4:'初期4',5:'初期5',6:'初期6',7:'初期7'}}={}){
 const rows=Array.from({length:16},(_,i)=>({path:'SS'+('D'.repeat(i%2))+('S'.repeat(i%3+1)),name:'祖先'+i,line:i%2?'ハビタット系':'テディ系',factors:i%3===0?factors:[]}));
 return {matches:3,choices,additionalBirths:births,full:{known:31,rows,conflicts:[],transmission:{conflicts:[],invalid:[]}},
  theory66:{superPerfect:theory===8?'成立':theory===7?'不成立':'未確認',perfect:theory>=7?'成立':'未確認'},
  extraEffective:Array.from({length:extra},(_,i)=>({name:'独立交差'+i,conflicts:[]})),extraFactorCounts:{'速':score,'長':score},risk,unresolvedCount:unresolved,conflictCount:0};
}
function mare(id,n=0,line='ハビタット系'){return {id,lineage:line,ancestry:Array.from({length:15},(_,i)=>({horse:id+'祖先'+i,line,factors:i%2===0?Array(n).fill('速'):[]}))};}
test('super-perfect evidence outranks direct perfect even with a single prep birth',()=>{
 const superPrep=trial({theory:8,births:1,score:1}),directPerfect=trial({theory:7,births:0,score:100});
 assert(api.compare(superPrep,directPerfect,'speed')<0);
});
test('same theory: fewer real births outrank a higher research score',()=>{
 const one=trial({theory:8,births:1,score:1}),two=trial({theory:8,births:2,score:100});
 assert(api.compare(one,two,'speed')<0);
});
test('factual independent factor evidence improves the research ordering',()=>{
 const a=trial({score:2}),b=trial({score:8});assert(api.compare(b,a,'speed')<0);
});
test('a short cross risk never beats a risk-free identical known-factor candidate',()=>{
 const a=trial({risk:0}),b=trial({risk:2});assert(api.compare(a,b,'speed')<0);
});
test('unverified theory, broken pedigree or transmitted ancestor are not usable',()=>{
 assert.equal(api.metric(trial({theory:0})),null);
 const broken=trial();broken.full.known=30;assert.equal(api.metric(broken),null);
 const conflicting=trial();conflicting.full.transmission.invalid.push('bad');assert.equal(api.metric(conflicting),null);
});
test('undocumented cross factors are not fabricated as confirmed effects',()=>{
 const a=trial({extra:0,score:0,unresolved:8});const m=api.metric(a,'stamina');assert.equal(m.independentCrossEvidence,0);assert.equal(m.crossFactorEvidence,0);
 assert.equal(m.gameVerified,false);assert.equal(m.source.includes('相対評価'),true);
 const known=trial({extra:1,score:1});known.extraEffective[0].counted=[{variant:'記録済'}];known.extraEffective[0].counts={'速':1};
 assert.equal(api.metric(known).independentCrossEvidence,1);
});
test('diverse family shortlisting is deterministic and bounded',()=>{
 const pool=[mare('a',2,'ハビタット系'),mare('b',3,'ハビタット系'),mare('c',1,'テディ系'),mare('d',1,'ヒムヤー系')];
 const list=api.shortlist(pool,'speed',3);
 assert.equal(list.length,3);assert(new Set(list.map(m=>m.lineage)).size>=2);assert.deepEqual(api.shortlist(pool,'speed',3),list);
});
test('only supporting mare steps change, preserving Deep and closing mare, with no extra births',()=>{
 const base=trial({score:0}),orig=JSON.stringify(base),mares=[mare('良血A',4),mare('良血B',3,'テディ系')];
 const result=api.optimize({initial:base,mares,goal:'speed',maxTests:10,
   evaluate:choices=>trial({score:choices[3]==='良血A'?5:0,choices,births:1})});
 assert.equal(result.winner.choices[1],'基礎');assert.equal(result.winner.additionalBirths,1);
 assert.equal(result.audit.improved,true);assert.equal(result.audit.changedSteps.includes(3),true);
 assert.equal(JSON.stringify(base),orig,'do not mutate existing saved plan/trial');
});
test('invalid proposed mating is ignored; no provisional or partial plan is saved',()=>{
 const base=trial(),result=api.optimize({initial:base,mares:[mare('A',2)],goal:'speed',maxTests:7,evaluate:()=>null});
 assert.equal(result.winner,base);assert.equal(result.audit.improved,false);assert(result.audit.invalid>0);
});
test('full-source integration and PWA cache include the independent finishing module',()=>{
 const html=get('index.html'),sw=get('sw.js'),app=get('app.js');
 assert(html.indexOf('research-mild-finish-v610.js?v=610')<html.indexOf('app.js?v=610'));
 assert(sw.includes('dbms-v610-1')&&sw.includes("'./research-mild-finish-v610.js'"));
 assert(app.includes('finish610.optimize({initial:starting'));
 assert(app.includes('api.validateFinal(replacement.full'));
 assert(app.includes('theory.inspect(replacement.closingPed)'));
 assert(app.includes('if(isMaternalDDS67(draft)&&base.finish610)draft.mild610='));
 assert(app.includes("const SAVE_KEY='dabimas_lab_v02_state'"));
});
console.log(`v6.10 ${checks} feature checks PASS`);
