/* v106: Read-only matching-system audit for direct / one-generation sire routes.
 * Matching uses documented parent systems (pa), never child-system guesses.
 * A four-system match is NOT a perfect/super-perfect/game confirmation.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasLineageOptions106=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const directPaths=['SSDS','SDDS','DSDS','DDDS'];
 const preparedPaths=['SDS','DDS'];
 const interestingPaths=['S','SDS','DS','DDS'];
 const code={Ro:'Royal Charger',Ne:'Nearctic',Ns:'Nasrullah',Sw:'Swynford'};
 const normalize=x=>String(x||'').normalize('NFKC');
 const signature=a=>[...new Set(a)].sort().join('|');
 const factorValue=(r,goal)=>{const wanted=goal==='stamina'?['長','底','中']:goal==='speed'?['速','走','短']:['速','走','短','長','底','中'];return (r?.factors||[]).filter(f=>wanted.includes(f)).length;};
 function inspect({sires=[],mares=[],theory,required=['Ro','Ne','Ns','Sw'],goal='speed',limit=20}={}){
  if(!theory?.canonical||!theory?.lookup)return {error:'親系統辞書を利用できません'};
  const target=required.map(x=>theory.canonical(code[x]||x));
  if(target.some(x=>!x)||new Set(target).size!==4)return {error:'4種類の異なる有効な親系統を指定してください'};
  const lookup=(r,path)=>{
   const a=(r?.ancestry||[]).find(x=>String(x.path).replace(/父/g,'S').replace(/母/g,'D')===path);
   if(!a)return null;
   const name=a.horse||a.name;
   if(name&&theory.isQuarantined?.(name))return null;
   const explicit=theory.canonical(a.parentSystem),indexed=name?theory.lookup(name)?.parent:null;
   if(explicit&&indexed&&explicit!==indexed)return null;
   return explicit||indexed||null;
  };
  // No false negatives when source parent-systems are absent: track unknown separately.
  const known=sires.filter(r=>r?.id&&r.ancestry?.length>=15);
  const mothers=mares.filter(r=>r?.id&&r.ancestry?.length>=15);
  const cache=new Map();
  for(const r of [...known,...mothers])cache.set(r,Object.fromEntries([...new Set([...directPaths,...preparedPaths,...interestingPaths])].map(p=>[p,lookup(r,p)])));
  const value=(r,p)=>cache.get(r)?.[p]||null;
  const matching=x=>x.every(Boolean)&&signature(x)===signature(target);
  const rows=[],stats={ownedTotal:sires.length,ownedWithPedigree:known.length,maresWithPedigree:mothers.length,directInspected:0,preparedInspected:0,directMatches:0,preparedMatches:0,unknownDirect:0,unknownPrepared:0,notMatchingDirect:0,notMatchingPrepared:0,gameVerified:false};
  for(const f of known){const line=directPaths.map(p=>value(f,p));stats.directInspected++;
   if(line.some(v=>!v)){stats.unknownDirect++;continue;}
   if(!matching(line)){stats.notMatchingDirect++;continue;}
   stats.directMatches++;
   rows.push({route:'直接',fatherId:f.id,motherId:null,matching:line,interesting:interestingPaths.map(p=>value(f,p)),sp:factorValue(f,'speed'),st:factorValue(f,'stamina'),goalScore:factorValue(f,goal),kind:'documented-match'});
  }
  const fReady=known.map(f=>({horse:f,matching:preparedPaths.map(p=>value(f,p)),interesting:['S','DS'].map(p=>value(f,p))}));
  const mReady=mothers.map(m=>({horse:m,matching:preparedPaths.map(p=>value(m,p)),interesting:['S','DS'].map(p=>value(m,p))}));
  for(const f of fReady)for(const m of mReady){stats.preparedInspected++;
   const line=[...f.matching,...m.matching];
   if(line.some(v=>!v)){stats.unknownPrepared++;continue;}
   if(!matching(line)){stats.notMatchingPrepared++;continue;}
   stats.preparedMatches++;
   rows.push({route:'自家製＋1工程',fatherId:f.horse.id,motherId:m.horse.id,matching:line,interesting:[...f.interesting,...m.interesting],sp:factorValue(f.horse,'speed')+factorValue(m.horse,'speed'),st:factorValue(f.horse,'stamina')+factorValue(m.horse,'stamina'),goalScore:factorValue(f.horse,goal)+factorValue(m.horse,goal),kind:'documented-match'});
  }
  const certainty=x=>new Set(x.interesting.filter(Boolean)).size;
  rows.sort((a,b)=>b.goalScore-a.goalScore||certainty(b)-certainty(a)||Number(a.route!=='直接')-Number(b.route!=='直接')||a.fatherId.localeCompare(b.fatherId,'ja')||(a.motherId||'').localeCompare(b.motherId||'','ja'));
  stats.totalMatches=rows.length;stats.showing=Math.min(rows.length,Math.max(0,limit));
  return {required:target,rows:rows.slice(0,stats.showing).map(x=>({...x,interestingKnownDistinct:certainty(x),interestingMissing:x.interesting.filter(v=>!v).length})),stats,note:'見事用の4親系統が種類一致する一次候補のみ。面白7/8、完璧・超完璧、全31枠とゲーム内成立は未判定。'};
 }
 return Object.freeze({inspect});
});
