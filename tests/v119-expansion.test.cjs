'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const broad=require('../research-mild-broad-v119.js'),portfolio=require('../research-mild-portfolio-v119.js');
const parents=require('../research-parent-theory-v56.js'),inv=require('../research-inverse-mild-v69.js');
const realdata=require('../research-mild-realdata-v118.js');
let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS '+name)};
test('four routes distinguish base/sire/mare/both',()=>{
 assert.equal(broad.route({}),'direct');assert.equal(broad.route({sirePrep:{}}),'sireOnly');
 assert.equal(broad.route({basePrep:{}}),'mareOnly');assert.equal(broad.route({sirePrep:{},basePrep:{}}),'both');
});
test('missing registries fail closed',()=>{
 assert.equal(broad.inspect({}).ok,false);assert.equal(broad.inspect({master:[{id:'X'}],owned:{},inverse:inv,theory:parents}).ok,false);
});
test('portfolio does not confuse stored values with current verification',()=>{
 const data=[{id:'unverified',autoDesign21:{mode:'mild',race:'芝1200m'},mild67:{extraSireBirths:1,extraMareBirths:0},mild94:{ok:true},mild97:{ok:true},mild98:{ok:true}}];
 const a=portfolio.inspect({plans:data,realdata:{inspect:()=>({errors:['x'],structuralRefsOk:false})},buildStages:()=>[]});
 assert.equal(a.withSavedAudits,1);assert.equal(a.currentStructural,0);assert.equal(a.rows[0].gameVerified,false);assert.equal(a.rows[0].productionAuthorized,false);
});
test('unknown route remains unknown and old plans are not declared bad',()=>{
 const a=portfolio.inspect({plans:[{id:'old',autoDesign21:{mode:'mild'}}]});
 assert.equal(a.distribution.unknown,1);assert.equal(a.unreviewed,1);assert.equal(a.currentStructural,0);
});
test('portfolio produces deterministic workload order only, never SP estimates',()=>{
 const p=n=>({id:String(n),title:'case '+n,autoDesign21:{mode:'mild',race:'芝1600m'},
  mild67:{extraSireBirths:1,extraMareBirths:0},mild78:{additionalBirths:1},
  mild94:{ok:true},mild97:{ok:true,finalFingerprint:'f'+n},mild98:{ok:true}});
 const a=portfolio.inspect({plans:[p(2),p(1)],buildStages:()=>[],realdata:{inspect:()=>({structuralRefsOk:true,saved31:true,anchors:[1,2,3].map(()=>({sameRegisteredId:true,recordPresent:true})),rightsToConfirm:[],publicMares:[],errors:[]})}});
 assert.deepEqual(a.shortlist.map(x=>x.id),['1','2']);assert(a.shortlist.every(x=>x.gameVerified===false));
});

test('year-suffix alias is accepted only for the same registered variant',()=>{
 const cols=['DDS','SSSS','SDSSS'];
 const ancestors=Array.from({length:31},(_,i)=>({path:'X'+i,name:'unused'}));
 ancestors[2]={path:'DDS',name:'キングカメハメハ',variant:'2012'};
 ancestors[3]={path:'SSSS',name:'ディープインパクト',variant:'央獅'};
 ancestors[4]={path:'SDSSS',name:'ディープインパクト',variant:'翔燕'};
 const plan={autoDesign21:{mode:'mild'},routeDraft:{slots:{g3:'キングカメハメハ2012',g4:'ディープインパクト-央獅-',g5:'ディープインパクト-翔燕-'}},externalReview48:{parts:{foal:{ancestors}}}};
 const master=[{id:'キングカメハメハ2012',name:'キングカメハメハ',variant:'2012',sex:'male',factors:['速']},
  {id:'キングカメハメハ2013',name:'キングカメハメハ',variant:'2013',sex:'male'},
  {id:'ディープインパクト-央獅-',sex:'male'}, {id:'ディープインパクト-翔燕-',sex:'male'}];
 const ok=realdata.inspect({plan,stages:[],master,owned:{}}).anchors;
 assert.equal(ok[0].sameRegisteredId,true);assert.equal(ok[0].notationOnly,true);
 assert.equal(ok[1].sameRegisteredId,true);
 const wrong=realdata.inspect({plan:{...plan,routeDraft:{slots:{...plan.routeDraft.slots,g3:'キングカメハメハ2013'}}},stages:[],master,owned:{}}).anchors;
 assert.equal(wrong[0].sameRegisteredId,false);
});

const actual=process.env.DABIMAS_PORTABLE_JSON;
if(actual&&fs.existsSync(actual)){
 const data=JSON.parse(fs.readFileSync(actual,'utf8')),all=data.publicMaster.records;
 const registry=parents.buildMasterRegistry(all);
 const theory={...parents,lookup:n=>parents.lookup(n,registry),isQuarantined:n=>registry.quarantined.has(String(n||'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase())};
 const ranks=new Set(['アンフェアデッキ','トランピアス','コンディションアイ','ハイベロシティ','リュミエールレイン','マリアミラージュ','ピュアセレモニー','アルバトール','ウオッカ','エアグルーヴ','エリンバード','エンブレイスマイン','キャタリナ','キャピタリスト','グランチャント','グレイスプレスト','シームレスラウンド','シュガーハート','シンハライト','シーザリオ','スカーレットブーケ','スロープクラウン','タニノシスター','スウィートダウニー','テイクトゥハート','トエルフェスカ','トーンスタイル','ドリームフルール','ノースリアルト','ハルスコール','ハープスター','ハーベストムーン','ヒストリックスター','フォローアンジュ','ブラックエンブレム','ブランモンド','ベガ','ベルクリート','マリアライト','ミココノチカラ','ミッキークイーン','メジャーエンブレム','メジロフランシス','ルインズリープ','レイアンタレス','プリーストライン','ファルダーサイン','ブエナビスタ','シアンフェリア','サフメルディ','ソルベントステージ','ネイジュシエル','ビビッドカラー','ビワハイジ','ヴィブロス','ハルーワスウィート','ハリウッドドリーム','ベイルバリケイド','マジェスティレイ','ラフオーシャン','ラルジュメール','ヴィルシーナ']);
 const mareRank=r=>ranks.has(r.name||r.id)?'名牝':'未確認';
 let d;
 test('actual-owned and dynamic mare four-route precheck',()=>{
  const before=JSON.stringify(data.personal.owned);
  d=broad.inspect({owned:data.personal.owned,master:all,anchorId:'ディープインパクト-央獅-',
    theory,inverse:inv,mareRank,goal:'speed',limit:160});
  assert.equal(d.ok,true);assert.equal(d.sourceSummary.ownedRegistered,330);
  const matched=all.filter(r=>r.sex==='male'&&data.personal.owned[r.id]?.owned).length;
  const eligible=matched-all.filter(r=>r.sex==='male'&&r.id.startsWith('ディープインパクト')&&data.personal.owned[r.id]?.owned).length;
  assert.equal(d.sourceSummary.ownedWithPedigree,eligible);
  assert.equal(d.sourceSummary.publicMares,all.filter(x=>x.sex==='female').length);
  assert.equal(d.sourceSummary.registeredMeihin,62);
  assert.equal(d.expanded.stats.precheckedPrepared,eligible*d.sourceSummary.publicMares);
  assert.equal(d.expanded.stats.ranked, d.expanded.stats.availableDirect+d.expanded.stats.availableOptionalSires+d.expanded.stats.availableOptionalMares+d.expanded.stats.availableBothPrepared);
  assert.equal(d.expanded.stats.availableDirect,0);
  assert.equal(d.expanded.stats.availableOptionalMares,0);
  assert.match(d.caveat,new RegExp(`全${d.sourceSummary.publicMares}頭`));
  assert.equal(JSON.stringify(data.personal.owned),before);
  assert.equal(d.gameVerified,false);assert.equal(d.boundaries.full31Checked,false);
 });

 test('v119 actual portfolio independently rechecks every saved full-audit plan',()=>{
  const stages=p=>{const out=[],prep=p?.mild67?.prep;if(prep)out.push({kind:'prep',id:'P:sire',label:'準備1',sireId:prep.fatherId,mareId:prep.motherId,outputId:prep.foalId});
   for(const row of p?.mild98?.stages||[])if(row.kind==='core')out.push({kind:'core',id:row.id,label:'工程'+row.number,sireId:row.sire,mareId:row.mare,outputId:p?.chain09?.outputs?.[row.number]});return out;};
  const report=portfolio.inspect({plans:data.personal.plans,owned:data.personal.owned,master:all,homebreds:data.personal.homebreds,buildStages:stages,realdata});
  const mids=data.personal.plans.filter(p=>p?.autoDesign21?.mode==='mild');
  const complete=mids.filter(p=>p?.mild94?.ok&&p?.mild97?.ok&&p?.mild98?.ok).length;
  assert.equal(report.currentStructural,complete);assert.equal(report.currentIssues,0);
  assert.equal(report.unreviewed,mids.length-complete);assert.equal(report.shortlist.length,complete);
  assert.equal(report.shortlist.every(r=>r.gameVerified===false&&r.productionAuthorized===false),true);
 });
 test('all stored mild plans counted without writing or guessing',()=>{
  const input=JSON.stringify(data.personal.plans),p=portfolio.inspect({plans:data.personal.plans,owned:data.personal.owned,master:all,homebreds:data.personal.homebreds});
  const mids=data.personal.plans.filter(x=>x?.autoDesign21?.mode==='mild');
  const audits=mids.filter(x=>x?.mild94?.ok&&x?.mild97?.ok&&x?.mild98?.ok).length;
  assert.equal(p.total,mids.length);assert.equal(p.withSavedAudits,audits);assert.equal(p.unreviewed,mids.length-audits);
  assert.equal(p.distribution.sireOnly>=audits,true);assert.equal(JSON.stringify(data.personal.plans),input);
 });
 test('actual 10-step reference has no mismatch from independent read-only inspection',()=>{
  const p=data.personal.plans[0],prep=p.mild67.prep;
  const stages=[{kind:'prep',id:'P:sire',label:'準備1',sireId:prep.fatherId,mareId:prep.motherId,outputId:prep.foalId}];
  for(const a of p.mild98.stages.filter(x=>x.kind==='core'))stages.push({kind:'core',id:a.id,label:'工程'+a.number,sireId:a.sire,mareId:a.mare,outputId:p.chain09.outputs[a.number]});
  const x=realdata.inspect({plan:p,stages,owned:data.personal.owned,master:all,homebreds:data.personal.homebreds});
  assert.equal(x.structuralRefsOk,true);assert.equal(x.stages.length,10);assert.equal(x.rightsToConfirm.length,0);assert.equal(x.publicSires.filter(a=>a.recordedShortage>0).length,2);
  assert.equal(x.anchors.every(a=>a.sameRegisteredId),true);
 });
 // The actual 31-slot and production tests are not done here: the above is precheck only.
}
const root=path.join(__dirname,'..'),html=fs.readFileSync(root+'/index.html','utf8'),app=fs.readFileSync(root+'/app.js','utf8'),sw=fs.readFileSync(root+'/sw.js','utf8');
test('PWA wiring and SW cache include new modules and update query',()=>{
 assert.match(html,/research-mild-broad-v119\.js\?v=121/);assert.match(html,/research-mild-portfolio-v119\.js\?v=122/);
 assert.match(html,/app\.js\?v=125/);assert.match(sw,/dbms-v125-1/);
 assert.match(sw,/research-mild-broad-v119\.js/);assert.match(sw,/research-mild-portfolio-v119\.js/);
 assert.match(app,/mild119PreflightRun/);assert.match(app,/mild119RenderPortfolio/);
});
console.log('v119',passed,'PASS');
