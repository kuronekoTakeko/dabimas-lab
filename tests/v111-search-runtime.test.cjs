'use strict';
const assert=require('node:assert/strict');
const inv=require('../research-inverse-mild-v69.js');
const systems=['Royal Charger','Nearctic','Nasrullah','Swynford','Teddy','Himyar','St.Simon','Matchem','Hampton','Herod'];
const paths=['S','DS','SDS','DDS','SSDS','SDDS','DSDS','DDDS','SSS','DSS','SSD','SDSD','DSSS','DDSS','DDDS'];
function horse(prefix,i){const seed=i*17+(prefix==='S'?7:19);return {id:prefix+i,name:prefix+i,
 ancestry:paths.map((p,k)=>({path:p,horse:prefix+i+'-'+p,parentSystem:systems[(seed+k*13+i*i%7)%systems.length]}))};}
const owned=Array.from({length:330},(_,i)=>horse('S',i)),mares=Array.from({length:500},(_,i)=>horse('M',i));
const start=Date.now();
const out=inv.search({ownedSires:owned,mares,theory:{canonical:s=>systems.includes(s)?s:null,lookup:()=>null,isQuarantined:()=>false},score:r=>r.id.length,
 fixedMareLines:['Royal Charger','Nearctic'],maxAdditionalBirths:2,limit:380});
const ms=Date.now()-start;
assert(out.candidates.every(x=>x.additionalBirths<=2));
assert(out.stats.maxAdditionalBirths===2);
assert(out.candidates.length<=380);
assert(out.stats.precheckedPrepared===165000);
console.log('PASS v111 synthetic 330×500 bounded precheck; ms='+ms+', returned='+out.candidates.length+', eligible='+out.stats.preparedEightEligible+', both='+out.stats.bothPreparedShortlist);
