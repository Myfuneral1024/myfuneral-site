import asyncio, subprocess
from playwright.async_api import async_playwright
U='http://127.0.0.1:8790/'
def sql(q): return subprocess.run(['psql','-h','/tmp/mfpg','-p','5499','-U','postgres','-d','mf','-qAt','-c',q],capture_output=True,text=True).stdout.strip()
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(executable_path='/usr/bin/google-chrome')
        for W in (320,360,1280):
            c=await b.new_context(viewport={'width':W,'height':740 if W<700 else 900},service_workers='block'); await c.route('**/fonts.googleapis.com/**',lambda r:r.abort())
            p=await c.new_page(); errs=[]; p.on('pageerror',lambda e:errs.append(str(e)))
            await p.goto(U); await p.fill('#l-ph','01011112222'); await p.fill('#l-pw','pass1234'); await p.click('#f-login button[type=submit]'); await p.wait_for_selector('.hello')
            cid=sql('select id from public.mf_consult limit 1'); fid=sql('select id from public.mf_funeral limit 1')
            bad=[]
            for h in ['#/','#/c','#/c/new','#/c/'+cid,'#/c/'+cid+'/edit','#/f','#/f/new','#/f/'+fid,'#/f/'+fid+'/edit','#/k?code=MF-261120-ABCD','#/a/wait','#/a/staff','#/a/org','#/a/set','#/me']:
                await p.goto(U+h); await p.wait_for_timeout(900)
                sw=await p.evaluate('Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)')
                small=await p.evaluate('''()=>[...document.querySelectorAll('button,a,input,select,textarea')].filter(e=>{const r=e.getBoundingClientRect(); const st=getComputedStyle(e); return r.width>0&&r.height>0&&st.visibility!=='hidden'&&r.height<40&&!e.closest('.li')&&!e.classList.contains('chip')}).map(e=>(e.textContent||e.placeholder||e.tagName).trim().slice(0,14)+':'+Math.round(e.getBoundingClientRect().height))''')
                if sw>W: bad.append(h+' 넘침 '+str(sw))
                if small and W<700: bad.append(h+' 작은 버튼 '+', '.join(small[:6]))
                if W==320 and h in ('#/f/'+fid,'#/c/new','#/a/org'): await p.screenshot(path='/home/claude/mfapp/shots/w320_'+h.split('/')[1]+'.png')
            print(W, '문제' if bad else '이상 없음', bad, errs)
            await c.close()
        await b.close()
asyncio.run(main())
