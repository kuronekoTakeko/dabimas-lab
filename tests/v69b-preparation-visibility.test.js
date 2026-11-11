'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(base,n),'utf8');
const handlers={},ui=new Map();
function fakeEl(id){if(ui.has(id))return ui.get(id);const node={id,value:'',textContent:'',innerHTML:'',classList:{add(){},remove(){}},addEventListener(type,cb){handlers[id+':'+type]=cb;},querySelectorAll(){return []},querySelector(){return null},scrollIntoView(){}};ui.set(id,node);return node;}
const store=new Map(),ctx={console,Date,Map,Set,Math,JSON,Promise,URL,crypto:globalThis.crypto,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:{getElementById:fakeEl,addEventListener(){},querySelectorAll(){return []}},navigator:{},location:{protocol:'file:'},setTimeout(){}};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(read('research-maternal-dds-v67.js'),ctx);
const html=read('index.html'),seed=html.match(/const SEED=(\[[^;]+\]);<\/script>/);assert(seed);
const source=read('app.js'),body=source.slice(0,source.lastIndexOf("document.addEventListener('click',e=>"));
vm.runInContext('const SEED='+seed[1]+';'+body+`
window.__stageTest={
 prepare(p,homes){state.plans=[p];state.homebreds=homes;openPlanId=p.id;},
 total:mild69FlowCount, extras:mild69PrepStages, editor:mild69PrepEditor,
 flow:auto21Flow, showList:renderSavedPlans,
 getPlan:id=>state.plans.find(p=>p.id===id), home:()=>state.homebreds,
};})();`,ctx);
const api=ctx.__stageTest;
const core=Array.from({length:9},(_,i)=>({uid:'step-'+(i+1),title:'基幹'+(i+1),cross:'種牡馬×繁殖牝馬',sex:i===1?'牝':'牡',done:false}));
const old={id:'old',title:'旧プラン',status:'構想',steps:core,source:{members:[]}};
api.prepare(old,[]);assert.equal(api.total(old),9);assert.equal(api.extras(old).length,0);assert.equal(api.editor(old),'');
const sirePrep={fatherId:'ナリタトップロード-極煌-',motherId:'エンブレイスマイン',foalId:'draft-sire'};
const marePrep={fatherId:'所持馬B',motherId:'名牝B',foalId:'draft-mare'};
const prepared={id:'new',title:'DDS 10工程',status:'構想',routeDraft:{layout:'maternal-dds-g3',slots:{}},steps:core.map(x=>({...x})),source:{members:[]},mild50:{productionStages:10},mild67:{prep:sirePrep,extraSireBirths:1,extraMareBirths:0}};
const homes=[{id:'draft-sire',name:'締め肌父・仮',mode:'draft',sex:'male',fatherId:sirePrep.fatherId,motherId:sirePrep.motherId}];
api.prepare(prepared,homes);assert.equal(api.total(prepared),10,'9 core + 1 prerequisite');
let box=api.editor(prepared);assert.match(box,/準備1｜締め肌の父を1代生産/);assert.match(box,/ナリタトップロード-極煌-/);assert.match(box,/エンブレイスマイン/);assert.match(box,/締め肌父・仮/);assert.match(box,/生産順 1\/10/);assert.match(box,/data-m69-field="done"/);
let flow=api.flow(prepared);assert.match(flow,/合計10工程／基幹9枠/);assert(flow.indexOf('準備1｜')<flow.indexOf('工程1｜'),'the prerequisite must appear BEFORE core stage1');
api.showList();assert.match(ui.get('savedPlans').innerHTML,/0\/10工程/);
const input=handlers['planEditor:input'];assert.equal(typeof input,'function','editor input listener must exist');
input({target:{dataset:{m69Field:'done'},value:'true',closest:()=>({dataset:{m69Kind:'sire'}})}});
assert.equal(prepared.mild67.prepProgress.sire.done,true);assert.equal(api.total(prepared),10);assert.equal(homes[0].mode,'draft','progress must NOT turn an unbred draft into a real horse');
api.showList();assert.match(ui.get('savedPlans').innerHTML,/1\/10工程/);
assert.match(api.editor(prepared),/完了（手動記録）/);
const two={...prepared,id:'two',mild50:{productionStages:11},mild67:{prep:sirePrep,marePrep,prepProgress:{}}};api.prepare(two,[...homes,{id:'draft-mare',name:'基礎牝・仮',mode:'draft'}]);
assert.equal(api.total(two),11);let twoFlow=api.flow(two);assert.match(twoFlow,/合計11工程／基幹9枠/);assert(twoFlow.indexOf('準備1｜')<twoFlow.indexOf('準備2｜')&&twoFlow.indexOf('準備2｜')<twoFlow.indexOf('工程1｜'));
assert.match(api.editor(two),/準備2｜ディープに付ける基礎牝馬を1代生産/);
console.log('PASS v6.9b: 9 / 10 / 11 births, prerequisite cards, full production order, actual parent names, completion notes, persistence, and no real-horse promotion');
