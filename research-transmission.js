/* v3.9 pedigree transmission audit. Original implementation; no external data.
   Row paths use the project's 31 male-ancestor positions (S, SS, DS, ...).
   Unobserved ancestors or factor arrays are UNKNOWN, never invented. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DabimasResearchTransmission39=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const norm=x=>String(x==null?'':x).normalize('NFKC').replace(/[\s　]/g,'').toLowerCase();
 const path=x=>String(x||'').replace(/父/g,'S').replace(/母/g,'D');
 const valid=p=>/^[SD]{0,4}S$/.test(p)&&p.length<=5;
 const signature=f=>Array.isArray(f)&&f.length?f.map(norm).sort().join('|'):null;
 function verify(foal,sire,mare){
  const dest=new Map(),invalid=[],duplicates=[],conflicts=[],unresolved=[];
  for(const r of Array.isArray(foal&&foal.rows)?foal.rows:[]){
   const p=path(r&&r.path);
   if(!valid(p)){invalid.push(p);continue;}
   if(dest.has(p)){duplicates.push(p);continue;}
   dest.set(p,r);
  }
  let compared=0;
  function check(p,source){
   const target=dest.get(p);
   if(!source||!norm(source.name||source.horse))return;
   if(!target||!norm(target.name||target.horse)){unresolved.push({path:p,reason:'産駒側が未収録'});return;}
   compared++;
   if(norm(target.name||target.horse)!==norm(source.name||source.horse)){
    conflicts.push({path:p,field:'name',parent:source.name||source.horse,foal:target.name||target.horse});return;
   }
   const f1=signature(source.factors),f2=signature(target.factors);
   if(f1&&f2&&f1!==f2)conflicts.push({path:p,field:'factors',parent:f1,foal:f2});
   const v1=norm(source.factorVariant||source.variant),v2=norm(target.factorVariant||target.variant);
   if(v1&&v2&&v1!==v2)conflicts.push({path:p,field:'factorVariant',parent:v1,foal:v2});
  }
  if(sire)check('S',{name:sire.name||sire.id,factors:sire.factors,factorVariant:sire.variant});
  for(const [prefix,parent] of [['S',sire],['D',mare]]){
   for(const r of Array.isArray(parent&&parent.ancestry)?parent.ancestry:[]){
    const p=path(r&&r.path);
    if(!valid(p)||p.length>4)continue; // 5th-gen parents are outside foal's 5-gen window
    check(prefix+p,r);
   }
  }
  return {schema:1,compared,conflicts,unresolved,invalid,duplicates,
   status:conflicts.length||invalid.length||duplicates.length?'継承データ矛盾':unresolved.length?'継承一部未確認':'判明範囲の継承一致',
   gameVerified:false};
 }
 return Object.freeze({verify});
});
