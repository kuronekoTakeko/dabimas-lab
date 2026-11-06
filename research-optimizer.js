/* v4.0 independent research-only candidate gate; no invented genetic effects. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasResearchOptimizer40=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const num=x=>Number.isFinite(Number(x))?Number(x):0;
 const metric=(t,k)=>num(t?.metrics?.[k]);
 const stage=t=>Math.max(9,num(t?.stages||9));
 const crosses=t=>num(t?.cross?.total);
 const independent=t=>num(t?.cross?.independentCount);
 const line=(t,goal)=>goal==='speed'?metric(t,'sp4')*3+metric(t,'sp5'):goal==='stamina'?metric(t,'st4')*3+metric(t,'st5'): (metric(t,'sp4')+metric(t,'st4'))*3+metric(t,'sp5')+metric(t,'st5');
 const positional=(t,goal)=>{const f=t?.metrics?.factor4_5||{};const factors=goal==='speed'?['短','速','走','中']:goal==='stamina'?['長','中']:['速','走','長','中'];return factors.reduce((n,k)=>n+Math.min(8,num(f[k])),0);};
 function inspect(base,candidate,goal='balance'){
  if(!base||!candidate||base.error||candidate.error)return {adopt:false,reason:'比較できない候補'};
  if(metric(candidate,'conflicts')>metric(base,'conflicts'))return {adopt:false,reason:'因子・祖先の矛盾が増加'};
  if(crosses(candidate)<crosses(base)||independent(candidate)<independent(base))return {adopt:false,reason:'判明クロスまたは独立候補が減少'};
  const additional=Math.max(0,stage(candidate)-stage(base));
  const scoreGain=metric(candidate,'score')-metric(base,'score');
  const crossGain=crosses(candidate)-crosses(base);
  const independentGain=independent(candidate)-independent(base);
  const lineageGain=line(candidate,goal)-line(base,goal);
  const factorGain=positional(candidate,goal)-positional(base,goal);
  const tangible=crossGain>0||independentGain>0||lineageGain>0||factorGain>0;
  // The coefficient is an explicit search-efficiency preference, not a horse-ability estimate.
  const minimum=0.35*additional+0.05;
  return {adopt:tangible&&scoreGain>minimum,reason:!tangible?'5代内の根拠付き改善なし':scoreGain<=minimum?'工程増に見合う研究評価差なし':'根拠付き改善',additional,scoreGain,crossGain,independentGain,lineageGain,factorGain,minimum};
 }
 function compare(a,b,goal='balance'){
  if(!a)return 1;if(!b)return -1;
  const ab=inspect(b,a,goal),ba=inspect(a,b,goal);
  if(ab.adopt&&!ba.adopt)return -1;
  if(ba.adopt&&!ab.adopt)return 1;
  const ua=metric(a,'score')-0.35*(stage(a)-9),ub=metric(b,'score')-0.35*(stage(b)-9);
  if(Math.abs(ua-ub)>0.05)return ub-ua;
  return stage(a)-stage(b)||independent(b)-independent(a);
 }
 return Object.freeze({inspect,compare});
});
