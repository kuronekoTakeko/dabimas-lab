/* v4.9 | Finalist selection across BOTH Shiko variants and placements.
 * Pure read-only selection. Only full descendants are passed to the deep search.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasGlobalShortlist49=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=v=>String(v??'').normalize('NFKC').trim();
const anchors=t=>(t?.anchor?.set||[]).map(r=>norm(r.id)).sort().join('|');
const placement=t=>['g3','g4','g5'].map(k=>norm(t?.draft?.routeDraft?.slots?.[k])).join('|');
function select(trials,limit,compare){
 const max=Math.max(0,Math.trunc(Number(limit)||0)),all=[];
 if(!max)return [];
 for(const trial of trials||[])for(const r of (trial?.ranked||[]).slice(0,3))if(r?.candidate)all.push({trial,rank:r});
 all.sort((a,b)=>compare(a.rank,b.rank)||anchors(a.trial).localeCompare(anchors(b.trial),'ja')||placement(a.trial).localeCompare(placement(b.trial),'ja'));
 const selected=[],usedPair=new Set(),usedAnchor=new Set();
 function add(it){const pair=anchors(it.trial)+'\u001f'+placement(it.trial);if(usedPair.has(pair))return false;
  usedPair.add(pair);usedAnchor.add(anchors(it.trial));selected.push(it);return true;}
 // Prioritize different 3-stallion sets first, then fill with different layouts.
 for(const it of all){if(usedAnchor.has(anchors(it.trial)))continue;add(it);if(selected.length>=max)return selected;}
 for(const it of all){add(it);if(selected.length>=max)return selected;}
 return selected;
}
return Object.freeze({select});
});
