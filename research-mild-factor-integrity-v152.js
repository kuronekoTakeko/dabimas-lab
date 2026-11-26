/* v152 | One conservative factor-annotation contract for DDS research.
 * Source records must never be silently amended. An empty factor array is
 * known ZERO only with an explicitly verified homebred ID; otherwise UNKNOWN.
 * A malformed array is UNKNOWN as a whole (no partial factor credit).
 * This is a data-quality audit, NOT a foal ability or game-theory verdict.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildFactorIntegrity152=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const ALLOWED=Object.freeze(['短','速','底','長','走','中','強','雷','堅','難','適','丈','早','晩']);
 const known=new Set(ALLOWED);
 const zeroVerified=r=>/^実測ID:.+/.test(String(r?.factorVariant||''));
 const validPath=p=>/^[SD]{0,4}S$/.test(String(p||''));
 const expected=[];for(let n=1;n<=5;n++)for(let i=0;i<2**(n-1);i++){
  let s='';for(let bit=n-2;bit>=0;bit--)s+=(i&(1<<bit))?'D':'S';expected.push(s+'S');
 }
 const expectedPaths=Object.freeze(expected);
 function classify(r){
  const fs=r?.factors;
  if(!Array.isArray(fs)||fs.length>3||fs.some(f=>typeof f!=='string'||!known.has(f)))
   return {status:'invalid',factors:null};
  if(fs.length===0&&!zeroVerified(r))return {status:'unknown',factors:null};
  return {status:fs.length?'recorded':'verified-zero',factors:fs};
 }
 function factorRecord(r){return classify(r).factors;}
 function audit(rows){
  if(!Array.isArray(rows)||rows.length!==31||new Set(rows.map(r=>String(r?.path||''))).size!==31||
   !rows.every(r=>validPath(r?.path)))return {available:false,version:152,reason:'最終31祖先枠の位置が欠落・重複・不正です',gameVerified:false};
  const items=rows.map(r=>({path:String(r.path),name:String(r.name||r.horse||'名前未確認'),
   variant:String(r.factorVariant||r.variant||''),...classify(r)}));
  const counts={recorded:0,'verified-zero':0,unknown:0,invalid:0};
  for(const item of items)counts[item.status]++;
  const unresolved=items.filter(x=>x.factors===null).sort((a,b)=>a.path.length-b.path.length||a.path.localeCompare(b.path));
  const byDepth=Object.fromEntries([1,2,3,4,5].map(n=>[n,unresolved.filter(r=>r.path.length===n).length]));
  return {version:152,available:true,slots:31,documented:counts.recorded+counts['verified-zero'],
   recordedFactorRows:counts.recorded,verifiedZero:counts['verified-zero'],
   missing:counts.unknown+counts.invalid,unknown:counts.unknown,invalid:counts.invalid,
   missingPaths:unresolved.map(x=>x.path),unresolved:unresolved.map(({factors,...rest})=>rest),byDepth,
   gameVerified:false,productionApproved:false,
   caveat:'実測0因子だけを既知0とし、空欄と不正配列は未知。これは記録の不足箇所を示す照合資料で、産駒能力・至高・有効クロス・生産可否は判定しません。'};
 }
 function comparableRows(a,b){const x=audit(a),y=audit(b);return !!(x.available&&y.available&&JSON.stringify(x.missingPaths)===JSON.stringify(y.missingPaths));}
 return Object.freeze({ALLOWED,expectedPaths,classify,factorRecord,audit,comparableRows});
});
