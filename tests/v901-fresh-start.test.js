'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const seed=html.match(/const SEED=(\[[^;]+\]);<\/script>/);
const source=fs.readFileSync(path.join(root,'app.js'),'utf8');assert(seed);
const store=new Map(),ui=new Map();
function fakeEl(id){if(ui.has(id))return ui.get(id);const o={id,value:'',textContent:'',innerHTML:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},querySelector(){return null}};ui.set(id,o);return o;}
const ctx={console,Date,Map,Set,Math,JSON,Promise,URL,crypto:globalThis.crypto,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
 document:{getElementById:fakeEl,addEventListener(){},querySelectorAll(){return []}},navigator:{},location:{protocol:'file:'},setTimeout(){}};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
const until=source.slice(0,source.lastIndexOf("document.addEventListener('click',e=>"));
vm.runInContext('const SEED='+seed[1]+';'+until+`
window.__fresh={counts:()=>Object.keys(state.owned).length,rows:()=>{buildMap();return getRows()},get:isOwned};})();`,ctx);
assert.equal(ctx.__fresh.counts(),0,'new terminal cannot be auto-filled from 315 supplied seed records');
assert.equal(Object.keys(JSON.parse(store.get('dabimas_lab_v02_state')).owned).length,0);
assert(ctx.__fresh.rows().length>0,'static catalog references remain available without auto-acquisition');
assert(ctx.__fresh.rows().every(r=>!ctx.__fresh.get(r)),'seeding a visible catalog is not ownership');
console.log('PASS v9.0.1 fresh start: no phantom acquisition; starter catalog not treated as owned; empty record saved.');
