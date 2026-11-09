'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
const events={},url='https://example.invalid/research-mild-lineage-v52.js';
const store=new Map([[url,'CACHED-LINEAGE'],['https://example.invalid/app.js','CACHED-APP'],['https://example.invalid/index.html','CACHED-INDEX']]);
const calls=[];
const caches={open:async name=>({addAll:async paths=>{},put:async (req,r)=>{store.set(req.url,r);}}),
 match:async (req,opts)=>{calls.push([req.url,opts?.ignoreSearch]);return store.get(req.url)||((opts?.ignoreSearch)?store.get(req.url.split('?')[0]):undefined);},
 keys:async()=>[],delete:async()=>true};
const self={location:{origin:'https://example.invalid'},skipWaiting(){},clients:{claim:async()=>{}},addEventListener(name,fn){events[name]=fn;}};
const context={URL,Promise,Error,self,caches,fetch:async req=>{throw Error('offline');}};
vm.createContext(context);vm.runInContext(source,context);
async function request(u){let result;const ev={request:{url:u},respondWith(p){result=p;}};events.fetch(ev);assert(result,'should intercept same-origin request');return await result;}
(async()=>{
 assert.equal(await request(url+'?v=52'),'CACHED-LINEAGE');console.log('PASS versioned new module offline cache hit');
 assert.equal(await request('https://example.invalid/app.js?v=53'),'CACHED-APP');console.log('PASS versioned app offline cache hit');
 assert.equal(await request('https://example.invalid/index.html'),'CACHED-INDEX');console.log('PASS versioned index offline fallback');
 assert(calls.some(x=>x[0].includes('v=52')&&x[1]===true));console.log('PASS ignoreSearch is explicit for versioned static assets');
 assert.equal(source.includes('dbms-v53-1'),true);console.log('PASS distinct v5.2 cache name');
})().catch(e=>{console.error(e);process.exitCode=1});
