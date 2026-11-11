'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const dir=path.join(__dirname,'..'),txt=f=>fs.readFileSync(path.join(dir,f),'utf8');
const theory=require('../research-parent-theory-v56.js');
const positions=['父','父父','父父父','父父父父','父父母父','父母父','父母父父','父母母父','母父','母父父','母父父父','母父母父','母母父','母母父父','母母母父'];
const csvHeads=['馬名','因子1','距離','子系統',...positions,...positions.map(p=>'pa:'+p),...positions.map(p=>'chi:'+p)];
function csvLine(name,{parent=[],child=[]}={}){
  const field=Object.fromEntries([['馬名',name],['因子1','速'],['距離','1600m'],['子系統','ダミー系'],
   ...positions.map((p,i)=>[p,name+'の祖先'+i]),...positions.map((p,i)=>['pa:'+p,parent[i]||'']),...positions.map((p,i)=>['chi:'+p,child[i]||'ダミー系'])]);
  return csvHeads.map(k=>field[k]||'').join(',');
}
const csv='\uFEFF'+csvHeads.join(',')+'\n'+csvLine('父馬A',{parent:['Royal Charger','Nearctic',...Array(13).fill('Nasrullah')]})+'\n'+
 csvLine('父馬B',{parent:['Royal Charger','Nearctic',...Array(13).fill('Nasrullah')]})+'\n'+
 Array.from({length:100},(_,i)=>csvLine('補助馬'+i,{parent:Array(15).fill('Nasrullah')})).join('\n');
const app=txt('app.js'),html=txt('index.html'),seed=html.match(/const SEED=(\[[^;]+\]);<\/script>/);
assert(seed);const source=app.slice(0,app.lastIndexOf("document.addEventListener('click',e=>"));
const dom={addEventListener(){},getElementById(){return {value:'',textContent:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []}}},querySelectorAll(){return []}};
const store=new Map(),ctx={console,Date,Math,Set,Map,JSON,Promise,URL,document:dom,setTimeout(){},navigator:{},location:{protocol:'file:'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(txt('research-parent-theory-v56.js'),ctx,{filename:'research-parent-theory-v56.js'});
vm.runInContext('const SEED='+seed[1]+';'+source+`
window.__test68={parse:processCSV,load(data){master=data;buildMap();rebuildParentRegistry68();return {registered:parentRegistry68?.known,observed:parentRegistry68?.observed,conflicts:parentRegistry68?.conflicts?.length}},
 inspect(ped){return currentParentTheory68().inspect(ped)},
 lookup(name){return currentParentTheory68().lookup(name)},
 warning:parentRegistryNotice68};})();`,ctx);
const appApi=ctx.__test68;
const rows=appApi.parse(csv);assert.equal(rows.length,102);
assert.equal(rows[0].ancestry.length,15);
assert.equal(rows[0].ancestry[0].parentSystem,'Royal Charger');
assert.equal(rows[0].ancestry[1].parentSystem,'Nearctic');
assert.equal(rows[0].ancestry[0].line,'ダミー系');
assert.equal(rows[0].parentSystem,'Royal Charger');
const info=appApi.load(rows);
assert.equal(info.observed,rows.length*15);assert(info.registered>=49);
assert.equal(appApi.lookup('父馬Aの祖先0').parent,'Royal Charger');
assert.equal(appApi.lookup('父馬Aの祖先1').parent,'Nearctic');
assert.match(appApi.lookup('父馬Aの祖先0').basis,/公開CSV/,'CSV evidence must not be labelled official');
assert.match(appApi.warning(),/公開CSVの親系統/);
const scrambled=rows.map(x=>({...x,ancestry:x.ancestry.map(a=>({...a}))}));
scrambled[1].ancestry[0].horse=scrambled[0].ancestry[0].horse;
scrambled[1].ancestry[0].parentSystem='St.Simon';
const conflict=appApi.load(scrambled);assert.equal(conflict.conflicts,1);
assert.equal(appApi.lookup('父馬Aの祖先0'),null,'conflicting public classifications must be unknown');
assert.equal(theory.canonical('ダミー系'),null,'child system cannot masquerade as parent system');
// Evidence-based decision: 8 distinct interesting systems plus same 4 vs 4 = super-perfect (research verdict).
const expected=theory.PARENTS;
const interesting=[...theory.FAMILIES.interestingSire,...theory.FAMILIES.interestingMare];
const sireMatching=theory.FAMILIES.matchingSire, mareMatching=theory.FAMILIES.matchingMare;
const byPath=Object.fromEntries(interesting.map((p,i)=>[p,expected[i]]));
sireMatching.forEach((p,i)=>byPath[p]=byPath[mareMatching[i]]);
const ped={rows:Object.keys(byPath).map(p=>({path:p,name:'祖先'+p})),known:31,conflicts:[]};
const syntheticRegistry=theory.buildMasterRegistry(Object.entries(byPath).map(([p,v])=>({ancestry:[{path:p,horse:'祖先'+p,parentSystem:v}]})),{names:new Map(),sources:new Map(),conflicts:[]});
const verdict=theory.inspect(ped,{registry:syntheticRegistry});
assert.equal(verdict.perfect,'成立');assert.equal(verdict.superPerfect,'成立');assert.equal(verdict.gameVerified,false);
const changed={...ped,rows:ped.rows.map(x=>x.path===sireMatching[0]?{...x,name:'不明馬'}:x)};
const limited=theory.inspect(changed,{registry:syntheticRegistry});
assert.notEqual(limited.superPerfect,'成立','missing evidence cannot be confirmed');
// No new persisted user keys and no master data bundled as a repo asset.
assert(app.includes("const SAVE_KEY='dabimas_lab_v02_state'"));
assert(!fs.existsSync(path.join(dir,'mydata.csv')));
console.log('PASS v6.8 CSV pa parsing, all 1530 observations, registry conflict quarantine, perfect/super-perfect evidence, missing becomes unknown');
