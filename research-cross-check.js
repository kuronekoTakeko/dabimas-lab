/* v3.6: independent cross evidence preflight; no third-party source copied.
 * This is a diagnostic, NOT an authoritative in-game inbreeding determination.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DabimasResearchCrossCheck36=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const norm=v=>String(v==null?'':v).normalize('NFKC').replace(/[\s　]/g,'').toLowerCase();
 const validPath=p=>/^[SD]{0,4}S$/.test(p)&&p.length<=5;
 function inspect(pedigree){
  const raw=Array.isArray(pedigree&&pedigree.rows)?pedigree.rows:[];
  const byPath=new Map(),badPaths=[],duplicates=[];
  for(const r of raw){
   const p=String(r&&r.path||'');
   if(!validPath(p)){badPaths.push(p);continue;}
   if(byPath.has(p)){duplicates.push(p);continue;}
   byPath.set(p,r);
  }
  const groups=new Map();
  for(const [path,r] of byPath){
   const name=String(r.name||'');if(!norm(name))continue;
   const k=norm(name);
   if(!groups.has(k))groups.set(k,{name,paths:[],entries:[]});
   const g=groups.get(k);g.paths.push(path);
   g.entries.push({path,variant:String(r.factorVariant||''),factors:Array.isArray(r.factors)?r.factors.slice():[]});
  }
  const crossSide=[],sameSide=[],unresolved=[];
  for(const g of groups.values()){
   if(g.paths.length<2)continue;
   const sire=g.paths.filter(p=>p[0]==='S'),dam=g.paths.filter(p=>p[0]==='D');
   if(!sire.length||!dam.length){sameSide.push({name:g.name,paths:g.paths});continue;}
   const variants=[...new Set(g.entries.filter(e=>e.variant).map(e=>norm(e.variant)))];
   const withoutVariant=g.entries.filter(e=>!norm(e.variant)).map(e=>e.path);
   const withoutFactors=g.entries.filter(e=>!e.factors.length).map(e=>e.path);
   crossSide.push({name:g.name,sire,dam,paths:g.paths,knownVariants:variants.length,withoutVariant,withoutFactors});
   if(withoutVariant.length||withoutFactors.length)unresolved.push({name:g.name,missingVariant:withoutVariant,missingFactors:withoutFactors});
  }
  // Inherited repeats are not removed here; v3.5 independent-cross module
  // handles a separate heuristic. Avoid double counting this list as effects.
  return {schema:1,status:(badPaths.length||duplicates.length||unresolved.length)?'追加確認あり':'一次照合済み',
   crossSide,sameSide,unresolved,badPaths,duplicates,
   warnings:['父側・母側の同名一致はゲーム内で有効なクロスの保証ではありません',
   '同名馬の異因名、全兄弟姉妹、近い祖先からの派生重複は別途照合が必要です',
   '因子欄が空の場合は「因子なし」と「未収録」を判別できません']};
 }
 return Object.freeze({inspect});
});
