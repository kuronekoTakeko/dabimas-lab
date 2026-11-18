'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const finish=require('../research-mild-finish-v610.js');
let n=0;
const t=(label,fn)=>{fn();++n;console.log('PASS',label)};
const paths=[];for(let d=1;d<=5;d++)for(let i=0;i<2**(d-1);i++){let p='';for(let b=d-2;b>=0;b--)p+=i&(1<<b)?'D':'S';paths.push(p+'S');}
function horse({candidate=1,documented=0,fast=5}={}){
  const extraEffective=Array.from({length:candidate},(_,i)=>({name:'候補'+i,conflicts:[],...(i<documented?{counted:[{name:'記録済'}],counts:{'速':1}}:{})}));
  return {matches:3,additionalBirths:1,full:{known:31,rows:paths.map(path=>({path,line:'ハビタット系',factors:['速']})),conflicts:[],transmission:{conflicts:[],invalid:[]}},theory66:{superPerfect:'成立',perfect:'成立'},extraEffective,extraFactorCounts:{速:fast},risk:0,conflictCount:0,unresolvedCount:0};
}
t('no documented independent cross -> no confirmed cross-factor score',()=>{
  const m=finish.metric(horse({candidate:1,documented:0,fast:99}),'speed');
  assert.equal(m.independentCrossEvidence,0);
  assert.equal(m.crossFactorEvidence,0);
  assert.equal(m.candidateCrossFactorIndex,396);
  assert.equal(m.unresolvedCrossCandidates,1);
});
t('partially documented candidate set must not promote aggregate counts',()=>{
  const m=finish.metric(horse({candidate:2,documented:1,fast:99}),'speed');
  assert.equal(m.independentCrossEvidence,1);
  assert.equal(m.crossFactorEvidence,0);
  assert.equal(m.crossEvidenceComplete,false);
  assert.equal(m.unresolvedCrossCandidates,1);
});
t('fully documented set can use known aggregate index',()=>{
  const m=finish.metric(horse({candidate:2,documented:2,fast:5}),'speed');
  assert.equal(m.crossFactorEvidence,20);
  assert.equal(m.crossEvidenceComplete,true);
});
t('unknown extraFactorCounts cannot outrank same pedigree solely by inflated values',()=>{
  const a=finish.metric(horse({fast:999}),'speed'),b=finish.metric(horse({fast:1}),'speed');
  assert.equal(a.score,b.score);
});
t('v114 scripts and version referenced in page',()=>{
 const html=fs.readFileSync(__dirname+'/../index.html','utf8');
 assert(html.includes('v114'));assert(html.includes('research-mild-finish-v610.js?v=114'));
 assert(html.includes('research-mild-global-v87.js?v=114'));
});
console.log('TOTAL',n);
