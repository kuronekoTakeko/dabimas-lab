'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root=require('node:path').join(__dirname,'..');
const code=fs.readFileSync(root+'/app.js','utf8');
const start=code.indexOf('// v113: Portable snapshot');
const end=code.indexOf('function clearProductionData(){',start);
assert(start>0&&end>start);
const segment=code.slice(start,end);
const html=fs.readFileSync(root+'/index.html','utf8');
for(const id of ['exportPortable113','importPortable113','clearPersonal113','portableStatus113'])assert(html.includes('id="'+id+'"'));
let mem={}, saved=[], shouldSave=true, promptResult='復元', persistedMaster=null;
const sample={owned:{'owned1':{owned:true,rights:0}},added:[],genomes:[{id:1}],plans:[{id:'p'}],mareFavorites:{},mareGrades:{},homebreds:[{id:'h'}]};
const ctx={productionDataBackup:()=>ctx.state,state:JSON.parse(JSON.stringify(sample)),master:[{id:'old',ancestry:[],factors:[]}],masterAudit86:null,openPlanId:'p',
 dl:(name,obj)=>saved.push([name,obj]),prompt:()=>promptResult,buildMap:()=>{},rebuildParentRegistry68:()=>{},closeEditor:()=>{},renderAll:()=>{},
 saveMaster:async m=>{if(!shouldSave)return false;persistedMaster=m;return true;},
 localStorage:{setItem:(k,v)=>{mem[k]=v;}},SAVE_KEY:'save',key:s=>s.toLowerCase(),
 persist:()=>{mem.save=JSON.stringify(ctx.state);return true;},
 $:()=>({textContent:''}),Date,JSON,Object,Array,Set,Error,Promise};
vm.createContext(ctx);
vm.runInContext(segment+'\nglobalThis.ops={portableSnapshot113,validPortable113,restorePortable113,clearPersonalForTest113};',ctx);
(async()=>{
 const snap=ctx.ops.portableSnapshot113();assert.equal(snap.personal.owned.owned1.rights,0);assert.equal(snap.publicMaster.records.length,1);
 assert.throws(()=>ctx.ops.validPortable113({format:'bad'}));
 const newSnap={format:'dabimas-portable-v113',personal:{...sample,owned:{other:{owned:true,rights:3}}},publicMaster:{records:[{id:'old',ancestry:[],factors:[]},{id:'new',ancestry:[],factors:[]}]}};
 assert.equal(await ctx.ops.restorePortable113(newSnap),true);
 assert.equal(ctx.state.owned.other.rights,3);assert.equal(ctx.master.length,2);assert.equal(persistedMaster.length,2);assert.equal(saved.length,1);
 assert.equal(ctx.state.plans.length,1);
 promptResult='全クリア';assert.equal(ctx.ops.clearPersonalForTest113(),true);
 assert.equal(Object.keys(ctx.state.owned).length,0);assert.equal(ctx.state.plans.length,0);assert.equal(ctx.state.homebreds.length,0);assert.equal(ctx.master.length,2);assert.equal(saved.length,2);
 const before=JSON.stringify(ctx.state);shouldSave=false;promptResult='復元';
 await assert.rejects(()=>ctx.ops.restorePortable113(newSnap),/保存に失敗/);
 assert.equal(JSON.stringify(ctx.state),before);assert.equal(mem.save,JSON.stringify(ctx.state));
 console.log('v113 portable: 12 assertions PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
