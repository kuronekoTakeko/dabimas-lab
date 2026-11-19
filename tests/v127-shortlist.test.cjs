'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const api=require('../research-mild-shortlist-v127.js');
const global87=require('../research-mild-global-v87.js');
let n=0;function check(label,fn){fn();n++;console.log('PASS '+label)}
const fake=(family,route,births,score,rank)=>({
 trial:{routeType:'dds',anchor:{base:'ディープインパクト',set:[{id:'ディープインパクト-央獅-'}]},draft:{routeDraft:{slots:{g3:'ディープインパクト-央獅-',g4:'ディープインパクト-煌魂-',g5:'ディープインパクト-翔燕-'}}}},
 rank:{candidate:{matches:3,full:{known:31,conflicts:[]},xPrep:route==='sireOnly'||route==='both'?{fatherId:family,motherId:'名牝A'}:null,
 marePrep:route==='mareOnly'||route==='both'?{fatherId:'母側父',motherId:'名牝B'}:null,xId:family,additionalBirths:births,theory66:{superPerfect:'成立'},score},oneExtra85:null,nitro107:null},identity:String(rank)});
const rows=[fake('種A','sireOnly',1,10,0),fake('種A','both',2,9,1),fake('種B','direct',0,9,2),fake('種C','mareOnly',1,8,3),fake('種D','both',2,7,4)];
const ranker={grade:c=>c.theory66?.superPerfect==='成立'?8:0,oneExtraEvidence:()=>({approved:false,compared:false}),compare:(a,b)=>b.candidate.score-a.candidate.score};
const finish={metric:c=>({score:c.score,independentCrossEvidence:0})};
check('ランキングの上位から父系の異なる3つを採用',()=>{const x=api.fromRanked({rows,ranker,finish});assert.equal(x.candidates.length,3);assert.deepEqual(x.candidates.map(c=>c.family),['種A','種B','種C']);assert.deepEqual(x.candidates.map(c=>c.rank),[1,3,4]);});
check('4構成の件数を保持し未観測を埋めない',()=>{const x=api.fromRanked({rows,ranker,finish});assert.deepEqual(x.distribution,{direct:1,sireOnly:1,mareOnly:1,both:2});assert.equal(x.completeSearch,false);});
check('父系が1種類のとき見かけの3案を水増ししない',()=>{const x=api.fromRanked({rows:rows.slice(0,2),ranker,finish});assert.equal(x.candidates.length,1);assert(x.selectedNotEnoughFamilies);});
check('31枠未完成は候補から排除する',()=>{const bad=structuredClone(rows[0]);bad.rank.candidate.full.known=30;const x=api.fromRanked({rows:[bad,rows[2]],ranker,finish});assert.deepEqual(x.candidates.map(c=>c.family),['種B']);});
check('不明の理論を合格候補と表示しない',()=>{const bad=structuredClone(rows[0]);bad.rank.candidate.theory66={};const x=api.fromRanked({rows:[bad],ranker,finish});assert.equal(x.eligible,0);});
check('候補側の権利数によって順位が変わらない',()=>{const a=structuredClone(rows);a[0].rank.candidate.rights=0;a[2].rank.candidate.rights=100;assert.deepEqual(api.fromRanked({rows:a,ranker,finish}).candidates.map(c=>c.family),api.fromRanked({rows,ranker,finish}).candidates.map(c=>c.family));});
check('候補レシピの元データに書き込みしない',()=>{const before=JSON.stringify(rows);api.fromRanked({rows,ranker,finish});assert.equal(JSON.stringify(rows),before);});
check('グローバルセレクタとv127の接続は元の選択を変更しない',()=>{
 globalThis.DabimasMildShortlist127=api;
 const more=rows.map(r=>({trial:r.trial,rank:r.rank}));
 const selected=global87.select([{...rows[0].trial,ranked:more.map(r=>r.rank)}],{ranker,finish});
 assert(selected.winner);assert.equal(selected.stats.shortlist127?.version,127);
 delete globalThis.DabimasMildShortlist127;
});
const jsonPath=process.env.DABIMAS_PORTABLE_JSON;
if(jsonPath){const data=JSON.parse(fs.readFileSync(jsonPath,'utf8'));const plans=data.personal?.plans||[];
 check('最新JSONから旧探索の代表候補を読み取れる',()=>{const p=plans.find(x=>x.id==='e78ca0b8-5f7a-47b9-863a-9ac2c919b6ac');const x=api.fromSaved(p);assert.equal(x.fresh,false);assert.equal(x.distribution.direct,0);assert.equal(x.distribution.sireOnly,18);assert.equal(x.distribution.both,54);assert(x.candidates.length>=1);assert.equal(x.fullSearch,false);});
 check('保存済みプランは再探索済みと偽装しない',()=>{const p=plans.find(x=>x.id==='e78ca0b8-5f7a-47b9-863a-9ac2c919b6ac');const x=api.fromSaved(p);assert(x.needsNewSearch);assert(x.source.includes('旧版'));});
 check('65件の保存済み全データと権利数を一切変更しない',()=>{const before=JSON.stringify(data);for(const p of plans)api.fromSaved(p);assert.equal(JSON.stringify(data),before);});
 check('v127に保存する新データは旧プランに副作用を持たない',()=>{const p=structuredClone(plans.find(x=>x.autoDesign21?.mode==='mild'));p.mild127=api.fromRanked({rows,ranker,finish});const x=api.fromSaved(p);assert(x.fresh);assert.equal(x.candidates.length,3);});
}
check('HTML・SW・アプリにモジュールを読み込む',()=>{
 const h=fs.readFileSync(root+'/index.html','utf8'),a=fs.readFileSync(root+'/app.js','utf8'),sw=fs.readFileSync(root+'/sw.js','utf8'),g=fs.readFileSync(root+'/research-mild-global-v87.js','utf8');
 assert.match(h,/research-mild-shortlist-v127\.js\?v=127/);assert.match(h,/app\.js\?v=127/);
 assert(h.indexOf('research-mild-shortlist-v127.js')<h.indexOf('research-mild-global-v87.js'));
 assert.match(a,/mild127ShortlistHtml\(p\)/);assert.match(a,/draft\.mild127/);
 assert.match(sw,/dbms-v127-1/);assert.match(sw,/research-mild-shortlist-v127\.js/);assert.match(g,/DabimasMildShortlist127/);
});
console.log(`v127: ${n} checks PASS`);
