/* v5.2: Read-only nine-stage parent->offspring pedigree consistency check.
 * Structural data validation only: unknown factors never imply zero,
 * and no game theory, ability or Shiko verification is claimed.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildLineage52=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=v=>String(v??'').normalize('NFKC').replace(/[\s　]/g,'').toLowerCase();
const PATHS=(()=>{const a=[];for(let d=1;d<=5;d++)for(let i=0;i<2**(d-1);i++){
 let s='';for(let b=d-2;b>=0;b--)s+=i&(1<<b)?'D':'S';a.push(s+'S');
}return Object.freeze(a);})();
const PATH_SET=new Set(PATHS);
const horseName=r=>norm(r?.horse||r?.name);
const factorSig=a=>Array.isArray(a)&&a.length?a.map(norm).sort().join('|'):null;
function mapRows(rows){
 if(!Array.isArray(rows)||rows.length!==31)return null;
 const out=new Map();for(const row of rows){const path=String(row?.path||'');
  if(!PATH_SET.has(path)||out.has(path)||!horseName(row))return null;
  out.set(path,row);
 }return out.size===31?out:null;
}
function compare(actual,expected){
 const a=mapRows(actual),e=mapRows(expected),issues=[];
 if(!a||!e)return {ok:false,issues:['血統31枠の欠落・重複・不正な位置'],checked:0};
 for(const path of PATHS){const want=e.get(path),got=a.get(path);
  if(horseName(want)!==horseName(got)){issues.push(`${path}：祖先馬名が父母の記録と異なる`);continue;}
  const wf=factorSig(want.factors),gf=factorSig(got.factors);
  // Factors in a public or verified parent record must survive unchanged;
  // a blank source factor is missing evidence, not a claim of zero.
  if(wf&&wf!==gf)issues.push(`${path}：記録済み祖先因子が変化`);
  const wv=norm(want.factorVariant||want.variant),gv=norm(got.factorVariant||got.variant);
  if(wv&&wv!==gv)issues.push(`${path}：登録異因名が変化`);
  const wl=norm(want.line||want.lineage),gl=norm(got.line||got.lineage);
  if(wl&&wl!==gl)issues.push(`${path}：子系統が変化`);
 }
 return {ok:issues.length===0,issues,checked:PATHS.length};
}
function inspect(plan,records,stageResolver){
 const errors=[];let checked=0;
 if(typeof stageResolver!=='function')return {ok:false,errors:['各工程の父母血統照合を実行できません'],checked:0};
 const byId=new Map((records||[]).map(h=>[norm(h?.id),h]));
 for(let n=1;n<=9;n++){
  const id=plan?.chain09?.outputs?.[n],h=byId.get(norm(id));
  if(!h){errors.push(`工程${n}：産駒の記録がありません`);continue;}
  let pair;try{pair=stageResolver(n);}catch(e){errors.push(`工程${n}：親馬血統の読込失敗`);continue;}
  if(!pair?.ready||!pair?.ped){errors.push(`工程${n}：父母または配合血統が未確定`);continue;}
  if(pair.ped.conflicts?.length||pair.ped.transmission?.conflicts?.length||pair.ped.transmission?.invalid?.length||pair.ped.transmission?.duplicates?.length||pair.ped.transmission?.unresolved?.length){
   errors.push(`工程${n}：父母血統の継承矛盾または未確認`);continue;
  }
  const cmp=compare(h.ancestry,pair.ped.rows);
  if(!cmp.ok)errors.push(...cmp.issues.slice(0,3).map(issue=>`工程${n}：${issue}`));
  if(cmp.ok)checked++;
 }
 return {ok:errors.length===0&&checked===9,errors,checked,gameVerified:false};
}
return Object.freeze({PATHS,mapRows,compare,inspect});
});
