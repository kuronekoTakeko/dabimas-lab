/* v6.4: Avoid mating a sire directly to a mare who already carries that
 * sire as a recorded ancestor. Conservative USER production rule, not an
 * exhaustive reproduction of the game's dangerous-mating definition.
 * This check is variant-insensitive (異因名) and does not forbid distant
 * shared ancestors unrelated to the sire himself. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasDirectAncestor64=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
function norm(v){return String(v??'').normalize('NFKC').replace(/[\s　]/g,'').toLowerCase();}
function base(raw){let s=String(raw??'').normalize('NFKC').trim();
 const marker=s.match(/^(.*?)-([^-]+)-$/);if(marker)s=marker[1];
 else if(/^(.*?)-(?:神速|覇煌|央獅|煌魂|翔燕|闘覇|瞬走|極走)-$/.test(s))s=s.replace(/-([^-]+)-$/,'');
 const year=s.match(/^(.+?)(?:19\d{2}|20\d{2})$/);if(year)s=year[1];
 return norm(s);
}
function inspect(sire,mare){
 const sireName=base(sire?.name||sire?.id||'');
 const entries=Array.isArray(mare?.ancestry)?mare.ancestry:[];
 if(!sireName||!entries.length)return {blocked:false,unknown:true,horse:sire?.name||sire?.id||'',paths:[],reason:'祖先情報が不足'};
 const paths=entries.filter(a=>a&&base(a.horse||a.name)===sireName).map(a=>String(a.path||'?'));
 return {blocked:paths.length>0,unknown:false,horse:sire?.name||sire?.id||'',paths,reason:paths.length?'母馬の登録済み祖先に父として使う種牡馬自身が存在':'直接祖先一致なし'};
}
return Object.freeze({inspect,base});
});
