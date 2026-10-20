#!/usr/bin/env python3
"""나만의장례 홈페이지 빌드
원본 _src/src.html 하나에서 메뉴별 페이지를 만든다.

  python3 _src/build.py            → 저장소 맨 위(공개되는 곳)에 페이지를 다시 만든다
  python3 _src/build.py --out DIR  → DIR에 따로 만든다 (확인용, 고정 파일도 함께 복사)

만들어지는 것: index.html, urgent/ nobinso/ price/ print/ clan/ chon/ manners/ 의 index.html,
assets/site.<해시>.css · .js(최근 8판 보관, versions.json), assets/site.css · site.js(예전 페이지용), sitemap.xml, 404.html
그대로 두는 것: CNAME, favicon.svg, apple-touch-icon.png, og.png, robots.txt, naver….html, assets/fonts/
"""
import os, re, shutil, sys, html, datetime, hashlib, json

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src.html')
ROOT = os.path.dirname(HERE)
OUT = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else ROOT
BASE = 'https://www.myfuneral.co.kr'
VER = datetime.datetime.now().strftime('%Y%m%d%H%M')
TODAY = datetime.date.today().isoformat()
ROUTES = ['urgent', 'nobinso', 'price', 'print', 'date', 'clan', 'chon', 'manners', 'urn']  # urn은 메뉴에 없음
STATIC = ['CNAME', 'favicon.svg', 'apple-touch-icon.png', 'og.png', 'robots.txt',
          'naverb64ba87306a5179497b82d3c875bb21e.html']

META = {
    'home': ('나만의장례 | 소규모 가족장 · 무빈소장 전문 후불제 상조',
             '저렴한 장례가 아닙니다. 합리적 간소화입니다. 소규모 가족장 · 무빈소장 전문 나만의장례, 24시간 장례 접수 1661-4214. 장례를 마친 뒤 정산합니다.'),
    'urgent': ('장례가 발생하셨다면 · 임종 후 할 일 | 나만의장례',
               '병원 · 요양병원 · 자택 · 사고 등 돌아가신 곳에 따라 먼저 할 일, 챙겨 둘 것, 장례 후 사망신고까지 정리했습니다. 1661-4214로 전화하시면 나만의장례가 이송부터 장지까지 모두 맡아 드립니다.'),
    'nobinso': ('무빈소 장례 · 전국 어디서나 60만원부터 | 나만의장례',
                '빈소 없이 가족끼리 조용히 모시는 무빈소 장례를 전국 어디서나 진행합니다. 진행 순서와 비용, 자주 묻는 질문을 정리했습니다. 24시간 상담 1661-4214.'),
    'price': ('장례 비용 계산 · 맞춤 견적 | 나만의장례 후불제 상조',
              '장례 형태, 화장 · 매장, 관, 수의, 장의 차량, 접객 도우미까지 하나씩 골라 장례 비용을 바로 계산합니다. 나만의장례 가격표 그대로, 장례를 마친 뒤 정산합니다.'),
    'print': ('지방 · 위패 · 축문 · 명정 · 혼백 출력 | 나만의장례 출력실',
              '고인 정보를 한 번 입력하면 지방(위패), 명정, 혼백, 축문, 상중 안내문, 부의 봉투를 실물 크기로 바로 인쇄하거나 PDF로 받습니다. 부고 · 감사 문자도 만들 수 있습니다. 회원가입 없이 무료.'),
    'date': ('삼우제 · 49재 · 기일 날짜 계산 · 음력 달력 | 나만의장례',
             '돌아가신 날만 넣으면 발인, 삼우제, 49재, 100일, 첫 기일(음력)을 양력 날짜로 바로 계산합니다. 사망신고 · 상속 포기 · 상속세 같은 장례 후 서류 기한과 음력 달력, 손 없는 날까지 한눈에 봅니다.'),
    'clan': ('본관 찾기 · 성씨 본관 한자 검색 | 나만의장례',
             '김해 김씨, 밀양 박씨처럼 본관을 한글로 찾으면 한자 본관과 성을 알려 드립니다. 139개 성씨, 423개 본관. 지방 · 명정 · 축문에 바로 넣을 수 있습니다.'),
    'chon': ('촌수 계산 · 가족 호칭 정리 | 나만의장례',
             '아버지의 사촌 동생, 어머니와 고모 사이처럼 헷갈리는 촌수와 호칭을 바로 계산합니다. 친가 · 외가 · 처가 · 시가 호칭을 지도로 볼 수 있습니다.'),
    'urn': ('유골함 고르는 법 · 일반함과 진공함 차이 | 나만의장례',
            '봉안당 · 봉안묘 · 수목장, 모실 곳에 따라 맞는 유골함이 다릅니다. 일반함과 진공함의 속 구조와 차이, 진공함 비용(45만원부터), 봉안당 칸 크기 확인까지 정리했습니다. 24시간 상담 1661-4214.'),
    'manners': ('조문 예절 · 부의 봉투 쓰는 법 | 나만의장례',
                '조문 순서, 절하는 법과 공수, 위로의 말, 삼가야 할 것, 부의 봉투 쓰는 법과 부의금 관례까지 처음 가는 조문에 필요한 예절을 정리했습니다.'),
}


def one(s, old, new, label):
    n = s.count(old)
    if n != 1:
        sys.exit(f'[{label}] 찾는 글이 {n}번 나옵니다')
    return s.replace(old, new)


src = open(SRC, encoding='utf-8').read()

# ── 1. 조각 나누기 ──
m = re.search(r'<style>\n(.*?)</style>', src, re.S)
CSS = m.group(1)
m = re.search(r'<script>\n(\(function\(\)\{.*?\}\)\(\);)\n</script>', src, re.S)
JS = m.group(1)
head_common = re.search(r'(<meta name="theme-color".*?<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>)', src, re.S).group(1)
head_common = head_common.replace('href="favicon.svg"', 'href="/favicon.svg"').replace('href="apple-touch-icon.png"', 'href="/apple-touch-icon.png"')
reset = re.search(r'(<style>:root\{color-scheme.*?</style>)', src).group(1)
naver = re.search(r'(<meta name="naver-site-verification"[^>]*>)', src).group(1)
body = src[src.index('<body>') + len('<body>\n'):src.index('<script src="https://cdnjs')]
pre_main = body[:body.index('<main>')]
post_main = body[body.index('</main>') + len('</main>\n'):]
main = body[body.index('<main>') + len('<main>\n'):body.index('</main>')]
SECTIONS = {}
for sm in re.finditer(r'<section class="page" data-page="(\w+)".*?\n</section>\n', main, re.S):
    SECTIONS[sm.group(1)] = sm.group(0)
assert list(SECTIONS) == ['home'] + ROUTES, list(SECTIONS)
JSPDF = re.search(r'(<script src="https://cdnjs[^>]*></script>)', src).group(1)


# ── 2. 주소 바꾸기 (#price → /price/) ──
def fix_links(s):
    s = s.replace('href="#print" data-goto-tab="env"', 'href="/print/?tab=env"')
    s = s.replace('href="#print" data-goto-tab="tx"', 'href="/print/?tab=tx"')
    s = s.replace('href="#print" data-goto-tab="ck"', 'href="/print/?tab=ck"')
    s = s.replace('href="#date" data-goto="after"', 'href="/date/#after"')
    s = s.replace('href="#price" data-goto="prepaid"', 'href="/price/#prepaid"')
    s = s.replace('href="#home"', 'href="/"')
    for r in ROUTES:
        s = s.replace(f'href="#{r}"', f'href="/{r}/"')
    return s


# 전화번호 · 시간처럼 중간에서 줄이 바뀌면 읽기 불편한 것은 한 덩어리로 (글자 부분에만, 태그 · 스크립트 안은 건드리지 않음)
NOBR = re.compile(r'(\d{2,4}-\d{3,4}(?:-\d{4})?|\d{1,2}:\d{2} – \d{1,2}:\d{2})')
def nobr(h):
    out = []; skip = False
    for part in re.split(r'(<[^>]+>)', h):
        if part.startswith('<'):
            m = re.match(r'<\s*(/?)([a-zA-Z]+)', part)
            if m and m.group(2).lower() in ('script', 'style', 'textarea', 'svg') and not part.rstrip().endswith('/>'):
                skip = not m.group(1)
            out.append(part)
        elif re.search(r'<(a|button)\b[^>]*class="[^"]*\bbtn\b', out[-1] if out else ''):
            out.append(part)  # 버튼 안은 그대로 (버튼은 flex라 덩어리로 나누면 간격이 벌어짐)
        else:
            out.append(part if skip else NOBR.sub(r'<span class="nw">\1</span>', part).replace(' · ', '\u00a0· '))  # 가운뎃점이 줄 맨 앞에 오지 않게
    return ''.join(out)


pre_main = fix_links(pre_main)
post_main = fix_links(post_main)
SECTIONS = {k: nobr(fix_links(v)) for k, v in SECTIONS.items()}
pre_main = nobr(pre_main)
post_main = nobr(post_main)

# ── 3. 스크립트 고치기 ──
js = JS
start = js.index('/* ── 화면 이동 ── */')
end = js.index("window.addEventListener('hashchange',route);") + len("window.addEventListener('hashchange',route);")
js = js[:start] + r"""/* ── 화면 이동 (메뉴마다 주소가 따로 있음) ── */
const PAGES=['home','urgent','nobinso','price','print','date','clan','chon','manners','urn'];
const PAGE=(function(){ const b=document.body.getAttribute('data-route'); return PAGES.indexOf(b)>=0?b:'home'; })();
function route(){
  const p=PAGE;
  const href=p==='home'?'/':'/'+p+'/';
  $$('.nav a').forEach(a=>{ if(a.getAttribute('href')===href) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  const nv=$('.nav'), cur=$('.nav a[aria-current="page"]');
  if(nv) nv.scrollLeft=cur?Math.max(0,cur.offsetLeft-(nv.clientWidth-cur.offsetWidth)/2):0;
  if(p==='print') renderPrint();
  if(p==='chon') renderChonAll(true);
  if(p==='price') renderWizard(false);
  if(p==='clan') renderClanPage();
  if(p==='date') renderDate();
}""" + js[end:]

js = one(js, "b.addEventListener('click',()=>{ PS.c1=c; PS.man=false; toast(clanLabel(c)+' '+c.bh+c.sh+' · 출력실 고인 본관에 넣었습니다'); location.hash='print'; }); return b; }",
         "b.addEventListener('click',()=>{ location.href='/print/?clan='+CLANS.indexOf(c); }); return b; }", 'clan-card')
js = one(js, "b.href='#print';", "b.href='/print/?rel='+encodeURIComponent(rel);", 'jibang-link')

old_start = """/* ── 시작 ── */
bindPrint(); bindWizard(); bindChon(); bindDate();
$('#clan-q').addEventListener('input',()=>{ clanSur=''; renderClanPage(); });
route();"""
new_start = r"""/* ── 시작 : 이 주소의 화면만 준비 (입력한 내용은 어디에도 저장하지 않음) ── */
try{ localStorage.removeItem('mf-hist'); ['mf-ps','mf-pr','mf-ch'].forEach(k=>sessionStorage.removeItem(k)); }catch(e){}
if(PAGE==='print'){
  const q=new URLSearchParams(location.search); let msg='';
  const t=q.get('tab'); if(t&&['jb','mj','hb','ck','sj','env','tx'].indexOf(t)>=0) PS.tab=t;
  const r=q.get('rel'); if(r&&Object.prototype.hasOwnProperty.call(REL,r)){ PS.rel=r; PS.tab='jb'; if(!REL[r].gen) PS.pair=false; msg='고르신 관계로 지방을 준비했습니다'; }
  const ci=q.get('clan'); if(ci!==null&&/^\d+$/.test(ci)&&CLANS[+ci]){ const c=CLANS[+ci]; PS.c1=c; PS.man=false; msg=clanLabel(c)+' '+c.bh+c.sh+' · 고인 본관에 넣었습니다'; }
  if(location.search) try{ history.replaceState(null,'',location.pathname); }catch(e){}
  bindPrint();
  if(msg) setTimeout(()=>toast(msg),400);
}
if(PAGE==='price') bindWizard();
if(PAGE==='chon') bindChon();
if(PAGE==='date') try{ bindDate(); }catch(e){}
if(PAGE==='clan') $('#clan-q').addEventListener('input',()=>{ clanSur=''; renderClanPage(); });
route();"""
js = one(js, old_start, new_start, 'start')
assert "location.hash" not in js, 'location.hash 남음'
assert "'#print'" not in js


# ── 4. 페이지 만들기 ──
def page(p):
    title, desc = META[p]
    url = BASE + ('/' if p == 'home' else f'/{p}/')
    e = html.escape
    head = [
        '<!doctype html>', '<html lang="ko">', '<head>', '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        f'<title>{e(title)}</title>',
        f'<meta name="description" content="{e(desc)}">',
        '<meta property="og:type" content="website">',
        '<meta property="og:site_name" content="나만의장례">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{BASE}/og.png">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<link rel="canonical" href="{url}">',
    ]
    if p == 'home':
        head.append(naver)
        head.append('<script>(function(){var h=location.hash.slice(1);if(/^(' + '|'.join(ROUTES) + r')$/.test(h))location.replace("/"+h+"/");})();</script>')
        head.append('<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebSite","name":"나만의장례","url":"' + BASE + '/"},{"@type":"Organization","name":"나만의장례","url":"' + BASE + '/","logo":"' + BASE + '/apple-touch-icon.png","telephone":"+82-1661-4214","sameAs":["https://pf.kakao.com/_BxnMxhX"]}]}</script>')
    if p == 'print':
        head_common_p = head_common + '\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&family=Yuji+Syuku&display=swap">\n<style>@font-face{font-family:"ChosunGs";src:url("/assets/fonts/chosungs.woff") format("woff");font-display:swap}</style>'
    else:
        head_common_p = head_common
    head_common_p += '\n<script type="speculationrules">{"prefetch":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>'
    head += [head_common_p, f'<link rel="stylesheet" href="/assets/{CSS_FILE}">', '</head>', f'<body data-route="{p}">']
    nav_pre = pre_main
    if p != 'home' and f'<a href="/{p}/">' in nav_pre:  # 메뉴에 있는 화면만 표시
        nav_pre = one(nav_pre, f'<a href="/{p}/">', f'<a href="/{p}/" aria-current="page">', 'nav-' + p)
    sec = SECTIONS[p].replace(' hidden>', '>', 1) if p != 'home' else SECTIONS[p]
    first_tag = sec.split('\n', 1)[0]
    assert ' hidden' not in first_tag, first_tag
    scripts = (JSPDF + '\n' if p == 'print' else '') + f'<script src="/assets/{JS_FILE}"></script>'
    return '\n'.join(head) + '\n' + nav_pre + '<main>\n' + sec + '</main>\n' + post_main + scripts + '\n</body>\n</html>\n'


# 스크립트 · 스타일은 내용으로 이름을 붙인다 (site.<해시>.js).
# GitHub Pages는 ?v= 를 무시하므로, 휴대폰에 남아 있던 예전 페이지가 새 스크립트를 받아 멈추는 일이 생겼다.
# 이름이 내용마다 다르면 예전 페이지는 예전 파일을, 새 페이지는 새 파일을 부른다. 최근 8판은 지우지 않고 남겨 둔다.
os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
JS_TXT = js + '\n'
CSS_FILE = 'site.' + hashlib.md5(CSS.encode('utf-8')).hexdigest()[:10] + '.css'
JS_FILE = 'site.' + hashlib.md5(JS_TXT.encode('utf-8')).hexdigest()[:10] + '.js'
for name, txt in [(CSS_FILE, CSS), (JS_FILE, JS_TXT), ('site.css', CSS), ('site.js', JS_TXT)]:
    open(os.path.join(OUT, 'assets', name), 'w', encoding='utf-8').write(txt)
VF = os.path.join(ROOT, 'assets', 'versions.json')
try:
    vers = json.load(open(VF, encoding='utf-8'))
except Exception:
    vers = []
vers = [v for v in vers if v != [CSS_FILE, JS_FILE]] + [[CSS_FILE, JS_FILE]]
vers = vers[-8:]
keep = {f for v in vers for f in v}
if os.path.abspath(OUT) == os.path.abspath(ROOT):
    json.dump(vers, open(VF, 'w', encoding='utf-8'), indent=0)
    for f in os.listdir(os.path.join(ROOT, 'assets')):
        if re.fullmatch(r'site\.[0-9a-f]{10}\.(js|css)', f) and f not in keep:
            os.remove(os.path.join(ROOT, 'assets', f))
for p in ['home'] + ROUTES:
    path = os.path.join(OUT, 'index.html') if p == 'home' else os.path.join(OUT, p, 'index.html')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(page(p))
if os.path.abspath(OUT) != os.path.abspath(ROOT):
    for f in STATIC + ['assets/fonts/chosungs.woff']:
        a = os.path.join(ROOT, f)
        if os.path.exists(a):
            os.makedirs(os.path.dirname(os.path.join(OUT, f)), exist_ok=True)
            shutil.copy(a, os.path.join(OUT, f))

# 사이트맵
urls = [BASE + '/'] + [f'{BASE}/{r}/' for r in ROUTES]
open(os.path.join(OUT, 'sitemap.xml'), 'w', encoding='utf-8').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'  <url>\n    <loc>{u}</loc>\n    <lastmod>{TODAY}</lastmod>\n  </url>\n' for u in urls)
    + '</urlset>\n')

# 404 : 예전 Framer 주소와 옛 #주소를 새 페이지로
open(os.path.join(OUT, '404.html'), 'w', encoding='utf-8').write("""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>나만의장례</title>
<script>
(function(){
  var p=location.pathname.replace(/\\/+$/,'').toLowerCase();
  var m={'/services':'/price/','/faq':'/','/brand':'/','/cemetery':'/','/contact':'/'};
  location.replace(m[p]||'/');
})();
</script>
<noscript><meta http-equiv="refresh" content="0; url=/"></noscript>
</head>
<body style="font-family:sans-serif;padding:40px 20px">
<p>페이지 주소가 바뀌었습니다. <a href="/">나만의장례 홈으로 이동</a> · 24시간 장례 접수 1661-4214</p>
</body>
</html>
""")

print('built', VER, '->', os.path.abspath(OUT))
