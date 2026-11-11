/* v6.5 conservative 2x2 / 2x3 / 3x2 common-ancestor production guard */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasCloseCross65=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
function base(v){let s=String(v??'').normalize('NFKC').trim();s=s.replace(/-([^-]+)-$/,'');s=s.replace(/(?:19\d{2}|20\d{2})$/,'');return s.replace(/[\s　]/g,'').toLowerCase();}
function inspect(sire,mare){
 const s=(sire?.ancestry||[]).filter(a=>a?.horse||a?.name).map(a=>({name:base(a.horse||a.name),path:'S'+String(a.path||'')}));
 const m=(mare?.ancestry||[]).filter(a=>a?.horse||a?.name).map(a=>({name:base(a.horse||a.name),path:'D'+String(a.path||'')}));
 const hits=[];const seen=new Set();
 for(const a of s)for(const b of m){if(!a.name||a.name!==b.name)continue;
 if(!((a.path.length===2&&b.path.length>=2&&b.path.length<=3)||(b.path.length===2&&a.path.length>=2&&a.path.length<=3)))continue;
 const id=a.name+'|'+a.path+'|'+b.path;if(seen.has(id))continue;seen.add(id);
 hits.push({name:a.name,sirePath:a.path,marePath:b.path,degree:a.path.length+'×'+b.path.length});}
 return {blocked:hits.length>0,hits,unknown:!(sire?.ancestry?.length&&mare?.ancestry?.length)};
}
return Object.freeze({base,inspect});
});
