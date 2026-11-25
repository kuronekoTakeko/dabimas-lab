/* v137: hypothetical target allocation; never modifies pedigree or ranks horses by hypothetical factors. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildFactorTarget137=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const K=['短','速','長'];
 const validFactors=new Set(['短','速','底','長','走','中','強','雷','堅','難','適','丈','早','晩']);
 const paths={S:8,SS:4,SSS:3,SDS:6,SDSS:5,DS:'prep'};
 const norm=x=>String(x??'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
 const validPaths=new Set();for(let d=1;d<=5;d++)for(let i=0;i<2**(d-1);i++)validPaths.add((d===1?'':i.toString(2).padStart(d-1,'0').replace(/0/g,'S').replace(/1/g,'D'))+'S');
 const options=[[],['短'],['速'],['長'],['短','速'],['短','長'],['速','長']];
 function inspect(plan,ped,homebreds,nitro){
  const fail=reason=>({available:false,reason,gameVerified:false});
  if(plan?.routeDraft?.layout!=='maternal-dds-g3'||!nitro?.thresholds||!nitro?.weights)return fail('DDS・研究条件不足');
  if(ped?.known!==31||ped?.rows?.length!==31||ped.conflicts?.length||ped.transmission?.conflicts?.length||ped.transmission?.invalid?.length)return fail('最終31枠の照合不足');
  const seen=new Set(),byId=new Map((homebreds||[]).map(h=>[norm(h.id),h])),targets=[],unknown=[],recorded=[],counts=Object.fromEntries(K.map(k=>[k,0]));
  for(const r of ped.rows){
   if(!validPaths.has(r.path)||seen.has(r.path)||!r.name||!Array.isArray(r.factors)||r.factors.some(f=>!validFactors.has(f)))return fail('最終祖先の位置・因子形式不正');seen.add(r.path);
   const step=paths[r.path],id=step==='prep'?plan.mild67?.prep?.foalId:plan.chain09?.outputs?.[step];
   if(typeof step==='number'&&!id)return fail('基幹牡の工程ID不足：'+r.path);
   const h=id&&byId.get(norm(id));
   if(id&&(!h||h.sex!=='male'||norm(h.name)!==norm(r.name)))return fail('工程と最終血統の照合不足：'+r.path);
   const actual=h?.mode==='real'&&h.factorsVerified===true&&Array.isArray(h.factors)&&h.factors.length<=3&&h.factors.every(f=>validFactors.has(f));
   if(h&&actual&&JSON.stringify([...h.factors].sort())!==JSON.stringify([...r.factors].sort()))return fail('実測因子の不一致：'+r.path);
   if(h&&!actual){if(r.factors.length)return fail('未測定自家製馬に因子が記録されています：'+r.path);if(h.mode!=='real')targets.push({path:r.path,step,id,name:r.name});else unknown.push({path:r.path,name:r.name,kind:'実馬・因子未確認'});continue;}
   if(r.factors.length||actual||String(r.factorVariant||'').startsWith('実測ID:')){recorded.push(r.path);for(const f of r.factors)if(K.includes(f))counts[f]++;}
   else unknown.push({path:r.path,name:r.name,kind:'既存祖先・未収録'});
  }
  if(new Set(targets.map(t=>norm(t.id))).size!==targets.length)return fail('同一自家製牡の複数位置使用は個別逆算対象外');
  targets.sort((a,b)=>(a.step==='prep'?0:a.step)-(b.step==='prep'?0:b.step));
  const weights=nitro.weights[plan.goal]||nitro.weights.balance;
  const stages=c=>Object.fromEntries(K.map(k=>[k,nitro.thresholds[k].filter(t=>c[k]>=t).length]));
  const score=c=>K.reduce((s,k)=>s+stages(c)[k]*weights[k],0);
  // DP over attainable-by-construction count vectors, not attainable in-game factors.
  let states=new Map([['0,0,0',{delta:[0,0,0],choices:[],used:0}]]);
  for(const target of targets){const next=new Map();for(const s of states.values())for(const opt of options){const delta=s.delta.map((v,i)=>v+Number(opt.includes(K[i]))),key=delta.join(','),used=s.used+Number(opt.length>0);const old=next.get(key);if(!old||used<old.used)next.set(key,{delta,choices:[...s.choices,opt],used});}states=next;}
  const total=s=>Object.fromEntries(K.map((k,i)=>[k,counts[k]+s.delta[i]]));
  const sorted=[...states.values()].sort((a,b)=>score(total(b))-score(total(a))||a.delta.reduce((x,y)=>x+y,0)-b.delta.reduce((x,y)=>x+y,0)||a.used-b.used);
  const best=sorted[0], projected=total(best);
  return {version:137,available:true,goal:plan.goal||'balance',recordedSlots:recorded.length,unknown,targets:targets.map((t,i)=>({...t,wanted:best.choices[i]})),counts,stages:stages(counts),scenarioCounts:projected,scenarioStages:stages(projected),scenarioOnly:true,gameVerified:false,productionApproved:false};
 }
 return Object.freeze({inspect});
});
