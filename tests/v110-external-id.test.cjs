const assert=require('node:assert/strict');
const fs=require('node:fs');
const review=require('../research-external-review.js');
const base='/mnt/data/dabimas_pedigree_crosscheck_098b50e3-d25e-4525-8c4b-b83e34e01832.txt';
const txt=fs.readFileSync(base,'utf8');
function parseReport(t){
 const anchors=Object.fromEntries((t.match(/^至高指定：(.+)$/m)[1]).split(' / ').map(s=>s.split('=')));
 const parts={};let section='';let rows=[];
 for(const line of t.split(/\r?\n/)){
  const sec=line.match(/^【(種|肌|最終産駒)：/);
  if(sec){section=sec[1];rows=[];parts[section]=rows;continue;}
  const cells=line.split('\t');
  if(section&&/^[SD]{0,4}S$/.test(cells[0]||'')&&cells.length===6)rows.push({path:cells[0],name:cells[1],variant:cells[2]==='未確認'?'':cells[2],factors:cells[3]==='未確認'?[]:cells[3].split('・'),line:cells[4],source:cells[5]});
 }
 return review.make({planTitle:'キングカメハメハ・実測TXT照合',anchorSlots:anchors,foalRows:parts['最終産駒'],sireRows:parts['種'],mareRows:parts['肌']});
}
const r=parseReport(txt);
let a=review.auditEvidence(r);
assert.equal(a.anchors.length,3);
assert.equal(a.anchors[2].target,'SDSSS');
assert.equal(a.anchors[2].positionMatched,true);
assert.equal(a.anchors[2].notationOnly,true);
assert.equal(a.anchors[2].masterIdVerified,false);
assert.equal(a.issues.some(x=>x.includes('g5')),false);
assert.match(review.format(r),/年号付きIDは表記形式のみ一致/);
const broken=JSON.parse(JSON.stringify(r));broken.anchorSlots.g5='キングカメハメハ2013';
a=review.auditEvidence(broken);
assert.equal(a.anchors[2].positionMatched,false);
assert(a.issues.some(x=>x.includes('g5')));
const missing=JSON.parse(JSON.stringify(r));missing.parts.foal.ancestors.find(x=>x.path==='SDSSS').variant='';
a=review.auditEvidence(missing);
assert.equal(a.anchors[2].positionMatched,false);
const other=JSON.parse(JSON.stringify(r));other.parts.foal.ancestors.find(x=>x.path==='SDSSS').name='別の馬';
a=review.auditEvidence(other);
assert.equal(a.anchors[2].positionMatched,false);
const normal=JSON.parse(JSON.stringify(r));
normal.anchorSlots.g5='キングカメハメハ-2012-';
a=review.auditEvidence(normal);
assert.equal(a.anchors[2].positionMatched,true);
assert.equal(a.anchors[2].notationOnly,false);
for(const key of ['g3','g4'])assert.equal(a.anchors.find(x=>x.key===key).positionMatched,true);
assert.equal(r.parts.foal.known,31);
assert.equal(r.parts.foal.ancestors.filter(x=>x.name&&!x.factors.length).length,18);
console.log('PASS v110: real TXT 2012 alias, negative year/blank/name, conventional form, 31 slots');
