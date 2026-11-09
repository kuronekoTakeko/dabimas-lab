/* v4.9 | Original, bounded placement evaluation for the 3x4x5 Shiko premise.
 * This is a ranking heuristic. It does not infer in-game ability, prove a
 * Shiko theory, or presume the published 31 sire slots expose full siblings.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasPlacement49=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const str=x=>String(x??'').normalize('NFKC').trim();
 const sig=s=>['g3','g4','g5'].map(k=>str(s?.[k])).join('\u001f');
 function all(ids){
  if(!Array.isArray(ids)||ids.length!==3||ids.some(x=>!str(x))||new Set(ids.map(str)).size!==3)return [];
  const out=[];for(let a=0;a<3;a++)for(let b=0;b<3;b++){if(a===b)continue;let c=3-a-b;out.push({g3:ids[a],g4:ids[b],g5:ids[c]});}
  return out;
 }
 function score(a,goal='balance'){
  if(!a||typeof a!=='object')return -Infinity;
  const sp4=Number(a.sp4)||0,st4=Number(a.st4)||0,sp5=Number(a.sp5)||0,st5=Number(a.st5)||0;
  // 4th-generation lineages have higher priority; 5th-only are research signals.
  const bonus=goal==='speed'?sp4*4+st4+sp5*1.5+st5*.5:
   goal==='stamina'?st4*4+sp4+st5*1.5+sp5*.5:sp4*2.5+st4*2.5+sp5+st5;
  const issues=Array.isArray(a.issues)?a.issues.length:0;
  return (Number(a.knownSires)||0)*1.5+bonus+(Array.isArray(a.extraCrosses)?a.extraCrosses.length:0)*.75-issues*6;
 }
 function rank(ids,audit,goal='balance'){
  return all(ids).map(slots=>{let result=null,issue='';try{result=audit(slots);}catch(e){issue=String(e?.message||e);}
   return {slots,signature:sig(slots),score:score(result,goal),audit:result,issue};
  }).sort((a,b)=>b.score-a.score||a.signature.localeCompare(b.signature,'ja'));
 }
 function pick(entries,cap,baseline){
  const count=Math.max(0,Math.trunc(Number(cap)||0));if(!count)return [];
  const seen=new Set(),chosen=[];
  for(const item of entries||[]){if(!item||seen.has(item.signature))continue;seen.add(item.signature);chosen.push(item);if(chosen.length===count)break;}
  // Never lose v4.8's starting layout when a preflight-only heuristic is poor.
  const defaultKey=sig(baseline),original=(entries||[]).find(e=>e.signature===defaultKey);
  if(original&&!chosen.some(e=>e.signature===defaultKey)){
   if(chosen.length===count)chosen.pop();chosen.push(original);
  }
  return chosen;
 }
 return Object.freeze({all,rank,pick,score,signature:sig});
});
