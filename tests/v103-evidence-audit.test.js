const assert=require('node:assert/strict');const fs=require('node:fs');const api=require('../research-external-review.js');
const text=fs.readFileSync(process.argv[2],'utf8');
const parts={};let which='';for(const line of text.split(/\r?\n/)){
 if(line.startsWith('【種（')){which='sire';parts[which]=[];continue;}
 if(line.startsWith('【肌（')){which='mare';parts[which]=[];continue;}
 if(line.startsWith('【最終産駒')){which='foal';parts[which]=[];continue;}
 if(line.startsWith('【外部照合'))which='';
 const cols=line.split('\t');if(which&&/^[SD]{0,4}S$/.test(cols[0]||''))parts[which].push({path:cols[0],name:cols[1],variant:cols[2]==='未確認'?'':cols[2],factors:cols[3]==='未確認'?[]:cols[3].split('・'),line:cols[4]});
}
const r=api.make({sire:{name:'父'},mare:{name:'母'},foalRows:parts.foal,sireRows:parts.sire,mareRows:parts.mare,anchorSlots:{g3:'ディープインパクト-央獅-',g4:'ディープインパクト-煌魂-',g5:'ディープインパクト-翔燕-'}});
const a=api.auditEvidence(r);
assert.equal(a.registeredSlots,31);assert.deepEqual(a.anchors.map(x=>x.target),['DDS','SSSS','SDSSS']);assert.ok(a.anchors.every(x=>x.positionMatched),JSON.stringify(a.anchors));assert.ok(a.unknownFactors.length>0);assert.ok(a.unknownVariants.length>0);assert.equal(a.gameVerified,false);assert.ok(a.sharedNames.length>0);
const report=api.format(r);assert.ok(report.includes('【v103｜登録血統の根拠監査'));assert.ok(report.includes('検証済み'));assert.ok(report.includes('因子未収録'));
const broken=api.make({sire:{},mare:{},foalRows:parts.foal.filter(x=>x.path!=='DDS'),sireRows:[],mareRows:[],anchorSlots:r.anchorSlots});assert.ok(api.auditEvidence(broken).issues.some(x=>x.includes('g3')));
const varied=api.make({sire:{},mare:{},foalRows:parts.foal.map(x=>x.path==='DDS'?{...x,variant:'誤表示'}:x),sireRows:[],mareRows:[],anchorSlots:r.anchorSlots});assert.ok(api.auditEvidence(varied).issues.some(x=>x.includes('異因名不一致')));
console.log('v103: 7 evidence assertions passed; shared names:',a.sharedNames.length,'unknown factor slots:',a.unknownFactors.length,'unknown variants:',a.unknownVariants.length);
