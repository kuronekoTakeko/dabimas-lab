/* v4.6: family-level center-horse selection. Independent, original research code.
 * This only organizes owned, evidence-bearing candidates; it never certifies Shiko.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasFamilySearch46=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=s=>String(s??'').normalize('NFKC').trim().toLowerCase();
function families(candidates){
 const grouped=new Map();
 for(const c of candidates||[]){
  const k=norm(c?.base);if(!k||!Array.isArray(c?.set)||c.set.length!==3)continue;
  if(!grouped.has(k))grouped.set(k,{key:k,name:c.base,count:0});
  grouped.get(k).count++;
 }
 return [...grouped.values()].sort((a,b)=>a.name.localeCompare(b.name,'ja'));
}
function resolve(candidates,selection,maxFamily=24,maxAuto=6){
 const entries=Array.isArray(candidates)?candidates:[];
 if(selection==='auto')return {mode:'auto',family:null,pool:entries.slice(0,maxAuto),available:entries.length,limit:maxAuto};
 if(String(selection).startsWith('family:')){
  let family='';try{family=decodeURIComponent(String(selection).slice(7));}catch(_){return {mode:'invalid',pool:[],available:0,limit:0};}
  const matches=entries.filter(c=>norm(c?.base)===norm(family));
  return {mode:'family',family,available:matches.length,pool:matches.slice(0,maxFamily),limit:maxFamily};
 }
 if(/^\d+$/.test(String(selection))){
  const candidate=entries[Number(selection)];
  return candidate?{mode:'exact',family:candidate.base,pool:[candidate],available:1,limit:1}:{mode:'invalid',pool:[],available:0,limit:0};
 }
 return {mode:'invalid',pool:[],available:0,limit:0};
}
return Object.freeze({families,resolve});
});
