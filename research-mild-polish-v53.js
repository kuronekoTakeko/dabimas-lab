/* v5.3: Bounded single-substitution improvement for the nine-step MILD plan.
 * All candidates are created by the existing actual 9-step pedigree simulator.
 * Prefer evidence-backed effective cross factors, 5-generation factor positions,
 * and 4th/5th generation target lineages; never predict SP/ST values.
 * Only used by mild auto-create. Does not alter hard search or saved plans.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DabimasMildPolish53=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const norm=x=>String(x??'').normalize('NFKC').trim().toLowerCase();
 const weights={
  speed:{'走':5,'中':4,'短':3,'速':3,'長':1,'底':1,'堅':0},
  stamina:{'中':5,'長':4,'底':2,'速':2,'走':2,'短':1,'堅':0},
  balance:{'走':4,'中':4,'短':2,'速':3,'長':3,'底':1,'堅':0}
 };
 function metric(t,goal='balance'){
  if(!t||t.matches!==3||!t.full||Number(t.full.known)!==31)return null;
  const w=weights[goal]||weights.balance;
  const counts=t.extraFactorCounts||{};
  const countWeight=Object.entries(counts).reduce((sum,[name,n])=>sum+(w[name]||0)*Math.max(0,Number(n)||0),0);
  // This is a documented ancestry-POSITION reference, not official game nitro.
  const freq=Object.fromEntries(t.full.factorCounts||[]);
  const ancWeight=Object.entries(freq).reduce((sum,[name,n])=>sum+(w[name]||0)*Math.max(0,Number(n)||0),0);
  const spL=Math.max(0,Number(t.spL)||0),stL=Math.max(0,Number(t.stL)||0);
  const lines=goal==='speed'?spL*2+stL:goal==='stamina'?stL*2+spL:spL+stL;
  const risk=Math.max(0,Number(t.risk)||0);
  const uncertain=Math.max(0,Number(t.unresolvedCount)||0)+Math.max(0,Number(t.conflictCount)||0)*2;
  // Research ranking only; arithmetic is NOT a game-derived ability bonus.
  const score=countWeight*4+ancWeight*0.35+lines*1.5-risk*3-uncertain*0.5;
  return {score:Math.round(score*1000)/1000,crossFactorWeight:countWeight,
   namedCrosses:(t.extraEffective||[]).length,ancestorFactorWeight:ancWeight,lines,risk,uncertain};
 }
 function compare(a,b,goal){
  const x=metric(a,goal),y=metric(b,goal);
  if(!x)return 1;if(!y)return -1;
  // Preserve existing choice for identical research score; avoid arbitrary churn.
  return y.score-x.score;
 }
 function optimize({initial,mares=[],sires=[],evaluate,goal='balance',budget=900}){
  if(typeof evaluate!=='function'||!metric(initial,goal))return {error:'9工程の完全な初期候補がありません'};
  const limit=Math.max(0,Math.min(2000,Math.trunc(Number(budget)||0)));
  const opts=[...new Map((mares||[]).filter(Boolean).map(m=>[norm(m.id||m),m.id||m])).values()];
  const xs=[...new Map((sires||[]).filter(Boolean).map(m=>[norm(m.id||m),m.id||m])).values()];
  let current=initial,tests=0,invalid=0,xTests=0,mareTests=0;
  const used=new Set();
  const run=(choices,xId,kind)=>{
   if(tests>=limit)return null;
   const k=[1,2,3,4,5,6].map(n=>norm(choices[n])).join('\u001f')+'\u001e'+norm(xId);
   if(used.has(k))return null;used.add(k);tests++;
   const candidate=evaluate({...choices},xId);
   if(!metric(candidate,goal)){invalid++;return null;}
   if(kind==='X')xTests++;else mareTests++;
   return candidate;
  };
  function sweepX(){
   if(tests>=limit)return;
   // Coordinate pass: keep the mare slate fixed so X can be compared fairly.
   let best=current;
   for(const xId of xs){
    if(norm(xId)===norm(current.xId))continue;
    const candidate=run(current.choices,xId,'X');
    if(candidate&&compare(candidate,best,goal)<0)best=candidate;
    if(tests>=limit)break;
   }
   current=best;
  }
  function sweepMares(){
   // Only one place at a time, so no extra breeding step is introduced.
   // Preserve six distinct publicly listed mares and all three Shiko anchors.
   for(let n=1;n<=6&&tests<limit;n++){
    let best=current;
    for(const mareId of opts){
     if(norm(mareId)===norm(current.choices[n]))continue;
     if([1,2,3,4,5,6].some(other=>other!==n&&norm(current.choices[other])===norm(mareId)))continue;
     const candidate=run({...current.choices,[n]:mareId},current.xId,'mare');
     if(candidate&&compare(candidate,best,goal)<0)best=candidate;
     if(tests>=limit)break;
    }
    current=best;
   }
  }
  const before=metric(initial,goal);
  sweepX();sweepMares();sweepX();
  const after=metric(current,goal);
  return {winner:current,improved:compare(current,initial,goal)<0,
   audit:{schema:53,kind:'mild-nine-step-single-swap',goal,
    initialX:initial.xId,chosenX:current.xId,
    startingScore:before.score,chosenScore:after.score,
    startingKnownCrossFactors:initial.extraFactorCounts||{},chosenKnownCrossFactors:current.extraFactorCounts||{},
    namedExtraCrosses:(current.extraEffective||[]).map(c=>c.name),
    searched:tests,xTests,mareTests,invalid,limit,limited:tests>=limit,
    eligibleMares:opts.length,eligibleSires:xs.length,gameVerified:false,
    caveat:'研究用の局所探索。ゲーム内ニトロ・能力・至高成立を保証しません。'}
  };
 }
 return Object.freeze({metric,compare,optimize});
});
