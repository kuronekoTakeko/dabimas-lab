/* v6.9: DDS closing mare reverse search from eight parental-system slots.
 * Use the CSV pa: ancestors (never chi: child systems) and explicitly quarantine
 * unresolved records. These are documentary theory conditions, NOT game proof.
 * The 9-step inheritance DAG is preserved; prepare sire or base mare only when
 * a one-generation mating is needed. No user state mutation inside search.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasInverseMild69=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 // Legacy export only. Production reverse-search receives the actual g3
 // ancestor's two documented parent systems; no Deep-specific default.
 const FIXED=['Royal Charger','Nearctic'];
 const INTERESTING=['S','SDS','DS','DDS'];
 const MATCHING=['SSDS','SDDS','DSDS','DDDS'];
 const path=p=>String(p||'').replace(/父/g,'S').replace(/母/g,'D');
 const uniq=a=>[...new Set(a)];
 const norm=v=>String(v??'').normalize('NFKC').trim().toLowerCase();
 function lineAt(r,p,theory){if(!r||!theory)return null;
  const a=(r.ancestry||[]).find(x=>path(x.path)===p);
  // A source record is preferred over the global name dictionary only when it
  // provides a canonical, nonconflicting parent classification.
  const explicit=theory.canonical?.(a?.parentSystem||'')||null;
  const published=a?.horse||a?.name;
  // A name with contradictory published parent systems is quarantined by
  // the master registry. An individual row must NOT bypass that quarantine
  // merely because it carries a nonempty pa column.
  if(published&&theory.isQuarantined?.(published))return null;
  const named=published?theory.lookup?.(published)?.parent||null:null;
  if(explicit&&named&&explicit!==named)return null;
  return explicit||named||null;
 }
 function ownLine(r,theory){return lineAt(r,'S',theory);}
 function fixedFromAnchor(anchor,theory){
  const father=ownLine(anchor,theory),maternalGrandsire=lineAt(anchor,'DS',theory);
  const values=[father,maternalGrandsire];
  return {ready:values.every(Boolean),values,anchorId:anchor?.id||'',
   missing:[...(!father?['S']:[]),...(!maternalGrandsire?['DS']:[])],
   evidence:'3代目指定種牡馬の父・母父の公開pa親系統（子系統ではない）',gameVerified:false};
 }
 function validFixed(values,theory){return Array.isArray(values)&&values.length===2&&values.every(v=>theory?.canonical?.(v)===v);}
 function signatures(r,theory){return {interesting:INTERESTING.map(p=>p==='S'?ownLine(r,theory):lineAt(r,p,theory)),matching:MATCHING.map(p=>lineAt(r,p,theory))};}
 // For an unbred sire foal of F x M: its 8 positions are deterministically
 // derived from four parent-line positions on each real parent, without
 // constructing 31 pedigree rows for every one of ~150,000 possible matings.
 function preparedSignatures(f,m,theory){return {
  interesting:[ownLine(f,theory),lineAt(f,'DS',theory),ownLine(m,theory),lineAt(m,'DS',theory)],
  matching:[lineAt(f,'SDS',theory),lineAt(f,'DDS',theory),lineAt(m,'SDS',theory),lineAt(m,'DDS',theory)]};
 }
 function describe(sig,fixed=FIXED){const i=sig.interesting,m=sig.matching;
  if(!validFixed(fixed,{canonical:v=>fixed.includes(v)?v:null}))return {status:'未確認',eligible:false,distinct:null,reason:'中心3代目の固定親系統2枠が未確認'};
  if(i.some(v=>!v)||m.some(v=>!v))return {status:'未確認',eligible:false,distinct:null,reason:'親系統の8枠に未収録がある'};
  const set=new Set(m),need=fixed.filter(x=>!set.has(x));
  if(need.length)return {status:'不成立',eligible:false,distinct:uniq([...i,...m]).length,reason:'見事用4枠に中心種牡馬由来の固定親系統が揃わない'};
  // Fixed Ro+Ne plus the mother's available TWO lineage slots must cover the
  // sire's matching set. A 5th unrelated type in the base mare is NOT allowed.
  if(set.size>4)return {status:'不成立',eligible:false,distinct:uniq([...i,...m]).length,reason:'見事4枠の構成が不正'};
  const distinct=uniq([...i,...m]).length;
  return {status:distinct===8?'超完璧候補':distinct>=7?'完璧候補':'不成立',eligible:distinct>=7,distinct,reason:distinct>=7?'見事4系統＋面白8枠の事前条件':'面白系統が7種類に届かない'};
 }
 function pairLineKey(a,b){return [a,b].sort().join('|');}
 function familyKey(matching){return uniq(matching).sort().join('|');}
 function baseKey(base,theory){const s=ownLine(base,theory),d=lineAt(base,'DS',theory);return s&&d?pairLineKey(s,d):null;}
 function mareMatches(basePair,matching,fixed=FIXED){if(!basePair)return false;return familyKey([...fixed,...basePair])===familyKey(matching);}
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
 function matchingBaseKeys(matching,fixed=FIXED){const allow=new Set(matching),other=uniq(matching.filter(x=>!fixed.includes(x)));
  if(!fixed.every(v=>allow.has(v))||other.length>2)return [];
  // A candidate with Ro/Ne duplicates may use a repeat; no new parent system
  // can be introduced or the matching SET will differ.
  const out=[];for(const a of allow)for(const b of allow){const k=pairLineKey(a,b);if(familyKey([...fixed,a,b])===familyKey(matching)&&!out.includes(k))out.push(k);}return out;
 }
 function compare(a,b){return b.distinct-a.distinct||a.additionalBirths-b.additionalBirths||b.score-a.score||a.sireName.localeCompare(b.sireName,'ja')||a.baseName.localeCompare(b.baseName,'ja');}
 // v8.8: A truncated candidate list previously concentrated on the same high-
 // scoring sire family. Diversify within EACH preliminarily qualified grade,
 // preserving the original ordered best candidate as the first choice. This
 // changes only which real 31-slot matings are examined, not their final rank.
 function diversifyLane(rows){
  const grades=new Map();
  for(const row of rows){const grade=Number(row.distinct)||0;
   if(!grades.has(grade))grades.set(grade,new Map());
   const families=grades.get(grade),family=norm(row.sirePrep?.fatherId||row.sireId||row.sireName);
   if(!families.has(family))families.set(family,[]);
   families.get(family).push(row);
  }
  const byGrade=new Map();
  for(const grade of [...grades.keys()].sort((a,b)=>b-a)){
   const families=[...grades.get(grade).values()],offsets=families.map(()=>0),spread=[];
   let remaining=families.reduce((n,g)=>n+g.length,0);
   while(remaining){for(let j=0;j<families.length;j++){
    if(offsets[j]<families[j].length){spread.push(families[j][offsets[j]++]);remaining--;}
   }}
   byGrade.set(grade,spread);
  }
  // 8-system prechecks have priority, but reserve one chance in five for a
  // 7-system fallback: an 8-system shortcut may later fail the 31-slot gate.
  const levels=[...byGrade.keys()].sort((a,b)=>b-a),top=byGrade.get(levels[0])||[];
  const lower=levels.slice(1).flatMap(g=>byGrade.get(g)||[]),chosen=[];
  let hi=0,lo=0;
  while(hi<top.length||lo<lower.length){
   for(let i=0;i<4&&hi<top.length;i++)chosen.push(top[hi++]);
   if(lo<lower.length)chosen.push(lower[lo++]);
  }
  return chosen;
 }
 // Default remains backward-compatible for earlier research/test consumers;
 // production mild mode explicitly passes 1, never silently creates 11 stages.
 // v8.9: strict two-pass budget. The caller tries the reserve window ONLY
 // when no complete pedigree survived the first window. Never scan forever.
 function shouldInspect89(index,found,primary=100,reserve=60){
  const n=Math.trunc(Number(index)),p=Math.max(0,Math.trunc(Number(primary)||0)),
   r=Math.max(0,Math.trunc(Number(reserve)||0));
  if(!Number.isFinite(n)||n<0||n>=p+r)return false;
  return n<p||Number(found)===0;
 }
 // v9.0: even if grade-7 full pedigrees are found, a finite reserve window
 // must be available while the grade-8 comparison remains unresolved.
 // bestGrade: -1/0/1 no complete, 2 perfect, 3 super-perfect (documentary).
 function shouldInspect90(index,bestGrade,primary=100,reserve=60){
  const n=Math.trunc(Number(index)),p=Math.max(0,Math.trunc(Number(primary)||0));
  const r=Math.max(0,Math.trunc(Number(reserve)||0));
  if(!Number.isFinite(n)||n<0||n>=p+r)return false;
  return n<p||Number(bestGrade)<3;
 }
 // Pure bounded candidate retention. Later grade-8 pedigrees may replace
 // an earlier perfect-only slate without mutating caller-owned results.
 function retainStrongest90(previous,candidate,cap,rank){
  const limit=Math.max(0,Math.trunc(Number(cap)||0));
  if(!limit)return [];
  const score=typeof rank==='function'?rank:()=>0;
  return [...(previous||[]),candidate].sort((a,b)=>(Number(score(b))||0)-(Number(score(a))||0)).slice(0,limit);
 }
 // v105: competing complete pedigrees must not lose to four earlier
 // same-father recipes on a tie. Preserve theory grade and birth-count
 // priority; reserve a place for a different father within equal tier.
 // Caller still performs the full 31-slot quality ranking afterwards.
 function retainDiverse105(previous,candidate,cap,gradeOf,familyOf){
  const limit=Math.max(0,Math.trunc(Number(cap)||0));if(!limit)return [];
  const grade=typeof gradeOf==='function'?gradeOf:()=>0;
  const family=typeof familyOf==='function'?familyOf:x=>x?.closingSireFamily105||x?.xId||'';
  const all=[...(previous||[]),candidate];
  const groups=new Map();
  for(let index=0;index<all.length;index++){
   const x=all[index],tier=(Number(grade(x))||0)+'|'+(Number(x?.additionalBirths)||0);
   if(!groups.has(tier))groups.set(tier,[]);
   groups.get(tier).push({x,index,family:String(family(x)||'未確認')});
  }
  const tiers=[...groups.keys()].sort((a,b)=>{
   const [ag,ab]=a.split('|').map(Number),[bg,bb]=b.split('|').map(Number);
   return bg-ag||ab-bb;
  });
  const kept=[];
  for(const tier of tiers){
   const items=groups.get(tier),selectedFamilies=new Set();
   // Choose first by original order, then one from every other sire family.
   for(const item of items){if(kept.length>=limit)break;
    if(!selectedFamilies.has(item.family)){kept.push(item.x);selectedFamilies.add(item.family);}
   }
   for(const item of items){if(kept.length>=limit)break;
    if(!kept.includes(item.x))kept.push(item.x);
   }
   if(kept.length>=limit)break;
  }
  return kept;
 }
 function shortlist(finalists,{limit=100,maxAdditionalBirths=2}={}){
  const direct=[],oneSire=[],other=[],seen=new Set();
  const budget=Math.max(0,Math.min(2,Math.trunc(Number(maxAdditionalBirths)||0)));
  let excludedOverBudget=0,duplicates=0;
  for(const c of finalists||[]){
   if((Number(c.additionalBirths)||0)>budget){excludedOverBudget++;continue;}
   const k=[c.sireId||c.sireName,c.baseMareId||c.baseName,c.distinct].join('|');
   if(seen.has(k)){duplicates++;continue;}seen.add(k);
   if(c.additionalBirths===0)direct.push(c);
   else if(c.additionalBirths===1&&c.sirePrep&&!c.basePrep)oneSire.push(c);
   else other.push(c);
  }
  const d=diversifyLane(direct),s=diversifyLane(oneSire),o=diversifyLane(other);
  const max=Math.max(0,Math.trunc(Number(limit)||0)),out=[];
  let di=0,si=0,oi=0;
  while(out.length<max&&(di<d.length||si<s.length||oi<o.length)){
   for(let j=0;j<4&&di<d.length&&out.length<max;j++)out.push(d[di++]);
   if(si<s.length&&out.length<max)out.push(s[si++]);
   if(di>=d.length&&si>=s.length&&oi<o.length&&out.length<max)out.push(o[oi++]);
  }
  const familyKey=c=>norm(c.sirePrep?.fatherId||c.sireId||c.sireName);
  return {candidates:out,stats:{availableDirect:d.length,availableOptionalSires:s.length,
   availableOther:o.length,directShortlist:di,optionalSireShortlist:si,otherShortlist:oi,
   diverseSireFamilies:new Set(out.map(familyKey)).size,
   excludedOverBudget,duplicateRecipes:duplicates,
   maxAdditionalBirths:budget,limitReached:out.length===max&&d.length+s.length+o.length>out.length,
   diversityPolicy:'父馬ごとに比較枠を分散し、8系統事前候補4件につき7系統候補1件を確保（最終31枠で再順位付け）',
   gameVerified:false}};
 }
 function search({ownedSires=[],mares=[],theory,score,excludeNames=[],limit=100,maxPerKey=7,fixedMareLines=null,maxAdditionalBirths=2}={}){
  if(!theory?.canonical||!theory?.lookup)return {candidates:[],stats:{error:'親系統参照が必要'}};
  if(!validFixed(fixedMareLines,theory))return {candidates:[],stats:{error:'中心種牡馬の父・母父の親系統が未確認',fixedMareLines}};
  const fixed=fixedMareLines;
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
  for(const sire of owned){const sig={interesting:INTERESTING.map(p=>v(sire,p)),matching:MATCHING.map(p=>v(sire,p))},verdict=describe(sig,fixed);
   if(verdict.status==='未確認')stats.unknownEight++;
   if(verdict.eligible){stats.ownedEightEligible++;usableSires.push({sireId:sire.id,sireName:sire.id,sig,distinct:verdict.distinct,sireScore:scored.get(sire)});}
  }
  for(const f of owned){for(const m of eligibleMares){stats.precheckedPrepared++;
    const sig={interesting:[v(f,'S'),v(f,'DS'),v(m,'S'),v(m,'DS')],matching:[v(f,'SDS'),v(f,'DDS'),v(m,'SDS'),v(m,'DDS')]},verdict=describe(sig,fixed);
    if(!verdict.eligible)continue;stats.preparedEightEligible++;
    usableSires.push({sirePrep:{fatherId:f.id,motherId:m.id},sireName:f.id+' × '+m.id,sig,distinct:verdict.distinct,sireScore:scored.get(f)+scored.get(m)});
  }}
  const finalists=[];
  for(const entry of usableSires){const keys=matchingBaseKeys(entry.sig.matching,fixed);
    for(const k of keys){const direct=bases.direct.get(k)||[],prep=bases.prepared.get(k)||[];
      for(const b of direct){stats.directBaseMatches++;finalists.push({...entry,baseMareId:b.mareId,baseName:b.name,additionalBirths:entry.sirePrep?1:0,score:entry.sireScore+b.score});}
      // Extra mare preparation is only a fallback per sire configuration;
      // don't spend a birth if a matching public mare is already available.
      if(direct.length===0)for(const b of prep){stats.preparedBaseMatches++;finalists.push({...entry,basePrep:{fatherId:b.fatherId,motherId:b.motherId},baseName:b.name,additionalBirths:(entry.sirePrep?1:0)+1,score:entry.sireScore+b.score});}
    }
  }
  finalists.sort(compare);
  const picked=shortlist(finalists,{limit,maxAdditionalBirths});
  return {candidates:picked.candidates,stats:{...stats,...picked.stats,fixedMareLines:[...fixed],
   ranked:finalists.length,returned:picked.candidates.length}};
 }
 return Object.freeze({FIXED,INTERESTING,MATCHING,diversifyLane,shortlist,shouldInspect89,shouldInspect90,retainStrongest90,retainDiverse105,lineAt,ownLine,fixedFromAnchor,signatures,preparedSignatures,describe,baseKey,preparedBaseKey,matchingBaseKeys,mareMatches,compare,search});
});
