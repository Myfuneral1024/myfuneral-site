# 2026-11-23 추가 시험 : 사전 상담 할인권 번호 자동 · 입금 계좌 설정 · 장례 → 정산서 (e2e.py 다음에 실행)
import asyncio, subprocess, re
from playwright.async_api import async_playwright
U='http://127.0.0.1:8790/'; OUT='/home/claude/mfapp/shots'
PSQL=['psql','-h','/tmp/mfpg','-p','5499','-U','postgres','-d','mf','-qAt','-c']
sql=lambda q: subprocess.run(PSQL+[q],capture_output=True,text=True).stdout.strip()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); errs=[]
        c=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,service_workers='block',accept_downloads=True)
        await c.route('**/fonts.googleapis.com/**',lambda r:r.abort())
        pg=await c.new_page(); pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:asyncio.ensure_future(d.accept()))
        await pg.goto(U); await pg.fill('#l-ph','010-1111-2222'); await pg.fill('#l-pw','pass1234'); await pg.click('#f-login button[type=submit]'); await pg.wait_for_timeout(1200)
        # 입금 계좌
        await pg.goto(U+'#/a/set'); await pg.wait_for_selector('#bk')
        await pg.fill('#bk','국민은행 123-45-678901 · 예금주 나만의장례'); await pg.click('#bks'); await pg.wait_for_timeout(700)
        print('  계좌 설정:', sql("select value from public.mf_setting where key='bank'"))
        # 사전 상담 : 할인권 번호 자동
        await pg.goto(U+'#/c/new'); await pg.wait_for_selector('#c-nm')
        await pg.fill('#c-nm','최가입'); await pg.fill('#c-ph','010-5555-6666'); await pg.click('[data-pr=fam]')
        await pg.check('[data-d=cp]'); await pg.wait_for_timeout(200)
        code=await pg.input_value('[data-cpno]'); print('  자동 할인권 번호:', code, bool(re.match(r'^MF-\d{6}-[A-HJ-NP-Z2-9]{4}$',code)))
        await pg.check('#c-ok'); await pg.screenshot(path=OUT+'/30_consult_cp_auto.png',full_page=True)
        await pg.click('#cf button[type=submit]'); await pg.wait_for_selector('#cv'); await pg.wait_for_timeout(800)
        print('  등록된 할인권:', sql("select code||' '||status from public.mf_coupon where code='%s'"%code))
        print('  보내기 단추:', await pg.inner_text('#b-share') if await pg.query_selector('#b-share') else '(이 브라우저는 공유 없음)')
        await pg.screenshot(path=OUT+'/31_cert_view.png',full_page=True)
        # 장례 → 정산서
        fid=sql("select id from public.mf_funeral order by id limit 1")
        await pg.goto(U+'#/f/'+fid); await pg.wait_for_timeout(900); await pg.click('a[href="#/f/'+fid+'/s"]')
        await pg.wait_for_selector('#sheets .page'); await pg.wait_for_timeout(900)
        info=await pg.evaluate("()=>({tot:document.querySelector('.big-total').textContent,pg:document.querySelector('#s-pg').textContent,warn:document.querySelector('#s-warn').hidden?'':document.querySelector('#s-warn').textContent,sw:document.documentElement.scrollWidth})")
        print('  정산서:', info)
        await pg.screenshot(path=OUT+'/32_settle_m.png',full_page=False)
        async with pg.expect_download() as dl: await pg.click('#s-img')
        d=await dl.value; await d.save_as(OUT+'/33_settle_img.png'); print('  이미지 저장:', d.suggested_filename)
        await pg.evaluate("()=>{document.querySelector('#print-host').innerHTML=document.querySelector('#sheets').innerHTML}")
        await pg.emulate_media(media='print'); await pg.pdf(path=OUT+'/34_settle.pdf',format='A4',print_background=True,margin={'top':'0','bottom':'0','left':'0','right':'0'})
        print('  페이지 오류:', errs)
        await b.close()
asyncio.run(main())
