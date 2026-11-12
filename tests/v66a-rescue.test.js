'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const rescue=require('../research-maternal-rescue-v66a.js');
const maternal=require('../research-maternal-route-v66.js');
const slots={g3:'Deep-1',g4:'Deep-2',g5:'Deep-3'};
const immutable={slots:{...slots},mares:Array.from({length:22},(_,i)=>({id:'名牝'+i,sex:'female'}))};
const original=JSON.stringify(immutable);
const parent={sex:'male'};
const seenStages=[];
const call=({failStage=null,failIds=[],failFinal=false,requireFromLater=false,maxChecks=540})=>rescue.rescue({
 definitions:maternal.definitions,slots,mares:immutable.mares,
 getSire:id=>({id,sex:'male'}),
 breed:(sire,mare,def)=>{
  seenStages.push(def.n);
  if(failStage===def.n&&failIds.includes(mare.id))return {known:30,conflicts:['test']};
  if(failFinal&&def.n===9)return {known:31,conflicts:['forbidden']};
  return {known:31,conflicts:[],rows:[{path:'S',name:'test'}],transmission:{conflicts:[],invalid:[]}};
 },
 createChild:({definition,pedigree})=>({id:'trial'+definition.n,sex:definition.sex}),
 complete:choices=> {
  const ids=Object.values(choices);
  assert.equal(new Set(ids).size,7,'seven input mares must be different');
  if(requireFromLater&&!ids.some(x=>x==='名牝21'))return null;
  return {matches:3,choices};
 },maxChecks,maxAttempts:90
});
let r=call({});assert(r.candidate&&r.candidate.matches===3);assert(seenStages.includes(9));
r=call({failStage:2,failIds:immutable.mares.slice(0,21).map(x=>x.id)});assert(r.candidate&&r.candidate.choices[2]==='名牝21');assert(r.rejected.pedigree>0,'should retry rejected local mother');
r=call({requireFromLater:true});assert(r.candidate&&Object.values(r.candidate.choices).includes('名牝21'));
r=call({failFinal:true,maxChecks:80});assert.equal(r.candidate,null);assert(r.rejected.final>0);assert(r.checks<=80);
const bad=rescue.rescue({definitions:maternal.definitions,slots:{g3:'A',g4:'A',g5:'B'},mares:immutable.mares});assert.equal(bad.candidate,null);
assert.equal(JSON.stringify(immutable),original,'rescue must not mutate inventory or ranked pool');
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
assert(app.includes('DabimasMaternalRescue66a.rescue('));
assert(html.includes('research-maternal-rescue-v66a.js?v=66a'));
assert(html.indexOf('research-maternal-rescue-v66a.js?v=66a')<html.indexOf('app.js?v=610'));
assert(sw.includes("'./research-maternal-rescue-v66a.js'"));
assert(sw.includes('dbms-v610-1'));
console.log('PASS v66a: 9-stage rescue, skip bad mare, broaden search, reject unsafe final, bounded budget, no source-state mutation, assets');
