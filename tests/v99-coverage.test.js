const assert=require('node:assert/strict');
const coverage=require('../research-mild-coverage-v99.js');
const horse=(id,sex,ancestry=15)=>({id,sex,ancestry:Array.from({length:ancestry},(_,i)=>({horse:'X'+i})),factors:['速']});
const owned={'A-神速-':{owned:true,rights:0},'B-神速-':{owned:true,rights:2},'C-神速-':{owned:false,rights:0}};
let r=coverage.inspect({owned,master:[horse('A-神速-','male'),horse('名牝','female')],sexOf:x=>x.sex,selected:['A-神速-']});
assert.equal(r.ownedCount,2);assert.equal(r.matched,1);assert.equal(r.zeroRights,1);assert.equal(r.usable,1);assert.equal(r.mares,1);assert.equal(r.canRun,true);assert.deepEqual(r.missing,['B-神速-']);
r=coverage.inspect({owned,master:[horse('A-神速-','male')],sexOf:x=>x.sex});assert.equal(r.canRun,false);assert.match(r.errors.join(),/繁殖牝馬/);
r=coverage.inspect({owned,master:[horse('A-神速-','male'),horse('名牝','female',3)],sexOf:x=>x.sex});assert.equal(r.canRun,false);
r=coverage.inspect({owned,master:[horse('A-神速-','male'),horse('名牝','female')],selected:['別馬'],sexOf:x=>x.sex});assert.equal(r.canRun,false);
const before=JSON.stringify(owned);coverage.inspect({owned,master:[],sexOf:x=>x.sex});assert.equal(JSON.stringify(owned),before);
console.log('PASS v99 exact ownership, zero rights, missing CSV, incomplete mares, selected ID, read-only');

const fs=require('node:fs'),path=require('node:path');const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),app=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');assert(html.indexOf('research-mild-coverage-v99.js?v=99')<html.indexOf('app.js?v=99'));assert(app.includes('coverageBanner99+((autoPick||familyPick)'));assert(sw.includes('research-mild-coverage-v99.js'));console.log('PASS v99 app/index/sw wiring');
