'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const theory=require('../research-parent-theory-v56.js');
const dds=require('../research-maternal-dds-v67.js');
const root=path.join(__dirname,'..');
const L={Ro:'Royal Charger',Ne:'Nearctic',Nd:'Native Dancer',St:'St.Simon',He:'Herod',Na:'Nasrullah',Ma:'Matchem',Te:'Teddy',Ha:'Hampton',Sw:'Swynford',Ph:'Phalaris'};
const mareFixed=[L.Ro,L.Ne];
// Published Lord Kanaloa pedigree systems in the 2026-11-11 public CSV:
// interesting (sire father, sire paternal-maternal-sire, sire damsire, sire maternal-maternal-sire)
// = Nd Ne Ne St; matching = Ne He Na Ma.
function sireWith(interest,match){
 const paths=['父','父母父','母父','母母父','父父母父','父母母父','母父母父','母母母父'];
 const r={ancestry:paths.map((p,i)=>({path:p,horse:'一意の祖先'+i}))};
 const by=new Map(paths.map((p,i)=>['一意の祖先'+i,[...interest,...match][i]]));
 const api={lookup:(name)=>by.has(name)?{parent:by.get(name)}:null};
 return {sire:r,theory:api};
}
const lord=sireWith([L.Nd,L.Ne,L.Ne,L.St],[L.Ne,L.He,L.Na,L.Ma]);
const check=dds.sirePrecheck(lord.sire,lord.theory);
assert.equal(check.matchingPossible,false);
assert.equal(check.interestingPossible,false);
assert.equal(check.maxInterestingDistinct,6);
assert.equal(check.possible,false);
assert(check.reasons.some(x=>x.includes('面白系統の上限6種類')));
// The two missing mare slots X/Y can never repair a 6-type ceiling.
assert.equal(theory.interesting([L.Nd,L.Ne,L.Ne,L.St,L.Ro,L.Ne,L.Ha,L.Te],7).status,theory.NO);
console.log('PASS Lord Kanaloa (actual published systems): matching lacks Ro and interesting max=6, reject');
// All 8 interesting lines distinct and matching 4-type sets => super-perfect.
const ideal=sireWith([L.Nd,L.He,L.Ma,L.Na],[L.Ro,L.Ne,L.Ha,L.Te]);
const good=dds.sirePrecheck(ideal.sire,ideal.theory);
assert.equal(good.maxInterestingDistinct,8);assert.equal(good.possible,true);
assert.equal(good.superPerfectPossible,true);
assert.equal(theory.matching([L.Ro,L.Ne,L.Ha,L.Te],[L.Ne,L.Te,L.Ro,L.Ha]).status,theory.OK);
assert.equal(theory.interesting([L.Nd,L.He,L.Ma,L.Na,L.Ro,L.Ne,L.Ha,L.Te],8).status,theory.OK);
console.log('PASS theoretical 8-types and identical 4-type sets => super-perfect conditions');
// The official guide states duplication counts may differ, as long as the 4 types match.
assert.equal(theory.matching([L.Ro,L.Ne,L.Ne,L.Te],[L.Ro,L.Ro,L.Ne,L.Te]).status,theory.OK);
assert.equal(theory.matching([L.Ro,L.Ne,L.Ne,L.Te],[L.Ro,L.Ne,L.Te,L.Ha]).status,theory.NO);
assert.equal(theory.matching([L.Ro,L.Ne,L.Ne,null],[L.Ro,L.Ne,L.Te,L.Ha]).status,theory.NO);
assert.equal(theory.matching([L.Ro,L.Ne,null,null],[L.Ro,L.Ne,L.Te,L.Ha]).status,theory.UNKNOWN);
console.log('PASS official matching rule uses LINEAGE TYPES, not multiplicity, with unknown conservative');
// If one overlap among 4 distinct known sire interesting types, at most 7 => perfect, not super.
const seven=sireWith([L.Nd,L.Ne,L.Ma,L.Na],[L.Ro,L.Ne,L.Ha,L.Te]);
const pre7=dds.sirePrecheck(seven.sire,seven.theory);
assert.equal(pre7.maxInterestingDistinct,7);assert.equal(pre7.possible,true);assert.equal(pre7.superPerfectPossible,false);
assert.equal(theory.interesting([L.Nd,L.Ne,L.Ma,L.Na,L.Ro,L.Ne,L.Ha,L.Te],7).status,theory.OK);
assert.equal(theory.interesting([L.Nd,L.Ne,L.Ma,L.Na,L.Ro,L.Ne,L.Ha,L.Te],8).status,theory.NO);
console.log('PASS seven types may be perfect but never super-perfect');
// Protect against UNKNOWN being silently saved as established.
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
assert(app.includes('if(rank<2)continue; // no provisional UNKNOWN'));
assert(app.includes("opt66TheoryRank(initial.ranked[0]?.candidate)<2"));
assert(app.includes("opt66TheoryRank(base)<2"));
assert(!app.includes('if(rank===0)continue;'));
assert(app.includes('prunedInteresting68'));
console.log('PASS final and pre-save strict gates reject unknown theory without data loss');
