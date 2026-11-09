'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('../research-distance-v54.js');
const root=path.join(__dirname,'..');
let passed=0;
function t(name,fn){fn();console.log('PASS '+name);passed++;}
t('Japanese tilde, dash, and source formats parse without fabricating ranges',()=>{
 for(const v of ['1000～3600','1000〜3600m','芝1000-3600m','1000m－3600m']){
  assert.deepEqual([api.parseRange(v)?.min,api.parseRange(v)?.max],[1000,3600]);
 }
 assert.equal(api.parseRange('2400m'),null);
 assert.equal(api.parseRange('キングカメハメハ2012'),null);
 assert.equal(api.parseRange('距離不明'),null);
 assert.equal(api.parseRange('3600〜1000m'),null);
 assert.equal(api.parseRange('1200〜6000m'),null);
});
t('race extractor recognizes turf/dirt and not unknown',()=>{
 assert.equal(api.parseRace('芝2400m'),2400);
 assert.equal(api.parseRace('公式BC想定：ダート1600m'),1600);
 assert.equal(api.parseRace('未指定'),null);
});
t('covered and outside are measured from the recorded father range',()=>{
 const good=api.assess('芝2400m',{distance:'1000～3600'});
 const bad=api.assess('芝2400m',{distance:'1200～2000'});
 assert.equal(good.status,'covered');assert.equal(bad.status,'outside');
 assert.equal(good.range.width,2600);
 assert.equal(good.theoreticalBonus.atPreferred.sp,3);
 assert.equal(bad.theoreticalBonus.atPreferred.sp,2);
 assert.equal(good.gameVerified,false);
});
t('unknown does not mean outside or zero ability',()=>{
 for(const value of [undefined,'',null,'不明']){
  const a=api.assess('芝2400m',{distance:value});
  assert.equal(a.status,'unknown');assert.equal(a.range,null);
  assert.equal(a.preferredCandidateCount,null);
 }
});
t('mild prioritizes range-covered, then unknown, then known outside',()=>{
 const yes=api.assess('芝2400m','2000～2600');
 const unknown=api.assess('芝2400m','未確認');
 const no=api.assess('芝2400m','1000～1800');
 assert(api.compare(yes,unknown)<0);
 assert(api.compare(unknown,no)<0);
 assert.equal(api.compare(yes,api.assess('芝2400m','1000～3600')),0);
});
t('preferred candidates are possibility counts, not implied probabilities',()=>{
 const broad=api.assess('芝2400m','1000～3600');
 const narrow=api.assess('芝2400m','2000～2600');
 assert(broad.preferredCandidateCount>narrow.preferredCandidateCount);
 assert.equal(api.compare(broad,narrow),0);
 assert(!('probability' in broad));
});
t('known-matching placement rises before search cap despite lower base score',()=>{
 const entries=[
  {slots:{g3:'outside'},score:999,signature:'A'},
  {slots:{g3:'matching'},score:1,signature:'B'},
  {slots:{g3:'missing'},score:100,signature:'C'},
 ];
 const out=api.rankPlacements(entries,'芝2400m',id=>({
  outside:{distance:'1200-1600'},matching:{distance:'2000-2600'},missing:{distance:''}
 })[id]);
 assert.deepEqual(out.map(x=>x.signature),['B','C','A']);
 assert.deepEqual(entries.map(x=>x.signature),['A','B','C']);
});
t('distance is bounded to mild code paths and hard deep comparison is intact',()=>{
 const src=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert(src.includes("const distanceSorted=mode==='mild'&&distanceApi?"));
 assert(src.includes("const distanceOrder=mode==='mild'&&distanceApi?"));
 assert(src.includes("if(mode==='hard'){"));
 assert(src.includes('DabimasGlobalShortlist49?.select(viableAnchorTrials,4'));
 assert(src.includes('plan.mildDistance54'));
 assert(src.includes('至高の一次条件を満たす候補（ゲーム内未確認）'));
 assert(!src.includes('至高成立、予想能力は未確認。')); 
 assert(!src.includes('localStorage.removeItem('));
});
t('source, HTML script and Service Worker cache integrate in correct order',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert(html.includes('research-distance-v54.js?v=54'));
 assert(html.indexOf('research-distance-v54.js?v=54')<html.indexOf('app.js?v=54'));
 assert(sw.includes('dbms-v54-1'));
 assert(sw.includes("'./research-distance-v54.js'"));
 assert(!sw.includes('dbms-v53-1'));
});
console.log(`${passed} v5.4 distance preference tests passed`);
