const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const api=require('../research-production-guard.js');let passed=0;
function t(name,fn){fn();passed++;console.log('PASS '+name);}
const paths=[];for(let n=1;n<=5;n++)for(let m=0;m<2**(n-1);m++){let p='';for(let j=n-2;j>=0;j--)p+=m&(1<<j)?'D':'S';paths.push(p+'S');}
const pedigree=()=>paths.map(p=>({path:p,horse:'Ancestor '+p}));
function fixture(){const prep={id:'P1',name:'Prep',planId:'PLAN',fatherId:'SIRE',motherId:'MARE',sex:'female',ancestry:pedigree()};const records=[prep];const outputs={};for(let n=1;n<=9;n++){const id='STEP'+n;outputs[n]=id;records.push({id,planId:'PLAN',stepNo:n,sex:n===6||n===7||n===8?'female':'male',fatherId:n===1?'SIRE':n===2?'STEP1':n===3?'SIRE':n===4?'STEP3':n===5?'SIRE':n===6?'STEP5':n===7?'SIRE':n===8?'STEP4':'STEP2',motherId:n===1?'P1':n===7?'STEP6':n===8?'STEP7':n===9?'STEP8':'MARE',ancestry:pedigree()});}return {plan:{id:'PLAN',hard23:{preparations:[{order:1,foal:'P1',father:'SIRE',mother:'MARE'}]},chain09:{outputs}},records};}
t('31 path fixtures',()=>assert.equal(new Set(paths).size,31));
t('valid graph accepted',()=>{const {plan,records}=fixture();assert.equal(api.verify(plan,records).ok,true);});
t('no mutation',()=>{const {plan,records}=fixture(),snapshot=JSON.stringify([plan,records]);api.verify(plan,records);assert.equal(JSON.stringify([plan,records]),snapshot);});
t('missing step blocked',()=>{const {plan,records}=fixture();records.pop();assert.equal(api.verify(plan,records).ok,false);});
t('unknown father blocked',()=>{const {plan,records}=fixture();records[2].fatherId='';assert.equal(api.verify(plan,records).ok,false);});
t('forward reference blocked',()=>{const {plan,records}=fixture();records[1].fatherId='STEP9';assert.equal(api.verify(plan,records).ok,false);});
t('self parent blocked',()=>{const {plan,records}=fixture();records[1].fatherId='STEP1';assert.equal(api.verify(plan,records).ok,false);});
t('duplicate id blocked',()=>{const {plan,records}=fixture();records[3].id=records[2].id;assert.equal(api.verify(plan,records).ok,false);});
t('existing id collision blocked',()=>{const {plan,records}=fixture();assert.equal(api.verify(plan,records,[{id:'P1'}]).ok,false);});
t('missing ancestor blocked',()=>{const {plan,records}=fixture();records[1].ancestry.pop();assert.equal(api.verify(plan,records).ok,false);});
t('duplicate ancestor path blocked',()=>{const {plan,records}=fixture();records[2].ancestry[0].path=records[2].ancestry[1].path;assert.equal(api.verify(plan,records).ok,false);});
t('invalid ancestor path blocked',()=>{const {plan,records}=fixture();records[2].ancestry[0].path='DDDDD';assert.equal(api.verify(plan,records).ok,false);});
t('wrong plan ownership blocked',()=>{const {plan,records}=fixture();records[4].planId='WRONG';assert.equal(api.verify(plan,records).ok,false);});
t('broken preparation linkage blocked',()=>{const {plan,records}=fixture();plan.hard23.preparations[0].mother='WRONG';assert.equal(api.verify(plan,records).ok,false);});
t('missing preparation blocked',()=>{const {plan,records}=fixture();plan.hard23.preparations=[];assert.equal(api.verify(plan,records).ok,false);});
t('integration and cache',()=>{const src=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8'),html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');assert(src.indexOf('DabimasProductionGuard42?.verify')>0);assert(src.indexOf('DabimasProductionGuard42?.verify')<src.indexOf('state.plans.unshift(copy);state.homebreds.push(...records)'));assert(html.indexOf('research-production-guard.js?v=42')<html.indexOf('app.js?v=55'));assert(sw.includes('research-production-guard.js'));});
console.log(passed+' v4.2 tests passed');
