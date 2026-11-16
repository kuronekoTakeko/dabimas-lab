const assert=require('node:assert/strict');const fs=require('node:fs');const api=require('../research-mild-distance-audit-v104.js');
function parse(path){const t=fs.readFileSync(path,'utf8');const foal=t.split('【最終産駒')[1].split('【')[0].split(/\r?\n/).map(x=>x.split('\t')).filter(x=>/^[SD]{0,4}S$/.test(x[0]||''));return foal.map(x=>({path:x[0],name:x[1],variant:x[2]==='未確認'?'':x[2],factors:x[3]==='未確認'?[]:x[3].split('・')}));}
const a=api.review({foalRows:parse(process.argv[2])},{race:'芝1200m',goal:'balance'});
const b=api.review({foalRows:parse(process.argv[3])},{race:'芝2400m',goal:'balance'});
assert.equal(a.registeredSlots,31);assert.equal(b.registeredSlots,31);assert.equal(a.unknownFactorSlots,19);assert.equal(b.unknownFactorSlots,19);
assert.equal(a.emphasis,'speed');assert.equal(b.emphasis,'stamina');assert.equal(a.goalDiffersFromDistanceLens,true);assert.equal(b.goalDiffersFromDistanceLens,true);
assert.deepEqual(a.indicators,b.indicators);assert.equal(api.compare(a,b).sameAnchors,true);
assert.equal(api.raceMeters('芝2400m'),2400);assert.equal(api.raceMeters('未設定'),null);
const empty=api.review({foalRows:[]},{race:'芝2000m'});assert.equal(empty.registeredSlots,0);assert.equal(empty.gameVerified,false);
console.log('v104 distance evidence: PASS; indicators=',JSON.stringify(a.indicators));
