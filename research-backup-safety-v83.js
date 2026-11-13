/* v8.3 | Conservative JSON import: never clear local production records,
 * overwrite a local record, or silently unify a conflicting cross-PC state.
 * Inputs and result are plain JSON-compatible values. No storage writes.
 * A resetProductionData file is accepted ONLY on an actually empty device.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasBackupSafety83=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const fields=['owned','added','genomes','plans','mareFavorites','mareGrades','homebreds'];
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 const list=v=>Array.isArray(v)?v:[];
 const norm=s=>String(s??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const safeKey=k=>!['__proto__','prototype','constructor'].includes(k);
 const clone=v=>JSON.parse(JSON.stringify(v));
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const fresh=s=>Object.keys(obj(s.owned)).filter(safeKey).length===0&&list(s.plans).length===0&&list(s.homebreds).length===0&&list(s.genomes).length===0&&list(s.added).length===0&&Object.keys(obj(s.mareFavorites)).length===0&&Object.keys(obj(s.mareGrades)).length===0;
 function review(current,source){
  const s=obj(source),base=obj(current),reset=s.resetProductionData===true;
  if(!((s.owned&&typeof s.owned==='object'&&!Array.isArray(s.owned))||Array.isArray(s.plans)||Array.isArray(s.stallions)))return {ok:false,reason:'所持馬・保存プランのJSON形式ではありません'};
  if(reset&&!fresh(base))return {ok:false,reason:'初期化指定のあるJSONは、既存データがある端末には読み込めません。現在のPCの所持馬・保存プラン・実馬・ゲノムを保護しました。別の新規端末のみで利用してください。',protected:true};
  const incoming={...s};
  if(Array.isArray(s.stallions)){
   incoming.owned={};incoming.added=[];
   for(const x of s.stallions){if(!x||typeof x!=='object')continue;
    const name=String(x.display_name||`${x.name||''}-${x.variant||''}-`);const id=norm(name);
    if(!id||!safeKey(id))continue;
    incoming.owned[id]={owned:x.owned!==false,rights:Number.isSafeInteger(Number(x.rights_remaining))&&Number(x.rights_remaining)>=0?Number(x.rights_remaining):0,verified:'import'};
    incoming.added.push({id:name,name:x.name||name,variant:x.variant||'',factors:Array.isArray(x.factors)?x.factors:[],rights:x.rights_remaining||0,ancestry:[],isSeed:true});
   }
   if(Array.isArray(s.predictions))incoming.genomes=s.predictions;
  }
  const result=clone(base),stats={added:{},conflicts:{},skippedInvalid:0};
  for(const field of fields){stats.added[field]=0;stats.conflicts[field]=0;}
  function mergeObject(field){
   const target=Object.create(null),old=obj(base[field]),other=obj(incoming[field]);
   for(const k of Object.keys(old))if(safeKey(k))target[k]=clone(old[k]);
   for(const k of Object.keys(other)){
    if(!safeKey(k)){stats.skippedInvalid++;continue;}
    const value=other[k];if(own(target,k)){if(!equal(target[k],value))stats.conflicts[field]++;}
    else{target[k]=clone(value);stats.added[field]++;}
   }
   result[field]=target;
  }
  function mergeRecords(field){
   const existing=list(base[field]).map(clone),others=list(incoming[field]),ids=new Map(),exact=new Set(existing.map(x=>JSON.stringify(x)));
   const idOf=x=>x&&typeof x==='object'?norm(field==='plans'?x.id:field==='homebreds'?x.id:x.id||''):'';
   if(field!=='genomes')existing.forEach((x,i)=>{const k=idOf(x);if(k)ids.set(k,i);});
   for(const record of others){
    if(!record||typeof record!=='object'||Array.isArray(record)){stats.skippedInvalid++;continue;}
    if(field==='plans'&&(typeof record.title!=='string'||!String(record.id||'').trim())){stats.skippedInvalid++;continue;}
    if(field==='homebreds'&&(!['male','female'].includes(record.sex)||!Array.isArray(record.ancestry)||!String(record.id||'').trim())){stats.skippedInvalid++;continue;}
    const item=clone(record),sig=JSON.stringify(item),id=idOf(item);
    if(id&&!safeKey(id)){stats.skippedInvalid++;continue;}
    if(field!=='genomes'&&id&&ids.has(id)){
     if(!equal(existing[ids.get(id)],item))stats.conflicts[field]++;
     continue; // preserve local even if external timestamp is newer
    }
    if(exact.has(sig))continue;
    existing.push(item);exact.add(sig);if(id)ids.set(id,existing.length-1);stats.added[field]++;
   }
   result[field]=existing;
  }
  if(reset){ // no records exist on this device, do not call any reset function
   for(const field of fields)result[field]=['owned','mareFavorites','mareGrades'].includes(field)?{}:[];
  }
  for(const k of ['owned','mareFavorites','mareGrades'])mergeObject(k);
  for(const k of ['added','genomes','plans','homebreds'])mergeRecords(k);
  const conflicts=Object.values(stats.conflicts).reduce((a,b)=>a+b,0),added=Object.values(stats.added).reduce((a,b)=>a+b,0);
  return {ok:true,next:result,stats,conflicts,added,freshOnly:reset,gameVerified:false,
   note:'同一ID・同一設定キーで内容が違う場合、端末の既存値を保持し、外部の衝突データは取り込まず元のJSONに残します。端末間の自動同期や上書きはしません。'};
 }
 return Object.freeze({review,fresh});
});
