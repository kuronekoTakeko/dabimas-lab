/* v134 | Compare only jointly documented FINAL 31 ancestry slots.
 * This is a bounded research review, NOT a factor-zero assumption, not an
 * independent-cross validator, and not a production/breeding approval.
 * Only approved v132.collect candidates (real-owned, DDS, full-31, theoretical
 * closing grade) are considered. Never mutate source plans, animals or rights.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildCommonEvidence134=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const GOALS=['speed','balance','stamina'];
 const FACTORS=['短','速','長'];
 const SP=['速','短','走'],ST=['長','中','底'];
 const safe=(v)=>String(v??'');
 const vector=()=>({'短':0,'速':0,'長':0,sp:0,st:0});
 const difference=(a,b)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]-b[k]]));
 const goalLabel={speed:'SP重視',balance:'バランス',stamina:'ST重視'};
 const routeLabels={direct:'追加0',sireOnly:'種側＋1',mareOnly:'肌側＋1',both:'両側＋1'};
 const contribution=(fs,counts)=>{for(const f of fs){if(FACTORS.includes(f))counts[f]++;if(SP.includes(f))counts.sp++;if(ST.includes(f))counts.st++;}};
 function sharedEvidence(upper,lower){
  const a=upper?.documentedFactors||{},b=lower?.documentedFactors||{};
  const shared=Object.keys(a).filter(path=>/^[SD]{0,4}S$/.test(path)&&Array.isArray(a[path])&&Array.isArray(b[path])).sort();
  const observedUpper=vector(),observedLower=vector();
  for(const p of shared){contribution(a[p],observedUpper);contribution(b[p],observedLower);}
  return {sharedSlots:shared.length,unresolvedSlots:31-shared.length,
   upperRecorded:upper?.profile?.recorded??null,lowerRecorded:lower?.profile?.recorded??null,
   // These are raw factor counts in SHARED annotated positions, not nitro stages.
   upperCounts:observedUpper,lowerCounts:observedLower,differences:difference(observedUpper,observedLower),
   interpretation:'共通収録枠に限った本人因子の記録差。未収録枠は0因子ではなく、最終全31枠の優位・クロス・能力を判定できません。'};
 }
 function lowerComparators(r,rows){return rows.filter(x=>x.births===r.births-1&&x.grade===r.grade&&x.anchors===r.anchors);}
 function chooseComparator(r,low){
  if(!low.length)return null;
  const a=low.map(b=>({b,e:sharedEvidence(r,b)}));
  a.sort((x,y)=>y.e.sharedSlots-x.e.sharedSlots||x.b.births-y.b.births||
   x.b.profile.missing-y.b.profile.missing||x.b.id.localeCompare(y.b.id));
  return a[0];
 }
 function reviewPriority(rows){
  // This orders WHAT TO CHECK FIRST, not how strong a horse will be.
  const subset=rows.slice().sort((a,b)=>b.grade-a.grade||a.births-b.births||
   a.profile.missing-b.profile.missing||a.family.localeCompare(b.family,'ja')||a.id.localeCompare(b.id));
  const r=subset[0]||null;
  if(!r)return null;
  const prep=r.route==='sireOnly'&&r.seedMare?{sire:r.family,mare:r.seedMare}:null;
  return {family:r.family,route:r.route,additionalBirths:r.births,grade:r.grade===8?'超完璧・一次判定':'完璧・一次判定',
   missingFactorSlots:r.profile.missing,stages:{...r.profile.stages},
   prepFirst:prep,reviewOnly:true,productionApproved:false,gameVerified:false,
   reason:'理論の一次判定が同じ候補群では追加工程が少なく、因子の収録状況を優先して確認する。競走能力・至高・有効クロスの優位は未判定。'};
 }
 function study(trials,{v132,full31,ranker,owned,maxExamples=3}={}){
  if(!v132?.collect)return {version:134,available:false,reason:'v132の収集器を読み込めません',gameVerified:false};
  const collected=v132.collect(trials,{full31,ranker,owned});
  if(!collected.available)return {version:134,available:false,reason:collected.reason||'候補なし',audit:collected.audit,gameVerified:false};
  const rows=collected.rows,up=rows.filter(r=>r.births>0),items=[];
  let noLower=0,strict=0,partial=0,partialWithShared=0;
  let minShared=Infinity,maxShared=0,totalShared=0;
  for(const r of up){
   const lower=lowerComparators(r,rows),best=chooseComparator(r,lower);
   if(!lower.length){noLower++;continue;}
   const exact=lower.some(b=>b.missingSignature===r.missingSignature);
   if(exact){strict++;continue;}
   partial++;
   if(!best)continue;
   const e=best.e;
   if(e.sharedSlots>0)partialWithShared++;
   minShared=Math.min(minShared,e.sharedSlots);maxShared=Math.max(maxShared,e.sharedSlots);totalShared+=e.sharedSlots;
   if(items.length<Math.min(5,Math.max(1,Math.trunc(Number(maxExamples)||3))))items.push({
    route:r.route,family:r.family,missing:r.profile.missing,referenceFamily:best.b.family,
    referenceRoute:best.b.route,referenceMissing:best.b.profile.missing,
    ...e,abilityVerdict:null,productionApproved:false,gameVerified:false});
  }
  const priority=reviewPriority(rows);
  return {version:134,available:rows.length>0,gameVerified:false,productionApproved:false,searchComplete:false,
   checked:rows.length,counts:{direct:rows.filter(x=>x.route==='direct').length,
    sireOnly:rows.filter(x=>x.route==='sireOnly').length,mareOnly:rows.filter(x=>x.route==='mareOnly').length,
    both:rows.filter(x=>x.route==='both').length},
   noLower,strictComparable:strict,partialPairs:partial,partialWithShared,
   sharedSlotsRange:partial?{min:minShared,max:maxShared,mean:Math.round(10*totalShared/partial)/10}:null,
   examples:items,reviewPriority:priority,audit:collected.audit,
   limitations:'実所持・31枠・指定至高3頭・締め肌理論の一次判定を通過した同一探索集合だけを使用。異なる因子未収録位置の配合は、双方で因子が記録される最終5代の同じ位置だけを観察。共通枠以外は未知として残し、改善の証明・SP/ST能力予測・ゲーム内至高や有効クロスの成立認定は一切しません。確認優先例は強さのランキングではなく、生産指示ではありません。'};
 }
 return Object.freeze({study,sharedEvidence,reviewPriority,lowerComparators,chooseComparator,GOALS,goalLabel,routeLabels});
});
