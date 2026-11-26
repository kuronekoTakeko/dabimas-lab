/* v6.10 | Mild DDS final-pedigree research refinement.
 * Compare the COMPLETE 31-slot child pedigree after a documented perfect /
 * super-perfect closing-mare mating. Theoretical evidence is not an in-game
 * result. Only swap published supporting mares at core steps 3..7; never add
 * a generation, change the three Shiko variants, or change the closing mate.
 * An unrecorded factor is UNKNOWN, not evidence that a factor does not exist.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildFinish610=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=x=>String(x??'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
 const LOCAL_FACTORS=new Set(['短','速','底','長','走','中','強','雷','堅','難','適','丈','早','晩']);
 const factorRecord=r=>{const external=typeof globalThis!=='undefined'?globalThis.DabimasMildFactorIntegrity152:null;
  if(external?.factorRecord)return external.factorRecord(r);
  const fs=r?.factors;return Array.isArray(fs)&&fs.length<=3&&fs.every(f=>LOCAL_FACTORS.has(f))&&
   (fs.length>0||/^実測ID:.+/.test(String(r?.factorVariant||'')))?fs:null;};
 const WEIGHTS={
  speed:{'走':6,'速':4,'短':3,'中':2,'長':1,'底':1},
  stamina:{'長':6,'中':4,'底':3,'走':2,'速':1,'短':1},
  balance:{'走':4,'速':3,'短':2,'中':4,'長':4,'底':2}
 };
 function family(s){return String(s||'').replace(/系$/,'').trim();}
 function grade(t){return t?.theory66?.blocked?0:t?.theory66?.superPerfect==='成立'?8:t?.theory66?.perfect==='成立'?7:0;}
 function safeNumber(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,n):0;}
 function metric(t,goal='balance'){
  if(!t||t.matches!==3||t.full?.known!==31||t.full?.conflicts?.length||t.full?.transmission?.conflicts?.length||t.full?.transmission?.invalid?.length||grade(t)<7)return null;
  const w=WEIGHTS[goal]||WEIGHTS.balance,rows=t.full.rows||[];
  const anchors=new Set(['DDS','SSSS','SDSSS']);
  const support=rows.filter(r=>[4,5].includes(r.path?.length)&&![...anchors].some(a=>r.path.startsWith(a)));
  const generationEvidence=[4,5].map(depth=>{const group=support.filter(r=>r.path.length===depth), known=group.filter(r=>family(r.line));return {depth,slots:group.length,known:known.length,unknown:group.length-known.length,knownPaths:known.map(r=>r.path).sort(),distinct:new Set(known.map(r=>family(r.line))).size};});
  let observedFactors=0,observedFactorRows=0;const factorCoverage=[];
  const childFamilies=new Set();
  for(const r of support){
   const line=family(r.line),scale=r.path.length===4?1.7:0.85;
   if(line)childFamilies.add(line);
   const fs=factorRecord(r);
   if(fs!==null){factorCoverage.push(r.path);if(fs.length){observedFactorRows++;
    for(const f of fs)observedFactors+=(w[f]||0)*scale;
   }}
  }
  // Only documented, independent, conflict-free factor variants are treated
  // as cross-factor evidence. Raw ancestor factors have MUCH lower priority.
  const candidates=(t.extraEffective||[]).filter(x=>!x.conflicts?.length);
  const documented=candidates.filter(x=>x.outsidePairEvidenceComplete!==false&&!x.unresolved?.length&&x.counted?.length&&Object.values(x.counts||{}).some(v=>safeNumber(v)>0));
  // v149: use only explicitly complete per-cross records in mixed sets.
  // Legacy records without per-pair evidence retain the conservative all-or-none rule.
  const candidateCrossed=Object.entries(t.extraFactorCounts||{}).reduce((sum,[f,n])=>sum+(w[f]||0)*safeNumber(n),0);
  const allDocumented=candidates.length>0&&documented.length===candidates.length;
  const explicit=documented.filter(x=>x.outsidePairEvidenceComplete===true);
  const credited=allDocumented?documented:explicit;
  const crossed=credited.reduce((sum,x)=>sum+Object.entries(x.counts||{}).reduce((n,[f,v])=>n+(w[f]||0)*safeNumber(v),0),0);
  const unresolvedCrossCandidates=Math.max(0,candidates.length-credited.length);
  const risk=safeNumber(t.risk),conflicts=safeNumber(t.conflictCount);
  const unverified=safeNumber(t.unresolvedCount);
  const score=4*crossed+3*credited.length+0.35*candidates.length+0.16*observedFactors-5*risk-20*conflicts-Math.min(3,unverified)*0.12;
  return {score:Math.round(score*100)/100,grade:grade(t),additionalBirths:safeNumber(t.additionalBirths),
   independentCrossCandidates:candidates.length,independentCrossEvidence:credited.length,crossFactorEvidence:Math.round(crossed*100)/100,
   candidateCrossFactorIndex:Math.round(candidateCrossed*100)/100,unresolvedCrossCandidates,crossEvidenceComplete:allDocumented,
   ancestorFactorsRecorded:observedFactorRows,documentedFactorPaths:factorCoverage.sort(),lineageEvidence:null,generationEvidence,
   childLineDiversity:childFamilies.size,shortCrossRisk:risk,unresolvedCrosses:unverified,
   source:'最終31枠（記録根拠のある独立クロス／候補因子を分離した研究用相対評価）',gameVerified:false};
 }
 // No assumed SP/ST mapping from child-line names. Diversity is only a
 // research tie-break, and only with identical observed positions.
 function comparableCoverage(x,y){return !!(x?.documentedFactorPaths&&y?.documentedFactorPaths&&
  JSON.stringify(x.documentedFactorPaths)===JSON.stringify(y.documentedFactorPaths));}
 function compareLineage(x,y){
  const a=x?.generationEvidence,b=y?.generationEvidence;
  if(!a||!b||a.length!==2||b.length!==2||a.some((g,i)=>g.slots!==b[i].slots||JSON.stringify(g.knownPaths)!==JSON.stringify(b[i].knownPaths)))return 0;
  return b[0].distinct-a[0].distinct||b[1].distinct-a[1].distinct;
 }
 // v146: closing-mare evidence is a research tie-break, not a prediction.
 // Do not compare different coverage masks, unknown/invalid pedigrees, or
 // different theory/cost tiers. Only use the existing nitro hypothesis.
 function closingEvidence(t,goal='balance'){
  const p=t?.closingPed;
  if(!p||p.known!==31||p.conflicts?.length||p.transmission?.conflicts?.length||p.transmission?.invalid?.length||p.directAncestor?.blocked||p.closeCross65?.blocked||grade(t)<7)return null;
  const api=typeof globalThis!=='undefined'?globalThis.DabimasMildNitro107:null;
  const e=api?.inspect?.({matches:3,full:p,theory66:t.theory66},goal);
  if(!e||!p.rows.every(r=>r.name||r.horse))return null;
  return e;
 }
 function compareClosing(a,b,goal='balance'){
  if(grade(a)!==grade(b)||safeNumber(a?.additionalBirths)!==safeNumber(b?.additionalBirths))return 0;
  const x=closingEvidence(a,goal),y=closingEvidence(b,goal);
  if(!x||!y||JSON.stringify(x.unknownPaths)!==JSON.stringify(y.unknownPaths))return 0;
  return y.researchIndex-x.researchIndex;
 }
 function compare(a,b,goal='balance'){
  const x=metric(a,goal),y=metric(b,goal);
  if(!x)return y?1:0;if(!y)return -1;
  // Theory evidence outranks production cost. Within the same theory grade,
  // extra matings must not be added solely for a research score increase.
  return y.grade-x.grade||x.additionalBirths-y.additionalBirths||x.shortCrossRisk-y.shortCrossRisk||y.independentCrossEvidence-x.independentCrossEvidence||y.crossFactorEvidence-x.crossFactorEvidence||(comparableCoverage(x,y)?y.score-x.score:
   // Different unknown masks are NOT an ability comparison. In a research
   // tie, prefer the pedigree with more documented support SLOTS to audit.
   y.documentedFactorPaths.length-x.documentedFactorPaths.length)||compareLineage(x,y)||compareClosing(a,b,goal);
 }
 function marePriority(m,goal){
  const w=WEIGHTS[goal]||WEIGHTS.balance;
  const ancestors=(m?.ancestry||[]).filter(a=>a?.horse||a?.name);
  const score=ancestors.reduce((sum,a)=>sum+(factorRecord(a)||[]).reduce((s,f)=>s+(w[f]||0),0),0);
  const diversity=new Set(ancestors.map(a=>family(a.line)).filter(Boolean)).size;
  return score+diversity*0.5;
 }
 // Retain genuinely different child-line families, not only the first high
 // raw-factor mares. This is a shortlist, not an exhaustive global search.
 function shortlist(mares,goal,cap=16){
  const sorted=[...(mares||[])].filter(x=>x?.id&&x.ancestry?.length>=15)
   .sort((a,b)=>marePriority(b,goal)-marePriority(a,goal)||a.id.localeCompare(b.id,'ja'));
  const limit=Math.max(0,Math.min(sorted.length,Math.trunc(cap)||0));
  const chosen=[],used=new Set(),byFamily=new Set();
  const add=m=>{const k=norm(m.id);if(chosen.length>=limit||used.has(k))return;chosen.push(m);used.add(k);};
  // Initial diversity pass: select a distinct mare line from each top family.
  for(const m of sorted){const line=family(m.lineage||m.ancestry?.[0]?.line)||'不明';
   if(byFamily.has(line))continue;byFamily.add(line);add(m);if(chosen.length>=Math.ceil(limit/2))break;}
  for(const m of sorted)add(m);
  return chosen;
 }
 // v139: shortlist by surviving paternal positions, not the entire mare pedigree.
 const DDS_PREFIX=Object.freeze({1:'DDD',3:'SSSD',4:'SSD',5:'SDSSD',6:'SDSD',7:'SDD'});
 function projectedShortlist(mares,goal,cap,trial,step){
  const prefix=DDS_PREFIX[step],rows=trial?.full?.rows||[];
  if(!prefix||rows.length!==31||new Set(rows.map(r=>r.path)).size!==31||!rows.every(r=>/^[SD]{0,4}S$/.test(r.path)&&r.name))return shortlist(mares,goal,cap);
  const anchors=['DDS','SSSS','SDSSS'];
  const outside=p=>!anchors.some(a=>p.startsWith(a));
  const anchorNames=new Set(rows.filter(r=>anchors.includes(r.path)).map(r=>norm(r.name)));
  const opposite=new Map();for(const r of rows)if(r.path.startsWith(prefix[0]==='D'?'S':'D')&&outside(r.path)&&!anchorNames.has(norm(r.name))){
   const k=norm(r.name);if(!opposite.has(k))opposite.set(k,[]);opposite.get(k).push(r);
  }
  const w=WEIGHTS[goal]||WEIGHTS.balance;
  const scored=(mares||[]).filter(m=>m?.id&&m.ancestry?.length>=15).map(m=>{
   const names=new Set(),recorded=new Set();let factors=0;
   for(const a of m.ancestry){const path=prefix+String(a.path||'').replace(/父/g,'S').replace(/母/g,'D');
    if(!/^[SD]{0,4}S$/.test(path)||!outside(path))continue;
    const k=norm(a.horse||a.name);if(!k||anchorNames.has(k))continue;
    const fs=factorRecord(a);factors+=(fs||[]).reduce((n,f)=>n+(w[f]||0),0);
    const hits=opposite.get(k)||[];if(hits.length){names.add(k);if((a.factorVariant||a.variant)&&fs?.length&&hits.some(r=>r.factorVariant&&factorRecord(r)?.length))recorded.add(k);}
   }
   return {m,matched:names.size,recorded:recorded.size,factors};
  }).sort((a,b)=>b.recorded-a.recorded||b.matched-a.matched||b.factors-a.factors||marePriority(b.m,goal)-marePriority(a.m,goal)||a.m.id.localeCompare(b.m.id,'ja'));
  // Keep half of the budget for legacy diverse alternatives; projected overlaps
  // are a proposal ordering only, never proof of an independent cross.
  const chosen=[],seen=new Set(),add=m=>{if(m&&chosen.length<cap&&!seen.has(norm(m.id))){seen.add(norm(m.id));chosen.push(m);}};
  if(prefix.length>=5)return shortlist(mares,goal,cap);
  for(const x of scored.slice(0,Math.ceil(cap/2)))add(x.m);
  for(const m of shortlist(mares,goal,cap))add(m);
  for(const x of scored)add(x.m);
  return chosen;
 }
 function optimize({initial,mares=[],evaluate,goal='balance',maxTests=80,steps=[3,4,5,6,7],projectDDS=false}={}){
  const first=metric(initial,goal);
  if(!first||typeof evaluate!=='function')return {winner:initial,audit:{error:'有効な31枠・締め肌理論と評価関数が必要',gameVerified:false}};
  const limit=Math.max(0,Math.min(180,Math.trunc(maxTests)||0));
  const perStage=Math.max(0,Math.ceil(limit/Math.max(1,steps.length)));
  const candidates=shortlist(mares,goal,perStage);
  let best=initial,tests=0,invalid=0,changedSteps=[];
  const seen=new Set();
  for(const step of steps){
   if(![1,3,4,5,6,7].includes(step))continue;
   let stepBest=best;
   for(const mare of (projectDDS?projectedShortlist(mares,goal,perStage,best,step):candidates)){if(tests>=limit)break;
    const currentId=best.choices?.[step];if(!currentId||norm(mare.id)===norm(currentId))continue;
    if(Object.entries(best.choices||{}).some(([k,id])=>Number(k)!==step&&norm(id)===norm(mare.id)))continue;
    const choices={...best.choices,[step]:mare.id};
    const key=JSON.stringify(Object.keys(choices).sort().map(n=>[n,norm(choices[n])]));
    if(seen.has(key))continue;seen.add(key);tests++;
    const trial=evaluate(choices);
    if(!metric(trial,goal)){invalid++;continue;}
    if(compare(trial,stepBest,goal)<0)stepBest=trial;
   }
   if(stepBest!==best){best=stepBest;changedSteps.push(step);}
   if(tests>=limit)break;
  }
  const after=metric(best,goal);
  const changed=compare(best,initial,goal)<0;
  return {winner:changed?best:initial,audit:{version:610,projectedDDS:projectDDS,goal,tests,invalid,limit,limited:tests>=limit,
    changedSteps:changed?changedSteps:[],improved:changed,before:first,after:changed?after:first,
    gameVerified:false,caveat:'31枠の既知因子・独立クロス・子系統の相対順位。未収録は因子なしとしない。ゲーム内の効果・能力・至高成立は未検証。'}};
 }
 return Object.freeze({grade,metric,compare,comparableCoverage,compareLineage,closingEvidence,compareClosing,shortlist,projectedShortlist,optimize});
});
