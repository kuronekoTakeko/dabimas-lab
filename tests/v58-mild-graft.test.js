'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const api=require('../research-mild-graft-v58.js');
let count=0;
function check(name,fn){fn();count++;console.log('PASS',name);}
function trial(id,perfect='未確認',superPerfect='未確認',score=10,stages=9){
 const rows=[];
 const build=x=>{rows.push({path:x+'S',horse:(x+'S')+'Horse'});if(x.length<4){build(x+'S');build(x+'D');}};build('');
 return {id,stages,metrics:{score},final:{known:31,conflicts:[]},outputs:{8:{ancestry:rows}},status:{perfect,superPerfect,miracle:'成立'}};
}
const theory={inspect:ped=>({perfect:ped.testPerfect||'成立',superPerfect:ped.testSuper||'未確認'})};
const inspect={inspect:ped=>{const id=ped.rows[0].name;return id.startsWith('super')?{perfect:'成立',superPerfect:'成立'}:id.startsWith('perfect')?{perfect:'成立',superPerfect:'不成立'}:{perfect:'未確認',superPerfect:'未確認'};}};
const stamped=(id,p,s,score=10,stages=10)=>{const t=trial(id,p,s,score,stages);t.outputs[8].ancestry[0].horse=id+'Horse';return t;};
check('extra generation must improve verified pedigree theory',()=>{
 const baseline=stamped('initial','未確認','未確認',10,9);
 const r=api.optimize({baseline,theory:inspect,sires:[{id:'a'},{id:'b'}],evaluate:id=>id==='a'?stamped('perfect',null,null,10):stamped('super',null,null,9),budget:10});
 assert.equal(r.improved,true);assert.equal(r.audit.chosenSireId,'a');assert.equal(r.audit.resultStages,10);
});
check('a super-perfect outranks a perfect if research does not decline',()=>{
 const r=api.optimize({baseline:stamped('initial',null,null,10,9),theory:inspect,sires:[{id:'a'},{id:'b'}],evaluate:id=>stamped(id==='a'?'perfect':'super',null,null,10)});
 assert.equal(r.audit.chosenSireId,'b');assert.equal(r.audit.end.superPerfect,'成立');
});
check('no additional birth for unknown or lower research score',()=>{
 const baseline=stamped('initial',null,null,10,9);
 const r=api.optimize({baseline,theory:inspect,sires:[{id:'a'},{id:'b'}],evaluate:id=>id==='a'?stamped('unknown',null,null,30):stamped('super',null,null,9)});
 assert.equal(r.improved,false);assert.equal(r.winner,baseline);assert.equal(r.audit.researchDecline,1);
});
check('one extra birth maximum; no 11-stage plans',()=>{
 const r=api.optimize({baseline:stamped('initial',null,null,10,9),theory:inspect,sires:[{id:'a'}],evaluate:()=>stamped('super',null,null,20,11)});
 assert.equal(r.improved,false);assert.equal(r.audit.stageOverflow,1);
});
check('duplicate sires and zero budget cannot mutate input',()=>{
 const baseline=stamped('initial',null,null,10,9),before=JSON.stringify(baseline);
 const r=api.optimize({baseline,theory:inspect,sires:[{id:'a'},{id:'a'}],evaluate:()=>stamped('super',null,null,11)});
 assert.equal(r.audit.tested,1);assert.equal(JSON.stringify(baseline),before);
 const z=api.optimize({baseline,theory:inspect,sires:[{id:'b'}],evaluate:()=>{throw Error('not called')},budget:0});assert.equal(z.audit.tested,0);
});
check('malformed lineage, missing 31 or conflicted pedigree is not accepted',()=>{
 const bad=stamped('super',null,null,11);bad.outputs[8].ancestry.pop();
 assert.equal(api.assess(bad,inspect),null);
 const other=stamped('super',null,null,11);other.final.conflicts=['bad'];assert.equal(api.assess(other,inspect),null);
});
check('v58 application hooks, stage6 only, PWA cache and existing save key',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
 assert(app.includes('hard23Trial(draft,{6:[id]},goal)'));
 assert(app.includes("hard23Save(draft,mild58Trial,goal,{tested:mild58.tested},{mode:'mild'})"));
 assert(app.includes("options.mode==='mild'?'mild':'hard'"));
 assert(app.includes('p?.mild58?.chosenSireId===t.grafts[6][0]'));
 assert(html.indexOf('research-mild-graft-v58.js?v=62')<html.indexOf('app.js?v=69b'));
 assert(sw.includes('dbms-v69b-1')&&sw.includes("'./research-mild-graft-v58.js'"));
 assert(app.includes("const SAVE_KEY='dabimas_lab_v02_state'"));
});
console.log(`${count} v5.8 tests passed`);
