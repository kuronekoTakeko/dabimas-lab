'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const globalSelect=require('../research-mild-global-v87.js');
const rank=require('../research-mild-rank-v78.js');
const nitro=require('../research-mild-nitro-v107.js');
globalThis.DabimasMildNitro107=nitro;
const paths=[];for(let n=1;n<=5;n++)for(let i=0;i<1<<(n-1);i++){let s='';for(let bit=n-2;bit>=0;bit--)s+=(i&(1<<bit))?'D':'S';paths.push(s+'S');}
function candidate(id,grade,births,route){const result={matches:3,additionalBirths:births,
 theory66:{superPerfect:grade===8?'成立':'不成立',perfect:'成立',blocked:false},
 full:{known:31,conflicts:[],transmission:{conflicts:[],invalid:[]},rows:paths.map((p,i)=>({path:p,factors:i<8?['速']:['長']}))},
 choices:{1:'base-'+id},xId:'sire-'+id};
 if(route==='sireOnly'||route==='both')result.xPrep={fatherId:'father-'+id,motherId:'mother-'+id};
 if(route==='mareOnly'||route==='both')result.marePrep={fatherId:'baseFather-'+id,motherId:'baseMother-'+id};
 return result;
}
const direct=candidate('direct',8,0,'direct');
const sire=candidate('sire',8,1,'sireOnly');
const mare=candidate('mare',8,1,'mareOnly');
const two=candidate('two',7,2,'both');
const finish={metric:()=>({independentCrossEvidence:1,crossFactorEvidence:1,shortCrossRisk:0,
 unresolvedCrosses:0,ancestorFactorsRecorded:31,score:1})};
const trials=[{routeType:'dds',anchor:{set:[{id:'A'}]},draft:{routeDraft:{slots:{g3:'G3',g4:'G4',g5:'G5'}}},
 ranked:[direct,sire,mare,two].map(candidate=>({candidate}))}];
const result=globalSelect.select(trials,{ranker:rank,finish,goal:'speed'});
assert.equal(result.stats.eligible,4);
assert.deepEqual(result.stats.gradeBirthMatrix,{superPerfect:{0:1,1:2,2:0},perfect:{0:0,1:0,2:1}});
assert.deepEqual(result.stats.routeCounts,{direct:1,sireOnly:1,mareOnly:1,both:1});
assert.equal(result.stats.oneExtraCompared,2,'one-extra mare-only must be included');
assert.equal(result.stats.twoExtraWithoutOne,1,'no same-grade comparator must be documented');
assert.equal(result.stats.twoExtraApproved,0,'no invented approval');
assert.equal(result.stats.gradeRouteExamples.length,4);
assert.equal(result.winner.rank.candidate,theTrialsDirect());
function theTrialsDirect(){return direct;}
const x=candidate('same',8,1,'sireOnly'),y=candidate('same',8,1,'sireOnly');
y.xPrep={fatherId:x.xPrep.fatherId,motherId:'DIFFERENT MARE'};
const trial={anchor:{set:[{id:'A'}]},draft:{routeDraft:{slots:{g3:'a',g4:'b',g5:'c'}}}};
assert.notEqual(globalSelect.identity(trial,{candidate:x}),globalSelect.identity(trial,{candidate:y}),
 'different genuine prep mares must not merge');
console.log('PASS v112: grade x preparation matrix, four routes, one-extra mare-only audit, incomparable two-extra, exact recipe identity');
