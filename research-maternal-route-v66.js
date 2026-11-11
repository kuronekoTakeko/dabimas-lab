/* v6.6: alternative nine-mating Shiko PRECONDITION route.
 * Deep 3rd generation on the DAM side, different named variants in the
 * SIRE's 4th/5th generations. An explicit DAG, never a text-only swap.
 * Neither parent-system success nor in-game Shiko/ability is asserted.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMaternal66=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const anchorPaths=Object.freeze({g3:'DSS',g4:'SSSS',g5:'SDSSS'});
 const definitions=Object.freeze([
  {n:1,sireSlot:'g3',mareInput:true,sex:'male',output:'母父起点 B1牡',mareLabel:'P1'},
  {n:2,sireStep:1,mareInput:true,sex:'female',output:'最終繁殖牝馬 M牝',mareLabel:'P2'},
  {n:3,sireSlot:'g4',mareInput:true,sex:'male',output:'父系起点 A1牡',mareLabel:'Q1'},
  {n:4,sireStep:3,mareInput:true,sex:'male',output:'父系中間 A2牡',mareLabel:'Q2'},
  {n:5,sireSlot:'g5',mareInput:true,sex:'male',output:'父母系起点 C1牡',mareLabel:'R1'},
  {n:6,sireStep:5,mareInput:true,sex:'male',output:'父母系中間 C2牡',mareLabel:'R2'},
  {n:7,sireStep:6,mareInput:true,sex:'female',output:'父母 C3牝',mareLabel:'R3'},
  {n:8,sireStep:4,mareStep:7,sex:'male',output:'最終種牡馬 A3牡'},
  {n:9,sireStep:8,mareStep:2,sex:'male',output:'最終候補'}
 ].map(x=>Object.freeze(x)));
 function validateGraph(defs=definitions){const errors=[],outputs=new Map();for(const d of defs){
  if(!Number.isInteger(d.n)||outputs.has(d.n)||d.n!==outputs.size+1)errors.push('工程の番号または順序に誤り');
  for(const k of ['sireStep','mareStep'])if(d[k]!==undefined&&(!outputs.has(d[k])||d[k]>=d.n))errors.push(`工程${d.n}が未生産の親に依存`);
  if(d.sireStep&&outputs.get(d.sireStep)?.sex!=='male')errors.push(`工程${d.n}の父が牡ではない`);
  if(d.mareStep&&outputs.get(d.mareStep)?.sex!=='female')errors.push(`工程${d.n}の母が牝ではない`);
  if(!d.sireStep&&!d.sireSlot||!d.mareStep&&!d.mareInput)errors.push(`工程${d.n}の父母の参照が欠落`);
  outputs.set(d.n,d);
 }return {ok:errors.length===0,errors};}
 function ancestorRoute(steps,stepNo,rootSlot,seen=new Set()){
  const d=steps.find(x=>x.n===stepNo);if(!d||seen.has(stepNo))return null;
  if(d.sireSlot===rootSlot)return 'S';
  const next=new Set(seen);next.add(stepNo);
  if(d.sireStep){const nested=ancestorRoute(steps,d.sireStep,rootSlot,next);if(nested)return 'S'+nested;}
  if(d.mareStep){const nested=ancestorRoute(steps,d.mareStep,rootSlot,next);if(nested)return 'D'+nested;}
  return null;
 }
 // In the final foal, the maternal route can be found through the dam,
 // and the 4th/5th routes through the sire. These are 31-slot S/D positions.
 function derivedPaths(defs=definitions){return Object.fromEntries(['g3','g4','g5'].map(k=>[k,ancestorRoute(defs,9,k)]));}
 function validateFinal(pedigree,slots,members){
  const rows=pedigree?.rows||[];const at=new Map(rows.map(r=>[r.path,r]));const errors=[];
  if(pedigree?.known!==31||rows.length!==31||pedigree?.conflicts?.length||pedigree?.transmission?.conflicts?.length)errors.push('最終31枠の血統が未完成・矛盾');
  const normalize=s=>String(s||'').normalize('NFKC').replace(/[\s　]/g,'').toLowerCase();
  const factors=a=>[...(a||[])].map(normalize).sort().join('|');
  for(const [key,path] of Object.entries(anchorPaths)){
   const r=members?.[key],actual=at.get(path);
   if(!r||!actual||normalize(actual.name)!==normalize(r.name)||factors(actual.factors)!==factors(r.factors)||!actual.factors?.length)errors.push(`${path}：${key}の同名・因子照合が不一致`);
  }
  const ids=['g3','g4','g5'].map(k=>slots?.[k]);if(ids.some(x=>!x)||new Set(ids.map(normalize)).size!==3)errors.push('異因名種牡馬の登録IDが3つ必要');
  if(new Set(['g3','g4','g5'].flatMap(k=>members?.[k]?.factors||[])).size<6)errors.push('判明因子が6種類未満');
  return {ok:errors.length===0,errors,gameVerified:false};
 }
 function steps(slots,mares){return definitions.map(d=>{
  const sire=d.sireSlot?slots[d.sireSlot]:`工程${d.sireStep}産駒`;
  const mare=d.mareInput?mares?.[d.n]||`${d.mareLabel}（未指定）`:`工程${d.mareStep}産駒`;
  return {n:d.n,cross:`${sire} × ${mare} → ${d.output}`,sex:d.sex};
 });}
 return Object.freeze({anchorPaths,definitions,validateGraph,derivedPaths,validateFinal,steps,closingStep:2,finalSireStep:8,finalMareStep:2,mareSteps:Object.freeze([1,2,3,4,5,6,7])});
});
