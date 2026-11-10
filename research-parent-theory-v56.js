/* ダビマス配合研究所 v5.6 — 親系統による工程8の配合理論・三値診断。
 * 公開血統の「子系統」を「親系統」として扱わない。登録のない馬は未確認。
 * 下記はダビマス全書「種牡馬詳細」の15枠に併記された親系統を
 * 馬名ごとに独立転記した限定的な監査用参照。網羅データではない。
 * ゲーム内の成立表示、SP/ST、近親・全兄弟条件の確証ではない。
 * 2026-11-09 確認：
 * https://dabimas.jp/kouryaku/guide/introduction-to-breeding-theories.html
 * https://dabimas.jp/kouryaku/guide/advisor-05.html
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasParentTheory56=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const PARENTS=Object.freeze(['Eclipse','Fairway','Hampton','Herod','Himyar','Matchem','Nasrullah','Native Dancer','Nearctic','Phalaris','Royal Charger','St.Simon','Swynford','Teddy','Tom Fool']);
 const OK='成立',NO='不成立',UNKNOWN='未確認';
 const OFFICIAL_RULES='https://dabimas.jp/kouryaku/guide/introduction-to-breeding-theories.html';
 const OFFICIAL_ADVANCED='https://dabimas.jp/kouryaku/guide/advisor-05.html';
 const FAMILIES=Object.freeze({
  interestingSire:['SS','SSDS','SDS','SDDS'],interestingMare:['DS','DSDS','DDS','DDDS'],
  matchingSire:['SSSDS','SSDDS','SDSDS','SDDDS'],matchingMare:['DS','DSDS','DDS','DDDS'],
  miracleSire:['SSSS','SSDS','SDSS','SDDS'],miracleMare:'DDS'
 });
 const normalize=s=>String(s||'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const aliases={hamptom:'Hampton','ハンプトン':'Hampton','ネアルティック':'Nearctic','ニアークティック':'Nearctic','フェアウェイ':'Fairway','ナスルーラ':'Nasrullah','ロイヤルチャージャー':'Royal Charger','ネイティヴダンサー':'Native Dancer','フィラリス':'Phalaris','ファラリス':'Phalaris','セントサイモン':'St.Simon'};
 function canonical(v){const k=normalize(v);return aliases[k]||PARENTS.find(x=>normalize(x)===k)||null;}
 // Each profile contains ordered [ancestor name, parent-system] pairs, from the
 // publisher's explicit pedigree / parent-line sections (not child-line inference).
 // Parent-line inheritance between father and son is handled separately below.
 const PROFILES=[
  {horse:'キョウイチウマガミ-極走-',source:'https://dabimas.jp/kouryaku/stallions/1084824356.html',pairs:[
   ['ヘイルトゥリーズン','Royal Charger'],['ターントゥ','Royal Charger'],['Royal Charger','Royal Charger'],['ネアルコ','Phalaris'],
   ['Admiral Drake','Eclipse'],['Blue Swords','Himyar'],['Blue Larkspur','Himyar'],['Sir Gallahad','Teddy'],
   ['Petition','Fairway'],['フェアトライアル','Fairway'],['Fairway','Fairway'],["Artist's Proof",'Hampton'],
   ['ハイペリオン','Hampton'],['Gainsborough','Hampton'],['Blandford','Swynford']]},
  {horse:'フリオーソ-順煌-',source:'https://dabimas.jp/kouryaku/stallions/5912334882.html',pairs:[
   ['ブライアンズタイム','Royal Charger'],['ロベルト','Royal Charger'],['ヘイルトゥリーズン','Royal Charger'],['ターントゥ','Royal Charger'],
   ['ナシュア','Nasrullah'],['グロースターク','St.Simon'],['リボー','St.Simon'],['Hasty Road','Teddy'],
   ['ミスタープロスペクター','Native Dancer'],['Raise a Native','Native Dancer'],['ネイティヴダンサー','Native Dancer'],['ナシュア','Nasrullah'],
   ['ヌレイエフ','Nearctic'],['ノーザンダンサー','Nearctic'],['リヴァーマン','Nasrullah']]},
  {horse:'オルフェーヴル',source:'https://dabimas.jp/kouryaku/stallions/2837144513.html',pairs:[
   ['ステイゴールド','Royal Charger'],['サンデーサイレンス','Royal Charger'],['ヘイロー','Royal Charger'],['ヘイルトゥリーズン','Royal Charger'],
   ['アンダースタンディング','Teddy'],['ディクタス','Hampton'],['サンクタス','Hampton'],['ノーザンテースト','Nearctic'],
   ['メジロマックイーン','Herod'],['メジロティターン','Herod'],['メジロアサマ','Herod'],['リマンド','Swynford'],
   ['ノーザンテースト','Nearctic'],['ノーザンダンサー','Nearctic'],['Lt.Stevens','Nasrullah']]},
  {horse:'サトノアレス',source:'https://dabimas.jp/kouryaku/stallions/5912364483.html',pairs:[
   ['ディープインパクト','Royal Charger'],['サンデーサイレンス','Royal Charger'],['ヘイロー','Royal Charger'],['ヘイルトゥリーズン','Royal Charger'],
   ['アンダースタンディング','Teddy'],['アルザオ','Nearctic'],['リファール','Nearctic'],['バステッド','Swynford'],
   ['デインヒル','Nearctic'],['ダンチヒ','Nearctic'],['ノーザンダンサー','Nearctic'],['ヒズマジェスティ','St.Simon'],
   ['Artichoke','Nasrullah'],['Jacinto','Nasrullah'],['クリムゾンサタン','Himyar']]}
 ];
 function buildRegistry(profiles=PROFILES){
  const names=new Map(),sources=new Map(),conflicts=[];
  for(const p of profiles){if(!Array.isArray(p.pairs)||p.pairs.length!==15||!/^https:\/\/dabimas\.jp\//.test(p.source))throw Error('親系統監査：公式参照の15枠とURLが不正');
   for(const [name,system] of p.pairs){const k=normalize(name),v=canonical(system);if(!k||!v)throw Error('親系統監査：不明な名称／系統');
    if(names.has(k)&&names.get(k)!==v){conflicts.push({name,previous:names.get(k),newValue:v,sources:[...(sources.get(k)||[]),p.source]});names.set(k,null);}else if(!names.has(k))names.set(k,v);
    if(!sources.has(k))sources.set(k,new Set());sources.get(k).add(p.source);
   }
  }
  return {names,sources,conflicts};
 }
 const REGISTRY=buildRegistry();
 function lookup(name,registry=REGISTRY){const k=normalize(name);const parent=registry.names.get(k)||null;return parent?{parent,sources:[...(registry.sources.get(k)||[])],basis:'公式種牡馬詳細の親系統'}:null;}
 function countMap(arr){const m=new Map();for(const x of arr)if(x)m.set(x,(m.get(x)||0)+1);return m;}
 function interesting(lines,limit=7){const found=lines.filter(Boolean),unique=new Set(found).size,missing=lines.length-found.length;
  const status=unique>=limit?OK:unique+missing<limit?NO:missing?UNKNOWN:NO;
  return {status,distinctKnown:unique,missing,known:found.length};}
 function matching(left,right){const l=left.filter(Boolean),r=right.filter(Boolean),lu=left.length-l.length,ru=right.length-r.length;
  const lc=countMap(l),rc=countMap(r),needRight=[...lc].reduce((s,[v,n])=>s+Math.max(0,n-(rc.get(v)||0)),0),needLeft=[...rc].reduce((s,[v,n])=>s+Math.max(0,n-(lc.get(v)||0)),0);
  const impossible=needRight>ru||needLeft>lu;
  return {status:impossible?NO:lu||ru?UNKNOWN:OK,missing:lu+ru,requiredLeft:needLeft,requiredRight:needRight};
 }
 function joint(...states){return states.includes(NO)?NO:states.every(s=>s===OK)?OK:UNKNOWN;}
 function baseName(name){return String(name||'').replace(/-(?:[^-]+)-$/,'').replace(/(?:19|20)\d{2}$/,'');}
 function crossName(a,b){if(!a?.name||!b?.name)return UNKNOWN;return normalize(baseName(a.name))===normalize(baseName(b.name))?OK:NO;}
 function inspect(pedigree,{registry=REGISTRY,sourceOverride=null}={}){
  const rows=Array.isArray(pedigree?.rows)?pedigree.rows:[],by=new Map(rows.filter(r=>r&&typeof r.path==='string').map(r=>[r.path,r]));
  // A conflict in the 31-slot ancestor table invalidates theory evidence.
  if(pedigree?.conflicts?.length||pedigree?.transmission?.conflicts?.length)return {status:UNKNOWN,interesting:UNKNOWN,matching:UNKNOWN,perfect:UNKNOWN,superPerfect:UNKNOWN,miracle:UNKNOWN,blocked:true,missing:[],lineages:{},evidenceCount:0,sourceCount:0,reasons:['血統の親子・祖先矛盾を確認してください']};
  const lineages={},refs=new Set(),contradictions=[];
  function lineageAt(path,stack=new Set()){
   if(Object.prototype.hasOwnProperty.call(lineages,path))return lineages[path];
   if(stack.has(path))return null;stack.add(path);
   const row=by.get(path),found=row?.name?lookup(row.name,registry):null;
   const explicit=canonical(sourceOverride?.[path]);
   const next=path.length<5?lineageAt(path+'S',stack):null;
   const direct=explicit||found?.parent||null;
   if(direct&&next&&direct!==next){contradictions.push({path,name:row?.name||'',direct,inherited:next});lineages[path]=null;}
   else lineages[path]=direct||next||null;
   if(found)for(const s of found.sources)refs.add(s);
   stack.delete(path);return lineages[path];
  }
  const paths=[...new Set([...FAMILIES.interestingSire,...FAMILIES.interestingMare,...FAMILIES.matchingSire,...FAMILIES.miracleSire])];
  for(const path of paths)lineageAt(path);
  if(contradictions.length)return {status:UNKNOWN,interesting:UNKNOWN,matching:UNKNOWN,perfect:UNKNOWN,superPerfect:UNKNOWN,miracle:UNKNOWN,blocked:true,missing:[],lineages,evidenceCount:Object.values(lineages).filter(Boolean).length,sourceCount:refs.size,reasons:['親系統の直接証拠と父系継承が矛盾：'+contradictions.map(c=>c.path).join('・')],contradictions};
  const interest=[...FAMILIES.interestingSire,...FAMILIES.interestingMare].map(p=>lineages[p]||null);
  const sireMatch=FAMILIES.matchingSire.map(p=>lineages[p]||null),mareMatch=FAMILIES.matchingMare.map(p=>lineages[p]||null);
  const seven=interesting(interest,7),eight=interesting(interest,8),migo=matching(sireMatch,mareMatch);
  const perfect=joint(seven.status,migo.status),superPerfect=joint(eight.status,migo.status);
  const mother=by.get(FAMILIES.miracleMare);const four=FAMILIES.miracleSire.map(path=>({path,row:by.get(path)}));
  const possible=four.filter(x=>crossName(x.row,mother)===OK).map(x=>x.path);
  const unknownCross=mother?.name?four.some(x=>crossName(x.row,mother)===UNKNOWN):true;
  const cross=possible.length?OK:unknownCross?UNKNOWN:NO;
  const miracle=joint(perfect,cross);
  return {status:perfect,interesting:seven.status,interestingEight:eight.status,matching:migo.status,perfect,superPerfect,miracle,miracleCross:cross,
   miraclePaths:possible,missing:paths.filter(p=>!lineages[p]).map(path=>({path,name:by.get(path)?.name||'祖先未登録'})),
   lineages,evidenceCount:Object.values(lineages).filter(Boolean).length,sourceCount:refs.size,
   interestingDistinct:seven.distinctKnown,interestingUnknown:seven.missing,matchingUnknown:migo.missing,
   gameVerified:false,verifiedAt:'2026-11-09',ruleSources:[OFFICIAL_RULES,OFFICIAL_ADVANCED],
   reasons:possible.length?['4×3の同名候補は条件上の照合です。ゲーム内の成立表示は未確認です']:[]};
 }
 return Object.freeze({PARENTS,PROFILES,REGISTRY,FAMILIES,OK,NO,UNKNOWN,canonical,buildRegistry,lookup,interesting,matching,inspect});
});
