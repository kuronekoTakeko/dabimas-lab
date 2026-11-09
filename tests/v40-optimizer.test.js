const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const mod=require('../research-optimizer.js');
let count=0;
function test(name,fn){fn();console.log('PASS',name);count++;}
function trial({score=10,stages=9,total=4,ind=2,sp4=2,st4=2,sp5=1,st5=1,conflicts=0,factors={速:2,中:2}}={}){
 return {stages,cross:{total,independentCount:ind},metrics:{score,sp4,st4,sp5,st5,conflicts,factor4_5:factors}};
}
const base=trial();
test('reject ungrounded score inflation',()=>assert.equal(mod.inspect(base,trial({score:20,stages:10})).adopt,false));
test('accept independent resolved cross improvement',()=>assert.equal(mod.inspect(base,trial({score:12,stages:11,total:5,ind:3})).adopt,true));
test('reject low benefit per extra mating',()=>assert.equal(mod.inspect(base,trial({score:10.4,stages:11,total:5})).adopt,false));
test('accept strong four-generation speed lineage gain',()=>assert.equal(mod.inspect(base,trial({score:11,stages:10,sp4:3}),'speed').adopt,true));
test('reject side effect of losing cross evidence',()=>assert.equal(mod.inspect(base,trial({score:100,stages:10,total:3,sp4:4})).adopt,false));
test('reject loss of independent crossings',()=>assert.equal(mod.inspect(base,trial({score:100,stages:10,ind:1,sp4:4})).adopt,false));
test('reject additional ancestor conflicts',()=>assert.equal(mod.inspect(base,trial({score:100,stages:10,total:6,conflicts:1})).adopt,false));
test('positional factor improvement is tangible',()=>assert.equal(mod.inspect(base,trial({score:10.7,stages:10,factors:{速:3,中:2}})).adopt,true));
test('do not count unrelated factor for speed',()=>assert.equal(mod.inspect(base,trial({score:20,stages:10,factors:{速:2,中:2,難:9}}),'speed').adopt,false));
test('prefer fewer steps when efficiency ties',()=>assert(mod.compare(trial({score:11,stages:10,total:5}),trial({score:10.65,stages:9,total:5}))>0));
test('original storage metadata unchanged',()=>{const json=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const before=JSON.stringify(json);mod.inspect(base,trial());assert.equal(JSON.stringify(json),before);assert.equal(Object.keys(json.owned).length,315);});
test('runtime references decision module in bounded search',()=>{const src=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');assert(src.includes('hard40Decision(current,trial,goal)'));assert(src.includes('hard40Decision(best,bestX,goal)'));});
test('new script loaded before app',()=>{const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert(html.indexOf('research-optimizer.js?v=40')<html.indexOf('app.js?v=46'));});
console.log(count+' v4.0 tests passed');
