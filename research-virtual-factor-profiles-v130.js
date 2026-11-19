/* v130 | Research-only evidence summaries from the SAME sampled recipe pool.
 * This module never predicts foal stats, validates supreme theory or writes data.
 * It counts ONLY the recorded OWN factors of publicly registered source sires,
 * not factors inherited by a future homebred or effective crosses.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasVirtualFactorProfiles130=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const goals=['speed','balance','stamina'];
 const labels={speed:'SP重視',balance:'バランス',stamina:'ST重視'};
 const short={speed:new Set(['速','短','走']),stamina:new Set(['長','中','底'])};
 const normalize=x=>String(x??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const counts=(r)=>{const d={sp:0,st:0,unknown:0};if(!r||!Array.isArray(r.factors))return d;
  for(const x of r.factors){if(short.speed.has(x))d.sp++;else if(short.stamina.has(x))d.st++;else d.unknown++;}return d;};
 const family=c=>c?.sirePrep?.fatherId||c?.sireId||'';
 const births=c=>Number.isFinite(Number(c?.additionalBirths))?Number(c.additionalBirths):99;
 const recipeKey=c=>[c?.sirePrep?.fatherId||c?.sireId||'',c?.sirePrep?.motherId||'',c?.basePrep?.fatherId||'',c?.basePrep?.motherId||c?.baseMareId||''].join('|');
 function sources(c){return [family(c),c?.basePrep?.fatherId].filter(Boolean);}
 function profile(c,lookup,owned){
  const ids=[...new Set(sources(c))]; const records=ids.map(id=>lookup.get(normalize(id))).filter(Boolean);
  const sums=records.map(counts).reduce((a,b)=>({sp:a.sp+b.sp,st:a.st+b.st,unknown:a.unknown+b.unknown}),{sp:0,st:0,unknown:0});
  return {key:recipeKey(c),father:family(c),foundation:c?.basePrep?.fatherId||'',additionalBirths:births(c),
   sp:sums.sp,st:sums.st,other:sums.unknown,sourceCount:ids.length,documented:records.length,
   usesVirtual:ids.some(id=>!owned?.[normalize(id)]?.owned&&!owned?.[id]?.owned)};
 }
 function order(a,b,goal){
  if(goal==='speed')return b.sp-a.sp||b.st-a.st;
  if(goal==='stamina')return b.st-a.st||b.sp-a.sp;
  return Math.min(b.sp,b.st)-Math.min(a.sp,a.st)||b.sp+b.st-a.sp-a.st;
 }
 function study({candidateSets={},master=[],owned={}}={}){
  const lookup=new Map((master||[]).filter(r=>r?.id).map(r=>[normalize(r.id),r]));
  const out=[];
  for(const scope of ['actual','virtual']){
   // All three policy samples form ONE frozen comparison cohort per scope.
   const seen=new Map();
   for(const goal of goals)for(const c of candidateSets?.[scope]?.[goal]||[]){const k=recipeKey(c);if(!seen.has(k))seen.set(k,c);}
   const profiles=[...seen.values()].map(c=>profile(c,lookup,owned));
   const choices={};
   for(const goal of goals){
    const byBirth={};
    for(const b of [0,1,2]){
     const rows=profiles.filter(p=>p.additionalBirths===b&&p.documented===p.sourceCount&&p.sourceCount>0);
     rows.sort((a,z)=>order(a,z,goal)||a.father.localeCompare(z.father,'ja')||a.key.localeCompare(z.key,'ja'));
     const top=rows[0]||null;
     byBirth[b]={checked:rows.length,top:top?{father:top.father,foundation:top.foundation,sp:top.sp,st:top.st,additionalBirths:b,usesVirtual:top.usesVirtual}:null};
    }
    choices[goal]=byBirth;
   }
   const fatherFamilies=new Set(profiles.map(p=>normalize(p.father)).filter(Boolean)).size;
   const missingSources=profiles.filter(p=>p.documented!==p.sourceCount).length;
   const sign=(goal,b)=>choices[goal][b]?.top?.father||'';
   const distinctWinners=[0,1,2].some(b=>new Set(goals.map(g=>sign(g,b)).filter(Boolean)).size>1);
   out.push({scope,cohortSize:profiles.length,fatherFamilies,missingSources,goalSensitiveFather:distinctWinners,choices});
  }
  return {version:130,comparisons:out,limitations:'同じ限定抽出集合内で、配合素材に指定された公開種牡馬の本人因子だけを計数した参考比較。繁殖牝馬・祖先5代・自家製産駒の本人因子は加算しない。SP/ST予測、ニトロ、至高成立、独立クロス、実生産の順位を意味しない。工程数0/1/2は互いに直接の強弱判定をしない。',gameVerified:false};
 }
 return Object.freeze({counts,recipeKey,profile,study,goals,labels});
});
