'use strict';
// Synthetic 31-slot pedigrees, no public CSV or in-game theory claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),source=read('app.js');
const seedMatch=html.match(/const SEED=(\[[^;]+\]);<\/script>/);
const mareMatch=source.match(/const RANK12_MEIHIN=new Set\((\[[^;]+\])\.map\(key\)\);/);
assert(seedMatch&&mareMatch);
const paths=['父','父父','父父父','父父父父','父父母父','父母父','父母父父','父母母父','母父','母父父','母父父父','母父母父','母母父','母母父父','母母母父'];
const deep=JSON.parse(seedMatch[1]).filter(x=>x.name==='ディープインパクト');
const rows=deep.map(d=>({id:d.display_name,name:d.name,variant:d.variant,sex:'male',distance:'1200-2600',lineage:'ヘイルトゥリーズン系',factors:d.factors,
 ancestry:paths.map((p,i)=>({path:p,horse:`${d.variant}祖先${i}`,factors:['速'],line:'系統'+i}))}));
for(let i=0;i<32;i++)rows.push({id:`試験種牡馬${i}`,name:`試験種牡馬${i}`,variant:'',sex:'male',distance:'1600m',lineage:'系統'+i,factors:['速','長'],
 ancestry:paths.map((p,j)=>({path:p,horse:`試験種牡馬${i}祖先${j}`,factors:['速'],line:'系統'+i}))});
for(const [i,name] of JSON.parse(mareMatch[1]).entries())rows.push({id:name,name,variant:'',sex:'female',distance:'',lineage:'ダミー名牝',factors:[],
 ancestry:paths.map((p,j)=>({path:p,horse:`名牝${i}祖先${j}`,factors:['長'],line:'牝系'+i}))});
const fakeEl=id=>({id,value:'speed',addEventListener(){},classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return []}}),store=new Map();
const box={console,Date,Map,Set,Math,JSON,Promise,URL,crypto:globalThis.crypto,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
 document:{getElementById:fakeEl,addEventListener(){},querySelectorAll(){return []}},setTimeout(){},navigator:{},location:{protocol:'file:'}};
box.window=box;box.globalThis=box;vm.createContext(box);
for(const f of ['research-audit.js','research-cross-check.js','research-quality.js','research-evidence.js','research-validation.js','research-transmission.js',
 'research-parent-theory-v56.js','research-mild-diversity-v60.js','research-direct-ancestor-v64.js','research-close-cross-v65.js',
 'research-maternal-route-v66.js','research-maternal-dds-v67.js','research-maternal-rescue-v66a.js','research-flow-guard.js',
 'research-mild-lineage-v52.js','research-mild-gate-v51.js'])vm.runInContext(read(f),box,{filename:f});
const before=source.slice(0,source.lastIndexOf("document.addEventListener('click',e=>"));
vm.runInContext('const SEED='+seedMatch[1]+';'+before+`
window.__test67=(incoming,goal)=>{
 master=incoming;buildMap();
 for(const sire of maleRows().filter(r=>r.name.startsWith('試験種牡馬')))state.owned[key(sire.id)]={owned:true,rights:0};
 const deep=maleRows().filter(r=>r.name==='ディープインパクト'&&isOwned(r));
 const anchor={set:deep.slice(0,3),kinds:['速','短','走','長','中','底'],base:'ディープインパクト'};
 const p=newPlan(anchor);p.goal=goal;
 p.routeDraft={layout:'maternal-dds-g3',slots:{g3:deep[0].id,g4:deep[1].id,g5:deep[2].id}};
 p.steps=buildMaternal66Steps(p.routeDraft.slots,'maternal-dds-g3');
 const found=opt67Find(p,'meihin_fast');if(!found.results.length)return {error:found.message,tests:found.tests};
 const candidate=found.results[0];auto21SetResearch(p,candidate);state.plans=[p];state.homebreds=[];stagingAuto21=true;
 if(candidate.xPrep){const prep=mild67StagePreparation(p,candidate.xPrep);if(prep.error)return {error:prep.error};chain09Data(p).xId=prep.horse.id;}
 const created=[];for(let n=1;n<=9;n++){const v=makeChain09Foal(p,n);if(v.error)return {error:v.error,step:n};created.push(v.horse)}
 stagingAuto21=false;const pair=chain09Parents(p,9);
 const guard=window.DabimasFlowGuard41.verify(p,state.homebreds),
 gate=window.DabimasMildGate51.inspect(p,pair.ped,state.homebreds,{flowGuard:window.DabimasFlowGuard41,
  lineage:window.DabimasMildLineage52,validation:window.DabimasResearchValidation38,stageResolver:n=>chain09Parents(p,n)});
 return {p,candidate,created,guard,gate,pair,tests:found.tests,prep:state.homebreds.find(x=>x.mild67Prep)||null};
};})();`,box);
assert.equal(box.DabimasMaternalDDS67.validateGraph().ok,true);
const inherited=box.DabimasMaternalDDS67.sirePrecheck({ancestry:[
 {path:'父父母父',horse:'未確認の祖先'},
 {path:'父父母父父',horse:'登録祖先Ro'}
]}, {lookup:name=>name==='登録祖先Ro'?{parent:'Royal Charger'}:null});
assert.equal(inherited.matching[0],'Royal Charger','parent-line inference must follow normalized ancestor path');
assert.equal(box.DabimasMaternalDDS67.routePriority('dds'),3);
assert(box.DabimasMaternalDDS67.routePriority('dds')>box.DabimasMaternalDDS67.routePriority('maternal'));
assert(box.DabimasMaternalDDS67.routePriority('maternal')>box.DabimasMaternalDDS67.routePriority('paternal'));
assert(source.includes('DabimasMaternalDDS67?.routePriority(trial.routeType)'),'cross-anchor auto route priority must be enforced');
assert(source.includes('追加準備｜締め肌の父Aを1代生産'),'optional father prep must be visible in plan');
assert.equal(JSON.stringify(box.DabimasMaternalDDS67.derivedPaths()),JSON.stringify({g3:'DDS',g4:'SSSS',g5:'SDSSS'}));
// A controlled synthetic confirmed-theory oracle is required for the old
// graph integration fixtures: they contain no reliable parent-system evidence.
// The unmodified engine MUST reject those fixtures (tested below).
const originalTheory=box.DabimasParentTheory56;
box.DabimasParentTheory56={...originalTheory,inspect(ped){return {perfect:'成立',superPerfect:'成立',blocked:false,evidenceCount:8,gameVerified:false}}};
for(const goal of ['speed','stamina']){
 const result=box.__test67(rows,goal);assert(!result.error,`${goal}: ${JSON.stringify(result).slice(0,700)}`);
 assert.equal(result.created.length,9);assert.equal(result.guard.ok,true,JSON.stringify(result.guard));
 assert.equal(result.gate.ok,true,JSON.stringify(result.gate));assert.equal(result.guard.route,'maternal-dds-g3');
 assert.equal(result.pair.ped.known,31);assert.equal(result.created[0].sex,'female');assert.equal(result.created[1].sex,'female');
 assert.equal(result.created[1].motherId,result.created[0].id);assert.equal(result.created[8].motherId,result.created[1].id);
 const by=new Map(result.pair.ped.rows.map(x=>[x.path,x]));assert.equal(by.get('DDS').name,'ディープインパクト');
 const copy=JSON.parse(JSON.stringify(result.created));copy[1].motherId='不正な母';assert.equal(box.DabimasFlowGuard41.verify(result.p,copy).ok,false);
 console.log(`PASS v67 DDS ${goal}: 9 stages, 31/31, guard+gate, invalid parent rejected, checks=${result.tests}`);
}

// Force an artificial theory verdict ONLY for the optional one-generation sire.
// This tests the fallback's actual graph, not real game theory/evidence.
box.DabimasParentTheory56={...originalTheory,inspect(ped){
 const root=ped?.rows?.find(x=>x.path==='S')?.name||'';
 if(root.includes('自家製締め肌父A'))return {perfect:'成立',superPerfect:'成立',evidenceCount:8,gameVerified:false};
 return {perfect:'未確認',superPerfect:'未確認',evidenceCount:0,gameVerified:false};
}};
const fallback=box.__test67(rows,'speed');
assert(!fallback.error,JSON.stringify(fallback).slice(0,700));
assert(fallback.candidate.xPrep,'fallback must select exactly one new sire');
assert(fallback.prep&&fallback.prep.mild67Prep,'optional sire prep must be a distinct recorded horse');
assert.equal(fallback.prep.sex,'male');
assert.equal(fallback.created[1].fatherId,fallback.prep.id);
assert.equal(fallback.guard.ok,true,JSON.stringify(fallback.guard));
assert.equal(fallback.gate.ok,true,JSON.stringify(fallback.gate));
console.log('PASS v67 optional one-generation sire: a separate male prep, real father/mother linkage, 31 slots (synthetic verdict only)');

// Confirmed failure cannot silently pass as a DDS closing-mare plan.
box.DabimasParentTheory56={...originalTheory,inspect(){return {perfect:'不成立',superPerfect:'不成立',blocked:false,evidenceCount:8,gameVerified:false};}};
const rejected=box.__test67(rows,'speed');
assert(rejected.error,'verified no-match should be rejected, not saved as a nine-step DDS plan');
console.log('PASS v67 confirmed-impossible closing theories are rejected and can trigger legacy route fallback');

// No parent-line evidence: the real unmocked engine must not save UNKNOWN.
box.DabimasParentTheory56=originalTheory;
const noEvidence=box.__test67(rows,'speed');
assert(noEvidence.error,'unverified mating must not be returned as a successful DDS plan');
console.log('PASS v68a no unverified automatic DDS closing mare saved');
