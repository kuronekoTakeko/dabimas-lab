/* v5.0: Exact real-horse reuse for the 9-slot mild pedigree DAG.
 * This is a conservative pedigree-equivalence test, not a game ability claim.
 * Never changes a saved real-horse record; never guesses a personal sire factor.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasReuse50=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=v=>String(v??'').normalize('NFKC').trim();
const valid=p=>/^[SD]{0,4}S$/.test(p);
const expected=(()=>{const out=[];for(let level=1;level<=5;level++)for(let n=0;n<2**(level-1);n++){
 let p='';for(let j=level-2;j>=0;j--)p+=n&(1<<j)?'D':'S';out.push(p+'S');}return new Set(out);})();
function signature(rows){
 if(!Array.isArray(rows)||rows.length!==31)return null;
 const slots=new Map();
 for(const r of rows){const p=norm(r?.path),horse=norm(r?.horse||r?.name);
  if(!valid(p)||!expected.has(p)||!horse||slots.has(p)||!Array.isArray(r?.factors))return null;
  const factors=r.factors.map(norm);
  if(factors.some(f=>!f))return null;
  slots.set(p,[horse,norm(r.factorVariant||r.variant||''),norm(r.line||''),factors.sort().join(',')].join('\u001f'));
 }
 if(slots.size!==31)return null;
 return [...expected].sort().map(p=>p+':'+slots.get(p)).join('\u001e');
}
function safeFactor(h,step){
 if(step===9||h.sex!=='male')return true;
 // Male homebred has its OWN game-assigned factors, independent of pedigree.
 // An unobserved [] is NOT proof of zero factors. Never transplant it.
 return h.factorsVerified===true&&Array.isArray(h.factors)&&h.factors.length===0;
}
function canReuse(h,r){
 if(!h||!r||h.mode!=='real'||!Number.isInteger(r.step)||r.step<1||r.step>9)return false;
 if(h.sex!==r.sex||norm(h.fatherId)!==norm(r.sireId)||norm(h.motherId)!==norm(r.mareId))return false;
 if(norm(h.lineage)!==norm(r.lineage))return false;
 if(!safeFactor(h,r.step))return false;
 const base=signature(r.rows);return !!base&&signature(h.ancestry)===base;
}
function pick(records,request,excludedIds=[]){
 const excluded=new Set(excludedIds.map(norm));
 for(const h of records||[]){if(!excluded.has(norm(h.id))&&canReuse(h,request))return {id:h.id,signature:signature(h.ancestry),lineage:norm(h.lineage),step:request.step};}
 return null;
}
function verifyLink(h,mark,request){
 if(!mark||!h||!mark.signature||norm(mark.id)!==norm(h.id)||Number(mark.step)!==Number(request?.step))return false;
 if(signature(h.ancestry)!==mark.signature||norm(h.lineage)!==norm(mark.lineage))return false;
 return canReuse(h,{...request,rows:request?.rows||h.ancestry});
}
return Object.freeze({signature,canReuse,pick,verifyLink});
});
