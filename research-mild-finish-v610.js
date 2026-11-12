/* v6.10 | Mild DDS final-pedigree research refinement.
 * Compare the COMPLETE 31-slot child pedigree after a documented perfect /
 * super-perfect closing-mare mating. Theoretical evidence is not an in-game
 * result. Only swap published supporting mares at core steps 3..7; never add
 * a generation, change the three Shiko variants, or change the closing mate.
 * An unrecorded factor is UNKNOWN, not evidence that a factor does not exist.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildFinish610=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=x=>String(x??'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
 const WEIGHTS={
  speed:{'走':6,'速':4,'短':3,'中':2,'長':1,'底':1},
  stamina:{'長':6,'中':4,'底':3,'走':2,'速':1,'短':1},
  balance:{'走':4,'速':3,'短':2,'中':4,'長':4,'底':2}
 };
 // Child lines from parent ancestry are research tags, NOT parent systems.
 const SPEED=['ハビタット','ボールドルーラー','フェアトライアル','クラリオン','プリンスビオ','トムフール','エクリプス','ダンテ','オーエンテューダー','インテント','ニアークティック','ネアルコ'];
 const STAMINA=['ハイペリオン','ブレニム','ネヴァーセイダイ','プリンスキロ','モスボロー','フェアウェイ','サーゲイロード','オリオール','ナスルーラ','テディ','フォルティノ','ヒムヤー','ニアークティック','ネアルコ'];
 function family(s){return String(s||'').replace(/系$/,'').trim();}
 function grade(t){return t?.theory66?.blocked?0:t?.theory66?.superPerfect==='成立'?8:t?.theory66?.perfect==='成立'?7:0;}
 function safeNumber(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,n):0;}
 function metric(t,goal='balance'){
  if(!t||t.matches!==3||t.full?.known!==31||t.full?.conflicts?.length||t.full?.transmission?.conflicts?.length||t.full?.transmission?.invalid?.length||grade(t)<7)return null;
  const w=WEIGHTS[goal]||WEIGHTS.balance,rows=t.full.rows||[];
  const anchors=new Set(['DDS','SSSS','SDSSS']);
  const support=rows.filter(r=>[4,5].includes(r.path?.length)&&!anchors.has(r.path));
  let lineWeighted=0,observedFactors=0,observedFactorRows=0;
  const childFamilies=new Set();
  for(const r of support){
   const line=family(r.line),scale=r.path.length===4?1.7:0.85;
   if(line){childFamilies.add(line);const sp=SPEED.includes(line),st=STAMINA.includes(line);
    lineWeighted+=scale*(goal==='speed'?(sp?2:0)+(st?0.5:0):goal==='stamina'?(st?2:0)+(sp?0.5:0):(sp?1.25:0)+(st?1.25:0));
   }
   if(Array.isArray(r.factors)&&r.factors.length){observedFactorRows++;
    for(const f of r.factors)observedFactors+=(w[f]||0)*scale;
   }
  }
  // Only documented, independent, conflict-free factor variants are treated
  // as cross-factor evidence. Raw ancestor factors have MUCH lower priority.
  const candidates=(t.extraEffective||[]).filter(x=>!x.conflicts?.length);
  const documented=candidates.filter(x=>x.counted?.length&&Object.values(x.counts||{}).some(v=>safeNumber(v)>0));
  const crossed=Object.entries(t.extraFactorCounts||{}).reduce((sum,[f,n])=>sum+(w[f]||0)*safeNumber(n),0);
  const risk=safeNumber(t.risk),conflicts=safeNumber(t.conflictCount);
  const unverified=safeNumber(t.unresolvedCount);
  const score=4*crossed+3*documented.length+0.35*candidates.length+lineWeighted+0.16*observedFactors+
   0.65*childFamilies.size-5*risk-20*conflicts-Math.min(3,unverified)*0.12;
  return {score:Math.round(score*100)/100,grade:grade(t),additionalBirths:safeNumber(t.additionalBirths),
   independentCrossCandidates:candidates.length,independentCrossEvidence:documented.length,crossFactorEvidence:Math.round(crossed*100)/100,
   ancestorFactorsRecorded:observedFactorRows,lineageEvidence:Math.round(lineWeighted*100)/100,
   childLineDiversity:childFamilies.size,shortCrossRisk:risk,unresolvedCrosses:unverified,
   source:'最終31枠（因子・独立クロス候補・子系統の研究用相対評価）',gameVerified:false};
 }
 function compare(a,b,goal='balance'){
  const x=metric(a,goal),y=metric(b,goal);
  if(!x)return y?1:0;if(!y)return -1;
  // Theory evidence outranks production cost. Within the same theory grade,
  // extra matings must not be added solely for a research score increase.
  return y.grade-x.grade||x.additionalBirths-y.additionalBirths||y.score-x.score;
 }
 function marePriority(m,goal){
  const w=WEIGHTS[goal]||WEIGHTS.balance;
  const ancestors=(m?.ancestry||[]).filter(a=>a?.horse||a?.name);
  const score=ancestors.reduce((sum,a)=>sum+(a.factors||[]).reduce((s,f)=>s+(w[f]||0),0),0);
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
 function optimize({initial,mares=[],evaluate,goal='balance',maxTests=80,steps=[3,4,5,6,7]}={}){
  const first=metric(initial,goal);
  if(!first||typeof evaluate!=='function')return {winner:initial,audit:{error:'有効な31枠・締め肌理論と評価関数が必要',gameVerified:false}};
  const limit=Math.max(0,Math.min(180,Math.trunc(maxTests)||0));
  const perStage=Math.max(0,Math.ceil(limit/Math.max(1,steps.length)));
  const candidates=shortlist(mares,goal,perStage);
  let best=initial,tests=0,invalid=0,changedSteps=[];
  const seen=new Set();
  for(const step of steps){
   if(![3,4,5,6,7].includes(step))continue;
   let stepBest=best;
   for(const mare of candidates){if(tests>=limit)break;
    const currentId=best.choices?.[step];if(!currentId||norm(mare.id)===norm(currentId))continue;
    if(Object.entries(best.choices||{}).some(([k,id])=>Number(k)!==step&&norm(id)===norm(mare.id)))continue;
    const choices={...best.choices,[step]:mare.id};
    const key=steps.map(n=>norm(choices[n])).join('|')+'|'+norm(choices[1]);
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
  return {winner:changed?best:initial,audit:{version:610,goal,tests,invalid,limit,limited:tests>=limit,
    changedSteps:changed?changedSteps:[],improved:changed,before:first,after:changed?after:first,
    gameVerified:false,caveat:'31枠の既知因子・独立クロス・子系統の相対順位。未収録は因子なしとしない。ゲーム内の効果・能力・至高成立は未検証。'}};
 }
 return Object.freeze({grade,metric,compare,shortlist,optimize});
});
