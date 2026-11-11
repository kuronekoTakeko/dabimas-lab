'use strict';
// Regression for the 2026-11-11 screenshot: legacy flow-guard silently checks
// a maternal route against paternal steps (2/6 wrong sex, 7 wrong parents).
// Synthetic fixtures only: not evidence of real master-CSV or in-game Shiko.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const source=read('app.js'),html=read('index.html');
const seedMatch=html.match(/const SEED=(\[[^;]+\]);<\/script>/);
const mareMatch=source.match(/const RANK12_MEIHIN=new Set\((\[[^;]+\])\.map\(key\)\);/);
assert(seedMatch&&mareMatch);
const mareNames=JSON.parse(mareMatch[1]);
const paths=['父','父父','父父父','父父父父','父父母父','父母父','父母父父','父母母父','母父','母父父','母父父父','母父母父','母母父','母母父父','母母母父'];
const rows=[];
for(const sire of JSON.parse(seedMatch[1]).filter(x=>x.name==='ディープインパクト')){
 rows.push({id:sire.display_name,name:sire.name,variant:sire.variant,sex:'male',distance:'1600～2400',lineage:'サンデーサイレンス',factors:sire.factors,
  ancestry:paths.map((p,i)=>({path:p,horse:`${sire.variant}側祖先${i}`,factors:['速'],line:'Ro'}))});
}
for(const [i,name] of mareNames.entries())rows.push({id:name,name,variant:'',sex:'female',distance:'',lineage:'Some',factors:[],
 ancestry:paths.map((p,j)=>({path:p,horse:i<12&&j===0?'共通母父祖先':`牝系${i}祖先${j}`,factors:i<12?['速','長','走','中']:['速'],line:'Other'}))});
const store=new Map();const fakeEl=id=>({id,value:'speed',addEventListener(){},classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return []}});
const sandbox={console,Date,Map,Set,Math,JSON,Promise,URL,crypto:globalThis.crypto,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:{getElementById:fakeEl,addEventListener(){},querySelectorAll(){return []}},
 setTimeout(){},navigator:{},location:{protocol:'file:'}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;
vm.createContext(sandbox);
for(const file of ['research-audit.js','research-cross-check.js','research-quality.js','research-evidence.js','research-validation.js','research-transmission.js',
 'research-parent-theory-v56.js','research-mild-diversity-v60.js','research-direct-ancestor-v64.js','research-close-cross-v65.js',
 'research-maternal-route-v66.js','research-maternal-rescue-v66a.js','research-flow-guard.js','research-mild-lineage-v52.js','research-mild-gate-v51.js']){
 vm.runInContext(read(file),sandbox,{filename:file});
}
const before=source.slice(0,source.lastIndexOf('document.addEventListener(\'click\',e=>'));
vm.runInContext('const SEED='+seedMatch[1]+';'+before+`
window.__fullTest=(data,goal)=>{
 master=data;buildMap();const deep=maleRows().filter(x=>x.name==='ディープインパクト'&&isOwned(x));
 const anchor={set:deep.slice(0,3),kinds:['速','短','走','長','中','底'],base:'ディープインパクト'};
 const p=newPlan(anchor);p.goal=goal;p.routeDraft={layout:'maternal-g3',slots:{g3:deep[0].id,g4:deep[1].id,g5:deep[2].id}};
 p.steps=buildMaternal66Steps(p.routeDraft.slots);const found=opt66Find(p,'meihin_fast');
 if(!found.results?.length)return {error:found.message};
 auto21SetResearch(p,found.results[0]);state.plans=[p];state.homebreds=[];stagingAuto21=true;
 const created=[];for(let n=1;n<=9;n++){let x=makeChain09Foal(p,n);if(x.error){stagingAuto21=false;return {error:x.error,step:n}};created.push(x.horse)}
 stagingAuto21=false;const last=chain09Parents(p,9);
 const guard=window.DabimasFlowGuard41.verify(p,state.homebreds);
 const gate=window.DabimasMildGate51.inspect(p,last.ped,state.homebreds,{flowGuard:window.DabimasFlowGuard41,
  lineage:window.DabimasMildLineage52,validation:window.DabimasResearchValidation38,stageResolver:n=>chain09Parents(p,n)});
 return {plan:p,created,guard,gate,known:last.ped.known,errors:last.problems,route:guard.route};
};
})();`,sandbox,{filename:'app-v66b-test.js'});
for(const goal of ['speed','stamina']){
 const r=sandbox.__fullTest(rows,goal);
 assert(!r.error,`${goal}: ${JSON.stringify(r).slice(0,700)}`);
 assert.equal(r.route,'maternal-g3');assert.equal(r.created.length,9);
 assert.deepEqual(Array.from(r.created.map(h=>h.sex)),['male','female','male','male','male','male','female','male','male']);
 assert.equal(r.known,31);assert.equal(r.guard.ok,true,JSON.stringify(r.guard));
 assert.equal(r.gate.ok,true,JSON.stringify(r.gate));assert.equal(r.gate.gameVerified,false);
 // Exactly the screenshot's 4 failure strings are produced by the obsolete guard.
 const oldSandbox={module:{exports:{}},globalThis:{}};
 vm.runInNewContext(read('tests/fixtures/research-flow-guard-v65.js'),oldSandbox);
 const old=oldSandbox.module.exports.verify(r.plan,r.created);
 for(const expected of ['工程2：産駒の性別不一致','工程6：産駒の性別不一致','工程7：父母が未指定','工程7：父母リンクが不一致'])assert(old.failures.includes(expected),JSON.stringify(old.failures));
 // Keep parentage/sex checking strict: an actual bad link is still rejected.
 const altered=JSON.parse(JSON.stringify(r.created));altered[6].fatherId='誤った父';
 assert.equal(sandbox.DabimasFlowGuard41.verify(r.plan,altered).ok,false);
 console.log(`PASS v66b ${goal}: nine staged, 31/31, correct new guard+gate; old guard reproduces screenshot`);
}
assert(html.includes('value="maternal-auto" selected'));
assert(html.includes('research-flow-guard.js?v=67'));
assert(html.includes('app.js?v=69'));
assert(read('sw.js').includes('dbms-v69-1'));
