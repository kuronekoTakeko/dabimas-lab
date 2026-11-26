/* v153: bounded independent retention of already validated DDS candidates.
 * Preserve routes discarded by the grade/cost retention cap for comparison. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildLane153=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const route=c=>c?.xPrep?(c.marePrep?'both':'sireOnly'):(c?.marePrep?'mareOnly':'direct');
 const grade=c=>c?.theory66?.blocked?0:c?.theory66?.superPerfect==='成立'?8:c?.theory66?.perfect==='成立'?7:0;
 const lane=c=>grade(c)+'|'+route(c);
 function valid(c){return grade(c)>=7&&c.matches===3&&c.full?.known===31&&c.full.rows?.length===31&&new Set(c.full.rows.map(r=>r.path)).size===31&&c.full.rows.every(r=>/^[SD]{0,4}S$/.test(r.path)&&r.name)&&!c.full.conflicts?.length&&!c.full.transmission?.conflicts?.length&&!c.full.transmission?.invalid?.length&&Number(c.additionalBirths)===Number(!!c.xPrep)+Number(!!c.marePrep);}
 function identity(c){return JSON.stringify([c.xId,c.xPrep?.fatherId,c.xPrep?.motherId,c.marePrep?.fatherId,c.marePrep?.motherId,Object.entries(c.choices||{}).sort((a,b)=>Number(a[0])-Number(b[0]))]);}
 function create(compare,goal=null){const lanes=new Map(),observed={},targets=new Map(),qualityTargets=new Map();
  const factors=goal==='stamina'?['長']:goal==='speed'?['短','速']:goal==='balance'?['短','速','長']:[];
  function keepTarget(c){if(!factors.length)return;const p=globalThis.DabimasMildNitro107?.inspect?.(c,goal);if(!p)return;for(const f of factors){const k=lane(c)+'|'+f,old=targets.get(k);if(!old||p.counts[f]>old.count||(p.counts[f]===old.count&&compare(c,old.c)<0))targets.set(k,{c,count:p.counts[f]});}}

  // v159: separate research objectives, not combined ability scores.
  function keepQuality(c){if(!factors.length)return;const api=globalThis.DabimasMildFinish610,n=globalThis.DabimasMildNitro107?.inspect?.(c,goal),m=api?.metric?.(c,goal);if(!n||!m)return;
   const objectives=[];const add=(k,v)=>{if(Number.isFinite(v)&&v>0)objectives.push([k,v]);};
   for(const g of m.generationEvidence||[]){if(g.known===g.slots)add('line'+g.depth,g.distinct);}
   for(const d of [4,5])for(const f of (goal==='speed'?['走']:goal==='stamina'?['中']:['走','中']))add(f+d,n.recordedByDepth155?.[d]?.[f]);
   add('documentedCross',m.independentCrossEvidence);const closing=api.closingEvidence?.(c,goal);add('closingNitro',closing?.researchIndex);
   const sire=api.closingEvidence?.(c,goal,'sire');for(const f of factors)add('sire:'+f,sire?.counts?.[f]);add('sireNitro',sire?.researchIndex);
   for(const [k,v] of objectives){const id=lane(c)+'|'+k,old=qualityTargets.get(id);if(!old||v>old.count||(v===old.count&&compare(c,old.c)<0))qualityTargets.set(id,{c,count:v});}
  }
  function observe(c){if(!valid(c))return false;const k=lane(c);observed[k]=(observed[k]||0)+1;const old=lanes.get(k);if(!old||compare(c,old)<0)lanes.set(k,c);keepTarget(c);keepQuality(c);return true;}
  function finish(ranked,baseLimit=4){const base=ranked.slice(0,baseLimit),ids=new Set(base.map(identity)),represented=new Set(base.map(lane));
   const extras=[];for(const [k,raw] of [...lanes].sort(([a],[b])=>b.localeCompare(a))){if(represented.has(k))continue;
    const refinements=ranked.filter(c=>valid(c)&&lane(c)===k);let best=raw;for(const c of refinements)if(compare(c,best)<0)best=c;
    const id=identity(best);if(ids.has(id))continue;ids.add(id);represented.add(k);extras.push(best);
   }
   for(const c of ranked)if(valid(c)){keepTarget(c);keepQuality(c);}
   const targetExtras=[];for(const [k,t] of targets){const id=identity(t.c);if(ids.has(id))continue;ids.add(id);targetExtras.push(t.c);}
   const qualityExtras=[];for(const [k,t] of qualityTargets){const id=identity(t.c);if(ids.has(id))continue;ids.add(id);qualityExtras.push(t.c);}
   return {results:[...base,...extras,...targetExtras,...qualityExtras],audit:{version:153,observed:{...observed},baseline:base.length,added:extras.length,retained:[...represented],goalAdded:targetExtras.length,qualityAdded:qualityExtras.length,qualityTargets:[...qualityTargets].map(([key,t])=>({key,count:t.count})),goalTargets:[...targets].map(([key,t])=>({key,count:t.count})),gameVerified:false,searchComplete:false}};
  }return {observe,finish};
 }
 return Object.freeze({create,valid,route,lane,identity});
});
