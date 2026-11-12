/* v7.2 | Conservative dependency-based production scheduler for MILD plans.
 * Read-only: does not delete or fabricate steps, modify game state, infer
 * self-factors, claim a lower global breeding minimum, or assert game theory.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildSchedule72=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const norm=x=>String(x??'').normalize('NFKC').trim();
 const asList=x=>Array.isArray(x)?x:[];
 function analyze(plan,{definitions,records=[],resolveStep}={}){
  const errors=[],nodes=[];
  const route=plan?.routeDraft?.layout||'';
  if(route!=='maternal-dds-g3'||!Array.isArray(definitions)||definitions.length!==9)
   return {applicable:false,errors:['この監査はDDSマイルドの基幹9工程専用です'],gameVerified:false};
  const seen=new Set(),byId=new Map(asList(records).map(h=>[norm(h.id),h]));
  const prep=plan?.mild67||{},chain=plan?.chain09||{},marks=chain.reused50||{};
  const before=[['sire',prep.prep,2,'牡'],['mare',prep.marePrep,1,'牝']];
  for(const [kind,entry,core,sex] of before){
   if(!entry)continue;
   const id='P:'+kind,horse=byId.get(norm(entry.foalId));
   if(!entry.foalId||!entry.fatherId||!entry.motherId)errors.push(`${id}：準備馬の父母・産駒IDが不足`);
   if(!horse||norm(horse.fatherId)!==norm(entry.fatherId)||norm(horse.motherId)!==norm(entry.motherId)||horse.sex!==(sex==='牡'?'male':'female'))
    errors.push(`${id}：準備馬の父母・性別が記録と一致しません`);
   const used=kind==='sire'?chain.xId:chain.mares?.[1];
   if(norm(used)!==norm(entry.foalId))errors.push(`${id}：基幹工程${core}への接続が不一致`);
   nodes.push({id,label:kind==='sire'?'準備：締め肌の父':'準備：ディープ基礎牝馬',
    kind:'preparation',deps:[],sex,recordId:entry.foalId,
    // Produced in this plan: not an established reused horse.
    status:horse?.mode==='real'?'記録上実馬':'仮馬・未確認',newBirth:true,recordedReal:horse?.mode==='real'});
  }
  for(const def of definitions){
   if(!def||!Number.isInteger(def.n)||def.n<1||def.n>9||seen.has(def.n)){
    errors.push('工程番号が不足・重複しています');continue;
   }
   seen.add(def.n);
   const id='C:'+def.n,deps=[];
   if(def.sireStep)deps.push('C:'+def.sireStep);
   if(def.mareStep)deps.push('C:'+def.mareStep);
   if(def.n===2&&prep.prep)deps.push('P:sire');
   if(def.n===1&&prep.marePrep)deps.push('P:mare');
   const mark=marks[def.n],linked=typeof resolveStep==='function'?resolveStep(def.n):null;
   const horse=linked?.horse;
   const provenReuse=!!mark&&linked?.reused===true&&horse?.mode==='real'&&norm(horse.id)===norm(mark.id);
   if(mark&&!provenReuse)errors.push(`工程${def.n}：既存実馬の再利用根拠が未確認`);
   // A newly produced horse counts as a birth even if the player recorded
   // its production as complete; this is different from reuse.
   const recordedReal=horse?.mode==='real';
   nodes.push({id,label:def.n===9?'工程9：最終交配':`工程${def.n}`,
    kind:'core',coreStep:def.n,deps,sex:def.sex==='female'?'牝':def.n===9?'不問':'牡',
    recordId:horse?.id||chain.outputs?.[def.n]||'',
    status:provenReuse?'既存実馬を照合して再利用':recordedReal?'記録上実馬':horse?'仮馬・未確認':'未連結',
    newBirth:!provenReuse,reused:provenReuse,recordedReal});
  }
  if(seen.size!==9)errors.push('基幹9工程が不足しています');
  const level=new Map(),complete=new Map();
  for(const node of nodes){
   if(complete.has(node.id)){errors.push(`重複工程 ${node.id}`);continue;}
   if(node.deps.some(d=>!level.has(d)))errors.push(`${node.id}：未構築の前工程を参照しています`);
   level.set(node.id,1+Math.max(0,...node.deps.map(d=>level.get(d)||0)));
   complete.set(node.id,node);
  }
  const waves=[];for(const node of nodes){const wave=level.get(node.id)||1;
   if(!waves[wave-1])waves[wave-1]=[];
   waves[wave-1].push({id:node.id,label:node.label,status:node.status,newBirth:node.newBirth});
  }
  const all=nodes.length,reused=nodes.filter(n=>n.reused).length;
  const newBirths=nodes.filter(n=>n.newBirth).length;
  const recordedReal=nodes.filter(n=>n.newBirth&&n.recordedReal).length;
  const remainingUnconfirmed=newBirths-recordedReal;
  const essential=new Set(['C:9']);
  // Backward closure: any stage that reaches the final child is NOT a no-op.
  for(let i=nodes.length-1;i>=0;i--){const n=nodes[i];
   if(!essential.has(n.id))continue;
   for(const d of n.deps)essential.add(d);
  }
  const disconnected=nodes.filter(n=>!essential.has(n.id)).map(n=>n.label);
  if(disconnected.length)errors.push('最終産駒に接続しない工程あり：'+disconnected.join('・'));
  return {version:72,applicable:true,errors,ok:!errors.length,
   layout:route,stages:all,preparations:nodes.filter(n=>n.kind==='preparation').length,
   core:seen.size,recordedReuses:reused,newBirths,recordedReal,
   remainingUnconfirmed,waves:waves.filter(Boolean),connectedCount:essential.size,
   disconnected,shortcutProven:false,gameVerified:false,
   note:'同一血統の既存実馬再利用以外では、9基幹工程を削減したと判定しません。並行群は依存関係上の案であり、種付け権利・繁殖時期・施設の同時利用は未考慮です。'};
 }
 return Object.freeze({analyze});
});
