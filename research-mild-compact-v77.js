/* v7.7 | Eight-birth DDS/SDDS/SDSSS structural feasibility research.
 * Methodology checked 2026-11-12:
 * - 3x4x5 and six-factor Shiko prerequisites are player-researched:
 *   https://note.com/huh_ds/n/n0eb8a439d3f3
 *   https://note.com/takana_mmdd/n/nff464f9f1292
 * - Early 2x2/2x3/3x2 avoidance is this PWA's CONSERVATIVE v6.5 guard,
 *   NOT a confirmed official prohibition or proof of the game's minimum.
 * - The result assumes distinct fixed studs and every intermediate newly bred.

 * Research-only: not a playable plan or proof of in-game Shiko.
 * All eight matings must be backed by actual 31-slot pedigree calculations;
 * no branch is allowed to skip a breeding or treat an unknown factor as known.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildCompact77=api;
})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const paths=Object.freeze({g3:'DDS',g4:'SDDS',g5:'SDSSS'});
 const definitions=Object.freeze([
  {n:1,sireSlot:'g3',mareInput:true,sex:'female',title:'ディープ直仔の牝馬'},
  {n:2,sireSlot:'g4',mareInput:true,sex:'female',title:'父母母の牝馬'},
  {n:3,sireSlot:'g5',mareInput:true,sex:'male',title:'父母父父の牡馬'},
  {n:4,sireStep:3,mareInput:true,sex:'male',title:'父母父の牡馬'},
  {n:5,sireStep:4,mareStep:2,sex:'female',title:'父母の牝馬（2枝を合流）'},
  {n:6,sireInput:'closingSire',mareStep:1,sex:'female',title:'最終締め肌'},
  {n:7,sireInput:'paternalSire',mareStep:5,sex:'male',title:'最終種牡馬'},
  {n:8,sireStep:7,mareStep:6,sex:'male',title:'最終産駒'}
 ].map(x=>Object.freeze(x)));
 function validateGraph(defs=definitions){
  const out=new Map(),errors=[];
  for(const d of defs){
   if(d.n!==out.size+1||out.has(d.n))errors.push('工程番号が重複・順序不正');
   if(!!d.sireSlot+!!d.sireStep+!!d.sireInput!==1||!!d.mareStep+!!d.mareInput!==1)errors.push(`工程${d.n}の親指定が不正`);
   if(d.sireStep&&out.get(d.sireStep)?.sex!=='male')errors.push(`工程${d.n}の父性別が不正`);
   if(d.mareStep&&out.get(d.mareStep)?.sex!=='female')errors.push(`工程${d.n}の母性別が不正`);
   out.set(d.n,d);
  }
  if(out.size!==8)errors.push('8工程ではありません');
  return {ok:!errors.length,errors};
 }
 function derive(defs=definitions){
  function pathTo(n,g,seen=new Set()){
   const d=defs.find(x=>x.n===n);if(!d||seen.has(n))return null;
   if(d.sireSlot===g)return 'S';
   const next=new Set(seen);next.add(n);
   const throughS=d.sireStep?pathTo(d.sireStep,g,next):null;
   if(throughS)return 'S'+throughS;
   const throughD=d.mareStep?pathTo(d.mareStep,g,next):null;
   return throughD?'D'+throughD:null;
  }
  return Object.fromEntries(['g3','g4','g5'].map(g=>[g,pathTo(8,g)]));
 }
 const norm=s=>String(s??'').normalize('NFKC').replace(/[\s\u3000]/g,'').toLowerCase();
 const factorSignature=v=>(v||[]).map(norm).sort().join('|');
 function checkFinal(ped,members){
  const errors=[],rows=ped?.rows||[],by=new Map(rows.map(x=>[x.path,x]));
  if(ped?.known!==31||rows.length!==31||ped?.conflicts?.length||ped?.transmission?.conflicts?.length||ped?.transmission?.invalid?.length)errors.push('最終31枠の矛盾または未収録');
  for(const [g,path] of Object.entries(paths)){
   const r=members?.[g],actual=by.get(path);
   if(!r||!actual||norm(actual.name)!==norm(r.name)||factorSignature(actual.factors)!==factorSignature(r.factors)||!(r.factors||[]).length)
    errors.push(`${g}:${path}で祖先・因子が一致しません`);
  }
  const names=Object.values(members||{}).map(r=>norm(r?.name));
  if(names.length!==3||new Set(names).size!==1)errors.push('至高3異因名が同じ種牡馬を指していません');
  const variants=Object.values(members||{}).map(r=>norm(r?.id));
  if(new Set(variants).size!==3)errors.push('異因名が3種類必要');
  if(new Set(Object.values(members||{}).flatMap(r=>r?.factors||[])).size<6)errors.push('指定祖先の因子種類が6未満');
  return {ok:!errors.length,errors,gameVerified:false};
 }
 function simulate({members,mares,closingSire,paternalSire,breed,makeChild,inspectClosing}={}){
  const errors=[],outputs={},pedigrees={},validGraph=validateGraph();
  if(!validGraph.ok||JSON.stringify(derive())!==JSON.stringify(paths))return {ok:false,stage:0,errors:['8工程の親子構造が不正'],gameVerified:false};
  for(const d of definitions){
   const sire=d.sireSlot?members?.[d.sireSlot]:d.sireStep?outputs[d.sireStep]:d.sireInput==='closingSire'?closingSire:paternalSire;
   const mare=d.mareStep?outputs[d.mareStep]:mares?.[d.n];
   if(!sire||!mare||sire.sex==='female'||mare.sex==='male')return {ok:false,stage:d.n,errors:[`工程${d.n}の父母の性別・登録に不足`],gameVerified:false};
   const ped=typeof breed==='function'?breed(sire,mare):null;
   if(!ped||ped.known!==31||ped.conflicts?.length||ped.transmission?.conflicts?.length||ped.transmission?.invalid?.length||ped.directAncestor?.blocked||ped.closeCross65?.blocked)
    return {ok:false,stage:d.n,errors:[`工程${d.n}の31枠・親子血統・近親交配チェック未通過`],gameVerified:false};
   pedigrees[d.n]=ped;
   outputs[d.n]=typeof makeChild==='function'?makeChild(d,ped,sire):null;
   if(!outputs[d.n]||outputs[d.n].sex!==d.sex)return {ok:false,stage:d.n,errors:[`工程${d.n}の産駒性別・情報不足`],gameVerified:false};
  }
  const verification=checkFinal(pedigrees[8],members);
  if(!verification.ok)errors.push(...verification.errors);
  const theory=typeof inspectClosing==='function'?inspectClosing(pedigrees[6]):null;
  if(!theory||theory.blocked||!(theory.superPerfect==='成立'||theory.perfect==='成立'))errors.push('締め肌の超完璧・完璧を根拠付きで確認できません');
  return {ok:!errors.length,stage:8,errors,closingTheory:theory,
   final:pedigrees[8],pedigrees,outputs,gameVerified:false};
 }
 // Exhaustively enumerate all 3-,4-,5-generation sire ancestor positions.
 // A node is a new offspring along a unique prefix (the empty prefix is
 // the final foal); this is a structural lower bound, NOT a game prediction.
 const positions=depth=>Array.from({length:2**(depth-1)},(_,i)=>
  Array.from({length:depth-1},(_,j)=>(i>>(depth-2-j))&1?'D':'S').join('')+'S');
 function assess(assignment){
  const branches=[assignment?.g3,assignment?.g4,assignment?.g5];
  if(branches.some((v,i)=>typeof v!=='string'||v.length!==i+3||!/^[SD]+S$/.test(v)))
   return {valid:false,births:null,risks:['祖先の世代位置が不正'],gameVerified:false};
  const prefixes=new Set(['']);for(const p of branches)for(let j=1;j<p.length;j++)prefixes.add(p.slice(0,j));
  const risks=[];
  for(let i=0;i<branches.length;i++)for(let j=i+1;j<branches.length;j++){
   const a=branches[i],b=branches[j];
   // The registered Deep variants are separate fixed stallions. They cannot
   // become each other's father by merely rearranging a pedigree graph.
   if(a.startsWith(b)||b.startsWith(a)){
    risks.push({kind:'nested',a,b,reason:'既成の異因名同士を直系親子として扱う配置'});continue;
   }
   let shared=0;while(shared<Math.min(a.length,b.length)&&a[shared]===b[shared])shared++;
   const d1=a.length-shared,d2=b.length-shared;
   if(Math.min(d1,d2)===1){
    risks.push({kind:'direct',a,b,degree:`${d1}×${d2}`,reason:'既成異因名の直系近親を必要とする構造'});
   }else if(Math.min(d1,d2)===2&&Math.max(d1,d2)<=3){
    risks.push({kind:'close',a,b,degree:`${d1}×${d2}`,reason:'合流時に2×2・2×3・3×2の同一基礎馬近親クロス'});
   }
  }
  return {valid:!risks.length,births:prefixes.size,risks,gameVerified:false};
 }
 let memo=null;
 function enumerate(){
  if(memo)return memo;
  const states=[],valid=[];
  for(const a of positions(3))for(const b of positions(4))for(const c of positions(5)){
   const r={g3:a,g4:b,g5:c},audit=assess(r);
   states.push({slots:r,...audit});if(audit.valid)valid.push({slots:r,...audit});
  }
  const minimum=valid.length?Math.min(...valid.map(x=>x.births)):null;
  const compact=states.filter(x=>x.births!==null&&x.births<9);
  const direct=assess(paths),sameThird=valid.filter(x=>x.slots.g3==='DDS');
  memo=Object.freeze({version:77,total:states.length,safeLayouts:valid.length,
   minimumBaseline:minimum,safeBelowNine:valid.filter(x=>x.births<9).length,
   belowNineCandidates:compact.length,belowNineRiskCases:compact.filter(x=>x.risks.length).length,
   currentLayout:assess({g3:'DDS',g4:'SSSS',g5:'SDSSS'}),
   compactExample:direct,compactExamplePaths:{...paths},
   sameThirdSafe: sameThird.length,
   alternatives:sameThird.filter(x=>x.births===minimum&&x.slots.g4.startsWith('S')&&x.slots.g5.startsWith('S'))
    .slice(0,16).map(x=>({...x.slots,births:x.births})),
   note:'全中間馬を新規生産／異因名種牡馬同士の直系親子化なし／2×2・2×3・3×2回避、というPWAの保守的条件下の構造計算。既存馬の再利用とゲーム内成立判定は別問題。',
   gameVerified:false});
  return memo;
 }
 return Object.freeze({paths,definitions,validateGraph,derive,checkFinal,simulate,positions,assess,enumerate});
});
