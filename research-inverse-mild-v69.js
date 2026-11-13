/* v6.9: DDS closing mare reverse search from eight parental-system slots.
 * Use the CSV pa: ancestors (never chi: child systems) and explicitly quarantine
 * unresolved records. These are documentary theory conditions, NOT game proof.
 * The 9-step inheritance DAG is preserved; prepare sire or base mare only when
 * a one-generation mating is needed. No user state mutation inside search.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasInverseMild69=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const FIXED=['Royal Charger','Nearctic'];
 const INTERESTING=['S','SDS','DS','DDS'];
 const MATCHING=['SSDS','SDDS','DSDS','DDDS'];
 const path=p=>String(p||'').replace(/父/g,'S').replace(/母/g,'D');
 const uniq=a=>[...new Set(a)];
 function lineAt(r,p,theory){if(!r||!theory)return null;
  const a=(r.ancestry||[]).find(x=>path(x.path)===p);
  // A source record is preferred over the global name dictionary only when it
  // provides a canonical, nonconflicting parent classification.
  const explicit=theory.canonical?.(a?.parentSystem||'')||null;
  const published=a?.horse||a?.name;
  const named=published?theory.lookup?.(published)?.parent||null:null;
  if(explicit&&named&&explicit!==named)return null;
  return explicit||named||null;
 }
 function ownLine(r,theory){return lineAt(r,'S',theory);}
 function signatures(r,theory){return {interesting:INTERESTING.map(p=>p==='S'?ownLine(r,theory):lineAt(r,p,theory)),matching:MATCHING.map(p=>lineAt(r,p,theory))};}
 // For an unbred sire foal of F x M: its 8 positions are deterministically
 // derived from four parent-line positions on each real parent, without
 // constructing 31 pedigree rows for every one of ~150,000 possible matings.
 function preparedSignatures(f,m,theory){return {
  interesting:[ownLine(f,theory),lineAt(f,'DS',theory),ownLine(m,theory),lineAt(m,'DS',theory)],
  matching:[lineAt(f,'SDS',theory),lineAt(f,'DDS',theory),lineAt(m,'SDS',theory),lineAt(m,'DDS',theory)]};
 }
 function describe(sig){const i=sig.interesting,m=sig.matching;
  if(i.some(v=>!v)||m.some(v=>!v))return {status:'未確認',eligible:false,distinct:null,reason:'親系統の8枠に未収録がある'};
  const set=new Set(m),need=FIXED.filter(x=>!set.has(x));
  if(need.length)return {status:'不成立',eligible:false,distinct:uniq([...i,...m]).length,reason:'見事用4枠にRo/Neの両方が揃わない'};
  // Fixed Ro+Ne plus the mother's available TWO lineage slots must cover the
  // sire's matching set. A 5th unrelated type in the base mare is NOT allowed.
  if(set.size>4)return {status:'不成立',eligible:false,distinct:uniq([...i,...m]).length,reason:'見事4枠の構成が不正'};
  const distinct=uniq([...i,...m]).length;
  return {status:distinct===8?'超完璧候補':distinct>=7?'完璧候補':'不成立',eligible:distinct>=7,distinct,reason:distinct>=7?'見事4系統＋面白8枠の事前条件':'面白系統が7種類に届かない'};
 }
 function pairLineKey(a,b){return [a,b].sort().join('|');}
 function familyKey(matching){return uniq(matching).sort().join('|');}
 function baseKey(base,theory){const s=ownLine(base,theory),d=lineAt(base,'DS',theory);return s&&d?pairLineKey(s,d):null;}
 function mareMatches(basePair,matching){if(!basePair)return false;return familyKey([...FIXED,...basePair])===familyKey(matching);}
 // A one-generation BASE MARE (owned sire B x named mare C) has parent system
 // of B and maternal grandsire system inherited from C's own father.
 function preparedBaseKey(f,m,theory){const a=ownLine(f,theory),b=ownLine(m,theory);return a&&b?pairLineKey(a,b):null;}
 function scoreOf(r,score){return Number(score?.(r))||0;}
 function buildBaseGroups(mares,owned,theory,score,maxPerKey=7,lines=null,scores=null){
  // v7.9: the 300x500 cross-join must not repeatedly parse ancestry,
  // consult parent-system dictionaries or rescore the same CSV mare.
  // These maps belong only to ONE search call (no stale global cache).
  const parent=r=>lines?lines.get(r.id)?.S||null:ownLine(r,theory);
  const motherDad=r=>lines?lines.get(r.id)?.DS||null:lineAt(r,'DS',theory);
  const weight=r=>scores?scores.get(r):scoreOf(r,score);
  const direct=new Map(),prepared=new Map();
  function add(map,k,obj){if(!k)return;const group=map.get(k)||[];group.push(obj);group.sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ja'));if(group.length>maxPerKey)group.pop();map.set(k,group);}
  for(const m of mares){const a=parent(m),b=motherDad(m),k=a&&b?pairLineKey(a,b):null;
   add(direct,k,{mareId:m.id,score:weight(m),name:m.id});}
  for(const f of owned){const a=parent(f),fs=weight(f);if(!a)continue;
   for(const m of mares){const b=parent(m);if(!b)continue;
    const k=pairLineKey(a,b);add(prepared,k,{fatherId:f.id,motherId:m.id,score:fs+weight(m),name:f.id+' × '+m.id});}}
  return {direct,prepared};
 }
 function matchingBaseKeys(matching){const allow=new Set(matching),other=uniq(matching.filter(x=>!FIXED.includes(x)));
  if(!FIXED.every(v=>allow.has(v))||other.length>2)return [];
  // A candidate with Ro/Ne duplicates may use a repeat; no new parent system
  // can be introduced or the matching SET will differ.
  const out=[];for(const a of allow)for(const b of allow){const k=pairLineKey(a,b);if(familyKey([...FIXED,a,b])===familyKey(matching)&&!out.includes(k))out.push(k);}return out;
 }
 function compare(a,b){return b.distinct-a.distinct||a.additionalBirths-b.additionalBirths||b.score-a.score||a.sireName.localeCompare(b.sireName,'ja')||a.baseName.localeCompare(b.baseName,'ja');}
 function search({ownedSires=[],mares=[],theory,score,excludeNames=[],limit=100,maxPerKey=7}={}){
  if(!theory?.canonical||!theory?.lookup)return {candidates:[],stats:{error:'親系統参照が必要'}};
  const exclude=new Set(excludeNames.map(n=>String(n||'').split('-')[0]));
  const owned=ownedSires.filter(s=>s?.id&&s.ancestry?.length>=15&&!exclude.has(s.name));
  const eligibleMares=mares.filter(m=>m?.id&&m.ancestry?.length>=15);
  // Precompute the few lineages actually needed before cross-joining 300×500.
  const cache=new Map();for(const r of [...owned,...eligibleMares])cache.set(r.id,Object.fromEntries(['S','DS','SDS','DDS','SSDS','SDDS','DSDS','DDDS'].map(k=>[k,lineAt(r,k,theory)])));
  const v=(r,k)=>cache.get(r.id)?.[k]||null;
  // Each record is scored once instead of once for every prepared sire/maiden
  // combination. Scores have the same input and numeric coercion as v6.9.
  const scored=new Map();for(const r of [...owned,...eligibleMares])scored.set(r,scoreOf(r,score));
  const bases=buildBaseGroups(eligibleMares,owned,theory,score,maxPerKey,cache,scored);
  const usableSires=[],stats={ownedSires:owned.length,mares:eligibleMares.length,ownedEightEligible:0,preparedEightEligible:0,precheckedPrepared:0,directBaseMatches:0,preparedBaseMatches:0,unknownEight:0};
  for(const sire of owned){const sig={interesting:INTERESTING.map(p=>v(sire,p)),matching:MATCHING.map(p=>v(sire,p))},verdict=describe(sig);
   if(verdict.status==='未確認')stats.unknownEight++;
   if(verdict.eligible){stats.ownedEightEligible++;usableSires.push({sireId:sire.id,sireName:sire.id,sig,distinct:verdict.distinct,sireScore:scored.get(sire)});}
  }
  for(const f of owned){for(const m of eligibleMares){stats.precheckedPrepared++;
    const sig={interesting:[v(f,'S'),v(f,'DS'),v(m,'S'),v(m,'DS')],matching:[v(f,'SDS'),v(f,'DDS'),v(m,'SDS'),v(m,'DDS')]},verdict=describe(sig);
    if(!verdict.eligible)continue;stats.preparedEightEligible++;
    usableSires.push({sirePrep:{fatherId:f.id,motherId:m.id},sireName:f.id+' × '+m.id,sig,distinct:verdict.distinct,sireScore:scored.get(f)+scored.get(m)});
  }}
  const finalists=[];
  for(const entry of usableSires){const keys=matchingBaseKeys(entry.sig.matching);
    for(const k of keys){const direct=bases.direct.get(k)||[],prep=bases.prepared.get(k)||[];
      for(const b of direct){stats.directBaseMatches++;finalists.push({...entry,baseMareId:b.mareId,baseName:b.name,additionalBirths:entry.sirePrep?1:0,score:entry.sireScore+b.score});}
      // Extra mare preparation is only a fallback per sire configuration;
      // don't spend a birth if a matching public mare is already available.
      if(direct.length===0)for(const b of prep){stats.preparedBaseMatches++;finalists.push({...entry,basePrep:{fatherId:b.fatherId,motherId:b.motherId},baseName:b.name,additionalBirths:(entry.sirePrep?1:0)+1,score:entry.sireScore+b.score});}
    }
  }
  finalists.sort(compare);
  const unique=[],seen=new Set();for(const c of finalists){const k=[c.sireId||c.sireName,c.baseMareId||c.baseName,c.distinct].join('|');if(seen.has(k))continue;seen.add(k);unique.push(c);if(unique.length>=limit)break;}
  return {candidates:unique,stats:{...stats,ranked:finalists.length,returned:unique.length}};
 }
 return Object.freeze({FIXED,INTERESTING,MATCHING,lineAt,ownLine,signatures,preparedSignatures,describe,baseKey,preparedBaseKey,matchingBaseKeys,mareMatches,compare,search});
});
