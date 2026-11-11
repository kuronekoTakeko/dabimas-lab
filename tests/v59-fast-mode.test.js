'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const tests=[
 ['fast mode is opt-in visible and initially checked',()=>assert.match(html, /id="auto21Fast" checked/)],
 ['fast mode applies to mild, not hard',()=>assert.match(app,/const fast=mode==='mild'&&\(\$\('auto21Fast'\)\?\.checked!==false\)/)],
 ['fast mode bounds the 6-mare and X slate',()=>{assert.match(app,/mares\.pool=mares\.pool\.slice\(0,12\)/);assert.match(app,/orderCandidates\(x\.pool/)}],
 ['fast mode reduces repeated refinements',()=>{for(const p of ['budget:fast?90:900','budget:fast?50:420','budget:fast?70:360','budget:fast?30:180'])assert(app.includes(p));}],
 ['full search remains available when disabled',()=>assert(app.includes("fast?'meihin_fast':'meihin'"))],
 ['saving schema and ownership untouched',()=>{assert(app.includes("const SAVE_KEY='dabimas_lab_v02_state'"));assert(!app.includes('state.owned={}'))}],
 ['version and cache updated',()=>{assert(html.includes('v6.9'));assert(sw.includes('dbms-v69-1'))}]
];for(const [name,fn] of tests){fn();console.log('PASS',name)}console.log(tests.length+' v5.9 tests passed');
