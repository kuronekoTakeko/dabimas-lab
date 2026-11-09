/* v4.8: Read-only ancestry export for independent cross-checking.
   This is NOT a game-theory verifier. Unknown ancestors remain unknown. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasExternalReview48=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const norm=x=>String(x??'').normalize('NFKC').trim();
function paths(){const res=[];for(let depth=1;depth<=5;depth++){let cur=[''];for(let i=0;i<depth-1;i++)cur=cur.flatMap(p=>[p+'S',p+'D']);for(const p of cur)res.push(p+'S');}return res;}
const PATHS=Object.freeze(paths());
function snap(horse,rows){const seen=new Map(),conflicts=[];for(const r of rows||[]){const p=norm(r?.path).toUpperCase(),name=norm(r?.name||r?.horse);if(!PATHS.includes(p))continue;const found=seen.get(p);if(found){if(name&&found.name&&found.name!==name)conflicts.push(p);continue;}seen.set(p,{path:p,name,factors:Array.isArray(r.factors)?r.factors.map(norm):[],line:norm(r.line),variant:norm(r.factorVariant||r.variant),source:norm(r.source)});}
 const ancestors=PATHS.map(p=>seen.get(p)||{path:p,name:'',factors:[],line:'',variant:'',source:'未収録'});
 return {name:norm(horse?.id||horse?.name),ancestors,known:ancestors.filter(r=>r.name).length,conflicts};}
function make({sire,mare,foalRows,sireRows,mareRows,planTitle,anchorSlots}={}){
 const parts={foal:snap({name:'最終産駒'},foalRows),sire:snap(sire,sireRows),mare:snap(mare,mareRows)};
 return {schema:'dabimas-crosscheck-v1',planTitle:norm(planTitle),parts,anchorSlots:anchorSlots||{},gameVerified:false,independentToolVerified:false};
}
function format(report){if(report?.schema!=='dabimas-crosscheck-v1')throw Error('未対応の血統照合形式');
 const lines=['ダビマス配合研究所｜外部照合用5代血統表','計画：'+report.planTitle,'判定：未確認（ダビふぁく等で別途照合）','注意：登録祖先31枠は父系種牡馬祖先の表示。空白は未収録であり血統なしを意味しません。','至高指定：'+Object.entries(report.anchorSlots||{}).map(([k,v])=>`${k}=${v}`).join(' / '),''];
 for(const [key,title] of [['sire','種（最終種牡馬）'],['mare','肌（最終繁殖牝馬）'],['foal','最終産駒']]){
  const part=report.parts?.[key];if(!part)continue;
  lines.push(`【${title}：${part.name}】 ${part.known}/31枠`,'位置\t馬名\t異因名\t因子\t子系統\t出典');
  for(const a of part.ancestors||[]){const path=norm(a.path);if(!PATHS.includes(path))continue;lines.push([path,a.name||'未収録',a.variant||'未確認',(a.factors||[]).join('・')||'未確認',a.line||'未確認',a.source||'未確認'].map(v=>String(v).replace(/[\t\r\n]/g,' ')).join('\t'));}
  if(part.conflicts?.length)lines.push('注意：祖先位置にデータ衝突 '+part.conflicts.join('、'));
  lines.push('');
 }
 lines.push('【外部照合チェック】','□ 種・肌の血統が外部ツールの表示と一致する','□ 至高の3×4×5・異因名・因子種類数・阻害条件を確認','□ 未収録枠を確認する（不足があれば成立確定としない）','□ 工程と親子関係を別途確認','この資料はゲーム内成立または産駒能力を保証しません。');
 return lines.join('\n')+'\n';}
return Object.freeze({PATHS,make,format,snap});
});
