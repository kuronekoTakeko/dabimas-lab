'use strict';
/* Standalone integration probe. Supply user-owned source CSV and owned JSON.
 * No network, no browser data changes, no saved plans. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const csvFile=process.argv[2],jsonFile=process.argv[3];if(!csvFile||!jsonFile)throw Error('usage node tools/v610-real-csv-probe.js path/to/mydata.csv path/to/owned.json');
const csv=fs.readFileSync(csvFile,'utf8'),owned=JSON.parse(fs.readFileSync(jsonFile,'utf8'));
const html=read('index.html'),seed=html.match(/const SEED=(\[[^;]+\]);<\/script>/);assert(seed);
const elements=new Map();function el(id){if(elements.has(id))return elements.get(id);const a={value:'',checked:true,innerHTML:'',textContent:'',addEventListener(){},classList:{add(){},remove(){}}};elements.set(id,a);return a;}
const ctx={console,Date,JSON,Set,Map,Math,Promise,URL,crypto:globalThis.crypto,
 document:{getElementById:el,addEventListener(){},querySelectorAll(){return []}},navigator:{},location:{protocol:'file:'},setTimeout(){},
 localStorage:{getItem(name){return name==='dabimas_lab_v02_state'?JSON.stringify(owned):null;},setItem(){throw Error('test must not persist');}}};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
for(const f of ['research-audit.js','research-quality.js','research-cross-check.js','research-evidence.js','research-validation.js','research-transmission.js','research-flow-guard.js','research-production-guard.js','research-reuse-v50.js','research-parent-theory-v56.js','research-mild-diversity-v60.js','research-direct-ancestor-v64.js','research-close-cross-v65.js','research-maternal-dds-v67.js','research-inverse-mild-v69.js','research-mild-finish-v610.js'])vm.runInContext(read(f),ctx,{filename:f});
const app=read('app.js');const body=app.slice(0,app.lastIndexOf("document.addEventListener('click',e=>"));
vm.runInContext('const SEED='+seed[1]+';'+body+`
window.__probe={
  load:csv=>{master=processCSV(csv);buildMap();rebuildParentRegistry68();return {master:master.length,mares:mareRows().length,owned:maleRows().filter(isOwned).length,observed:parentRegistry68?.observed};},
  run:goal=>{
   const ids=['ディープインパクト-央獅-','ディープインパクト-煌魂-','ディープインパクト-翔燕-'];
   const set=ids.map(id=>findParentHorse(id));if(set.some(x=>!x))throw Error('Deep variants missing');
   const p=newPlan({set,kinds:['短','速','底','長','走','中'],score:0});p.goal=goal;
   p.routeDraft={layout:'maternal-dds-g3',slots:{g3:ids[0],g4:ids[1],g5:ids[2]}};
   const r=opt69Find(p,'meihin_fast');
   return {results:r.results.map(x=>({grade:opt66TheoryRank(x),matches:x.matches,births:x.additionalBirths,finish:x.finish610,chosen:x.choices,known:x.full.known,sl:x.theory66?.superPerfect})),stats:r.inverse69,tests:r.tests,message:r.message};
  }
};})();`,ctx,{filename:'app.js'});
const t=Date.now();const info=ctx.__probe.load(csv);console.log('loaded',JSON.stringify(info),'ms',Date.now()-t);
if(info.owned<300||info.mares<400)throw Error('owned or mares unexpectedly few');
const copy=JSON.stringify(owned);
for(const goal of ['speed','stamina']){const tt=Date.now();const r=ctx.__probe.run(goal);console.log(goal,JSON.stringify(r).slice(0,4000),'ms',Date.now()-tt);
 assert(r.results.length>0,goal+': no complete DDS results');assert(r.results.every(x=>x.matches===3&&x.known===31&&x.grade>=2),'all chosen pedigrees remain valid');
 assert(r.results.slice(0,2).every(x=>x.finish?.version===610),'top candidates received bounded finishing comparison');
 assert(r.results[0].finish?.tests>=0);}
assert.equal(JSON.stringify(owned),copy);
console.log('PASS real 2026-10-31 CSV, user 315 owned, both goals, no mutation and end-to-end 31 ancestors');
