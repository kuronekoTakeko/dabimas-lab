/* v5.4 | MILD-ONLY target-distance evidence for Shiko anchor placement.
 * A sire's imported distance range is not a foal's confirmed preferred distance.
 * Historic research says homebred stallion aptitude may inherit along the
 * uninterrupted paternal line; we expose this as an assumption, not proof.
 * Neither pedigree theory nor SP/ST prediction is decided by this module.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DabimasDistance54=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const raw=x=>String(x??'').normalize('NFKC').trim();
 const normalize=x=>raw(x).replace(/\s+/g,'');
 const PREFERRED=[1200,1600,1800,2000,2200,2400,2500,3000,3200];
 const research='https://note.com/huh_ds/n/n0eb8a439d3f3';
 const inheritance='https://umanity.jp/sp/dabimas/columndet_view.php?cid=8496';
 function parseRace(race){
  const m=normalize(race).match(/(?:芝|ダート)?(\d{3,4})m(?:$|[^\d])/i);
  const meters=m?Number(m[1]):null;
  return meters>=800&&meters<=4000?meters:null;
 }
 function parseRange(value){
  if(value==null||typeof value==='object')return null;
  // Require an actual range separator. An isolated distance is NOT a range.
  // Convert tilde/dash variants without mistaking release years for distances.
  const s=normalize(value).replace(/[〜～~－−–—―]/g,'-');
  const m=s.match(/(\d{3,4})m?-(\d{3,4})m?/i);
  if(!m)return null;
  const min=Number(m[1]),max=Number(m[2]);
  if(min<800||max>4000||min>=max)return null;
  return {min,max,width:max-min,raw:raw(value)};
 }
 function assess(race,source){
  const meters=parseRace(race);
  const entry=typeof source==='object'&&source!==null?source.distance:source;
  const range=parseRange(entry);
  if(!meters||!range)return {
   status:'unknown',meters,range:range||null,preferredCandidateCount:null,
   note:!meters?'対象レースの距離を読み取れません':'中心3代馬の距離適性が公開マスターで未確認',
   gameVerified:false
  };
  const inside=range.min<=meters&&meters<=range.max;
  const candidates=PREFERRED.filter(m=>m>=range.min&&m<=range.max);
  return {status:inside?'covered':'outside',meters,range,
   preferredCandidateCount:candidates.length,preferredDistances:candidates,
   theoreticalBonus:range.width>=1100?{atPreferred:{sp:3,st:1},other:{sp:0,st:1}}:
    {atPreferred:{sp:2,st:0},other:{sp:1,st:0}},
   note:inside?'目標距離を範囲内に含む（得意距離の一致は未確認）':'目標距離が登録適性の範囲外',
   gameVerified:false};
 }
 const tier={covered:0,unknown:1,outside:2};
 function compare(a,b){
  // Do not infer a probability from the number of possible preferred distances;
  // a broad range can earn stronger conditional race bonuses in player research.
  return (tier[a?.status]??1)-(tier[b?.status]??1);
 }
 function rankPlacements(entries,race,lookup){
  const get=typeof lookup==='function'?lookup:()=>null;
  return [...(entries||[])].sort((a,b)=>{
   const da=assess(race,get(a?.slots?.g3)),db=assess(race,get(b?.slots?.g3));
   return compare(da,db)||((Number(b?.score)||0)-(Number(a?.score)||0));
  });
 }
 return Object.freeze({parseRace,parseRange,assess,compare,rankPlacements,preferredDistances:[...PREFERRED],research,inheritance});
});
