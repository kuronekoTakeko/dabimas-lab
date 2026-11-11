/* v6.7: Deep at DDS (maternal grandmother's sire), 4/5 at paternal SSSS/SDSSS.
 * A known sire X breeds the final mare with a Deep daughter at step 2.
 * Optional X preparation (owned stud x public meihin -> draft MALE) is a
 * separate birth outside nine core steps, never a fictitious ancestry edit.
 * Parent-line evidence is partial: unknown never means non-Ro/Ne.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMaternalDDS67=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const anchorPaths=Object.freeze({g3:'DDS',g4:'SSSS',g5:'SDSSS'});
 const definitions=Object.freeze([
  {n:1,sireSlot:'g3',mareInput:true,sex:'female',output:'ディープ直仔・基礎牝',mareLabel:'P1'},
  {n:2,sireInput:true,mareStep:1,sex:'female',output:'最終繁殖牝馬・締め肌M'},
  {n:3,sireSlot:'g4',mareInput:true,sex:'male',output:'父系起点A1牡',mareLabel:'Q1'},
  {n:4,sireStep:3,mareInput:true,sex:'male',output:'父系中間A2牡',mareLabel:'Q2'},
  {n:5,sireSlot:'g5',mareInput:true,sex:'male',output:'父母系起点C1牡',mareLabel:'R1'},
  {n:6,sireStep:5,mareInput:true,sex:'male',output:'父母系中間C2牡',mareLabel:'R2'},
  {n:7,sireStep:6,mareInput:true,sex:'female',output:'父母系C3牝',mareLabel:'R3'},
  {n:8,sireStep:4,mareStep:7,sex:'male',output:'最終種牡馬A3牡'},
  {n:9,sireStep:8,mareStep:2,sex:'male',output:'最終候補'}
 ].map(d=>Object.freeze(d)));
 const mareSteps=Object.freeze([1,3,4,5,6,7]);
 function validateGraph(defs=definitions){const errors=[],out=new Map();for(const d of defs){
  if(d.n!==out.size+1||out.has(d.n))errors.push('工程順序が不正');
  for(const [key,sex] of [['sireStep','male'],['mareStep','female']])if(d[key]!==undefined&&out.get(d[key])?.sex!==sex)errors.push(`工程${d.n}の親性別・参照が不正`);
  if(!(d.sireSlot||d.sireStep||d.sireInput)||!(d.mareInput||d.mareStep))errors.push(`工程${d.n}の親参照なし`);
  out.set(d.n,d);
 }return {ok:!errors.length,errors};}
 function trace(n,slot,seen=new Set()){const d=definitions.find(x=>x.n===n);if(!d||seen.has(n))return null;
  if(d.sireSlot===slot)return 'S';const next=new Set([...seen,n]);
  return (d.sireStep?(()=>{const v=trace(d.sireStep,slot,next);return v?'S'+v:null;})():null)||
   (d.mareStep?(()=>{const v=trace(d.mareStep,slot,next);return v?'D'+v:null;})():null);
 }
 function derivedPaths(){return Object.fromEntries(['g3','g4','g5'].map(k=>[k,trace(9,k)]));}
 function steps(slots,mares,xName='締め肌の父A（既存種牡馬を優先）'){return definitions.map(d=>({n:d.n,sex:d.sex,cross:`${d.sireSlot?slots?.[d.sireSlot]:d.sireStep?'工程'+d.sireStep+'産駒':xName} × ${d.mareInput?mares?.[d.n]||d.mareLabel+'（未指定）':'工程'+d.mareStep+'産駒'} → ${d.output}`}));}
 const norm=v=>String(v||'').normalize('NFKC').replace(/[\s\u3000]/g,'').toLowerCase();
 function validateFinal(pedigree,slots,members){const at=new Map((pedigree?.rows||[]).map(r=>[r.path,r])),errors=[];
  if(pedigree?.known!==31||at.size!==31||pedigree?.conflicts?.length||pedigree?.transmission?.conflicts?.length)errors.push('31枠の血統不全・衝突');
  for(const [g,path] of Object.entries(anchorPaths)){
   const r=members?.[g],p=at.get(path);if(!r||!p||norm(r.name)!==norm(p.name)||[...(r.factors||[])].sort().join('|')!==[...(p.factors||[])].sort().join('|'))errors.push(`${g}の${path}同名・因子が不一致`);
  }
  const ids=Object.values(slots||{});if(ids.length!==3||new Set(ids.map(norm)).size!==3)errors.push('異因名IDが3つ必要');
  if(new Set(Object.values(members||{}).flatMap(r=>r?.factors||[])).size<6)errors.push('判明因子が6種類未満');
  return {ok:!errors.length,errors,gameVerified:false};
 }
 // Parent-theory matching: inspect the sire's four paternal 4th-gen source
 // positions (these become SSSDS/SSDDS/SDSDS/SDDDS in the final closing foal).
 // For a Deep daughter the mare's two fixed interesting / matching slots
 // are Ro and Ne. The other two can be selected through the base mare.
 // Upper bounds MUST include both parents' interesting slots. If even the
 // best unknown base mare cannot reach 7, never waste time constructing a foal.
 function sirePrecheck(sire,theory,{fixedMare=['Royal Charger','Nearctic']}={}){
  const matching=['SSDS','SDDS','DSDS','DDDS'],interesting=['S','SDS','DS','DDS'];
  const unknown={possible:true,status:'未確認',matchingRoNe:0,interestingRoNe:0,known:0,
   maxInterestingDistinct:8,superPerfectPossible:true,interestingPossible:true,
   reasons:['親系統資料不足']};
  if(!sire?.ancestry?.length||!theory?.lookup)return unknown;
  const by=new Map(sire.ancestry.map(r=>[String(r.path||'').replace(/父/g,'S').replace(/母/g,'D'),r]));
  const at=p=>{let code=p,r=by.get(code);for(let i=0;i<5&&r&&code.length<5&&!theory.lookup(r.horse||r.name)?.parent;i++){
    code+='S';r=by.get(code);
   }return theory.lookup(r?.horse||r?.name)?.parent||null;};
  const match=matching.map(at),interest=interesting.map(at),known=match.filter(Boolean);
  const required=[...new Set(fixedMare.filter(Boolean))],missingMatching=match.length-known.length;
  const needed=required.filter(v=>!known.includes(v)),matchingPossible=missingMatching>=needed.length;
  const fixedKnown=fixedMare.filter(Boolean),interestKnown=interest.filter(Boolean);
  const already=new Set([...interestKnown,...fixedKnown]);
  const unknownInteresting=interest.length-interestKnown.length+fixedMare.length-fixedKnown.length+2;
  const maxInterestingDistinct=Math.min(8,already.size+unknownInteresting);
  const interestingPossible=maxInterestingDistinct>=7;
  const possible=matchingPossible&&interestingPossible;
  const reasons=[];
  if(!matchingPossible)reasons.push('見事系統に必要な固定系統が不足');
  if(!interestingPossible)reasons.push(`面白系統の上限${maxInterestingDistinct}種類（7種類に未達）`);
  return {possible,status:!possible?'不成立':known.length===4&&interestKnown.length===4?'事前条件通過':'未確認',
   matchingRoNe:required.length-needed.length,interestingRoNe:interestKnown.filter(v=>required.includes(v)).length,
   known:known.length,notInteresting:interestKnown.length===4&&interestKnown.every(v=>!required.includes(v)),
   matching:match,interesting:interest,requiredFixed:fixedMare,maxInterestingDistinct,
   superPerfectPossible:maxInterestingDistinct===8,interestingPossible,matchingPossible,reasons};
 }

 // Bounded ranking. Game figures are never predicted from number of factors.
 function routePriority(type){return type==='dds'?3:type==='maternal'?2:type==='paternal'?1:0;}
 function compare(a,b){const theoryRank=v=>v?.superPerfect==='成立'?3:v?.perfect==='成立'?2:
  v?.perfect==='未確認'||v?.superPerfect==='未確認'?1:0;
  const ar=theoryRank(a?.theory),br=theoryRank(b?.theory);
  return br-ar||(b?.evidence||0)-(a?.evidence||0)||(a?.additionalBirths||0)-(b?.additionalBirths||0);
 }
 return Object.freeze({anchorPaths,definitions,mareSteps,validateGraph,derivedPaths,validateFinal,steps,sirePrecheck,compare,routePriority,closingStep:2,finalSireStep:8,finalMareStep:2});
});
