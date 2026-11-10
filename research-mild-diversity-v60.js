/* v6.0: research-only parent-system diversity / recorded child-line diagnostics.
 * Parent systems: official named-horse registry only; unknown is NOT non-Ro.
 * Child line is separate and is NOT used to infer a parent system.
 * Never exclude a horse or claim a numeric SP/ST benefit from Ro avoidance.
 * Sources: https://dabimas.jp/kouryaku/guide/introduction-to-breeding-theories.html
 *          https://note.com/huh_ds/n/nda77b134971b (player research)
 * Checked 2026-11-10. No game-side outcome verification.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildDiversity60=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const RO='Royal Charger';
 function parentOf(row,theory,{mare=false}={}){
  if(!theory?.lookup||!row)return null;
  const ancestor=mare?(row.ancestry||[]).find(a=>a.path==='S'):null;
  return theory.lookup(mare?(ancestor?.horse||ancestor?.name):row.name)?.parent||null;
 }
 function orderCandidates(rows,theory,{mare=false,favorites={}}={}){
  return [...rows].sort((a,b)=>{
   const favA=Number(!!favorites[a.id]),favB=Number(!!favorites[b.id]);
   if(favA!==favB)return favB-favA;
   const rank=p=>p===RO?2:p?0:1; // unknown is neither preferred nor excluded
   const pa=rank(parentOf(a,theory,{mare})),pb=rank(parentOf(b,theory,{mare}));
   return pa-pb; // stable sort preserves existing research ranking within tier
  });
 }
 function summarize(ped,theory,{anchors=['SSS','DSSS','DDDSS']}={}){
  const rows=Array.isArray(ped?.rows)?ped.rows:[];
  const eligible=rows.filter(r=>[4,5].includes(r.path?.length)&&!anchors.some(p=>r.path===p||r.path.startsWith(p)));
  const knownParent=eligible.map(r=>({row:r,parent:theory?.lookup?.(r.name)?.parent||null}));
  const childLines=eligible.map(r=>String(r.line||'').trim()).filter(Boolean);
  const parentKnown=knownParent.filter(v=>v.parent),parentUnknown=knownParent.length-parentKnown.length;
  return {eligibleSlots:eligible.length,parentKnown:parentKnown.length,parentUnknown,
   extraRoyalCharger:parentKnown.filter(v=>v.parent===RO).length,
   nonRoyalCharger:parentKnown.filter(v=>v.parent!==RO).length,
   distinctChildLines:new Set(childLines).size,childLineKnown:childLines.length,
   knownParentDiversity:new Set(parentKnown.map(v=>v.parent)).size,
   anchorProtected:true,gameVerified:false};
 }
 // No global score: only break otherwise identical research-scored ties.
 function compareAtTie(a,b){if(!a||!b)return 0;
  if(a.extraRoyalCharger!==b.extraRoyalCharger)return a.extraRoyalCharger-b.extraRoyalCharger;
  // Do not reward more unknown evidence as Ro-free.
  if(a.parentKnown!==b.parentKnown)return b.parentKnown-a.parentKnown;
  return b.distinctChildLines-a.distinctChildLines;
 }
 return Object.freeze({parentOf,orderCandidates,summarize,compareAtTie});
});
