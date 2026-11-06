const assert=require('node:assert/strict');
const fs=require('node:fs');
const audit=require('../research-audit.js');
const cross=require('../research-cross-check.js');
const quality=require('../research-quality.js');
const evidence=require('../research-evidence.js');
const v38=require('../research-validation.js');
const original=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
let passed=0;
function test(title,fn){fn();passed++;console.log('PASS',title);}
const ids=['a','b','c'];
function pedigree(factorSets=[['短','速','長'],['底','中'],['走']],n='A'){
 const rows=audit.expectedPaths().map(path=>({path,name:'別馬'+path, factors:['短'],line:'Ne',factorVariant:'通常'}));
 for(const [i,path] of ['SSS','DSSS','DDDSS'].entries()){
  const x=rows.find(r=>r.path===path);x.name=n;x.factorVariant='変種'+i;x.factors=factorSets[i];
 }
 return {rows};
}
const p=pedigree();
test('31 valid pedigree slots',()=>assert.equal(audit.audit(p,{anchorIds:ids}).known,31));
test('six kinds, six instances are recorded separately',()=>{let a=v38.inspect(p,ids);assert.equal(a.sixKindCase,true);assert.equal(a.totalKnownFactors,6);assert.equal(a.distinctFactorTypes,6);});
test('four kinds six instances remain reported-only',()=>{const a=v38.inspect(pedigree([['短','速'],['底','長'],['短','速']]),ids);assert.equal(a.reportedFourKindCase,true);assert.equal(a.sixKindCase,false);assert.equal(a.gameVerified,false);});
test('same name with duplicate ID is not eligible',()=>assert.equal(v38.inspect(p,['a','a','b']).sixKindCase,false));
test('missing factor data is not assumed to be zero',()=>assert.equal(v38.inspect(pedigree([['短','速'],[],['底','長']]),ids).factorEvidenceComplete,false));
test('distinct names fail anchor check',()=>{const q=pedigree();q.rows.find(r=>r.path==='DDDSS').name='B';assert.equal(v38.inspect(q,ids).sameName,false);});
test('same variant inconsistent factors flagged',()=>{const q=pedigree();q.rows.find(r=>r.path==='DDDSS').factorVariant='変種0';assert.equal(v38.inspect(q,ids).variantFactorConflicts.length,1);});
test('same variant consistent factors not flagged',()=>{const q=pedigree([['短','速'],['底','長'],['短','速']]);q.rows.find(r=>r.path==='DDDSS').factorVariant='変種0';assert.equal(v38.inspect(q,ids).variantFactorConflicts.length,0);});
test('inconsistent evidence ranked below consistent',()=>{const q=pedigree();q.rows.find(r=>r.path==='DDDSS').factorVariant='変種0';assert(v38.compare(v38.inspect(p,ids),v38.inspect(q,ids))<0);});
test('cross side differences detected',()=>{const q=pedigree();assert(cross.inspect(q).crossSide.some(x=>x.name==='A'));});
test('quality and v37 evidence API remain compatible',()=>{assert.equal(quality.inspect(p,ids).unavailable,false);assert.equal(evidence.inspect(p,ids).unavailable,false);});
test('ownership JSON has 315 recorded stallions',()=>assert.equal(Object.keys(original.owned).length,315));
test('zero-rights stallions remain owned',()=>assert(Object.values(original.owned).some(x=>x.owned===true&&x.rights===0)));
test('data payload has no plan records',()=>assert.deepEqual(original.plans,[]));
test('app code keeps zero-right ownership and plan persistence',()=>{const s=fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8');assert(s.includes('function isOwned('));assert(s.includes('SAVE_KEY'));assert(!s.includes('DabimasResearchValidation38.save('));});
console.log(`${passed} tests passed`);
