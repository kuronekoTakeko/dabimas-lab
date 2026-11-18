#!/usr/bin/env node
/* Read-only external TXT -> portable JSON audit. No game-side verification. */
'use strict';
const fs=require('fs');
const norm=s=>String(s??'').normalize('NFKC').trim().replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-');
function parse(txt){
 const lines=txt.replace(/^\uFEFF/,'').split(/\r?\n/),title=(lines.find(s=>s.startsWith('計画：'))||'').slice(3);
 const anchorLine=lines.find(s=>s.startsWith('至高指定：'))||'';
 const anchors=Object.fromEntries([...anchorLine.matchAll(/(g[345])=([^\s/]+)/g)].map(m=>[m[1],m[2]]));
 const sections={sire:[],mare:[],foal:[]},prefix={"種（":"sire","肌（":"mare","最終産駒":"foal"};
 let section=null;
 for(const line of lines){
  const header=line.match(/^【([^】]+)】/);if(header){section=Object.entries(prefix).find(([key])=>header[1].startsWith(key))?.[1]||null;continue;}
  if(!section||!line.match(/^[SD]{1,5}\t/))continue;
  const bits=line.split('\t');if(bits.length<6)throw Error('6 columns expected for '+line);
  sections[section].push({path:bits[0],name:bits[1],variant:bits[2]==='未確認'?'':bits[2],
   factors:bits[3]==='未確認'?[]:bits[3].split('・').filter(Boolean),line:bits[4],source:bits[5]});
 }
 return {title,anchors,sections};
}
function audit(txt,portable){
 const input=parse(txt),plans=portable?.personal?.plans||[];
 const candidates=plans.filter(p=>p.title===input.title&&p.externalReview48?.parts?.foal?.ancestors?.length===31);
 const selected=candidates.filter(p=>{const expected=p.externalReview48.parts.foal.ancestors||[];return expected.some(r=>r.path==='S'&&norm(r.name)===norm(input.sections.foal[0]?.name));});
 const plan=selected.length===1?selected[0]:null;
 const errors=[],warnings=[],perPart={};
 if(!plan)warnings.push('このTXTの仮馬番号に一致する保存プランは添付JSONにありません（同名 '+candidates.length+'件、S一致 '+selected.length+'件）。後の端末操作による新しい案の可能性があります。');
 for(const [name,rows] of Object.entries(input.sections)){
  if(rows.length!==31)errors.push(name+'：祖先31行が不足・超過（'+rows.length+'行）');
  if(new Set(rows.map(x=>x.path)).size!==rows.length)errors.push(name+'：血統パス重複');
  const source=plan?.externalReview48?.parts?.[name]?.ancestors||[];
  const map=new Map(source.map(r=>[r.path,r]));
  let matches=0;
  for(const row of rows){const orig=map.get(row.path);if(!orig)continue;
   const same=norm(row.name)===norm(orig.name)&&norm(row.variant)===norm(orig.variant)&&
    JSON.stringify(row.factors.map(norm))===JSON.stringify((orig.factors||[]).map(norm))&&norm(row.line)===norm(orig.line);
   if(same)matches++;else errors.push(name+': '+row.path+' 保存JSONとTXTの表示が不一致');
  }
  perPart[name]={rows:rows.length,matched:matches,missingFactors:rows.filter(r=>!r.factors.length).length,
   missingVariants:rows.filter(r=>!r.variant).length};
 }
 const foal=new Map(input.sections.foal.map(x=>[x.path,x]));
 // Check the exported foal's 30 inherited ancestor labels against its two parent tables,
 // independently of saved plan IDs. A matching name/variant/recorded factors is NOT a game check.
 let inheritanceMatches=0, inheritanceChecked=0;
 for(const [path,row] of foal){
  if(path.length<2)continue;
  const base=(path[0]==='S'?input.sections.sire:input.sections.mare).find(x=>x.path===path.slice(1));
  inheritanceChecked++;
  if(base&&norm(row.name)===norm(base.name)&&norm(row.variant)===norm(base.variant)&&
    JSON.stringify(row.factors.map(norm))===JSON.stringify(base.factors.map(norm))){inheritanceMatches++;}
  else errors.push('最終産駒 '+path+' が父/母の'+path.slice(1)+'と一致しません');
 }
 const master=Array.isArray(portable?.publicMaster?.records)?portable.publicMaster.records:[];
 const byId=new Map(master.map(r=>[norm(r.id),r]));
 const anchorSource=[];
 const paths={g3:'DDS',g4:'SSSS',g5:'SDSSS'};
 const ancestorEvidence=Object.entries(paths).map(([rank,path])=>{
  const row=foal.get(path),required=input.anchors[rank],v=row?(row.variant?'-'+row.variant+'-':''):'';
  const base=row?.name||'';
  const display=base+v,year=!!row&&/^\d{4}$/.test(row.variant)&&norm(required)===norm(base+row.variant);
  const positionMatches=!!required&&!!row&&(norm(display)===norm(required)||year);
  if(!positionMatches)errors.push(rank+' 指定と実祖先パスのIDが一致しません');
  const current=byId.get(norm(required));
  const masterMatch=!!current&&norm(current.name)===norm(base)&&norm(current.variant)===norm(row?.variant)&&
   JSON.stringify((current.factors||[]).map(norm))===JSON.stringify((row?.factors||[]).map(norm));
  if(!masterMatch)errors.push(rank+' 公開マスターの因子・異因名との不一致またはマスター未収録');
  anchorSource.push({rank,id:required,found:!!current,factorsIdentical:masterMatch});
  return {rank,path,requested:required,actual:display,positionMatches,yearNotationOnly:year,masterMatch,
   factorKinds:row?.factors||[],gameVerified:false};
 });
 const parents={sire:input.sections.sire,mare:input.sections.mare};
 const bySide=Object.fromEntries(Object.entries(parents).map(([side,rows])=>{
  const m=new Map();for(const r of rows){const key=norm(r.name);if(!m.has(key))m.set(key,[]);m.get(key).push(r.path);}
  return [side,m];
 }));
 const common=[...bySide.sire.keys()].filter(k=>bySide.mare.has(k)).map(k=>{
  const row=parents.sire.find(x=>norm(x.name)===k);
  return {name:row.name,sirePaths:bySide.sire.get(k),marePaths:bySide.mare.get(k),
   classification:'同名祖先の両側出現（独立・有効クロスは未確定）'};
 });
 const tripleComplete=ancestorEvidence.length===3&&ancestorEvidence.every(x=>x.positionMatches);
 if(perPart.foal?.missingFactors>0)warnings.push('最終31枠の因子未収録 '+perPart.foal.missingFactors+'（因子なしとは扱えません）');
 warnings.push('両側に現れる祖先名 '+common.length+'種：同名重複を有効な独立クロスとは数えません');
 return {version:122,title:input.title,planId:plan?.id||null,uniquelyMatched:!!plan,
  origin:'添付外部照合用TXTと端末移行JSONの登録レコードを照合（ゲーム／外部ツールの独立検証ではない）',
  sectionAudit:perPart,inheritance:{checked:inheritanceChecked,matched:inheritanceMatches},anchorSource,ancestorEvidence,positionComplete:tripleComplete,crossNames:common,
  errors,warnings,gameVerified:false,independentExternalToolVerified:false,
  conclusion:errors.length?'登録血統の矛盾・マスター不整合を検出':plan?'TXTと保存プランの登録血統が一致（ゲーム内未検証）':'TXT内部の親子継承・公開マスターと一致／保存プラン同一性は未検証'};
}
if(require.main===module){
 const [jsonFile,...files]=process.argv.slice(2);if(!jsonFile||!files.length)throw Error('usage node audit-crosscheck-v122.cjs latest.json crosscheck1.txt [crosscheck2.txt...]');
 const portable=JSON.parse(fs.readFileSync(jsonFile,'utf8'));
 const result=files.map(file=>({sourceFile:file.replace(/^.*[\\/]/,''),...audit(fs.readFileSync(file,'utf8'),portable)}));
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(result.some(r=>r.errors.length))process.exitCode=1;
}
module.exports={parse,audit};
