/* v104: distance-sensitive EVIDENCE audit, not a simulated ability estimate.
 * Reads the recorded final 31-slot bloodline, never mutates plans.
 * User's chosen SP/ST goal remains authoritative for actual selection.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildDistanceAudit104=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const w={speed:{'走':6,'速':4,'短':3,'中':2,'長':1,'底':1},stamina:{'長':6,'中':4,'底':3,'走':2,'速':1,'短':1},balance:{'走':4,'速':3,'短':2,'中':4,'長':4,'底':2}};
 const text=x=>String(x??'').normalize('NFKC');
 function raceMeters(s){const m=text(s).match(/(?:芝|ダート)\s*(\d{3,4})\s*m/i);const n=m?Number(m[1]):null;return n>=800&&n<=4000?n:null;}
 function review(source,{race='',goal='balance'}={}){
  const rows=source?.foalRows||[];const meters=raceMeters(race);
  const seen=new Set(),known=[];let blank=0,missing=0;
  for(const r of rows){const p=String(r?.path||'');if(!/^[SD]{0,4}S$/.test(p)||p.length>5||seen.has(p))continue;seen.add(p);
   const fs=Array.isArray(r.factors)?r.factors.filter(Boolean):[];
   if(!fs.length)blank++;else for(const f of fs)known.push({f,path:p});
  }
  const scores=Object.fromEntries(Object.entries(w).map(([g,weights])=>[g,known.reduce((sum,r)=>sum+(weights[r.f]||0)*(r.path.length===4?1.7:r.path.length===5?0.85:0.5),0)]));
  const emphasis=meters==null?'unknown':meters<=1600?'speed':meters>=2200?'stamina':'balance';
  const mismatch=emphasis!=='unknown'&&goal!==emphasis;
  const anchors=['DDS','SSSS','SDSSS'].map(p=>{const a=rows.find(x=>x.path===p);return [p,a?.name||a?.horse||'',a?.variant||a?.factorVariant||''];});
  return {version:104,meters,emphasis,goal,goalDiffersFromDistanceLens:mismatch,
   knownFactorEntries:known.length,unknownFactorSlots:blank,registeredSlots:seen.size,
   indicators:Object.fromEntries(Object.entries(scores).map(([g,n])=>[g,Math.round(n*100)/100])),anchors,
   limited:true,gameVerified:false,caveat:'距離別の既知因子を研究用の仮の重みで再集計。独立クロス・ゲームの距離適性・産駒SP/ST・最適性の推定値ではない。未収録因子を0能力とみなさない。'};
 }
 function compare(a,b){
  if(!a||!b)return {comparable:false,reason:'両方の保存済み血統が必要'};
  const same=a.anchors.map(x=>x.join('|')).join(';')===b.anchors.map(x=>x.join('|')).join(';')&&a.registeredSlots===31&&b.registeredSlots===31;
  return {comparable:true,sameAnchors:same,sameRecordedIndicators:Object.keys(w).every(g=>a.indicators[g]===b.indicators[g]),
   note:'同じ登録因子評価でも距離適性や産駒能力が同等という意味ではありません。'};
 }
 return Object.freeze({raceMeters,review,compare});
});
