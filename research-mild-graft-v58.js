/* ダビマス配合研究所 v5.8 — マイルド型の母系1代仕込み候補を限定探索。
 * 親系統は公式明示データだけで判定し、未確認を成立扱いしない。
 * 未生産のSP/STと自家製牡馬の本人因子は推測しない。
 * 既存9工程より1工程多い候補は、工程8の配合理論が確実に改善し
 * かつ従来研究指数が悪化しない場合に限って採用可能とする。
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildGraft58=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const rank=v=>v?.superPerfect==='成立'?3:v?.perfect==='成立'?2:0;
 function pedigree(trial){
  const ancestor=trial?.outputs?.[8]?.ancestry;
  if(!Array.isArray(ancestor)||ancestor.length!==31)return null;
  const paths=new Set(ancestor.map(r=>r.path));
  if(paths.size!==31||ancestor.some(r=>!r.path||!r.horse))return null;
  return {known:31,rows:ancestor.map(r=>({path:r.path,name:r.horse,line:r.line,factors:r.factors,factorVariant:r.factorVariant})),conflicts:[]};
 }
 function assess(trial,theory){
  if(!trial||trial.error||trial.final?.known!==31||trial.final?.conflicts?.length||trial.final?.transmission?.conflicts?.length)return null;
  const ped=pedigree(trial);if(!ped||typeof theory?.inspect!=='function')return null;
  const verdict=theory.inspect(ped);
  if(verdict.blocked)return null;
  return {rank:rank(verdict),perfect:verdict.perfect,superPerfect:verdict.superPerfect,unconfirmed:verdict.perfect==='未確認'||verdict.superPerfect==='未確認',gameVerified:false};
 }
 function optimize({baseline,evaluate,sires=[],theory,budget=180,maxStages=10,scoreOf=t=>t?.metrics?.score}={}){
  const initial=assess(baseline,theory);
  if(!initial||typeof evaluate!=='function')return {error:'9工程基準血統または工程8の判定情報が不足'};
  const limit=Math.max(0,Math.min(400,Math.trunc(Number(budget)||0)));
  const currentScore=Number(scoreOf(baseline));
  const stats={tested:0,valid:0,stageOverflow:0,unknown:0,noTheoryGain:0,researchDecline:0};
  let winner=baseline,winInfo=initial,winScore=currentScore,chosenId=null;
  const ids=new Set();
  for(const sire of sires){
   if(stats.tested>=limit)break;
   const id=sire?.id;
   if(!id||ids.has(id))continue;ids.add(id);stats.tested++;
   let trial;try{trial=evaluate(id);}catch(_){continue;}
   const info=assess(trial,theory);if(!info)continue;
   stats.valid++;
   if(trial.stages>maxStages||trial.stages<10){stats.stageOverflow++;continue;}
   if(info.rank===0){stats.unknown++;continue;}
   if(info.rank<=winInfo.rank){stats.noTheoryGain++;continue;}
   const score=Number(scoreOf(trial));
   if(!Number.isFinite(score)||!Number.isFinite(currentScore)||score<currentScore){stats.researchDecline++;continue;}
   if(info.rank>winInfo.rank||(info.rank===winInfo.rank&&score>winScore)){
    winner=trial;winInfo=info;winScore=score;chosenId=id;
   }
  }
  return {winner,improved:!!chosenId,audit:{schema:58,kind:'one-extra-maternal-generation',...stats,budget:limit,limited:stats.tested>=limit,
   start:initial,end:winInfo,chosenSireId:chosenId,baseStages:baseline.stages,resultStages:winner.stages,
   priority:['超完璧','完璧'],miracleIncluded:false,gameVerified:false,
   source:'https://dabimas.jp/kouryaku/guide/advisor-05.html',checkedAt:'2026-11-10',
   scope:'工程6の基礎名牝に所持種牡馬を一度交配する母系仕込み。最大1工程追加。能力未測定・局所探索。'}};
 }
 async function optimizeAsync({baseline,evaluate,sires=[],theory,budget=180,maxStages=10,scoreOf=t=>t?.metrics?.score,yieldEvery=8,yieldControl=null,onProgress=null}={}){
  const initial=assess(baseline,theory);
  if(!initial||typeof evaluate!=='function')return {error:'9工程基準血統または工程8の判定情報が不足'};
  const limit=Math.max(0,Math.min(400,Math.trunc(Number(budget)||0)));
  const currentScore=Number(scoreOf(baseline));
  const stats={tested:0,valid:0,stageOverflow:0,unknown:0,noTheoryGain:0,researchDecline:0};
  let winner=baseline,winInfo=initial,winScore=currentScore,chosenId=null;
  const ids=new Set();
  for(const sire of sires){
   if(stats.tested>=limit)break;
   const id=sire?.id;
   if(!id||ids.has(id))continue;ids.add(id);stats.tested++;
   let trial;try{trial=evaluate(id);}catch(_){continue;}
   if(stats.tested%Math.max(1,Math.trunc(Number(yieldEvery)||8))===0){if(typeof onProgress==='function')onProgress(stats.tested,limit);if(typeof yieldControl==='function')await yieldControl();}
   const info=assess(trial,theory);if(!info)continue;
   stats.valid++;
   if(trial.stages>maxStages||trial.stages<10){stats.stageOverflow++;continue;}
   if(info.rank===0){stats.unknown++;continue;}
   if(info.rank<=winInfo.rank){stats.noTheoryGain++;continue;}
   const score=Number(scoreOf(trial));
   if(!Number.isFinite(score)||!Number.isFinite(currentScore)||score<currentScore){stats.researchDecline++;continue;}
   if(info.rank>winInfo.rank||(info.rank===winInfo.rank&&score>winScore)){
    winner=trial;winInfo=info;winScore=score;chosenId=id;
   }
  }
  return {winner,improved:!!chosenId,audit:{schema:58,kind:'one-extra-maternal-generation',...stats,budget:limit,limited:stats.tested>=limit,
   start:initial,end:winInfo,chosenSireId:chosenId,baseStages:baseline.stages,resultStages:winner.stages,
   priority:['超完璧','完璧'],miracleIncluded:false,gameVerified:false,
   source:'https://dabimas.jp/kouryaku/guide/advisor-05.html',checkedAt:'2026-11-10',
   scope:'工程6の基礎名牝に所持種牡馬を一度交配する母系仕込み。最大1工程追加。能力未測定・局所探索。'}};
 }
 return Object.freeze({rank,pedigree,assess,optimize,optimizeAsync});
});
