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
// v103: evidence-only audit of the exact saved export. No ability or game-theory predictions.
function auditEvidence(report){
 const foal=report?.parts?.foal||{}, sire=report?.parts?.sire||{}, mare=report?.parts?.mare||{};
 const foalRows=new Map((foal.ancestors||[]).map(r=>[r.path,r]));
 const anchors=[],issues=[];
 const family=x=>norm(x).replace(/[-－][^-－]+[-－]$/,'').replace(/[-－][^-－]+$/,'');
 for(const [key,expected] of Object.entries(report?.anchorSlots||{})){
  const target=String(key).toLowerCase()==='g3'?'DDS':String(key).toLowerCase()==='g4'?'SSSS':String(key).toLowerCase()==='g5'?'SDSSS':'';
  if(!target)continue;
  const row=foalRows.get(target),expectedName=family(expected),expectedVariant=(String(expected).match(/-([^-]+)-$/)||[])[1]||'';
  const sameName=!!row?.name&&norm(row.name)===expectedName;
  const sameVariant=!!expectedVariant&&norm(row?.variant)===norm(expectedVariant);
  const status=!row?.name?'祖先未収録':!sameName?'馬名不一致':!sameVariant?'異因名不一致・未確認':'登録位置・異因名一致（外部未検証）';
  anchors.push({key,target,expected,rowName:row?.name||'',rowVariant:row?.variant||'',status,positionMatched:sameName&&sameVariant});
  if(!sameName||!sameVariant)issues.push(`${key}（${target}）：${status}`);
 }
 const unknownFactors=(foal.ancestors||[]).filter(r=>r.name&&!r.factors?.length).map(r=>r.path);
 const unknownVariants=(foal.ancestors||[]).filter(r=>r.name&&!r.variant).map(r=>r.path);
 const sNames=new Map(),dNames=new Map();
 for(const [part,store] of [[sire,sNames],[mare,dNames]])for(const r of part.ancestors||[]){
  if(!r.name)continue;const k=norm(r.name);if(!store.has(k))store.set(k,[]);store.get(k).push(r.path);
 }
 const sharedNames=[...sNames.keys()].filter(k=>dNames.has(k)).map(k=>({name:(sire.ancestors||[]).find(r=>norm(r.name)===k)?.name||k,sire:sNames.get(k),mare:dNames.get(k)}));
 if((foal.known||0)<31)issues.push(`最終産駒の祖先未収録：${31-(foal.known||0)}枠`);
 for(const part of [foal,sire,mare])if(part.conflicts?.length)issues.push(`同一位置の馬名衝突：${part.conflicts.join('、')}`);
 return {version:103,anchors,issues,unknownFactors,unknownVariants,sharedNames,
   registeredSlots:foal.known||0,gameVerified:false,independentToolVerified:false,
   caveat:'31/31は馬名の登録数であり、異因名・因子・親子関係や至高成立の検証済み数ではありません。'};
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
 const audit=auditEvidence(report);
 lines.push('【v103｜登録血統の根拠監査（外部・ゲーム内未検証）】',
  `祖先の登録：${audit.registeredSlots}/31枠 ／ 最終産駒・因子未収録 ${audit.unknownFactors.length}枠 ／ 異因名未収録 ${audit.unknownVariants.length}枠`,
  audit.caveat);
 for(const a of audit.anchors)lines.push(`${a.key}=${a.target}：${a.status} ／ 登録 ${a.rowName||'未収録'}-${a.rowVariant||'未確認'} ／ 指定 ${a.expected}`);
 if(audit.issues.length)lines.push('要確認：'+audit.issues.join('／'));
 lines.push('父母双方に登場する同名祖先（有効な独立クロスとは限りません）：'+(audit.sharedNames.map(x=>x.name+`（種 ${x.sire.join('・')} ／ 肌 ${x.mare.join('・')}）`).join('、')||'記録上なし'));
 lines.push('最終産駒・因子未収録位置：'+(audit.unknownFactors.join('、')||'なし'),
  '最終産駒・異因名未収録位置：'+(audit.unknownVariants.join('、')||'なし'),
  'この監査は登録データの比較であり、クロスの効果、配合理論の成立、産駒能力を確定しません。','');
 lines.push('【外部照合チェック】','□ 種・肌の血統が外部ツールの表示と一致する','□ 至高の3×4×5・異因名・因子種類数・阻害条件を確認','□ 未収録枠を確認する（不足があれば成立確定としない）','□ 工程と親子関係を別途確認','この資料はゲーム内成立または産駒能力を保証しません。');
 return lines.join('\n')+'\n';}
return Object.freeze({PATHS,make,format,snap,auditEvidence});
});
