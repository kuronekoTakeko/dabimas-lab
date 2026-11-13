/* v8.0: read-only, plan-local stud-rights inventory audit.
   This does not predict mare quality or mating theory, consume rights, or edit inventory.
   Count ALL planned breedings including prerequisite births, not just the first
   occurrence of a stallion. Verified reuse is omitted by the caller. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasProductionDemand80=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
const norm=s=>String(s||'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
function audit({stages=[],inventory={},resolve=null}={}){
 const requests=new Map(),unresolved=[];let skipped=0;
 for(const [idx,stage] of (Array.isArray(stages)?stages:[]).entries()){
  if(!stage||stage.reused===true){skipped++;continue;}
  const id=String(stage.sireId||''),phase=String(stage.phase||`工程${idx+1}`);
  if(!norm(id)){unresolved.push({phase,reason:'父馬未指定'});continue;}
  const k=norm(id),sire=typeof resolve==='function'?resolve(id):null;
  // Planned/homebred males don't draw from acquired-stallion inventory. Their
  // actual availability/rights must be confirmed in the game separately.
  if(stage.isHomebred===true||sire?.isHomebred===true||id.startsWith('自家製:')){
   unresolved.push({phase,sireId:id,reason:'自家製種牡馬の供用・権利はゲーム内確認'});
   continue;
  }
  if(!requests.has(k))requests.set(k,{id,count:0,phases:[],recorded:!!sire});
  const r=requests.get(k);r.count++;r.phases.push(phase);r.recorded=r.recorded||!!sire;
 }
 const rows=[...requests.values()].map(r=>{
  const rec=inventory[norm(r.id)]||null,owned=rec?.owned===true;
  const rights=owned&&rec&&rec.rights!==''&&rec.rights!==null&&rec.rights!==undefined&&Number.isSafeInteger(Number(rec.rights))&&Number(rec.rights)>=0?Number(rec.rights):null;
  const shortage=!owned?null:rights===null?null:Math.max(0,r.count-rights);
  const status=!owned?'所持未確認':rights===null?'権利数未確認':shortage>0?'権利不足':'登録上は必要回数あり';
  return {...r,owned,rights,shortage,status};
 }).sort((a,b)=>{const prior=x=>x.status==='権利不足'||x.status==='所持未確認'?0:x.status==='権利数未確認'?1:2;return prior(a)-prior(b)||a.id.localeCompare(b.id,'ja');});
 const insufficient=rows.filter(r=>r.status==='権利不足').length;
 const notOwned=rows.filter(r=>r.status==='所持未確認').length;
 const unknown=rows.filter(r=>r.status==='権利数未確認').length;
 return {schema:80,rows,required:rows.reduce((s,r)=>s+r.count,0),insufficient,notOwned,unknown,unresolved,skipped,
  // No claim of game readiness even when the registered inventory suffices.
  allRecorded:rows.length>0&&insufficient===0&&notOwned===0&&unknown===0,
  gameVerified:false};
}
return Object.freeze({audit});
});
