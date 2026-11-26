/* v153: bounded independent retention of already validated DDS candidates.
 * Preserve routes discarded by the grade/cost retention cap for comparison. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildLane153=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const route=c=>c?.xPrep?(c.marePrep?'both':'sireOnly'):(c?.marePrep?'mareOnly':'direct');
 const grade=c=>c?.theory66?.blocked?0:c?.theory66?.superPerfect==='成立'?8:c?.theory66?.perfect==='成立'?7:0;
 const lane=c=>grade(c)+'|'+route(c);
 function valid(c){return grade(c)>=7&&c.matches===3&&c.full?.known===31&&c.full.rows?.length===31&&new Set(c.full.rows.map(r=>r.path)).size===31&&c.full.rows.every(r=>/^[SD]{0,4}S$/.test(r.path)&&r.name)&&!c.full.conflicts?.length&&!c.full.transmission?.conflicts?.length&&!c.full.transmission?.invalid?.length&&Number(c.additionalBirths)===Number(!!c.xPrep)+Number(!!c.marePrep);}
 function identity(c){return JSON.stringify([c.xId,c.xPrep?.fatherId,c.xPrep?.motherId,c.marePrep?.fatherId,c.marePrep?.motherId,Object.entries(c.choices||{}).sort((a,b)=>Number(a[0])-Number(b[0]))]);}
 function create(compare,goal=null){const lanes=new Map(),observed={},targets=new Map();
  const factors=goal==='stamina'?['長']:goal==='speed'?['短','速']:goal==='balance'?['短','速','長']:[];
  function keepTarget(c){if(!factors.length)return;const p=globalThis.DabimasMildNitro107?.inspect?.(c,goal);if(!p)return;for(const f of factors){const k=lane(c)+'|'+f,old=targets.get(k);if(!old||p.counts[f]>old.count||(p.counts[f]===old.count&&compare(c,old.c)<0))targets.set(k,{c,count:p.counts[f]});}}

  function observe(c){if(!valid(c))return false;const k=lane(c);observed[k]=(observed[k]||0)+1;const old=lanes.get(k);if(!old||compare(c,old)<0)lanes.set(k,c);keepTarget(c);return true;}
  function finish(ranked,baseLimit=4){const base=ranked.slice(0,baseLimit),ids=new Set(base.map(identity)),represented=new Set(base.map(lane));
   const extras=[];for(const [k,raw] of [...lanes].sort(([a],[b])=>b.localeCompare(a))){if(represented.has(k))continue;
    const refinements=ranked.filter(c=>valid(c)&&lane(c)===k);let best=raw;for(const c of refinements)if(compare(c,best)<0)best=c;
    const id=identity(best);if(ids.has(id))continue;ids.add(id);represented.add(k);extras.push(best);
   }
   for(const c of ranked)if(valid(c))keepTarget(c);
   const targetExtras=[];for(const [k,t] of targets){const id=identity(t.c);if(ids.has(id))continue;ids.add(id);targetExtras.push(t.c);}
   return {results:[...base,...extras,...targetExtras],audit:{version:153,observed:{...observed},baseline:base.length,added:extras.length,retained:[...represented],goalAdded:targetExtras.length,goalTargets:[...targets].map(([key,t])=>({key,count:t.count})),gameVerified:false,searchComplete:false}};
  }return {observe,finish};
 }
 return Object.freeze({create,valid,route,lane,identity});
});
