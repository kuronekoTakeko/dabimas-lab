'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const inv=require('../research-inverse-mild-v69.js');
const parents=require('../research-parent-theory-v56.js');
const sys=['Native Dancer','Nearctic','Nasrullah','Royal Charger','St.Simon','Himyar','Hampton','Matchem','Swynford','Teddy','Fairway','Herod'];
const paths=['S','DS','SDS','DDS','SSDS','SDDS','DSDS','DDDS'];
function horse(id,values,sex){const ancestry=paths.map((p,i)=>({path:p,horse:id+'祖先'+p,parentSystem:values[i]||'Nasrullah'}));
 return {id,name:id,sex,factors:['速','長'],ancestry,owned:sex==='male'};}
const canon=v=>parents.canonical(v),lookup=()=>null;const theory={canonical:canon,lookup};
// e.g. homebred sire F x M: distinct interesting 4 and sire matching contains Ro/Ne,
// all 8 types distinct => precheck super-perfect. Mare father/maternal grandfather
// must supply the remaining two matching types of the closing-mare pairing.
const f=horse('所持種牡馬F',[sys[2],sys[4],sys[6],sys[7],sys[7],sys[3],sys[7],sys[7]],'male');
const m=horse('種牡馬準備名牝M',[sys[6],sys[5],sys[1],sys[0],sys[2],sys[4],sys[2],sys[4]],'female');
const sig=inv.preparedSignatures(f,m,theory);assert.equal(sig.interesting.length,4);assert.equal(sig.matching.length,4);
assert.equal(sig.matching[0],sys[6]);
const eight=inv.describe({interesting:['St.Simon','Himyar','Hampton','Matchem'],matching:['Royal Charger','Nearctic','Native Dancer','Swynford']});
assert.equal(eight.eligible,true);assert.equal(eight.distinct,8);
assert.deepEqual(inv.describe({interesting:['Nearctic','Native Dancer','Nearctic','St.Simon'],matching:['Nearctic','Herod','Nasrullah','Matchem']}).eligible,false);
assert.deepEqual(inv.matchingBaseKeys(['Nearctic','Royal Charger','Native Dancer','Swynford']),['Native Dancer|Swynford']);
assert.equal(inv.mareMatches(['Native Dancer','Swynford'],['Nearctic','Royal Charger','Swynford','Native Dancer']),true);
assert.equal(inv.mareMatches(['Native Dancer','Matchem'],['Nearctic','Royal Charger','Swynford','Native Dancer']),false);
assert.equal(inv.compare({distinct:8,additionalBirths:1,score:1,sireName:'a',baseName:'a'},
 {distinct:7,additionalBirths:0,score:999,sireName:'b',baseName:'b'})<0,true,'a one-stage super-perfect outranks direct perfect');
assert.equal(inv.compare({distinct:8,additionalBirths:2,score:999,sireName:'a',baseName:'a'},
 {distinct:8,additionalBirths:1,score:1,sireName:'b',baseName:'b'})>0,true,'equal theory prefers fewer stages');
const actual=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');
assert(actual.includes('opt69Find(draft'));
assert(actual.includes('mild67StagePreparation(draft,base.marePrep,\'female\')'));
assert(actual.includes('mild67StagePreparation(draft,base.xPrep,\'male\')'));
assert(actual.includes('theoryGrade<7||theoryGrade!==recipe.distinct'));
assert(actual.includes("mode==='mild'?(a.candidate.additionalBirths||0)-(b.candidate.additionalBirths||0)"));
const page=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
assert(page.indexOf('research-inverse-mild-v69.js?v=69')<page.indexOf('app.js?v=610'));
assert(sw.includes('dbms-v610-1')&&sw.includes('research-inverse-mild-v69.js'));
assert(!fs.existsSync(path.join(__dirname,'../mydata.csv')),'third-party master must not be silently vendored');
console.log('PASS v6.9 sire-first 8 slots, Ro/Ne, super before perfect, fewer births, prep links, PWA cache and saved-data isolation');
