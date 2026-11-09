import contextlib, json, socket, subprocess, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
SEED=Path('/mnt/data/dabimas_315_clean_start_v33 (1).json')
seed=json.loads(SEED.read_text())
# Isolated profile with sample records. This never touches the user's browser.
seed['genomes']=[{'id':'existing-genome-preserved','sp':90,'st':90}]
seed['plans']=[{'id':'existing-plan-preserved','title':'保存プラン検証用','steps':[],'status':'構想'}]
seed['homebreds']=[{'id':'existing-horse-preserved','name':'保存馬検証用','mode':'real','sex':'female','ancestry':[]}]
PORT=8876
proc=subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
try:
 for i in range(60):
  with socket.socket() as sock:
   if sock.connect_ex(('127.0.0.1',PORT))==0:break
  time.sleep(.1)
 else:raise RuntimeError('web server not running')
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  context=browser.new_context(viewport={'width':1240,'height':850},service_workers='allow')
  data=json.dumps(seed,ensure_ascii=False)
  context.add_init_script('localStorage.setItem("dabimas_lab_v02_state",'+json.dumps(data,ensure_ascii=False)+');')
  page=context.new_page();errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  url=f'http://127.0.0.1:{PORT}/index.html'
  page.goto(url,wait_until='load',timeout=30000)
  page.wait_for_timeout(1500)
  print('title:',page.title())
  main=page.locator('body').inner_text()
  assert 'v5.3' in main[:500],main[:500]
  assert '315 所持チェック' in main
  assert page.evaluate('typeof window.DabimasMildLineage52')=='object'
  assert page.evaluate('typeof window.DabimasMildGate51')=='object'
  saved=page.evaluate('JSON.parse(localStorage.getItem("dabimas_lab_v02_state"))')
  assert len(saved['owned'])==315
  for collection,record in [('plans','existing-plan-preserved'),('homebreds','existing-horse-preserved'),('genomes','existing-genome-preserved')]:
   assert saved[collection][0]['id']==record,(collection,saved[collection])
  print('reloaded state: 315 owned, saved plan, homebred, genome preserved')
  assert not errors,errors
  # worker install does not guarantee control until navigation
  page.wait_for_function("navigator.serviceWorker && navigator.serviceWorker.ready.then(()=>true)",timeout=20000)
  page.reload(wait_until='load',timeout=30000)
  page.wait_for_timeout(500)
  assert not errors,errors
  context.set_offline(True)
  page.reload(wait_until='load',timeout=30000)
  page.wait_for_timeout(500)
  assert page.evaluate('typeof window.DabimasMildLineage52')=='object'
  assert 'v5.3' in page.locator('body').inner_text()[:500]
  assert not errors,errors
  print('offline reload: PASS, versioned scripts resolved from current cache')
  context.close();browser.close()
finally:
 proc.terminate()
 with contextlib.suppress(Exception):proc.wait(timeout=5)
