'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const p=require('../research-mild-pairs-v55.js');
const m=require('../research-mild-mare-v57.js');
const g=require('../research-mild-graft-v58.js');
const statuses={unknown:{superPerfect:'未確認',perfect:'未確認'},perfect:{superPerfect:'不成立',perfect:'成立'},super:{superPerfect:'成立',perfect:'成立'}};
const theory={inspect:ped=>ped.verdict};
let count=0;
async function check(label,fn){await fn();count++;console.log('PASS',label);}
(async()=>{
 await check('paired async and sync have exactly equal candidate, audit and budget',async()=>{
  const initial={choices:{1:'a',2:'b',3:'c',4:'d',5:'e',6:'f'},xId:'x',matches:3,full:{known:31},id:'initial',value:0};
  const mares='abcdefghijklmnop'.split('').map(id=>({id,factors:['走'],ancestry:[]}));
  const sires=['x','y','z'].map(id=>({id,factors:['中'],ancestry:[]}));
  const evaluate=(choices,xId)=>({choices,xId,matches:3,full:{known:31},id:Object.values(choices).join('')+xId,value:(choices[1]==='g'?3:0)+(choices[2]==='h'?2:0)+(xId==='y'?1:0)});
  const opts={initial,mares,sires,evaluate,compare:(a,b)=>b.value-a.value,goal:'speed',budget:45,perSlot:6};
  const sync=p.optimize(opts);let yielded=0;const progress=[];
  const asyncResult=await p.optimizeAsync({...opts,yieldEvery:3,yieldControl:async()=>{yielded++;await Promise.resolve();},onProgress:(x)=>progress.push(x)});
  assert.deepEqual(asyncResult,sync);assert(yielded>0);assert(progress.length>0);assert(progress.every(n=>n%3===0));
 });
 await check('mare async and sync choose the same verified super-perfect with no miracle score',async()=>{
  const base={choices:{1:'a',2:'b',3:'c',4:'d',5:'e',6:'f'},xId:'x',matches:3,full:{known:31},closingPed:{known:31,conflicts:[],verdict:statuses.unknown},value:0};
  const mares='abcdefghijklmnop'.split('').map(id=>({id}));
  const evaluate=(choices,xId)=>({...base,choices,xId,closingPed:{...base.closingPed,verdict:choices[1]==='g'?statuses.super:statuses.perfect},value:choices[2]==='h'?1:0});
  const opts={initial:base,mares,sires:[{id:'x'},{id:'y'}],evaluate,theory,goal:'speed',budget:40,compareResearch:(a,b)=>b.value-a.value};
  const old=m.optimize(opts);let yieldCount=0;
  const newer=await m.optimizeAsync({...opts,yieldEvery:2,yieldControl:async()=>{yieldCount++;}});
  assert.deepEqual(newer,old);assert(yieldCount>0);assert.equal(newer.audit.miracleIncluded,false);
 });
 await check('graft async and sync preserve no unverified 10-stage promotion',async()=>{
  const rows=Array.from({length:31},(_,i)=>({path:'S'.repeat(i+1),horse:'H'+i}));
  const initial={stages:9,final:{known:31,conflicts:[]},outputs:{8:{ancestry:rows}},metrics:{score:10}};
  const evaluate=(id)=>({...initial,stages:10,metrics:{score:11},outputs:{8:{ancestry:rows}},final:{known:31}});
  const verdict=()=>statuses.unknown;
  const opts={baseline:initial,evaluate,sires:'abcdefghij'.split('').map(id=>({id})),theory:{inspect:verdict},budget:10};
  let yieldCount=0;
  const old=g.optimize(opts),newer=await g.optimizeAsync({...opts,yieldEvery:2,yieldControl:async()=>{yieldCount++;}});
  assert.deepEqual(newer,old);assert.equal(newer.improved,false);assert(yieldCount>0);
 });
 await check('UI integration awaits the three phase optimizers, service worker cache updated',async()=>{
  const app=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');
  const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  const sw=fs.readFileSync(require('node:path').join(__dirname,'../sw.js'),'utf8');
  assert(app.includes('await mild55Api.optimizeAsync('));assert(app.includes('await api.optimizeAsync({initial:base'));
  assert(app.includes('await api58.optimizeAsync('));assert(html.includes('v6.9'));
  assert(sw.includes('dbms-v69-1'));
 });
 console.log(`${count} v6.2 tests passed`);
})().catch(e=>{console.error(e);process.exitCode=1});
