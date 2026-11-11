/* v3.4: independent, read-only pedigree data quality audit.
 * Research signals are not proof of any in-game mating theory or SP/ST value.
 * No external code or third-party datasets copied.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.DabimasResearchAudit34=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const FACTORS=new Set(['短','速','底','長','走','中','強','雷','堅','難','適','丈','早','晩']);
  const norm=x=>String(x==null?'':x).normalize('NFKC').replace(/[\s　]/g,'').toLowerCase();
  function expectedPaths(){
    const result=[];
    for(let depth=1;depth<=5;depth++){
      for(let i=0;i<Math.pow(2,depth-1);i++){
        let path='';
        for(let j=depth-2;j>=0;j--)path+=(i>>j)&1?'D':'S';
        result.push(path+'S');
      }
    }
    return result;
  }
  const PATHS=Object.freeze(expectedPaths());
  function audit(pedigree,options){
    options=options||{};
    const rows=Array.isArray(pedigree&&pedigree.rows)?pedigree.rows:[];
    const paths=new Set(PATHS),byPath=new Map(),duplicatePaths=[],invalidPaths=[],unrecognizedFactors=[];
    for(const row of rows){
      const path=String(row&&row.path||'');
      if(!paths.has(path)){invalidPaths.push(path);continue;}
      if(byPath.has(path)){duplicatePaths.push(path);continue;}
      byPath.set(path,row);
      for(const factor of Array.isArray(row.factors)?row.factors:[]){
        if(factor && !FACTORS.has(factor))unrecognizedFactors.push({path,factor:String(factor)});
      }
    }
    const blankNames=[],missingLines=[],missingFactorEvidence=[];
    for(const path of PATHS){
      const row=byPath.get(path);
      if(!row||!norm(row.name)){blankNames.push(path);continue;}
      if(!norm(row.line))missingLines.push(path);
      if(!Array.isArray(row.factors)||row.factors.length===0)missingFactorEvidence.push(path);
    }
    const configured=Array.isArray(options.anchorPaths)&&options.anchorPaths.length===3?options.anchorPaths:['SSS','DSSS','DDDSS'];
    const anchors=configured.map(path=>({path,row:byPath.get(path)}));
    const names=anchors.map(a=>norm(a.row&&a.row.name));
    const anchorSameName=names.every(n=>!!n&&n===names[0]);
    const anchorFactorKinds=[...new Set(anchors.flatMap(a=>Array.isArray(a.row&&a.row.factors)?a.row.factors.filter(x=>FACTORS.has(x)):[]))];
    const anchorIds=Array.isArray(options.anchorIds)?options.anchorIds:[];
    const distinctIds=anchorIds.length===3&&anchorIds.every(x=>norm(x))&&new Set(anchorIds.map(norm)).size===3;
    const conflicts=Array.isArray(pedigree&&pedigree.conflicts)?pedigree.conflicts.slice():[];
    const errors=[];
    if(blankNames.length)errors.push('祖先名の未収録 '+blankNames.length+'枠');
    if(invalidPaths.length||duplicatePaths.length)errors.push('祖先位置に重複または形式不正');
    if(conflicts.length)errors.push('祖先名の衝突 '+conflicts.length+'件');
    if(!anchorSameName)errors.push('指定3×4×5祖先の同名条件が未達');
    if(anchorFactorKinds.length<6)errors.push('指定3箇所の判明因子が6種類未満');
    if(anchorIds.length&&!distinctIds)errors.push('指定3頭の登録IDが独立していない／不足');
    const warnings=[];
    if(missingLines.length)warnings.push('子系統が未登録 '+missingLines.length+'枠');
    if(missingFactorEvidence.length)warnings.push('因子なし／因子未収録を区別できない '+missingFactorEvidence.length+'枠');
    if(unrecognizedFactors.length)warnings.push('未対応の因子表記 '+unrecognizedFactors.length+'件');
    warnings.push('全兄弟姉妹など成立阻害条件は、この血統31枠だけでは検証できません');
    warnings.push('ゲーム内の至高成立・ニトロ効果・SP/ST能力値は未確認です');
    return {schema:1,kind:'pedigree-research-audit',checkedAt:null,known:31-blankNames.length,total:31,
      anchors:{paths:anchors.map(a=>a.path),sameName:anchorSameName,factorKinds:anchorFactorKinds.length,
        distinctRegisteredIds:anchorIds.length?!!distinctIds:null},
      missing:{names:blankNames,lines:missingLines,factorEvidence:missingFactorEvidence},
      conflicts,duplicatePaths,invalidPaths,unrecognizedFactors,errors,warnings,
      status:errors.length?'要修正':warnings.length?'要ゲーム内確認':'一次条件確認'};
  }
  return Object.freeze({audit,expectedPaths:()=>PATHS.slice()});
});
