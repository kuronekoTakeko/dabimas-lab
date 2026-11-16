'use strict';
// v9.0.1: Save-failure rollback. No real browser data, CSV or game confirmation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const seed=html.match(/const SEED=(\[[^;]+\]);<\/script>/);
assert(seed);
const safety=require('../research-backup-safety-v83.js');
const base={version:13,owned:{old:{owned:true,rights:2}},plans:[{id:'local',title:'保存プラン'}],homebreds:[],genomes:[],added:[],mareFavorites:{},mareGrades:{}};
const incoming={version:13,owned:{old:{owned:true,rights:999},new:{owned:true,rights:0}},plans:[{id:'remote',title:'外部の保存プラン'}],homebreds:[],genomes:[],added:[]};
const store=new Map([['dabimas_lab_v02_state',JSON.stringify(base)]]);
let failWrites=false,writeAttempts=0,backups=0,rendered=0;
const nodes=new Map();
function el(id){if(nodes.has(id))return nodes.get(id);const v={id,value:'',textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},querySelector(){return null},scrollIntoView(){}};nodes.set(id,v);return v;}
const ctx={console,Date,Map,Set,Math,JSON,Promise,URL,crypto:globalThis.crypto,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>{writeAttempts++;if(failWrites)throw Error('storage quota');store.set(k,v)}},
 document:{getElementById:el,addEventListener(){},querySelectorAll(){return []}},
 navigator:{},location:{protocol:'file:'},setTimeout(){},alert(){},confirm(){return true}};
ctx.window=ctx;ctx.globalThis=ctx;ctx.DabimasBackupSafety83=safety;
vm.createContext(ctx);
const before=source.slice(0,source.lastIndexOf("document.addEventListener('click',e=>"));
vm.runInContext('const SEED='+seed[1]+';'+before+`
dl=()=>{globalThis.__backupCalled();};renderAll=()=>{globalThis.__renderCalled();};
window.__test901={importJSON,state:()=>state,owned:r=>isOwned(r),getRows:()=>getRows()};
})();`,ctx);
ctx.__backupCalled=()=>backups++;
ctx.__renderCalled=()=>rendered++;
assert.equal(ctx.__test901.state().owned.old.rights,2);
failWrites=true;
const beforeStorage=store.get('dabimas_lab_v02_state');
assert.equal(ctx.__test901.importJSON(incoming),false);
assert.equal(store.get('dabimas_lab_v02_state'),beforeStorage,'save failure must not modify localStorage');
assert.equal(ctx.__test901.state().owned.new,undefined,'save failure must revert in-memory ownership');
assert.equal(ctx.__test901.state().plans.length,1,'save failure must revert in-memory plans');
assert.match(nodes.get('importStatus').textContent,/変更を取り消しました/);
assert.equal(rendered,0);
failWrites=false;
assert.equal(ctx.__test901.importJSON(incoming),true);
assert.equal(ctx.__test901.state().owned.old.rights,2,'conflict must protect existing local ownership');
assert.equal(ctx.__test901.state().owned.new.rights,0,'zero-right owned horses must import');
assert.equal(ctx.__test901.state().plans.length,2,'new plan must be added');
assert.equal(JSON.parse(store.get('dabimas_lab_v02_state')).plans.length,2,'success must persist the merged state');
assert.equal(backups,2,'back up before both attempts');
assert.equal(rendered,1,'render only after successful persistence');
// v8.0 policy: genuinely new terminals must not fabricate a 315-horse register.
assert(source.includes('const ownSeed={};'));
assert(source.includes("const SAVE_KEY='dabimas_lab_v02_state'"));
console.log('PASS v9.0.1 atomic JSON import: rollback on quota error; existing records retained; 0 rights owned; safe subsequent success; no implicit seed.');
