/* ダビマス配合研究所 v5.7: 締め肌・工程8の超完璧→完璧を優先する、工程数固定の限定探索。
 * 至高の一次条件を維持。子系統は配合理論の親系統とは混同しない。
 * 公式: https://dabimas.jp/kouryaku/guide/advisor-05.html (2026-11-10確認)
 * 未収録の親系統は未確認。能力/SP/STやゲーム内成立を予測しない。
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildMare57=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const norm=x=>String(x||'').normalize('NFKC').trim().toLowerCase();
 // A confirmed perfect outweighs a possibly-super-perfect with incomplete data.
 // '奇跡' is NEVER used as a score or condition in mild mode.
 function rank(result){if(!result)return -1;
  if(result.superPerfect==='成立')return 3;
  if(result.perfect==='成立')return 2;
  if(result.perfect==='未確認'||result.superPerfect==='未確認')return 1;
  return 0;
 }
 function assess(candidate,theory){
  if(!candidate||candidate.matches!==3||candidate.full?.known!==31||candidate.closingPed?.known!==31||candidate.closingPed?.conflicts?.length)return null;
  if(!theory?.inspect)return null;
  const verdict=theory.inspect(candidate.closingPed);
  return {rank:rank(verdict),perfect:verdict.perfect,superPerfect:verdict.superPerfect,
   evidenceCount:verdict.evidenceCount||0,missingCount:(verdict.missing||[]).length,gameVerified:false};
 }
 function compare(a,b,goal,{theory,compareResearch}={}){
  const x=assess(a,theory),y=assess(b,theory);
  if(!x)return 1;if(!y)return -1;
  if(x.rank!==y.rank)return y.rank-x.rank;
  // Do not reward a merely larger number of traced parent systems. Their
  // completeness does not establish a higher theoretical inheritance ability.
  return typeof compareResearch==='function'?compareResearch(a,b,goal):0;
 }
 function optimize({initial,mares=[],sires=[],evaluate,goal='balanced',theory,compareResearch,budget=360}={}){
  if(typeof evaluate!=='function'||!assess(initial,theory))return {error:'工程8を含む9工程の有効な初期候補がありません'};
  const limit=Math.max(0,Math.min(1000,Math.trunc(Number(budget)||0)));
  const opts=[...new Map(mares.filter(x=>x?.id).map(x=>[norm(x.id),x.id])).values()];
  const xs=[...new Map(sires.filter(x=>x?.id).map(x=>[norm(x.id),x.id])).values()];
  const used=new Set(),stats={tested:0,valid:0,invalid:0,stepsAdded:0};
  let current=initial;
  const sig=(choices,x)=>[1,2,3,4,5,6].map(n=>norm(choices[n])).join('\u001f')+'\u001e'+norm(x);
  used.add(sig(initial.choices,initial.xId));
  function tryCandidate(choices,xId){
   if(stats.tested>=limit)return null;
   const k=sig(choices,xId);if(used.has(k))return null;used.add(k);stats.tested++;
   let candidate;try{candidate=evaluate(choices,xId);}catch(_){stats.invalid++;return null;}
   if(!assess(candidate,theory)){stats.invalid++;return null;}
   stats.valid++;return candidate;
  }
  for(let round=0;round<2&&stats.tested<limit;round++){
   // At each stage compare real 31-slot offspring and pedigree rules.
   for(let n=1;n<=6&&stats.tested<limit;n++){
    let best=current;
    for(const id of opts){
     if(norm(id)===norm(current.choices[n]))continue;
     if([1,2,3,4,5,6].some(k=>k!==n&&norm(current.choices[k])===norm(id)))continue;
     const candidate=tryCandidate({...current.choices,[n]:id},current.xId);
     if(candidate&&compare(candidate,best,goal,{theory,compareResearch})<0)best=candidate;
     if(stats.tested>=limit)break;
    }
    current=best;
   }
   let best=current;
   for(const x of xs){
    if(norm(x)===norm(current.xId))continue;
    const candidate=tryCandidate({...current.choices},x);
    if(candidate&&compare(candidate,best,goal,{theory,compareResearch})<0)best=candidate;
    if(stats.tested>=limit)break;
   }
   current=best;
  }
  const before=assess(initial,theory),after=assess(current,theory);
  return {winner:current,improved:compare(current,initial,goal,{theory,compareResearch})<0,
   audit:{schema:57,kind:'nine-stage-mare-theory-priority',...stats,limit,limited:stats.tested>=limit,
    start:before,end:after,priority:['超完璧','完璧','未確認','不成立'],miracleIncluded:false,
    source:'https://dabimas.jp/kouryaku/guide/advisor-05.html',checkedAt:'2026-11-10',
    scope:'既存9工程内の名牝6枠・補助Xの局所差し替え。工程の追加なし。自家製起点の追加世代探索は未実装。',gameVerified:false}};
 }
 return Object.freeze({rank,assess,compare,optimize});
});
