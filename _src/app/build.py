# 나만의장례 업무 앱 만들기: python3 _src/app/build.py [--out 폴더] [--url 주소 --key 공개키]
# 원본 src.html + config.json(수파베이스 주소 · 공개 키) → /app/ (index.html · sw.js · manifest · 아이콘)
import os, sys, json, re, datetime, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
args = sys.argv[1:]
def opt(name, default=None):
    return args[args.index(name) + 1] if name in args else default
OUT = os.path.abspath(opt('--out', os.path.join(ROOT, 'app')))
cfg_path = os.path.join(HERE, 'config.json')
cfg = json.load(open(cfg_path, encoding='utf-8')) if os.path.exists(cfg_path) else {}
url = opt('--url', cfg.get('url', '__SB_URL__')).rstrip('/')
key = opt('--key', cfg.get('key', '__SB_KEY__'))
if 'service_role' in key or key.startswith('sb_secret_'):
    sys.exit('비밀 키는 넣으면 안 됩니다. 공개 키(sb_publishable_… 또는 anon)만 넣어 주세요.')
kst = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=9)
ver = opt('--ver', kst.strftime('%Y.%m.%d-%H%M'))

s = open(os.path.join(HERE, 'src.html'), encoding='utf-8').read()
sym = open(os.path.join(HERE, 'logo_symbols.txt'), encoding='utf-8').read().strip()
mark = open(os.path.join(HERE, 'logo_mark.txt'), encoding='utf-8').read().strip()
word = open(os.path.join(HERE, 'logo_word.txt'), encoding='utf-8').read().strip()
for k, v in [('__SYM__', sym), ('__MARK__', mark), ('__WORD__', word)]:
    assert s.count(k) == 1, k
    s = s.replace(k, v)
s = s.replace("url:'__SB_URL__'", "url:" + json.dumps(url)).replace("key:'__SB_KEY__'", "key:" + json.dumps(key)).replace("ver:'__VER__'", "ver:" + json.dumps(ver))

os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(s)
manifest = {
    'id': './', 'name': '나만의장례 업무', 'short_name': '나만의장례', 'lang': 'ko',
    'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'portrait',
    'background_color': '#f5f5f3', 'theme_color': '#252525',
    'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
              {'src': 'icon-512-mask.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]
}
json.dump(manifest, open(os.path.join(OUT, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
sw = """/* 나만의장례 업무 앱 · %s — 화면 파일만 보관(인터넷이 끊겨도 앱이 열리게). 기록(서버)은 보관하지 않음 */
const C='mfa-%s', FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mfa-')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url); if(e.request.method!=='GET'||u.origin!==location.origin) return;
  if(e.request.mode==='navigate'){ e.respondWith(fetch(e.request).then(r=>{ const cp=r.clone(); caches.open(C).then(c=>c.put('./index.html',cp)); return r; }).catch(()=>caches.match('./index.html'))); return; }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });
""" % (ver, ver)
open(os.path.join(OUT, 'sw.js'), 'w', encoding='utf-8').write(sw)
for f in ['icon-192.png', 'icon-512.png', 'icon-512-mask.png', 'icon-180.png']:
    shutil.copy(os.path.join(HERE, 'icons', f), os.path.join(OUT, f))
open(os.path.join(OUT, 'robots.txt'), 'w').write('User-agent: *\nDisallow: /\n') if False else None
print('만듦:', OUT, '· 버전', ver, '· 서버', url if not url.startswith('__') else '(아직 연결 전)')
