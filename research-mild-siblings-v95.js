/* v95: documented full-sibling collision audit for the 3x4x5 anchor.
 * Scope is intentionally narrow: public 5-generation paternal ancestor slots
 * plus the explicitly documented Orfevre / Dream Journey pair.
 * An absence of a hit does NOT prove there are no full siblings, especially
 * unnamed or invisible dams. Player research, not a game-verified result.
 * Source: https://note.com/huh_ds/n/n0eb8a439d3f3 (2026-11-16 checked)
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildSiblings95=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=v=>String(v??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const documentedPairs=[Object.freeze({a:'オルフェーヴル',b:'ドリームジャーニー',
  source:'https://note.com/huh_ds/n/n0eb8a439d3f3',evidence:'プレイヤー検証',checked:'2026-11-16'})];
 const baseName=value=>{let v=norm(value);if(!v)return '';
  const m=v.match(/^(.*?)-([^-]+)-$/);if(m)v=m[1];
  // Some catalog IDs use a release year instead of a hyphenated variant.
  return v.replace(/(?:19\d{2}|20\d{2})$/,'');
 };
 function inspect({plan,pedigree}={}){
  const members=plan?.source?.members||[];
  const anchorBases=[...new Set(members.map(m=>baseName(m?.name||m?.id)).filter(Boolean))];
  const rows=Array.isArray(pedigree?.rows)?pedigree.rows:[];
  const conflicts=[];
  for(const pair of documentedPairs){
   const a=baseName(pair.a),b=baseName(pair.b);
   if(!anchorBases.includes(a)&&!anchorBases.includes(b))continue;
   for(const row of rows){
    const r=baseName(row?.name||row?.horse||row?.id);
    const sibling=anchorBases.includes(a)?b:a;
    if(r!==sibling)continue;
    conflicts.push({anchor:anchorBases.includes(a)?pair.a:pair.b,sibling:anchorBases.includes(a)?pair.b:pair.a,
     path:String(row?.path||'未収録'),source:pair.source,evidence:pair.evidence});
   }
  }
  return {version:95,blocked:conflicts.length>0,conflicts,anchorBases,observedRows:rows.length,
   checkedKnownPairs:documentedPairs.length,gameVerified:false,exhaustive:false,
   status:conflicts.length?'既知の全兄弟姉妹が最終血統で重複（生産用保存を停止）':'公開5代枠の既知の全兄弟姉妹のみ照合（網羅検査ではない）',
   caveat:'3×4×5の至高成立はゲーム内未確認。母系の隠れた牝馬、未登録の全兄弟姉妹、追加の特殊条件は判定できません。'};
 }
 return Object.freeze({inspect,baseName,documentedPairs});
});
