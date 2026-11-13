/* v8.2 | User-entered, per-stage production journal for DDS mild plans.
 * Does not alter an animal's real/draft status, pedigree, rights or mating theory.
 * A manual 'selected' journal mark is NOT proof of a real foal or game theory.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildGameLog82=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
 const STATUSES=Object.freeze({unstarted:'未着手',working:'生産・厳選中',selected:'候補を選別済み',retry:'再挑戦予定',paused:'保留'});
 const THEORIES=Object.freeze({unchecked:'未確認',seen:'ゲーム内表示を確認',different:'想定と異なる表示',not_seen:'成立表示なし'});
 const validId=id=>/^C:[1-9]$/.test(id)||/^P:(sire|mare)$/.test(id);
 const own=(x,k)=>Object.prototype.hasOwnProperty.call(x||{},k);
 function sanitize(raw={}){
  const d=raw&&typeof raw==='object'?raw:{};
  const state=own(STATUSES,d.status)?d.status:'unstarted';
  const theory=own(THEORIES,d.theory)?d.theory:'unchecked';
  const attempts=Number.isSafeInteger(d.attempts)&&d.attempts>=0&&d.attempts<=99999?d.attempts:0;
  const txt=(name,max)=>String(d[name]??'').slice(0,max);
  return {status:state,theory,attempts,sp:txt('sp',50),st:txt('st',50),theoryLabel:txt('theoryLabel',100),memo:txt('memo',600),updatedAt:txt('updatedAt',60)};
 }
 function save(saved,id,input,at){
  if(!validId(id))return {ok:false,error:'このプランの工程IDとして認められません'};
  if(!input||typeof input!=='object')return {ok:false,error:'入力が不正です'};
  if(!own(STATUSES,input.status)||!own(THEORIES,input.theory))return {ok:false,error:'選択した記録状態が不正です'};
  const count=String(input.attempts??'').trim();
  if(!/^(?:0|[1-9]\d{0,4})$/.test(count))return {ok:false,error:'試行回数は0〜99999の整数で入力してください'};
  for(const [field,max] of [['sp',50],['st',50],['theoryLabel',100],['memo',600]]){
   if(String(input[field]??'').length>max)return {ok:false,error:`${field}の入力が長すぎます`};
  }
  if(input.theory==='seen'&&!String(input.theoryLabel??'').trim())return {ok:false,error:'ゲーム内で確認した配合理論の名称を記入してください'};
  // Preserve unrelated saved plan metadata and other stage records. Use own
  // properties to prevent inherited keys being treated as saved journal rows.
  const previous=(saved&&typeof saved==='object'&&!Array.isArray(saved))?saved:{};
  const rows=Object.create(null);
  if(previous.records&&typeof previous.records==='object')for(const k of Object.keys(previous.records)){
   if(validId(k))rows[k]=sanitize(previous.records[k]);
  }
  rows[id]=sanitize({...input,attempts:Number(count),updatedAt:String(at||'')});
  return {ok:true,data:{version:82,records:rows},record:rows[id]};
 }
 function assess(stages,saved){
  const list=Array.isArray(stages)?stages:[];
  const logs=saved?.records&&typeof saved.records==='object'?saved.records:{};
  const rows=list.filter(x=>validId(x?.id)).map(s=>{
   const hasRecord=own(logs,s.id),log=sanitize(hasRecord?logs[s.id]:{});
   return {id:s.id,label:String(s.label||s.id),state:String(s.state||'未確認'),
    realConfirmed:s.completed===true,hasRecord,log,
    selectedOnly:log.status==='selected'&&s.completed!==true,
    theoryMismatch:log.theory==='different'||log.theory==='not_seen',
    userObservation:log.theory==='seen',gameAutoVerified:false};
  });
  return {rows,total:rows.length,recorded:rows.filter(x=>x.hasRecord).length,
   selectedOnly:rows.filter(x=>x.selectedOnly).length,realConfirmed:rows.filter(x=>x.realConfirmed).length,
   theoryMismatch:rows.filter(x=>x.theoryMismatch).length,
   gameAutoVerified:false,
   note:'記録欄はユーザーがゲームで見た内容のメモです。「候補選別済み」「表示を確認」は実馬生産済み・配合理論成立の自動証明になりません。'};
 }
 return Object.freeze({STATUSES,THEORIES,validId,sanitize,save,assess});
});
