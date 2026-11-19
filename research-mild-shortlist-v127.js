/* v127 | Transparent shortlist for bounded DDS mild searches.
 * Read-only. A ranked comparison is NOT an in-game Shiko verdict, an
 * effective-cross certificate, or a prediction of race performance.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildShortlist127=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const num=x=>x===null||x===undefined||x===''?null:Number.isFinite(Number(x))?Number(x):null;
 const kind=c=>c?.xPrep?(c?.marePrep?'both':'sireOnly'):(c?.marePrep?'mareOnly':'direct');
 const family=c=>String(c?.xPrep?.fatherId||c?.xId||'未確認');
 const routeLabels={direct:'追加0工程',sireOnly:'種側＋1',mareOnly:'肌側＋1',both:'両側＋1'};
 const counts=()=>({direct:0,sireOnly:0,mareOnly:0,both:0});
 function compact(row,index,{ranker,finish,goal}={}){
  const c=row?.rank?.candidate||{},v=finish?.metric?.(c,goal)||null;
  const nitro=(typeof globalThis!=='undefined'?globalThis.DabimasMildNitro107:null)?.inspect?.(c,goal)||null;
  return {rank:index+1,anchorBase:String(row?.trial?.anchor?.base||''),
   slots:{...row?.trial?.draft?.routeDraft?.slots},family:family(c),
   sireFoundationMare:c?.xPrep?.motherId||null,mareFoundationFather:c?.marePrep?.fatherId||null,
   mareFoundationMare:c?.marePrep?.motherId||null,route:kind(c),additionalBirths:num(c.additionalBirths),
   grade:ranker?.grade?.(c)===8?'超完璧・一次判定':ranker?.grade?.(c)===7?'完璧・一次判定':'不明',
   missingFactorSlots:nitro?.missingFactorSlots??null,nitroStages:nitro?.stages??null,
   additionalCrossResearchEvidence:v?.independentCrossEvidence??null,
   crossEffectVerified:false,gameVerified:false};
 }
 function fromRanked({rows=[],ranker,finish,goal='balance',limit=3}={}){
  // Caller hands an ALREADY ranker-sorted list of completed 31-slot DDS rows.
  // Do not re-rank by counted unknown factors, rights or race-distance claims.
  const eligible=(Array.isArray(rows)?rows:[]).filter(r=>r?.rank?.candidate?.matches===3&&
    r.rank.candidate.full?.known===31&&!(r.rank.candidate.full?.conflicts||[]).length&&ranker?.grade?.(r.rank.candidate)>=7);
  const distribution=counts();for(const r of eligible)distribution[kind(r.rank.candidate)]++;
  const chosen=[],used=new Set();for(let i=0;i<eligible.length&&chosen.length<Math.min(3,Math.max(1,limit));i++){
   const row=eligible[i],key=family(row.rank.candidate).normalize('NFKC').toLowerCase();
   if(used.has(key))continue;used.add(key);chosen.push(compact(row,i,{ranker,finish,goal}));
  }
  return {version:127,scope:'one-search-ranked',eligible:eligible.length,distribution,candidates:chosen,
   selectedNotEnoughFamilies:chosen.length<Math.min(3,eligible.length),completeSearch:false,gameVerified:false,
   caveat:'同一作成操作中に最終31枠と締め肌の一次条件を通過した有限候補の、父系を分けた比較上位。選定された一案以外は保存された生産工程ではありません。欠けている経路や未探索レシピを不成立と断定しません。権利数は順位に使いません。'};
 }
 function fromSaved(plan){
  if(plan?.autoDesign21?.mode!=='mild')return null;
  const fresh=plan?.mild127?.version===127?plan.mild127:null;
  const older=plan?.mild87||null,coverage=plan?.mild89||plan?.mild67?.inverse69?.coverage89||null;
  const gradeRoutes=older?.routeCounts||null;
  const candidates=fresh?.candidates||((older?.representatives||[]).slice(0,3).map(r=>({
   rank:r.rankPosition??null,anchorBase:older?.winningBase||'',family:String(r.family||'未確認'),
   sireFoundationMare:r.preparedSireMare||null,route:r.additionalBirths===0?'direct':
    r.preparedSireFather?(r.mareFoundationFather?'both':'sireOnly'):r.mareFoundationFather?'mareOnly':'unknown',
   additionalBirths:r.additionalBirths??null,grade:String(r.grade||'未確認')+'・一次判定',
   missingFactorSlots:r.missing??null,nitroStages:{'短':r.stageShort,'速':r.stageFast,'長':r.stageLong},
   additionalCrossResearchEvidence:r.independentCrossEvidence??null,gameVerified:false})));
  const knownRoutes=fresh?.distribution||gradeRoutes;
  const stage={direct:0,sireOnly:0,mareOnly:0,both:0};
  for(const key of Object.keys(stage))stage[key]=num(knownRoutes?.[key]);
  const noCandidates=candidates.length===0;
  return {version:127,planId:plan.id||'',planTitle:plan.title||'',race:plan.autoDesign21?.race||'',goal:plan.goal||'',
   fresh:!!fresh,source:fresh?'保存時のv127順位記録':'旧版の保存済み代表候補（v126評価で再探索していない）',
   candidates,distribution:stage,eligible:fresh?.eligible??older?.distinct??null,
   inspectCount:coverage?.inspected??null,notReviewed:coverage?.notReviewed??null,
   outsideShortlist:coverage?.outsideShortlist??null,
   fullSearch:coverage?.exhaustive===true&&plan.fastSearch59?.complete===true,
   canCompareAllRoutes:!!stage.direct&&!!stage.sireOnly&&!!stage.mareOnly&&!!stage.both,
   needsNewSearch:!fresh,gameVerified:false,noCandidates,
   caveat:'父系の異なる参考例を示す比較台帳です。強さの順位・ゲーム内至高・追加独立クロスの成立を認定しません。未探索の追加工程を不利と扱いません。'};
 }
 return Object.freeze({fromRanked,fromSaved,routeLabels});
});
