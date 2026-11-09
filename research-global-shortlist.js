/* v4.7: Global cross-family foundation shortlist for serious production.
 * Compare evidence first; preserve at least one finalist per viable center trio
 * when possible. This is bounded heuristic research, not global optimality proof. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasGlobalShortlist47=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
function select(trials,limit,compare){
 const max=Math.max(0,Math.trunc(Number(limit)||0));
 if(max===0)return [];
 const all=[];
 for(const trial of trials||[]){
  if(!trial?.anchor||!Array.isArray(trial.ranked))continue;
  for(const r of trial.ranked.slice(0,3))if(r?.candidate)all.push({trial,rank:r});
 }
 all.sort((a,b)=>compare(a.rank,b.rank)||String(a.trial.anchor.set?.map(x=>x.id).join('|')||'').localeCompare(String(b.trial.anchor.set?.map(x=>x.id).join('|')||'')));
 // First pass: maximize center-trio breadth, second pass: fill remaining slots
 // with the strongest foundations. Never change the stored rank/evidence.
 const result=[],seen=new Set();
 for(const item of all){
  const key=(item.trial.anchor.set||[]).map(x=>x.id).join('\u001f');
  if(seen.has(key))continue;
  result.push(item);seen.add(key);if(result.length>=max)return result;
 }
 for(const item of all){if(result.includes(item))continue;result.push(item);if(result.length>=max)break;}
 return result;
}
return Object.freeze({select});
});
