/* v119 — Read-only four-route preliminary scope comparison on imported source.
 * Public-mares ALL vs recorded-name 名牝. An eight-line inverse precheck is
 * NOT a full 31-slot, three-ancestor, closing-mare, cross or game validation.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildBroad119=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const key=x=>String(x??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const base=x=>String(x||'').replace(/-(?:[^-]+)-$/,'').replace(/(?:19|20)\d{2}$/,'');
 const route=c=>c?.sirePrep?(c?.basePrep?'both':'sireOnly'):(c?.basePrep?'mareOnly':'direct');
 const routes=()=>({direct:0,sireOnly:0,mareOnly:0,both:0});
 function inspect({owned={},master=[],anchorId='',mareRank=()=> '未確認',theory=null,inverse=null,goal='speed',limit=160}={}){
  const error=message=>({version:119,ok:false,error:message,gameVerified:false});
  if(typeof inverse?.search!=='function'||typeof inverse?.fixedFromAnchor!=='function'||typeof theory?.canonical!=='function'||typeof theory?.lookup!=='function')return error('親系統・逆算探索モジュールが未読込');
  if(!Array.isArray(master)||!master.length)return error('公開マスター未読込');
  const index=new Map(master.filter(r=>r?.id).map(r=>[key(r.id),r]));
  const anchor=index.get(key(anchorId));
  if(!anchor||anchor.sex!=='male'||!owned[anchor.id]?.owned)return error('起点の取得済み種牡馬の公開血統が未収録');
  if(!Array.isArray(anchor.ancestry)||anchor.ancestry.length!==15||anchor.duplicateConflict86)return error('起点の祖先15枠が不完全');
  const fixed=inverse.fixedFromAnchor(anchor,theory);
  if(!fixed.ready)return error('中心3代目の父・母父の親系統が未確認（推測補完しない）');
  const exclude=new Set([key(base(anchor.id))]);
  const candidates=master.filter(r=>r?.sex==='male'&&r.ancestry?.length===15&&r.duplicateConflict86!==true&&r.sourceUnlisted120!==true&&owned[r.id]?.owned===true&&!exclude.has(key(base(r.id))));
  const mares=master.filter(r=>r?.sex==='female'&&r.ancestry?.length===15&&r.duplicateConflict86!==true&&r.sourceUnlisted120!==true);
  const registered=mares.filter(r=>mareRank(r)==='名牝');
  if(!candidates.length||!mares.length)return error('所持種牡馬または公開繁殖牝馬の実血統が不足');
  const wanted=goal==='speed'?['短','速','走']:goal==='stamina'?['長','中','底']:['短','速','走','長','中','底'];
  const score=r=>(r?.ancestry||[]).flatMap(a=>a.factors||[]).reduce((s,f)=>s+(wanted.includes(f)?2:0.4),0);
  const params={ownedSires:candidates,theory,score,excludeNames:[base(anchor.id)],fixedMareLines:fixed.values,limit:Math.min(320,Math.max(1,Math.trunc(Number(limit)||160))),maxAdditionalBirths:2};
  const pass=(items)=>{
   const raw=inverse.search({...params,mares:items});
   if(raw?.stats?.error)return {error:raw.stats.error,stats:{},routeCounts:routes(),examples:[]};
   const counts=routes();
   for(const c of raw.candidates||[])counts[route(c)]++;
   const examples=(raw.candidates||[]).slice(0,8).map(c=>({route:route(c),additionalBirths:c.additionalBirths,distinct:c.distinct,
    fatherId:c.sirePrep?.fatherId||c.sireId||'',preparedSireMare:c.sirePrep?.motherId||null,
    baseMareId:c.baseMareId||null,preparedBaseFather:c.basePrep?.fatherId||null,preparedBaseMare:c.basePrep?.motherId||null,
    // The cross plan may use mares not in the historic name list.
    unrankedMares:[c.sirePrep?.motherId,c.basePrep?.motherId,c.baseMareId].filter(Boolean).filter(id=>mareRank({id,name:id})!=='名牝')
   }));
   return {stats:raw.stats,routeCounts:counts,examples};
  };
  const designated=pass(registered),expanded=pass(mares);
  const sourceSummary={ownedRegistered:Object.keys(owned).filter(id=>owned[id]?.owned===true).length,ownedWithPedigree:candidates.length,
   publicMares:mares.length,registeredMeihin:registered.length,unconfirmedMares:mares.length-registered.length,
   excludedSameBase:base(anchor.id),centerAnchor:anchor.id,fixedParentSystems:fixed.values};
  return {version:119,ok:!designated.error&&!expanded.error,gameVerified:false,sourceSummary,
   designated,expanded,rankMethod:'公開血統の因子から作る事前探索順。実際のSP/ST・配合理論の強さではない。',
   boundaries:{full31Checked:false,anchor345Checked:false,closingTheoryChecked:false,availableMaresChecked:false,inventoryRightsChecked:false,maxPerLineageKey:7,
    preliminaryOnly:true,exhaustive:false,allPrecheckGroups:expanded.stats?.ranked||0,shortlistLimit:params.limit},
   caveat:'最新の所持登録と公開マスターによる4ルートの「親系統8枠」一次探索のみ。全500頭のうち名牝ランク未確認馬は実生産候補に昇格させません。親系統組ごとに候補を最大7件まで保持する限定探索です。31枠、至高3×4×5、締め肌の理論、クロス、子系統、必要権利、実SP/STを満たすとは限らず、生産許可・至高成立確定ではありません。'};
 }
 return Object.freeze({inspect,route});
});
