/* v131 | Read-only, final-foal 31-slot comparison for MILD research.
 * Reuses the SAME already validated candidate cohort for SP, balance and ST.
 * This is neither an independent cross certification nor foal ability forecast.
 * Saved plans can be independently rescored from the CURRENT recorded final
 * pedigree even when they predate this feature; old search rankings stay old.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildFinal31V131=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const GOALS=['speed','balance','stamina'];
 const NAMES={speed:'SP重視',balance:'バランス',stamina:'ST重視'};
 const ROUTES=['direct','sireOnly','mareOnly','both'];
 const ROUTE_NAMES={direct:'追加なし',sireOnly:'種側＋1',mareOnly:'肌側＋1',both:'両側＋1'};
 const STEPS={'短':[4,6,8,9,10],'速':[4,8,12,16,20],'長':[3,6,9]};
 const WEIGHTS={speed:{'短':9,'速':5,'長':1},balance:{'短':2,'速':7,'長':7},stamina:{'短':1,'速':5,'長':9}};
 const norm=x=>String(x??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const numeric=x=>Number.isFinite(Number(x))?Number(x):0;
 const route=c=>c?.xPrep?(c?.marePrep?'both':'sireOnly'):(c?.marePrep?'mareOnly':'direct');
 const father=c=>String(c?.xPrep?.fatherId||c?.xId||'未確認');
 const validPaths=rows=>Array.isArray(rows)&&rows.length===31&&new Set(rows.map(r=>r?.path)).size===31&&rows.every(r=>/^[SD]{0,4}S$/.test(String(r?.path||'')));
 const validFactors150=new Set(['短','速','底','長','走','中','強','雷','堅','難','適','丈','早','晩']);
 function factorRecord150(row){const fs=row?.factors;if(!Array.isArray(fs)||fs.length>3||fs.some(f=>!validFactors150.has(f)))return null;return fs.length||(/^実測ID:.+/.test(String(row.factorVariant||'')))?fs:null;}
 function factors(rows){
  if(!validPaths(rows))return null;
  const counts={'短':0,'速':0,'長':0};let missing=0,recorded=0;const unknownPaths=[];
  for(const r of rows){const a=factorRecord150(r);
   if(a===null){missing++;unknownPaths.push(r.path);}else recorded++;
   for(const f of a||[])if(Object.prototype.hasOwnProperty.call(counts,f))counts[f]++;
  }
  const stages=Object.fromEntries(Object.keys(counts).map(k=>[k,STEPS[k].filter(n=>counts[k]>=n).length]));
  return {counts,stages,missing,recorded,unknownPaths:unknownPaths.sort(),gameVerified:false};
 }
 const stageScore=(profile,goal)=>Object.entries(profile?.stages||{}).reduce((sum,[f,n])=>sum+(WEIGHTS[goal]?.[f]||0)*n,0);
 function saved(plan,{crossOrigin=null}={}){
  if(plan?.autoDesign21?.mode!=='mild')return null;
  const report=plan?.externalReview48,profile=factors(report?.parts?.foal?.ancestors);
  if(!profile)return {version:131,available:false,reason:'最終産駒の5代31枠が不足・重複しています',gameVerified:false};
  const origins=crossOrigin?.classify?.({report})||null;
  return {version:131,available:true,fromSaved:true,profile,
   byGoal:Object.fromEntries(GOALS.map(g=>[g,{goal:g,stageIndex:stageScore(profile,g)}])),
   crossNames:origins?.crosses?.length??null,
   originBreakdown:origins?.rootsValid?origins.counts:null,
   additionalCrossReview:origins?.rootsValid?origins.additionalReviewNames:[],
   gameVerified:false,limitations:'保存されている最終産駒31枠だけを3方針で再集計。旧プランの候補を新方式で再探索した意味ではありません。ニトロ段階は未収録因子の影響を受け、SP/ST能力・至高・独立クロスは未確認。'};
 }
 function anchorsMatch(c,trial){
  const rows=c?.full?.rows,anchors=trial?.draft?.routeDraft?.slots;
  const paths=trial?.draft?.routeDraft?.paths;
  if(!validPaths(rows)||c?.matches!==3||c.full.known!==31||c.full.conflicts?.length||c.full.transmission?.conflicts?.length||c.full.transmission?.invalid?.length||!anchors||!paths)return false;
  const map=new Map(rows.map(r=>[r.path,r]));
  for(const slot of ['g3','g4','g5']){
   const id=String(anchors[slot]||''),r=map.get(paths[slot]);if(!id||!r)return false;
   const variant=String(r.factorVariant||r.variant||'');
   const formed=/^(19|20)\d{2}$/.test(variant)?String(r.name)+variant:String(r.name)+(variant?'-'+variant+'-':'');
   if(norm(id)!==norm(formed))return false;
  }
  return true;
 }
 function ownership(c,trial,owned){
  if(!owned)return true;
  const ids=[...Object.values(trial.draft?.routeDraft?.slots||{}),c?.xPrep?.fatherId||c?.xId,c?.marePrep?.fatherId].filter(Boolean);
  return ids.every(id=>owned[id]?.owned===true||owned[norm(id)]?.owned===true);
 }
 function uniqueKey(c,trial){
  const slots=trial?.draft?.routeDraft?.slots||{};
  return JSON.stringify([slots.g3,slots.g4,slots.g5,
   ...Object.entries(c.choices||{}).sort((a,b)=>numeric(a[0])-numeric(b[0])).flat(),
   c.xPrep?.fatherId,c.xPrep?.motherId,c.xId,c.marePrep?.fatherId,c.marePrep?.motherId,route(c)]);
 }
 // Within a SINGLE grade and mating-count lane, prefer more completely
 // annotated records for human review, then documented stage research indices.
 // Never compare unknown factors as though they were zero factors.
 function reviewOrder(a,b,goal){
  return b.grade-a.grade||a.profile.missing-b.profile.missing||
   stageScore(b.profile,goal)-stageScore(a.profile,goal)||
   b.profile.recorded-a.profile.recorded||a.family.localeCompare(b.family,'ja')||a.key.localeCompare(b.key,'ja');
 }
 function compact(r,goal){return {family:r.family,route:r.route,additionalBirths:r.births,grade:r.grade===8?'超完璧・一次判定':'完璧・一次判定',
  missing:r.profile.missing,counts:{...r.profile.counts},stages:{...r.profile.stages},stageIndex:stageScore(r.profile,goal),
  id:r.key.slice(0,200),gameVerified:false};}
 function study(trials,{ranker,owned=null,maxPerRoute=3}={}){
  const reasons={invalid:0,notOwned:0,notDDS:0,grade:0,duplicate:0};
  if(!ranker?.grade)return {version:131,available:false,reason:'配合理論の一次判定器がありません',gameVerified:false};
  const rows=[],seen=new Set();
  for(const trial of trials||[]){
   if(trial?.routeType!=='dds'){reasons.notDDS++;continue;}
   for(const item of trial.ranked||[]){const c=item?.candidate;if(!c)continue;
    const grade=ranker.grade(c);
    if(grade<7){reasons.grade++;continue;}
    if(!anchorsMatch(c,trial)){reasons.invalid++;continue;}
    if(!ownership(c,trial,owned)){reasons.notOwned++;continue;}
    const p=factors(c.full.rows);if(!p){reasons.invalid++;continue;}
    const key=uniqueKey(c,trial);if(seen.has(key)){reasons.duplicate++;continue;}seen.add(key);
    rows.push({key,c,trial,profile:p,grade,route:route(c),births:numeric(c.additionalBirths),family:father(c)});
   }
  }
  const cap=Math.min(5,Math.max(1,Math.trunc(Number(maxPerRoute)||3)));
  const byGoal={};
  for(const goal of GOALS){
   const byRoute={};
   for(const name of ROUTES){
    const lane=rows.filter(r=>r.route===name).sort((a,b)=>reviewOrder(a,b,goal));
    const selected=[],families=new Set();
    for(const r of lane){const k=norm(r.family);if(families.has(k))continue;selected.push(compact(r,goal));families.add(k);if(selected.length===cap)break;}
    byRoute[name]={checked:lane.length,available:!!lane.length,representatives:selected,
     coverageRange:lane.length?{min:Math.min(...lane.map(r=>r.profile.missing)),max:Math.max(...lane.map(r=>r.profile.missing))}:null};
   }
   byGoal[goal]={name:NAMES[goal],routes:byRoute,
    leadingFamilies:ROUTES.flatMap(k=>byRoute[k].representatives.slice(0,1).map(r=>r.family))};
  }
  return {version:131,available:rows.length>0,searchComplete:false,gameVerified:false,
   verifiedInGame:0,checkedFullPedigrees:rows.length,distinctFatherFamilies:new Set(rows.map(r=>norm(r.family))).size,
   counts:Object.fromEntries(ROUTES.map(k=>[k,rows.filter(r=>r.route===k).length])),
   reasons,byGoal,
   relativeWinner:null,reasonNoWinner:'異なる工程数・因子未収録率の配合を能力で直接順位付けできません。各構成の優先確認例を提示します。',
   limitations:'新規設計時に実所持だけで生成され、至高指定位置・親子関係・最終31枠・締め肌の一次検査を通過したDDS候補を同一集合で再比較。各構成内の先頭は「資料が比較しやすい参考例」で、馬の強さではありません。クロス確定加点を行わず、未収録因子を0因子としません。候補探索には上限があり、ゲーム内至高成立・SP/ST能力は未確認。'};
 }
 return Object.freeze({saved,study,factors,stageScore,anchorsMatch,reviewOrder,route,ROUTE_NAMES,GOALS,NAMES});
});
