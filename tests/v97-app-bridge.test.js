'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8'),api=require('../research-mild-readiness-v97.js');
const html=read('index.html'),seed=html.match(/const SEED=(\[[^;]+\]);<\/script>/);assert(seed);
const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',addEventListener(){},querySelectorAll(){return []},classList:{add(){},remove(){}}});return elements.get(id)};
const original={version:13,owned:{mf:{owned:true,rights:0}},plans:[],homebreds:[],genomes:[],added:[]},saved=JSON.stringify(original);
const ctx={console,Date,JSON,Map,Set,Math,Promise,URL,crypto:globalThis.crypto,
 document:{getElementById:el,addEventListener(){},querySelectorAll(){return []}},navigator:{},location:{protocol:'file:'},setTimeout(){},
 localStorage:{getItem:k=>k==='dabimas_lab_v02_state'?saved:null,setItem(){throw Error('should never persist')}},
 DabimasMildReadiness97:api,DabimasMildSiblings95:{inspect:()=>({version:95,blocked:false})}};
ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
const src=read('app.js'),body=src.slice(0,src.lastIndexOf("document.addEventListener('click',e=>"));
vm.runInContext('const SEED='+seed[1]+';'+body+`
const paths=['S'];let layer=['S'];for(let i=2;i<=5;i++){layer=layer.flatMap(x=>['S'+x,'D'+x]);paths.push(...layer)};
const pRows=paths.map((p,i)=>({path:p,name:'馬'+i,factors:['速'],line:'ヘイルトゥリーズン系'}));
const ped={known:31,conflicts:[],rows:pRows};
const male={id:'MF',sex:'male',isHomebred:false},female={id:'MA',sex:'female',isHomebred:false};
findParentHorse=id=>id==='MF'?male:id==='MA'?female:null;
horseSex=h=>h?.sex||'unknown';getFoalPedigree=()=>ped;
chain09Parents=(p,n)=>({sireId:'MF',mareId:'MA',sire:male,mare:female,ped,ready:true,problems:[]});
chain09Output=(p,n)=>({horse:{id:'foal'+n},reused:false});
chain09ClosureStep=()=>8;mild69PrepStages=()=>[];
window.__v97bridge=()=>{
 const p={id:'p97',steps:Array.from({length:9},()=>({})),goal:'speed',target:'公式BC想定：芝1200m',
  autoDesign21:{mode:'mild',goal:'speed',race:'芝1200m'},mild94:{ok:true},hard23:{preparations:[{father:'MF',mother:'MA',label:'母系1代仕込み'}]}};
 const first=mild97LiveReport(p,false);p.mild97=first;
 const second=mild97LiveReport(p,true);
 const view=mild97ReadinessHtml(p);
 p.target='公式BC想定：ダート1200m';const changed=mild97LiveReport(p,true);
 return {first,second,view,changed};
};})();`,ctx,{filename:'app.js'});
const x=ctx.__v97bridge();assert(x.first.ok,x.first.errors.join('/'));assert(x.second.ok,x.second.errors.join('/'));
assert.equal(x.first.preparations,1,'hard23 graft counted');assert.equal(x.first.plannedMatingCount,10);
assert.match(x.view,/基幹9工程＋準備1工程/);assert.match(x.view,/公開繁殖牝馬の確保/);assert.doesNotMatch(x.view,/種付け権利に注意/);
assert(!x.changed.ok);assert.match(x.changed.errors.join('／'),/目標レース/);
console.log('PASS v97 app bridge: stage9 + hard23 preparation, stored snapshot, live diagnostics and goal drift');
