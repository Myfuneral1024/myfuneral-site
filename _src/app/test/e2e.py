# 가짜 서버(8790)로 앱을 직접 눌러 보는 시험. 캡처는 /home/claude/mfapp/shots/
import asyncio, os, subprocess, json
from playwright.async_api import async_playwright
U='http://127.0.0.1:8790/'
OUT='/home/claude/mfapp/shots'; os.makedirs(OUT, exist_ok=True)
PSQL=['psql','-h','/tmp/mfpg','-p','5499','-U','postgres','-d','mf','-qAt','-c']
def sql(q): return subprocess.run(PSQL+[q],capture_output=True,text=True).stdout.strip()
ERRS=[]
async def ctx_for(b, mobile=True):
    c=await b.new_context(viewport={'width':390,'height':844} if mobile else {'width':1280,'height':900}, device_scale_factor=2 if mobile else 1,
                          is_mobile=mobile, has_touch=mobile, user_agent=('Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36' if mobile else None),
                          service_workers='block', accept_downloads=True)
    await c.route('**/fonts.googleapis.com/**', lambda r: r.abort())
    await c.grant_permissions(['clipboard-read','clipboard-write'], origin=U.rstrip('/'))
    p=await c.new_page(); p.on('pageerror', lambda e: ERRS.append(str(e))); p.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    return c, p
async def shot(p, name, full=True):
    await p.wait_for_timeout(350)
    if full: await p.evaluate('window.scrollTo(0,0)'); await p.wait_for_timeout(100)
    sw=await p.evaluate('Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)'); w=p.viewport_size['width']
    if sw>w: print('  !! 가로 넘침', name, sw, w)
    await p.screenshot(path=f'{OUT}/{name}.png', full_page=full)
async def join(p, name, phone, pw='pass1234', wish=''):
    await p.goto(U); await p.click('#go-join')
    await p.fill('#j-nm', name); await p.fill('#j-ph', phone); await p.fill('#j-pw', pw); await p.fill('#j-pw2', pw); await p.fill('#j-wish', wish)
    await p.click('#f-join button[type=submit]'); await p.wait_for_selector('#w-re')
async def login(p, phone, pw='pass1234'):
    await p.goto(U); await p.fill('#l-ph', phone); await p.fill('#l-pw', pw); await p.click('#f-login button[type=submit]')
async def toast(p):
    try: await p.wait_for_selector('#toast:not([hidden])', timeout=4000); return await p.inner_text('#toast')
    except Exception: return ''
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome')
        cb,boss=await ctx_for(b)
        await boss.goto(U); await shot(boss,'01_login')
        await join(boss,'김대표','010-1111-2222'); await shot(boss,'02_wait')
        print(' ', sql("select public.mf_set_admin('01011112222')"))
        await boss.click('#w-re'); await boss.wait_for_selector('.hello'); await shot(boss,'03_home_admin_empty')
        # 본부 · 팀
        await boss.goto(U+'#/a/org'); await boss.wait_for_selector('#ah')
        for hq in ['서울본부','부산본부']:
            await boss.click('#ah'); await boss.fill('.sheet #nm', hq); await boss.click('.sheet [data-ok]'); await toast(boss); await boss.wait_for_selector('#ah')
        for tn in ['서울1팀','서울2팀']:
            await boss.locator('section.sec', has_text='서울본부').locator('[data-at]').click(); await boss.fill('.sheet #nm',tn); await boss.click('.sheet [data-ok]'); await boss.wait_for_timeout(600)
        await boss.locator('section.sec', has_text='부산본부').locator('[data-at]').click(); await boss.fill('.sheet #nm','부산1팀'); await boss.click('.sheet [data-ok]'); await boss.wait_for_timeout(600)
        await shot(boss,'04_admin_org')
        # 직원 가입
        cm,mem=await ctx_for(b); await join(mem,'박팀원','010-4444-5555',wish='서울1팀 팀원'); await shot(mem,'05_member_wait')
        ch,head=await ctx_for(b); await join(head,'이본부','010-2222-3333',wish='서울본부장')
        await boss.goto(U+'#/a'); await boss.wait_for_selector('[data-ap]'); await shot(boss,'06_admin_wait')
        # 승인: 박팀원 → 팀원 · 서울본부 · 서울1팀
        await boss.click('[data-ap] >> nth=1' if await boss.locator('[data-ap]').count()>1 else '[data-ap]')
        nm=await boss.inner_text('.sheet h2'); print('  승인 창:', nm)
        if '박팀원' in nm:
            await boss.click('.sheet [data-r=member]'); await boss.select_option('.sheet #s-hq', label='서울본부'); await boss.select_option('.sheet #s-tm', label='서울1팀')
        else:
            await boss.click('.sheet [data-r=head]'); await boss.select_option('.sheet #s-hq', label='서울본부')
        await shot(boss,'07_admin_approve_sheet', full=False)
        await boss.click('.sheet [data-ok]'); print('  ', await toast(boss)); await boss.wait_for_timeout(600)
        await boss.click('[data-ap]'); nm=await boss.inner_text('.sheet h2')
        if '박팀원' in nm:
            await boss.click('.sheet [data-r=member]'); await boss.select_option('.sheet #s-hq', label='서울본부'); await boss.select_option('.sheet #s-tm', label='서울1팀')
        else:
            await boss.click('.sheet [data-r=head]'); await boss.select_option('.sheet #s-hq', label='서울본부')
        await boss.click('.sheet [data-ok]'); print('  ', await toast(boss)); await boss.wait_for_timeout(600)
        await boss.goto(U+'#/a/staff'); await boss.wait_for_selector('[data-sid]'); await shot(boss,'08_admin_staff')
        # 팀원: 사전 상담
        await mem.click('#w-re'); await mem.wait_for_selector('.hello'); await shot(mem,'09_home_member')
        await mem.goto(U+'#/c/new'); await mem.wait_for_selector('#c-nm')
        await mem.fill('#c-nm','홍길동'); await mem.fill('#c-ph','01098765432'); await mem.fill('#c-tg','김영희'); await mem.fill('#c-rl','어머니')
        await mem.click('[data-pr=fam]'); await mem.check('[data-d=sup]'); await mem.check('[data-d=cp]'); await mem.fill('[data-cpno]','mf-261120-abcd'); await mem.click('[data-cpchk]'); await mem.wait_for_selector('[data-cpres] .cpres')
        await mem.fill('[data-exs] input >> nth=0','지인 소개 할인'); await mem.fill('[data-exs] input >> nth=1','5')
        await mem.fill('#c-cd','가족장으로 진행하실 때 적용'); await mem.fill('#c-mm','장남은 부산 거주. 12월에 다시 연락 드리기로.'); await mem.fill('#c-nt','언제든 편하게 연락 주세요.')
        await shot(mem,'10_consult_form')
        await mem.click('#cf button[type=submit]'); print('  ', await mem.inner_text('#c-err') if await mem.is_visible('#c-err') else '')
        await mem.check('#c-ok'); await mem.click('#cf button[type=submit]'); print('  ', await toast(mem))
        await mem.wait_for_selector('#cv'); await mem.wait_for_timeout(1200); await shot(mem,'11_consult_view')
        await mem.click('#b-copy'); await mem.wait_for_timeout(300); print('  문자 글 첫 줄:', (await mem.evaluate('navigator.clipboard.readText()')).split('\n')[0])
        async with mem.expect_download() as d: await mem.click('#b-img')
        dl=await d.value; await dl.save_as(OUT+'/12_cert.png')
        # 장례 접수 (상담에서 이어 가기)
        await mem.click('a[href^="#/f/new?from="]'); await mem.wait_for_selector('#f-dn')
        await mem.fill('#f-cr','장남'); await mem.fill('#f-hl','서울대학교병원 장례식장'); await mem.fill('#f-rm','특3호'); await mem.fill('#f-cm','서울시립승화원'); await mem.click('[data-io=관내]')
        await mem.click('[data-sx=여]'); await mem.fill('#f-ag','84'); await mem.click('[data-dp=병원]'); await mem.fill('#f-dpn','서울대학교병원')
        await mem.fill('[data-sd=ba]','2026-11-25'); await mem.fill('[data-st=ba]','07:00'); await mem.fill('[data-sp=ba]','서울대학교병원 장례식장')
        await mem.fill('#f-un','진공 유골함 (별자리)'); await mem.fill('#f-ua','45')
        tot=await mem.inner_text('#f-tot'); print('  장례 합계 (가족장 205 + 유골함 45 − 35):', tot)
        await shot(mem,'13_funeral_form')
        await mem.click('#f-save'); print('  ', await toast(mem)); await mem.wait_for_selector('#b-cost'); await shot(mem,'14_funeral_view')
        # 할인권 조회
        await mem.goto(U+'#/k'); await mem.fill('#kq','MF-261120-ABCD'); await mem.click('#kgo'); await mem.wait_for_selector('#kr .cpres'); await shot(mem,'15_coupon_used')
        await mem.fill('#kq','MF-261122-WXYZ'); await mem.click('#kgo'); await mem.wait_for_selector('#kreg'); await mem.fill('#kn','남궁민'); await mem.click('#kreg'); print('  ', await toast(mem)); await shot(mem,'16_coupon_list')
        # 가입자 찾기
        await mem.goto(U); await mem.fill('#q','5432'); await mem.wait_for_selector('#found .li'); await shot(mem,'17_home_find')
        # 본부장: 승인 뒤 로그인해서 같은 본부 기록 보임
        await head.click('#w-re'); await head.wait_for_selector('.hello'); await head.goto(U+'#/f'); await head.wait_for_selector('#fl .li, #fl .empty'); n=await head.locator('#fl .li').count(); print('  본부장 장례 목록', n, '건')
        # 내 정보 · 관리 탭(본부장)
        await head.goto(U+'#/me'); await head.wait_for_selector('#m-out'); await shot(head,'18_me')
        await head.goto(U+'#/a/staff'); await head.wait_for_timeout(800); await shot(head,'19_head_staff')
        # 본사: 회사 설정(직인)
        await boss.goto(U+'#/a/set'); await boss.wait_for_selector('#stf'); await boss.set_input_files('#stf','/tmp/stamp.png'); print('  ', await toast(boss)); await boss.wait_for_timeout(600); await shot(boss,'20_admin_settings')
        # PC 화면
        cp,pc=await ctx_for(b, mobile=False); await login(pc,'01011112222'); await pc.wait_for_selector('.hello'); await shot(pc,'21_pc_home')
        cid=sql("select id from public.mf_consult limit 1"); await pc.goto(U+'#/c/'+cid); await pc.wait_for_selector('#cv'); await pc.wait_for_timeout(1500); await shot(pc,'22_pc_consult')
        fid=sql("select id from public.mf_funeral limit 1"); await pc.goto(U+'#/f/'+fid+'/edit'); await pc.wait_for_selector('#f-save'); await shot(pc,'23_pc_funeral_edit')
        print('  페이지 오류:', ERRS)
        await b.close()
asyncio.run(main())
