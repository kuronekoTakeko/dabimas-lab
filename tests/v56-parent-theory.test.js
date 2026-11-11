'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const theory=require('../research-parent-theory-v56.js');
const audit=require('../research-audit.js');
const root=path.resolve(__dirname,'..');
let passed=0;
function check(label,fn){fn();passed++;console.log('PASS',label);}
const systems=theory.PARENTS;
const paths=audit.expectedPaths();
function scenario({parents={},names={},conflicts=[],transmission=null}={}){
 const rows=paths.map(p=>({path:p,name:names[p]??('馬'+p),line:'ロベルト系',factors:[]}));
 const registry={names:new Map(),sources:new Map()};
 for(const [p,v] of Object.entries(parents)){
  const k=rows.find(r=>r.path===p)?.name;
  if(k){registry.names.set(k.toLowerCase(),v);registry.sources.set(k.toLowerCase(),new Set(['https://dabimas.jp/kouryaku/stallions/example.html']));}
 }
 return {pedigree:{rows,conflicts,transmission},registry};
}
check('15 parent systems use canonical official spelling; do not alias child-system labels',()=>{
 assert.equal(systems.length,15);assert.equal(theory.canonical('Hamptom'),'Hampton');assert.equal(theory.canonical('ニアークティック'),'Nearctic');
 assert.equal(theory.canonical('ロベルト系'),null);assert.equal(theory.canonical('ノーザンダンサー系'),null);
});
check('four official profiles with exact 15 entries provide 49 unique, conflict-free names',()=>{
 assert.equal(theory.PROFILES.length,4);assert.equal(theory.REGISTRY.names.size,49);assert.equal(theory.REGISTRY.conflicts.length,0);
 assert.equal(theory.lookup('ディープインパクト').parent,'Royal Charger');
 assert.equal(theory.lookup('リファール').parent,'Nearctic');
 assert.equal(theory.lookup('ノーザンテースト').parent,'Nearctic');
 assert.equal(theory.lookup('ロベルト').parent,'Royal Charger');
 assert.equal(theory.lookup('架空の馬'),null);
});
check('parent line is derived via verified paternal ancestor, not a child-system column',()=>{
 let a=scenario({parents:{SSS:'Royal Charger'}}),r=theory.inspect(a.pedigree,{registry:a.registry});
 assert.equal(r.lineages.SS,'Royal Charger');assert.equal(r.lineages.SSS,'Royal Charger');
 a=scenario();r=theory.inspect(a.pedigree,{registry:a.registry});
 assert.equal(r.evidenceCount,0);assert.equal(r.perfect,theory.UNKNOWN);
});
check('seven distinct interesting systems plus matching four leads to perfect',()=>{
 const interest=[...theory.FAMILIES.interestingSire,...theory.FAMILIES.interestingMare];
 const matching=[...theory.FAMILIES.matchingSire];
 const assigned=Object.fromEntries(interest.map((p,i)=>[p,systems[i===7?6:i]]));
 // Mare matching uses the same four ancestor positions as its interesting set.
 matching.forEach((p,i)=>assigned[p]=assigned[theory.FAMILIES.matchingMare[i]]);
 const x=scenario({parents:assigned});const r=theory.inspect(x.pedigree,{registry:x.registry});
 assert.equal(r.interesting,theory.OK);assert.equal(r.matching,theory.OK);
 assert.equal(r.perfect,theory.OK);assert.equal(r.superPerfect,theory.NO);
 assert.equal(r.gameVerified,false);
});
check('eight distinct interesting systems plus match leads to super-perfect',()=>{
 const interesting=[...theory.FAMILIES.interestingSire,...theory.FAMILIES.interestingMare];
 const assigned=Object.fromEntries(interesting.map((p,i)=>[p,systems[i]]));
 theory.FAMILIES.matchingSire.forEach((p,i)=>assigned[p]=assigned[theory.FAMILIES.matchingMare[i]]);
 const x=scenario({parents:assigned}),r=theory.inspect(x.pedigree,{registry:x.registry});
 assert.equal(r.perfect,theory.OK);assert.equal(r.superPerfect,theory.OK);
});
check('known repeated interesting ancestors block 8-line theory even with incomplete evidence',()=>{
 const x=scenario({parents:{SS:'Nearctic',SDS:'Nearctic'}}),r=theory.inspect(x.pedigree,{registry:x.registry});
 assert.equal(r.interestingEight,theory.NO);assert.equal(r.superPerfect,theory.NO);
 assert.equal(r.perfect,theory.UNKNOWN);
});
check('confirmed mismatch blocks matching and perfect even if other slots unknown',()=>{
 const x=scenario({parents:{SSSDS:'Nearctic',SSDDS:'Nearctic',SDSDS:'Nearctic',SDDDS:'Nearctic',DS:'Royal Charger',DSDS:'Royal Charger',DDS:'Royal Charger'}});
 const r=theory.inspect(x.pedigree,{registry:x.registry});
 assert.equal(r.matching,theory.NO);assert.equal(r.perfect,theory.NO);assert.equal(r.superPerfect,theory.NO);
});
check('unavailable records are unknown not false; partial conflict returns unknown',()=>{
 const x=scenario({parents:{SS:'Nearctic'}});
 let r=theory.inspect(x.pedigree,{registry:x.registry});
 assert.equal(r.perfect,theory.UNKNOWN);assert(r.missing.length>0);
 r=theory.inspect({...x.pedigree,conflicts:['DSS:parent mismatch']},{registry:x.registry});
 assert.equal(r.blocked,true);assert.equal(r.perfect,theory.UNKNOWN);assert.equal(r.miracle,theory.UNKNOWN);
});
check('miracle matches any one sire-side fourth-generation sire to DDS, not only SSSS',()=>{
 const x=scenario({names:{SSDS:'リファール-覇閃-',DDS:'リファール-迅闘-'}});
 let r=theory.inspect(x.pedigree,{registry:x.registry});
 assert.equal(r.miracleCross,theory.OK);assert.deepEqual(r.miraclePaths,['SSDS']);
 assert.equal(r.miracle,theory.UNKNOWN); // perfection unverified
});
check('4x3 across siblings or distinct horses is not accepted as identical',()=>{
 const x=scenario({names:{SSSS:'ヒズマジェスティ',DDS:'グロースターク',SSDS:'ランダムＡ',SDSS:'ランダムＢ',SDDS:'ランダムＣ'}});
 const r=theory.inspect(x.pedigree,{registry:x.registry});
 assert.equal(r.miracleCross,theory.NO);assert.equal(r.miracle,theory.NO);
});
check('source conflicts block a single parent-system assignment rather than choosing last',()=>{
 const p=theory.PROFILES[0];
 const conflicting={...p,pairs:p.pairs.map(x=>[...x])};conflicting.pairs[0][1]='Nearctic';
 const registry=theory.buildRegistry([p,conflicting]);
 assert.equal(registry.conflicts.length,1);assert.equal(theory.lookup('ヘイルトゥリーズン',registry),null);
});
check('no mutation of pedigree or inventory records',()=>{
 const x=scenario({parents:{SS:'Nearctic',DDS:'Royal Charger'}});const before=JSON.stringify(x.pedigree);
 theory.inspect(x.pedigree,{registry:x.registry});assert.equal(JSON.stringify(x.pedigree),before);
 const owned=JSON.parse(fs.readFileSync('/mnt/data/dabimas_315_clean_start_v33 (1).json','utf8'));
 assert.equal(Object.keys(owned.owned).length,315);assert.equal(Object.values(owned.owned).filter(v=>v.owned&&v.rights===0).length,277);
});
check('v5.6 only adds a module, UI readout, versioned scripts/cache; Shiko remains unconfirmed',()=>{
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert(app.includes('function mild56TheoryHtml(plan)'));assert(app.includes('chain09Parents(plan,closingStep)'));
 assert(app.includes('${mild56TheoryHtml(plan)}'));assert(app.includes('mild56TheoryHtml(p)+chain09FinalAudit(p)'));
 assert(html.indexOf('research-parent-theory-v56.js?v=68a')<html.indexOf('app.js?v=69'));
 assert(sw.includes("'./research-parent-theory-v56.js'"));assert(sw.includes('dbms-v69-1'));
 assert(app.includes('至高のゲーム内成立を保証する判定ではありません。'));
 assert(app.includes('const SAVE_KEY=\'dabimas_lab_v02_state\''));
});
console.log(`${passed} v5.6 parent-system theory tests passed`);
