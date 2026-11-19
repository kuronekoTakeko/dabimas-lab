/* v129 | Read-only simulated acquisition experiment.
 * NEVER merges hypothetical stallions into owned, localStorage or portable JSON.
 * This is an eight-parent-system precheck, not a full 31-slot production plan.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasVirtualOwnership129=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const normalize=x=>String(x??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const base=x=>String(x??'').replace(/-(?:[^-]+)-$/,'').replace(/(?:19|20)\d{2}$/,'');
 const hasPed=r=>!!r?.id&&r.sex==='male'&&Array.isArray(r.ancestry)&&r.ancestry.length===15&&!r.duplicateConflict86&&!r.sourceUnlisted120;
 const ownedFlag=(owned,id)=>!!(owned?.[id]?.owned||owned?.[normalize(id)]?.owned);
 const goals=Object.freeze(['speed','balance','stamina']);
 const goalNames=Object.freeze({speed:'SP重視',balance:'バランス',stamina:'ST重視'});
 function choose({master=[],owned={},anchorId='',race='芝2200m',limit=100,distance=null}={}){
  const anchorBase=normalize(base(anchorId));
  const valid=(master||[]).filter(r=>hasPed(r)&&normalize(base(r.id))!==anchorBase);
  const actual=valid.filter(r=>ownedFlag(owned,r.id));
  const absent=valid.filter(r=>!ownedFlag(owned,r.id));
  const status=r=>distance?.assess?.(race,r)?.status||'unknown';
  // Keep the same deterministic simulated pool for all three SP/ST goals.
  // Prefer documented distance coverage; diversify by recorded child lineage.
  const tiers=['covered','unknown','outside'];
  const ordered=[];
  for(const tier of tiers){
   const groups=new Map();
   for(const r of absent.filter(r=>status(r)===tier).sort((a,b)=>a.id.localeCompare(b.id,'ja'))){
    const k=normalize(r.lineage||'未確認');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);
   }
   while([...groups.values()].some(g=>g.length)){
    for(const g of groups.values())if(g.length)ordered.push(g.shift());
   }
  }
  const max=Math.min(300,Math.max(0,Math.trunc(Number(limit)||0)));
  const added=ordered.slice(0,max);
  const counts=a=>a.reduce((d,r)=>{d[status(r)]++;return d;},{covered:0,unknown:0,outside:0});
  return {actual,expanded:[...actual,...added],added,possible:ordered.length,actualDistance:counts(actual),addedDistance:counts(added),
   scope:{race,requested:max,added:added.length,anchorId,gameVerified:false,source:'公開種牡馬・取得済み区分（読み取り専用）'}};
 }
 const route=c=>c?.sirePrep?(c?.basePrep?'both':'sireOnly'):(c?.basePrep?'mareOnly':'direct');
 function compare({master=[],owned={},anchorId='',race='芝2200m',limit=100,mares=[],theory,inverse,distance,factorProfiles=null}={}){
  if(!inverse?.search||!inverse?.fixedFromAnchor||!theory?.lookup)return {ok:false,error:'親系統と逆算探索モジュールがありません'};
  const anchor=(master||[]).find(r=>normalize(r.id)===normalize(anchorId));
  if(!anchor||!ownedFlag(owned,anchorId)||!hasPed(anchor))return {ok:false,error:'中心種牡馬は、実際に取得済みで15祖先枠が収録された馬を指定してください'};
  const fixed=inverse.fixedFromAnchor(anchor,theory);
  if(!fixed.ready)return {ok:false,error:'中心種牡馬の父・母父の親系統が未収録です'};
  const qualifiedMares=mares.filter(r=>r?.sex==='female'&&r?.ancestry?.length===15&&!r.duplicateConflict86&&!r.sourceUnlisted120);
  if(!qualifiedMares.length)return {ok:false,error:'名牝の登録血統がありません'};
  const pool=choose({master,owned,anchorId,race,limit,distance});
  if(!pool.actual.length)return {ok:false,error:'取得済みで血統が揃う補助種牡馬がありません'};
  const rows=[];
  const candidateSets={actual:{},virtual:{}};
  for(const goal of goals){
   const wanted=goal==='speed'?['短','速','走']:goal==='stamina'?['長','中','底']:['短','速','走','長','中','底'];
   const score=r=>(r?.ancestry||[]).flatMap(a=>a.factors||[]).reduce((s,f)=>s+(wanted.includes(f)?2:0.4),0);
   for(const [scope,sires] of [['actual',pool.actual],['virtual',pool.expanded]]){
    const result=inverse.search({ownedSires:sires,mares:qualifiedMares,theory,score,excludeNames:[base(anchorId)],fixedMareLines:fixed.values,limit:100,maxAdditionalBirths:2});
    if(result?.stats?.error)return {ok:false,error:result.stats.error};
    const candidates=result.candidates||[];
    candidateSets[scope][goal]=candidates;
    const routes={direct:0,sireOnly:0,mareOnly:0,both:0};
    for(const c of candidates)routes[route(c)]++;
    const top=candidates[0]||null;
    const used=top?(top.sirePrep?.fatherId||top.sireId||''):'';
    rows.push({goal,goalName:goalNames[goal],scope,sires:sires.length,prechecked:result.stats?.precheckedPrepared||0,
     ranked:result.stats?.ranked||0,examined:candidates.length,routes,
     top:top?{sireId:used,route:route(top),additionalBirths:top.additionalBirths,baseMareId:top.baseMareId||'',
      usesVirtual:!!used&&!ownedFlag(owned,used)}:null});
   }
  }
  const study=factorProfiles?.study?factorProfiles.study({candidateSets,master,owned}):null;
  return {ok:true,version:130,study,anchorId,race,goals:[...goals],pool:{...pool,actual:pool.actual.length,expanded:pool.expanded.length,
    addedIds:pool.added.map(r=>r.id),added:pool.added.length,possible:pool.possible},mares:qualifiedMares.length,rows,
   limitations:'見事4＋面白8枠の限定一次比較のみ。最終31枠、締め肌理論、至高、クロス、種牡馬距離の産駒継承、SP/ST、実生産能力は未検証。仮想馬は所持・保存プランに登録しない。',gameVerified:false};
 }
 return Object.freeze({choose,compare,route,goals,goalNames});
});
