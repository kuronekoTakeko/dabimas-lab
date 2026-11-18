const assert=require('node:assert/strict');
const {inspect}=require('../research-mild-flow-review-v116.js');
const plan={autoDesign21:{mode:'mild'}};
const stages=[{id:'P:sire',kind:'prep',label:'準備1',sireId:'owned',mareId:'meihin',outputId:'A',outputMode:'virtual'},
 ...Array.from({length:9},(_,i)=>({id:'C:'+(i+1),kind:'core',number:i+1,label:'工程'+(i+1),sireId:i===0?'A':'owned',mareId:'meihin',outputId:'H'+(i+1),outputMode:i===0?'real':'virtual'}))];
const params={plan,stages,readiness:{ok:true},stageAudit:{ok:true}};
let r=inspect(params);assert.equal(r.ok,true);assert.equal(r.coreCount,9);assert.equal(r.prepCount,1);assert.equal(r.realCount,1);assert.equal(r.virtualCount,9);assert.equal(r.unlinkedCount,0);assert.equal(r.productionAuthorized,false);
r=inspect({...params,stages:stages.map((x,i)=>i===1?{...x,sireId:'H9'}:x)});assert.equal(r.ok,false);assert.match(r.errors.join(' '),/後工程/);
r=inspect({...params,stages:stages.map((x,i)=>i===2?{...x,outputId:'H1'}:x)});assert.equal(r.ok,false);assert.match(r.errors.join(' '),/同じ産駒ID/);
r=inspect({...params,stages:stages.map((x,i)=>i===2?{...x,outputId:''}:x)});assert.equal(r.unlinkedCount,1);assert.equal(r.ok,false);assert.equal(r.productionAuthorized,false);
r=inspect({...params,readiness:{ok:false}});assert.equal(r.ok,false);
r=inspect({...params,stages:stages.slice(1)});assert.equal(r.ok,true);assert.equal(r.prepCount,0);
r=inspect({...params,stages:[...stages.slice(0,2),{...stages[0],id:'P:mare',outputId:'B'},...stages.slice(2)]});assert.equal(r.ok,true);assert.equal(r.prepCount,2);
r=inspect({...params,stages:[...stages.slice(0,2),{...stages[0],id:'P:mare',outputId:'B'},{...stages[0],id:'P:extra',outputId:'C'},...stages.slice(2)]});assert.equal(r.ok,false);
assert.equal(inspect({plan:{autoDesign21:{mode:'hard'}},stages}),null);
console.log('v116 flow review: 9 scenarios PASS');
