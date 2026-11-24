/* v132 | Read-only evidence gates for comparing 0/1/2 EXTRA matings.
 * Research-only: no grade or cross claim; never mutates the user's holdings.
 * Compare ONLY the same 3 Shiko IDs, same recorded closing-mare theory,
 * and exactly the same unknown-factor SLOT POSITIONS.  Lack of a comparator
 * is NOT evidence that an extra birth is necessary.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildStepEvidence132=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const GOALS=['speed','balance','stamina'],KEYS=['短','速','長'];
 const ROUTES=['direct','sireOnly','mareOnly','both'];
 const LABELS={direct:'追加0',sireOnly:'種＋1',mareOnly:'肌＋1',both:'両側＋1'};
 const norm=x=>String(x??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const isOwned=(owned,id)=>!!id&&Object.entries(owned||{}).some(([k,v])=>norm(id)===norm(k)&&v?.owned===true);
 const missingSignature=rows=>rows.filter(r=>!Array.isArray(r.factors)||!r.factors.some(Boolean)).map(r=>r.path).sort().join('|');
 function candidateID(c,trial){return JSON.stringify([
  ...['g3','g4','g5'].map(k=>trial.draft.routeDraft.slots[k]),
  ...Object.entries(c.choices||{}).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))).flat(),
  c.xId,c.xPrep?.fatherId,c.xPrep?.motherId,c.marePrep?.fatherId,c.marePrep?.motherId,
  c.mareId,c.additionalBirths
 ]);}
 function collect(trials,{full31,ranker,owned}={}){
  const audit={notDDS:0,invalid31:0,notOwned:0,gradeMissing:0,prepMismatch:0,duplicates:0};
  if(!full31?.anchorsMatch||!full31?.factors||!full31?.route||!ranker?.grade||!owned)
   return {rows:[],audit,available:false,reason:'31枠検証器・配合理論または所持記録がありません'};
  const seen=new Set(),rows=[];
  for(const t of trials||[]){if(t?.routeType!=='dds'){audit.notDDS++;continue;}
   for(const item of t?.ranked||[]){const c=item?.candidate;if(!c)continue;
    const grade=ranker.grade(c);if(grade!==7&&grade!==8){audit.gradeMissing++;continue;}
    if(!full31.anchorsMatch(c,t)){audit.invalid31++;continue;}
    const rt=full31.route(c),births={direct:0,sireOnly:1,mareOnly:1,both:2}[rt];
    if(Number(c.additionalBirths)!==births){audit.prepMismatch++;continue;}
    const ids=[...Object.values(t.draft.routeDraft.slots),c.xPrep?.fatherId||c.xId,c.marePrep?.fatherId].filter(Boolean);
    if(!ids.every(id=>isOwned(owned,id))){audit.notOwned++;continue;}
    const profile=full31.factors(c.full.rows);if(!profile){audit.invalid31++;continue;}
    const id=candidateID(c,t);if(seen.has(id)){audit.duplicates++;continue;}seen.add(id);
    const anchors=['g3','g4','g5'].map(k=>norm(t.draft.routeDraft.slots[k])).join('|');
    const family=c.xPrep?.fatherId||c.xId||'未確認';
    rows.push({id,grade,route:rt,births,anchors,missingSignature:missingSignature(c.full.rows),profile,
     family,seedMare:c.xPrep?.motherId||null,baseMare:c.choices?.[1]||null});
   }
  }
  return {rows,audit,available:true};
 }
 const compareStages=(extra,base)=>{
  const d=KEYS.map(k=>extra.profile.stages[k]-base.profile.stages[k]);
  return {noLoss:d.every(n=>n>=0),strictGain:d.some(n=>n>0),equal:d.every(n=>n===0),strictLoss:d.some(n=>n<0),diffs:d};
 };
 function evidenceStatus(extra,baselines,goal='balance'){
  if(!baselines.length)return 'noComparator';
  const compared=baselines.map(b=>compareStages(extra,b));
  // Improvement is only a recorded stage gain, never a proven ability gain.
  // Require strict non-loss over EVERY comparable lower-step candidate.
  const priorities=goal==='speed'?['短','速']:goal==='stamina'?['長','速']:['短','速','長'];
  if(compared.every((x,i)=>x.noLoss&&x.strictGain&&priorities.some(k=>extra.profile.stages[k]>baselines[i].profile.stages[k])))return 'recordedStageGain';
  if(compared.every(x=>!x.strictGain))return 'noStageGain';
  return 'mixedEvidence';
 }
 function study(trials,{full31,ranker,owned,maxExamples=2}={}){
  const result=collect(trials,{full31,ranker,owned});
  if(!result.available)return {version:132,available:false,audit:result.audit,reason:result.reason,gameVerified:false};
  const rows=result.rows,byGoal={};const limit=Math.min(3,Math.max(1,Math.trunc(Number(maxExamples)||2)));
  const counts=Object.fromEntries(ROUTES.map(k=>[k,rows.filter(r=>r.route===k).length]));
  for(const goal of GOALS){
   const stats={direct:counts.direct,one:counts.sireOnly+counts.mareOnly,two:counts.both,
    noComparator:0,recordedStageGain:0,noStageGain:0,mixedEvidence:0};
   const examples=[];
   for(const extra of rows.filter(r=>r.births>0)){
    const baselines=rows.filter(b=>b.births===extra.births-1&&b.grade===extra.grade&&
     b.anchors===extra.anchors&&b.missingSignature===extra.missingSignature);
    const status=evidenceStatus(extra,baselines,goal);stats[status]++;
    if(baselines.length&&examples.filter(e=>e.status===status).length>=limit)continue;
    if(!baselines.length&&examples.filter(e=>e.status==='noComparator').length>=limit)continue;
    const sorted=baselines.slice().sort((a,b)=>full31.stageScore(b.profile,goal)-full31.stageScore(a.profile,goal)||a.id.localeCompare(b.id));
    examples.push({status,route:extra.route,family:extra.family,seedMare:extra.seedMare,baseMare:extra.baseMare,
     theory:extra.grade===8?'超完璧・一次判定':'完璧・一次判定',
     missing:extra.profile.missing,stages:{...extra.profile.stages},
     comparedAgainst:baselines.length,baseline:sorted[0]?{family:sorted[0].family,route:sorted[0].route,
      stages:{...sorted[0].profile.stages}}:null,
     researchIndex:full31.stageScore(extra.profile,goal),approvedForProduction:false,gameVerified:false});
   }
   byGoal[goal]={stats,examples};
  }
  return {version:132,available:rows.length>0,checked:rows.length,counts,
   distinctFamilies:new Set(rows.map(r=>norm(r.family))).size,audit:result.audit,byGoal,gameVerified:false,
   searchComplete:false,productionApproved:false,
   limitations:'同じ指定3頭・肌作り一次理論・因子未収録の「位置」まで同じ候補だけで、最終産駒31枠の記録済みニトロ段階を比較。比較先なしは不成立・劣位を意味しません。段階改善はクロスの効果、SP/ST・至高成立・工程追加の実利を証明せず、生産承認しません。有限探索内・実所持限定。'};
 }
 return Object.freeze({study,collect,evidenceStatus,compareStages,ROUTES,LABELS,GOALS});
});
