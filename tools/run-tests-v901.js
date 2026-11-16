#!/usr/bin/env node
'use strict';
// Self-contained offline test runner. Optional real saved JSON is never copied.
// Usage: node tools/run-tests-v901.js ["/path/to/315-owned.json"]
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
const arg=process.argv[2];let temp=null,fixture;
if(arg){fixture=path.resolve(arg);if(!fs.existsSync(fixture)){console.error('JSON not found:',fixture);process.exit(2)}console.log('Ownership source: user-supplied local JSON (read only).')}
else{temp=fs.mkdtempSync(path.join(os.tmpdir(),'dabimas-v901-'));
 fixture=path.join(temp,'synthetic-315.json');
 const owned=Object.fromEntries(Array.from({length:315},(_,i)=>['synthetic-'+i,{owned:true,rights:i===0?0:1}]));
 fs.writeFileSync(fixture,JSON.stringify({version:13,owned,plans:[],added:[],homebreds:[],genomes:[],mareFavorites:{},mareGrades:{}}));
 console.log('Ownership source: SYNTHETIC 315-record fixture; not proof of user inventory.');
}
let failed=0,checks=0;
try{
 const files=fs.readdirSync(path.join(root,'tests')).filter(x=>x.endsWith('.test.js')).sort();
 for(const file of files){checks++;
  const x=cp.spawnSync(process.execPath,[path.join(root,'tests',file),fixture],{encoding:'utf8',timeout:45000,maxBuffer:8*1024*1024});
  if(x.status===0){console.log('PASS',file);continue;}
  failed++;console.error('FAIL',file, 'code=',x.status,'signal=',x.signal||'-');console.error((x.stderr||x.stdout||'').slice(-2500));
 }
 console.log(`Result: ${checks-failed}/${checks} files passed; ${failed} failed.`);
}finally{if(temp)fs.rmSync(temp,{recursive:true,force:true});}
process.exitCode=failed?1:0;
