/* v96 | Same-pedigree factor-variant comparison for prepared MILD closing sires.
 * Research-only: preserve the 15 ancestor slots, parent systems, full 31-slot
 * pedigree, closing theory and the Shiko positions. Never predict foal SP/ST.
 * Existing saved plans and ownership are read-only inputs to this module.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildVariants96=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=x=>String(x??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const stem=x=>{let n=norm(x);const m=n.match(/^(.*?)-([^-]+)-$/);if(m)n=m[1];return n.replace(/(?:19\d{2}|20\d{2})$/,'');};
 const factors=x=>Array.isArray(x?.factors)?x.factors.filter(Boolean):[];
 const signature=r=>{
  const a=r?.ancestry;if(!Array.isArray(a)||a.length!==15)return null;
  const paths=new Set(a.map(x=>norm(x?.path)));if(paths.size!==15)return null;
  if(a.some(x=>!x?.horse&&!x?.name))return null;
  return JSON.stringify({lineage:norm(r?.lineage),parentSystem:norm(r?.parentSystem),
   ancestors:a.map(x=>[norm(x.path),norm(x.horse||x.name),norm(x.factorVariant),norm(x.line),norm(x.parentSystem),
    [...(x.factors||[])].map(norm)]).sort((x,y)=>x[0].localeCompare(y[0]))});
 };
 function equivalent(a,b){const s=signature(a),t=signature(b);
  return !!s&&s===t&&stem(a?.name||a?.id)===stem(b?.name||b?.id)&&norm(a?.id)!==norm(b?.id);
 }
 const weights={speed:{'走':6,'速':4,'短':3,'中':2,'長':1,'底':1},stamina:{'長':6,'中':4,'底':3,'走':2,'速':1,'短':1},balance:{'走':4,'速':3,'短':2,'中':4,'長':4,'底':2}};
 const personalWeight=(r,goal)=>factors(r).reduce((v,f)=>v+(weights[goal]?.[f]??weights.balance[f]??0),0);
 function comparison(a,b,goal,metric){
  const ma=metric?.(a.trial,goal)||null,mb=metric?.(b.trial,goal)||null;
  // The documented cross evidence always outranks personal factor counts.
  for(const k of ['independentCrossEvidence','crossFactorEvidence']){
   if(ma&&mb&&Number(ma[k])!==Number(mb[k]))return Number(mb[k])-Number(ma[k]);
  }
  for(const k of ['shortCrossRisk','unresolvedCrosses']){
   if(ma&&mb&&Number(ma[k])!==Number(mb[k]))return Number(ma[k])-Number(mb[k]);
  }
  if(ma&&mb&&Number(ma.score)!==Number(mb.score))return Number(mb.score)-Number(ma.score);
  // Personal factor superiority is explicitly a TIEBREAK hypothesis, never
  // called a confirmed in-game strength/bonus or an SP prediction.
  const af=factors(a.sire).length,bf=factors(b.sire).length;
  if(af!==bf)return bf-af;
  // If no documented difference, fewer rights-shortage warnings help actual
  // production. Rights zero still remains an eligible acquired candidate.
  const ar=Number(a.rights)||0,br=Number(b.rights)||0;
  if((ar>0)!==(br>0))return br>0?1:-1;
  const ap=personalWeight(a.sire,goal),bp=personalWeight(b.sire,goal);
  if(ap!==bp)return bp-ap;
  return norm(a.sire.id).localeCompare(norm(b.sire.id),'ja');
 }
 function optimize({current,originalSire,owned=[],goal='balance',rights=()=>0,evaluate,metric,maxVariants=12}={}){
  if(!current||!originalSire||typeof evaluate!=='function')return {winner:current,audit:null};
  const pool=[originalSire,...owned.filter(r=>equivalent(originalSire,r))]
   .filter((r,i,a)=>a.findIndex(x=>norm(x.id)===norm(r.id))===i)
   .slice(0,Math.max(1,Math.min(20,Number(maxVariants)||12)));
  const considered=[],accepted=[];
  for(const sire of pool){
   let trial=null;try{trial=norm(sire.id)===norm(originalSire.id)?current:evaluate(sire);}catch(e){trial=null;}
   const row={id:sire.id,factors:[...factors(sire)],rights:Number(rights(sire.id))||0,
    checked31:!!trial,closingTheory:trial?.theory66?.superPerfect==='成立'?'超完璧':trial?.theory66?.perfect==='成立'?'完璧':'未確認',
    factorWeight:personalWeight(sire,goal),
    disposition:trial?'31枠・指定祖先・締め肌理論が再照合済み':'親子血統・締め肌理論・指定祖先のいずれかが不一致'};
   considered.push(row);if(trial)accepted.push({sire,trial,rights:row.rights});
  }
  accepted.sort((a,b)=>comparison(a,b,goal,metric));
  const chosen=accepted[0]||{trial:current,sire:originalSire};
  const before=metric?.(current,goal)||null,after=metric?.(chosen.trial,goal)||null;
  return {winner:chosen.trial,audit:{version:96,role:'DDS締め肌父・1代仕込みの父',goal,
   previous:originalSire.id,chosen:chosen.sire.id,changed:norm(chosen.sire.id)!==norm(originalSire.id),
   checked:considered.length,passed:accepted.length,considered,beforeMetric:before,afterMetric:after,
   gameVerified:false,completeSearch:false,
   caveat:'公開登録血統15枠が完全に等しい取得済み異因名のみ比較。31枠・指定3馬・締め肌理論を各案で再計算。クロス証拠が同点なら本人因子数・権利の有無を研究上の優先順位に使用。ゲーム内の因子効果・産駒SP/STや最適解を保証しない。'}};
 }
 return Object.freeze({stem,signature,equivalent,personalWeight,comparison,optimize});
});
