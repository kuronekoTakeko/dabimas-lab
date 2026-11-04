(()=>{'use strict';
const FACTORS=['短','速','底','長','走','中','強','雷','堅','難','適','丈','早','晩'];
const RAW_URL='https://raw.githubusercontent.com/takana666/DBMSdata_search/main/mydata.csv';
const SAVE_KEY='dabimas_lab_v02_state'; // preserve user data when upgrading from v0.2
const PED_FIELDS=['父','父父','父父父','父父父父','父父母父','父母父','父母父父','父母母父','母父','母父父','母父父父','母父母父','母母父','母母父父','母母母父'];
const SP_LINES=['ハビタット系','ボールドルーラー系','フェアトライアル系','クラリオン系','プリンスビオ系','トムフール系'];
const ST_LINES=['ハイペリオン系','ブレニム系','ネヴァーセイダイ系','プリンスキロ系','モスボロー系','フェアウェイ系'];
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>String(s||'').normalize('NFKC').replace(/[\s　]/g,'').replace(/[－―ｰ]/g,'-');
const key=s=>normalize(s).toLowerCase();
function splitName(display){let v=String(display||'').trim();let m=v.match(/^(.*?)-([^-]+)-$/);if(m)return{name:m[1],variant:m[2]};let m2=v.match(/^(.*?)[-－]([^-－]+)$/);return m2?{name:m2[1],variant:m2[2]}:{name:v,variant:''};}
const ownSeed=Object.fromEntries(SEED.map(s=>[key(s.display_name),{owned:true,rights:s.rights_remaining||0,verified:'screenshot'}]));
let state={owned:ownSeed,added:[],genomes:[],plans:[],mareFavorites:{}};
try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(saved&&saved.owned)state={...state,...saved,owned:{...ownSeed,...saved.owned},plans:Array.isArray(saved.plans)?saved.plans:[]};else{const old=JSON.parse(localStorage.getItem('dabimas_lab_v01'));if(old&&Array.isArray(old.stallions)){for(const s of old.stallions)state.owned[key(s.display_name||`${s.name}-${s.variant}-`)]={owned:true,rights:s.rights_remaining||0,verified:s.verification||'manual'};if(Array.isArray(old.predictions))state.genomes=old.predictions;}}}catch(e){}
if(!Array.isArray(state.plans))state.plans=[];if(!state.mareFavorites||typeof state.mareFavorites!=="object")state.mareFavorites={};
let master=[], map=new Map(),visible=40, currentTab='catalog', loading=false;
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch(e){$('importStatus').textContent='端末に保存できません。空き容量・ブラウザの設定を確認してください。';return false;}}
function toSeed(s){return{id:s.display_name||`${s.name}-${s.variant}-`,name:s.name,variant:s.variant||'',factors:s.factors||[],rights:s.rights_remaining||0,lineage:s.lineage||'',ancestry:[],isSeed:true};}
function buildMap(){map=new Map(master.map(r=>[key(r.id),r]));for(const s of SEED){const k=key(s.display_name);if(map.has(k)){const v=map.get(k);if(!v.factors.length)v.factors=s.factors||[];}else if(!master.length||state.owned[k]?.owned)map.set(k,toSeed(s));}for(const m of state.added||[]){const k=key(m.id||`${m.name}-${m.variant}-`);if(!map.has(k))map.set(k,m);}}
function getRows(){return [...map.values()];}
// Source's published index separates entries by distance field presence; keep as an explicit heuristic.
// Data imported on v0.6 can be recognized without redownloading the master.
function horseSex(r){if(r.isSeed)return 'male';if(r.sex==='male'||r.sex==='female')return r.sex;if(r.distance!==undefined)return String(r.distance).trim()?'male':'female';return 'unknown';}
function maleRows(){return getRows().filter(r=>horseSex(r)!=='female');}
function mareRows(){return getRows().filter(r=>horseSex(r)==='female');}
function isOwned(r){return !!(state.owned[key(r.id)]?.owned);}
function getRights(r){return state.owned[key(r.id)]?.rights??0;}
function chip(x,cls=''){return `<span class="chip ${cls}">${esc(x)}</span>`;}
function updateHeader(){const rows=maleRows();const count=rows.filter(isOwned).length;$('headStats').innerHTML=`<div class="counter"><b>${rows.length}</b>登録種牡馬</div><div class="counter"><b>${count}</b>所持チェック</div><div class="counter"><b>${rows.filter(r=>isOwned(r)&&r.factors.length>=3).length}</b>所持3因子</div><div class="counter"><b>${mareRows().length}</b>公開繁殖牝馬</div>`;
$('masterBanner').innerHTML=master.length?`<div class="line between"><span><b>公開マスター：${master.length}頭</b><br><span class="muted">所持馬と同名・因名を自動照合しています。</span></span><button class="btn ghost small" id="gotoSettings">更新</button></div>`:`<b>マスターは未取込です。</b><p class="muted">現在は前回のスクショ52頭だけを表示しています。公開CSVを読み込めば一覧が増えます。</p><button class="btn" id="gotoSettings">公開マスターを読み込む</button>`;
$('gotoSettings').onclick=()=>switchTab('settings');}
function renderCatalog(){const q=normalize($('search').value).toLowerCase(),fo=$('ownedFilter').value,fc=$('factorFilter').value,so=$('sortFilter').value;let arr=maleRows().filter(r=>{if(fo==='yes'&&!isOwned(r)||fo==='no'&&isOwned(r)||fo==='unmatched'&&!(master.length&&r.isSeed))return false;if(fc!=='all'&&r.factors.length!==Number(fc))return false;return !q||normalize(r.id+' '+r.factors.join(' ')+' '+(r.lineage||'')).toLowerCase().includes(q);});arr.sort((a,b)=>so==='owned'?(Number(isOwned(b))-Number(isOwned(a))||a.id.localeCompare(b.id,'ja')):so==='factor'?b.factors.length-a.factors.length||a.id.localeCompare(b.id,'ja'):a.id.localeCompare(b.id,'ja'));$('catalogCount').textContent=`${arr.length}件中 ${Math.min(visible,arr.length)}件を表示`;const shown=arr.slice(0,visible);$('horseList').innerHTML=shown.length?shown.map(r=>{const owned=isOwned(r);return `<div class="horse"><input type="checkbox" data-owned="${esc(r.id)}" ${owned?'checked':''} aria-label="${esc(r.id)}を所持"><div class="horse-main"><div class="line"><strong>${esc(r.id)}</strong>${owned?chip('所持','owned'):''}${master.length&&r.isSeed?chip('未照合','warn'):''}</div><div class="chips">${r.factors.length?r.factors.map(f=>chip(f)).join(''):chip('因子未登録','nofac')} ${r.lineage?chip(r.lineage):''}</div></div><div class="right" style="text-align:right">${owned?`残${getRights(r)}<br>`:''}<button class="btn ghost small" data-detail="${esc(r.id)}">詳細</button></div></div>`;}).join(''):'<div class="empty">該当する馬がありません。検索条件を変えてください。</div>';$('more').classList.toggle('hidden',arr.length<=visible);}
function showDetail(id){const r=map.get(key(id));if(!r)return;$('dialogTitle').textContent=r.id;let t=`<div class="metrics">${(r.factors||[]).map(f=>chip(f)).join('')}${r.lineage?chip(r.lineage):''}${isOwned(r)?chip('所持','owned'):''}</div>`;
if(isOwned(r))t+=`<div class="line" style="margin:8px 0"><span class="muted">権利数（参考）</span><input type="number" style="width:80px;padding:8px;border-radius:8px;border:1px solid #c6d6ce" min="0" max="9999" value="${getRights(r)}" id="dialogRights"><button class="btn small" id="saveRights">更新</button></div>`;
if(r.ancestry?.length){let lineMap={},fMap={};for(const a of r.ancestry){if(a.line)lineMap[a.line]=(lineMap[a.line]||0)+1;for(const f of (a.factors||[]))fMap[f]=(fMap[f]||0)+1;}
t+=`<p class="muted"><b>登録血統の父系・母系祖先15枠</b>（この種牡馬の血統情報。完成産駒のニトロではありません）</p><div class="metrics">${Object.entries(fMap).sort((a,b)=>b[1]-a[1]).map(([f,n])=>chip(`${f} ×${n}`)).join('')}</div>`;
t+=`<div class="metrics">${Object.entries(lineMap).filter(([l])=>SP_LINES.includes(l)||ST_LINES.includes(l)).map(([l,n])=>chip(`${l}: ${n}`)).join('')}</div>`;
t+='<div style="max-height:270px;overflow:auto"><table class="detailtbl"><thead><tr><th>血統位置</th><th>祖先馬</th><th>因子</th><th>子系統</th></tr></thead><tbody>'+r.ancestry.map(a=>`<tr><td>${esc(a.path)}</td><td>${esc(a.horse)}</td><td>${esc((a.factors||[]).join('・'))}</td><td>${esc(a.line||'')}</td></tr>`).join('')+'</tbody></table></div>';}
else t+='<p class="muted">血統詳細は未登録です。マスターCSV取り込み後に表示できます。</p>';
if(master.length&&r.isSeed){const suggestions=master.filter(x=>normalize(x.name)===normalize(r.name)).sort((a,b)=>{const s=x=>JSON.stringify([...x.factors].sort())===JSON.stringify([...r.factors].sort())?0:1;return s(a)-s(b);}).slice(0,12);
t+=`<div class="notice warn">このスクショ読み取り名は公開マスターと一致していません。誤字の場合は下の候補で照合してください。</div>`;
if(suggestions.length)t+=`<p class="muted">同じ種牡馬名の候補</p>${suggestions.map(x=>`<div class="slot"><span>${esc(x.id)}</span><button class="btn small ghost" data-reconcile="${esc(x.id)}">この馬に移す</button></div>`).join('')}`;
}
if(r.talent)t+=`<p class="muted">非凡：${esc(r.talent)}</p>`;
t+=`<div class="btnrow topgap"><button class="btn small" id="detailToPed">血統分析で見る</button></div>`;$('dialogBody').innerHTML=t;$('horseDialog').showModal();$('detailToPed').onclick=()=>{$('horseDialog').close();$('pedHorse').value=r.id;switchTab('pedigree');renderPedigree();};$('dialogBody').querySelectorAll('[data-reconcile]').forEach(btn=>btn.onclick=()=>{const target=btn.dataset.reconcile;const ok=confirm(`${r.id} の所持チェックを ${target} に移しますか？`);if(!ok)return;state.owned[key(target)]={...state.owned[key(r.id)],owned:true,verified:'user_confirmed'};state.owned[key(r.id)]={...state.owned[key(r.id)],owned:false};persist();buildMap();renderAll();$('horseDialog').close();});
if(isOwned(r))$('saveRights').onclick=()=>{const n=Number($('dialogRights').value);if(!Number.isFinite(n)||n<0){alert('0以上の権利数を入力してください');return;}state.owned[key(r.id)].rights=n;persist();renderCatalog();$('horseDialog').close();};}
function combinations(arr,n){const result=[];function rec(a,j){if(a.length===n){result.push(a);return;}for(let i=j;i<=arr.length-(n-a.length);i++)rec([...a,arr[i]],i+1);}rec([],0);return result;}
function getCandidates(){const groups=new Map();for(const r of maleRows()){if(!isOwned(r)||r.factors.length===0)continue;if($('availableOnly').checked&&getRights(r)<=0)continue;const g=normalize(r.name).toLowerCase();if(!groups.has(g))groups.set(g,[]);groups.get(g).push(r);}const out=[];for(const [base,arr] of groups){if(arr.length<3)continue;const limit=Math.min(4,arr.length);for(let n=3;n<=limit;n++){for(const set of combinations(arr,n)){const ff=set.flatMap(r=>r.factors);const kinds=[...new Set(ff)];if(kinds.length<6)continue;let cnt=Object.fromEntries(FACTORS.map(f=>[f,ff.filter(x=>x===f).length]));const goal=$('goal').value;
// Research heuristic for ranking only. NOT an ability/bonus formula.
const score=goal==='speed'?cnt['短']*5+cnt['速']*3+cnt['走']*2+cnt['中']*1:goal==='stamina'?cnt['長']*5+cnt['中']*3+cnt['底']*2+cnt['走']:cnt['短']*3+cnt['速']*3+cnt['長']*3+cnt['走']*2+cnt['中']*2+cnt['底'];
out.push({base,set,kinds,score,count:cnt});}}}return out.sort((a,b)=>b.score-a.score||b.kinds.length-a.kinds.length||a.set.length-b.set.length).slice(0,40);}
function renderCandidates(){const v=getCandidates();$('candidateSummary').textContent=`因子6種類以上の一次候補：${v.length}組（最多40組表示）。権利数0は既定で除外しません。`; $('candidates').innerHTML=v.length?v.map((c,i)=>`<div class="card"><div class="results-head"><h3>${i+1}. ${esc(c.set[0].name)}</h3><span class="score">${c.kinds.length}種類の因子</span></div><div class="metrics">${c.kinds.map(f=>chip(f)).join('')}</div>${c.set.map((r,j)=>`<div class="slot"><strong>構成候補 ${j+1}</strong><span>${esc(r.id)}　${r.factors.map(f=>chip(f)).join('')}　${chip('権利 '+getRights(r),getRights(r)?'':'warn')}</span></div>`).join('')}<div class="plan-actions"><button class="btn small" data-save-candidate="${i}">この候補を計画に保存</button></div><p class="muted">目的別に因子を重み付けして並び替えています。血統の配合プラン保存後に3×4×5の仮ルートを生成できます。成立の保証、完成産駒のニトロ・子系統補正、SP/ST予想は未実装です。</p></div>`).join(''):'<div class="empty">所持馬の中に、因子6種類が揃う同名種牡馬の組合せはありません。公開CSVを読み込み、所持馬にチェックを追加してください。</div>';}
function genomeRows(){return (state.genomes||[]).map((v,i)=>`<div class="card"><div class="results-head"><b>${esc(v.name||'名称未設定')}</b><span class="muted">${esc(v.at||'')}</span></div><div class="muted">SP ${esc([v.spMin??v.sp0,v.spMid??v.sp1,v.spMax??v.sp2].join(' / '))}　ST ${esc([v.stMin??v.st0,v.stMid??v.st1,v.stMax??v.st2].join(' / '))}</div></div>`).join('')||'<div class="empty">まだ記録がありません。</div>';}
function renderAll(){updateHeader();renderMares();renderCatalog();renderCandidates();renderSavedPlans();renderPedHorseList();$('genomeHistory').innerHTML=genomeRows();}
function switchTab(id){currentTab=id;document.querySelectorAll('.panel').forEach(el=>el.classList.toggle('active',el.id===id));document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===id?'true':'false'));if(id==='catalog')renderCatalog();if(id==='mares')renderMares();if(id==='plans')renderCandidates();if(id==='library')renderSavedPlans();if(id==='pedigree')renderPedigree();window.scrollTo(0,0);}
function parseCSV(txt){if(txt.charCodeAt(0)===0xFEFF)txt=txt.slice(1);let rows=[],row=[],field='',quoted=false;for(let i=0;i<txt.length;i++){const ch=txt[i];if(ch==='"'){if(quoted&&txt[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){row.push(field);field='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&txt[i+1]==='\n')i++;row.push(field);if(row.some(x=>x!==''))rows.push(row);row=[];field='';}else field+=ch;}if(field!==''||row.length){row.push(field);rows.push(row);}return rows;}
function processCSV(txt){const parsed=parseCSV(txt);const hdr=parsed.shift()||[];const ind=s=>hdr.indexOf(s);if(ind('馬名')<0||ind('因子1')<0||ind('chi:父')<0)throw Error('たかな牧場データのCSV形式を確認してください（必要な列がありません）');let rows=[];for(const cols of parsed){const get=s=>String(cols[ind(s)]||'').trim(),id=get('馬名');if(!id)continue;const a=splitName(id),f=['因子1','因子2','因子3'].map(get).filter(Boolean);const ancestry=PED_FIELDS.map(path=>({path,horse:get(path),factors:[get(path+'_因子1'),get(path+'_因子2')].filter(Boolean),line:get('chi:'+path)})).filter(x=>x.horse);rows.push({id,name:a.name,variant:a.variant,display:id,factors:f,lineage:get('子系統'),ancestry,talent:get('非凡'),distance:get('距離'),sex:get('距離')?'male':'female',start:get('成長'),rating:get('実績')});}if(rows.length<100)throw Error('データ件数が少なすぎます。別のCSVを選んでいませんか？');return rows;}
function idb(){return new Promise((res,rej)=>{try{const req=indexedDB.open('dabimas_lab_v02',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('db'))req.result.createObjectStore('db');};req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);}catch(e){rej(e);}});}
async function saveMaster(data){try{const db=await idb();await new Promise((res,rej)=>{const t=db.transaction('db','readwrite');t.objectStore('db').put(data,'master');t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});db.close();return true;}catch(e){return false;}}
async function readMaster(){try{const db=await idb();const v=await new Promise((res,rej)=>{const t=db.transaction('db');const q=t.objectStore('db').get('master');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});db.close();return Array.isArray(v)?v:null;}catch(e){return null;}}
async function setMaster(csv){let data=processCSV(csv);master=data;buildMap();const saved=await saveMaster(data);$('importStatus').textContent=`マスター ${data.length}頭を読み込みました。${saved?'この端末に保存済みです。':'端末への自動保存に失敗したため、再読込が必要です。'}`;renderAll();}
async function loadWeb(){if(loading)return;loading=true;$('loadWebMaster').disabled=true;$('importStatus').textContent='公開CSVを読み込んでいます…';try{const r=await fetch(RAW_URL,{cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status}`);await setMaster(await r.text());}catch(e){$('importStatus').textContent='Web取り込みに失敗しました（通信制限/CORSなど）：'+e.message+'。CSVを保存してファイル選択から読み込む方法も使えます。';}finally{loading=false;$('loadWebMaster').disabled=false;}}
function dl(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function importJSON(obj){if(obj&&Array.isArray(obj.stallions)){for(const s of obj.stallions){const id=s.display_name||`${s.name}-${s.variant}-`,k=key(id);state.owned[k]={owned:s.owned!==false,rights:Number(s.rights_remaining)||0,verified:'import'};if(!map.has(k))state.added.push(toSeed(s));}if(Array.isArray(obj.predictions))state.genomes.push(...obj.predictions);}
else if(obj?.owned&&typeof obj.owned==='object'){state.owned={...state.owned,...obj.owned};if(Array.isArray(obj.added))state.added=obj.added;if(Array.isArray(obj.genomes))state.genomes=obj.genomes;if(Array.isArray(obj.plans))mergePlans(obj.plans);if(obj.mareFavorites&&typeof obj.mareFavorites==='object')state.mareFavorites={...state.mareFavorites,...obj.mareFavorites};}
else if(obj&&Array.isArray(obj.plans)){mergePlans(obj.plans);}else throw Error('所持馬・プランJSONの形式ではありません');buildMap();persist();renderAll();}


// v0.4 pedigree explorer: 15 sire-ancestor slots as published; NO foal stats claims
const BONUS_SPEED=new Set(['ハビタット','ボールドルーラー','フェアトライアル','クラリオン','プリンスビオ','トムフール','エクリプス','ダンテ','オーエンテューダー','インテント','ニアークティック','ネアルコ']);
const BONUS_STAMINA=new Set(['ハイペリオン','ブレニム','ネヴァーセイダイ','プリンスキロ','モスボロー','フェアウェイ','サーゲイロード','オリオール','ナスルーラ','テディ','フォルティノ','ヒムヤー','ニアークティック','ネアルコ']);
const BONUS_MAJOR=new Set(['ノーザンダンサー','ヘイルトゥリーズン','レイズアネイティヴ','ファイントップ','プリンスリーギフト','ブランドフォード','マイバブー']);
const canonicalLine=s=>String(s||'').replace(/系$/,'').replace(/[・\s　]/g,'');
function countItems(items){const c={};for(const v of items){if(v)c[v]=(c[v]||0)+1;}return Object.entries(c).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ja'));}
function renderPedigree(){const name=$('pedHorse')?.value?.trim()||'ディープインパクト-央獅-';const r=map.get(key(name));const target=$('pedReport');if(!target)return;
if(!r){target.innerHTML='<div class="empty">種牡馬名・因名を候補から選択してください。正確なフルネームが必要です。</div>';return;}
if(!r.ancestry?.length){target.innerHTML=`<div class="notice warn"><b>${esc(r.id)}</b>の祖先データはありません。公開CSVの読み込み、または未照合名の修正を行ってください。</div>`;return;}
const factors=countItems(r.ancestry.flatMap(a=>a.factors||[]));const lines=countItems(r.ancestry.map(a=>a.line).filter(Boolean));
const matched=lines.filter(([name])=>{const k=canonicalLine(name);return BONUS_SPEED.has(k)||BONUS_STAMINA.has(k)||BONUS_MAJOR.has(k);});
const bonus=(n)=>{const k=canonicalLine(n);return [BONUS_SPEED.has(k)?'SP候補':'',BONUS_STAMINA.has(k)?'ST候補':'',BONUS_MAJOR.has(k)?'メジャー候補':''].filter(Boolean).join('・')||'未分類';};
let t=`<div class="card"><div class="results-head"><h3>${esc(r.id)}</h3>${chip('血統'+r.ancestry.length+'枠')}</div><div class="metrics">${r.factors.map(f=>chip(f)).join('')}${r.lineage?chip(r.lineage):''}</div><p class="muted">以下は種牡馬の登録血統15枠に限った集計です。本人の3因子と祖先側の因子は別に表示し、完成産駒のニトロとの混同を避けています。</p><h4>登録祖先15枠の因子</h4><div class="metrics">${factors.map(([n,v])=>chip(`${n} ${v}`)).join('')||'祖先因子の登録なし'}</div><h4>子系統と本数</h4><div class="metrics">${lines.map(([n,v])=>chip(`${n} ${v}`)).join('')||'子系統なし'}</div></div>`;
t+=`<div class="card"><h3>能力補正が研究されている子系統</h3>${matched.length?matched.map(([n,v])=>`<div class="slot"><strong>${esc(n)} ×${v}</strong><span>${esc(bonus(n))} ／ 配置位置は下の血統表を参照</span></div>`).join(''):'<p class="muted">現在の研究分類に該当する子系統はありません。</p>'}<p class="muted">「候補」は研究上の傾向です。数値の加算、同系統の複数本分の効果、重複上限は断定しません。</p></div>`;
t+=`<div class="card"><h3>登録血統表（祖先15枠）</h3><div class="pedigree-scroll"><table class="detailtbl"><thead><tr><th>位置</th><th>代</th><th>祖先馬</th><th>因子</th><th>子系統</th></tr></thead><tbody>${r.ancestry.map(a=>`<tr class="${a.factors?.length?'ped-match':''}"><td>${esc(a.path)}</td><td>${[...a.path].length}代</td><td>${esc(a.horse)}</td><td>${esc((a.factors||[]).join('・'))}</td><td>${esc(a.line||'')}</td></tr>`).join('')}</tbody></table></div><p class="muted">親世代から4代祖先までを「父」「母」で示す元データの表記です。母親側を含む最終産駒の完成血統はまだ構築していません。</p></div>`;
target.innerHTML=t;}
function renderPedHorseList(){const list=$('pedHorses');if(!list)return;list.innerHTML=maleRows().filter(r=>r.ancestry?.length).map(r=>`<option value="${esc(r.id)}"></option>`).join('');}

// --- Saved breeding-plan library (v0.4) ---
const PLAN_STATUSES=['構想','準備中','生産中','試走・検証','完了'];
const GOAL_LABELS={balance:'スピード・スタミナ両立',speed:'スピード優先',stamina:'スタミナ優先'};
const nowISO=()=>new Date().toISOString();
const dateJP=v=>{try{return new Date(v).toLocaleString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return '';}};
const uid=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
function defaultSteps(){return[
{uid:uid(),title:'配合成立の確認',cross:'3×4×5の配置・クロス成立を検証（未確定）',sex:'',minSP:'',minST:'',result:'',note:'',done:false},
{uid:uid(),title:'〆種牡馬の準備',cross:'父系で使う配合・性別を決める（未確定）',sex:'牡',minSP:'',minST:'',result:'',note:'',done:false},
{uid:uid(),title:'〆繁殖牝馬の準備',cross:'母系で使う配合・性別を決める（未確定）',sex:'牝',minSP:'',minST:'',result:'',note:'',done:false},
{uid:uid(),title:'最終配合・産駒選別',cross:'成立検証後に最終交配を確定',sex:'不問',minSP:'',minST:'',result:'',note:'',done:false}];}
function newPlan(candidate=null){const created=nowISO(),goal=$('goal').value;const members=candidate?candidate.set.map(r=>({id:r.id,name:r.name,variant:r.variant,factors:[...r.factors],rightsAtSave:getRights(r)})):[];
return{id:uid(),title:candidate?`${candidate.set[0].name} 至高因子候補`:'新しい配合プラン',target:'公式BC（対象レース未設定）',goal:candidate?goal:'balance',status:'構想',note:'',createdAt:created,updatedAt:created,source:{type:candidate?'factor_candidate':'manual',basis:candidate?'同一種牡馬名の因名違いで6種類以上の因子を確認した一次候補':'手動作成',members,factors:candidate?[...candidate.kinds]:[],score:candidate?candidate.score:null,validated:false},steps:defaultSteps()};}
function mergePlans(incoming){if(!Array.isArray(state.plans))state.plans=[];const byId=new Map(state.plans.map(p=>[p.id,p]));for(const p of incoming){if(!p||typeof p!=='object'||typeof p.title!=='string')continue;const clean={...p,id:String(p.id||uid()),steps:Array.isArray(p.steps)?p.steps.slice(0,100):[],source:p.source&&typeof p.source==='object'?p.source:{type:'manual',members:[],factors:[]}};if(byId.has(clean.id)){const old=byId.get(clean.id);if(String(clean.updatedAt||'')>String(old.updatedAt||''))byId.set(clean.id,clean);}else byId.set(clean.id,clean);}state.plans=[...byId.values()];}
let openPlanId=null;
function getPlan(id){return(state.plans||[]).find(p=>p.id===id);}
function renderSavedPlans(){const all=Array.isArray(state.plans)?state.plans:[];const q=normalize($('planSearch')?.value||'').toLowerCase();const sf=$('planStatusFilter')?.value||'all';let arr=[...all].filter(p=>(sf==='all'||p.status===sf)&&(!q||normalize([p.title,p.target,p.note,(p.source?.members||[]).map(m=>m.id).join(' ')].join(' ')).toLowerCase().includes(q)));arr.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));$('savedPlanCount').textContent=`保存済み${all.length}件 ／ 表示${arr.length}件`;
$('savedPlans').innerHTML=arr.length?arr.map(p=>{const n=(p.steps||[]).length,d=(p.steps||[]).filter(s=>s.done).length;return`<div class="card"><div class="plan-head"><div><strong>${esc(p.title)}</strong><div class="muted">${esc(p.target||'対象レース未設定')} ／ ${esc(p.status||'構想')}</div></div>${chip(`${d}/${n}工程`)}</div><p class="muted" style="margin:8px 0">${(p.source?.members||[]).map(m=>esc(m.id)).join('、')||'使用馬は未登録'}</p><div class="muted">更新：${esc(dateJP(p.updatedAt))} ／ ${p.source?.validated?'':'至高成立未検証'}</div><div class="plan-actions"><button class="btn small" data-open-plan="${esc(p.id)}">計画を開く・編集</button><button class="btn ghost small" data-duplicate-plan="${esc(p.id)}">複製</button><button class="btn danger small" data-delete-plan="${esc(p.id)}">削除</button></div></div>`}).join(''):'<div class="empty">保存された配合プランはありません。「至高候補」で候補を保存するか、「新しい計画を作成」を押してください。</div>';
}


// v0.5: Partial pedigree auditor for 3x4x5 route drafts. A verified full-pedigree or game-rule solver is NOT implied.
function kanaPath(p){return String(p||'').replace(/父/g,'S').replace(/母/g,'D');}
function routeSnapshotMember(id,p){return map.get(key(id))||(p.source?.members||[]).find(x=>key(x.id)===key(id))||null;}
function getRouteAudit(p,slots,xId=''){
 const raw=[['g3','SSS'],['g4','DSSS'],['g5','DDDSS']];const known=[],issues=[];
 function addFrom(r,path,label){
  known.push({path,id:r.name||splitName(r.id).name,label,source:'種牡馬マスター',factors:(r.factors||[]).filter(Boolean),line:r.lineage||'',depth:path.length});
  for(const a of r.ancestry||[]){const ap=kanaPath(a.path),dest=path+ap;if(dest.length>5||!a.horse)continue;known.push({path:dest,id:a.horse,label:a.horse,source:label+'の公開血統',factors:a.factors||[],line:a.line||'',depth:dest.length});}
  if(!(r.ancestry||[]).length)issues.push(`${label} は詳細血統が未照合`);
 }
 for(const [g,path] of raw){const id=slots[g],r=routeSnapshotMember(id,p);if(!r){issues.push(`${id||g} はマスターで確認できません`);continue;}addFrom(r,path,id);}
 const xr=xId?(map.get(key(xId))||(key(p.routeDraft?.xSireSnapshot?.id)===key(xId)?p.routeDraft.xSireSnapshot:null)):null;
 if(xId){if(!xr)issues.push(`補助種牡馬X「${xId}」の血統が未照合`);else addFrom(xr,'DDS',xId);}
 const uniq={};for(const x of known){if(uniq[x.path]&&key(uniq[x.path].id)!==key(x.id))issues.push(`${x.path} の祖先が矛盾しています`);else uniq[x.path]=x;}
 const positioned=Object.values(uniq).sort((a,b)=>a.depth-b.depth||a.path.localeCompare(b.path));
 const anchors=raw.map(([g])=>routeSnapshotMember(slots[g],p));const types=new Set(anchors.flatMap(r=>r?.factors||[]));
 const names=new Map();for(const x of positioned){const nm=key(x.id);if(!names.has(nm))names.set(nm,[]);names.get(nm).push(x.path);}
 const extras=[...names.entries()].filter(([nm,paths])=>paths.length>1&&!(anchors.some(a=>key(a?.name||splitName(a?.id||'').name)===nm)))
   .map(([nm,paths])=>({name:positioned.find(x=>key(x.id)===nm)?.id||nm,paths}));
 const counted=countItems(positioned.flatMap(x=>x.factors));const lines=countItems(positioned.map(x=>x.line));
 const fourth=positioned.filter(x=>x.depth===4),fifth=positioned.filter(x=>x.depth===5);
 const eligible=[];for(let depth=1;depth<=5;depth++){for(let j=0;j<2**(depth-1);j++){
  let path='';for(let k=depth-2;k>=0;k--)path+=((j>>k)&1)?'D':'S';eligible.push(path+'S');}}
 return {known:positioned,types:[...types],factorCounts:counted,lineCounts:lines,issues,extraCrosses:extras,
 known4:fourth,known5:fifth,eligible,knownSires:eligible.filter(q=>!!uniq[q]).length,
 sp4:fourth.filter(x=>BONUS_SPEED.has(canonicalLine(x.line))).length,
 st4:fourth.filter(x=>BONUS_STAMINA.has(canonicalLine(x.line))).length,
 sp5:fifth.filter(x=>BONUS_SPEED.has(canonicalLine(x.line))).length,
 st5:fifth.filter(x=>BONUS_STAMINA.has(canonicalLine(x.line))).length};
}
function factorAuditText(a){return a.factorCounts.map(([f,v])=>`${esc(f)} ${v}`).join(' / ')||'未登録';}
function routePermutationSets(p){const m=p.source?.members||[];if(m.length!==3)return [];const x=m.map(r=>r.id);const out=[];for(let i=0;i<3;i++)for(let j=0;j<3;j++){if(i===j)continue;const k=3-i-j;const slots={g3:x[i],g4:x[j],g5:x[k]};out.push({slots,audit:getRouteAudit(p,slots)});}return out;}
function showSireCoverage(a){
 const by=Object.fromEntries(a.known.map(x=>[x.path,x]));
 let html=`<details class="details"><summary>5代血統の種牡馬31枠を表示（未判明枠の確認）</summary><div class="sire-grid">`;
 for(let d=1;d<=5;d++){const paths=a.eligible.filter(x=>x.length===d);html+=`<div class="sire-col"><div class="sire-heading">${d}代目</div>`;
 for(const q of paths){const r=by[q];html+=`<div class="sire-cell ${r?'known':'unknown'}"><small>${q}</small>${r?esc(r.label):'未確認'}</div>`;}html+='</div>';}
 return html+'</div><p class="muted">31枠は5代血統内の種牡馬位置を表します。未確認は必ずしも空白とは限らず、現時点で公開データと仮ルートから特定できない位置です。</p></details>';
}
function renderRouteAudit(p,slots,xId=''){
 const a=getRouteAudit(p,slots,xId);
 let s=`<div class="card"><h3>v0.6｜仮配置の5代血統チェック</h3><p class="muted">3・4・5代の指定種牡馬と、選択中の補助種牡馬X（母母父：DDS）を血統マスターで追跡します。<b>未指定の繁殖牝馬を含む完成血統や公式BC能力予測ではありません。</b></p>
 <div class="audit-metrics"><div class="metric"><strong>${a.types.length}種類</strong><small>至高候補3頭の因子</small></div><div class="metric"><strong>${a.knownSires}/31</strong><small>判明した5代種牡馬枠</small></div><div class="metric"><strong>${a.extraCrosses.length}件</strong><small>追加同名祖先（要確認）</small></div></div>
 <div class="research"><b>判明した祖先の因子</b><div class="metrics">${a.factorCounts.map(([n,v])=>chip(`${n} ×${v}`)).join('')||'未登録'}</div><p class="muted">位置別の参考集計です。ニトロの確定値や能力加算値を表すものではありません。</p><b>4代目の研究対象系統</b><p>SP系 ${a.sp4}枠 ／ ST系 ${a.st4}枠</p><b>5代目の研究対象系統</b><p>SP系 ${a.sp5}枠 ／ ST系 ${a.st5}枠</p><p class="muted">子系統は位置・重複を記録するための表示です。効果やボーナス値は未確定です。</p></div>`;
 if(xId)s+=`<div class="notice"><b>選択中の補助種牡馬X：</b>${esc(xId)}（完成産駒の母母父 DDS）<br>下の候補一覧で「このXをプレビュー」後、「工程7へ反映して保存」を押すと保存されます。</div>`;
 if(a.extraCrosses.length)s+=`<div class="audit-warn"><b>追加で重なった祖先（必ず不成立になるとは限りません）</b><div class="muted">${a.extraCrosses.map(x=>`${esc(x.name)}（${esc(x.paths.join(' / '))}）`).join('、')}</div></div>`;
 if(a.issues.length)s+=`<div class="audit-warn"><b>確認不足</b><div class="muted">${a.issues.map(esc).join(' ／ ')}</div></div>`;
 s+=showSireCoverage(a);
 s+=`<details class="details"><summary>判明分の血統明細を開く（${a.known.length}枠）</summary><div class="audit-table-wrap"><table><thead><tr><th>位置</th><th>代</th><th>名前</th><th>因子</th><th>子系統</th></tr></thead><tbody>${a.known.map(x=>`<tr><td>${esc(x.path)}</td><td>${x.depth}</td><td>${esc(x.label)}</td><td>${esc((x.factors||[]).join('・')||'—')}</td><td>${esc(x.line||'未確認')}</td></tr>`).join('')}</tbody></table></div></details><p class="muted">S＝父、D＝母です。5代内の繁殖牝馬の詳細、全兄弟姉妹条件、配合の成立判定は別途確認が必要です。</p></div>`;
 const sets=routePermutationSets(p);if(sets.length){s+=`<div class="card"><h3>6通りの祖先配置を比較</h3><p class="muted">補助X ${xId?'を含むプレビュー中':'未指定'}。判明した枠数や追加祖先の比較であり、数の多さだけでは最強と判定できません。</p>${sets.map((x,i)=>{const audit=xId?getRouteAudit(p,x.slots,xId):x.audit;return `<div class="compare-mini"><div><b>${esc(splitName(x.slots.g3).variant)} → ${esc(splitName(x.slots.g4).variant)} → ${esc(splitName(x.slots.g5).variant)}</b><div class="muted">3/4/5代 | 判明${audit.knownSires}/31枠 ／ 4代目 SP系${audit.sp4}・ST系${audit.st4} ／ 重複${audit.extraCrosses.length}</div></div><button class="btn small ghost" data-audit-pick="${i}">この配置を選ぶ</button></div>`;}).join('')}</div>`;}
 const needed=(p.steps||[]).filter(x=>!x.minSP||!x.minST).length;
 s+=`<div class="notice warn"><b>生産前チェック</b>：最低SP/ST未設定の工程 <span id="benchMissingCount">${needed}</span>件。最終牝馬の全血統が不明なため、至高成立・ニトロ・子系統ボーナス・産駒SP/STはまだ確定できません。ゲーム内の配合確認・ウマゲノム解析で検証してください。</div>`;
 return s;
}
function lineageInterest(line,goal){const k=canonicalLine(line);const sp=BONUS_SPEED.has(k),st=BONUS_STAMINA.has(k);return goal==='speed'?sp?3:0:goal==='stamina'?st?3:0:(sp?2:0)+(st?2:0);}
function xCandidates(p,slots,scope,query){
 const chosenBase=new Set((p.source?.members||[]).map(r=>key(r.name||splitName(r.id).name)));
 const base=getRouteAudit(p,slots);const baseKeys=new Set(base.known.map(x=>x.path));
 const q=normalize(query).toLowerCase();
 const rows=maleRows().filter(r=>r.ancestry?.length&&!chosenBase.has(key(r.name))&&(scope==='all'||isOwned(r))&&(!q||normalize(r.id+' '+r.lineage+' '+r.factors.join('')).toLowerCase().includes(q)));
 const ranked=rows.map(r=>{
  const audit=getRouteAudit(p,slots,r.id),added=audit.known.filter(x=>!baseKeys.has(x.path));
  const p4=added.filter(x=>x.depth===4),p5=added.filter(x=>x.depth===5);
  const sp=[...p4,...p5].filter(x=>BONUS_SPEED.has(canonicalLine(x.line))).length;
  const st=[...p4,...p5].filter(x=>BONUS_STAMINA.has(canonicalLine(x.line))).length;
  const duplicates=Math.max(0,audit.extraCrosses.length-base.extraCrosses.length);
  // Sorting is only for useful pedigree coverage, not a prediction of in-game ability.
  const lineScore=p.goal==='speed'?sp*2+st:p.goal==='stamina'?st*2+sp:sp+st;
  const rank=added.length*4+lineScore*3+Math.min(3,r.factors.length)-duplicates*5;
  return {r,added:added.length,sp,st,duplicates,rank};
 });
 ranked.sort((a,b)=>b.rank-a.rank||Number(isOwned(b.r))-Number(isOwned(a.r))||a.r.id.localeCompare(b.r.id,'ja'));
 return ranked;
}
function renderXList(p,slots,scope,query,selected){
 const results=xCandidates(p,slots,scope,query),visible=results.slice(0,16);
 return `<p class="x-candidate-count">${results.length}頭が対象 ／ 上位${visible.length}件表示。並び順は<b>確認できる祖先枠数と研究対象系統</b>に基づく暫定順位です。</p>
 ${visible.map(x=>`<div class="x-candidate ${key(selected)===key(x.r.id)?'selected':''}"><div><strong>${esc(x.r.id)}</strong><div class="x-slot-summary">${(x.r.factors||[]).map(v=>chip(v)).join('')}${isOwned(x.r)?chip('所持','owned'):chip('未所持')}</div><div class="muted">${esc(x.r.lineage||'系統未登録')} ／ 確認枠 +${x.added} ／ SP研究系統+${x.sp}・ST研究系統+${x.st}${x.duplicates?' ／ 追加同名祖先'+x.duplicates+'件':''}</div></div><button class="btn small ${key(selected)===key(x.r.id)?'':'ghost'}" data-x-pick="${esc(x.r.id)}">${key(selected)===key(x.r.id)?'選択中':'プレビュー'}</button></div>`).join('')||'<div class="empty">該当する補助種牡馬がありません。範囲や検索条件を変更してください。</div>'}`;
}
function renderSupportCandidates(p,scope,query,selected){
 const isDraft=!!p.routeDraft&&p.steps?.length>=7;
 return `<div class="card"><h3>v0.6｜工程7の補助種牡馬Xを探す</h3><p class="muted">工程7は「X × C2牝 → C3牝」。ここに入れるXは完成産駒の<b>母母父（DDS）</b>に当たります。公開CSVで確認できる血統を比べて、所持馬から候補を探します。繁殖牝馬P1などの自動選定はまだできません。</p>
 <div class="x-pick-controls"><select id="xScope"><option value="owned" ${scope==='owned'?'selected':''}>所持馬だけ</option><option value="all" ${scope==='all'?'selected':''}>全マスター</option></select><input id="xSearch" value="${esc(query)}" placeholder="馬名・因名・子系統・因子で検索" aria-label="補助種牡馬を検索"></div>
 <div id="xCandidateResults"></div>
 <div class="x-preview"><b>選択中のX：</b> ${selected?esc(selected):'未選択'}<p class="muted">選ぶだけなら試算です。保存すると選択した馬名と血統スナップショットを計画に残します。</p>
 <button class="btn" id="xApply" ${selected&&isDraft?'':'disabled'}>工程7へ反映して保存</button> ${!isDraft?'<p class="muted">先に「9工程の仮ルートを別プランとして生成」してから反映できます。</p>':''}<p class="muted" id="xSaveStatus"></p></div>
 </div>`;
}
function applyXtoPlan(p,xId){
 const r=map.get(key(xId));if(!r)return {ok:false,message:'選択したXの公開マスター情報を見つけられません。公開CSVを再読込してください。'};
 if(!p.routeDraft||p.steps?.length<7)return {ok:false,message:'まず9工程の仮ルートを作成してください。'};
 const previous=p.routeDraft.xSire||'';let updated=false;
 const step=p.steps[6];
 if(step&&step.cross?.includes('C2牝')&&step.cross?.includes('C3牝')&&(
    step.cross.includes('種牡馬X（未指定）')||(previous&&step.cross.startsWith(previous+' ×')))){
   step.cross=`${r.id} × C2牝 → C3牝`;updated=true;
 }
 p.routeDraft.xSire=r.id;
 p.routeDraft.xSireSnapshot={id:r.id,name:r.name,variant:r.variant,lineage:r.lineage,factors:r.factors,ancestry:r.ancestry};
 touchPlan(p);
 return {ok:true,message:updated?`保存しました。工程7を「${r.id} × C2牝 → C3牝」に更新しました。`:`Xをプランに保存しました。ただし工程7は手動編集されているため、工程文は上書きしていません。`};
}
function setupRouteAuditPanel(el,p){
 let scope='owned',query='',selected=p.routeDraft?.xSire||'';
 const pane=el.querySelector('#routeAuditor');
 const currentSlots=()=>({g3:el.querySelector('#routeGen3').value,g4:el.querySelector('#routeGen4').value,g5:el.querySelector('#routeGen5').value});
 const renderList=()=>{const results=pane.querySelector('#xCandidateResults');if(!results)return;results.innerHTML=renderXList(p,currentSlots(),scope,query,selected);results.querySelectorAll('[data-x-pick]').forEach(btn=>btn.onclick=()=>{selected=btn.dataset.xPick;render();});};
 const render=()=>{if(!pane)return;const slots=currentSlots();pane.innerHTML=renderRouteAudit(p,slots,selected)+renderSupportCandidates(p,scope,query,selected);
  pane.querySelector('#xScope').onchange=e=>{scope=e.target.value;renderList();};
  pane.querySelector('#xSearch').oninput=e=>{query=e.target.value;renderList();};
  pane.querySelector('#xApply').onclick=()=>{const result=applyXtoPlan(p,selected);const status=pane.querySelector('#xSaveStatus');status.textContent=result.message;if(result.ok){status.style.color='#236147';const stage7=el.querySelector('[data-step-index="6"] [data-step-field="cross"]');if(stage7&&p.steps?.[6])stage7.value=p.steps[6].cross||'';}};
  pane.querySelectorAll('[data-audit-pick]').forEach(btn=>btn.onclick=()=>{const sets=routePermutationSets(p),d=sets[Number(btn.dataset.auditPick)];if(!d)return;for(const g of ['g3','g4','g5'])el.querySelector('#routeGen'+g.slice(1)).value=d.slots[g];render();});
  renderList();
 };
 for(const x of ['routeGen3','routeGen4','routeGen5'])el.querySelector('#'+x).addEventListener('change',render);render();
}
// Route draft: mathematically consistent ANCESTOR PATHS, not a verified breeding recipe
function routeMemberOptions(members,chosen){return members.map(m=>`<option value="${esc(m.id)}" ${m.id===chosen?'selected':''}>${esc(m.id)}</option>`).join('');}
function defaultRouteSlots(members){const by=v=>members.find(m=>m.variant===v)?.id;return {g3:by('翔燕')||members[0]?.id||'',g4:by('央獅')||members[1]?.id||'',g5:by('煌魂')||members[2]?.id||''};}
function renderRoutePanel(p){const m=p.source?.members||[];if(m.length<3)return '';
const draft=p.routeDraft?.slots||defaultRouteSlots(m);
return `<div class="card"><h3>3×4×5 祖先配置から仮ルートを作る</h3><p class="muted">因名違いの3頭を3・4・5代へ配置します。「仮ルートを別プランとして生成」を押すと元の保存プランは残したまま、9工程の新しい計画を作ります。</p><div class="route-grid"><label>3代目（父系 SSS）<select id="routeGen3">${routeMemberOptions(m,draft.g3)}</select></label><label>4代目（母系 DSSS）<select id="routeGen4">${routeMemberOptions(m,draft.g4)}</select></label><label>5代目（母系 DDDSS）<select id="routeGen5">${routeMemberOptions(m,draft.g5)}</select></label></div><div class="research"><b>配置の読み方：</b> Sは父、Dは母。たとえば SSS は「父の父の父」、DSSS は「母の父の父の父」、DDDSS は「母の母の母の父の父」です。交配できる血統の形だけを示した仮設計で、空き枠の親系統、血統重複、近親や特殊配合理論は未判定です。</div>${p.routeDraft?`<div class="notice warn">この計画には仮ルートが含まれています。原案は保存されています。</div>`:''}<button class="btn" id="generateRoute">9工程の仮ルートを別プランとして生成</button><div id="routeAuditor"></div></div>`;
}
function makeStep(title,cross,sex,note){return {uid:uid(),title,cross,sex,minSP:'',minST:'',result:'',note,done:false};}
function buildDraftSteps(slots){const A=slots.g3,B=slots.g4,C=slots.g5;return [
makeStep('① 父系・A1牡の生産',`${A} × 繁殖牝馬P1（未指定） → A1牡`, '牡','Aを最終産駒の3代目・父系 SSS に置くための1代目。SP/STはこの段階では自動指定しない。'),
makeStep('② 最終種牡馬A2の生産',`A1牡 × 繁殖牝馬P2（未指定） → 最終用A2牡`,'牡','最終産駒の SSS にAが位置する想定。未指定牝馬の血統で重複が発生しないか要確認。'),
makeStep('③ 母父ライン・B1牡の生産',`${B} × 繁殖牝馬Q1（未指定） → B1牡`,'牡','Bを最終産駒の4代目 DSSS に置くための1代目。'),
makeStep('④ 母父ライン・B2牡の生産',`B1牡 × 繁殖牝馬Q2（未指定） → B2牡`,'牡','B2は最終繁殖牝馬の父候補。'),
makeStep('⑤ 母母ライン・C1牡の生産',`${C} × 繁殖牝馬R1（未指定） → C1牡`,'牡','Cを最終産駒の5代目 DDDSS に置くための1代目。'),
makeStep('⑥ 母母ライン・C2牝の生産',`C1牡 × 繁殖牝馬R2（未指定） → C2牝`,'牝','C2に父系SSとしてCが入る。'),
makeStep('⑦ 母母ライン・C3牝の生産',`種牡馬X（未指定） × C2牝 → C3牝`,'牝','C3の母方DSSにCが入る。Xの血統と能力を要選定。'),
makeStep('⑧ 最終繁殖牝馬Mの生産',`B2牡 × C3牝 → 最終用M牝`,'牝','Mは父方SSSにB、母方DDSSにCが入る想定。能力厳選ラインはゲノム解析等で設定。'),
makeStep('⑨ 至高を狙う最終配合',`A2牡 × M牝 → 公式BC向け最終産駒`,'不問','Aが3代、Bが4代、Cが5代となる仮設計。ゲーム内で配合理論が成立することを必ず確認。SP/STの数値予測は未計算。')
];}
function createDraftRoute(p,slots){const all=[slots.g3,slots.g4,slots.g5];if(new Set(all).size!==3){alert('3代・4代・5代には、異なる因名の3頭を選んでください。');return;}
const members=p.source?.members||[],chosen=all.map(id=>members.find(m=>m.id===id));if(chosen.some(x=>!x)){alert('選択候補に登録されていない種牡馬が含まれます。');return;}
const n=new Set(chosen.flatMap(m=>m.factors||[]));if(n.size<6){alert('選んだ3頭では因子が6種類に満たないため、この3頭だけの至高候補ルートは生成できません。');return;}
const copy=JSON.parse(JSON.stringify(p));copy.id=uid();copy.title=p.title.replace('（仮ルート）','')+'（仮ルート）';copy.createdAt=nowISO();copy.updatedAt=copy.createdAt;copy.status='構想';copy.routeDraft={slots,paths:{g3:'SSS',g4:'DSSS',g5:'DDDSS'},validated:false};copy.steps=buildDraftSteps(slots);copy.note=(p.note?p.note+'\n':'')+'【v0.4による仮ルート】至高成立、他祖先の被り、実際のニトロ・子系統、SP/STは未検証。各工程の親馬P1等は未指定。';state.plans.unshift(copy);persist();renderSavedPlans();showPlanEditor(copy.id);}

function showPlanEditor(id){const p=getPlan(id);if(!p)return;openPlanId=id;const members=p.source?.members||[];const el=$('planEditor');el.classList.remove('hidden');$('savedPlans').classList.add('hidden');el.innerHTML=`<div class="card"><div class="plan-head"><h3 style="margin:0">配合プランの編集</h3><button class="btn grey small" id="closePlanEditor">一覧へ戻る</button></div><p class="muted">入力を変更すると端末に自動保存します。新しい検索をしても、この計画はそのまま残ります。</p>
<div class="plan-fields"><label class="wide"><span class="plan-label">計画名</span><input class="plan-input" data-plan-field="title" value="${esc(p.title)}" maxlength="160"></label><label class="wide"><span class="plan-label">目標レース・距離</span><input class="plan-input" data-plan-field="target" value="${esc(p.target||'')}" maxlength="160"></label><label><span class="plan-label">育成方針</span><select class="plan-input" data-plan-field="goal">${Object.entries(GOAL_LABELS).map(([k,v])=>`<option value="${k}" ${p.goal===k?'selected':''}>${v}</option>`).join('')}</select></label><label><span class="plan-label">進捗</span><select class="plan-input" data-plan-field="status">${PLAN_STATUSES.map(s=>`<option ${p.status===s?'selected':''}>${s}</option>`).join('')}</select></label><label class="wide"><span class="plan-label">全体メモ</span><textarea class="plan-textarea" data-plan-field="note">${esc(p.note||'')}</textarea></label></div>
<h4 style="margin:18px 0 6px">保存時の候補データ（スナップショット）</h4><div class="muted">${esc(p.source?.basis||'手動登録')} ／ ${p.source?.validated?'成立確認済':'因子の一次候補。至高・奇跡の成立未確認'}</div><div class="metrics">${(p.source?.factors||[]).map(f=>chip(f)).join('')}</div>${members.length?members.map(m=>`<div class="slot"><strong>${esc(m.id)}</strong><span>${(m.factors||[]).map(f=>chip(f)).join('')} 権利数（保存時）${esc(m.rightsAtSave??'-')}</span></div>`).join(''):'<p class="muted">候補から保存すると種牡馬と因子が記録されます。</p>'}</div>
${renderRoutePanel(p)}<div id="pairMateEditor"></div><h3 class="heading">工程と最低許容能力</h3><div class="notice warn">SP/ST欄は、配合設計後に決める合格基準です。現在のアプリは自動計算できないため、未設定欄に架空の数値を入れません。実測・ゲノム解析結果をメモして検証できます。</div><div id="planStepEditor">${(p.steps||[]).map((s,i)=>renderPlanStep(s,i,(p.steps||[]).length)).join('')}</div>
<div class="btnrow"><button class="btn ghost" id="addPlanStep">＋ 工程を追加</button><button class="btn" id="savePlanNow">保存を確認</button></div><p class="muted" id="planSaveStatus">最終保存：${esc(dateJP(p.updatedAt))}</p>`;
el.querySelector('#closePlanEditor').onclick=closeEditor;if(el.querySelector('#routeAuditor'))setupRouteAuditPanel(el,p);setupPairEditor(el,p);const gen=el.querySelector('#generateRoute');if(gen)gen.onclick=()=>createDraftRoute(p,{g3:el.querySelector('#routeGen3').value,g4:el.querySelector('#routeGen4').value,g5:el.querySelector('#routeGen5').value});
el.querySelector('#addPlanStep').onclick=()=>{p.steps.push({uid:uid(),title:`工程${p.steps.length+1}`,cross:'',sex:'',minSP:'',minST:'',result:'',note:'',done:false});touchPlan(p);showPlanEditor(p.id);};
el.querySelector('#savePlanNow').onclick=()=>{touchPlan(p);alert('配合プランを保存しました。');};
el.scrollIntoView({behavior:'instant',block:'start'});
}
function renderPlanStep(s,i,len){return`<div class="plan-box" data-step-index="${i}"><div class="plan-head"><h4>工程 ${i+1}</h4><div class="btnrow"><button class="btn grey small" data-move-step="up" ${i===0?'disabled':''}>↑</button><button class="btn grey small" data-move-step="down" ${i===len-1?'disabled':''}>↓</button><button class="btn danger small" data-remove-step="1">削除</button></div></div><div class="plan-fields">
<label class="wide"><span class="plan-label">工程名</span><input class="plan-input" data-step-field="title" value="${esc(s.title||'')}" maxlength="120"></label><label class="wide"><span class="plan-label">使用種牡馬・繁殖牝馬／作業内容</span><textarea class="plan-textarea" data-step-field="cross">${esc(s.cross||'')}</textarea></label>
<label><span class="plan-label">必要な性別</span><select class="plan-input" data-step-field="sex">${['','牡','牝','不問'].map(x=>`<option value="${x}" ${s.sex===x?'selected':''}>${x||'未設定'}</option>`).join('')}</select></label><label><span class="plan-label">工程の状態</span><select class="plan-input" data-step-field="done"><option value="false" ${!s.done?'selected':''}>未完了</option><option value="true" ${s.done?'selected':''}>完了</option></select></label>
<label><span class="plan-label">最低許容 SP（数値またはランク）</span><input class="plan-input" data-step-field="minSP" placeholder="未設定" value="${esc(s.minSP||'')}" maxlength="30"></label><label><span class="plan-label">最低許容 ST（数値またはランク）</span><input class="plan-input" data-step-field="minST" placeholder="未設定" value="${esc(s.minST||'')}" maxlength="30"></label>
<label class="wide"><span class="plan-label">実測・馬体解析結果</span><input class="plan-input" data-step-field="result" value="${esc(s.result||'')}" placeholder="例：SP B／ST C、採用" maxlength="250"></label><label class="wide"><span class="plan-label">工程メモ</span><textarea class="plan-textarea" data-step-field="note">${esc(s.note||'')}</textarea></label></div></div>`;}
function touchPlan(p){p.updatedAt=nowISO();const ok=persist();renderSavedPlans();const status=$('planSaveStatus');if(status)status.textContent=ok?'保存済み：'+dateJP(p.updatedAt):'保存に失敗しました。データ管理からバックアップを確認してください。';}
function closeEditor(){openPlanId=null;$('planEditor').classList.add('hidden');$('planEditor').innerHTML='';$('savedPlans').classList.remove('hidden');renderSavedPlans();}
$('candidates').addEventListener('click',e=>{const btn=e.target.closest('[data-save-candidate]');if(!btn)return;const c=getCandidates()[Number(btn.dataset.saveCandidate)];if(!c)return;const p=newPlan(c);state.plans.unshift(p);persist();switchTab('library');showPlanEditor(p.id);});
$('createPlan').onclick=()=>{const p=newPlan();state.plans.unshift(p);persist();renderSavedPlans();showPlanEditor(p.id);};
$('planSearch').oninput=renderSavedPlans;$('planStatusFilter').onchange=renderSavedPlans;
$('savedPlans').addEventListener('click',e=>{const open=e.target.closest('[data-open-plan]'),dup=e.target.closest('[data-duplicate-plan]'),del=e.target.closest('[data-delete-plan]');if(open){showPlanEditor(open.dataset.openPlan);return;}if(dup){const p=getPlan(dup.dataset.duplicatePlan);if(!p)return;const c=JSON.parse(JSON.stringify(p));c.id=uid();c.title+='（コピー）';c.createdAt=nowISO();c.updatedAt=c.createdAt;state.plans.unshift(c);persist();renderSavedPlans();return;}if(del){const p=getPlan(del.dataset.deletePlan);if(!p)return;if(!confirm('「'+p.title+'」を削除しますか？ この操作は元に戻せません。'))return;state.plans=state.plans.filter(x=>x.id!==p.id);persist();renderSavedPlans();}});
$('planEditor').addEventListener('input',e=>{const p=getPlan(openPlanId);if(!p)return;const v=e.target;const f=v.dataset.planField;if(f){p[f]=v.value;touchPlan(p);return;}const sf=v.dataset.stepField;if(sf){const i=Number(v.closest('[data-step-index]')?.dataset.stepIndex);if(p.steps[i]){p.steps[i][sf]=sf==='done'?v.value==='true':v.value;touchPlan(p);const missing=$('benchMissingCount');if(missing)missing.textContent=String(p.steps.filter(x=>!x.minSP||!x.minST).length);}}});
$('planEditor').addEventListener('change',e=>{if(e.target.matches('select[data-plan-field],select[data-step-field]'))e.target.dispatchEvent(new Event('input',{bubbles:true}));});
$('planEditor').addEventListener('click',e=>{const p=getPlan(openPlanId);if(!p)return;const step=e.target.closest('[data-step-index]'),i=Number(step?.dataset.stepIndex),mv=e.target.closest('[data-move-step]'),rm=e.target.closest('[data-remove-step]');if(!Number.isInteger(i)||!p.steps[i])return;if(rm){if(!confirm('この工程を削除しますか？'))return;p.steps.splice(i,1);touchPlan(p);showPlanEditor(p.id);}else if(mv){const k=i+(mv.dataset.moveStep==='up'?-1:1);if(k<0||k>=p.steps.length)return;[p.steps[i],p.steps[k]]=[p.steps[k],p.steps[i]];touchPlan(p);showPlanEditor(p.id);}});
$('exportPlans').onclick=()=>dl('dabimas_saved_plans_v07.json',{version:7,plans:state.plans});


// v0.7: Broodmare search and verified-by-source, direct sire x broodmare 5-generation display.
// 'Favorites' means research candidates, NOT verified owned mares.
let mareLimit=35;
function renderMares(){const panel=$('mareList');if(!panel)return;
 const q=key($('mareQuery').value),filter=$('mareFilter').value;
 let rows=mareRows().filter(r=>(filter!=='saved'||state.mareFavorites[key(r.id)])&&(!q||key(r.id+' '+r.lineage).includes(q)));
 rows.sort((a,b)=>Number(!!state.mareFavorites[key(b.id)])-Number(!!state.mareFavorites[key(a.id)])||a.id.localeCompare(b.id,'ja'));
 $('mareCount').textContent=`繁殖牝馬：${rows.length}頭中 ${Math.min(mareLimit,rows.length)}頭表示（距離欄なしの公開データ）`;
 panel.innerHTML=rows.slice(0,mareLimit).map(r=>`<div class="mare-list-item"><div><strong>${esc(r.id)}</strong> ${state.mareFavorites[key(r.id)]?chip('研究候補に登録','owned'):''}<div class="muted">${esc(r.lineage||'子系統未登録')} ／ 祖先 ${r.ancestry?.length||0}枠</div></div><div class="mare-actions"><button class="btn small ghost" data-mare-detail="${esc(r.id)}">血統</button><button class="btn small ${state.mareFavorites[key(r.id)]?'grey':'ghost'}" data-mare-fav="${esc(r.id)}">${state.mareFavorites[key(r.id)]?'候補から外す':'候補に追加'}</button></div></div>`).join('')||'<div class="empty">該当する繁殖牝馬はありません。公開CSVの取り込みを確認してください。</div>';
 $('mareMore').disabled=rows.length<=mareLimit;
}
function mareDetail(id){const r=map.get(key(id));if(!r||horseSex(r)!=='female')return;
 $('marePreview').innerHTML=`<h3>${esc(r.id)}</h3><p class="muted">${esc(r.lineage||'子系統不明')} ／ 公開祖先 ${r.ancestry?.length||0}/15枠。繁殖牝馬の所持状況は確認していません。</p><div class="audit-table-wrap"><table><thead><tr><th>位置</th><th>祖先馬</th><th>因子</th><th>子系統</th></tr></thead><tbody>${(r.ancestry||[]).map(a=>`<tr><td>${esc(a.path)}</td><td>${esc(a.horse)}</td><td>${esc((a.factors||[]).join('・')||'—')}</td><td>${esc(a.line||'未登録')}</td></tr>`).join('')}</tbody></table></div><p class="muted">この血統を配合計算に使うには、「保存プラン」の直接配合チェックで牝馬名を選択してください。</p>`;
 $('marePreview').scrollIntoView({block:'nearest'});
}
function getPairParents(p){const x=p.pairCheck||{}; const sire=(x.sireId&&map.get(key(x.sireId)))||(x.sireSnapshot?.id?x.sireSnapshot:null);const mare=(x.mareId&&map.get(key(x.mareId)))||(x.mareSnapshot?.id?x.mareSnapshot:null);return {sire,mare};}
function getFoalPedigree(sire,mare){
 // 1 sire root + 15 male ancestors of each selected parent -> all 31 possible sire positions.
 const at=new Map(),conflicts=[];
 function add(path,name,factors=[],line='',source=''){
  if(!path||path.length>5||!name)return;
  if(at.has(path)&&key(at.get(path).name)!==key(name)){conflicts.push(`${path}: ${at.get(path).name} と ${name}`);return;}
  at.set(path,{path,name,factors:(factors||[]).filter(Boolean),line:line||'',source});
 }
 if(sire){add('S',sire.name||splitName(sire.id).name,sire.factors,sire.lineage,sire.id);for(const a of sire.ancestry||[])add('S'+kanaPath(a.path),a.horse,a.factors,a.line,sire.id);}
 if(mare){for(const a of mare.ancestry||[])add('D'+kanaPath(a.path),a.horse,a.factors,a.line,mare.id);}
 const all=[];for(let d=1;d<=5;d++){const n=2**(d-1);for(let j=0;j<n;j++){let p='';for(let k=d-2;k>=0;k--)p+=j>>k&1?'D':'S';all.push(p+'S');}}
 const rows=all.map(path=>at.get(path)||{path,name:'',factors:[],line:''}),known=rows.filter(x=>x.name);
 const byName=new Map();for(const a of known){const k=key(a.name);if(!byName.has(k))byName.set(k,[]);byName.get(k).push(a);}
 const repeats=[...byName.values()].filter(x=>x.length>1).map(x=>({name:x[0].name,paths:x.map(a=>a.path)}));
 const triple=[...byName.values()].filter(x=>[3,4,5].every(d=>x.some(a=>a.path.length===d))).map(x=>x[0].name);
 const factorCounts=countItems(known.flatMap(x=>x.factors));const lineCounts=countItems(known.map(x=>x.line));
 return {rows,known:known.length,repeats,triple,factorCounts,lineCounts,conflicts};
}
function renderPairReport(sire,mare){const a=getFoalPedigree(sire,mare);
 return `<div class="pair-coverage"><div class="stat"><b>${a.known}/31</b><small>種牡馬位置の判明数</small></div><div class="stat"><b>${a.repeats.length}</b><small>同名祖先の重複</small></div><div class="stat"><b>${a.triple.length}</b><small>3・4・5代に同名祖先</small></div></div>
 <div class="notice ${a.known<31?'warn':''}">${a.known<31?'一部の祖先が未判明です。':'祖先31枠の名前が確認できました。'} ${a.triple.length?`同名の3×4×5候補：${a.triple.map(esc).join('・')}。ただし因名6種類・兄弟姉妹条件・至高成立は未検証です。`:'同名祖先の3×4×5が、この選択ペアの判明分には見つかっていません。'} <b>能力値・勝率を計算したものではありません。</b></div>
 <b>判明分の因子（祖先位置別）</b><div class="metrics">${a.factorCounts.map(([k,v])=>chip(`${k} ×${v}`)).join('')||'未登録'}</div>
 <b>子系統（確認できた数）</b><div class="metrics">${a.lineCounts.slice(0,30).map(([k,v])=>chip(`${k} ×${v}`)).join('')||'未登録'}</div>
 ${a.repeats.length?`<details class="details"><summary>同名祖先のクロス一覧（${a.repeats.length}件）</summary>${a.repeats.map(x=>`<div class="pair-list-row"><b>${esc(x.name)}</b><span>${esc(x.paths.join(' / '))}</span></div>`).join('')}</details>`:''}
 ${a.conflicts.length?`<div class="notice warn">血統の矛盾：${a.conflicts.map(esc).join('、')}</div>`:''}
 <details class="details"><summary>産駒の5代血統31枠を表示</summary><div class="audit-table-wrap"><table><thead><tr><th>位置</th><th>代</th><th>祖先馬</th><th>因子</th><th>子系統</th></tr></thead><tbody>${a.rows.map(x=>`<tr><td>${x.path}</td><td>${x.path.length}</td><td>${esc(x.name||'未確認')}</td><td>${esc((x.factors||[]).join('・')||'—')}</td><td>${esc(x.line||'—')}</td></tr>`).join('')}</tbody></table></div></details>
 <p class="muted">これは選択した公開種牡馬と繁殖牝馬の<strong>直接配合</strong>の検査です。仮ルートの最終自家製種牡馬・繁殖牝馬の代替ではありません。また因子の数はそのままニトロやSP/ST補正にはなりません。</p>`;
}
function renderPairEditor(p){const x=p.pairCheck||{}, saved=x.sireId&&x.mareId;
 const sireRows=maleRows().filter(r=>r.ancestry?.length),mRows=mareRows().filter(r=>r.ancestry?.length);
 return `<div class="card"><h3>v0.7｜繁殖牝馬と種牡馬の直接配合チェック</h3><p class="muted">種牡馬＋繁殖牝馬の公開血統を結合し、産駒の5代血統31枠を照合。<b>これは現在の9工程とは別の検証メモ</b>としてプランに保存できます。</p>
 <div class="pair-input-row"><label>父（種牡馬・因名）<input class="plan-input" id="pairSire" list="pairSireList" value="${esc(x.sireId||'')}" placeholder="例：ディープインパクト-央獅-" autocomplete="off"></label><label>母（繁殖牝馬）<input class="plan-input" id="pairMare" list="pairMareList" value="${esc(x.mareId||'')}" placeholder="繁殖牝馬名を入力" autocomplete="off"></label></div>
 <datalist id="pairSireList">${sireRows.map(r=>`<option value="${esc(r.id)}"></option>`).join('')}</datalist><datalist id="pairMareList">${mRows.map(r=>`<option value="${esc(r.id)}"></option>`).join('')}</datalist>
 <div class="btnrow"><button class="btn small ghost" id="pairPreview">5代血統を照合</button><button class="btn small" id="pairSave">この組み合わせをプランに保存</button>${saved?'<button class="btn small grey" id="pairClear">検証ペアを解除</button>':''}</div>
 <p class="muted" id="pairStatus">${saved?`保存済み：${esc(x.sireId)} × ${esc(x.mareId)}`:'保存済みの検証ペアはありません。'}</p>
 <div id="pairReport"></div></div>`;
}
function setupPairEditor(el,p){let report=el.querySelector('#pairMateEditor');if(!report)return;
 report.innerHTML=renderPairEditor(p);
 const resolve=()=>{const sid=report.querySelector('#pairSire').value.trim(),mid=report.querySelector('#pairMare').value.trim();const sire=map.get(key(sid))||(p.pairCheck?.sireSnapshot?.id===sid?p.pairCheck.sireSnapshot:null),mare=map.get(key(mid))||(p.pairCheck?.mareSnapshot?.id===mid?p.pairCheck.mareSnapshot:null);
 if(!sire||horseSex(sire)==='female')return {error:'父に、公開マスターに登録された種牡馬を指定してください。'};
 if(!mare||horseSex(mare)==='male')return {error:'母に、公開マスターに登録された繁殖牝馬を指定してください。'};
 if(!sire.ancestry?.length||!mare.ancestry?.length)return {error:'父か母の血統が未収録です。公開CSVを読み込んでください。'};
 return {sire,mare};};
 const preview=()=>{const pair=resolve();if(pair.error){report.querySelector('#pairStatus').textContent=pair.error;return null;}report.querySelector('#pairReport').innerHTML=renderPairReport(pair.sire,pair.mare);report.querySelector('#pairStatus').textContent='直接配合の確認結果です（まだ保存していません）。';return pair;};
 report.querySelector('#pairPreview').onclick=preview;
 report.querySelector('#pairSave').onclick=()=>{const pair=resolve();if(pair.error){report.querySelector('#pairStatus').textContent=pair.error;return;}p.pairCheck={sireId:pair.sire.id,mareId:pair.mare.id,sireSnapshot:{...pair.sire},mareSnapshot:{...pair.mare},updatedAt:nowISO()};touchPlan(p);report.querySelector('#pairReport').innerHTML=renderPairReport(pair.sire,pair.mare);report.querySelector('#pairStatus').textContent=`保存しました：${pair.sire.id} × ${pair.mare.id}。検索を変えても残ります。`;};
 const clear=report.querySelector('#pairClear');if(clear)clear.onclick=()=>{if(!confirm('保存している直接配合チェックの組み合わせを解除しますか？（工程は消えません）'))return;delete p.pairCheck;touchPlan(p);report.innerHTML=renderPairEditor(p);setupPairEditor(el,p);};
 if(p.pairCheck){const pair=getPairParents(p);if(pair.sire&&pair.mare)report.querySelector('#pairReport').innerHTML=renderPairReport(pair.sire,pair.mare);}
}

// wiring
for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>switchTab(b.dataset.tab));
for(const el of ['search','ownedFilter','factorFilter','sortFilter'])$(el).addEventListener(el==='search'?'input':'change',()=>{visible=40;renderCatalog();});$('more').onclick=()=>{visible+=40;renderCatalog();};
$('horseList').onclick=e=>{const el=e.target.closest('button[data-detail]');if(el)showDetail(el.dataset.detail);};
$('horseList').onchange=e=>{const el=e.target.closest('input[data-owned]');if(!el)return;const k=key(el.dataset.owned);state.owned[k]={...state.owned[k],owned:el.checked,rights:state.owned[k]?.rights||0};persist();renderAll();};
$('closeDialog').onclick=()=>$('horseDialog').close();
$('goal').onchange=renderCandidates;$('availableOnly').onchange=renderCandidates;
$('mareQuery').oninput=()=>{mareLimit=35;renderMares();};
$('mareFilter').onchange=()=>{mareLimit=35;renderMares();};
$('mareMore').onclick=()=>{mareLimit+=35;renderMares();};
$('mareList').onclick=e=>{const fav=e.target.closest('[data-mare-fav]'),detail=e.target.closest('[data-mare-detail]');if(fav){const id=fav.dataset.mareFav,k=key(id);if(state.mareFavorites[k])delete state.mareFavorites[k];else state.mareFavorites[k]=true;persist();renderMares();}else if(detail)mareDetail(detail.dataset.mareDetail);};
$('pedAnalyze').onclick=renderPedigree;$('pedHorse').onkeydown=e=>{if(e.key==='Enter')renderPedigree();};$('pedDeep').onclick=()=>{$('pedHorse').value='ディープインパクト-央獅-';renderPedigree();};$('loadWebMaster').onclick=loadWeb;$('masterCsv').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{await setMaster(await file.text());}catch(err){$('importStatus').textContent='CSV取込エラー: '+err.message;}e.target.value='';};
$('exportInventory').onclick=()=>dl('dabimas_full_backup_v07.json',{version:7,owned:state.owned,added:state.added,genomes:state.genomes,plans:state.plans,mareFavorites:state.mareFavorites});
$('importInventory').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{importJSON(JSON.parse(await file.text()));alert('所持馬・保存プランを読み込みました。');}catch(err){alert('JSON取込失敗：'+err.message);}e.target.value='';};
$('resetOwned').onclick=()=>{if(!confirm('所持チェックを初期52頭の状態に戻しますか？'))return;state.owned=structuredClone(ownSeed);persist();renderAll();};
$('saveGenome').onclick=()=>{const vals=['sp0','sp1','sp2','st0','st1','st2'].map(k=>$(k).value.trim());if(vals.some(v=>v===''||!Number.isFinite(Number(v))||Number(v)<0)){alert('SP/STの最小・中央・最大を入力してください。');return;}const a=vals.map(Number);if(a[0]>a[1]||a[1]>a[2]||a[3]>a[4]||a[4]>a[5]){alert('最小 ≦ 中央 ≦ 最大の順序で入力してください。');return;}state.genomes.unshift({name:$('predName').value.trim(),sp0:a[0],sp1:a[1],sp2:a[2],st0:a[3],st1:a[4],st2:a[5],at:new Date().toLocaleDateString('ja-JP')});persist();$('genomeHistory').innerHTML=genomeRows();alert('ゲーム内解析値を保存しました。');};
$('clearGenome').onclick=()=>['sp0','sp1','sp2','st0','st1','st2'].forEach(k=>$(k).value='');
async function init(){buildMap();renderAll();const loaded=await readMaster();if(loaded){master=loaded;buildMap();renderAll();$('importStatus').textContent=`保存済みの公開マスター ${loaded.length}頭を復元しました。`;}if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});}
init();})();