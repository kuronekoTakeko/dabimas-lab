#!/usr/bin/env node
/* Read-only. Example: node tools/audit-pedigree-txt-v49.js pedigree1.txt pedigree2.txt */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const auditor=require('../research-txt-review-v49.js');
if(process.argv.length<3){console.error('使い方: node tools/audit-pedigree-txt-v49.js 血統1.txt [血統2.txt ...]');process.exitCode=2;}
for(const arg of process.argv.slice(2)){
 try{
  const result=auditor.review(fs.readFileSync(arg,'utf8'));
  console.log(JSON.stringify({file:path.basename(arg),...result},null,2));
  if(result.problems.length)process.exitCode=1;
 }catch(e){console.error(`${arg}: ${e.message}`);process.exitCode=1;}
}
