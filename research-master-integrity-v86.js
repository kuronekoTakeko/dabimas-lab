/* v8.6 | Public CSV identity audit, read-only for acquisition and saved plans.
 * Duplicate CSV rows are NOT extra horses. Reconcile same-ID publications
 * without allowing source order to decide a disputed distance/growth/rating.
 * Ambiguous bloodlines are excluded from automated ancestry-based search.
 * The public source does not prove in-game breeding outcomes.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMasterIntegrity86=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const idKey=v=>String(v??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const val=v=>String(v??'').normalize('NFKC').trim();
 const factorKey=v=>(Array.isArray(v)?v:[]).map(val).filter(Boolean).sort().join('|');
 const HARD_FIELDS=['name','variant','lineage','parentSystem'];
 const SOFT_FIELDS=['distance','start','rating','talent'];
 function ancestryKey(row){return (row.ancestry||[]).map(a=>[
  val(a?.path),val(a?.horse||a?.name),factorKey(a?.factors),val(a?.line),val(a?.parentSystem),val(a?.factorVariant)
 ]).sort((a,b)=>a[0].localeCompare(b[0])).map(x=>x.join('~')).join('||');}
 function structuralKey(row){return JSON.stringify([val(row?.sex),factorKey(row?.factors),...HARD_FIELDS.map(f=>val(row?.[f])),ancestryKey(row)]);}
 function reconcile(input=[]){
  const byId=new Map(),order=[],records=[],groups=[],samples=[];let duplicates=0,quarantined=0,uncertain=0;
  for(const entry of input||[]){if(!entry||!val(entry.id))continue;const k=idKey(entry.id);
   if(!byId.has(k)){byId.set(k,[]);order.push(k);}byId.get(k).push(entry);
  }
  for(const k of order){const group=byId.get(k),first=group[0];
   if(group.length===1){records.push(first);continue;}
   duplicates+=group.length-1;groups.push(first.id);
   const sameStructure=group.every(x=>structuralKey(x)===structuralKey(first));
   // Never use an arbitrary row as pedigree evidence when publications disagree
   // on an ancestor, factor, family classification or same-ID sex.
   const merged={...first,ancestry:Array.isArray(first.ancestry)?first.ancestry.map(x=>({...x})):[],
    factors:[...(first.factors||[])],duplicateRows86:group.length};
   if(!sameStructure){
    merged.ancestry=[];merged.factors=[];merged.parentSystem='';merged.lineage='';
    merged.distance='';merged.start='';merged.rating='';merged.talent='';
    merged.duplicateConflict86=true;quarantined++;
   }else{
    const fields=[];
    for(const field of SOFT_FIELDS){const choices=[...new Set(group.map(x=>val(x[field])))];
     if(choices.length>1){merged[field]='';fields.push(field);uncertain++;}
    }
    if(fields.length)merged.duplicateUncertainFields86=fields;
   }
   if(samples.length<8&&(!sameStructure||merged.duplicateUncertainFields86?.length))
    samples.push({id:first.id,kind:sameStructure?'属性不一致':'血統・因子に矛盾',fields:merged.duplicateUncertainFields86||[],rows:group.length});
   records.push(merged);
  }
  return {records,audit:{version:86,sourceRows:(input||[]).length,uniqueIds:records.length,
   duplicateGroups:groups.length,duplicateExtraRows:duplicates,quarantinedIds:quarantined,
   uncertainAttributes:uncertain,examples:samples,gameVerified:false,
   source:'公開CSV登録IDの重複監査。IDが同一でも競走条件等が違えば未確認。'}};
 }
 return Object.freeze({reconcile,idKey,structuralKey});
});
