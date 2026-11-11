
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const guard=require('../research-direct-ancestor-v64.js');
const sunday={id:'サンデーサイレンス-覇煌-',name:'サンデーサイレンス'};
const deep={id:'ディープインパクト-煌魂-',name:'ディープインパクト'};
const mare={name:'自家製牝馬',ancestry:[{path:'S',horse:'ディープインパクト'},{path:'SS',horse:'サンデーサイレンス'},{path:'D',horse:'ノーザンテースト'}]};
assert.equal(guard.inspect(sunday,mare).blocked,true);
assert.deepEqual(guard.inspect(sunday,mare).paths,['SS']);
assert.equal(guard.inspect({name:'サンデーサイレンス-神速-'},mare).blocked,true);
assert.equal(guard.inspect(deep,mare).blocked,true);
assert.equal(guard.inspect({name:'ノーザンテースト'},mare).blocked,true);
assert.equal(guard.inspect({name:'バックパサー'},mare).blocked,false);
assert.equal(guard.inspect({name:'バックパサー'},{ancestry:[]}).unknown,true);
assert.equal(guard.inspect({name:'サンデーサイレンス'},{ancestry:[{path:'SS',horse:'サンデーサイレンス1989'}]}).blocked,true);
const app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
assert(app.includes('if(ancestor64.blocked)conflicts.push('));
assert(app.includes('if(ped.conflicts.length||ped.known!==31)return null;')); // Reject from all nine steps
assert(app.includes('if(ped.directAncestor?.blocked)problems.push('));
assert(html.indexOf('research-direct-ancestor-v64.js?v=64')<html.indexOf('app.js?v=69'));
assert(sw.includes('research-direct-ancestor-v64.js'));
console.log('PASS v64: direct ancestor block, variant-normalization, trial and manual linkage');
