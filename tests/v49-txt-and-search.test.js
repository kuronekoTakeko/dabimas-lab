'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const placements = require('../research-placement-v49.js');
const shortlist = require('../research-global-shortlist-v49.js');
const reviewer = require('../research-txt-review-v49.js');
const root = path.join(__dirname,'..');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS',name);}
const trio=['中心-Ａ-','中心-Ｂ-','中心2012'];
test('v4.9 evaluates exactly six unique placements without modifying owned ids',()=>{
 const old=JSON.stringify(trio),items=placements.all(trio);
 assert.equal(items.length,6);assert.equal(new Set(items.map(placements.signature)).size,6);
 assert.equal(JSON.stringify(trio),old);assert.equal(placements.all([trio[0],trio[0],trio[2]]).length,0);
});
test('placement score rewards documented 4th and 5th-generation lineage, not just permutations',()=>{
 const strong=placements.score({knownSires:12,sp4:3,st4:1,sp5:2,st5:1,issues:[]},'speed');
 const weak=placements.score({knownSires:12,sp4:0,st4:2,sp5:1,st5:0,issues:[]},'speed');
 assert(strong>weak);
});
test('bounded placement shortlist retains original layout',()=>{
 const baseline={g3:trio[0],g4:trio[1],g5:trio[2]};
 const ordered=placements.rank(trio,s=>({sp4:s.g3===trio[0]?0:10,knownSires:31}),'speed');
 assert.equal(placements.pick(ordered,2,baseline).length,2);
 assert(placements.pick(ordered,2,baseline).some(x=>x.signature===placements.signature(baseline)));
});
const trial=(group,slots,score)=>({anchor:{set:group.map(id=>({id}))},draft:{routeDraft:{slots}},ranked:[{candidate:{idx:score}}]});
const compare=(a,b)=>b.candidate.idx-a.candidate.idx;
test('finalist selection covers distinct center triples and distinct layouts',()=>{
 const t1=trial(['A','B','C'],{g3:'A',g4:'B',g5:'C'},10);
 const t2=trial(['A','B','C'],{g3:'B',g4:'A',g5:'C'},9);
 const t3=trial(['D','E','F'],{g3:'D',g4:'E',g5:'F'},8);
 const chosen=shortlist.select([t1,t2,t3],3,compare);
 assert.equal(chosen.length,3);
 assert.equal(chosen[1].trial,t3);
 assert.equal(chosen[2].trial,t2);
});
test('31-slot tree has 31 unique legal sire paths',()=>{
 const paths=reviewer.expectedPaths();assert.equal(paths.length,31);assert.equal(new Set(paths).size,31);
 assert(paths.includes('SSS')&&paths.includes('DSSS')&&paths.includes('DDDSS'));
});
function fixture(){
 const parent=reviewer.expectedPaths().map((p,i)=>({path:p,horse:'馬'+i,variant:'未確認',factors:'未確認',line:'ヘイルトゥリーズン系'}));
 parent.find(x=>x.path==='SS').horse='ディープインパクト';
 parent.find(x=>x.path==='SS').variant='翔燕';
 parent.find(x=>x.path==='SS').factors='走・長・速';
 const dam=reviewer.expectedPaths().map((p,i)=>({path:p,horse:'母系'+i,variant:'未確認',factors:'未確認',line:'ヘイルトゥリーズン系'}));
 dam.find(x=>x.path==='SSS').horse='ディープインパクト';dam.find(x=>x.path==='SSS').variant='央獅';dam.find(x=>x.path==='SSS').factors='中・速・短';
 dam.find(x=>x.path==='DDSS').horse='ディープインパクト';dam.find(x=>x.path==='DDSS').variant='煌魂';dam.find(x=>x.path==='DDSS').factors='長・底・底';
 const foal=reviewer.expectedPaths().map(p=>{
  if(p==='S')return {path:p,horse:'仮種牡馬',variant:'未確認',factors:'未確認',line:'ヘイルトゥリーズン系'};
  if(p[0]==='S')return {...parent.find(x=>x.path===p.slice(1)),path:p};
  return {...dam.find(x=>x.path===p.slice(1)),path:p};
 });
 const render=(label,rs)=>`【${label}：テスト】 31/31枠\n位置\t馬名\t異因名\t因子\t子系統\t出典\n${rs.map(r=>[r.path,r.horse,r.variant,r.factors,r.line,'fixture'].join('\t')).join('\n')}`;
 return `計画：unit\n至高指定：g3=ディープインパクト-翔燕- / g4=ディープインパクト-央獅- / g5=ディープインパクト-煌魂-\n${render('種',parent)}\n${render('肌',dam)}\n${render('最終産駒',foal)}\n`;
}
test('internal TXT validates 3x4x5, six factor kinds and 30 inherited positions',()=>{
 const r=reviewer.review(fixture());assert.equal(r.problems.length,0);
 assert.equal(r.inheritance.comparedAncestorPositions,30);
 assert.equal(r.inheritance.mismatches.length,0);
 assert(r.theoryPremise.sameName&&r.theoryPremise.variantsDistinct&&r.theoryPremise.sixKinds);
 assert.equal(r.theoryPremise.gameVerified,false);
});
test('changing a factor in final foal creates an explicit inheritance mismatch',()=>{
 const changed=fixture().replace('ディープインパクト\t央獅\t中・速・短\tヘイルトゥリーズン系\tfixture\n', 'ディープインパクト\t央獅\t中・速・堅\tヘイルトゥリーズン系\tfixture\n');
 const r=reviewer.review(changed);
 assert(r.inheritance.mismatches.length>=1);
});
test('invalid/missing 31-slot TXT is NOT labeled consistent',()=>{
 const r=reviewer.review(fixture().replace('SSS\t','SSSx\t'));
 assert(r.problems.length>=1);
});
test('new assessment is never marked game-proven, preserves main persisted data format',()=>{
 const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert(js.includes('DabimasPlacement49'));
 assert(js.includes('DabimasGlobalShortlist49?.select(viableAnchorTrials,4'));
 assert(js.includes('gameVerified:false'));
 assert(js.includes('state.homebreds=oldHomebreds'));
 assert(html.includes('research-placement-v49.js?v=49'));
 assert(sw.includes('dbms-v49-1'));
});
test('all source modules have valid JavaScript syntax',()=>{
 for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.js')))cp.execFileSync('node',['--check',path.join(root,f)]);
});
console.log(`${passed} v4.9 tests passed`);
