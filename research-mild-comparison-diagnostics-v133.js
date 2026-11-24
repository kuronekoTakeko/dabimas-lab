/* v133: explain why the v132 strict 0/1/2-step comparison cannot decide.
 * The method observes only already built, ownership-checked, full-31 candidates.
 * There is NO new mating, production approval, ability prediction or mutation.
 * An unknown factor is never assigned zero. Different missing-factor SLOT
 * patterns are placed in a documentary-only lane, never counted as proof.
 */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DabimasMildDiagnostics133=api;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
 const GOALS=['speed','balance','stamina'];
 const STATUSES=['noLowerObserved','differentAnchor','differentTheory','coverageMismatch','strictCompared'];
 const ROUTES=['direct','sireOnly','mareOnly','both'];
 const norm=x=>String(x??'').normalize('NFKC').replace(/[\s\u3000]/g,'').replace(/[－―ｰ]/g,'-').toLowerCase();
 const positions=s=>new Set(String(s||'').split('|').filter(Boolean));
 const diffCount=(a,b)=>{const x=positions(a),y=positions(b);let n=0;for(const p of x)if(!y.has(p))n++;for(const p of y)if(!x.has(p))n++;return n;};
 function classify(row,rows){
  if(row.births===0)return null;
  const lower=rows.filter(b=>b.births===row.births-1),anchors=lower.filter(b=>b.anchors===row.anchors);
  const sameTheory=anchors.filter(b=>b.grade===row.grade);
  const exact=sameTheory.filter(b=>b.missingSignature===row.missingSignature);
  let status;
  if(!lower.length)status='noLowerObserved';
  else if(!anchors.length)status='differentAnchor';
  else if(!sameTheory.length)status='differentTheory';
  else if(!exact.length)status='coverageMismatch';
  else status='strictCompared';
  const ref=(exact.length?exact:sameTheory).slice().sort((a,b)=>diffCount(row.missingSignature,a.missingSignature)-diffCount(row.missingSignature,b.missingSignature)||a.id.localeCompare(b.id))[0]||null;
  return {status,route:row.route,births:row.births,family:row.family,anchorMatched:anchors.length,
   theoryMatched:sameTheory.length,strictMatches:exact.length,
   nearest:ref?{family:ref.family,route:ref.route,missing:ref.profile.missing,
    differentUnknownPositions:diffCount(row.missingSignature,ref.missingSignature),
    stage:{...ref.profile.stages}}:null,
   missing:row.profile.missing,stages:{...row.profile.stages},gameVerified:false,
   strengthVerdict:null};
 }
 function study(trials,{v132,full31,ranker,owned,maxExamples=3}={}){
  if(!v132?.collect)return {version:133,available:false,reason:'v132の検査器がありません',gameVerified:false};
  const input=v132.collect(trials,{full31,ranker,owned});
  if(!input.available)return {version:133,available:false,reason:input.reason||'監査不可',audit:input.audit,gameVerified:false};
  const rows=input.rows,extras=rows.filter(r=>r.births>0),details=extras.map(r=>classify(r,rows));
  const stats=Object.fromEntries(STATUSES.map(k=>[k,details.filter(r=>r.status===k).length]));
  const byRoute=Object.fromEntries(ROUTES.map(k=>[k,{
   candidates:rows.filter(r=>r.route===k).length,
   ...Object.fromEntries(STATUSES.map(s=>[s,details.filter(r=>r.route===k&&r.status===s).length]))
  }]));
  const lim=Math.min(5,Math.max(1,Math.trunc(Number(maxExamples)||3))),examples=[];
  for(const status of STATUSES){for(const row of details.filter(r=>r.status===status).slice(0,lim))examples.push(row);}
  const documentedSameTheoryDifferentCoverage=stats.coverageMismatch;
  const remainingUninspected=Object.values(stats).reduce((a,b)=>a+b,0)-stats.strictCompared;
  return {version:133,available:rows.length>0,gameVerified:false,productionApproved:false,searchComplete:false,
   checked:rows.length,extraCandidates:extras.length,counts:{direct:byRoute.direct.candidates,sireOnly:byRoute.sireOnly.candidates,
    mareOnly:byRoute.mareOnly.candidates,both:byRoute.both.candidates},
   stats,byRoute,examples,audit:input.audit,documentedSameTheoryDifferentCoverage,
   remainingWithoutStrictComparator:remainingUninspected,
   priorities:[
    ...(byRoute.direct.candidates===0?['追加0工程：今回の詳細検査で候補未観測。8枠事前条件と探索打切り範囲を再調査']:[]),
    ...(byRoute.mareOnly.candidates===0?['肌側＋1工程：今回の詳細検査で候補未観測。構造条件と探索枠を再調査']:[]),
    ...(documentedSameTheoryDifferentCoverage>0?['同じ指定3頭・同じ理論でも因子未収録位置が異なる案を資料不足として隔離。優劣判定には使用しない']:[]),
    '取得済み種牡馬だけの最終31枠とゲーム内の理論を確認するまで、生産承認しない'
   ],
   limitations:'v132と同じ実所持・最終31枠の検査通過候補だけを使用。下位工程は追加工程数がちょうど1少なく、指定3頭も同じ案。血統因子の収録位置が違う案は参考対照を示すだけで、能力改善や工程優位の根拠にはしません。今回未観測の構成は不成立の証明ではありません。旧プラン順位や保存済み所持情報は変更せず、ゲーム内の至高成立・SP/ST・クロスは未確認。'};
 }
 return Object.freeze({study,classify,diffCount,ROUTES,STATUSES,GOALS});
});
