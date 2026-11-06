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
// Historic user-editable mare rank reference (Gamerch, updated 2016-12-11).
// This is a partial historical list, NOT the current complete 2026 in-game master.
// Rows not listed are '未確認', not '名牝以外'.
const RANK12_SOURCE="https://dabimasu.gamerch.com/繁殖牝馬親系統一覧";
const RANK12_MEIHIN=new Set(["アンフェアデッキ", "トランピアス", "コンディションアイ", "ハイベロシティ", "リュミエールレイン", "マリアミラージュ", "ピュアセレモニー", "アルバトール", "ウオッカ", "エアグルーヴ", "エリンバード", "エンブレイスマイン", "キャタリナ", "キャピタリスト", "グランチャント", "グレイスプレスト", "シームレスラウンド", "シュガーハート", "シンハライト", "シーザリオ", "スカーレットブーケ", "スロープクラウン", "タニノシスター", "スウィートダウニー", "テイクトゥハート", "トエルフェスカ", "トーンスタイル", "ドリームフルール", "ノースリアルト", "ハルスコール", "ハープスター", "ハーベストムーン", "ヒストリックスター", "フォローアンジュ", "ブラックエンブレム", "ブランモンド", "ベガ", "ベルクリート", "マリアライト", "ミココノチカラ", "ミッキークイーン", "メジャーエンブレム", "メジロフランシス", "ルインズリープ", "レイアンタレス", "プリーストライン", "ファルダーサイン", "ブエナビスタ", "シアンフェリア", "サフメルディ", "ソルベントステージ", "ネイジュシエル", "ビビッドカラー", "ビワハイジ", "ヴィブロス", "ハルーワスウィート", "ハリウッドドリーム", "ベイルバリケイド", "マジェスティレイ", "ラフオーシャン", "ラルジュメール", "ヴィルシーナ"].map(key));
const RANK12_CHOICES=['未確認','名牝','優','良','可','無印','限定牝馬'];
function mareRank12(r){
 const id=key(r?.id||r),name=key(r?.name||r?.id||r);
 const override=state.mareGrades?.[id];
 if(override&&RANK12_CHOICES.includes(override))return {value:override,source:'端末で登録'};
 if(RANK12_MEIHIN.has(name)||RANK12_MEIHIN.has(id))return {value:'名牝',source:'過去の公開リスト'};
 return {value:'未確認',source:'未登録'};
}
const ownSeed=Object.fromEntries(SEED.map(s=>[key(s.display_name),{owned:true,rights:s.rights_remaining||0,verified:'screenshot'}]));
let state={owned:ownSeed,added:[],genomes:[],plans:[],mareFavorites:{},mareGrades:{},homebreds:[]};
try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY));if(saved&&saved.owned)state={...state,...saved,owned:{...ownSeed,...saved.owned},plans:Array.isArray(saved.plans)?saved.plans:[]};else{const old=JSON.parse(localStorage.getItem('dabimas_lab_v01'));if(old&&Array.isArray(old.stallions)){for(const s of old.stallions)state.owned[key(s.display_name||`${s.name}-${s.variant}-`)]={owned:true,rights:s.rights_remaining||0,verified:s.verification||'manual'};if(Array.isArray(old.predictions))state.genomes=old.predictions;}}}catch(e){}
if(!Array.isArray(state.plans))state.plans=[];if(!Array.isArray(state.homebreds))state.homebreds=[];if(!state.mareFavorites||typeof state.mareFavorites!=="object")state.mareFavorites={};if(!state.mareGrades||typeof state.mareGrades!=="object")state.mareGrades={};
let master=[], map=new Map(),visible=40, currentTab='auto21', loading=false;
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
function renderCatalog(){const q=normalize($('search').value).toLowerCase(),fo=$('ownedFilter').value,fc=$('factorFilter').value,so=$('sortFilter').value;let arr=maleRows().filter(r=>{if(fo==='yes'&&!isOwned(r)||fo==='no'&&isOwned(r)||fo==='unmatched'&&!(master.length&&r.isSeed))return false;if(fc!=='all'&&r.factors.length!==Number(fc))return false;return !q||normalize(r.id+' '+r.factors.join(' ')+' '+(r.lineage||'')).toLowerCase().includes(q);});arr.sort((a,b)=>so==='owned'?(Number(isOwned(b))-Number(isOwned(a))||a.id.localeCompare(b.id,'ja')):so==='factor'?b.factors.length-a.factors.length||a.id.localeCompare(b.id,'ja'):a.id.localeCompare(b.id,'ja'));$('catalogCount').textContent=`${arr.length}件中 ${Math.min(visible,arr.length)}件を表示`;const shown=arr.slice(0,visible);$('horseList').innerHTML=shown.length?shown.map(r=>{const owned=isOwned(r);return `<div class="horse"><input type="checkbox" data-owned="${esc(r.id)}" ${owned?'checked':''} aria-label="${esc(r.id)}を所持"><div class="horse-main"><div class="line"><strong>${esc(r.id)}</strong>${owned?chip('所持','owned'):''}${master.length&&r.isSeed?chip('未照合','warn'):''}</div><div class="chips">${r.factors.length?r.factors.map(f=>chip(f)).join(''):chip('因子未登録','nofac')} ${r.lineage?chip(r.lineage):''}</div></div><div class="right" style="text-align:right"><button class="btn ghost small" data-detail="${esc(r.id)}">詳細</button></div></div>`;}).join(''):'<div class="empty">該当する馬がありません。検索条件を変えてください。</div>';$('more').classList.toggle('hidden',arr.length<=visible);}
function showDetail(id){const r=map.get(key(id));if(!r)return;$('dialogTitle').textContent=r.id;let t=`<div class="metrics">${(r.factors||[]).map(f=>chip(f)).join('')}${r.lineage?chip(r.lineage):''}${isOwned(r)?chip('所持','owned'):''}</div>`;
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
}
function combinations(arr,n){const result=[];function rec(a,j){if(a.length===n){result.push(a);return;}for(let i=j;i<=arr.length-(n-a.length);i++)rec([...a,arr[i]],i+1);}rec([],0);return result;}
function getCandidates(){const groups=new Map();for(const r of maleRows()){if(!isOwned(r)||r.factors.length===0)continue;const g=normalize(r.name).toLowerCase();if(!groups.has(g))groups.set(g,[]);groups.get(g).push(r);}const out=[];for(const [base,arr] of groups){if(arr.length<3)continue;const limit=Math.min(4,arr.length);for(let n=3;n<=limit;n++){for(const set of combinations(arr,n)){const ff=set.flatMap(r=>r.factors);const kinds=[...new Set(ff)];if(kinds.length<6)continue;let cnt=Object.fromEntries(FACTORS.map(f=>[f,ff.filter(x=>x===f).length]));const goal=$('goal').value;
// Research heuristic for ranking only. NOT an ability/bonus formula.
const score=goal==='speed'?cnt['短']*5+cnt['速']*3+cnt['走']*2+cnt['中']*1:goal==='stamina'?cnt['長']*5+cnt['中']*3+cnt['底']*2+cnt['走']:cnt['短']*3+cnt['速']*3+cnt['長']*3+cnt['走']*2+cnt['中']*2+cnt['底'];
out.push({base,set,kinds,score,count:cnt});}}}return out.sort((a,b)=>b.score-a.score||b.kinds.length-a.kinds.length||a.set.length-b.set.length).slice(0,40);}
function renderCandidates(){const v=getCandidates();$('candidateSummary').textContent=`因子6種類以上の一次候補：${v.length}組（最多40組表示）。取得済みなら権利数0でも含みます。`; $('candidates').innerHTML=v.length?v.map((c,i)=>`<div class="card"><div class="results-head"><h3>${i+1}. ${esc(c.set[0].name)}</h3><span class="score">${c.kinds.length}種類の因子</span></div><div class="metrics">${c.kinds.map(f=>chip(f)).join('')}</div>${c.set.map((r,j)=>`<div class="slot"><strong>構成候補 ${j+1}</strong><span>${esc(r.id)}　${r.factors.map(f=>chip(f)).join('')}　${chip('取得済み','owned')}</span></div>`).join('')}<div class="plan-actions"><button class="btn small" data-save-candidate="${i}">この候補を計画に保存</button></div><p class="muted">目的別に因子を重み付けして並び替えています。血統の配合プラン保存後に3×4×5の仮ルートを生成できます。成立の保証、完成産駒のニトロ・子系統補正、SP/ST予想は未実装です。</p></div>`).join(''):'<div class="empty">所持馬の中に、因子6種類が揃う同名種牡馬の組合せはありません。公開CSVを読み込み、所持馬にチェックを追加してください。</div>';}
function genomeRows(){return (state.genomes||[]).map((v,i)=>`<div class="card"><div class="results-head"><b>${esc(v.name||'名称未設定')}</b><span class="muted">${esc(v.at||'')}</span></div><div class="muted">SP ${esc([v.spMin??v.sp0,v.spMid??v.sp1,v.spMax??v.sp2].join(' / '))}　ST ${esc([v.stMin??v.st0,v.stMid??v.st1,v.stMax??v.st2].join(' / '))}</div></div>`).join('')||'<div class="empty">まだ記録がありません。</div>';}
function renderAll(){auto21RefreshCandidates();renderBCExplorer14();updateHeader();renderMares();renderHomebreds();renderCatalog();renderCandidates();renderSavedPlans();renderPedHorseList();$('genomeHistory').innerHTML=genomeRows();}
function switchTab(id){currentTab=id;document.querySelectorAll('.panel').forEach(el=>el.classList.toggle('active',el.id===id));document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',b.dataset.tab===id?'true':'false'));if(id==='catalog')renderCatalog();if(id==='mares')renderMares();if(id==='homebreds')renderHomebreds();if(id==='plans')renderCandidates();if(id==='library')renderSavedPlans();if(id==='pedigree')renderPedigree();if(id==='bc14')renderBCExplorer14();window.scrollTo(0,0);}
function parseCSV(txt){if(txt.charCodeAt(0)===0xFEFF)txt=txt.slice(1);let rows=[],row=[],field='',quoted=false;for(let i=0;i<txt.length;i++){const ch=txt[i];if(ch==='"'){if(quoted&&txt[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){row.push(field);field='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&txt[i+1]==='\n')i++;row.push(field);if(row.some(x=>x!==''))rows.push(row);row=[];field='';}else field+=ch;}if(field!==''||row.length){row.push(field);rows.push(row);}return rows;}
function processCSV(txt){const parsed=parseCSV(txt);const hdr=parsed.shift()||[];const ind=s=>hdr.indexOf(s);if(ind('馬名')<0||ind('因子1')<0||ind('chi:父')<0)throw Error('たかな牧場データのCSV形式を確認してください（必要な列がありません）');let rows=[];for(const cols of parsed){const get=s=>String(cols[ind(s)]||'').trim(),id=get('馬名');if(!id)continue;const a=splitName(id),f=['因子1','因子2','因子3'].map(get).filter(Boolean);const ancestry=PED_FIELDS.map(path=>({path,horse:get(path),factors:[1,2,3].filter(n=>ind(path+'_因子'+n)>=0).map(n=>get(path+'_因子'+n)).filter(Boolean),line:get('chi:'+path)})).filter(x=>x.horse);rows.push({id,name:a.name,variant:a.variant,display:id,factors:f,lineage:get('子系統'),ancestry,talent:get('非凡'),distance:get('距離'),sex:get('距離')?'male':'female',start:get('成長'),rating:get('実績')});}if(rows.length<100)throw Error('データ件数が少なすぎます。別のCSVを選んでいませんか？');return rows;}
function idb(){return new Promise((res,rej)=>{try{const req=indexedDB.open('dabimas_lab_v02',1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('db'))req.result.createObjectStore('db');};req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);}catch(e){rej(e);}});}
async function saveMaster(data){try{const db=await idb();await new Promise((res,rej)=>{const t=db.transaction('db','readwrite');t.objectStore('db').put(data,'master');t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});db.close();return true;}catch(e){return false;}}
async function readMaster(){try{const db=await idb();const v=await new Promise((res,rej)=>{const t=db.transaction('db');const q=t.objectStore('db').get('master');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});db.close();return Array.isArray(v)?v:null;}catch(e){return null;}}
async function setMaster(csv){let data=processCSV(csv);master=data;buildMap();const saved=await saveMaster(data);$('importStatus').textContent=`マスター ${data.length}頭を読み込みました。${saved?'この端末に保存済みです。':'端末への自動保存に失敗したため、再読込が必要です。'}`;renderAll();}
async function loadWeb(){if(loading)return;loading=true;$('loadWebMaster').disabled=true;$('importStatus').textContent='公開CSVを読み込んでいます…';try{const r=await fetch(RAW_URL,{cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status}`);await setMaster(await r.text());}catch(e){$('importStatus').textContent='Web取り込みに失敗しました（通信制限/CORSなど）：'+e.message+'。CSVを保存してファイル選択から読み込む方法も使えます。';}finally{loading=false;$('loadWebMaster').disabled=false;}}
function dl(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function importJSON(obj){if(obj&&Array.isArray(obj.stallions)){for(const s of obj.stallions){const id=s.display_name||`${s.name}-${s.variant}-`,k=key(id);state.owned[k]={owned:s.owned!==false,rights:Number(s.rights_remaining)||0,verified:'import'};if(!map.has(k))state.added.push(toSeed(s));}if(Array.isArray(obj.predictions))state.genomes.push(...obj.predictions);}
else if(obj?.owned&&typeof obj.owned==='object'){state.owned={...state.owned,...obj.owned};if(Array.isArray(obj.added))state.added=obj.added;if(Array.isArray(obj.genomes))state.genomes=obj.genomes;if(Array.isArray(obj.plans))mergePlans(obj.plans);if(obj.mareFavorites&&typeof obj.mareFavorites==='object')state.mareFavorites={...state.mareFavorites,...obj.mareFavorites};if(obj.mareGrades&&typeof obj.mareGrades==='object')state.mareGrades={...state.mareGrades,...obj.mareGrades};if(Array.isArray(obj.homebreds))mergeHomebreds(obj.homebreds);}
else if(obj&&Array.isArray(obj.plans)){mergePlans(obj.plans);if(Array.isArray(obj.homebreds))mergeHomebreds(obj.homebreds);}else throw Error('所持馬・プランJSONの形式ではありません');buildMap();persist();renderAll();}


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
function newPlan(candidate=null){const created=nowISO(),goal=$('goal').value;const members=candidate?candidate.set.map(r=>({id:r.id,name:r.name,variant:r.variant,factors:[...r.factors],ownershipAtSave:true})):[];
return{id:uid(),title:candidate?`${candidate.set[0].name} 至高因子候補`:'新しい配合プラン',target:'公式BC（対象レース未設定）',goal:candidate?goal:'balance',status:'構想',note:'',createdAt:created,updatedAt:created,source:{type:candidate?'factor_candidate':'manual',basis:candidate?'同一種牡馬名の因名違いで6種類以上の因子を確認した一次候補':'手動作成',members,factors:candidate?[...candidate.kinds]:[],score:candidate?candidate.score:null,validated:false},steps:defaultSteps()};}
function mergePlans(incoming){if(!Array.isArray(state.plans))state.plans=[];const byId=new Map(state.plans.map(p=>[p.id,p]));for(const p of incoming){if(!p||typeof p!=='object'||typeof p.title!=='string')continue;const clean={...p,id:String(p.id||uid()),steps:Array.isArray(p.steps)?p.steps.slice(0,100):[],source:p.source&&typeof p.source==='object'?p.source:{type:'manual',members:[],factors:[]}};if(byId.has(clean.id)){const old=byId.get(clean.id);if(String(clean.updatedAt||'')>String(old.updatedAt||''))byId.set(clean.id,clean);}else byId.set(clean.id,clean);}state.plans=[...byId.values()];}
let openPlanId=null;
function getPlan(id){return(state.plans||[]).find(p=>p.id===id);}
// v2.3 saved preparation DAG editor: keep the 9 core steps in their legacy
// array indices for chain09; expose new preliminary matings separately.
function renderHard23Panel(p){
 if(!p.hard23)return '';
 const h=p.hard23,items=h.preparations||[],linked=chain09Summary(p).linked;
 const entries=items.map((r,i)=>`<div class="plan-box" data-h23-index="${i}">
  <h4>準備工程 ${i+1}｜${esc(r.label)}牝の仕込み</h4>
  <p class="muted"><b>${esc(r.father)} × ${esc(r.mother)} → ${esc(r.foal)}</b></p>
  <p class="muted">必要な性別：牝 ／ 産駒の祖先位置：${esc(r.path)} ／ 基本工程${r.targetStep}へ接続</p>
  <div class="plan-fields"><label>工程状態<select class="plan-input" data-h23-field="done"><option value="false" ${!r.done?'selected':''}>未完了</option><option value="true" ${r.done?'selected':''}>完了</option></select></label>
  <label>最低SP（解析後に記入）<input class="plan-input" data-h23-field="minSP" value="${esc(r.minSP||'')}" placeholder="未設定"></label>
  <label>最低ST（解析後に記入）<input class="plan-input" data-h23-field="minST" value="${esc(r.minST||'')}" placeholder="未設定"></label>
  <label>生産・ゲノム結果<input class="plan-input" data-h23-field="result" value="${esc(r.result||'')}" placeholder="ゲーム内解析のみ"></label>
  <label class="wide">工程メモ<textarea class="plan-textarea" data-h23-field="note">${esc(r.note||'')}</textarea></label></div></div>`).join('');
 return `<section class="card"><h3>v2.3｜可変${h.stages}工程の生産フロー</h3>
  <p class="muted">最初に以下の仕込み${items.length}工程を上から実施し、その後に既存の通常9工程を順に実施します。仕込み牝馬は未生産の仮馬です。<b>保存済みの産駒リンクは自動的に実馬扱いしません。</b></p>
  <p class="muted">研究用評価${esc(h.metrics?.score??'未計算')}／独立クロス候補${esc(h.independentCount||0)}組／判明クロス因子${esc(h.crossFactors||0)}個。${h.searchLimited?'探索上限に到達。':''}ゲーム内成立・SP/ST・ニトロは未確認。</p>
  ${entries||'<p class="muted">追加仕込みはありません。通常9工程だけの採用案です。</p>'}
  <div class="notice warn">${linked<9?`基本9工程の仮馬連結が現在${linked}/9件です。親の変更により血統が更新されている場合は再確認してください。`:'基本9工程は仮馬として連結されています。'}
  工程が増えても血統5代の枠に残らない場合は追加していません。数値の採用基準はウマゲノム等の結果から入力してください。</div></section>`;
}
function renderSavedPlans(){const all=Array.isArray(state.plans)?state.plans:[];const q=normalize($('planSearch')?.value||'').toLowerCase();const sf=$('planStatusFilter')?.value||'all';let arr=[...all].filter(p=>(sf==='all'||p.status===sf)&&(!q||normalize([p.title,p.target,p.note,(p.source?.members||[]).map(m=>m.id).join(' ')].join(' ')).toLowerCase().includes(q)));arr.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));$('savedPlanCount').textContent=`保存済み${all.length}件 ／ 表示${arr.length}件`;
$('savedPlans').innerHTML=arr.length?arr.map(p=>{const extra=p.hard23?.preparations||p.prep17?.steps||[],n=(p.steps||[]).length+extra.length,d=(p.steps||[]).filter(s=>s.done).length+extra.filter(s=>s.done).length;return`<div class="card"><div class="plan-head"><div><strong>${esc(p.title)}</strong><div class="muted">${esc(p.target||'対象レース未設定')} ／ ${esc(p.status||'構想')}</div></div>${chip(`${d}/${n}工程`)}</div><p class="muted" style="margin:8px 0">${(p.source?.members||[]).map(m=>esc(m.id)).join('、')||'使用馬は未登録'}</p><div class="muted">更新：${esc(dateJP(p.updatedAt))} ／ ${p.source?.validated?'':'至高成立未検証'}</div><div class="plan-actions"><button class="btn small" data-open-plan="${esc(p.id)}">計画を開く・編集</button><button class="btn ghost small" data-duplicate-plan="${esc(p.id)}">複製</button><button class="btn danger small" data-delete-plan="${esc(p.id)}">削除</button></div></div>`}).join(''):'<div class="empty">保存された配合プランはありません。「至高候補」で候補を保存するか、「新しい計画を作成」を押してください。</div>';
 renderCompare12();
}


// v1.5: Distinguish raw repeated sire ancestors from independent paternal/maternal crosses.
// A shared ancestor nested wholly beneath an already shared, closer ancestor is not counted twice.
// This is a pedigree-based research classification, not a definitive engine for in-game cross effects.
function classifyIndependentCross15(positions){
 const grouped=new Map();
 for(const r of positions||[]){
  const path=String(r.path||''),name=r.name||'';
  if(!name||!path||!['S','D'].includes(path[0]))continue;
  const k=key(name);if(!grouped.has(k))grouped.set(k,{name,paths:[]});
  if(!grouped.get(k).paths.includes(path))grouped.get(k).paths.push(path);
 }
 const repeated=[...grouped.values()].filter(g=>g.paths.length>1);
 const bySide=g=>({s:g.paths.filter(x=>x[0]==='S'),d:g.paths.filter(x=>x[0]==='D')});
 const candidates=[],inherited=[],sameSide=[];
 for(const g of repeated){
  const own=bySide(g);
  if(!own.s.length||!own.d.length){sameSide.push({name:g.name,paths:g.paths});continue;}
  const independentPairs=[],derivedPairs=[];
  for(const a of own.s)for(const b of own.d){
   const parent=repeated.find(y=>{
    if(key(y.name)===key(g.name))return false;
    const ySide=bySide(y);
    return ySide.s.some(path=>a.startsWith(path)&&a.length>path.length)&&
           ySide.d.some(path=>b.startsWith(path)&&b.length>path.length);
   });
   if(parent)derivedPairs.push({paths:[a,b],via:parent.name});
   else independentPairs.push([a,b]);
  }
  if(independentPairs.length)candidates.push({name:g.name,paths:g.paths,pairs:independentPairs,derivedPairs});
  else inherited.push({name:g.name,paths:g.paths,via:[...new Set(derivedPairs.map(x=>x.via))]});
 }
 return {repeated,candidates,inherited,sameSide};
}

// v1.6: Effective cross-factor research calculation. Only KNOWN factor-name variants are summed.
// Same horse+variant is counted once even if its ancestor appears at multiple locations.
// Different variants of the same named horse contribute each variant's own factors once.
// Independent parent-side crossings only; derived ancestor repeats (v1.5) are excluded.
// Missing variant identity MUST remain unresolved (never assume it matches/differs).
function sumNamedVariants16(entries){
 const known=new Map(),unresolved=[],conflicts=[];
 for(const entry of entries||[]){
  const variant=String(entry.variant||'').trim(),horse=String(entry.name||'').trim();
  const factors=Array.isArray(entry.factors)?entry.factors.filter(f=>FACTORS.includes(f)):[];
  if(!variant||!horse){unresolved.push({path:entry.path||'',name:horse,factors,reason:'因名を特定できません'});continue;}
  const id=key(horse)+'|'+key(variant),ordered=factors.slice().sort();
  if(!factors.length){unresolved.push({path:entry.path||'',name:horse,variant,factors,reason:'因子を特定できません'});continue;}
  if(known.has(id)){
   const other=known.get(id);
   if(JSON.stringify(other.factors.slice().sort())!==JSON.stringify(ordered)){
    conflicts.push({name:horse,variant,paths:[other.path,entry.path],reason:'同じ因名なのに登録因子が一致しません'});
    other.conflict=true;
   }
  }else known.set(id,{name:horse,variant,path:entry.path||'',factors,conflict:false});
 }
 const counts={};const counted=[];
 for(const x of known.values()){
  if(x.conflict)continue;
  counted.push(x);for(const f of x.factors)counts[f]=(counts[f]||0)+1;
 }
 return {counts,counted,unresolved,conflicts,total:Object.values(counts).reduce((a,b)=>a+b,0),types:Object.keys(counts).length};
}
function effectiveCrossFactors16(rows,plan=null){
 const byPath=new Map((rows||[]).map(r=>[r.path,r]));
 const independent=classifyIndependentCross15(rows||[]),crosses=[],frequency={};
 const slotMap={SSS:'g3',DSSS:'g4',DDDSS:'g5'};
 for(const cross of independent.candidates){
  // Include only endpoints of INDEPENDENT paternal/maternal path pairs.
  const validPaths=[...new Set(cross.pairs.flat())];
  const entries=validPaths.map(path=>{
   const r=byPath.get(path)||{},baseName=r.name||'';
   let variant=String(r.factorVariant||r.variant||''),factors=Array.isArray(r.factors)?r.factors:[],source=variant?'血統記録':'因名未記載';
   const anchor=slotMap[path],id=anchor&&plan?.routeDraft?.slots?.[anchor];
   if(id){
    const known=routeSnapshotMember(id,plan);
    const wantedName=known?.name||splitName(id).name;
    if(known&&key(wantedName)===key(baseName) &&
       JSON.stringify([...factors].sort())===JSON.stringify([...(known.factors||[])].sort())){
     variant=known.variant||splitName(id).variant;
     factors=[...(known.factors||[])];source='指定3頭の因名';
    }
   }
   return {path,name:baseName,variant,factors,source};
  });
  const aggregated=sumNamedVariants16(entries);
  for(const [f,n] of Object.entries(aggregated.counts))frequency[f]=(frequency[f]||0)+n;
  crosses.push({name:cross.name,paths:validPaths,pairs:cross.pairs,entries,...aggregated});
 }
 const uncertain=crosses.flatMap(c=>c.unresolved.map(u=>({cross:c.name,...u})));
 const conflicts=crosses.flatMap(c=>c.conflicts.map(u=>({cross:c.name,...u})));
 return {crosses,frequency,total:Object.values(frequency).reduce((a,b)=>a+b,0),types:Object.keys(frequency).length,
  uncertain,conflicts,independentCount:independent.candidates.length,derivedCount:independent.inherited.length,
  complete:uncertain.length===0&&conflicts.length===0};
}
function renderCrossFactor16(m){
 const result=m.effective16;
 const counts=Object.entries(result.frequency).sort((a,b)=>FACTORS.indexOf(a[0])-FACTORS.indexOf(b[0]));
 const want=['SSS','DSSS','DDDSS'];
 const shikouCross=result.crosses.find(x=>key(x.name)===key(m.anchors?.[0]?.seen||''));
 const shikouKinds=shikouCross?Object.keys(shikouCross.counts):[];
 return `<section class="r16-section"><h4>v1.6｜有効クロス因子（判明した因名のみ）</h4>
 <p class="r12-foot">同因名は1組分のみ、異因名はそれぞれ合算。独立クロス候補だけを対象とし、上位クロス由来の重複祖先は除外します。<b>祖先31枠の因子数・ニトロ・SP/ST能力値とは別の集計</b>です。</p>
 <div class="r12-cols"><div class="r12-metric"><strong>${result.total}${result.complete?'':'+'}</strong><span>確認できた有効因子数${result.complete?'':'（下限）'}</span></div>
 <div class="r12-metric"><strong>${shikouKinds.length}${shikouCross?.unresolved.length?'+' : ''}種類</strong><span>指定クロスの因子種類（判明分）</span></div></div>
 <div class="r12-pills">${counts.map(([f,n])=>chip(`${f} ×${n}`)).join('')||'因名確定分なし'}</div>
 ${result.crosses.map(c=>`<details class="r12-details"><summary>${esc(c.name)}：${c.total}因子／${c.types}種類${c.unresolved.length?'・因名要確認':''}</summary><p class="r12-foot">${esc(c.counted.map(v=>`${v.variant}〔${v.factors.join('・')}〕`).join(' + ')||'因名確定分なし')}</p><p class="r12-foot">位置：${esc(c.paths.join(' / '))}${c.unresolved.length?' ／ 未判定 '+esc(c.unresolved.map(x=>x.path).join('・')):''}</p></details>`).join('')}
 ${result.uncertain.length||result.conflicts.length?`<div class="r12-warn">因名未確認 ${result.uncertain.length}枠／因子の矛盾 ${result.conflicts.length}件。全クロスの合計は確定できません。因名不明の祖先を推定で合算しません。</div>`:'<p class="r12-foot">今回検出した独立クロス候補の全参加位置について、因名と因子の組合せを照合できました。ただしゲーム内でのクロス成立・効果は未確認です。</p>'}
 <p class="r12-foot">※クロスによる数え方を整理した研究用集計です。至高の成立やゲーム内の実際の「有効な因子」表示と一致することを保証するものではありません。</p></section>`;
}

// v2.0 — Separate the five-generation FOAL window from the five generations
// of each future parent. Do not extend the official cross score beyond its
// supported five-generation foal window without a game-visible confirmation.
function horseAnc20(row){return {path:kanaPath(row.path),name:row.horse||row.name||'',factors:[...(row.factors||[])],line:row.line||'',factorVariant:row.factorVariant||row.variant||'',source:row.source||'血統記録'};}
function sirePaths20(){const arr=[];for(let depth=1;depth<=5;depth++){
 for(let i=0;i<2**(depth-1);i++){
  let p='';for(let k=depth-2;k>=0;k--)p+=(i>>k)&1?'D':'S';arr.push(p+'S');
 }}return arr;}
const PED20_PATHS=sirePaths20();
// If an old homebred only has 15 ancestors, reconstruct the full 31 positions
// from its recorded parents without altering previously saved records.
// A public master may identify PART of generation 5 from a known male
// ancestor's own ancestry. Unrecoverable branches remain empty, not guessed.
function parentPedigree20(horse){
 const by=new Map(),conflicts=[];
 const insert=(r,origin)=>{
  const a=horseAnc20(r);if(!a.name||!PED20_PATHS.includes(a.path))return;
  const prior=by.get(a.path);
  if(prior){if(key(prior.name)!==key(a.name))conflicts.push(a.path+'：'+prior.name+'／'+a.name);return;}
  by.set(a.path,{...a,source:origin||a.source});
 };
 for(const a of horse?.ancestry||[])insert(a,'保存済み血統');
 const fatherId=horse?.fatherId,motherId=horse?.motherId;
 if(horse?.isHomebred&&fatherId&&motherId){
  const father=findParentHorse(fatherId),mother=findParentHorse(motherId);
  if(father&&mother&&key(father.id)!==key(horse.id)&&key(mother.id)!==key(horse.id)){
   const ped=getFoalPedigree(father,mother);
   for(const a of ped.rows)if(a.name)insert({path:a.path,horse:a.name,factors:a.factors,line:a.line,factorVariant:a.factorVariant},'親の記録から再構成');
  }
 }
 // For public horses, extension uses their known ancestors' published bloodlines.
 // Different names/variants that disagree are not combined into invented facts.
 if(!horse?.isHomebred&&by.size){
  const horses=maleRows();const byName=new Map();
  for(const r of horses){const k=key(r.name);if(!byName.has(k))byName.set(k,[]);byName.get(k).push(r);}
  const base=[...by.values()].filter(x=>x.path.length>=1&&x.path.length<=4);
  for(const a of base){
   const suffix='D'.repeat(4-a.path.length)+'S',dest=a.path+suffix;
   if(by.has(dest))continue;
   const matches=(byName.get(key(a.name))||[]).map(r=>(r.ancestry||[]).find(q=>kanaPath(q.path)===suffix)).filter(q=>q?.horse);
   if(!matches.length||!matches.every(x=>key(x.horse)===key(matches[0].horse)))continue;
   const factorSig=x=>JSON.stringify([...(x.factors||[])].sort());
   const factors=matches.every(x=>factorSig(x)===factorSig(matches[0]))?matches[0].factors||[]:[];
   const variant=matches.every(x=>key(x.factorVariant||'')===key(matches[0].factorVariant||''))?matches[0].factorVariant||'':'';
   insert({path:dest,horse:matches[0].horse,factors,line:matches[0].line||'',factorVariant:variant},'祖先馬の公開血統をたどって補完');
  }
 }
 const rows=PED20_PATHS.map(path=>by.get(path)||{path,name:'',factors:[],line:'',factorVariant:'',source:'未収録'});
 return {rows,known:rows.filter(x=>x.name).length,outerKnown:rows.filter(x=>x.path.length===5&&x.name).length,conflicts};
}
function gamePedigreeData20(sire,mare,foal){
 const s=parentPedigree20(sire),d=parentPedigree20(mare);
 const main=foal.crossCheck||classifyIndependentCross15(foal.rows);
 const mainPaths=new Set(main.candidates.flatMap(c=>c.pairs.flat()));
 const parentBoth=[{path:'S',name:sire?.name||'',factors:sire?.factors||[],factorVariant:sire?.variant||''}];
 for(const a of s.rows)if(a.name)parentBoth.push({...a,path:'S'+a.path});
 for(const a of d.rows)if(a.name)parentBoth.push({...a,path:'D'+a.path});
 const outerCheck=classifyIndependentCross15(parentBoth);
 const outsidePairs=outerCheck.candidates.flatMap(c=>c.pairs.filter(pair=>pair.some(path=>path.length===6)).map(pair=>({name:c.name,pair})))
  .filter(x=>!main.candidates.some(c=>key(c.name)===key(x.name)&&c.pairs.some(pair=>pair.every(p=>x.pair.includes(p)))));
 const outerPaths=new Set(outsidePairs.flatMap(x=>x.pair));
 return {s,d,main,mainPaths,outerPaths,outsidePairs};
}
function pedigreePathLabel20(path){return String(path||'').replace(/S/g,'父').replace(/D/g,'母');}
function pedigreeTree20(rows,opts={}){
 const by=new Map(rows.map(x=>[x.path,x]));
 const cols=[];
 for(let depth=1;depth<=5;depth++){
  const cells=PED20_PATHS.filter(path=>path.length===depth).map(path=>{
   const r=by.get(path)||{},globalPath=(opts.prefix||'')+path;
   const cross=opts.mainPaths?.has(globalPath),outer=opts.outerPaths?.has(globalPath)&&!cross;
   const anchor=opts.anchorPaths?.has(globalPath),missing=!r.name;
   const cls=[cross?'p20-cross':'',outer?'p20-outer':'',anchor?'p20-anchor':'',missing?'p20-unknown':''].filter(Boolean).join(' ');
   const factors=(r.factors||[]).map(f=>`<span class="p20-factor p20-f-${esc(f)}">${esc(f)}</span>`).join('');
   return `<div class="p20-node ${cls}" style="grid-row:span ${16/(2**(depth-1))}" title="${esc(globalPath)}：${esc(r.name||'不明')}"><span class="p20-path">${esc(globalPath)}｜${esc(pedigreePathLabel20(globalPath))}</span><b class="p20-name">${esc(r.name||'未収録')}</b><span class="p20-factors">${factors}</span>${outer?'<small class="p20-out-note">参考</small>':''}</div>`;
  }).join('');
  cols.push(`<div class="p20-gen"><div class="p20-col-title">${depth}代</div><div class="p20-cells">${cells}</div></div>`);
 }
 return `<div class="p20-scroll" role="region" aria-label="5代血統表、左右スクロール可能" tabindex="0"><div class="p20-tree">${cols.join('')}</div></div>`;
}
function renderGamePedigree20(sire,mare,foal,p=null){
 if(!sire||!mare||!foal?.rows)return '';
 const info=gamePedigreeData20(sire,mare,foal),anchors=new Set(p?.routeDraft?.slots?['SSS','DSSS','DDDSS']:[]);
 const rootData=[
  {title:'最終産駒（交配後の5代）',name:'最終産駒',rows:foal.rows,prefix:'',known:foal.known,defaultOpen:true},
  {title:'最終種牡馬（交配前の自身の5代祖先）',name:sire.id||sire.name,rows:info.s.rows,prefix:'S',known:info.s.known},
  {title:'最終肌馬（交配前の自身の5代祖先）',name:mare.id||mare.name,rows:info.d.rows,prefix:'D',known:info.d.known}
 ];
 const folds=rootData.map(item=>`<details class="p20-fold" ${item.defaultOpen?'open':''}><summary>${esc(item.title)}：${esc(item.name)} <small>${item.known}/31枠</small></summary>${pedigreeTree20(item.rows,{prefix:item.prefix,mainPaths:info.mainPaths,outerPaths:info.outerPaths,anchorPaths:anchors})}</details>`).join('');
 const active=info.main.candidates.map(c=>`${c.name}（${c.pairs.map(x=>x.join('×')).join('／')}）`);
 const outside=info.outsidePairs.map(x=>`${x.name}（${x.pair.join('×')}）`);
 return `<section class="p20-view" aria-label="v2.0ゲーム風5代血統表"><h4>v2.0｜ゲーム風・最終種牡馬と肌馬の血統表</h4>
 <p class="r12-foot">赤文字＝<b>産駒の5代内で検出した独立クロス候補</b>、金色枠＝至高3×4×5の指定位置、点線橙枠＝親の5代で見えるが産駒5代の外にある参考位置。<b>ゲーム内の正式な赤表示・成立は未確認</b>です。</p>
 <p class="p20-legend"><span class="p20-legend-red">● 独立クロス候補</span><span class="p20-legend-gold">● 至高指定位置</span><span class="p20-legend-orange">● 外側の参考位置</span></p>
 ${folds}
 <div class="p20-notice"><b>産駒5代の独立クロス候補：</b>${esc(active.join('、')||'なし')}<br><b>親の5代側だけに残る参考重複：</b>${esc(outside.join('、')||'検出なし')}。</div>
 <p class="r12-foot">血統表は父系・母系の<b>種牡馬祖先位置31枠</b>をゲーム風に並べた研究用表示です。牝馬の全祖先名を網羅するものではありません。親の最外周（5代目）は公開データの不足で未収録になることがあります。<b>この外周の重複を自動で有効因子やニトロに加点しません。</b> 自家製馬本人に未確認の因子を付与することもありません。</p></section>`;
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
 const crossCheck=classifyIndependentCross15(positioned.map(x=>({path:x.path,name:x.id})));
 const extras=crossCheck.candidates.filter(x=>!(anchors.some(a=>key(a?.name||splitName(a?.id||'').name)===key(x.name))));
 const counted=countItems(positioned.flatMap(x=>x.factors));const lines=countItems(positioned.map(x=>x.line));
 const fourth=positioned.filter(x=>x.depth===4),fifth=positioned.filter(x=>x.depth===5);
 const eligible=[];for(let depth=1;depth<=5;depth++){for(let j=0;j<2**(depth-1);j++){
  let path='';for(let k=depth-2;k>=0;k--)path+=((j>>k)&1)?'D':'S';eligible.push(path+'S');}}
 return {known:positioned,types:[...types],factorCounts:counted,lineCounts:lines,issues,extraCrosses:extras,crossCheck,
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
 <div class="audit-metrics"><div class="metric"><strong>${a.types.length}種類</strong><small>至高候補3頭の因子</small></div><div class="metric"><strong>${a.knownSires}/31</strong><small>判明した5代種牡馬枠</small></div><div class="metric"><strong>${a.extraCrosses.length}件</strong><small>独立した追加クロス候補（要確認）</small></div></div>
 <div class="research"><b>判明した祖先の因子</b><div class="metrics">${a.factorCounts.map(([n,v])=>chip(`${n} ×${v}`)).join('')||'未登録'}</div><p class="muted">位置別の参考集計です。ニトロの確定値や能力加算値を表すものではありません。</p><b>4代目の研究対象系統</b><p>SP系 ${a.sp4}枠 ／ ST系 ${a.st4}枠</p><b>5代目の研究対象系統</b><p>SP系 ${a.sp5}枠 ／ ST系 ${a.st5}枠</p><p class="muted">子系統は位置・重複を記録するための表示です。効果やボーナス値は未確定です。</p></div>`;
 if(xId)s+=`<div class="notice"><b>選択中の補助種牡馬X：</b>${esc(xId)}（完成産駒の母母父 DDS）<br>下の候補一覧で「このXをプレビュー」後、「工程7へ反映して保存」を押すと保存されます。</div>`;
 if(a.extraCrosses.length)s+=`<div class="audit-warn"><b>独立した追加クロス候補（ゲーム内効果は未確認）</b><div class="muted">${a.extraCrosses.map(x=>`${esc(x.name)}（${esc(x.paths.join(' / '))}）`).join('、')}</div></div>`;
 if(a.crossCheck.inherited.length)s+=`<div class="notice"><b>祖先の派生重複（追加クロスに計上しない）</b>：${esc(a.crossCheck.inherited.map(x=>x.name+' ← '+x.via.join('・')).join('、'))}。同じ上位祖先の血統経路が重なった結果です。これはゲームの公式表示を保証するものではありません。</div>`;
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
<h4 style="margin:18px 0 6px">保存時の候補データ（スナップショット）</h4><div class="muted">${esc(p.source?.basis||'手動登録')} ／ ${p.source?.validated?'成立確認済':'因子の一次候補。至高の成立未確認'}</div><div class="metrics">${(p.source?.factors||[]).map(f=>chip(f)).join('')}</div>${members.length?members.map(m=>`<div class="slot"><strong>${esc(m.id)}</strong><span>${(m.factors||[]).map(f=>chip(f)).join('')} 権利数（保存時）${esc(m.rightsAtSave??'-')}</span></div>`).join(''):'<p class="muted">候補から保存すると種牡馬と因子が記録されます。</p>'}</div>
${renderHard23Panel(p)}<div id="routeOptimizer10"></div><div id="prep17"></div><div id="chainPlanner09"></div><div id="review12"></div><div id="productionGuide13"></div>${renderRoutePanel(p)}<div id="pairMateEditor"></div><div id="homePlanInline">${renderLinkedHomebreds(p)}</div><h3 class="heading">工程と最低許容能力</h3><div class="notice warn">SP/ST欄は、配合設計後に決める合格基準です。現在のアプリは自動計算できないため、未設定欄に架空の数値を入れません。実測・ゲノム解析結果をメモして検証できます。</div><div id="planStepEditor">${(p.steps||[]).map((s,i)=>renderPlanStep(s,i,(p.steps||[]).length)).join('')}</div>
<div class="btnrow"><button class="btn ghost" id="addPlanStep">＋ 工程を追加</button><button class="btn" id="savePlanNow">保存を確認</button></div><p class="muted" id="planSaveStatus">最終保存：${esc(dateJP(p.updatedAt))}</p>`;
el.querySelector('#closePlanEditor').onclick=closeEditor;if(el.querySelector('#routeAuditor'))setupRouteAuditPanel(el,p);setupPairEditor(el,p);setupChainPlanner09(el,p);setupOptimizer10(el,p);setupPrep17(el,p);renderReview12(p);setupProductionGuide13(el,p);const link=el.querySelector('#linkHomebred');if(link)link.onclick=()=>{switchTab('homebreds');$('homePlan').value=p.id;refreshHomeSteps();};const gen=el.querySelector('#generateRoute');if(gen)gen.onclick=()=>createDraftRoute(p,{g3:el.querySelector('#routeGen3').value,g4:el.querySelector('#routeGen4').value,g5:el.querySelector('#routeGen5').value});
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
$('planEditor').addEventListener('input',e=>{const p=getPlan(openPlanId);if(!p)return;const v=e.target;const f=v.dataset.planField;if(f){p[f]=v.value;touchPlan(p);return;}const sf=v.dataset.stepField;if(sf){const i=Number(v.closest('[data-step-index]')?.dataset.stepIndex);if(p.steps[i]){p.steps[i][sf]=sf==='done'?v.value==='true':v.value;touchPlan(p);const missing=$('benchMissingCount');if(missing)missing.textContent=String(p.steps.filter(x=>!x.minSP||!x.minST).length);}}const hf=v.dataset.h23Field;if(hf&&p.hard23){const i=Number(v.closest('[data-h23-index]')?.dataset.h23Index),r=p.hard23.preparations[i];if(r){r[hf]=hf==='done'?v.value==='true':v.value;touchPlan(p);}}});
$('planEditor').addEventListener('change',e=>{if(e.target.matches('select[data-plan-field],select[data-step-field],select[data-h23-field]'))e.target.dispatchEvent(new Event('input',{bubbles:true}));});
$('planEditor').addEventListener('click',e=>{const p=getPlan(openPlanId);if(!p)return;const step=e.target.closest('[data-step-index]'),i=Number(step?.dataset.stepIndex),mv=e.target.closest('[data-move-step]'),rm=e.target.closest('[data-remove-step]');if(!Number.isInteger(i)||!p.steps[i])return;if(rm){if(!confirm('この工程を削除しますか？'))return;p.steps.splice(i,1);touchPlan(p);showPlanEditor(p.id);}else if(mv){const k=i+(mv.dataset.moveStep==='up'?-1:1);if(k<0||k>=p.steps.length)return;[p.steps[i],p.steps[k]]=[p.steps[k],p.steps[i]];touchPlan(p);showPlanEditor(p.id);}});
$('exportPlans').onclick=()=>dl('dabimas_saved_plans_v13.json',{version:13,plans:state.plans,homebreds:state.homebreds});


// v0.7: Broodmare search and verified-by-source, direct sire x broodmare 5-generation display.
// 'Favorites' means research candidates, NOT verified owned mares.
let mareLimit=35;
function renderMares(){const panel=$('mareList');if(!panel)return;
 const q=key($('mareQuery').value),filter=$('mareFilter').value;
 const gradeFilter=$('mareRankFilter12')?.value||'all';
 let rows=mareRows().filter(r=>(filter!=='saved'||state.mareFavorites[key(r.id)])&&(gradeFilter==='all'||(gradeFilter==='meihin'&&mareRank12(r).value==='名牝')||(gradeFilter==='unknown'&&mareRank12(r).value==='未確認'))&&(!q||key(r.id+' '+r.lineage).includes(q)));
 rows.sort((a,b)=>Number(!!state.mareFavorites[key(b.id)])-Number(!!state.mareFavorites[key(a.id)])||a.id.localeCompare(b.id,'ja'));
 $('mareCount').textContent=`繁殖牝馬：${rows.length}頭中 ${Math.min(mareLimit,rows.length)}頭表示（距離欄なしの公開データ）`;
 panel.innerHTML=rows.slice(0,mareLimit).map(r=>`<div class="mare-list-item"><div><strong>${esc(r.id)}</strong> ${state.mareFavorites[key(r.id)]?chip('研究候補に登録','owned'):''} ${chip(mareRank12(r).value,mareRank12(r).value==='名牝'?'owned':'')}<div class="muted">${esc(r.lineage||'子系統未登録')} ／ 祖先 ${r.ancestry?.length||0}枠</div></div><div class="mare-actions"><label class="mare-grade-label">ランク<select data-mare-grade12="${esc(r.id)}" title="ゲーム内で確認したランクを登録">
 <option value="" ${!state.mareGrades[key(r.id)]?'selected':''}>${esc(mareRank12(r).source==='過去の公開リスト'?'名牝（参考）':'未確認（自動）')}</option>
 ${RANK12_CHOICES.map(grade=>`<option value="${esc(grade)}" ${state.mareGrades[key(r.id)]===grade?'selected':''}>${esc(grade)}</option>`).join('')}</select></label><button class="btn small ghost" data-mare-detail="${esc(r.id)}">血統</button><button class="btn small ${state.mareFavorites[key(r.id)]?'grey':'ghost'}" data-mare-fav="${esc(r.id)}">${state.mareFavorites[key(r.id)]?'候補から外す':'候補に追加'}</button></div></div>`).join('')||'<div class="empty">該当する繁殖牝馬はありません。公開CSVの取り込みを確認してください。</div>';
 $('mareMore').disabled=rows.length<=mareLimit;
}
function mareDetail(id){const r=map.get(key(id));if(!r||horseSex(r)!=='female')return;
 $('marePreview').innerHTML=`<h3>${esc(r.id)}</h3><p class="muted">${esc(r.lineage||'子系統不明')} ／ 公開祖先 ${r.ancestry?.length||0}/15枠。繁殖牝馬の所持状況は確認していません。 ランク：${esc(mareRank12(r).value)}（${esc(mareRank12(r).source)}）。</p><div class="audit-table-wrap"><table><thead><tr><th>位置</th><th>祖先馬</th><th>因子</th><th>子系統</th></tr></thead><tbody>${(r.ancestry||[]).map(a=>`<tr><td>${esc(a.path)}</td><td>${esc(a.horse)}</td><td>${esc((a.factors||[]).join('・')||'—')}</td><td>${esc(a.line||'未登録')}</td></tr>`).join('')}</tbody></table></div><p class="muted">この血統を配合計算に使うには、「保存プラン」の直接配合チェックで牝馬名を選択してください。</p>`;
 $('marePreview').scrollIntoView({block:'nearest'});
}
function getPairParents(p){const x=p.pairCheck||{}; const sire=(x.sireId&&findParentHorse(x.sireId))||(x.sireSnapshot?.id?x.sireSnapshot:null);const mare=(x.mareId&&findParentHorse(x.mareId))||(x.mareSnapshot?.id?x.mareSnapshot:null);return {sire,mare};}
function getFoalPedigree(sire,mare){
 // 1 sire root + 15 male ancestors of each selected parent -> all 31 possible sire positions.
 const at=new Map(),conflicts=[];
 function add(path,name,factors=[],line='',source='',factorVariant=''){
  if(!path||path.length>5||!name)return;
  if(at.has(path)&&key(at.get(path).name)!==key(name)){conflicts.push(`${path}: ${at.get(path).name} と ${name}`);return;}
  at.set(path,{path,name,factors:(factors||[]).filter(Boolean),line:line||'',source,factorVariant:factorVariant||''});
 }
 if(sire){add('S',sire.name||splitName(sire.id).name,sire.factors,sire.lineage,sire.id,sire.isHomebred?'':sire.variant||splitName(sire.id).variant);for(const a of sire.ancestry||[])add('S'+kanaPath(a.path),a.horse,a.factors,a.line,sire.id,a.factorVariant||a.variant||'');}
 if(mare){for(const a of mare.ancestry||[])add('D'+kanaPath(a.path),a.horse,a.factors,a.line,mare.id,a.factorVariant||a.variant||'');}
 const all=[];for(let d=1;d<=5;d++){const n=2**(d-1);for(let j=0;j<n;j++){let p='';for(let k=d-2;k>=0;k--)p+=j>>k&1?'D':'S';all.push(p+'S');}}
 const rows=all.map(path=>at.get(path)||{path,name:'',factors:[],line:''}),known=rows.filter(x=>x.name);
 const byName=new Map();for(const a of known){const k=key(a.name);if(!byName.has(k))byName.set(k,[]);byName.get(k).push(a);}
 const repeats=[...byName.values()].filter(x=>x.length>1).map(x=>({name:x[0].name,paths:x.map(a=>a.path)}));
 const triple=[...byName.values()].filter(x=>[3,4,5].every(d=>x.some(a=>a.path.length===d))).map(x=>x[0].name);
 const factorCounts=countItems(known.flatMap(x=>x.factors));const lineCounts=countItems(known.map(x=>x.line));
 return {rows,known:known.length,repeats,triple,factorCounts,lineCounts,conflicts,
  crossCheck:classifyIndependentCross15(rows)};
}
function renderPairReport(sire,mare){const a=getFoalPedigree(sire,mare);
 return `<div class="pair-coverage"><div class="stat"><b>${a.known}/31</b><small>種牡馬位置の判明数</small></div><div class="stat"><b>${a.repeats.length}</b><small>名前の重複（未判定含む）</small></div><div class="stat"><b>${a.triple.length}</b><small>3・4・5代に同名祖先</small></div></div>
 <div class="notice ${a.known<31?'warn':''}">${a.known<31?'一部の祖先が未判明です。':'祖先31枠の名前が確認できました。'} ${a.triple.length?`同名の3×4×5候補：${a.triple.map(esc).join('・')}。ただし因名6種類・兄弟姉妹条件・至高成立は未検証です。`:'同名祖先の3×4×5が、この選択ペアの判明分には見つかっていません。'} <b>能力値・勝率を計算したものではありません。</b></div>
 <b>判明分の因子（祖先位置別）</b><div class="metrics">${a.factorCounts.map(([k,v])=>chip(`${k} ×${v}`)).join('')||'未登録'}</div>
 <b>子系統（確認できた数）</b><div class="metrics">${a.lineCounts.slice(0,30).map(([k,v])=>chip(`${k} ×${v}`)).join('')||'未登録'}</div>
 <div class="notice"><b>独立した父母間クロス候補：</b>${esc(a.crossCheck.candidates.map(x=>x.name).join('、')||'未検出')}（${a.crossCheck.candidates.length}種類）<br><b>同じクロスに由来する祖先の派生重複：</b>${esc(a.crossCheck.inherited.map(x=>x.name+'［'+x.via.join('・')+'由来］').join('、')||'なし')}。後者は独立クロスとして二重に加点しません。ゲーム内のクロス表示は別途確認が必要です。</div>
 ${a.repeats.length?`<details class="details"><summary>血統上の同名祖先の重複位置（${a.repeats.length}種類、クロス確定数ではありません）</summary>${a.repeats.map(x=>`<div class="pair-list-row"><b>${esc(x.name)}</b><span>${esc(x.paths.join(' / '))}</span></div>`).join('')}</details>`:''}
 ${a.conflicts.length?`<div class="notice warn">血統の矛盾：${a.conflicts.map(esc).join('、')}</div>`:''}
 ${renderGamePedigree20(sire,mare,a)}
 <details class="details"><summary>産駒の5代血統31枠を表示</summary><div class="audit-table-wrap"><table><thead><tr><th>位置</th><th>代</th><th>祖先馬</th><th>因子</th><th>子系統</th></tr></thead><tbody>${a.rows.map(x=>`<tr><td>${x.path}</td><td>${x.path.length}</td><td>${esc(x.name||'未確認')}</td><td>${esc((x.factors||[]).join('・')||'—')}</td><td>${esc(x.line||'—')}</td></tr>`).join('')}</tbody></table></div></details>
 <p class="muted">これは選択した公開種牡馬と繁殖牝馬の<strong>直接配合</strong>の検査です。仮ルートの最終自家製種牡馬・繁殖牝馬の代替ではありません。また因子の数はそのままニトロやSP/ST補正にはなりません。</p>`;
}
function renderPairEditor(p){const x=p.pairCheck||{}, saved=x.sireId&&x.mareId;
 const sireRows=[...maleRows().filter(r=>r.ancestry?.length),...getHomeParents('male')],mRows=[...mareRows().filter(r=>r.ancestry?.length),...getHomeParents('female')];
 return `<div class="card"><h3>v0.7｜繁殖牝馬と種牡馬の直接配合チェック</h3><p class="muted">種牡馬＋繁殖牝馬の公開血統を結合し、産駒の5代血統31枠を照合。<b>これは現在の9工程とは別の検証メモ</b>としてプランに保存できます。</p>
 <div class="pair-input-row"><label>父（種牡馬・因名）<input class="plan-input" id="pairSire" list="pairSireList" value="${esc(x.sireId||'')}" placeholder="例：ディープインパクト-央獅-" autocomplete="off"></label><label>母（繁殖牝馬）<input class="plan-input" id="pairMare" list="pairMareList" value="${esc(x.mareId||'')}" placeholder="繁殖牝馬名を入力" autocomplete="off"></label></div>
 <datalist id="pairSireList">${sireRows.map(r=>`<option value="${esc(r.id)}"></option>`).join('')}</datalist><datalist id="pairMareList">${mRows.map(r=>`<option value="${esc(r.id)}"></option>`).join('')}</datalist>
 <div class="btnrow"><button class="btn small ghost" id="pairPreview">5代血統を照合</button><button class="btn small" id="pairSave">この組み合わせをプランに保存</button>${saved?'<button class="btn small grey" id="pairClear">検証ペアを解除</button>':''}</div>
 <p class="muted" id="pairStatus">${saved?`保存済み：${esc(x.sireId)} × ${esc(x.mareId)}`:'保存済みの検証ペアはありません。'}</p>
 <div id="pairReport"></div></div>`;
}
function setupPairEditor(el,p){let report=el.querySelector('#pairMateEditor');if(!report)return;
 report.innerHTML=renderPairEditor(p);
 const resolve=()=>{const sid=report.querySelector('#pairSire').value.trim(),mid=report.querySelector('#pairMare').value.trim();const sire=findParentHorse(sid)||(p.pairCheck?.sireSnapshot?.id===sid?p.pairCheck.sireSnapshot:null),mare=findParentHorse(mid)||(p.pairCheck?.mareSnapshot?.id===mid?p.pairCheck.mareSnapshot:null);
 if(!sire||horseSex(sire)!=='male')return {error:'父に、公開マスターに登録された種牡馬を指定してください。'};
 if(!mare||horseSex(mare)!=='female')return {error:'母に、公開マスターに登録された繁殖牝馬を指定してください。'};
 if(!sire.ancestry?.length||!mare.ancestry?.length)return {error:'父か母の血統が未収録です。公開CSVを読み込んでください。'};
 return {sire,mare};};
 const preview=()=>{const pair=resolve();if(pair.error){report.querySelector('#pairStatus').textContent=pair.error;return null;}report.querySelector('#pairReport').innerHTML=renderPairReport(pair.sire,pair.mare);report.querySelector('#pairStatus').textContent='直接配合の確認結果です（まだ保存していません）。';return pair;};
 report.querySelector('#pairPreview').onclick=preview;
 report.querySelector('#pairSave').onclick=()=>{const pair=resolve();if(pair.error){report.querySelector('#pairStatus').textContent=pair.error;return;}p.pairCheck={sireId:pair.sire.id,mareId:pair.mare.id,sireSnapshot:{...pair.sire},mareSnapshot:{...pair.mare},updatedAt:nowISO()};touchPlan(p);report.querySelector('#pairReport').innerHTML=renderPairReport(pair.sire,pair.mare);report.querySelector('#pairStatus').textContent=`保存しました：${pair.sire.id} × ${pair.mare.id}。検索を変えても残ります。`;};
 const clear=report.querySelector('#pairClear');if(clear)clear.onclick=()=>{if(!confirm('保存している直接配合チェックの組み合わせを解除しますか？（工程は消えません）'))return;delete p.pairCheck;touchPlan(p);report.innerHTML=renderPairEditor(p);setupPairEditor(el,p);};
 if(p.pairCheck){const pair=getPairParents(p);if(pair.sire&&pair.mare)report.querySelector('#pairReport').innerHTML=renderPairReport(pair.sire,pair.mare);}
}


// v0.8: offspring from either publicly documented or self-bred parents.
// A foal's 15 ancestor entries (at depths 1..4) are derived from the combined 31-sire-slot pedigree.
// Unknown sire's own factors and in-game performance are NEVER invented.
const homeId = name => `自家製:${String(name||'').trim()}`;
let homeDraftPair=null;
function homeHorseObj(rec){return {id:rec.id,name:rec.name,variant:'',factors:(rec.factors||[]),lineage:rec.lineage||'',sex:rec.sex,ancestry:(rec.ancestry||[]),isHomebred:true,mode:rec.mode,sp:rec.sp,st:rec.st,fatherId:rec.fatherId,motherId:rec.motherId};}
function getHomeParents(sex){return state.homebreds.filter(h=>h.sex===sex).map(homeHorseObj);}
function findParentHorse(id){if(!id)return null;return getHomeParents('male').concat(getHomeParents('female')).find(x=>key(x.id)===key(id))||map.get(key(id))||null;}
function mergeHomebreds(items){const byId=new Map(state.homebreds.map(h=>[key(h.id),h]));for(const h of items){if(!h||typeof h.name!=='string'||!['male','female'].includes(h.sex)||!Array.isArray(h.ancestry))continue;const id=String(h.id||homeId(h.name));const clean={...h,id,ancestry:h.ancestry.slice(0,31),factors:Array.isArray(h.factors)?h.factors.slice(0,3):[]};const existing=byId.get(key(id));if(!existing||String(clean.updatedAt||'')>String(existing.updatedAt||''))byId.set(key(id),clean);}state.homebreds=[...byId.values()];}
function getPlanTitle(id){return getPlan(id)?.title||'（計画削除または未設定）';}
function renderLinkedHomebreds(p){const list=state.homebreds.filter(h=>h.planId===p.id);return `<div class="card"><h3>v0.8｜このプランの自家製馬記録（${list.length}頭）</h3><p class="muted">自家製馬タブで登録した産駒を、計画と工程に紐づけて管理します。現在の9工程を自動変更しません。</p>${list.length?list.map(h=>`<div class="slot"><strong>${esc(h.name)}</strong><span>${esc(h.sex==='male'?'牡':'牝')}・${esc(h.mode==='real'?'実際に生産':'仮案')} ／ ${esc(h.stepNo?'工程 '+h.stepNo:'工程未指定')} ／ 父 ${esc(h.fatherId)} × 母 ${esc(h.motherId)} ／ SP ${esc(h.sp||'未確認')}・ST ${esc(h.st||'未確認')}</span></div>`).join(''):'<p class="muted">まだこの計画に紐づく馬はありません。</p>'}<button class="btn small ghost" id="linkHomebred">自家製馬タブへ</button></div>`;}
function initHomeSources(prefer={}){
 const sireList=$('homeSireList'),mareList=$('homeMareList');if(!sireList||!mareList)return;
 sireList.innerHTML=maleRows().filter(r=>r.ancestry?.length).map(r=>`<option value="${esc(r.id)}"></option>`).join('')+getHomeParents('male').map(r=>`<option value="${esc(r.id)}"></option>`).join('');
 mareList.innerHTML=mareRows().filter(r=>r.ancestry?.length).map(r=>`<option value="${esc(r.id)}"></option>`).join('')+getHomeParents('female').map(r=>`<option value="${esc(r.id)}"></option>`).join('');
 const sel=$('homePlan');const chosen=prefer.planId||sel.value;sel.innerHTML='<option value="">紐づけない</option>'+state.plans.map(p=>`<option value="${esc(p.id)}" ${p.id===chosen?'selected':''}>${esc(p.title)}</option>`).join('');
 refreshHomeSteps(prefer.stepNo);
}
function refreshHomeSteps(forced){const plan=getPlan($('homePlan').value),el=$('homeStep');if(!el)return;const selected=forced?String(forced):el.value;el.innerHTML='<option value="">工程を指定しない</option>'+(plan?.steps||[]).map((st,i)=>`<option value="${i+1}" ${selected===String(i+1)?'selected':''}>${i+1}. ${esc(st.title)}</option>`).join('');}
function renderHomebreds(){if(!$('homeList'))return;initHomeSources();const q=key($('homeSearch')?.value);const all=state.homebreds.filter(h=>!q||key([h.id,h.fatherId,h.motherId,getPlanTitle(h.planId)].join(' ')).includes(q));
 $('homeCount').textContent=`登録済み ${state.homebreds.length}頭／表示 ${all.length}頭。記録はこの端末に保存しています。`;
 $('homeList').innerHTML=all.length?all.slice().reverse().map(h=>{const a=(h.ancestry||[]).length;const child=state.homebreds.filter(x=>x.fatherId===h.id||x.motherId===h.id).length;return `<div class="home-row" data-home-id="${esc(h.id)}"><div><b>${esc(h.name)}</b><div class="home-badges">${chip(h.sex==='male'?'牡馬':'牝馬')}${chip(h.mode==='real'?'生産記録':'仮配合','warn')}${chip('祖先'+a+'/'+(a>15?31:15)+'枠')}</div><div class="muted">父：${esc(h.fatherId)} ／ 母：${esc(h.motherId)}<br>SP：${esc(h.sp||'未確認')} ／ ST：${esc(h.st||'未確認')} ／ ${h.planId?esc(getPlanTitle(h.planId)):'計画なし'} ${h.stepNo?'工程'+h.stepNo:''}</div></div><div class="btnrow"><button class="btn small ghost" data-home-view="${esc(h.id)}">血統</button>${h.sex==='male'?`<button class="btn small ghost" data-home-use="sire">父に使う</button>`:`<button class="btn small ghost" data-home-use="mare">母に使う</button>`}<button class="btn small grey" data-home-edit="${esc(h.id)}">記録を編集</button><button class="btn small danger" data-home-delete="${esc(h.id)}" ${child?'disabled title="子孫がいるので削除不可"':''}>削除</button></div></div>`;}).join(''):'<div class="empty">自家製馬はまだありません。父母を選んで産駒を登録してください。</div>';
}
function getHomePair(){const sid=$('homeSire').value.trim(),mid=$('homeMare').value.trim();const sire=findParentHorse(sid),mare=findParentHorse(mid);
 if(!sire||horseSex(sire)!=='male')return {error:'父には公開種牡馬または登録済み自家製牡馬を指定してください。'};
 if(!mare||horseSex(mare)!=='female')return {error:'母には公開繁殖牝馬または登録済み自家製牝馬を指定してください。'};
 if(!sire.ancestry?.length||!mare.ancestry?.length)return {error:'選択した親の5代血統データが不足しています。公開CSVの読み込みを確認してください。'};
 return {sire,mare};
}
function previewHomePair(){const pair=getHomePair();homeDraftPair=null;if(pair.error){$('homeStatus').textContent=pair.error;$('homePreviewArea').innerHTML='';return null;}
 const a=getFoalPedigree(pair.sire,pair.mare);homeDraftPair={sireId:pair.sire.id,mareId:pair.mare.id};
 $('homePreviewArea').innerHTML=renderPairReport(pair.sire,pair.mare);$('homeStatus').textContent=`父 ${pair.sire.id} × 母 ${pair.mare.id}：判明${a.known}/31枠。本人因子と能力はまだ推定していません。`;return pair;
}
function refreshHomePlanDetail(){if(openPlanId){const card=$('planEditor')?.querySelector('#homePlanInline');if(card){const p=getPlan(openPlanId);card.innerHTML=renderLinkedHomebreds(p);const btn=card.querySelector('#linkHomebred');if(btn)btn.onclick=()=>{switchTab('homebreds');$('homePlan').value=p.id;refreshHomeSteps();};}}}
function registerHomebred(){const pair=getHomePair();if(pair.error){$('homeSaveStatus').textContent=pair.error;return;}
 const name=$('homeName').value.trim(),sex=$('homeSex').value,mode=$('homeMode').value;
 if(!name||name.length>70){$('homeSaveStatus').textContent='自家製馬の名前を入力してください（70文字以内）。';return;}
 if(!['male','female'].includes(sex)||!['draft','real'].includes(mode)){ $('homeSaveStatus').textContent='性別と登録区分を確認してください。';return; }
 if(name.startsWith('自家製:')){ $('homeSaveStatus').textContent='馬名に「自家製:」という接頭辞は使えません。';return; }
 const id=homeId(name);if(state.homebreds.some(h=>key(h.id)===key(id))){$('homeSaveStatus').textContent='同じ名前の自家製馬が登録済みです。別の名前を付けてください。';return;}
 if(key(pair.sire.id)===key(id)||key(pair.mare.id)===key(id)){ $('homeSaveStatus').textContent='自分自身を親にすることはできません。';return;}
 const ped=getFoalPedigree(pair.sire,pair.mare),anc=ped.rows.filter(x=>x.path.length<=5&&x.name).map(a=>({path:a.path,horse:a.name,factors:[...(a.factors||[])],line:a.line||'',factorVariant:a.factorVariant||''}));
 const now=nowISO();const r={id,name,sex,mode,sp:$('homeSP').value.trim(),st:$('homeST').value.trim(),note:$('homeNote').value.trim(),fatherId:pair.sire.id,motherId:pair.mare.id,ancestry:anc,factors:[],lineage:pair.sire.lineage||'',lineageAssumed:!!pair.sire.lineage,planId:$('homePlan').value||'',stepNo:Number($('homeStep').value)||null,createdAt:now,updatedAt:now};
 state.homebreds.push(r);if(!persist()){state.homebreds.pop();$('homeSaveStatus').textContent='端末に保存できませんでした。空き容量を確認してください。';return;}
 $('homeSaveStatus').textContent=`${r.name}を${mode==='real'?'実際の生産記録':'仮配合の記録'}として保存しました。祖先 ${anc.length}/31枠（5代の判明分）。次の交配で親に選べます。`;
 $('homeName').value='';$('homeSP').value='';$('homeST').value='';$('homeNote').value='';renderHomebreds();refreshHomePlanDetail();
}
function displayHomePedigree(id){const rec=state.homebreds.find(h=>key(h.id)===key(id));if(!rec)return;const row=$('homeList').querySelectorAll('[data-home-id]');const el=[...row].find(x=>key(x.dataset.homeId)===key(id));if(!el)return;let target=el.querySelector('.home-info');if(target){target.remove();return;}
 target=document.createElement('div');target.className='home-info';target.style.width='100%';target.innerHTML=`<b>${esc(rec.name)}：血統の引き継ぎ</b><p class="muted">父：${esc(rec.fatherId)} ／ 母：${esc(rec.motherId)}。親血統から判明した祖先${rec.ancestry.length}/${rec.ancestry.length>15?31:15}枠。自家製馬本人の因子は未判定です。${rec.lineageAssumed?'子系統は父系からの推定で、ゲーム表示とは照合していません。':''}</p><div class="audit-table-wrap"><table><thead><tr><th>位置</th><th>祖先馬</th><th>因子</th><th>子系統</th></tr></thead><tbody>${rec.ancestry.map(a=>`<tr><td>${esc(a.path)}</td><td>${esc(a.horse)}</td><td>${esc((a.factors||[]).join('・')||'—')}</td><td>${esc(a.line||'—')}</td></tr>`).join('')}</tbody></table></div>`;el.after(target);
}
function editHomebred(id){const rec=state.homebreds.find(h=>key(h.id)===key(id));if(!rec)return;const el=[...$('homeList').querySelectorAll('[data-home-id]')].find(x=>key(x.dataset.homeId)===key(id));if(!el)return;let target=el.querySelector('.home-edit');if(target){target.remove();return;}target=document.createElement('div');target.className='home-edit';target.innerHTML=`<div class="home-fields"><label>区分<select class="plan-input" data-home-field="mode"><option value="draft" ${rec.mode==='draft'?'selected':''}>仮馬</option><option value="real" ${rec.mode==='real'?'selected':''}>実際に生産</option></select></label><label>SP（実測、任意）<input class="plan-input" data-home-field="sp" value="${esc(rec.sp||'')}"></label><label>ST（実測、任意）<input class="plan-input" data-home-field="st" value="${esc(rec.st||'')}"></label><label class="wide">メモ<textarea class="plan-textarea" data-home-field="note">${esc(rec.note||'')}</textarea></label></div><div class="btnrow topgap"><button class="btn small" data-home-commit="${esc(id)}">記録を更新</button></div>`;el.after(target);
}
function updateHomebred(id){const rec=state.homebreds.find(h=>key(h.id)===key(id));if(!rec)return;const edit=[...$('homeList').querySelectorAll('.home-edit')].find(e=>key(e.previousElementSibling?.dataset.homeId||'')===key(id));if(!edit)return;for(const f of ['sp','st','note','mode'])rec[f]=edit.querySelector(`[data-home-field="${f}"]`)?.value||'';rec.updatedAt=nowISO();persist();renderHomebreds();refreshHomePlanDetail();$('homeSaveStatus').textContent=`${rec.name}の記録を更新しました。`;
}


// v0.9 — explicit dependency DAG for the nine-generation-draft steps.
// A saved offspring is a HYPOTHETICAL horse, not an actual game breeding result.
// Every calculation relies solely on documented sire positions of selected parents.
const CHAIN09_DEF=[
 {n:1,sireSlot:'g3',mareInput:true,output:'A1牡',sex:'male'},
 {n:2,sireStep:1,mareInput:true,output:'A2牡',sex:'male'},
 {n:3,sireSlot:'g4',mareInput:true,output:'B1牡',sex:'male'},
 {n:4,sireStep:3,mareInput:true,output:'B2牡',sex:'male'},
 {n:5,sireSlot:'g5',mareInput:true,output:'C1牡',sex:'male'},
 {n:6,sireStep:5,mareInput:true,output:'C2牝',sex:'female'},
 {n:7,sireInput:true,mareStep:6,output:'C3牝',sex:'female'},
 {n:8,sireStep:4,mareStep:7,output:'最終M牝',sex:'female'},
 {n:9,sireStep:2,mareStep:8,output:'最終候補',sex:'male'}
];
function chain09Data(p){if(!p.chain09||typeof p.chain09!=='object')p.chain09={};
 const ch=p.chain09;if(!ch.mares||typeof ch.mares!=='object')ch.mares={};
 if(!ch.outputs||typeof ch.outputs!=='object')ch.outputs={};
 if(!ch.xId)ch.xId=p.routeDraft?.xSire||'';
 if(!['male','female'].includes(ch.finalSex))ch.finalSex='male';
 return ch;
}
function chain09ExpectedSex(p,n){return n===9?chain09Data(p).finalSex:CHAIN09_DEF[n-1].sex;}
function chain09Output(p,n){
 if(!n||n>9)return {horse:null};
 const ch=chain09Data(p),id=ch.outputs[n];
 const linked=id?state.homebreds.find(h=>key(h.id)===key(id)):null;
 const fallback=!id?state.homebreds.filter(h=>h.planId===p.id&&Number(h.stepNo)===n).slice(-1)[0]:null;
 const horse=linked||fallback;
 if(!horse)return {horse:null,reason:id?'登録済み産駒が見つかりません':'産駒未登録'};
 if(horse.planId!==p.id||Number(horse.stepNo)!==n)return {horse:null,reason:'別の計画・工程の馬が割り当てられています'};
 if(horse.sex!==chain09ExpectedSex(p,n))return {horse:null,reason:'登録した産駒の性別が工程の条件と異なります'};
 // Only an offspring of the CURRENT parents is a valid linked output.
 const pair=chain09Parents(p,n);
 if(!pair.sireId||!pair.mareId)return {horse:null,reason:'前工程または親馬の指定が変更されています'};
 if(key(horse.fatherId)!==key(pair.sireId)||key(horse.motherId)!==key(pair.mareId))return {horse:null,reason:'親馬が変更されています。別の仮馬を作成してください'};
 return {horse,reason:''};
}
function chain09Parents(p,n){
 const def=CHAIN09_DEF[n-1],ch=chain09Data(p),slots=p.routeDraft?.slots||{};
 const depS=def.sireStep?chain09Output(p,def.sireStep):null;
 const depM=def.mareStep?chain09Output(p,def.mareStep):null;
 const sireId=def.sireSlot?(slots[def.sireSlot]||''):def.sireStep?(depS?.horse?.id||''):(ch.xId||'');
 const mareId=def.mareStep?(depM?.horse?.id||''):(ch.mares[n]||'');
 const problems=[];
 if(def.sireStep&&!depS?.horse)problems.push(`工程${def.sireStep}の有効な産駒が必要`);
 if(def.mareStep&&!depM?.horse)problems.push(`工程${def.mareStep}の有効な産駒が必要`);
 if(!sireId)problems.push(def.sireInput?'補助種牡馬Xを指定':'父馬が未確定');
 if(!mareId)problems.push(def.mareInput?'基礎繁殖牝馬を指定':'母馬が未確定');
 const sire=findParentHorse(sireId),mare=findParentHorse(mareId);
 if(sireId&&!sire)problems.push('父馬がマスター未登録');
 if(mareId&&!mare)problems.push('母馬がマスター未登録');
 if(sire&&horseSex(sire)!=='male')problems.push('父馬は牡馬である必要があります');
 if(mare&&horseSex(mare)!=='female')problems.push('母馬は牝馬である必要があります');
 if(sire&&mare&&key(sire.id)===key(mare.id))problems.push('同じ馬を父母に指定できません');
 if(sire?.isHomebred&&sire.id.startsWith('自家製:')&&state.homebreds.some(h=>h.id===sire.id&&h.planId===p.id&&Number(h.stepNo)>=n))problems.push('この工程以降の自家製馬は親にできません');
 if(mare?.isHomebred&&mare.id.startsWith('自家製:')&&state.homebreds.some(h=>h.id===mare.id&&h.planId===p.id&&Number(h.stepNo)>=n))problems.push('この工程以降の自家製馬は親にできません');
 if(sire&&!sire.ancestry?.length)problems.push('父の公開血統が未登録');
 if(mare&&!mare.ancestry?.length)problems.push('母の公開血統が未登録');
 let ped=null;
 if(sire&&mare&&horseSex(sire)==='male'&&horseSex(mare)==='female'){
  ped=getFoalPedigree(sire,mare);
  if(ped.known<31)problems.push(`祖先${ped.known}/31枠：不足している血統を確認`);
  if(ped.conflicts.length)problems.push('祖先位置の矛盾あり');
 }
 return {sireId,mareId,sire,mare,ped,problems,ready:problems.length===0};
}
function chain09Summary(p){
 let linked=0,ready=0,stale=0,remaining=[];
 for(let n=1;n<=9;n++){
  const pair=chain09Parents(p,n), out=chain09Output(p,n);
  if(out.horse)linked++;
  else if(out.reason&&out.reason!=='産駒未登録')stale++;
  if(pair.ready&&!out.horse){ready++;remaining.push(n);}
 }
 return {linked,ready,stale,remaining};
}
// The next unfinished stage (not necessarily the next available one). This keeps the
// user in numbered order and exposes missing parents instead of silently skipping them.
function chain09NextUnfinished(p,start=1){
 for(let n=Math.max(1,start);n<=9;n++)if(!chain09Output(p,n).horse)return n;
 for(let n=1;n<Math.max(1,start);n++)if(!chain09Output(p,n).horse)return n;
 return null;
}
function chain09MoveTo(root,n,notice=''){
 const target=n?root.querySelector(`[data-chain-tile="${n}"]`):root.querySelector('.chain-final')||root.querySelector('.chain-summary');
 if(!target)return;
 target.classList.add('chain-current');
 if(notice){const hint=document.createElement('p');hint.className='chain-jump-note';hint.textContent=notice;
  const heading=target.querySelector('.chain-title');if(heading)heading.after(hint);else target.prepend(hint);}
 requestAnimationFrame(()=>{target.scrollIntoView({behavior:'smooth',block:'start'});});
}
function chain09FinalAudit(p){
 const last=chain09Output(p,9);
 if(!last.horse)return '';
 const pair=chain09Parents(p,9);if(!pair.ready||!pair.ped)return '';
 const expected=[['SSS','g3'],['DSSS','g4'],['DDDSS','g5']];
 const rows=new Map(pair.ped.rows.map(r=>[r.path,r]));let matches=0;
 const details=expected.map(([path,g])=>{
  const a=rows.get(path),id=p.routeDraft?.slots?.[g]||'',original=routeSnapshotMember(id,p);
  if(!original)return {path,ok:false,msg:'基礎種牡馬が未登録'};
  const have=(a?.factors||[]).slice().sort().join('|'),want=(original.factors||[]).slice().sort().join('|');
  const ok=key(a?.name)===key(original.name||splitName(id).name)&&have===want&&!!want;
  if(ok)matches++;
  return {path,ok,msg:`${a?.name||'不明'} [${(a?.factors||[]).join('・')||'因子未確認'}] ／ 指定 ${id}`};
 });
 return `<div class="chain-final"><b>最終仮馬の祖先・因子照合：${matches}/3箇所一致</b><p class="chain-note">5代血統：${pair.ped.known}/31枠、同名祖先の重複${pair.ped.repeats.length}種類／独立クロス候補${pair.ped.crossCheck.candidates.length}種類／派生重複${pair.ped.crossCheck.inherited.length}種類。各指定位置と因子を比較しました。</p>${details.map(x=>`<div class="chain-state">${x.ok?'✓':'要確認'} ${esc(x.path)}：${esc(x.msg)}</div>`).join('')}<div class="notice warn"><b>ゲーム内の「至高の配合」成立確定ではありません。</b> 全兄弟姉妹や特殊条件、公式BCでの能力は別途ゲーム内で確認してください。SP/ST・合格ラインの予想値も未計算です。</div></div>`;
}
function renderChain09(p){
 if(!p.routeDraft?.slots||!p.steps||p.steps.length<9)return `<div class="card"><h3>v0.9｜9工程を自動連結</h3><p class="muted">この機能は「9工程の仮ルート」を生成した保存プランで使用できます。既存プランを削除する必要はありません。</p></div>`;
 const ch=chain09Data(p),ss=chain09Summary(p);
 const mareOpts=[...mareRows(),...getHomeParents('female')].map(r=>`<option value="${esc(r.id)}"></option>`).join('');
 const sireOpts=[...maleRows(),...getHomeParents('male')].map(r=>`<option value="${esc(r.id)}"></option>`).join('');
 let body=`<div class="card"><h3>v1.1｜9工程の血統を自動で連結</h3><p class="muted">登録済みのP1〜R2と補助種牡馬Xを使って仮馬を生成します。<b>順番に進める</b>場合は作成後に次の工程へ移動し、<b>一括連結</b>では親の揃った工程を1→9の順で自動生成します。途中で親馬が不足していればそこで止まります。生成する馬はすべて<b>未生産の計画上の仮馬</b>です。</p><div class="chain-summary"><b>有効な連結 ${ss.linked}/9工程</b> ／ 次に生成できる工程 ${ss.ready}件 ／ 再確認が必要 ${ss.stale}件<br><span class="chain-note">後から親を変更した場合は影響を受ける工程の仮馬を再生成します。古い仮馬の記録は削除されません。</span></div><div class="chain-actions"><button class="btn small ghost" id="chain09GoNext">次の未完了工程へ移動</button><button class="btn small" id="chain09AutoAll" ${ss.linked===9?'disabled':''}>残りを1→9で一括仮連結</button></div><p id="chain09Status" class="chain09-status" role="status" aria-live="polite"></p><datalist id="chainMareList09">${mareOpts}</datalist><datalist id="chainSireList09">${sireOpts}</datalist><div class="chain-grid">`;
 for(const d of CHAIN09_DEF){
  const pair=chain09Parents(p,d.n),out=chain09Output(p,d.n),status=out.horse?'次工程へ連結済み':pair.ready?'親が揃いました。仮馬を作成できます':pair.problems.join(' ／ ');
  const cls=out.horse?'ok':out.reason&&out.reason!=='産駒未登録'?'stale':'';
  const sireCtrl=d.sireInput?`<input data-chain-edit="sire" data-chain-no="${d.n}" list="chainSireList09" value="${esc(ch.xId||'')}" placeholder="種牡馬Xを選ぶ">`:`<div class="chain-parent-static">${esc(pair.sireId||'前工程待ち')}</div>`;
  const mareCtrl=d.mareInput?`<input data-chain-edit="mare" data-chain-no="${d.n}" list="chainMareList09" value="${esc(ch.mares[d.n]||'')}" placeholder="繁殖牝馬名を入力">`:`<div class="chain-parent-static">${esc(pair.mareId||'前工程待ち')}</div>`;
  const outcome=out.horse?`<strong>${esc(out.horse.name)}</strong> ${chip(out.horse.mode==='real'?'実馬':'仮馬','warn')}`:out.reason&&out.reason!=='産駒未登録'?`<span class="pill-status">${esc(out.reason)}</span>`:'未登録';
  body+=`<div class="chain-tile ${cls}" data-chain-tile="${d.n}"><div class="chain-title">工程${d.n}｜${esc(p.steps[d.n-1]?.title||d.output)}</div><div class="chain-parents"><label>父（種牡馬）${sireCtrl}</label><label>母（繁殖牝馬）${mareCtrl}</label></div><div class="chain-state">${esc(status)}</div><div class="chain-output">産駒：${outcome}</div>`;
  if(d.n===9)body+=`<label class="chain-note">最終仮馬の性別 <select data-chain-edit="sex"><option value="male" ${ch.finalSex==='male'?'selected':''}>牡馬</option><option value="female" ${ch.finalSex==='female'?'selected':''}>牝馬</option></select></label>`;
  body+=`<div class="btnrow"><button class="btn small ghost" data-chain-preview="${d.n}" ${pair.sire&&pair.mare?'':'disabled'}>血統を確認</button><button class="btn small" data-chain-generate="${d.n}" ${pair.ready&&!out.horse?'':'disabled'}>${out.reason&&out.reason!=='産駒未登録'?'再作成して次へ':'仮馬を作成→次へ'}</button></div></div>`;
 }
 body+='</div>'+chain09FinalAudit(p)+'<div id="chain09Preview" class="chain-note"></div><p class="chain-note">配合理論・能力の自動保証は未実装。各工程のSP/ST最低許容値は従来どおり未設定で、入力した実測値だけ記録します。生成済みの仮馬は「自家製馬」タブで血統・親子関係を確認できます。</p></div>';
 return body;
}
function chain09Message(root,msg){let node=root.querySelector('#chain09Preview');if(node){node.innerHTML=`<div class="notice warn">${esc(msg)}</div>`;node.scrollIntoView({block:'nearest'});}}
function makeChain09Foal(p,n){
 const pair=chain09Parents(p,n),already=chain09Output(p,n);
 if(!pair.ready)return {error:'この工程は親馬・血統が揃っていません：'+pair.problems.join('、')};
 if(already.horse)return {error:'この工程はすでに有効な産駒が連結されています。'};
 const sex=chain09ExpectedSex(p,n),ped=pair.ped;
 if(!ped||ped.known!==31)return {error:'血統が31枠に満たないため生成しません。'};
 const short=String(p.title||'計画').replace(/[^\p{L}\p{N}ー]/gu,'').slice(0,12)||'配合';
 let idx=1,name;do{name=`${short}・工程${n}・仮${idx++}`;}while(state.homebreds.some(h=>key(h.id)===key(homeId(name))));
 const now=nowISO();const ancestors=ped.rows.filter(r=>r.path.length<=5&&r.name).map(a=>({path:a.path,horse:a.name,factors:[...(a.factors||[])],line:a.line||'',factorVariant:a.factorVariant||''}));
 const rec={id:homeId(name),name,sex,mode:'draft',sp:'',st:'',fatherId:pair.sireId,motherId:pair.mareId,ancestry:ancestors,factors:[],lineage:pair.sire.lineage||'',lineageAssumed:!!pair.sire.lineage,planId:p.id,stepNo:n,note:'v0.9 連結プランで生成した未生産の仮馬。ゲーム内で未確認。',createdAt:now,updatedAt:now};
 state.homebreds.push(rec);const ch=chain09Data(p),old=ch.outputs[n];ch.outputs[n]=rec.id;p.updatedAt=now;
 if(!persist()){state.homebreds.pop();if(old)ch.outputs[n]=old;else delete ch.outputs[n];return {error:'保存に失敗しました。空き容量を確認してください。'};}
 return {horse:rec};
}
function setupChainPlanner09(el,p){const root=el.querySelector('#chainPlanner09');if(!root)return;
 const rerender=(message='')=>{
  root.innerHTML=renderChain09(p);
  renderReview12(p);renderProductionGuide13(p);renderCompare12();
  const status=root.querySelector('#chain09Status');if(status)status.textContent=message;
 };
 rerender();
 root.addEventListener('change',e=>{
  const t=e.target,edit=t.dataset.chainEdit;if(!edit)return;
  const ch=chain09Data(p),n=Number(t.dataset.chainNo);
  if(edit==='mare'&&n>=1&&n<=6)ch.mares[n]=t.value.trim();
  else if(edit==='sire'&&n===7)ch.xId=t.value.trim();
  else if(edit==='sex')ch.finalSex=t.value;
  else return;
  p.updatedAt=nowISO();persist();
  // Defer the replacement of the focused input to avoid reentrant change/blur DOM updates.
  setTimeout(()=>{if(root.isConnected)rerender();},0);
 });
 root.addEventListener('click',e=>{
  if(e.target.closest('#chain09GoNext')){
   const next=chain09NextUnfinished(p);
   if(next){chain09MoveTo(root,next,'ここから続きを作成してください。');}
   else chain09MoveTo(root,null,'9工程すべて連結済みです。');
   return;
  }
  if(e.target.closest('#chain09AutoAll')){
   const next=chain09NextUnfinished(p);
   if(next===null){rerender('9工程すべて連結済みです。');chain09MoveTo(root,null);return;}
   if(!confirm('未完了の工程を1→9の順に仮馬で連結します。途中で親の指定・血統が不足している場合は停止します。実際のゲームでは生産しません。よろしいですか？'))return;
   let created=0,stopAt=null,reason='';
   for(let n=1;n<=9;n++){
    if(chain09Output(p,n).horse)continue;
    const result=makeChain09Foal(p,n);
    if(result.error){stopAt=n;reason=result.error;break;}
    created++;
   }
   const finish=chain09NextUnfinished(p);
   const info=finish===null?`一括仮連結：${created}工程を生成しました。全9工程の連結が完了しました。`:
    `一括仮連結：${created}工程を生成し、工程${stopAt||finish}で停止しました。${reason}`;
   rerender(info);refreshHomePlanDetail();
   if(finish!==null)chain09MoveTo(root,stopAt||finish,created?'ここで停止しました。入力を確認して再開できます。':'必要な親馬・血統を確認してください。');
   else chain09MoveTo(root,null,'連結が完了しました。最終血統を確認してください。');
   return;
  }
  const btn=e.target.closest('button[data-chain-generate],button[data-chain-preview]');if(!btn)return;
  const preview=btn.dataset.chainPreview!==undefined,n=Number(preview?btn.dataset.chainPreview:btn.dataset.chainGenerate);
  const pair=chain09Parents(p,n);
  if(preview){if(!pair.sire||!pair.mare){chain09Message(root,'父母を入力してください。');return;}
   const report=root.querySelector('#chain09Preview');report.innerHTML=`<h4>工程${n}：血統の確認</h4>${renderPairReport(pair.sire,pair.mare)}`;report.scrollIntoView({block:'nearest'});return;}
  const result=makeChain09Foal(p,n);
  if(result.error){rerender(`工程${n}：${result.error}`);chain09MoveTo(root,n,'内容を確認してください。');return;}
  const next=chain09NextUnfinished(p,n+1);
  const message=next?`工程${n}の仮馬を登録しました。次は工程${next}です。`:`工程${n}の仮馬を登録しました。9工程すべて連結済みです。`;
  rerender(message);refreshHomePlanDetail();
  chain09MoveTo(root,next,next?'次はこの工程です。':'最終血統を確認してください。');
 });
}


// v1.0: Research-only what-if 9-step pedigree comparison.
// No ability-point, nitro bonus or '至高成立' assertions are made.
const OPT10_MARE_STEPS=[1,2,3,4,5,6];
const OPT10_SP_FACTORS=['短','速','走'];
const OPT10_ST_FACTORS=['長','中'];
function opt10Self(r){return (r.ancestry||[]).length>=15;}
function opt10MarePool(p,scope){
 const fav=state.mareFavorites||{};
 const selected=new Set(Object.values(chain09Data(p).mares||{}).map(key));
 const needFav=scope==='fav'||scope==='fav_meihin';
 const onlyMeihin=scope==='meihin'||scope==='fav_meihin';
 const base=mareRows().filter(r=>opt10Self(r)&&(!needFav||fav[key(r.id)])&&(!onlyMeihin||mareRank12(r).value==='名牝'));
 // The source index treats entries without a distance field as broodmares;
 // this is a source convention and does not establish game ownership.
 const goal=p.goal||'balanced';
 const entry=r=>{
   const a=r.ancestry||[],fs=a.flatMap(x=>x.factors||[]),lines=a.map(x=>canonicalLine(x.line));
   const sp=fs.filter(f=>OPT10_SP_FACTORS.includes(f)).length,
         st=fs.filter(f=>OPT10_ST_FACTORS.includes(f)).length,
         sl=lines.filter(l=>BONUS_SPEED.has(l)).length,tl=lines.filter(l=>BONUS_STAMINA.has(l)).length;
   const score=goal==='speed'?sp*2+sl+st:goal==='stamina'?st*2+tl+sp:sp+st+sl+tl;
   return {r,score};
 };
 let data=base.map(entry).sort((a,b)=>b.score-a.score||Number(!!fav[key(b.r.id)])-Number(!!fav[key(a.r.id)])||a.r.id.localeCompare(b.r.id,'ja'));
 // Bounded pool for responsive on-device search. Always include already selected mares.
 const pool=data.slice(0,36).map(x=>x.r);
 for(const x of data){if(selected.has(key(x.r.id))&&!pool.some(r=>key(r.id)===key(x.r.id)))pool.push(x.r);}
 return {pool,eligible:data.length};
}
function opt10XPool(p){
 const anchor=new Set(Object.values(p.routeDraft?.slots||{}).map(id=>key(splitName(id).name)));
 const current=chain09Data(p).xId||p.routeDraft?.xSire||'';
 const pool=maleRows().filter(r=>isOwned(r)&&opt10Self(r)&&!anchor.has(key(r.name)))
   .map(r=>({r,s:(r.ancestry||[]).filter(a=>BONUS_SPEED.has(canonicalLine(a.line))||BONUS_STAMINA.has(canonicalLine(a.line))).length}));
 pool.sort((a,b)=>b.s-a.s||a.r.id.localeCompare(b.r.id,'ja'));
 let out=pool.slice(0,28).map(x=>x.r);
 const chosen=map.get(key(current));
 if(chosen&&isOwned(chosen)&&horseSex(chosen)==='male'&&opt10Self(chosen)&&!out.some(x=>key(x.id)===key(current)))out.unshift(chosen);
 return {pool:out,eligible:pool.length};
}
function opt10Trial(p,choices,xId){
 const slots=p.routeDraft?.slots||{},outputs={};
 const selected=[];
 for(let n=1;n<=9;n++){
  const d=CHAIN09_DEF[n-1];
  const sire=d.sireSlot?routeSnapshotMember(slots[d.sireSlot],p):d.sireStep?outputs[d.sireStep]:findParentHorse(xId);
  const mare=d.mareStep?outputs[d.mareStep]:map.get(key(choices[n]||''));
  if(!sire||!mare||horseSex(sire)!=='male'||horseSex(mare)!=='female'||!opt10Self(sire)||!opt10Self(mare))return null;
  const ped=getFoalPedigree(sire,mare);
  if(ped.conflicts.length||ped.known!==31)return null;
  const childName='計画内仮馬'+n;
  outputs[n]={id:'__trial'+n,name:childName,sex:d.sex,ancestry:ped.rows.filter(x=>x.path.length<=5&&x.name).map(x=>({path:x.path,horse:x.name,factors:x.factors,line:x.line,factorVariant:x.factorVariant||''})),factors:[],lineage:sire.lineage||'',distance:d.sex==='male'?'仮馬':'',isHomebred:true};
  selected.push(ped);
 }
 const final=selected[8];
 const byPath=new Map(final.rows.map(x=>[x.path,x]));
 const anchors=[['SSS',slots.g3],['DSSS',slots.g4],['DDDSS',slots.g5]];
 const matches=anchors.filter(([path,id])=>{
  const r=routeSnapshotMember(id,p),a=byPath.get(path);
  return r&&a&&key(a.name)===key(r.name||splitName(id).name)
    &&JSON.stringify([...a.factors].sort())===JSON.stringify([...(r.factors||[])].sort());
 }).length;
 const cnt=Object.fromEntries(final.factorCounts),sp=OPT10_SP_FACTORS.reduce((v,f)=>v+(cnt[f]||0),0),
 st=OPT10_ST_FACTORS.reduce((v,f)=>v+(cnt[f]||0),0),
 spL=final.rows.filter(x=>x.path.length>=4&&BONUS_SPEED.has(canonicalLine(x.line))).length,
 stL=final.rows.filter(x=>x.path.length>=4&&BONUS_STAMINA.has(canonicalLine(x.line))).length;
 const baseName=key(splitName(slots.g3||'').name);
 const extra=final.crossCheck.candidates.filter(x=>key(x.name)!==baseName);
 // This is an arbitrary, transparent SORT INDEX, never an SP/ST effect formula.
 const idx=p.goal==='speed'?sp*2+st+spL*2+stL
           :p.goal==='stamina'?st*2+sp+stL*2+spL
           :sp+st+spL+stL;
 const risk=extra.filter(x=>x.paths.some(path=>path.length<=3)).length;
 return {choices:{...choices},xId,full:final,finalSire:outputs[2],finalMare:outputs[8],sp,st,spL,stL,extra,idx:idx-risk*2,matches,risk};
}
function opt10Sort(a,b){
 // Full specified positions first, then a research sorting index, then fewer early overlaps.
 return b.matches-a.matches||b.idx-a.idx||a.risk-b.risk||a.extra.length-b.extra.length;
}
function opt10UniqueKey(t){return OPT10_MARE_STEPS.map(n=>key(t.choices[n])).join('|')+'|'+key(t.xId);}
function opt10Find(p,scope){
 const mares=opt10MarePool(p,scope),x=opt10XPool(p),ch=chain09Data(p);
 const obstacles=[];
 if(!mares.pool.length)obstacles.push('対象ランクで血統15枠の揃った繁殖牝馬が見つかりません。名牝の区分を繁殖牝馬タブで確認・登録するか、探索範囲を変更してください。');
 if(!x.pool.length)obstacles.push('血統が揃う所持種牡馬Xがありません。所持チェックを確認してください。');
 if(obstacles.length)return {scope,results:[],tests:0,mares:mares.eligible,x:x.eligible,message:obstacles.join(' ')};
 let evalCount=0;const cache=new Map();
 function evaluate(choices,xId){const k=OPT10_MARE_STEPS.map(n=>key(choices[n]||'')).join('|')+'|'+key(xId);if(cache.has(k))return cache.get(k);evalCount++;const r=opt10Trial(p,choices,xId);cache.set(k,r);return r;}
 const options=mares.pool.map(r=>r.id),xopts=x.pool.map(r=>r.id),seeds=[],seen=new Set();
 // Include current choices in the starts without treating them as validated/optimal.
 for(let seed=0;seed<4;seed++){
  const chs={};for(let i=0;i<OPT10_MARE_STEPS.length;i++){
   const n=OPT10_MARE_STEPS[i],chosen=ch.mares[n];
   chs[n]=seed===0&&options.includes(chosen)?chosen:options[(seed*7+i*3)%options.length];
  }
  // avoid selecting identical listed mares for multiple generation steps where possible
  for(let i=0;i<OPT10_MARE_STEPS.length;i++){
   const n=OPT10_MARE_STEPS[i];
   if(OPT10_MARE_STEPS.slice(0,i).some(k=>key(chs[k])===key(chs[n]))){
    chs[n]=options.find(o=>!OPT10_MARE_STEPS.slice(0,i).some(k=>key(chs[k])===key(o)))||chs[n];
   }
  }
  const initialX=seed===0&&xopts.includes(ch.xId)?ch.xId:xopts[seed%xopts.length];
  let best=evaluate(chs,initialX);if(!best)continue;
  let current={choices:{...chs},xId:initialX};
  for(let round=0;round<2;round++){
   for(const n of OPT10_MARE_STEPS){
    let local=best,cid=current.choices[n];
    for(const id of options){
     if(OPT10_MARE_STEPS.some(other=>other!==n&&key(current.choices[other])===key(id)))continue;
     const test=evaluate({...current.choices,[n]:id},current.xId);
     if(test&&opt10Sort(test,local)<0){local=test;cid=id;}
    }
    current.choices[n]=cid;best=local;
   }
   let local=best,chosen=current.xId;
   for(const id of xopts){const test=evaluate(current.choices,id);if(test&&opt10Sort(test,local)<0){local=test;chosen=id;}}
   current.xId=chosen;best=local;
  }
  if(best){const k=opt10UniqueKey(best);if(!seen.has(k)){seeds.push(best);seen.add(k);}}
 }
 seeds.sort(opt10Sort);
 return {scope,results:seeds.slice(0,3),tests:evalCount,mares:mares.eligible,x:x.eligible,
  message:seeds.length?'':'候補の5代血統が不完全で、最後まで計算できる組み合わせがありません。'};
}
function opt10SaveProposal(p,result,index){
 if(!result||result.matches!==3)return {error:'指定3頭の位置または因子が一致しない候補は保存できません。'};
 const duplicate=JSON.parse(JSON.stringify(p)),now=nowISO();
 duplicate.id=uid();duplicate.createdAt=now;duplicate.updatedAt=now;
 duplicate.title=p.title.replace(/（研究案\d+）$/,'').slice(0,110)+`（研究案${index+1}）`;
 duplicate.status='構想';
 const ch=chain09Data(duplicate);ch.outputs={};ch.mares={...result.choices};ch.xId=result.xId;
 duplicate.routeDraft.xSire=result.xId;
 const x=map.get(key(result.xId));if(x)duplicate.routeDraft.xSireSnapshot={id:x.id,name:x.name,variant:x.variant,lineage:x.lineage,factors:x.factors,ancestry:x.ancestry};
 const slots=duplicate.routeDraft.slots,mares=result.choices;
 const texts=[`${slots.g3} × ${mares[1]} → A1牡`,`A1牡 × ${mares[2]} → A2牡`,`${slots.g4} × ${mares[3]} → B1牡`,`B1牡 × ${mares[4]} → B2牡`,`${slots.g5} × ${mares[5]} → C1牡`,`C1牡 × ${mares[6]} → C2牝`,`${result.xId} × C2牝 → C3牝`,'B2牡 × C3牝 → 最終繁殖牝馬M','A2牡 × M牝 → 公式BC候補'];
 (duplicate.steps||[]).slice(0,9).forEach((s,i)=>{s.cross=texts[i];s.done=false;s.minSP='';s.minST='';s.result='';});
 duplicate.note=(duplicate.note?duplicate.note+'\n':'')+
  `【v1.0研究案】公開血統による暫定比較。SP参考因子群${result.sp}、ST参考因子群${result.st}、SP/ST対象子系統${result.spL}/${result.stL}。真のニトロ、至高成立、SP/ST能力値、繁殖牝馬の所持可否は未確認。`;
 duplicate.research10={createdAt:now,sortIndex:result.idx,summary:{sp:result.sp,st:result.st,spL:result.spL,stL:result.stL,otherCrosses:result.extra.length},sourcePlanId:p.id};
 state.plans.unshift(duplicate);
 if(!persist()){state.plans.shift();return {error:'保存に失敗しました。データ管理でバックアップを確認してください。'};}
 return {id:duplicate.id};
}
function opt10RenderRoot(p){
 if(!p.routeDraft?.slots||p.steps?.length<9)return '<div class="optimize10"><h3>v1.0｜繁殖牝馬の配合候補比較</h3><p class="muted">9工程の仮ルートを生成した保存プランで使用できます。</p></div>';
 return `<section class="optimize10" aria-label="研究用配合候補探索"><h3>v1.0｜繁殖牝馬P1〜R2と種牡馬Xの候補を一括比較</h3>
 <p class="muted">現在の9工程を<b>変更せず</b>、公開血統から最終産駒まで仮想計算します。候補を残すときだけ<b>別の保存プラン</b>にします。権利数0の所持種牡馬も含めます。</p>
 <div class="opt10-tools"><label>繁殖牝馬の探索範囲<select id="opt10Scope"><option value="meihin" selected>名牝だけ（確認済み）</option><option value="fav_meihin">研究候補に登録した名牝だけ</option><option value="all">公開繁殖牝馬（ランク制限なし）</option><option value="fav">研究候補に登録した牝馬（ランク制限なし）</option></select></label><button class="btn" id="opt10Run">候補の比較を実行</button></div>
 <p class="muted">名牝判定は過去の公開一覧と、繁殖牝馬タブで手動登録した区分を使用。<b>ランク未確認の牝馬は名牝限定検索に含めません。</b>最新のゲーム内ランクは必要に応じて登録してください。</p>
 <div class="opt10-warning">保存済みの旧研究案は、自動で名牝限定に置き換えません。今回は新規探索のP1〜R2を名牝で絞り込めます。
 これは<b>研究用の部分探索</b>です。ゲームのニトロ計算・特殊な至高成立判定・能力予測式とは異なります。繁殖牝馬を実際に所持しているか、入手できるかは未確認です。因子と子系統の数字が多くても最強馬を保証しません。</div>
 <div id="opt10Result" aria-live="polite"><div class="opt10-empty">「候補の比較を実行」を押すと、上位案を表示します。</div></div></section>`;
}
function opt10RenderResults(data,p){
 if(!data.results.length)return `<div class="opt10-empty">${esc(data.message||'対象がありません。')}</div>`;
 return `<p class="opt10-strip"><b>繁殖牝馬条件：${esc(data.scope==='meihin'?'名牝のみ':data.scope==='fav_meihin'?'登録済み名牝のみ':'ランク制限なし')}</b><br>探索対象：公開牝馬 ${data.mares}頭・所持種牡馬X ${data.x}頭／実際に試算した組み合わせ ${data.tests}通り。候補の一部から絞り込む方式で、全組み合わせの総当たりではありません。</p>
 ${data.results.map((r,i)=>`<article class="opt10-choice"><div class="line between"><strong>研究案 ${i+1}</strong><span class="muted">旧暫定指数 ${r.idx}（有効クロス因子の順位ではありません）</span></div>
 <div class="opt10-grid"><div class="opt10-metric"><b>${r.sp} / ${r.st}</b><small>短・速・走 ／ 長・中 の因子位置数</small></div>
 <div class="opt10-metric"><b>${r.spL} / ${r.stL}</b><small>4〜5代 SP/ST研究対象子系統の位置数</small></div>
 <div class="opt10-metric"><b>${r.matches}/3</b><small>指定3頭の位置・因子一致／追加同名祖先${r.extra.length}件</small></div></div>
 <div class="opt10-pairs">${OPT10_MARE_STEPS.map((n,i)=>`<div><b>${['P1','P2','Q1','Q2','R1','R2'][i]}</b>：${esc(r.choices[n])}</div>`).join('')}<div><b>補助X</b>：${esc(r.xId)}</div><div><b>最終血統</b>：${r.full.known}/31 枠</div></div>
 <details class="details"><summary>因子別・クロスの内訳</summary><div class="metrics">${r.full.factorCounts.map(([f,n])=>chip(`${f} ×${n}`)).join('')}</div><p class="opt10-strip">独立した追加クロス候補：${esc(r.extra.map(x=>`${x.name}（${x.paths.join('/')}）`).join('、')||'なし')}。追加クロスは不成立や有利不利を直接示すものではありません。</p></details>
 <div class="btnrow topgap"><button class="btn small" data-opt10-save="${i}">この研究案を別プランに保存</button></div></article>`).join('')}
 <p class="opt10-strip">指数の計算：目的に応じた指定因子群の位置数と4〜5代の研究対象子系統を重み付けし、近い代での追加同名祖先があれば減点。<b>当アプリ内で案を並べるためだけの任意の指標</b>です。工程1〜7は血統継承が優先、工程8の繁殖牝馬・工程9の本番産駒についてはゲーム内の解析でSP/STを厳選してください。根拠のない数値基準は設定しません。</p>`;
}
function setupOptimizer10(el,p){
 const root=el.querySelector('#routeOptimizer10');if(!root)return;
 root.innerHTML=opt10RenderRoot(p);
 const run=root.querySelector('#opt10Run');if(!run)return;
 let results=[];
 run.onclick=()=>{
  const display=root.querySelector('#opt10Result');display.innerHTML='<p class="opt10-loading">血統候補を比較しています…</p>';
  // Schedule computation for next frame so the progress message is rendered first.
  requestAnimationFrame(()=>setTimeout(()=>{
   try{const data=opt10Find(p,root.querySelector('#opt10Scope').value);results=data.results;display.innerHTML=opt10RenderResults(data,p);}
   catch(e){display.innerHTML=`<div class="opt10-warning">候補比較でエラーが発生しました。${esc(e.message)}</div>`;}
  },0));
 };
 root.addEventListener('click',e=>{
  const btn=e.target.closest('[data-opt10-save]');if(!btn)return;
  const index=Number(btn.dataset.opt10Save),item=results[index];if(!item)return;
  const ok=opt10SaveProposal(p,item,index);
  if(!ok.error){const np=getPlan(ok.id);if(np){np.research10.mareScope=root.querySelector('#opt10Scope').value;np.research10.mareGradesAtSave={...state.mareGrades};persist();}}
  if(ok.error){alert(ok.error);return;}
  showPlanEditor(ok.id);
 });
}




// v1.8: Study-backed decision aid. This is NOT the game's SP/ST/nitro formula.
// Source: 2026-03-15 ふふ牧場 research and 2026-06-30 こーら牧場 BC record.
// Race course and distance govern choice of speed/stamina emphasis.
const BC18_GOALS={
 speed:{name:'短距離・スピード重視',target:'4代目のSP研究対象子系統を優先、走5・中5を目標',factors:['短','速','走','中']},
 balance:{name:'万能・合計能力重視',target:'4代目にSP/ST系統を適切に配分、走5・中5を目標',factors:['短','速','長','走','中']},
 stamina:{name:'中長距離・スタミナ重視',target:'4代目のST研究対象子系統を優先、中4以上を目標',factors:['長','中','底']}
};
function prep18PairWeight(pair,goal='balance'){
 // Tie-breaking/ordering of pair choices ONLY, not an ability estimate.
 const count=f=>pair.factors.filter(x=>x===f).length;
 if(goal==='speed')return count('走')*5+count('短')*4+count('速')*3+count('中')*2+count('雷');
 if(goal==='stamina')return count('中')*5+count('長')*4+count('底')*2+count('走');
 return count('走')*4+count('中')*4+count('速')*3+count('長')*3+count('短')*2+count('底');
}
function prep18SortPairs(items,goal){return [...items].sort((a,b)=>prep18PairWeight(b,goal)-prep18PairWeight(a,goal)||a.name.localeCompare(b.name,'ja')||a.id.localeCompare(b.id,'ja'));}
function prep18Review(t,goal='balance'){
 const cfg=BC18_GOALS[goal]||BC18_GOALS.balance;
 const rows=t.final.rows;
 const countFactor=(d,f)=>rows.filter(r=>r.path.length===d).reduce((n,r)=>n+(r.factors||[]).filter(x=>x===f).length,0);
 const lineCount=(d,set)=>rows.filter(r=>r.path.length===d&&set.has(canonicalLine(r.line))).length;
 const metrics=[
  ['4代目SP研究系統',lineCount(4,BONUS_SPEED)],['4代目ST研究系統',lineCount(4,BONUS_STAMINA)],
  ['5代目SP研究系統',lineCount(5,BONUS_SPEED)],['5代目ST研究系統',lineCount(5,BONUS_STAMINA)]
 ];
 const factorKinds=['短','速','長','走','中','底','雷'];
 const whole=Object.fromEntries(factorKinds.map(f=>[f,countFactor(4,f)+countFactor(5,f)]));
 const summary=['短','速','長','走','中'].map(f=>`<span class="p18-factor">${esc(f)}<b>${whole[f]||0}</b><small>祖先位置数（参考）</small></span>`).join('');
 const badges=metrics.map(([label,count])=>`<div class="r12-metric"><strong>${count}</strong><span>${label}</span></div>`).join('');
 const advice=goal==='speed'? '短距離の実例では、SP優先・雷因子によるST低下を許容した例があります。ただし他の距離では同じ選択が有利とは限りません。':
 goal==='stamina'?'長・中と4代目ST系統を優先。ただし相性・能力の高い肌馬・ゲノム解析を欠かさないでください。':
 'スピードだけでなくSTと合計値を比較。4代目SP/ST系統のバランスと高能力肌馬を優先。';
 return `<div class="p18-review"><h4>v1.8｜公式BC配合研究・目標との照合</h4>
 <p class="r12-foot"><b>${esc(cfg.name)}</b>：${esc(cfg.target)}。${esc(advice)}</p>
 <div class="p18-metrics">${badges}</div>
 <p class="r12-foot"><b>4・5代目の因子位置数（参考）</b>：実際のニトロの数値ではありません。同じ祖先の重複・因名を正しく整理したニトロの確定計算は未実装です。</p>
 <div class="p18-factors">${summary}</div>
 <p class="r12-foot">研究資料ではニトロの目安として短10・速20・長9・走5・中5などが示されていますが、この祖先位置数とは算定方法が違うため、達成判定はしていません。</p>
 <p class="r12-foot">至高成立、因名別の有効クロス、ニトロ、子系統の期待値は<strong>別指標</strong>です。素体の最大値・ゲノム解析と対象BCのコース・距離で最終選定してください。4代目子系統を優先する考え方と走・中の目標は研究者の推奨であり、実ゲームの確定ボーナス値ではありません。</p>
 <details class="r12-details"><summary><b>参考にした上位牧場の配合研究・実践例</b></summary>
 <p class="r12-foot"><a href="https://note.com/huh_ds/n/nda77b134971b" target="_blank" rel="noopener">ふふ牧場：子系統を意識した配合の組み方（2026/3）</a>―4代目に強いボーナス系統、5代目の効き方には不確実性があるという研究。</p>
 <p class="r12-foot"><a href="https://note.com/huh_ds/n/n0eb8a439d3f3" target="_blank" rel="noopener">ふふ牧場：ダビマス備忘録</a>―ニトロの段階・走中因子・肌馬素体・至高条件の検証。</p>
 <p class="r12-foot"><a href="https://note.com/taroimon/n/n869ee61fe6cb" target="_blank" rel="noopener">こーら牧場：第74回公式BC高松宮記念の配合・結果（2026/6）</a>―コースに合わせてSP/ST目標と因子を見直した優勝事例。</p>
 <p class="r12-foot"><a href="https://www.dabimasu.work/entry/2026/06/26/112109" target="_blank" rel="noopener">ぐー牧場：ヒズマジェスティ至高の配合（2026/6）</a>―肌の仕込み、ボーナス子系統、異なるクロス設計の実例。</p>
 </details></div>`;
}

// v1.7: Optional four preliminary broodmares (4 preparatory matings + 9 fixed matings).
// Inserts TWO additional named-stallion crosses without displacing the 3x4x5 anchor.
// Does not claim that a homebred mare herself has factors: only her named sire enters the pedigree.
// All outputs are hypothetical and kept separate from the source plan.
const PREP17_SLOTS=[
 {name:'P1',step:1,side:'父系4代目',path:'SSDS',group:'B',which:'left'},
 {name:'P2',step:2,side:'父系3代目',path:'SDS',group:'A',which:'left'},
 {name:'Q1',step:3,side:'母系5代目',path:'DSSDS',group:'A',which:'right'},
 {name:'R2',step:6,side:'母系5代目',path:'DDDDS',group:'B',which:'right'}
];
function prep17PairChoices(p){
 const anchorNames=new Set(Object.values(p.routeDraft?.slots||{}).map(x=>key(splitName(x).name)));
 const grouped=new Map();
 for(const r of maleRows()){
  if(!isOwned(r)||!r.variant||!Array.isArray(r.factors)||r.factors.length!==3||!(r.ancestry||[]).length||anchorNames.has(key(r.name)))continue;
  const k=key(r.name);if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(r);
 }
 const results=[];
 for(const group of grouped.values())for(const a of group)for(const b of group){
  if(key(a.id)===key(b.id)||key(a.variant)===key(b.variant))continue;
  const factors=[...a.factors,...b.factors],sp=factors.filter(f=>['短','速','走'].includes(f)).length,st=factors.filter(f=>['長','中','底'].includes(f)).length;
  results.push({id:a.id+'|'+b.id,name:a.name,a,b,sp,st,factors});
 }
 return results.sort((a,b)=>b.sp-a.sp||b.st-a.st||a.name.localeCompare(b.name,'ja'));
}
function prep17Selection(p){const items=prep17PairChoices(p);
 const pick=(horse,variants)=>items.find(x=>x.name===horse&&variants.every((s,i)=>x[i?'b':'a'].variant===s))?.id;
 const defA=pick('エルコンドルパサー',['央燕','翔瑚']);
 const defB=pick('アイアンリージ',['煌魂','龍闘']);
 const a=defA||items[0]?.id||'',b=(defB&&defB.split('|')[0].split('-')[0]!==a.split('|')[0].split('-')[0]?defB:items.find(x=>key(x.name)!==key((items.find(y=>y.id===a)||{}).name))?.id)||'';
 return {items,a,b};
}
function prep17Mare(sire,baseMare,tag){
 const ped=getFoalPedigree(sire,baseMare);
 if(ped.known!==31||ped.conflicts.length)return {error:`${tag}：基礎牝馬または種牡馬の血統が不足・矛盾しています（${ped.known}/31）`};
 const id='__prep17_'+tag;
 const mare={id,name:'準備'+tag+'牝',sex:'female',isHomebred:true,mode:'draft',fatherId:sire.id,motherId:baseMare.id,factors:[],lineage:sire.lineage||'',ancestry:ped.rows.filter(x=>x.name&&x.path.length<=5).map(x=>({path:x.path,horse:x.name,factors:[...x.factors],line:x.line,factorVariant:x.factorVariant||''}))};
 return {mare,ped};
}
function prep17Trial(p,selectedA,selectedB,choicePool=null,extra22=null){
 const choices=choicePool||prep17PairChoices(p),a=choices.find(x=>x.id===selectedA),b=choices.find(x=>x.id===selectedB);
 if(!a||!b)return {error:'所持済みの3因子・異因名2頭を、それぞれ2組選択してください。公開マスターの血統読込も必要です。'};
 if(key(a.name)===key(b.name))return {error:'2組の追加クロスには異なる種牡馬名を指定してください。'};
 const ch=chain09Data(p),parents={},preps={};
 const assigned={P1:b.a,P2:a.a,Q1:a.b,R2:b.b};
 let deep22=null;
 if(extra22){
  const c=choices.find(x=>x.id===extra22);
  if(!c||[a.name,b.name].some(name=>key(name)===key(c.name)))return {error:'3組目には既存の追加クロスと別名の異因名ペアを指定してください。'};
  const originalP1Id=p.deep22?.originalMares?.[1]||
   (p.prep17?.steps||[]).find(x=>x.targetStep===1)?.mother||ch.mares[1];
  const originalQ2Id=p.deep22?.originalMares?.[4]||
   (p.prep17?.steps||[]).find(x=>x.targetStep===4)?.mother||ch.mares[4];
  const originalP1=findParentHorse(originalP1Id),originalQ2=findParentHorse(originalQ2Id);
  if(!originalP1||!originalQ2)return {error:'本気型の追加仕込みに必要な元の名牝P1/Q2が見つかりません。'};
  const inner=prep17Mare(c.a,originalP1,'P1内側'),q2=prep17Mare(c.b,originalQ2,'Q2');
  if(inner.error||q2.error)return {error:inner.error||q2.error};
  deep22={pairC:c,originalMares:{1:originalP1Id,4:originalQ2Id},inner:{sire:c.a,base:originalP1,mare:inner.mare,path:'SSDDS'},q2:{sire:c.b,base:originalQ2,mare:q2.mare,path:'DSDS'}};
  preps[4]=q2.mare;
 }

 for(const slot of PREP17_SLOTS){
  // If opening an existing 13-stage saved plan, REPLACE its four preparation horses,
  // not layer a second four-horse preparation onto their descendants.
  const previous=(p.prep17?.steps||[]).find(x=>Number(x.targetStep)===slot.step);
  const baseId=deep22&&slot.name==='P1'?deep22.inner.mare.id:(p.deep22?.originalMares?.[slot.step]||previous?.mother||ch.mares[slot.step]||'');
  const base=deep22&&slot.name==='P1'?deep22.inner.mare:findParentHorse(baseId);
  if(!base||horseSex(base)!=='female')return {error:`${slot.name}の元になる繁殖牝馬が未指定・未登録です。現在の9工程で先に牝馬を設定してください。`};
  const built=prep17Mare(assigned[slot.name],base,slot.name);
  if(built.error)return {error:built.error};
  parents[slot.name]={sire:assigned[slot.name],base,mare:built.mare,path:slot.path};
  preps[slot.step]=built.mare;
 }
 const slots=p.routeDraft?.slots||{},outputs={};let final=null,finalSire=null,finalMare=null;
 for(let n=1;n<=9;n++){
  const d=CHAIN09_DEF[n-1];
  const sire=d.sireSlot?routeSnapshotMember(slots[d.sireSlot],p):d.sireStep?outputs[d.sireStep]:findParentHorse(ch.xId||p.routeDraft?.xSire||'');
  const mare=d.mareStep?outputs[d.mareStep]:preps[n]||findParentHorse(ch.mares[n]);
  if(!sire||!mare||horseSex(sire)!=='male'||horseSex(mare)!=='female')return {error:`通常工程${n}の親馬が見つからないか、牡牝の条件が合いません。`};
  const ped=getFoalPedigree(sire,mare);
  if(ped.known!==31||ped.conflicts.length)return {error:`通常工程${n}の血統が不完全です（${ped.known}/31）。祖先情報のある公開CSVが必要です。`};
  outputs[n]={id:'__prep17_foal_'+n,name:'追加クロス計画の仮馬'+n,sex:d.sex,isHomebred:true,factors:[],lineage:sire.lineage||'',ancestry:ped.rows.filter(x=>x.name&&x.path.length<=5).map(x=>({path:x.path,horse:x.name,factors:[...x.factors],line:x.line,factorVariant:x.factorVariant||''}))};
  final=ped;if(n===9){finalSire=sire;finalMare=mare;}
 }
 const byPath=new Map(final.rows.map(r=>[r.path,r]));
 const anchors=[['SSS','g3'],['DSSS','g4'],['DDDSS','g5']].map(([path,g])=>{
  const target=routeSnapshotMember(slots[g],p),r=byPath.get(path);
  return !!target&&key(target.name||splitName(slots[g]).name)===key(r?.name)&&JSON.stringify([...(target.factors||[])].sort())===JSON.stringify([...(r?.factors||[])].sort());
 });
 if(anchors.filter(Boolean).length!==3)return {error:'至高の指定3頭の血統位置が維持できません。別の組み合わせを選んでください。'};
 const cross=effectiveCrossFactors16(final.rows,p);
 const extras=cross.crosses.filter(c=>key(c.name)!==key(splitName(slots.g3||'').name));
 if(!extras.some(c=>key(c.name)===key(a.name))||!extras.some(c=>key(c.name)===key(b.name))){
  return {error:'指定した追加2組が独立クロス候補として成立しませんでした。別の組み合わせを選択してください。'};
 }
 if(deep22&&!extras.some(x=>key(x.name)===key(deep22.pairC.name)))return {error:'3組目の独立クロスが成立しませんでした。'};
 return {a,b,parents,deep22,final,finalSire,finalMare,anchors,cross,extras,totalStages:deep22?15:13,baseMares:{...ch.mares},xId:ch.xId||p.routeDraft?.xSire||''};
}
function prep17Render(p){
 if(!p.routeDraft?.slots||p.steps?.length<9)return '<section class="r12-card"><h3>v1.7｜多重クロス仕込み</h3><p>至高の9工程プランで利用できます。</p></section>';
 const eligible=prep17Selection(p);
 const opt=(id)=>prep18SortPairs(eligible.items,p.goal||'balance').map(x=>`<option value="${esc(x.id)}" ${id===x.id?'selected':''}>${esc(x.name)}〔${esc(x.a.variant)} × ${esc(x.b.variant)}〕・${x.sp}SP系／${x.st}ST系・所持済</option>`).join('');
 const old=p.prep17?.steps||[];
 return `<section class="r12-card" aria-label="至高配合の追加仕込み"><h3>v2.0｜追加2クロスの仕込み牝馬（4工程追加）</h3>
 <p class="r12-foot"><b>ディープ3×4×5は固定</b>。4頭の自家製牝馬を先に作り、既存の9工程へ接続する13工程プランを別保存します。自家製牝馬本人が3因子になるという意味ではなく、<b>3因子種牡馬を牝馬の父として祖先に仕込む</b>方法です。</p>
 <label class="p18-goal-label">公式BCの目標<select id="prep18Goal" class="plan-input"><option value="balance" ${p.goal!=='speed'&&p.goal!=='stamina'?'selected':''}>万能・合計能力</option><option value="speed" ${p.goal==='speed'?'selected':''}>短距離・スピード優先</option><option value="stamina" ${p.goal==='stamina'?'selected':''}>中長距離・スタミナ優先</option></select></label>
 <p class="r12-foot">この選択は因子構成を参考順に並べ替え、試算結果に研究上の評価を表示します。実際のSP/ST・公式BC勝率を予測するものではありません。</p>
 <div class="r12-cols"><div><b>追加A：3×5</b><p class="r12-foot">父系P2の父（SDS） × 母系Q1の父（DSSDS）</p><label>同名・異因名の種牡馬<select id="prep17A" class="plan-input">${opt(eligible.a)}</select></label></div>
 <div><b>追加B：4×5</b><p class="r12-foot">父系P1の父（SSDS） × 母系R2の父（DDDDS）</p><label>別名の異因名種牡馬<select id="prep17B" class="plan-input">${opt(eligible.b)}</select></label></div></div>
 <p class="r12-foot">対象は所持チェック済みで、各馬に3因子・詳細血統がある異因名の組のみ。権利数0も除外しません。ディープは追加クロス対象から除外。元の6頭の繁殖牝馬、補助Xは現プランの設定を継承します。</p>
 ${p.prep17?`<div class="notice"><b>このプランには仕込み工程が登録済みです：</b> ${esc(old.map(x=>x.label+' '+x.father+' × '+x.mother).join('／'))}<p class="r12-foot">まだゲーム内で生産したという意味ではありません。</p></div>`:''}
 <section class="p19-autoplacement" aria-label="所持種牡馬の自動配置">
 <h4>v2.0｜所持種牡馬から自動配置</h4>
 <p class="r12-foot">選択中の公式BC目標に合わせて、<b>所持済みの異因名ペアを全候補から組み合わせ</b>、父系・母系の4枠を自動試算します。至高3×4×5と元の繁殖牝馬6頭・補助Xは固定。権利数は判定に使いません。</p>
 <button class="btn small" id="prep19Optimize" type="button">取得済み種牡馬から配置を自動探索</button>
 <div id="prep19Results" class="p19-results" aria-live="polite"></div>
 </section>
 <div class="btnrow"><button class="btn small ghost" id="prep17Preview">13工程を試算</button><button class="btn small" id="prep17Save" disabled>試算した13工程を別プランに保存</button></div><div id="prep17Result" aria-live="polite"></div></section>`;
}
function prep17Report(p,t,goal=p.goal||'balance'){
 if(t.error)return `<div class="r12-warn">${esc(t.error)}</div>`;
 const wanted=t.extras.filter(c=>[key(t.a.name),key(t.b.name)].includes(key(c.name)));
 const list=PREP17_SLOTS.map(slot=>{
  const r=t.parents[slot.name];return `<div><b>準備${esc(slot.name)}牝：</b>${esc(r.sire.id)} × ${esc(r.base.id)} → 牝馬を作り、通常工程${slot.step}で使用（${slot.side}：${slot.path}）</div>`;
 }).join('');
 const counted=Object.entries(t.cross.frequency).map(([k,n])=>chip(`${k} ×${n}`)).join('');
 return `<div class="r12-cols"><div class="r12-metric"><strong>${t.cross.total}${t.cross.complete?'':'+'}</strong><span>判明した独立クロス因子（下限の場合あり）</span></div><div class="r12-metric"><strong>${t.cross.independentCount}組</strong><span>独立クロス候補（うち追加${t.extras.length}組）</span></div></div>
 <div class="r12-pills">${counted}</div><p class="r12-foot">追加された独立クロス候補：${esc(t.extras.map(c=>`${c.name}（${c.paths.join('・')}）`).join('／'))}</p>
 <details class="r12-details" open><summary><b>先に生産する仕込み牝馬4頭</b></summary>${list}</details>
 <p class="r12-foot"><b>その後の通常9工程</b>：P1/P2/Q1/R2を仕込み牝馬へ置き換え、元の至高ルートを進めます。ディープ3・4・5代の指定位置は3/3一致。最終産駒の種牡馬祖先 ${t.final.known}/31枠。</p>
 ${t.cross.uncertain.length?`<div class="r12-warn">因名未確認の祖先が${t.cross.uncertain.length}枠あるため、表示因子は下限です。</div>`:''}
 ${prep18Review(t,goal)}
 ${renderGamePedigree20(t.finalSire,t.finalMare,t.final,p)}
 <div class="r12-warn"><b>注意：</b>これは血統の事前シミュレーションで、ゲーム内成立・有効因子・SP/STを保証しません。至高の全兄弟姉妹の除外条件と体質・相性を別途確認。権利数は探索条件にも評価点にも使いません。実際に生産するときだけ必要な権利を用意してください。</div>`;
}
function prep17Save(p,t,goal=p.goal||'balance'){
 if(t.error||!t.parents)return {error:'保存できる試算がありません。'};
 const copy=JSON.parse(JSON.stringify(p)),now=nowISO();copy.id=uid();copy.createdAt=now;copy.updatedAt=now;
 copy.title=(p.title||'至高の配合').replace(/（研究案\d+）$/,'').slice(0,105)+(t.deep22?'（追加3クロス・15工程）':'（追加2クロス・13工程）');copy.status='構想';copy.goal=goal;
 delete copy.autoPlacement19;
 if(t.auto19){copy.autoPlacement19={createdAt:now,sourcePlanId:p.id,goal:t.auto19.goal,score:t.auto19.score,tested:t.auto19.tested,valid:t.auto19.valid,metrics:t.auto19.metrics};}
 const cp=chain09Data(copy);cp.outputs={};
 copy.prep17={sourcePlanId:p.id,createdAt:now,pairA:[t.a.a.id,t.a.b.id],pairB:[t.b.a.id,t.b.b.id],steps:[],expectedCrosses:t.extras.map(x=>x.name),researchGoal:goal,theory:'未確認'};
 copy.production13={genomes:{},theory:'未確認'};
 for(const s of copy.steps.slice(0,9)){s.done=false;s.minSP='';s.minST='';s.result='';}
 const names={1:'P1',2:'P2',3:'Q1',6:'R2'},records=[];
 if(t.deep22){
  copy.deep22={sourcePlanId:p.id,createdAt:now,pairC:[t.deep22.pairC.a.id,t.deep22.pairC.b.id],originalMares:{...t.deep22.originalMares},extraCross:t.deep22.pairC.name};
  const r=t.deep22.inner,name='仕込みP1内側_'+copy.id.slice(0,8),id=homeId(name);
  records.push({id,name,sex:'female',mode:'draft',sp:'',st:'',note:'15工程：P1の母方5代目に追加クロスCを置くための内側仕込み。',fatherId:r.sire.id,motherId:r.base.id,
   ancestry:r.mare.ancestry.map(x=>({...x})),factors:[],lineage:r.sire.lineage||'',lineageAssumed:!!r.sire.lineage,planId:copy.id,stepNo:null,createdAt:now,updatedAt:now});
  copy.prep17.steps.push({label:'P1内側',father:r.sire.id,mother:r.base.id,foal:id,targetStep:0,path:r.path,done:false});
  copy.deep22.innerFoal=id;
 }

 for(const step of [1,2,3,6]){
  const tag=names[step],r=t.parents[tag],name='仕込み'+tag+'_'+copy.id.slice(0,8),id=homeId(name);
  const sourceMother=t.deep22&&tag==='P1'?copy.deep22.innerFoal:r.base.id;
  const record={id,name,sex:'female',mode:'draft',sp:'',st:'',note:`v2.2 追加クロス仕込み。元の繁殖牝馬：${t.deep22&&tag==='P1'?t.deep22.originalMares[1]:r.base.id}。自家製牝馬本人に因子を保証しない。`,fatherId:r.sire.id,motherId:sourceMother,
   ancestry:r.mare.ancestry.map(x=>({...x})),factors:[],lineage:r.sire.lineage||'',lineageAssumed:!!r.sire.lineage,planId:copy.id,stepNo:null,createdAt:now,updatedAt:now};
  records.push(record);cp.mares[step]=id;
  copy.prep17.steps.push({label:tag,father:r.sire.id,mother:sourceMother,foal:id,targetStep:step,path:r.path,done:false});
 }
 if(t.deep22){
  const r=t.deep22.q2,name='仕込みQ2_'+copy.id.slice(0,8),id=homeId(name);
  records.push({id,name,sex:'female',mode:'draft',sp:'',st:'',note:'15工程：Q2の父系4代目に追加クロスCを置く。',fatherId:r.sire.id,motherId:r.base.id,
   ancestry:r.mare.ancestry.map(x=>({...x})),factors:[],lineage:r.sire.lineage||'',lineageAssumed:!!r.sire.lineage,planId:copy.id,stepNo:null,createdAt:now,updatedAt:now});
  cp.mares[4]=id;
  copy.prep17.steps.push({label:'Q2',father:r.sire.id,mother:r.base.id,foal:id,targetStep:4,path:r.path,done:false});
 }
 const slots=copy.routeDraft.slots,x=cp.xId,mares=cp.mares;
 const texts=[`${slots.g3} × ${mares[1]} → A1牡`,`A1牡 × ${mares[2]} → A2牡`,`${slots.g4} × ${mares[3]} → B1牡`,`B1牡 × ${mares[4]} → B2牡`,`${slots.g5} × ${mares[5]} → C1牡`,`C1牡 × ${mares[6]} → C2牝`,`${x} × C2牝 → C3牝`,'B2牡 × C3牝 → M牝','A2牡 × M牝 → 公式BC候補'];
 copy.steps.slice(0,9).forEach((s,i)=>{s.cross=texts[i];});
 copy.note=(copy.note?copy.note+'\n':'')+(copy.autoPlacement19?`【v1.9自動配置】目標${copy.autoPlacement19.goal}・研究用評価${copy.autoPlacement19.score}。ゲーム内能力値ではない。\n`:'')+(t.deep22?'【v2.2】準備6工程で3独立追加クロスを狙う計15工程。':'【v1.9】準備4工程で計13工程。')+'仮馬は生産済みではない。至高成立・クロス効果・能力・全兄弟条件は未確認。';
 state.plans.unshift(copy);state.homebreds.push(...records);
 if(!persist()){state.plans.shift();state.homebreds.splice(-records.length);return {error:'データの保存に失敗しました。バックアップを確認してください。'};}
 return {id:copy.id};
}

// v1.9 — finite, reproducible optimization of the FOUR preparatory SIRE slots only.
// No purchased rights, race result, game nitro, or gamete factors are inferred.
// Base six mares, X sire and the deep 3x4x5 anchor stay fixed.
const PREP19_MAX_TRIALS=1800;
function prep19Score(t,goal='balance'){
 const freq=t.cross.frequency, f=k=>freq[k]||0;
 const rows=t.final.rows;
 const byGen=(depth,set)=>rows.filter(r=>r.path.length===depth&&set.has(canonicalLine(r.line))).length;
 const sp4=byGen(4,BONUS_SPEED),st4=byGen(4,BONUS_STAMINA),sp5=byGen(5,BONUS_SPEED),st5=byGen(5,BONUS_STAMINA);
 const factor4_5=Object.fromEntries(['短','速','長','走','中','底'].map(k=>[k,rows.filter(r=>r.path.length>=4&&r.path.length<=5).reduce((n,r)=>n+(r.factors||[]).filter(x=>x===k).length,0)]));
 // Pure RESEARCH ranking weights, not in-game SP/ST increases or verified nitro coefficients.
 const weights={
  speed:{'短':1.0,'速':3.0,'長':0.7,'走':4.5,'中':3.3,'底':0.1,'雷':-.6},
  balance:{'短':0.7,'速':2.7,'長':2.5,'走':4.5,'中':4.5,'底':0.35,'雷':-.7},
  stamina:{'短':-.5,'速':0.9,'長':3.5,'走':1.8,'中':4.8,'底':0.5,'雷':-1.1}
 }[goal]||null;
 const w=weights||{'短':0.7,'速':2.7,'長':2.5,'走':4.5,'中':4.5,'底':0.35,'雷':-.7};
 const crossPart=Object.entries(freq).reduce((a,[k,n])=>a+n*(w[k]??0),0);
 const linePart=goal==='speed'?sp4*4+st4*.8+sp5*1.1+st5*.2:
  goal==='stamina'?st4*4+sp4*.7+st5*1.1+sp5*.2:
  sp4*3.2+st4*3.2+sp5*.8+st5*.8+Math.min(sp4,st4)*1.5;
 // Factor positions are supporting evidence only. Do not call this a nitro calculation.
 const desired=goal==='speed'?['速','走','中']:goal==='stamina'?['長','中']:['速','長','走','中'];
 const positionPart=desired.reduce((a,k)=>a+Math.min(8,factor4_5[k]||0)*.15,0);
 const uncertain=t.cross.uncertain.length,conflicts=t.cross.conflicts.length;
 const riskPart=uncertain*2.5+conflicts*10;
 const independent=t.cross.independentCount;
 const bonusPart=Math.max(0,independent-1)*2;
 const score=crossPart+linePart+positionPart+bonusPart-riskPart;
 return {score:Math.round(score*10)/10,sp4,st4,sp5,st5,factor4_5,
  crossPart:Math.round(crossPart*10)/10,linePart:Math.round(linePart*10)/10,
  independent,uncertain,conflicts,frequency:{...freq}};
}
function prep19Optimize(p,goal='balance',maxTrials=PREP19_MAX_TRIALS){
 if(!p.routeDraft?.slots)return {results:[],tested:0,valid:0,message:'至高3×4×5の指定が必要です。'};
 const pool=prep17PairChoices(p);
 if(!pool.length)return {results:[],tested:0,valid:0,message:'所持済みの異因名ペアが見つかりません。公開CSV・所持チェックを確認してください。'};
 const grouped=new Map();for(const pair of pool){const k=key(pair.name);if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(pair);}
 if(grouped.size<2)return {results:[],tested:0,valid:0,message:'追加2クロスには別名の種牡馬ペアが2組必要です。取得済みの異因名ペアを確認してください。'};
 const results=[];let tested=0,valid=0;
 // Full enumeration until the published safety limit. Keep iteration deterministic for reproducibility.
 outer:for(const a of pool){for(const b of pool){
  if(key(a.name)===key(b.name))continue;
  if(tested>=maxTrials)break outer;
  tested++;
  const t=prep17Trial(p,a.id,b.id,pool);
  if(t.error)continue;
  valid++;
  const metrics=prep19Score(t,goal);
  results.push({pairA:a.id,pairB:b.id,a,b,metrics,trial:t});
 }}
 results.sort((a,b)=>b.metrics.score-a.metrics.score||b.trial.cross.total-a.trial.cross.total||
  b.metrics.sp4-a.metrics.sp4||a.pairA.localeCompare(b.pairA,'ja')||a.pairB.localeCompare(b.pairB,'ja'));
 // Keep 5 distinct unordered pair-combinations / orientations when possible;
 // include same-name combo with reversed factor variants when it actually scores differently.
 return {results:results.slice(0,5),tested,valid,eligible:pool.length,limited:tested>=maxTrials,
  message:valid?'':`${tested}配置を試しましたが、至高3×4×5と追加2クロスを維持できる候補がありませんでした。`};
}
// v2.2: bounded extension of existing two-cross search by a third independent named cross.
// C sire (left) enters as P1's maternal fifth-gen ancestor SSDDS; C sire (right)
// enters maternal-side Q2 at DSDS (fourth gen). Both are within the FINAL foal's
// 5-generation sire ancestor slots. Only add the two extra production matings if
// all three named crosses remain independent and the research objective improves.
function deep22Optimize(plan,goal='balance',baseFound=null){
 const basics=baseFound||prep19Optimize(plan,goal,450),pool=prep17PairChoices(plan);
 const baseline=basics.results[0]||null;
 if(!baseline)return {best:null,base:baseline,tested:0,valid:0,message:'13工程の基準案が成立しません。'};
 let best=null,tested=0,valid=0;
 for(const seed of basics.results){
  for(const c of pool){
   if([seed.a.name,seed.b.name].some(x=>key(x)===key(c.name)))continue;
   tested++;
   const trial=prep17Trial(plan,seed.pairA,seed.pairB,pool,c.id);
   if(trial.error||trial.cross.independentCount<4)continue;
   if(trial.anchors.filter(Boolean).length!==3||trial.final.known!==31)continue;
   // A 3rd cross should increase known effective factors; not just increase matings.
   if(trial.cross.total<=seed.trial.cross.total)continue;
   const metrics=prep19Score(trial,goal);valid++;
   const item={trial,metrics,seed,c};
   if(!best||metrics.score>best.metrics.score||(metrics.score===best.metrics.score&&trial.cross.total>best.trial.cross.total))best=item;
  }
 }
 const gain=best?Math.round((best.metrics.score-baseline.metrics.score)*10)/10:0;
 return {base:baseline,best:best&&gain>0?best:null,tested,valid,gain,
  message:best&&gain>0?`3組目の独立クロスを追加し、研究指数が${gain.toFixed(1)}改善しました。`:
  `追加${tested}配置を検討しましたが、改善を確認できず13工程を採用します。`};
}
function prep19Render(result,goal){
 if(result.message&&!result.results.length)return `<div class="r12-warn">${esc(result.message)}</div>`;
 const limited=result.limited?'（上限到達・部分探索）':'（候補内を全探索）';
 const list=result.results.map((r,i)=>{
  const m=r.metrics,counts=Object.entries(m.frequency).filter(([k])=>['短','速','長','走','中'].includes(k)).map(([k,n])=>`${k}${n}`).join('・');
  return `<div class="p19-choice"><div class="p19-choice-main"><b>候補${i+1}｜研究用評価 ${m.score.toFixed(1)}</b>
   <p class="r12-foot">追加A 3×5：${esc(r.a.a.id)} ／ ${esc(r.a.b.id)}</p>
   <p class="r12-foot">追加B 4×5：${esc(r.b.a.id)} ／ ${esc(r.b.b.id)}</p>
   <p class="r12-foot">独立クロス${m.independent}組・判明クロス因子${r.trial.cross.total}個 ｜ ${esc(counts)} ｜ 4代目SP/ST ${m.sp4}/${m.st4}・5代目 ${m.sp5}/${m.st5}${m.uncertain?' ／ 因名未確認'+m.uncertain+'枠':''}</p></div>
   <button type="button" class="btn small ghost" data-p19-apply="${i}">この配置を試算</button></div>`;
 }).join('');
 return `<p class="r12-foot"><b>自動配置の結果：</b>${result.tested}通り試算・${result.valid}通り適合・上位${result.results.length}案 ${limited}。異因名ペア${result.eligible}組を対象。元のプランは未変更です。</p>
 <div class="p19-list">${list}</div>
 <p class="r12-foot">評価点は<b>ゲームの能力値ではありません</b>。独立クロスの判明因子を中心に、4代目のSP/ST系統、5代目の系統、因子位置数を参考加点しています。ニトロの段階・兄弟姉妹の成立阻害・実際の肌馬能力は未判定です。複製保存するまではプランを変更しません。</p>`;
}
function setupPrep17(el,p){const root=el.querySelector('#prep17');if(!root)return;if(p.hard23){root.innerHTML='';return;}
 root.innerHTML=prep17Render(p);
 const a=root.querySelector('#prep17A'),b=root.querySelector('#prep17B'),goal=root.querySelector('#prep18Goal'),preview=root.querySelector('#prep17Preview'),save=root.querySelector('#prep17Save'),out=root.querySelector('#prep17Result'),auto=root.querySelector('#prep19Optimize'),autoOut=root.querySelector('#prep19Results');
 if(!a||!b||!goal)return;let trial=null;
 const invalidate=()=>{trial=null;save.disabled=true;out.innerHTML='';};a.onchange=invalidate;b.onchange=invalidate;
 goal.onchange=()=>{const left=a.value,right=b.value;
  const sorted=prep18SortPairs(prep17PairChoices(p),goal.value);
  for(const select of [a,b]){select.innerHTML=sorted.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}〔${esc(x.a.variant)} × ${esc(x.b.variant)}〕・${x.sp}SP系／${x.st}ST系・所持済</option>`).join('');}
  a.value=left;b.value=right;invalidate();autoOut.innerHTML='';};
 preview.onclick=()=>{try{trial=prep17Trial(p,a.value,b.value);out.innerHTML=prep17Report(p,trial,goal.value);save.disabled=!!trial.error;}catch(e){trial=null;out.innerHTML='<div class="r12-warn">試算エラー：'+esc(e.message)+'</div>';save.disabled=true;}};
 auto.onclick=()=>{try{
  const found=prep19Optimize(p,goal.value);
  autoOut.innerHTML=prep19Render(found,goal.value);
  autoOut.querySelectorAll('[data-p19-apply]').forEach(button=>button.onclick=()=>{
   const chosen=found.results[Number(button.dataset.p19Apply)];if(!chosen)return;
   a.value=chosen.pairA;b.value=chosen.pairB;
   if(a.value!==chosen.pairA||b.value!==chosen.pairB){autoOut.insertAdjacentHTML('afterbegin','<div class="r12-warn">候補の選択に失敗しました。再読込して確認してください。</div>');return;}
   trial=chosen.trial;trial.auto19={goal:goal.value,score:chosen.metrics.score,tested:found.tested,valid:found.valid,metrics:{...chosen.metrics}};out.innerHTML=prep17Report(p,trial,goal.value);save.disabled=false;
   out.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
 }catch(e){autoOut.innerHTML='<div class="r12-warn">自動探索エラー：'+esc(e.message)+'</div>';}};

 save.onclick=()=>{if(!trial||trial.error)return;const result=prep17Save(p,trial,goal.value);if(result.error){out.innerHTML='<div class="r12-warn">'+esc(result.error)+'</div>';return;}showPlanEditor(result.id);};
}

// v1.2: compare CURRENT FINAL 9-step bloodlines. No game-stat formula is implied.
const R12_SUMMARY_FACTORS=['短','速','走','長','中','底'];
function reviewMetrics12(p){
 const linked=p?.routeDraft?.slots?chain09Summary(p).linked:0;
 if(linked<9)return {ready:false,linked,reason:`連結済み ${linked}/9工程。残りの仮馬を連結すると、最新の最終血統を比較できます。`};
 const out=chain09Output(p,9),pair=chain09Parents(p,9);
 if(!out.horse||!pair.ready||!pair.ped||pair.ped.known!==31||pair.ped.conflicts.length)return {ready:false,linked,reason:'最終工程の父母または血統に変更・欠落があります。工程9の血統を再確認してください。'};
 const ped=pair.ped,rows=ped.rows,depths={};for(let d=1;d<=5;d++)depths[d]=rows.filter(r=>r.path.length===d);
 const freq=Object.fromEntries(ped.factorCounts),sum=(fs)=>fs.reduce((n,k)=>n+(freq[k]||0),0);
 const groupSP=sum(['短','速','走']),groupST=sum(['長','中']),bottom=freq['底']||0;
 const fourthFifth=rows.filter(r=>r.path.length===4||r.path.length===5);
 const eligibleSP=fourthFifth.filter(r=>BONUS_SPEED.has(canonicalLine(r.line)));
 const eligibleST=fourthFifth.filter(r=>BONUS_STAMINA.has(canonicalLine(r.line)));
 const kindsSP=[...new Set(eligibleSP.map(r=>canonicalLine(r.line)))].sort();
 const kindsST=[...new Set(eligibleST.map(r=>canonicalLine(r.line)))].sort();
 const spByDepth=[4,5].map(d=>eligibleSP.filter(r=>r.path.length===d).length);
 const stByDepth=[4,5].map(d=>eligibleST.filter(r=>r.path.length===d).length);
 const targets=[['SSS','g3'],['DSSS','g4'],['DDDSS','g5']];const byPath=new Map(rows.map(r=>[r.path,r]));
 const anchors=targets.map(([path,slot])=>{
  const wantedId=p.routeDraft.slots[slot],wanted=routeSnapshotMember(wantedId,p),seen=byPath.get(path);
  const sameName=!!wanted&&key(seen?.name)===key(wanted.name||splitName(wantedId).name);
  const sameFactors=!!wanted&&JSON.stringify((seen?.factors||[]).slice().sort())===JSON.stringify((wanted.factors||[]).slice().sort());
  return {path,wantedId,seen:seen?.name||'',ok:sameName&&sameFactors&&!!(wanted?.factors||[]).length};
 });
 const missingFactorPositions=rows.filter(r=>r.name&&!(r.factors||[]).length).length;
 return {ready:true,linked,ped,rows,depths,freq,groupSP,groupST,bottom,eligibleSP,eligibleST,kindsSP,kindsST,spByDepth,stByDepth,
  anchors,anchorCount:anchors.filter(a=>a.ok).length,missingFactorPositions,
  repeats:ped.repeats,crossCheck:ped.crossCheck,effective16:effectiveCrossFactors16(rows,p),foalId:out.horse.id,planId:p.id,title:p.title};
}
function reviewFactorChips12(m){return R12_SUMMARY_FACTORS.map(f=>chip(`${f} ×${m.freq[f]||0}`)).join('')+
 Object.entries(m.freq).filter(([f])=>!R12_SUMMARY_FACTORS.includes(f)).map(([f,n])=>chip(`${f} ×${n}`)).join('');}
function crossPairs12(m){
 // Repeated ancestor is NOT synonymous with a beneficial cross, and positions may be all from one side.
 return m.repeats.map(x=>({name:x.name,paths:x.paths.slice(),patterns:[...new Set(x.paths.flatMap((a,i)=>x.paths.slice(i+1).map(b=>[a.length,b.length].sort((m,n)=>m-n).join('×'))))]}));
}
function renderReview12(p){
 const target=$('review12');if(!target)return;const m=reviewMetrics12(p);
 if(!p.routeDraft?.slots||!p.steps||p.steps.length<9){target.innerHTML='';return;}
 if(!m.ready){target.innerHTML=`<section class="r12-card"><h3>v1.2｜完成血統の検証レポート</h3><p class="r12-foot">${esc(m.reason)} 既存の保存プランや仮馬は変更しません。</p></section>`;return;}
 const crosses=crossPairs12(m);
 const stat=(v,caption)=>`<div class="r12-metric"><strong>${esc(v)}</strong><span>${esc(caption)}</span></div>`;
 target.innerHTML=`<section class="r12-card" aria-label="v1.2完成血統レポート"><h3>v1.2｜完成血統の検証レポート</h3>
 <p class="r12-foot">保存済み9工程の<b>現在有効な最終仮馬</b>から再計算しています。比較対象は祖先31枠（同じ名前の祖先も位置ごとに集計）。ゲーム内のニトロ・至高成立・SP/ST能力値ではありません。</p>
 <div class="r12-cols">${stat(`${m.ped.known}/31`,'種牡馬の祖先位置')}${stat(`${m.anchorCount}/3`,'指定3頭の位置・因子一致')}${stat(`${m.groupSP} / ${m.groupST}`,'短・速・走 ／ 長・中 の因子位置数')}${stat(`${m.eligibleSP.length} / ${m.eligibleST.length}`,'4〜5代の研究対象 SP/ST子系統位置数')}</div>
 ${renderCrossFactor16(m)}
 ${renderGamePedigree20(chain09Parents(p,9).sire,chain09Parents(p,9).mare,m.ped,p)}
 <h4>血統31枠の因子内訳（クロス有効数ではない）</h4><div class="r12-pills">${reviewFactorChips12(m)}</div>
 <div class="r12-table-wrap"><table class="r12-table"><thead><tr><th>対象</th><th>4代目</th><th>5代目</th><th>系統の種類数</th></tr></thead><tbody>
 <tr><td>SP研究対象系統</td><td>${m.spByDepth[0]}枠</td><td>${m.spByDepth[1]}枠</td><td>${m.kindsSP.length}種類</td></tr>
 <tr><td>ST研究対象系統</td><td>${m.stByDepth[0]}枠</td><td>${m.stByDepth[1]}枠</td><td>${m.kindsST.length}種類</td></tr></tbody></table></div>
 <details class="r12-details"><summary>研究対象の子系統名と位置を見る</summary><p class="r12-foot"><b>SP系統：</b>${esc(m.eligibleSP.map(r=>`${r.line}（${r.path}）`).join('、')||'該当なし')}</p><p class="r12-foot"><b>ST系統：</b>${esc(m.eligibleST.map(r=>`${r.line}（${r.path}）`).join('、')||'該当なし')}</p></details>
 <div class="r12-warn"><b>クロスの重複整理（研究上）</b>：独立した父母間クロス候補 ${m.crossCheck.candidates.length}種類〔${esc(m.crossCheck.candidates.map(x=>x.name).join('・')||'なし')}〕。同じ先行クロスに由来する祖先重複 ${m.crossCheck.inherited.length}種類〔${esc(m.crossCheck.inherited.map(x=>x.name+' ← '+x.via.join('・')).join('、')||'なし')}〕は追加クロスとして評価しません。ゲーム内の有効因子は未検証です。</div>
 <details class="r12-details"><summary>同名祖先の重複位置を見る（${crosses.length}種類・確定クロス数ではありません）</summary>${crosses.length?crosses.map(c=>`<div class="slot"><strong>${esc(c.name)}</strong><span>${esc(c.paths.join(' / '))} ／ 世代組合せ ${esc(c.patterns.join('、'))}</span></div>`).join(''):'<p class="r12-foot">判明した31枠に同名祖先の重複はありません。</p>'}</details>
 <details class="r12-details"><summary>3・4・5代の指定祖先を確認する</summary>${m.anchors.map(a=>`<div class="slot"><strong>${a.ok?'一致':'要確認'} ${esc(a.path)}</strong><span>実際：${esc(a.seen)} ／ 指定：${esc(a.wantedId)}</span></div>`).join('')}</details>
 <details class="r12-details"><summary>31枠の詳細データを確認する</summary><div class="r12-table-wrap"><table class="r12-table"><thead><tr><th>位置</th><th>祖先名</th><th>因子</th><th>子系統</th></tr></thead><tbody>${m.rows.map(r=>`<tr><td>${esc(r.path)}</td><td>${esc(r.name)}</td><td>${esc((r.factors||[]).join('・')||'—')}</td><td>${esc(r.line||'—')}</td></tr>`).join('')}</tbody></table></div></details>
 <div class="r12-warn"><b>判定できないこと：</b>本人因子の未記載${m.missingFactorPositions}枠（因子なし／未収録の区別が必要）。子系統は仮馬の父系を仮継承した項目を含む可能性があります。至高・奇跡の特別条件、ニトロ確定値、能力補正、産駒のSP/ST上限や最低合格値は算出していません。</div>
 <div class="btnrow"><button class="btn small ghost" id="r12GoCompare">他の保存プランと横並び比較</button></div></section>`;
 target.querySelector('#r12GoCompare').onclick=()=>{closeEditor();const box=$('compare12Panel');box?.scrollIntoView({block:'start',behavior:'smooth'});};
}
function reviewCompareTable12(a,b){
 const fmt=(x)=>esc(x);
 const row=(name,av,bv,desc='')=>`<tr><td>${esc(name)}${desc?`<div class="r12-foot">${esc(desc)}</div>`:''}</td><td>${fmt(av)}</td><td>${fmt(bv)}</td></tr>`;
 return `<div class="r12-table-wrap"><table class="r12-table"><thead><tr><th>比較項目</th><th>研究案A</th><th>研究案B</th></tr></thead><tbody>
 ${row('5代種牡馬の判明位置',a.ped.known+'/31',b.ped.known+'/31')}
 ${row('指定3頭の位置＋因子一致',a.anchorCount+'/3',b.anchorCount+'/3')}
 ${row('有効クロス因子（判明分）',a.effective16.total+(a.effective16.complete?'':'+'),b.effective16.total+(b.effective16.complete?'':'+'),'同じ因名は一回、異因名は加算。+は未判定あり')}
 ${row('因名未確認の交差位置',a.effective16.uncertain.length,b.effective16.uncertain.length,'未確認分は加点せず')}
 ${row('有効クロスの短因子',a.effective16.frequency['短']||0,b.effective16.frequency['短']||0)}
 ${row('有効クロスの速因子',a.effective16.frequency['速']||0,b.effective16.frequency['速']||0)}
 ${row('有効クロスの走因子',a.effective16.frequency['走']||0,b.effective16.frequency['走']||0)}
 ${row('有効クロスの長因子',a.effective16.frequency['長']||0,b.effective16.frequency['長']||0)}
 ${row('有効クロスの中因子',a.effective16.frequency['中']||0,b.effective16.frequency['中']||0)}
 ${row('有効クロスの底因子',a.effective16.frequency['底']||0,b.effective16.frequency['底']||0)}
 ${row('短・速・走（位置数）',a.groupSP,b.groupSP,'SP寄り研究指標')}
 ${row('長・中（位置数）',a.groupST,b.groupST,'ST寄り研究指標')}
 ${row('底因子（位置数）',a.bottom,b.bottom,'別枠で表示')}
 ${row('4代目 SP対象系統',a.spByDepth[0],b.spByDepth[0])}
 ${row('5代目 SP対象系統',a.spByDepth[1],b.spByDepth[1])}
 ${row('4代目 ST対象系統',a.stByDepth[0],b.stByDepth[0])}
 ${row('5代目 ST対象系統',a.stByDepth[1],b.stByDepth[1])}
 ${row('SP対象系統の種類',a.kindsSP.length,b.kindsSP.length)}
 ${row('ST対象系統の種類',a.kindsST.length,b.kindsST.length)}
 ${row('独立した父母間クロス候補',a.crossCheck.candidates.length,b.crossCheck.candidates.length,'研究上の推定。ゲーム内表示は未確認')}
 ${row('派生した祖先重複',a.crossCheck.inherited.length,b.crossCheck.inherited.length,'独立クロスとしては数えない')}
 ${row('同名祖先の重複種類',a.repeats.length,b.repeats.length,'血統上の生データ')}
 ${row('因子未記載の位置',a.missingFactorPositions,b.missingFactorPositions)}
 </tbody></table></div>`;
}
function renderCompare12(){
 const panel=$('compare12Panel');if(!panel)return;
 // Reading selected values before rerender keeps user choices during unrelated edits.
 const beforeA=panel.querySelector('#r12SelectA')?.value||'',beforeB=panel.querySelector('#r12SelectB')?.value||'';
 const plans=(state.plans||[]).filter(p=>p.routeDraft?.slots&&p.steps?.length>=9).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
 if(!plans.length){panel.innerHTML='<section class="r12-card"><h3>v1.2｜保存した研究案を比較</h3><p class="r12-foot">9工程の仮ルートを保存すると、研究案の血統をここで比較できます。</p></section>';return;}
 const completes=plans.filter(p=>reviewMetrics12(p).ready);
 const pickA=plans.some(p=>p.id===beforeA)?beforeA:(completes[0]||plans[0]).id;
 const pickB=plans.some(p=>p.id===beforeB)?beforeB:(completes.find(p=>p.id!==pickA)||plans.find(p=>p.id!==pickA))?.id||'';
 const opts=(val)=>`<option value="">未選択</option>`+plans.map(p=>{
  const m=reviewMetrics12(p);return `<option value="${esc(p.id)}" ${val===p.id?'selected':''}>${esc(p.title)}（${m.linked}/9）</option>`;
 }).join('');
 panel.innerHTML=`<section class="r12-card"><h3>v1.2｜保存した研究案を横並び比較</h3><p class="r12-foot">実際に一括連結した最終仮馬の血統から再計算します。${completes.length}件の9工程が連結済みです。</p>
 <div class="r12-pick"><label>研究案A<select id="r12SelectA">${opts(pickA)}</select></label><label>研究案B<select id="r12SelectB">${opts(pickB)}</select></label></div>
 <div id="r12CompareResult" aria-live="polite"></div></section>`;
 const build=()=>{
  const out=panel.querySelector('#r12CompareResult'),a=plans.find(p=>p.id===panel.querySelector('#r12SelectA').value),b=plans.find(p=>p.id===panel.querySelector('#r12SelectB').value);
  if(!a||!b){out.innerHTML='<p class="r12-foot">比較する研究案を2件選んでください。</p>';return;}
  if(a.id===b.id){out.innerHTML='<p class="r12-warn">異なる配合プランを2件選んでください。</p>';return;}
  const ma=reviewMetrics12(a),mb=reviewMetrics12(b);
  if(!ma.ready||!mb.ready){out.innerHTML=`<div class="r12-warn">比較には両方の9工程連結が必要です。<br>案A：${esc(ma.reason||'9/9工程')}<br>案B：${esc(mb.reason||'9/9工程')}</div>`;return;}
  const line=(p)=>`<div class="r12-foot">${esc(p.title)} <b>（9/9工程）</b></div>`;
  out.innerHTML=`<div class="r12-cols">${line(a)}${line(b)}</div>${reviewCompareTable12(ma,mb)}
  <details class="r12-details"><summary>因子の全種類を比較する</summary><div class="r12-table-wrap"><table class="r12-table"><thead><tr><th>因子</th><th>案A</th><th>案B</th></tr></thead><tbody>${[...new Set([...Object.keys(ma.freq),...Object.keys(mb.freq)])].sort().map(f=>`<tr><td>${esc(f)}</td><td>${ma.freq[f]||0}</td><td>${mb.freq[f]||0}</td></tr>`).join('')}</tbody></table></div></details>
  <details class="r12-details"><summary>各案のクロス分類を確認</summary><p class="r12-foot">A・独立候補：${esc(ma.crossCheck.candidates.map(x=>x.name+'（'+x.paths.join('/')+'）').join('、')||'なし')} ／ 派生重複：${esc(ma.crossCheck.inherited.map(x=>x.name+' ← '+x.via.join('・')).join('、')||'なし')}</p><p class="r12-foot">B・独立候補：${esc(mb.crossCheck.candidates.map(x=>x.name+'（'+x.paths.join('/')+'）').join('、')||'なし')} ／ 派生重複：${esc(mb.crossCheck.inherited.map(x=>x.name+' ← '+x.via.join('・')).join('、')||'なし')}</p><p class="r12-foot">ゲーム側の有効クロス・因子は未確認です。</p></details>
  <div class="r12-warn">因子・子系統の「数」は参考集計です。両案の強さを順位付けするものではありません。本人因子や子系統の扱いには未確認部分があります。至高・奇跡の成立、ニトロ、SP/ST、公式BCの優劣はこの表からは確定できません。</div>
  <button class="btn small ghost" id="r12ExportCompare">比較結果をJSONで保存</button>`;
  out.querySelector('#r12ExportCompare').onclick=()=>dl('dabimas_pedigree_compare_v12.json',{
   version:16,kind:'pedigree-position-and-cross-factor-comparison',savedAt:nowISO(),warning:'比較は判明祖先31枠の参考計算。至高成立・ニトロ・産駒能力を保証しない。',
   plans:[{id:a.id,title:a.title,summary:reviewExport12(ma)},{id:b.id,title:b.title,summary:reviewExport12(mb)}]});
 };
 panel.querySelector('#r12SelectA').addEventListener('change',build);
 panel.querySelector('#r12SelectB').addEventListener('change',build);
 build();
}
function reviewExport12(m){return {known:m.ped.known,match:m.anchorCount,spFactors:m.groupSP,stFactors:m.groupST,bottom:m.bottom,factors:m.freq,
 sp4:m.spByDepth[0],sp5:m.spByDepth[1],st4:m.stByDepth[0],st5:m.stByDepth[1],spLineKinds:m.kindsSP,stLineKinds:m.kindsST,
 repeats:m.repeats,crossCheck:m.crossCheck,effectiveCross16:m.effective16,missingFactorPositions:m.missingFactorPositions,foalId:m.foalId};}



// v1.3: breeding production navigator. Only user-entered game results are used for SP/ST.
// "至高" is NEVER auto-confirmed; pedigree is a checkable prerequisite only.
const PROD13_ROLES=[
 '父系の中継牡馬','最終種牡馬A2の候補','母父系の中継牡馬','母父系の牡馬B2','母母系の中継牡馬',
 '母母系の繁殖牝馬C2','母母系の繁殖牝馬C3','最終繁殖牝馬M','公式BC用の最終産駒'];
const PROD13_CHOICES=['未確認','ゲームで至高成立を確認','ゲームで不成立を確認'];
function productionData13(p){
 if(!p.production13||typeof p.production13!=='object')p.production13={};
 if(!p.production13.genomes||typeof p.production13.genomes!=='object')p.production13.genomes={};
 if(!PROD13_CHOICES.includes(p.production13.theory))p.production13.theory='未確認';
 return p.production13;
}
function product13Theory(p,m){
 const refs=p.routeDraft?.slots||{},ids=['g3','g4','g5'].map(k=>refs[k]||'');
 let byPath=m?.ready?new Map(m.rows.map(r=>[r.path,r])):new Map();
 const anchors=['SSS','DSSS','DDDSS'].map((path,i)=>({path,id:ids[i],row:byPath.get(path)}));
 const names=anchors.map(x=>key(x.row?.name||''));
 const sameBase=names.every(x=>!!x&&x===names[0]);
 const factors=[...new Set(anchors.flatMap(x=>x.row?.factors||[]))];
 const distinct=ids.filter(Boolean).length===3&&new Set(ids.map(key)).size===3;
 const premise=!!m?.ready&&m.anchorCount===3&&sameBase&&factors.length>=6&&distinct;
 return {premise,anchors,distinct,sameBase,factors,known:m?.ready?m.ped.known:0};
}
// A previously saved genome/theory check must not silently follow a revised pedigree.
function product13Fingerprint(p,n){
 const pair=chain09Parents(p,n);
 if(!pair.ready||!pair.ped)return '';
 const seq=[key(pair.sireId),key(pair.mareId),...pair.ped.rows.map(r=>[r.path,key(r.name),(r.factors||[]).slice().sort().join(','),canonicalLine(r.line)].join(':'))].join('|');
 let h=2166136261;for(let i=0;i<seq.length;i++)h=Math.imul(h^seq.charCodeAt(i),16777619)>>>0;
 return String(h>>>0);
}
function product13Usable(p,n,g){return !!g&&product13Metric(g)&&!!g.parentsKey&&g.parentsKey===product13Fingerprint(p,n);}
function product13Metric(s){
 const all=['sp0','sp1','sp2','st0','st1','st2'].map(k=>s?.[k]);
 return s&&all.every(x=>typeof x==='number'&&Number.isFinite(x))&&s.sp0<=s.sp1&&s.sp1<=s.sp2&&s.st0<=s.st1&&s.st1<=s.st2;
}
function product13Decision(p,n,g){
 const step=p.steps?.[n-1]||{},sp=String(step.minSP??'').trim(),st=String(step.minST??'').trim();
 if(!g)return 'ゲノム解析未登録。数値の予測は表示しません。';
 if(!sp&&!st)return 'ゲノム範囲を記録済み。最低合格基準は未設定です。';
 const criteria=[['SP',sp,g.sp0,g.sp1,g.sp2],['ST',st,g.st0,g.st1,g.st2]];
 return criteria.map(([label,target,low,mid,high])=>{
  if(!target)return `${label}：基準未設定`;
  // Ranks such as B/C cannot be safely compared to numerical genome observations.
  if(!/^\d+(?:\.\d+)?$/.test(target))return `${label}：基準「${target}」は数値ゲノムと直接比較不可`;
  const x=Number(target);
  if(high<x)return `${label}：登録した最大値${high}が合格基準${x}未満`;
  if(low>=x)return `${label}：登録した最小値${low}も基準${x}以上`;
  if(mid>=x)return `${label}：中央値${mid}は基準${x}以上（実際の産駒は未確定）`;
  return `${label}：最大値${high}は基準${x}以上、中央値${mid}は未達`;
 }).join(' ／ ');
}
function renderProductionGuide13(p){
 const target=$('productionGuide13');if(!target)return;
 if(!p.routeDraft?.slots||!(p.steps?.length>=9)){target.innerHTML='';return;}
 const m=reviewMetrics12(p),th=product13Theory(p,m),data=productionData13(p);
 const recorded=Object.keys(data.genomes).filter(k=>product13Usable(p,Number(k),data.genomes[k])).length;
 const oldCount=Object.keys(data.genomes).filter(k=>product13Metric(data.genomes[k])&&!product13Usable(p,Number(k),data.genomes[k])).length;
 const theoryCurrent=!!data.theoryParentsKey&&data.theoryParentsKey===product13Fingerprint(p,9);
 const minCount=p.steps.slice(0,9).filter(s=>s.minSP||s.minST).length;
 const lead=!m.ready?'まず「9工程を一括仮連結」して最終血統を完成させてください。':
  !th.premise?'指定位置・因子条件を再確認してください。血統構成の一次条件が未達です。':
  (data.theory==='未確認'||!theoryCurrent)?'次はゲームの配合補助機能で「至高」の表示を確認し、結果を登録してください。':
  data.theory==='ゲームで不成立を確認'?'ゲーム側で不成立です。祖先や兄弟クロス・配合条件を見直してください。':
  !product13Usable(p,9,data.genomes[9])?'次はゲーム内ゲノム解析のSP/ST最小・中央値・最大を工程9へ登録してください。':
  '現在の数値と合格基準を照らし、実際の生産結果を記録してください。';
 const mark=(ok)=>ok?'✓':'未';
 const pill=(txt)=>`<span class="p13-pill">${esc(txt)}</span>`;
 const stepHtml=Array.from({length:9},(_,i)=>{
  const n=i+1,d=CHAIN09_DEF[i],out=chain09Output(p,n),pair=chain09Parents(p,n),g=data.genomes[n];
  const role=PROD13_ROLES[i],step=p.steps[i]||{},ready=!!out.horse,gOk=product13Usable(p,n,g);
  const inputs=['sp0','sp1','sp2','st0','st1','st2'].map((k,j)=>`<label>${['SP 最小','SP 中央','SP 最大','ST 最小','ST 中央','ST 最大'][j]}<input inputmode="decimal" type="number" min="0" step="any" data-p13-g="${k}" value="${g&&product13Metric(g)?esc(g[k]):''}" placeholder="未記録"></label>`).join('');
  return `<details class="p13-step" data-p13-step="${n}"><summary><b>工程${n}・${esc(role)}</b><span class="p13-flag">${ready?'仮連結済み':'未連結'} ／ ${g?(gOk?'ゲノム記録あり':'過去記録・要再確認'):'解析未記録'}</span></summary>
  <p class="r12-foot">父：${esc(pair.sireId||'前工程待ち')} ／ 母：${esc(pair.mareId||'前工程待ち')}<br>${esc(ready?'仮馬の血統連結済み。実際の競走馬ではありません。':pair.problems.join('・')||'前工程待ち')}</p>
  <p class="p13-role">${n===2||n===8?'重要工程：次世代に引き継ぐ親馬の能力と血統を確認':n===9?'最終産駒：公式BCに出す馬の候補を選別':'中継工程：必要な性別と血統の維持を優先（能力基準は手動設定）'}</p>
  <div class="p13-mini"><label>最低許容SP（任意）<input data-p13-floor="sp" value="${esc(step.minSP||'')}" placeholder="例：B、120"></label><label>最低許容ST（任意）<input data-p13-floor="st" value="${esc(step.minST||'')}" placeholder="例：C、110"></label></div>
  <h5>実際のゲーム内ゲノム解析を記録</h5><div class="p13-inputs">${inputs}</div>
  <div class="btnrow topgap"><button type="button" class="btn small" data-p13-save="${n}">この工程の記録を保存</button><button type="button" class="btn small ghost" data-p13-clear="${n}" ${g?'':'disabled'}>この工程のゲノム記録を解除</button></div>
  <p class="p13-result">${esc(g&&!gOk?'このゲノム記録は過去の父母・血統のものです。現在の組み合わせで再確認してください。':product13Decision(p,n,gOk?g:null))}</p></details>`;
 }).join('');
 target.innerHTML=`<section class="r12-card p13-guide" aria-label="生産ナビ"><div class="line between"><h3>v1.3｜最短生産ナビ・判定チェック</h3><span class="p13-badge">研究用</span></div>
 <p class="r12-foot">名牝限定の配合案→9工程→至高の条件確認→ゲノム解析→能力採用を1つのプランで管理します。<b>未確認の効果を数値化しません。</b></p>
 <div class="p13-stats">${pill(`仮連結 ${m.linked||0}/9`)}${pill(`指定祖先 ${m.anchorCount||0}/3`)}${pill(`指定3頭の因子 ${th.factors.length}種類`)}${pill(`ゲノム記録 ${recorded}/9`)}${oldCount?pill(`再確認 ${oldCount}工程`):''}</div>
 <div class="p13-next"><b>次にやること</b><p>${esc(lead)}</p></div>
 <div class="p13-checks"><div><b>${mark(m.ready)} 血統31枠</b><small>${m.ready?'現在の最終血統を照合済み':'9工程が未完了または血統不足'}</small></div>
 <div><b>${mark(th.premise)} 至高の祖先構成条件（研究上）</b><small>3×4×5の同名祖先・異なる因名3頭・因子6種類以上を確認。全兄弟姉妹や特殊な重複条件は未判定</small></div>
 <div><b>${data.theory==='未確認'||!theoryCurrent?'未':data.theory==='ゲームで至高成立を確認'?'✓':'×'} ゲーム内の成立表示</b><small>${esc(!theoryCurrent&&data.theory!=='未確認'?'過去の血統での確認。現在の血統は要再確認':data.theory)}（ユーザーが選択した記録）</small></div>
 <div><b>${mark(product13Usable(p,9,data.genomes[9]))} 最終工程ゲノム記録</b><small>${data.genomes[9]?(product13Usable(p,9,data.genomes[9])?'現在の配合での解析範囲あり':'過去の配合の記録。要再確認'):'未記録。予想能力値を捏造しない'}</small></div></div>
 <div class="p13-game"><label>ゲームの配合補助で確認した結果<select id="p13Theory">${PROD13_CHOICES.map(v=>`<option value="${esc(v)}" ${data.theory===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
 <label>確認メモ（任意）<input id="p13TheoryNote" value="${esc(data.theoryNote||'')}" placeholder="ゲーム表示・特殊条件など"></label>
 <button type="button" class="btn small" id="p13SaveTheory">成立確認の結果を保存</button></div>
 <div class="r12-warn">「至高の成立」は血統の3×4×5だけで自動確定しません。全兄弟姉妹クロスなど未収録の条件はゲーム画面で確認してください。名牝ランク・因子数・子系統数からSP/STの確定値は計算できません。</div>
 <details class="p13-overview"><summary><b>9工程のゲノム解析と採用ラインを記録する（${recorded}/9工程記録済）</b></summary><p class="r12-foot">各工程でゲーム内解析が得られた場合だけ入力します。最低許容SP/STは任意の手動基準で、アプリが勝手に設定しません。数値基準を設定すると実測の解析範囲と比較します。</p>${stepHtml}</details>
 <div class="btnrow topgap"><button type="button" class="btn small ghost" id="p13Export">このプランの判断レポートをJSON保存</button><button type="button" class="btn small ghost" id="p13ToChain">9工程に移動</button></div><p id="p13Status" class="p13-status" role="status" aria-live="polite"></p></section>`;
}
function setupProductionGuide13(el,p){
 const root=el.querySelector('#productionGuide13');if(!root)return;
 renderProductionGuide13(p);
 root.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn)return;
  if(btn.id==='p13ToChain'){el.querySelector('#chainPlanner09')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
  if(btn.id==='p13Export'){
   const metrics=reviewMetrics12(p),d=productionData13(p);
   dl('dabimas_production_plan_'+new Date().toISOString().slice(0,10)+'.json',{
    version:13,kind:'production-check',savedAt:nowISO(),planTitle:p.title,planId:p.id,target:p.target||'',
    chainSummary:chain09Summary(p),theory:product13Theory(p,metrics),userGameTheory:d.theory,userGameNote:d.theoryNote||'',
    genomeStages:d.genomes,currentTheoryCheck:!!d.theoryParentsKey&&d.theoryParentsKey===product13Fingerprint(p,9),acceptance:p.steps.slice(0,9).map((s,i)=>({step:i+1,sp:s.minSP||'',st:s.minST||'',result:s.result||''})),
    warning:'ゲーム内成立記録はユーザー入力。ゲノム値もユーザー入力。血統の位置別集計は公式能力予測ではない。'});return;
  }
  if(btn.id==='p13SaveTheory'){
   const d=productionData13(p),v=root.querySelector('#p13Theory').value;
   d.theory=PROD13_CHOICES.includes(v)?v:'未確認';d.theoryNote=root.querySelector('#p13TheoryNote').value.trim().slice(0,500);
   d.theoryUpdatedAt=nowISO();d.theoryParentsKey=product13Fingerprint(p,9);touchPlan(p);renderProductionGuide13(p);root.querySelector('#p13Status').textContent='ゲーム内の確認結果を保存しました。';return;
  }
  if(btn.dataset.p13Save||btn.dataset.p13Clear){
   const n=Number(btn.dataset.p13Save||btn.dataset.p13Clear),panel=root.querySelector(`[data-p13-step="${n}"]`);
   if(!panel)return;
   const d=productionData13(p),isClear=!!btn.dataset.p13Clear;
   if(isClear){delete d.genomes[n];touchPlan(p);renderProductionGuide13(p);root.querySelector('#p13Status').textContent=`工程${n}のゲノム記録だけを解除しました。`;return;}
   const raw=Object.fromEntries(['sp0','sp1','sp2','st0','st1','st2'].map(k=>[k,panel.querySelector(`[data-p13-g="${k}"]`).value.trim()]));
   const any=Object.values(raw).some(Boolean),every=Object.values(raw).every(Boolean);
   if(any&&!every){root.querySelector('#p13Status').textContent='SP/STの6項目はすべて入力するか、すべて空欄にしてください。';return;}
   if(any){
    const vals=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Number(v)]));
    if(Object.values(vals).some(x=>!Number.isFinite(x)||x<0)||!product13Metric(vals)){
     root.querySelector('#p13Status').textContent='数値は0以上、各SP/STの最小≦中央値≦最大の順序で入力してください。';return;
    }
    d.genomes[n]={...vals,source:'ゲーム内ゲノム解析（手入力）',recordedAt:nowISO(),parentsKey:product13Fingerprint(p,n)};
   }else delete d.genomes[n];
   if(!p.steps?.[n-1])return;
   p.steps[n-1].minSP=panel.querySelector('[data-p13-floor="sp"]').value.trim().slice(0,30);
   p.steps[n-1].minST=panel.querySelector('[data-p13-floor="st"]').value.trim().slice(0,30);
   touchPlan(p);renderProductionGuide13(p);
   // Preserve open stage after redraw so the user can continue comfortably.
   root.querySelector('.p13-overview').open=true;
   const stage=root.querySelector(`[data-p13-step="${n}"]`);if(stage)stage.open=true;
   root.querySelector('#p13Status').textContent=`工程${n}を保存しました。${product13Decision(p,n,d.genomes[n]||null)}`;
  }
 });
}


// v1.4: distinction between potential pedigree patterns and game-confirmed theories.
// Official/specialist rules:
// 至高: same named stallion at 3x4x5 and >=6 distinct factor types. Full siblings can invalidate it.
// 奇跡: perfect mating + the stallion's paternal 4th-depth sire matching mare's maternal-grandsire DDS.
// Perfect: interesting family >=7 types across eight codes, same four parent-system codes in sire's
// migo set and mare's omoshiro set. CSV provides child lines, NOT these verified parent-system codes.
let bc14SupCandidates=[];
const bc14BaseName=r=>key(r?.name||splitName(r?.id||'').name);
function bc14Interest(r,goal){
 const factors=(r.factors||[]),count=fs=>fs.reduce((v,f)=>v+factors.filter(x=>x===f).length,0);
 return goal==='speed'?count(['短','速','走'])*3+count(['中','長'])
       :goal==='stamina'?count(['長','中'])*3+count(['速','短'])
       :count(['短','速','走','長','中'])*2+count(['底']);
}
function bc14SupremeSets(goal){
 const groups=new Map();for(const r of maleRows()){
  if(!isOwned(r)||!(r.factors||[]).length)continue;
  const k=bc14BaseName(r);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);
 }
 const res=[];
 for(const arr of groups.values()){
  if(arr.length<3)continue;
  for(const set of combinations(arr,3)){
   const ff=set.flatMap(r=>r.factors||[]),types=[...new Set(ff)];if(types.length<6)continue;
   const score=set.reduce((a,r)=>a+bc14Interest(r,goal),0);
   res.push({set,types,score,base:set[0].name,factors:ff});
  }
 }
 return res.sort((a,b)=>b.score-a.score||b.types.length-a.types.length||a.base.localeCompare(b.base,'ja')).slice(0,30);
}
// A 4x3 cross alone is NOT a miracle mating: verify perfection/interesting lineages separately.
function bc14PlanReady(p){
 if(!p.routeDraft?.slots||p.steps?.length<9)return null;
 const m=reviewMetrics12(p);if(!m.ready)return {ok:false,reason:`現在の連結 ${m.linked||0}/9`};
 const th=product13Theory(p,m);
 const meta=p.production13||{};
 const verified=meta.theory==='ゲームで至高成立を確認'&&meta.theoryParentsKey===product13Fingerprint(p,9);
 const freq=m.freq||{};
 const sum=fs=>fs.reduce((n,f)=>n+(freq[f]||0),0);
 return {ok:true,m,th,verified,sp:sum(['短','速','走']),st:sum(['長','中']),bottom:sum(['底']),
  omitted:m.missingFactorPositions,early:m.repeats.filter(x=>x.paths.some(q=>q.length<=2)).length};
}
function bc14PlanIndex(d,goal){
 if(!d?.ok)return -1;
 // Transparent research sorting only. This IS NOT a statistical prediction of horse ability.
 const base=goal==='speed'?d.sp*2+d.st+d.m.kindsSP.length*2
 :goal==='stamina'?d.st*2+d.sp+d.m.kindsST.length*2
 :d.sp+d.st+d.m.kindsSP.length+d.m.kindsST.length;
 return base-(d.early*2);
}
function bc14SummaryBox(){
 const result=$('bc14Result');if(!result)return;
 const goal=$('bc14Goal')?.value||'balance';
 bc14SupCandidates=bc14SupremeSets(goal);
 const intro=`<p class="bc14-note">所持馬から、異なる因名の3頭で因子6種類以上となる一次候補を${bc14SupCandidates.length}組抽出しました。上限30件。権利数0の馬も含みます。</p>`;
 const cards=bc14SupCandidates.map((v,i)=>`<div class="bc14-item"><h4>${i+1}. ${esc(v.base)}｜至高の因子候補</h4><div class="bc14-row"><span class="bc14-tag">因子${v.types.length}種類</span><span class="bc14-tag warn">至高の成立未確認</span></div><div class="bc14-factor">${v.types.map(f=>chip(f)).join('')}</div><p class="bc14-note">${v.set.map(r=>esc(r.id)+'（'+esc(r.factors.join('・'))+'）').join(' ／ ')}</p><div class="bc14-actions"><button type="button" class="btn small" data-bc14-sup="${i}">9工程の新プランを作成</button></div></div>`).join('')||'<p class="bc14-note">現在の所持馬で条件に合う候補は確認できませんでした。所持チェック・CSVの取り込み状況を確認してください。</p>';
 result.innerHTML=intro+cards+'<p class="bc14-method">判定できているのは、同名・異因名の3頭を集めた因子の一次条件までです。3×4×5の血統配置は作成する9工程で確認します。正式な至高成立・SP/ST補正・公式BC勝率はこの順位からは分かりません。</p>';
}
function bc14RenderPlans(){
 const target=$('bc14Plans');if(!target)return;
 const goal=$('bc14Goal')?.value||'balance';
 const items=(state.plans||[]).filter(p=>p.routeDraft?.slots&&p.steps?.length>=9).map(p=>({p,d:bc14PlanReady(p)}));
 items.sort((a,b)=>Number(!!b.d?.verified)-Number(!!a.d?.verified)||Number(!!b.d?.th?.premise)-Number(!!a.d?.th?.premise)||bc14PlanIndex(b.d,goal)-bc14PlanIndex(a.d,goal));
 target.innerHTML=items.length?items.map(({p,d},i)=>{
  const status=!d?.ok?'未連結':d.verified?'ゲームで成立確認済み（当該血統）':d.th?.premise?'至高の一次条件を満たす':'祖先条件を再確認';
  return `<div class="bc14-rank"><div><b>${esc(p.title)}</b> <span class="bc14-tag ${d?.verified?'':'warn'}">${esc(status)}</span><div class="bc14-note">${d?.ok?`最終血統${d.m.ped.known}/31・指定祖先${d.m.anchorCount}/3／短速走 ${d.sp}・長中 ${d.st}・底 ${d.bottom}／SP系統${d.m.kindsSP.length}種・ST系統${d.m.kindsST.length}種 ／ 指数${bc14PlanIndex(d,goal)}`:esc(d?.reason||'計画未完成')}</div></div><button class="btn small ghost" data-bc14-plan="${esc(p.id)}">開く</button></div>`;
 }).join('')+'<p class="bc14-method">参考指数は位置ごとの因子と研究対象系統を使った比較専用値です。至高の正式成立、ニトロ加点、公式BCの成績予想とは無関係です。</p>':'<p class="bc14-note">保存済みの9工程プランはありません。上の至高候補から計画を作成して、名牝限定の探索を実行してください。</p>';
}
function renderBCExplorer14(){bc14RenderPlans();}
function bc14OpenPlan(id){switchTab('library');showPlanEditor(id);}
function bc14SaveSup(index){
 const entry=bc14SupCandidates[index];if(!entry)return;
 const cand={set:entry.set,kinds:entry.types,score:entry.score};const p=newPlan(cand);p.title=`${entry.base} 至高・公式BC研究（成立未確認）`;p.goal=$('bc14Goal')?.value||'balance';
 const members=p.source.members;const slots=defaultRouteSlots(members);
 p.routeDraft={slots,paths:{g3:'SSS',g4:'DSSS',g5:'DDDSS'},validated:false};
 p.steps=buildDraftSteps(slots);p.source.basis='所持種牡馬の3因名・因子6種以上から作った至高一次候補。ゲーム成立未確認。';
 p.note='v1.4 所持馬から生成。名牝限定の候補探索後、9工程の仮連結とゲーム内成立確認が必要。';
 state.plans.unshift(p);persist();renderSavedPlans();bc14OpenPlan(p.id);
}
// Avoid global re-render while users edit other panels, but always refresh after search.
$('bc14Search')?.addEventListener('click',()=>{bc14SummaryBox();bc14RenderPlans();});
$('bc14Goal')?.addEventListener('change',()=>{bc14RenderPlans();});
$('bc14Result')?.addEventListener('click',e=>{
 const sup=e.target.closest('[data-bc14-sup]');
 if(sup)bc14SaveSup(Number(sup.dataset.bc14Sup));
});
$('bc14Plans')?.addEventListener('click',e=>{
 const btn=e.target.closest('[data-bc14-plan]');if(btn)bc14OpenPlan(btn.dataset.bc14Plan);
});


// v2.2: One-screen Shiko plan generator: owned sire triple -> known Meihin -> optional prep cross pair -> draft plan.
// All outputs are hypothetical, not game-verified. Old plan records remain untouched.
const AUTO21_RACES=[
 ['芝1200m','芝1200m'],['芝1400m','芝1400m'],['芝1600m','芝1600m'],['芝1800m','芝1800m'],
 ['芝2000m','芝2000m'],['芝2200m','芝2200m'],['芝2400m','芝2400m'],['芝2500m','芝2500m'],
 ['芝3000m','芝3000m'],['ダート1200m','ダート1200m'],['ダート1600m','ダート1600m'],
 ['ダート1800m','ダート1800m'],['ダート2000m','ダート2000m']];
let auto21Candidates=[],auto21LastPlanId='';
function auto21RefreshCandidates(){
 const sel=$('auto21Horse');if(!sel)return;
 const before=sel.value;
 const lastGoal=$('goal').value;
 $('goal').value=$('auto21Goal').value;
 const source=getCandidates().filter(c=>c.set.length===3);
 $('goal').value=lastGoal;
 const byName=new Map();
 for(const cand of source){const name=key(cand.set[0].name);if(!byName.has(name))byName.set(name,cand);}
 auto21Candidates=[...byName.values()];
 sel.innerHTML=auto21Candidates.length?auto21Candidates.map((c,i)=>`<option value="${i}">${esc(c.base)}：${c.kinds.length}種類（${c.set.map(r=>r.variant).join('・')}）</option>`).join(''):'<option value="">候補なし（取得済み3因名を確認）</option>';
 if([...sel.options].some(x=>x.value===before))sel.value=before;
 $('auto21CandidateNote').textContent=auto21Candidates.length?`取得済みの至高一次候補：${auto21Candidates.length}組。権利数0も対象。ゲーム内成立は未確認です。`:
 '取得済み種牡馬の3因名・因子6種類以上の候補がありません。所持チェックや公開マスターを確認してください。';
}
function auto21SetResearch(p,base){
 const ch=chain09Data(p);ch.mares={...base.choices};ch.outputs={};ch.xId=base.xId;ch.finalSex='male';
 p.routeDraft.xSire=base.xId;
 const x=findParentHorse(base.xId);
 if(x)p.routeDraft.xSireSnapshot={id:x.id,name:x.name,variant:x.variant,lineage:x.lineage,factors:[...(x.factors||[])],ancestry:x.ancestry||[]};
 const slots=p.routeDraft.slots,ms=ch.mares;
 const texts=[`${slots.g3} × ${ms[1]} → A1牡`,`A1牡 × ${ms[2]} → A2牡`,`${slots.g4} × ${ms[3]} → B1牡`,`B1牡 × ${ms[4]} → B2牡`,`${slots.g5} × ${ms[5]} → C1牡`,`C1牡 × ${ms[6]} → C2牝`,`${base.xId} × C2牝 → C3牝`,'B2牡 × C3牝 → 最終繁殖牝馬M','A2牡 × M牝 → 公式BC候補'];
 p.steps.slice(0,9).forEach((s,i)=>{s.cross=texts[i];s.done=false;s.minSP='';s.minST='';s.result='';});
 p.research10={createdAt:nowISO(),sortIndex:base.idx,summary:{sp:base.sp,st:base.st,spL:base.spL,stL:base.stL,otherCrosses:base.extra.length},sourcePlanId:'',mareScope:'meihin'};
}
// v2.3 — Dependency-aware, variable-length preparation graph.
// Only visible sire positions in the final five-generation pedigree can justify a
// bloodline-related preparation.  This is a BOUNDED beam search, NOT a proven
// global optimum, a game-rule validator, or a numerical SP/ST/nitro prediction.
// The six base mares and X sire are taken from the already selected 9-step plan.
const HARD23_BRANCHES={1:{label:'P1',prefix:'SSD',max:2},2:{label:'P2',prefix:'SD',max:3},3:{label:'Q1',prefix:'DSSD',max:1},4:{label:'Q2',prefix:'DSD',max:2},6:{label:'R2',prefix:'DDDD',max:1}};
const HARD23_LEFT=[1,2],HARD23_RIGHT=[3,4,6];
function hard23Signature(grafts){return Object.keys(HARD23_BRANCHES).map(n=>n+':'+(grafts[n]||[]).join(',')).join('|');}
function hard23Clone(grafts){const out={};for(const n of Object.keys(HARD23_BRANCHES))out[n]=[...(grafts[n]||[])];return out;}
function hard23Trial(p,grafts={},goal=p.goal||'balance'){
 const ch=chain09Data(p),slots=p.routeDraft?.slots||{},prepared={},parents={},outputs={};
 for(const n of [1,2,3,4,5,6]){
  let mare=findParentHorse(ch.mares[n]);
  if(!mare||horseSex(mare)!=='female')return {error:`工程${n}の基礎繁殖牝馬が見つかりません`};
  const stack=grafts[n]||[],def=HARD23_BRANCHES[n];
  if(stack.length&&(!def||stack.length>def.max))return {error:`工程${n}に5代外の無効な仕込みがあります`};
  prepared[n]=[];
  for(let j=0;j<stack.length;j++){
   const sire=findParentHorse(stack[j]);
   if(!sire||!isOwned(sire)||horseSex(sire)!=='male'||!(sire.ancestry||[]).length)return {error:`仕込み工程${n}-${j+1}の取得済み種牡馬が未登録`};
   const ped=getFoalPedigree(sire,mare);
   if(ped.known!==31||ped.conflicts.length)return {error:`仕込み工程${n}-${j+1}の血統が未完成です`};
   const child={id:`__h23_${n}_${j}`,name:`仕込み${n}-${j+1}`,sex:'female',isHomebred:true,factors:[],lineage:sire.lineage||'',fatherId:sire.id,motherId:mare.id,
    ancestry:ped.rows.map(a=>({path:a.path,horse:a.name,factors:[...(a.factors||[])],line:a.line||'',factorVariant:a.factorVariant||''}))};
   prepared[n].push({sire,mother:mare,child,path:def.prefix+'D'.repeat(stack.length-1-j)+'S',baseStep:n});
   mare=child;
  }
  parents[n]=mare;
 }
 let final=null,finalSire=null,finalMare=null;
 for(let n=1;n<=9;n++){
  const d=CHAIN09_DEF[n-1];
  const sire=d.sireSlot?routeSnapshotMember(slots[d.sireSlot],p):d.sireStep?outputs[d.sireStep]:findParentHorse(ch.xId||p.routeDraft?.xSire||'');
  const mare=d.mareStep?outputs[d.mareStep]:parents[n];
  if(!sire||!mare||horseSex(sire)!=='male'||horseSex(mare)!=='female')return {error:`通常工程${n}の親馬が不明です`};
  const ped=getFoalPedigree(sire,mare);
  if(ped.known!==31||ped.conflicts.length)return {error:`通常工程${n}の血統が不完全（${ped.known}/31）です`};
  outputs[n]={id:`__h23_foal_${n}`,name:`通常工程${n}の仮馬`,sex:d.sex,isHomebred:true,factors:[],lineage:sire.lineage||'',fatherId:sire.id,motherId:mare.id,
   ancestry:ped.rows.map(a=>({path:a.path,horse:a.name,factors:[...(a.factors||[])],line:a.line||'',factorVariant:a.factorVariant||''}))};
  if(n===9){final=ped;finalSire=sire;finalMare=mare;}
 }
 const at=new Map(final.rows.map(x=>[x.path,x]));
 const anchors=[['SSS','g3'],['DSSS','g4'],['DDDSS','g5']].every(([path,slot])=>{
  const wanted=routeSnapshotMember(slots[slot],p),actual=at.get(path);
  return !!wanted&&key(actual?.name)===key(wanted.name||splitName(wanted.id).name)&&
   JSON.stringify([...(actual?.factors||[])].sort())===JSON.stringify([...(wanted.factors||[])].sort());
 });
 if(!anchors)return {error:'至高3×4×5の固定祖先が変化しました'};
 const cross=effectiveCrossFactors16(final.rows,p),t={final,finalSire,finalMare,cross,prepared,outputs,grafts:hard23Clone(grafts)};
 t.metrics=prep19Score(t,goal);
 t.stages=9+Object.values(grafts).reduce((s,v)=>s+(v||[]).length,0);
 return t;
}
function hard23Pool(p,goal){
 // Enumerate every owned variant pair first, THEN bound the expensive trials.
 // Prefer distinct names over redundant variants; this is explicit candidate pruning.
 const sorted=prep18SortPairs(prep17PairChoices(p),goal),unique=[],seen=new Set();
 for(const v of sorted){const signature=key(v.name)+'|'+[key(v.a.id),key(v.b.id)].sort().join('|');
  if(!seen.has(signature)){seen.add(signature);unique.push(v);}}
 const distinct=[],selected=new Set();
 for(const v of unique){if(!selected.has(key(v.name))){selected.add(key(v.name));distinct.push(v);}}
 for(const v of unique){if(distinct.length>=24)break;if(!distinct.includes(v))distinct.push(v);}
 return {all:unique.length,shortlist:distinct.slice(0,24)};
}
function hard23Search(p,goal=p.goal||'balance',budget=1000){
 const empty=hard23Clone({}),initial=hard23Trial(p,empty,goal);
 if(initial.error)return {error:initial.error};
 const pool=hard23Pool(p,goal),bestBySignature=new Map(),dedup=new Set([hard23Signature(empty)]);
 let beam=[initial],best=initial,tested=0,valid=0,pruned=false,depth=0;
 // A pair of owned variants is grafted into opposite sides in one search move.
 // All intermediate births stay ordered, and all 31 sire paths are recalculated.
 outer:for(depth=0;depth<4;depth++){
  const next=[];
  moveLoop:for(const current of beam){
   for(const pair of pool.shortlist){
    for(const swap of [false,true]){
     for(const left of HARD23_LEFT)for(const right of HARD23_RIGHT){
      if((current.grafts[left]||[]).length>=HARD23_BRANCHES[left].max||(current.grafts[right]||[]).length>=HARD23_BRANCHES[right].max)continue;
      const grafts=hard23Clone(current.grafts);
      grafts[left].push(swap?pair.b.id:pair.a.id);grafts[right].push(swap?pair.a.id:pair.b.id);
      const signature=hard23Signature(grafts);if(dedup.has(signature))continue;dedup.add(signature);
      if(tested>=budget){pruned=true;break moveLoop;}
      tested++;
      const trial=hard23Trial(p,grafts,goal);if(trial.error)continue;
      valid++;
      const name=key(pair.name);
      const added=trial.cross.crosses.some(x=>key(x.name)===name&&!current.cross.crosses.some(y=>key(y.name)===name));
      if(!added||trial.cross.total<=current.cross.total||trial.metrics.score<=current.metrics.score+0.05)continue;
      next.push(trial);
     }
    }
   }
  }
  if(!next.length)break;
  next.sort((a,b)=>b.metrics.score-a.metrics.score||b.cross.total-a.cross.total||a.stages-b.stages);
  const unique=[];for(const t of next){if(unique.some(x=>hard23Signature(x.grafts)===hard23Signature(t.grafts)))continue;unique.push(t);if(unique.length>=3)break;}
  for(const t of unique)bestBySignature.set(hard23Signature(t.grafts),t);
  beam=unique;
  for(const t of beam){if(t.metrics.score>best.metrics.score+0.05||(Math.abs(t.metrics.score-best.metrics.score)<0.05&&t.stages<best.stages))best=t;}
  if(pruned)break;
 }
 // Single extra preparation only when it improves a visible 4/5-gen lineage or
 // adds effective independently resolved cross factors; no decorative generations.
 const anchorNames=new Set(Object.values(p.routeDraft?.slots||{}).map(id=>key(splitName(id).name)));
 const solo=maleRows().filter(r=>isOwned(r)&&r.ancestry?.length&&r.factors.length===3&&!anchorNames.has(key(r.name)));
 solo.sort((a,b)=>lineageInterest(b.lineage,goal)-lineageInterest(a.lineage,goal)||a.id.localeCompare(b.id,'ja'));
 const soloList=solo.slice(0,25);
 for(const n of Object.keys(HARD23_BRANCHES)){
  if((best.grafts[n]||[]).length>=HARD23_BRANCHES[n].max)continue;
  for(const sire of soloList){
   if(tested>=budget){pruned=true;break;}
   tested++;
   const grafts=hard23Clone(best.grafts);grafts[n].push(sire.id);
   const trial=hard23Trial(p,grafts,goal);if(trial.error)continue;valid++;
   const w=goal==='stamina'?'st4':'sp4';
   if(trial.cross.total<best.cross.total||trial.metrics.score<=best.metrics.score+0.2||
      (trial.cross.total===best.cross.total&&trial.metrics[w]<=best.metrics[w]))continue;
   best=trial;
  }
 }
 return {best,baseline:initial,tested,valid,pruned,eligiblePairs:pool.all,shortlist:pool.shortlist.length,
  evaluatedFoundations:1,guarantee:'部分探索・至高成立未確認'};
}
function hard23Save(p,t,goal,summary={}){
 if(!t||t.error)return {error:'保存可能な血統試算がありません'};
 const now=nowISO(),copy=JSON.parse(JSON.stringify(p));copy.id=uid();copy.createdAt=now;copy.updatedAt=now;copy.status='構想';copy.goal=goal;
 const extras=t.stages-9,recordIds={},records=[],ch=chain09Data(copy);ch.outputs={};
 copy.title=(p.title||'至高の配合').slice(0,110)+`（可変${t.stages}工程）`;
 copy.hard23={version:23,sourcePlanId:p.id,createdAt:now,mode:'bounded-beam',baseMares:{...ch.mares},
  grafts:hard23Clone(t.grafts),preparations:[],metrics:{...t.metrics},crossFactors:t.cross.total,
  independentCount:t.cross.independentCount,stages:t.stages,trials:summary.tested||0,shortlist:summary.shortlist||0,
  searchLimited:!!summary.pruned,confirmedTheory:false};
 // All birth dependencies are recorded explicitly; existing user data and plans stay intact.
 for(const n of [1,2,3,4,5,6]){
  for(const [j,r] of (t.prepared[n]||[]).entries()){
   const name=`v23仕込み${HARD23_BRANCHES[n].label}-${j+1}_${copy.id.slice(0,8)}`,id=homeId(name);
   const motherId=recordIds[r.mother.id]||r.mother.id;
   const rec={id,name,sex:'female',mode:'draft',sp:'',st:'',factors:[],lineage:r.sire.lineage||'',lineageAssumed:!!r.sire.lineage,
    fatherId:r.sire.id,motherId,ancestry:r.child.ancestry.map(a=>({...a,factors:[...a.factors]})),
    planId:copy.id,stepNo:null,hard23BaseStep:n,createdAt:now,updatedAt:now,
    note:'v2.3研究用の未生産仮馬。本人因子・SP/ST・ゲーム内成立は未確認。'};
   records.push(rec);recordIds[r.child.id]=id;
   copy.hard23.preparations.push({order:records.length,label:HARD23_BRANCHES[n].label,father:rec.fatherId,mother:rec.motherId,foal:id,
    targetStep:n,path:r.path,sex:'牝',minSP:'',minST:'',done:false});
   ch.mares[n]=id;
  }
 }
 for(let n=1;n<=9;n++){
  const r=t.outputs[n],name=`v23${copy.id.slice(0,8)}-工程${n}仮`,id=homeId(name);
  const rec={id,name,sex:CHAIN09_DEF[n-1].sex,mode:'draft',sp:'',st:'',factors:[],lineage:r.lineage||'',lineageAssumed:!!r.lineage,
   fatherId:recordIds[r.fatherId]||r.fatherId,motherId:recordIds[r.motherId]||r.motherId,
   ancestry:r.ancestry.map(a=>({...a,factors:[...a.factors]})),planId:copy.id,stepNo:n,createdAt:now,updatedAt:now,
   note:'v2.3可変工程の仮馬。実際に生産した記録ではない。'};
  records.push(rec);recordIds[r.id]=id;ch.outputs[n]=id;
 }
 const slots=copy.routeDraft.slots,ms=ch.mares,x=ch.xId;
 const texts=[`${slots.g3} × ${ms[1]} → A1牡`,`A1牡 × ${ms[2]} → A2牡`,`${slots.g4} × ${ms[3]} → B1牡`,`B1牡 × ${ms[4]} → B2牡`,`${slots.g5} × ${ms[5]} → C1牡`,`C1牡 × ${ms[6]} → C2牝`,`${x} × C2牝 → C3牝`,'B2牡 × C3牝 → M牝','A2牡 × M牝 → 公式BC候補'];
 copy.steps=copy.steps.slice(0,9).map((s,i)=>({...s,cross:texts[i],done:false,result:'',minSP:'',minST:''}));
 copy.note=(copy.note?copy.note+'\n':'')+`【v2.3】5代に残る仕込み${extras}工程＋基本9工程。研究用評価${t.metrics.score}。ニトロ・実SP/ST・至高成立未確認。候補枝数を制限した部分探索。`;
 copy.autoDesign21={...(copy.autoDesign21||{}),mode:'hard',searchStage:`v2.3 5代逆算・可変${t.stages}工程（候補数制限あり）`,confirmedTheory:false};
 state.plans.unshift(copy);state.homebreds.push(...records);
 if(!persist()){state.plans.shift();state.homebreds.splice(-records.length,records.length);return {error:'端末保存に失敗したため、新規プランと仮馬を取り消しました'};}
 return {id:copy.id};
}

function auto21Flow(plan){
 let lines=[];
 for(const step of plan.hard23?.preparations||[]){
  lines.push(`<li class="a21-step"><b>準備${step.order}｜${esc(step.father)} × ${esc(step.mother)} → ${esc(step.foal)}</b><small>${esc(step.label)}牝・${esc(step.sex)}を選別 → 通常工程${step.targetStep}で使用。最終産駒の配置：${esc(step.path)}。最低SP/STは未設定</small></li>`);
 }
 for(const step of plan.prep17?.steps||[]){
  lines.push(`<li class="a21-step"><b>準備${esc(step.label)}牝：${esc(step.father)} × ${esc(step.mother)}</b><small>牝馬を生産 → ${step.targetStep===0?'準備P1牝の母として使用':'通常工程'+step.targetStep+'へ'}。最低SP/STはゲノム確認後に設定</small></li>`);
 }
 for(let n=1;n<=9;n++){
  const step=plan.steps[n-1],sex=CHAIN09_DEF[n-1].sex==='female'?'牝':n===9?'性別不問':'牡';
  const chosen=n===9?'公式BC向けの本番産駒':sex==='牝'?'繁殖牝馬に採用':'次工程用の牡馬';
  lines.push(`<li class="a21-step"><b>工程${n}｜${esc(step.cross)}</b><small>必要：${esc(chosen)}／${sex}。${sex==='牝'?'SP/ST最低ライン：未設定（ゲーム内解析を記録して設定）':'SP/ST：実測データなし・数値を捏造しません'}</small></li>`);
 }
 return `<details class="a21-flow" open><summary>生産順の配合フロー（${lines.length}工程）</summary><ol>${lines.join('')}</ol></details>`;
}
function auto21Result(plan,ped,goal,mode,meta){
 const c=effectiveCrossFactors16(ped.rows,plan);
 const lines4=ped.rows.filter(r=>r.path.length===4);
 const sp=lines4.filter(r=>BONUS_SPEED.has(canonicalLine(r.line))).length;
 const st=lines4.filter(r=>BONUS_STAMINA.has(canonicalLine(r.line))).length;
 const foalRow=ped.rows.map(r=>({...r}));
 const sire=meta.sire,mare=meta.mare;
 const goalName=GOAL_LABELS[goal]||'バランス';
 const counts=Object.entries(c.frequency).map(([f,n])=>chip(f+' ×'+n)).join('');
 return `<div class="a21-report"><h3>作成済み｜${esc(plan.title)}</h3>
 <div class="a21-metrics"><div><b>${meta.stages||9}</b><small>生産工程（仮設計）</small></div><div><b>${ped.known}/31</b><small>最終産駒・種牡馬祖先</small></div><div><b>${c.independentCount}</b><small>独立クロス候補</small></div><div><b>${c.total}${c.complete?'':'+'}</b><small>因名判明分のクロス因子</small></div></div>
 <p>目標：${esc(goalName)}｜レース：${esc(plan.target)}｜名牝6頭と所持種牡馬を自動配置しました。</p>
 <p><b>有効クロス因子の内訳（研究上）：</b>${counts||'因名確定分なし'}。<br>4代目のSP/ST対象系統 ${sp}／${st}枠。ニトロ段階・正確なSP/ST・公式BC勝率は未計算です。</p>
 <details class="a21-flow"><summary>独立クロス候補と配置位置</summary>${c.crosses.map(x=>`<p><b>${esc(x.name)}</b>：${esc(x.paths.join(' × '))} ／ 因子${x.total}（${x.unresolved.length?'因名未確認あり':'因名判明分'}）</p>`).join('')||'なし'}</details>
 ${meta.searchNote?`<p class="notice">${esc(meta.searchNote)}</p>`:''}
 ${auto21Flow(plan)}
 <details class="a21-flow"><summary>最終産駒・種牡馬・肌馬の血統表（赤文字：クロス候補）</summary>${renderGamePedigree20(sire,mare,{...ped,rows:foalRow},plan)}</details>
 <div class="notice warn">これは研究用の血統シミュレーションです。至高の成立・全兄弟姉妹の除外条件・クロス効果・本人因子・SP/STは未確認です。牝馬の採用SP/ST基準は実際のゲノム解析を確認してから設定してください。${meta.limited?'追加クロスは上限付きの部分探索です。':''}</div>
 <div class="btnrow"><button class="btn" type="button" id="auto21OpenPlan" data-plan-id="${esc(plan.id)}">保存プランを開き、工程と採用ラインを編集</button></div></div>`;
}
function auto21Create(){
 const out=$('auto21Result'),run=$('auto21Run');
 const selected=auto21Candidates[Number($('auto21Horse').value)];
 if(!selected){out.innerHTML='<div class="notice warn">取得済みの至高候補を先に確認してください。</div>';return;}
 if(!master.length){out.innerHTML='<div class="notice warn">血統の自動生成には公開マスターが必要です。「データ管理」からCSVを読み込んでください。</div>';return;}
 const goal=$('auto21Goal').value,mode=$('auto21Mode').value;
 const race=$('auto21Race').value;
 run.disabled=true;out.innerHTML='<p class="notice">名牝と取得済み種牡馬から血統を試算しています…</p>';
 // Allow the progress text to paint before the CPU-only bounded search.
 setTimeout(()=>{
 try{
  const draft=newPlan(selected);draft.title=`${selected.base}・${mode==='hard'?'本気型':'マイルド型'} 自動設計 ${race}`;
  draft.goal=goal;draft.target=`公式BC想定：${race}`;
  const slots=defaultRouteSlots(draft.source.members);
  draft.routeDraft={slots,paths:{g3:'SSS',g4:'DSSS',g5:'DDDSS'},validated:false};
  draft.steps=buildDraftSteps(slots);
  const researched=opt10Find(draft,'meihin');
  const base=researched.results.find(x=>x.matches===3);
  if(!base){out.innerHTML=`<div class="notice warn">名牝6頭と補助種牡馬Xの組み合わせを確定できませんでした。${esc(researched.message||'公開データの血統・因子を確認してください。')}（試算 ${researched.tests}通り）</div>`;return;}
  auto21SetResearch(draft,base);
  let saved=null,pedigree=base.full,parents={sire:base.finalSire,mare:base.finalMare,limited:false};
  if(mode==='hard'){
   // Evaluate two of the best 6-mare/X foundations jointly with their optional
   // graft graphs; keep the full nine-step baseline as a legitimate outcome.
   const foundations=researched.results.filter(x=>x.matches===3).slice(0,2);
   let chosen=null,search=null,chosenDraft=null,compared=0;
   for(const foundation of foundations){
    const variant=JSON.parse(JSON.stringify(draft));
    auto21SetResearch(variant,foundation);
    const found=hard23Search(variant,goal,2500);
    if(found.error)continue;
    compared++;
    if(!chosen||found.best.metrics.score>chosen.metrics.score+0.05||
       (Math.abs(found.best.metrics.score-chosen.metrics.score)<0.05&&found.best.stages<chosen.stages)){
     chosen=found.best;search=found;chosenDraft=variant;
    }
   }
   if(!chosen){out.innerHTML='<div class="notice warn">9工程の完全な血統を再現できませんでした。データの祖先枠を確認してください。</div>';return;}
   const result=hard23Save(chosenDraft,chosen,goal,search);
   if(result.error){out.innerHTML=`<div class="notice warn">保存できませんでした：${esc(result.error)}</div>`;return;}
   saved=getPlan(result.id);pedigree=chosen.final;
   parents={sire:chosen.finalSire,mare:chosen.finalMare,limited:search.pruned,stages:chosen.stages,
    searchNote:`v2.3可変工程探索：名牝/X基礎構成${compared}案、追加クロス候補ペア${search.eligiblePairs}組から${search.shortlist}組を優先。${search.tested}通り試算。9工程基準評価${search.baseline.metrics.score.toFixed(1)} → 採用案${chosen.metrics.score.toFixed(1)}。5代を超える仕込みは加点しません。部分探索です。`};
    }else{
   draft.note=`【v2.1自動設計】名牝6頭・補助種牡馬Xを研究用評価で自動選択。${race}／${goal}。至高成立、予想能力は未確認。`;
   state.plans.unshift(draft);
   if(!persist()){state.plans.shift();out.innerHTML='<div class="notice warn">ローカル保存に失敗しました。空き容量を確認してください。</div>';return;}
   saved=draft;
  }
  saved.autoDesign21={createdAt:nowISO(),mode,goal,race,searchStage:mode==='hard'?`名牝＋可変${parents.stages}工程（5代血統・探索上限あり）`:'名牝＋9工程',mareTests:researched.tests,confirmedTheory:false};
  const errors=[];
  if(mode!=='hard')for(let n=1;n<=9;n++){const a=makeChain09Foal(saved,n);if(a.error){errors.push(`工程${n}：${a.error}`);break;}}
  persist();auto21LastPlanId=saved.id;
  renderSavedPlans();
  out.innerHTML=auto21Result(saved,pedigree,goal,mode,parents)+(errors.length?`<div class="notice warn">血統仮連結の一部が未完了：${esc(errors.join('、'))}。保存プランを開いて確認してください。</div>`:'');
  out.querySelector('#auto21OpenPlan').onclick=()=>{switchTab('library');showPlanEditor(saved.id);};
 }catch(e){out.innerHTML=`<div class="notice warn">自動設計中のエラー：${esc(e.message)}。既存プランは変更されていません。</div>`;}
 finally{run.disabled=false;}
 },25);
}
function setupAuto21(){
 const run=$('auto21Run');if(!run)return;
 const race=$('auto21Race');race.innerHTML=AUTO21_RACES.map(([value,label])=>`<option value="${esc(value)}" ${value==='芝1600m'?'selected':''}>${esc(label)}</option>`).join('');
 $('auto21Goal').addEventListener('change',auto21RefreshCandidates);
 run.addEventListener('click',auto21Create);
 auto21RefreshCandidates();
}

// wiring
$('homeSire').oninput=()=>{homeDraftPair=null;$('homePreviewArea').innerHTML='';};
$('homeMare').oninput=()=>{homeDraftPair=null;$('homePreviewArea').innerHTML='';};
$('homePreview').onclick=previewHomePair;
$('homeSave').onclick=registerHomebred;
$('homeSearch').oninput=renderHomebreds;
$('homePlan').onchange=()=>refreshHomeSteps();
$('homeList').onclick=e=>{const home=e.target.closest('[data-home-id]')||e.target.previousElementSibling;const view=e.target.closest('[data-home-view]'),use=e.target.closest('[data-home-use]'),edit=e.target.closest('[data-home-edit]'),save=e.target.closest('[data-home-commit]'),del=e.target.closest('[data-home-delete]');
if(view){displayHomePedigree(view.dataset.homeView);return;}
if(use){const container=e.target.closest('[data-home-id]');const id=container?.dataset.homeId;if(!id)return;const target=use.dataset.homeUse==='sire'?'homeSire':'homeMare';$(target).value=id;window.scrollTo({top:$('homebreds').offsetTop,behavior:'smooth'});$('homeStatus').textContent=`${id}を${target==='homeSire'?'父':'母'}に設定しました。もう一方の親を選んでください。`;return;}
if(edit){editHomebred(edit.dataset.homeEdit);return;}
if(save){updateHomebred(save.dataset.homeCommit);return;}
if(del){const id=del.dataset.homeDelete,rec=state.homebreds.find(x=>key(x.id)===key(id));if(!rec)return;if(state.homebreds.some(x=>x.fatherId===rec.id||x.motherId===rec.id)){alert('子孫の血統を守るため、別の馬の親になっている自家製馬は削除できません。');return;}if(!confirm(`${rec.name}の記録を削除しますか？（元に戻せません）`))return;state.homebreds=state.homebreds.filter(x=>key(x.id)!==key(id));persist();renderHomebreds();refreshHomePlanDetail();}
};

for(const b of document.querySelectorAll('[data-tab]'))b.addEventListener('click',()=>switchTab(b.dataset.tab));
for(const el of ['search','ownedFilter','factorFilter','sortFilter'])$(el).addEventListener(el==='search'?'input':'change',()=>{visible=40;renderCatalog();});$('more').onclick=()=>{visible+=40;renderCatalog();};
$('horseList').onclick=e=>{const el=e.target.closest('button[data-detail]');if(el)showDetail(el.dataset.detail);};
$('horseList').onchange=e=>{const el=e.target.closest('input[data-owned]');if(!el)return;const k=key(el.dataset.owned);state.owned[k]={...state.owned[k],owned:el.checked,rights:state.owned[k]?.rights||0};persist();renderAll();};
$('closeDialog').onclick=()=>$('horseDialog').close();
$('goal').onchange=renderCandidates;
$('mareQuery').oninput=()=>{mareLimit=35;renderMares();};
$('mareFilter').onchange=()=>{mareLimit=35;renderMares();};
$('mareRankFilter12').onchange=()=>{mareLimit=35;renderMares();};
$('mareList').onchange=e=>{const sel=e.target.closest('select[data-mare-grade12]');if(!sel)return;const k=key(sel.dataset.mareGrade12);if(sel.value)state.mareGrades[k]=sel.value;else delete state.mareGrades[k];persist();renderMares();};
$('mareMore').onclick=()=>{mareLimit+=35;renderMares();};
$('mareList').onclick=e=>{const fav=e.target.closest('[data-mare-fav]'),detail=e.target.closest('[data-mare-detail]');if(fav){const id=fav.dataset.mareFav,k=key(id);if(state.mareFavorites[k])delete state.mareFavorites[k];else state.mareFavorites[k]=true;persist();renderMares();}else if(detail)mareDetail(detail.dataset.mareDetail);};
$('pedAnalyze').onclick=renderPedigree;$('pedHorse').onkeydown=e=>{if(e.key==='Enter')renderPedigree();};$('pedDeep').onclick=()=>{$('pedHorse').value='ディープインパクト-央獅-';renderPedigree();};$('loadWebMaster').onclick=loadWeb;$('masterCsv').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{await setMaster(await file.text());}catch(err){$('importStatus').textContent='CSV取込エラー: '+err.message;}e.target.value='';};
$('exportInventory').onclick=()=>dl('dabimas_full_backup_v13.json',{version:13,owned:state.owned,added:state.added,genomes:state.genomes,plans:state.plans,mareFavorites:state.mareFavorites,mareGrades:state.mareGrades,homebreds:state.homebreds});
$('importInventory').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{importJSON(JSON.parse(await file.text()));alert('所持馬・保存プランを読み込みました。');}catch(err){alert('JSON取込失敗：'+err.message);}e.target.value='';};
$('resetOwned').onclick=()=>{if(!confirm('所持チェックを初期52頭の状態に戻しますか？'))return;state.owned=structuredClone(ownSeed);persist();renderAll();};
$('saveGenome').onclick=()=>{const vals=['sp0','sp1','sp2','st0','st1','st2'].map(k=>$(k).value.trim());if(vals.some(v=>v===''||!Number.isFinite(Number(v))||Number(v)<0)){alert('SP/STの最小・中央・最大を入力してください。');return;}const a=vals.map(Number);if(a[0]>a[1]||a[1]>a[2]||a[3]>a[4]||a[4]>a[5]){alert('最小 ≦ 中央 ≦ 最大の順序で入力してください。');return;}state.genomes.unshift({name:$('predName').value.trim(),sp0:a[0],sp1:a[1],sp2:a[2],st0:a[3],st1:a[4],st2:a[5],at:new Date().toLocaleDateString('ja-JP')});persist();$('genomeHistory').innerHTML=genomeRows();alert('ゲーム内解析値を保存しました。');};
$('clearGenome').onclick=()=>['sp0','sp1','sp2','st0','st1','st2'].forEach(k=>$(k).value='');
async function init(){buildMap();setupAuto21();renderAll();const loaded=await readMaster();if(loaded){master=loaded;buildMap();renderAll();$('importStatus').textContent=`保存済みの公開マスター ${loaded.length}頭を復元しました。`;}if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});}
init();})();