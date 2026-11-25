/* v138: retain only actual independent pairs outside mandatory anchor trees.
 * Research evidence only, never game-verified. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildCrossPairs138=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=x=>String(x??'').normalize('NFKC').replace(/\s/g,'').toLowerCase();
 function restrict({rows=[],anchors=[],candidates=[],aggregate}={}){
  const by=new Map(rows.map(r=>[r.path,r]));
  const valid=rows.length===31&&by.size===31&&rows.every(r=>/^[SD]{0,4}S$/.test(r.path)&&r.name)&&anchors.length===3&&new Set(anchors.map(a=>a.path)).size===3&&anchors.every(a=>a.name&&norm(by.get(a.path)?.name)===norm(a.name)&&a.verified===true);
  if(!valid||typeof aggregate!=='function')return {validRoots:false,filtered:[],gameVerified:false};
  const outside=p=>!anchors.some(a=>p===a.path||p.startsWith(a.path));
  const filtered=[];
  for(const c of candidates){
   if(!c.name||anchors.some(a=>norm(a.name)===norm(c.name))||c.conflicts?.length)continue;
   const pairs=(c.pairs||[]).filter(pair=>Array.isArray(pair)&&pair.length===2&&pair[0]?.startsWith('S')&&pair[1]?.startsWith('D')&&pair.every(p=>outside(p)&&norm(by.get(p)?.name)===norm(c.name)));
   if(!pairs.length)continue;
   const paths=[...new Set(pairs.flat())];
   const entries=paths.map(path=>{const r=by.get(path);return {path,name:r.name,variant:r.factorVariant||r.variant||'',factors:Array.isArray(r.factors)?r.factors:[]};});
   const result=aggregate(entries);
   if(result.conflicts?.length)continue;
   const complete=Array.isArray(result.unresolved)&&result.unresolved.length===0&&Array.isArray(result.counted)&&result.counted.length>0;
   filtered.push({name:c.name,paths,pairs,entries,...result,counts:complete?result.counts:{},counted:complete?result.counted:[],outsidePairEvidenceComplete:complete,gameVerified:false});
  }
  return {validRoots:true,filtered,excludedCount:candidates.length-filtered.length,gameVerified:false};
 }
 return Object.freeze({restrict});
});
