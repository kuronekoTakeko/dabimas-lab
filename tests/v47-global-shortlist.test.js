'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const cp=require('node:child_process');
const api=require('../research-global-shortlist.js');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
let n=0;function test(name,fn){fn();n++;console.log('PASS',name)}
const trial=(id,scores)=>({anchor:{base:'ディープインパクト',set:[{id:id+'a'},{id:id+'b'},{id:id+'c'}]},ranked:scores.map(score=>({candidate:{idx:score},quality:{},evidence:{}}))});
const cmp=(a,b)=>b.candidate.idx-a.candidate.idx;
test('v4.7 shortlists across different center triples',()=>{
 const out=api.select([trial('A',[100,99,98]),trial('B',[97,96]),trial('C',[95])],3,cmp);
 assert.equal(out.length,3);assert.deepEqual(out.map(x=>x.trial.anchor.set[0].id),['Aa','Ba','Ca']);
});
test('remaining capacity filled by strongest other foundation',()=>{
 const out=api.select([trial('A',[100,98]),trial('B',[95])],3,cmp);
 assert.deepEqual(out.map(x=>x.rank.candidate.idx),[100,95,98]);
});
test('bounded and non-destructive selection',()=>{
 const trials=[trial('A',[10]),trial('B',[8])];const snapshot=JSON.stringify(trials);
 assert.equal(api.select(trials,1,cmp).length,1);assert.equal(api.select(trials,0,cmp).length,0);
 assert.equal(JSON.stringify(trials),snapshot);
});
test('invalid trials excluded',()=>assert.equal(api.select([null,{}, {ranked:[{}]}],3,cmp).length,0));
test('hard route evaluation spans shortlisted center sets',()=>{
 assert(app.includes('viableAnchorTrials.push(trial)'));
 assert(app.includes('DabimasGlobalShortlist49?.select(viableAnchorTrials,4') || app.includes('DabimasGlobalShortlist47?.select(viableAnchorTrials,3'));
 assert(app.includes('for(const item of shortlist)'));
 assert(app.includes('selected=chosenAnchor;hardCompared=compared;hardTrial=chosenTrial'));
});
test('selected center set persisted with hard route and comparison scope',()=>{
 assert(app.includes('selectedVariants:selected.set.map(r=>r.id)'));
 assert(app.includes("hardDeepCompared:mode==='hard'?hardCompared:null"));
 assert(app.includes("mareTests:mode==='hard'?hardTrial.researched.tests:researched.tests"));
});
test('new module loads before app, offline cache holds it',()=>{
 assert(html.indexOf('research-global-shortlist.js?v=47')<html.indexOf('app.js?v=55'));
 assert(sw.includes('research-global-shortlist.js'));
 assert(sw.includes('dbms-v55-1'));
});
test('all JS modules parse',()=>{
 for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.js')))cp.execFileSync('node',['--check',path.join(root,file)]);
});
console.log(`${n} v4.7 tests passed`);
