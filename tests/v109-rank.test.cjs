const assert=require('node:assert/strict');
const root='/mnt/data/v109build/';
const nitro=require(root+'research-mild-nitro-v107.js');globalThis.DabimasMildNitro107=nitro;
const rank=require(root+'research-mild-rank-v78.js');
const paths=[];for(let n=1;n<=5;n++){for(let i=0;i<(1<<(n-1));i++){let s='';for(let bit=n-2;bit>=0;bit--)s+=(i&(1<<bit))?'D':'S';paths.push(s+'S')}}
function candidate(fast=0,births=0,superp=true,missing=0){let count=0;return {matches:3,additionalBirths:births,theory66:{superPerfect:superp?'成立':'不成立',perfect:!superp?'成立':'不成立',blocked:false},full:{known:31,rows:paths.map((path,i)=>({path,factors:i<fast?['速']:i<fast+missing?[]:['底']})),conflicts:[],transmission:{conflicts:[],invalid:[]}}}}
const finish={metric:(c)=>({shortCrossRisk:c.risk??0,independentCrossEvidence:c.cross??0,crossFactorEvidence:c.cross??0,score:c.score??0,ancestorFactorsRecorded:31,unresolvedCrosses:0})};
const cmp=(x,y)=>rank.compare({candidate:x},{candidate:y},{goal:'speed',finish});
let a=candidate(5,0),b=candidate(8,0);assert(cmp(b,a)<0,'better speed stages should outrank within grade');
let c=candidate(8,0);assert.equal(cmp(b,c),0,'identical performance should tie');
let extra=candidate(12,1);assert(cmp(a,extra)<0,'unapproved extra cannot beat direct candidate');
let d=candidate(8,1);d.cross=2;let e=candidate(8,1);e.cross=1;assert(cmp(d,e)<0,'documented independent cross should win a tie');
let f=candidate(12,0,false);assert(cmp(a,f)<0,'theory remains independent first comparison');
let g=candidate(8,1);g.risk=2;assert(cmp(d,g)<0,'risk cannot be ignored');
let h=candidate(8,0,true,5);assert.equal(nitro.compare(a,h,'speed'),0,'unequal missing annotations must not produce comparative nitro advantage');
let evidence={candidate:candidate(8,1),nitro107:{approved:true}};
let direct={candidate:candidate(5,0)};
assert(rank.compare(evidence,direct,{goal:'speed',finish})<0,'approved improvement can beat one fewer stage');
console.log('PASS v109 rank: 8 assertions');
