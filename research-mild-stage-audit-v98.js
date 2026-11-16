/* v98: read-only every-mating pedigree drift audit. Research evidence only. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildStageAudit98=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=v=>String(v??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 function hash(value){const s=JSON.stringify(value);let h=2166136261;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),16777619)>>>0;}return s.length+':'+h.toString(16).padStart(8,'0');}
 function signature(p){
  if(p?.known!==31||!Array.isArray(p.rows)||p.rows.length!==31||p.conflicts?.length||p.transmission?.conflicts?.length||p.transmission?.invalid?.length||p.directAncestor?.blocked||p.closeCross65?.blocked)return null;
  const rows=p.rows.map(r=>[norm(r?.path),norm(r?.name||r?.horse),norm(r?.factorVariant),norm(r?.line),norm(r?.parentSystem),Array.isArray(r?.factors)?r.factors.map(norm):[]]).sort((a,b)=>a[0].localeCompare(b[0]));
  if(new Set(rows.map(r=>r[0])).size!==31||rows.some(r=>!r[0]||!r[1]))return null;
  return hash(rows);
 }
 function assess({matings=[],stored=null,requireSaved=false,masterCount=0}={}){
  const errors=[],warnings=[],stages=[],seen=new Set();
  if(!Array.isArray(matings)||matings.filter(m=>m?.kind==='core').length!==9||matings.length<9||matings.length>11)errors.push('基幹9工程＋準備0〜2工程の構成が不正です');
  for(const m of matings){
   const id=String(m?.id||''),label=String(m?.label||id||'工程');
   if(!id||seen.has(id))errors.push(label+'：工程IDが欠落または重複');seen.add(id);
   if(!m?.sireId||!m?.mareId)errors.push(label+'：父母IDが欠落');
   if(m?.sireSex!=='male'||m?.mareSex!=='female')errors.push(label+'：父母の性別が未確認または不一致');
   const sig=signature(m?.pedigree);
   if(!sig)errors.push(label+'：31枠・親子関係・近親チェックを再構成できません');
   stages.push({id,kind:m.kind,number:m.number??null,sire:norm(m.sireId),mare:norm(m.mareId),reused:m.reused===true,pedigree:sig});
  }
  const fingerprint=hash(stages);
  if(requireSaved&&stored?.version!==98)errors.push('v98の全工程保存照合記録がありません（新規設計が必要）');
  if(stored?.version===98&&stored.fingerprint!==fingerprint){
   const old=new Map((stored.stages||[]).map(x=>[x.id,x]));
   for(const s of stages){const p=old.get(s.id);if(!p||hash(p)!==hash(s))errors.push(s.id+'：保存時から父母または途中血統が変更');}
   if(stages.length!==(stored.stages||[]).length)errors.push('保存時から工程数が変更');
   if(errors.length===0)errors.push('保存時の全工程記録と不一致');
  }
  if(!Number.isSafeInteger(masterCount)||masterCount<100)warnings.push('公開CSVの十分な取込件数を確認できません（実データ探索の網羅性は未確認）');
  return {version:98,ok:errors.length===0,errors:[...new Set(errors)],warnings,stages,fingerprint,masterCount,gameVerified:false,completeSearch:false,
   caveat:'全工程の父母・性別・31枠・祖先因子・系統・近親リスクを保存時と照合。公開CSVの品質・網羅探索、実際の配合理論成立、SP/ST、ゲーム内の繁殖牝馬確保は保証しません。'};
 }
 return Object.freeze({signature,assess});
});
