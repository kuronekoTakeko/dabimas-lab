'use strict';
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const mod=require('../research-mild-live-audit-v124.js');const root=path.join(__dirname,'..');
let passed=0;function check(name,fn){fn();passed++;console.log('PASS',name);}
const dataPath=process.env.DABIMAS_PORTABLE_JSON;
if(dataPath){
 const portable=JSON.parse(fs.readFileSync(dataPath,'utf8'));
 const plans=portable.personal.plans;
 const latest=plans.filter(p=>['e78ca0b8-5f7a-47b9-863a-9ac2c919b6ac','b3a4425b-3b45-4778-bef4-e903a1a6d55f','233ea3d7-9b09-43c9-99dc-221b9f9064d8'].includes(p.id));
 const hb=portable.personal.homebreds,master=portable.publicMaster.records;
 const get=(p,homebreds=hb)=>mod.assess({plan:p,homebreds,master});
 check('最新の3プランは正しく揃う',()=>assert.equal(latest.length,3));
 check('各プラン10交配の登録父母一致',()=>{for(const p of latest){const x=get(p);assert.equal(x.checkedStages,10);assert.equal(x.checkedParents,10,JSON.stringify(x.errors));}});
 check('各プラン93/93祖先・至高3IDが一致',()=>{for(const p of latest){const x=get(p);assert.equal(x.registeredAncestorsChecked,93);assert.equal(x.registeredAncestorMatches,93);assert.equal(x.anchorIdsInMaster,3);assert.equal(x.fullyReconciled,true,JSON.stringify([x.errors,x.unconfirmed]));}});
 check('全30登録は仮馬、実生産と判定しない',()=>assert(latest.every(p=>{const x=get(p);return x.draftCount===10&&x.realCount===0&&!x.authorizedForBreeding&&!x.gameVerified}))); 
 check('公開マスター/所有情報/保存プランを変更しない',()=>{const before=JSON.stringify(portable);for(const p of latest)get(p);assert.equal(JSON.stringify(portable),before);});
 check('仮馬の父を1箇所変えた場合に検出する',()=>{const p=latest[0],out=p.chain09.outputs['4'];const copy=hb.map(h=>h.id===out?{...h,fatherId:'架空の別馬'}:h);const x=get(p,copy);assert.equal(x.fullyReconciled,false);assert(x.errors.some(a=>a.includes('父母ID')));});
 check('最終仮馬の因子を変えた場合に検出する',()=>{const p=latest[0],out=p.chain09.outputs['9'];const copy=hb.map(h=>h.id===out?{...h,ancestry:h.ancestry.map(a=>a.path==='DDS'?{...a,factors:['底']}:a)}:h);const x=get(p,copy);assert(!x.fullyReconciled);assert(x.errors.some(a=>a.includes('foal：祖先DDS')));});
 check('プラン側の母馬だけを変えた場合に検出する',()=>{const p=structuredClone(latest[0]);p.chain09.mares['4']='別の繁殖牝馬';const x=get(p);assert(!x.fullyReconciled);assert(x.errors.some(a=>a.includes('現行プランの指定父母')));});
 check('他プランの産駒を不正に転用した場合に検出する',()=>{const p=structuredClone(latest[0]);p.chain09.outputs['3']=latest[2].chain09.outputs['3'];const x=get(p);assert(!x.fullyReconciled);});
 check('仮馬のプランID変更を検出',()=>{const p=latest[0],out=p.chain09.outputs['2'];const copy=hb.map(h=>h.id===out?{...h,planId:'別プラン'}:h);const x=get(p,copy);assert(x.errors.some(a=>a.includes('プランID')));});
 check('保存時照合がない旧案は未確認にする',()=>{const old=plans.find(p=>p.autoDesign21?.mode==='mild'&&!p.mild98?.stages?.length);assert(old);const x=get(old);assert(!x.fullyReconciled);assert(x.unconfirmed.length>0);});
 check('同じIDの自家製馬が二重登録された場合に検出',()=>{const p=latest[0],item=hb.find(h=>h.id===p.chain09.outputs['1']);const x=get(p,[...hb,item]);assert(!x.fullyReconciled);assert(x.errors.some(a=>a.includes('重複')));});
}
check('画面とService Workerがv124モジュールを参照',()=>{const html=fs.readFileSync(root+'/index.html','utf8');const app=fs.readFileSync(root+'/app.js','utf8');const sw=fs.readFileSync(root+'/sw.js','utf8');assert.match(html,/research-mild-live-audit-v124\.js\?v=124/);assert.match(app,/mild124LiveHtml\(p\)/);assert.match(sw,/dbms-v125-1/);assert.match(sw,/research-mild-live-audit-v124\.js/);});
console.log('v124 new checks: '+passed+' PASS');
