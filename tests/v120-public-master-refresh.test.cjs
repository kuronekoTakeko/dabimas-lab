'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('../research-master-update-v120.js');
const make=(id,factors=['速'],ancestry=[])=>({id,name:id,variant:'',sex:'male',factors,ancestry,lineage:'A',distance:'1200m〜2400m'});
let tests=0;const t=(n,fn)=>{fn();tests++;console.log('PASS',n)};
t('read-only diff compares new / updated / older-not-in-new while preserving old ID',()=>{
 const shared=Array.from({length:106},(_,i)=>make('共通馬'+i));
 const existing=[...shared,make('馬A'),make('馬B'),make('キングカメハメハ2012')];
 const incoming=[...shared,make('馬A',['短']),make('馬C'),make('キングカメハメハ2013')];
 const snap=JSON.stringify(existing);
 const q=api.compare(existing,incoming);
 assert.equal(q.summary.oldCount,109);assert.equal(q.summary.publishedCount,109);assert.equal(q.summary.finalCount,111);
 assert.equal(q.summary.added,2);assert.equal(q.summary.modifiedStructural,1);assert.equal(q.summary.notInLatest,2);
 assert.equal(q.merged.find(x=>x.id==='馬B').sourceUnlisted120,true);
 assert.equal(q.merged.find(x=>x.id==='馬A').factors[0],'短');
 assert.equal(q.merged.find(x=>x.id==='キングカメハメハ2012').sourceUnlisted120,true);
 assert.equal(q.merged.find(x=>x.id==='キングカメハメハ2013').sourceUnlisted120,undefined);
 assert.equal(JSON.stringify(existing),snap);
});
t('reappear of old publication clears sourceUnlisted flag',()=>{
 const former={...make('復帰馬'),sourceUnlisted120:true};
 const a=api.compare([former],[make('復帰馬'),...Array.from({length:105},(_,i)=>make('新'+i))]);
 assert.equal(a.summary.restored,1);
 assert.equal(a.merged.find(x=>x.id==='復帰馬').sourceUnlisted120,undefined);
});
t('only changed soft attributes are tracked separately from pedigree',()=>{
 const existing=Array.from({length:104},(_,i)=>make('horse'+i));
 const incoming=existing.map(x=>({...x}));incoming[0]={...incoming[0],distance:'1000m〜3000m'};
 const q=api.compare(existing,incoming);
 assert.equal(q.summary.modifiedAttributes,1);assert.equal(q.summary.modifiedStructural,0);assert.equal(q.summary.notInLatest,0);
});
t('reject malformed or short CSV and keep caller arrays untouched',()=>{
 const e=Array.from({length:150},(_,i)=>make('old'+i));
 assert.throws(()=>api.compare(e,[make('incomplete')]),/不完全/);
 assert.throws(()=>api.compare(e,null),/不正/);
 assert.equal(e.length,150);
});
const json=process.env.DABIMAS_PORTABLE_JSON;
if(json&&fs.existsSync(json)){
 const input=JSON.parse(fs.readFileSync(json,'utf8'));
 const before=JSON.stringify(input.personal);
 const old=input.publicMaster.records;
 t('actual v113 portable master is unchanged after dry-run',()=>{
  const r=api.compare(old,old);
  assert.equal(r.summary.publishedCount,old.length);assert(old.length>=100);
  assert.equal(r.summary.added,0);assert.equal(r.summary.notInLatest,0);
  assert.equal(r.summary.modifiedStructural,0);
  assert.equal(JSON.stringify(input.personal),before);
 });
 t('synthetic CSV extension + mare is accepted without altering owned 330',()=>{
  const fake=[...old, {...make('v120テスト追加牡馬'),sex:'male'}, {...make('v120テスト追加牝馬'),sex:'female',distance:''}];
  const q=api.compare(old,fake);
  assert.equal(q.summary.added,2);assert.equal(q.summary.finalCount,old.length+2);
  assert.equal(Object.values(input.personal.owned).filter(x=>x.owned).length,330);
  assert.equal(JSON.stringify(input.personal),before);
 });
}
t('app import does not overwrite state, performs save before master swap, update module referenced',()=>{
 const dir=path.join(__dirname,'..'),app=fs.readFileSync(dir+'/app.js','utf8'),html=fs.readFileSync(dir+'/index.html','utf8'),sw=fs.readFileSync(dir+'/sw.js','utf8');
 assert.match(app,/DabimasMasterUpdate120/);
 assert.match(app,/if\(!\(await saveMaster\(newMaster\)\)\)throw/);
 assert.match(app,/master=newMaster;masterAudit86=dedup.audit/);
 assert.match(html,/research-master-update-v120\.js\?v=120/);
 assert.match(html,/app\.js\?v=128/);
 assert.match(sw,/dbms-v128-1/);
 assert.match(sw,/research-master-update-v120\.js/);
});
console.log('v120',tests,'PASS');
