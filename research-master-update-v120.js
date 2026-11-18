/* v120: public CSV update diff + additive retention. No mutation of personal state.
 * Incoming same-ID data supersedes old published data; IDs missing from a new
 * publication stay available but are marked unconfirmed/retained. Publication
 * is third-party evidence, NOT official game verification.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMasterUpdate120=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const key=s=>String(s??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const strings=a=>Array.isArray(a)?a.map(x=>String(x??'')):[];
 const stableAncestry=x=>strings([]).concat((Array.isArray(x)?x:[]).map(a=>[key(a?.path),key(a?.horse),strings(a?.factors).join(','),key(a?.line),key(a?.parentSystem)].join('|'))).sort().join('||');
 const structural=x=>JSON.stringify([key(x?.sex),key(x?.name),key(x?.variant),key(x?.lineage),key(x?.parentSystem),strings(x?.factors),stableAncestry(x?.ancestry)]);
 const soft=x=>JSON.stringify(['distance','start','rating','talent'].map(k=>String(x?.[k]??'')));
 function compare(existing=[],incoming=[]){
  if(!Array.isArray(existing)||!Array.isArray(incoming))throw Error('マスター形式が不正です');
  const oldMap=new Map(),nextMap=new Map();
  for(const r of existing){if(r&&key(r.id)&&!oldMap.has(key(r.id)))oldMap.set(key(r.id),r);}
  for(const r of incoming){if(r&&key(r.id)&&!nextMap.has(key(r.id)))nextMap.set(key(r.id),r);}
  if(nextMap.size<100)throw Error('更新元の公開マスターが不完全です');
  const merged=[],added=[],changedStructure=[],changedAttributes=[],restored=[],unlisted=[];
  for(const [id,r] of nextMap){
   const before=oldMap.get(id);
   const out={...r};delete out.sourceUnlisted120;
   if(!before)added.push(r.id);
   else if(structural(before)!==structural(r))changedStructure.push(r.id);
   else if(soft(before)!==soft(r))changedAttributes.push(r.id);
   if(before?.sourceUnlisted120)restored.push(r.id);
   merged.push(out);
  }
  for(const [id,r] of oldMap)if(!nextMap.has(id)){
   unlisted.push(r.id);merged.push({...r,sourceUnlisted120:true});
  }
  return {merged,summary:{version:120,oldCount:oldMap.size,publishedCount:nextMap.size,finalCount:merged.length,
   added:added.length,modifiedStructural:changedStructure.length,modifiedAttributes:changedAttributes.length,
   notInLatest:unlisted.length,restored:restored.length,
   samples:{added:added.slice(0,12),modifiedStructural:changedStructure.slice(0,12),
    modifiedAttributes:changedAttributes.slice(0,12),notInLatest:unlisted.slice(0,12),restored:restored.slice(0,12)},
   personalDataChanged:false,gameVerified:false,
   caveat:'公開元の同一IDは今回の内容で更新。最新CSVにない従来IDは削除せず「最新版未掲載」として保留。異因名や年号の違うIDは統合しません。ゲーム内の血統・配合理論の正確性は未確認。'}};
 }
 return Object.freeze({compare,key,structural});
});
