'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'..');
const inv=require(path.join(dir,'research-inverse-mild-v69.js'));
const nitro=require(path.join(dir,'research-mild-nitro-v107.js'));
const rank=require(path.join(dir,'research-mild-rank-v78.js'));
globalThis.DabimasMildNitro107=nitro;
function make(family,births,score=1){return {sireId:births===0||births===2?`dad-${family}`:null,sireName:family,
 sirePrep:(births===1||births===3)?{fatherId:`dad-${family}`,motherId:`mom-${family}`} : undefined,
 baseMareId:(births===0||births===1)?`mare-${family}`:null,
 basePrep:births===2||births===3?{fatherId:`base-dad-${family}`,motherId:`base-mom-${family}`} : undefined,
 additionalBirths:births===3?2:births?1:0,distinct:8,score};}
const candidates=[];
for(let i=0;i<40;i++)for(let l=0;l<4;l++)candidates.push(make(String(i),l,40-i));
const result=inv.shortlist(candidates,{limit:45,maxAdditionalBirths:2});
assert.equal(result.candidates.length,45);
assert(result.stats.optionalMareShortlist>0,'foundation-mare-only needs a reserved slot');
assert(result.stats.bothPreparedShortlist>0,'both-prepared needs a reserved slot even if direct exists');
assert(result.candidates.filter(c=>c.additionalBirths===2).every(c=>c.sirePrep&&c.basePrep));
const strict=inv.shortlist(candidates,{limit:45,maxAdditionalBirths:1});
assert(strict.candidates.every(c=>c.additionalBirths<=1),'cap must not be bypassed');
const paths=[];for(let gen=1;gen<=5;gen++)for(let i=0;i<(1<<(gen-1));i++){
 let bits='';for(let bit=gen-2;bit>=0;bit--)bits+=(i&(1<<bit))?'D':'S';paths.push(bits+'S');
}
function candidate(fast,births,unknown=0){return {matches:3,additionalBirths:births,
 theory66:{superPerfect:'成立',perfect:'成立',blocked:false},
 full:{known:31,rows:paths.map((p,i)=>({path:p,factors:i<fast?['速']:i<fast+unknown?[]:['底']})),
 conflicts:[],transmission:{conflicts:[],invalid:[]}}};}
const finish={metric:x=>({shortCrossRisk:x.risk||0,independentCrossEvidence:x.cross||1,
 crossFactorEvidence:x.cross||1,unresolvedCrosses:0,ancestorFactorsRecorded:31,score:1})};
const one=candidate(5,1),two=candidate(8,2);
assert.equal(nitro.twoExtra(two,one,{goal:'speed',finish}).approved,true,'valid stage increase with same coverage');
assert.equal(nitro.twoExtra(candidate(8,2,1),one,{goal:'speed',finish}).approved,false,'unresolved factor count prohibits upgrading');
const risky=candidate(8,2);risky.risk=2;
assert.equal(nitro.twoExtra(risky,one,{goal:'speed',finish}).approved,false,'risk regression prohibits approval');
assert(rank.compare({candidate:two},{candidate:one},{goal:'speed',finish})>0,'unapproved 2 births lose');
assert(rank.compare({candidate:two,twoExtra111:{approved:true}},{candidate:one},{goal:'speed',finish})<0,'documented 2 birth gains can win');
assert(rank.compare({candidate:one},{candidate:candidate(8,2)},{goal:'speed',finish})<0,'no unproven two-birth promotion');
const src=fs.readFileSync(path.join(dir,'app.js'),'utf8');
assert(src.includes('maxAdditionalBirths:2'), 'production DDS must allow 2');
assert(src.includes("mild67StagePreparation(draft,base.marePrep,'female')"),'female prep staging remains');
assert(src.includes("mild67StagePreparation(draft,base.xPrep,'male')"),'male prep staging remains');
assert(src.includes('mild111={version:111'),'two preparation approval must be recorded');
const inverse=fs.readFileSync(path.join(dir,'research-inverse-mild-v69.js'),'utf8');
assert(!inverse.includes('if(direct.length===0)for(const b of prep)'),'do not suppress foundation-prep if direct available');
const globalSrc=fs.readFileSync(path.join(dir,'research-mild-global-v87.js'),'utf8');
assert(globalSrc.includes('twoExtraWithoutOne')&&globalSrc.includes('nitro?.twoExtra?.'),'global evidence gate required');
const index=fs.readFileSync(path.join(dir,'index.html'),'utf8');
assert(index.includes('v111')&&index.includes('research-inverse-mild-v69.js?v=111'));
console.log('PASS v111: 2-sided shortlist, budget, risk/coverage, grade-guard, ranking, staging, cache refs');
