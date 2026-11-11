/* v6.6a - bounded rescue for a nine-step maternal route.
 * Search after initial local seeds fail, without treating a failed shortlist as
 * proof of impossibility. Re-check every real pedigree through app callbacks.
 * No game-theory or ability claim; no persistent-state mutation.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMaternalRescue66a=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 function rescue({definitions,slots,mares,getSire,breed,createChild,complete,maxChecks=480,maxAttempts=72}){
  const result={candidate:null,checks:0,attempts:0,rejected:{unavailable:0,pedigree:0,final:0},budgetExceeded:false};
  if(!Array.isArray(definitions)||definitions.length!==9||!Array.isArray(mares)||mares.length<7)return result;
  const validMares=mares.filter(m=>m&&m.id);if(validMares.length<7)return result;
  const norm=v=>String(v||'').normalize('NFKC').replace(/[\s　]/g,'').toLowerCase();
  const offsets=[0,1,3,5,7,11,13,17];
  const seeds=Object.values(slots||{});
  if(!slots?.g3||!slots?.g4||!slots?.g5||new Set(seeds.map(norm)).size!==3)return result;
  for(let attempt=0;attempt<maxAttempts&&result.checks<maxChecks;attempt++){
   result.attempts++;
   const outputs={},used=new Set(),choices={};let valid=true;
   for(const def of definitions){
    if(result.checks>=maxChecks){valid=false;break;}
    const sire=def.sireSlot?getSire(slots[def.sireSlot]):outputs[def.sireStep];
    if(!sire){result.rejected.unavailable++;valid=false;break;}
    let chosen=null,ped=null;
    if(def.mareInput){
     const start=((attempt*offsets[def.n]+Math.floor(attempt/validMares.length)*7+def.n*11)%validMares.length+validMares.length)%validMares.length;
     // Each attempt tests a different region of the ranked pool. A failed
     // sire/mare pairing is replaced at THIS step instead of abandoning the
     // whole 7-mare combination.
     for(let i=0;i<validMares.length&&result.checks<maxChecks;i++){
      const candidate=validMares[(start+i)%validMares.length];
      if(used.has(norm(candidate.id)))continue;
      result.checks++;
      const next=breed(sire,candidate,def);
      if(!next||next.known!==31||next.conflicts?.length||next.transmission?.conflicts?.length||next.transmission?.invalid?.length){result.rejected.pedigree++;continue;}
      chosen=candidate;ped=next;break;
     }
     if(!chosen){result.rejected.unavailable++;valid=false;break;}
     used.add(norm(chosen.id));choices[def.n]=chosen.id;
    }else{
     const mare=outputs[def.mareStep];if(!mare){result.rejected.unavailable++;valid=false;break;}
     result.checks++;
     ped=breed(sire,mare,def);
     if(!ped||ped.known!==31||ped.conflicts?.length||ped.transmission?.conflicts?.length||ped.transmission?.invalid?.length){result.rejected.final++;valid=false;break;}
    }
    if(def.n<9){
     const output=createChild({definition:def,pedigree:ped,sire,mares:choices,outputs});
     if(!output){result.rejected.unavailable++;valid=false;break;}
     outputs[def.n]=output;
    }
   }
   if(!valid)continue;
   // Full source-mating check: exact factor variants, three Deep placements,
   // six kinds, and the regular application safety gate are NOT bypassed.
   const candidate=complete(choices);
   if(candidate){result.candidate=candidate;break;}
   result.rejected.final++;
  }
  result.budgetExceeded=result.checks>=maxChecks;
  return result;
 }
 return Object.freeze({rescue});
});
