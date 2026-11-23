# 로컬 PostgreSQL에서 SQL 권한 · 흐름 시험
import psycopg2, json, uuid, sys
DSN="host=/tmp/mfpg port=5499 user=postgres dbname=mf"
cx=psycopg2.connect(DSN); cx.autocommit=True; cur=cx.cursor()
cur.execute("truncate public.mf_log, public.mf_coupon restart identity cascade; delete from public.mf_funeral; delete from public.mf_consult; delete from auth.users; delete from public.mf_team; delete from public.mf_hq;")
def signup(name, phone, wish=''):
    cur.execute("insert into auth.users(email, encrypted_password, raw_user_meta_data) values (%s, extensions.crypt('pw12345678', extensions.gen_salt('bf')), %s) returning id",
                (phone+'@staff.myfuneral.co.kr', json.dumps({'name':name,'phone':phone,'wish':wish})))
    return cur.fetchone()[0]
def call(uid, fn, *args, expect_err=None):
    c=cx.cursor()
    try:
        c.execute("begin"); c.execute("set local role authenticated")
        c.execute("select set_config('request.jwt.claim.sub', %s, true)", (str(uid) if uid else '',))
        ph=','.join(['%s']*len(args))
        c.execute(f"select public.{fn}({ph})", [json.dumps(a) if isinstance(a,(dict,list)) else a for a in args])
        r=c.fetchone()[0]; c.execute("commit")
        if expect_err: print('  !! 오류가 나야 하는데 안 남:', fn, expect_err); sys.exit(1)
        return r
    except psycopg2.Error as e:
        c.execute("rollback"); msg=(e.diag.message_primary or str(e))
        if expect_err and expect_err in msg: return 'ERR:'+msg
        print('  !! 오류:', fn, msg); sys.exit(1)
ok=lambda t: print('  ✓', t)
boss=signup('대표','01011112222'); h1=signup('김본부','01022223333'); l1=signup('이팀장','01033334444'); m1=signup('박팀원','01044445555')
l2=signup('최팀장','01055556666'); h2=signup('정본부','01066667777'); x=signup('대기중','01077778888','서울 1팀')
call(boss,'mf_consult_list','',''  ,10, expect_err='본사 승인'); ok('승인 전에는 막힘')
cur.execute("select public.mf_set_admin('010-1111-2222')"); print('  ', cur.fetchone()[0])
w=call(boss,'mf_whoami'); assert w['role']=='admin' and w['pending']==6, w; ok('본사 지정 · 승인 대기 6명')
A=call(boss,'mf_save_hq',None,'서울본부',True); B=call(boss,'mf_save_hq',None,'부산본부',True)
call(boss,'mf_save_hq',None,'서울본부',True, expect_err='같은 이름'); ok('본부 이름 겹침 막음')
A1=call(boss,'mf_save_team',None,A,'서울1팀',True); B1=call(boss,'mf_save_team',None,B,'부산1팀',True)
call(h1,'mf_save_hq',None,'몰래본부',True, expect_err='본사 승인')
call(boss,'mf_staff_set',h1,'head','active',A,None); call(boss,'mf_staff_set',l1,'leader','active',None,A1)
call(boss,'mf_staff_set',m1,'member','active',None,A1); call(boss,'mf_staff_set',l2,'leader','active',None,B1)
call(boss,'mf_staff_set',h2,'head','active',B,None)
call(boss,'mf_staff_set',m1,'member','active',None,None, expect_err='팀을 골라'); ok('팀원은 팀 필수')
call(h1,'mf_staff_set',m1,'member','stopped',None,A1, expect_err='본사만'); ok('본부장은 승인 못 함')
call(boss,'mf_staff_set',boss,'member','active',None,A1, expect_err='본사 계정이 하나는'); ok('마지막 본사 못 내림')
org=call(m1,'mf_org'); assert len(org)==2; ok('본부 · 팀 목록')
sl=call(h1,'mf_staff_list'); assert {s['name'] for s in sl}=={'김본부','이팀장','박팀원'}, [s['name'] for s in sl]; ok('본부장은 자기 본부 직원만')
sl=call(l1,'mf_staff_list'); assert {s['name'] for s in sl}=={'이팀장','박팀원'}; ok('팀장은 자기 팀만')
# 사전 상담
c=call(m1,'mf_consult_save',{'client_name':'홍길동','client_phone':'010-9999-0000','target_name':'김영희','relation':'어머니','product':'fam','burial':'cre',
  'discounts':[{'kind':'sup','name':'수급자 · 국가유공자','amount':200000},{'kind':'cp','name':'사전 상담 감사 할인권','amount':100000,'code':'MF-261120-ABCD'}],'consent':True})
assert c['cert_no'].startswith('MF-G-') and c['hq_id']==A and c['team_id']==A1; ok('상담 저장 · 증서 번호 '+c['cert_no'])
call(m1,'mf_consult_save',{'client_name':'무동의','consent':False}, expect_err='동의'); ok('동의 없으면 저장 안 됨')
for who,exp in [(m1,1),(l1,1),(h1,1),(boss,1),(l2,0),(h2,0)]:
    n=len(call(who,'mf_consult_list','','',50)); assert n==exp,(who,n)
ok('상담 보는 범위: 팀원 · 팀장 · 본부장 · 본사 보임, 다른 본부 안 보임')
call(l2,'mf_consult_get',c['id'], expect_err='찾지 못'); ok('다른 본부 팀장은 상담 열기 막힘')
f=call(l1,'mf_find','9999'); assert len(f)==1 and f[0]['kind']=='consult'; ok('가입자 찾기 (전화 뒷자리)')
assert call(l2,'mf_find','홍길동')==[]; ok('다른 본부는 찾기에 안 나옴')
# 할인권
g=call(l2,'mf_coupon_get','mf-261120-abcd'); assert g['found'] and g['status']=='registered' and g['client_name']=='홍○○' and not g['visible']; ok('다른 본부도 할인권 상태 조회 (이름 가림)')
g=call(l2,'mf_coupon_get','MF-261120-ABCI'); assert not g['found'] and not g['format_ok']; ok('I 는 쓰지 않는 글자 → 형식 틀림')
g=call(l2,'mf_coupon_get','MF-991340-ABCD'); assert not g['format_ok']; ok('없는 날짜 → 형식 틀림')
call(l2,'mf_coupon_register','MF-261121-WXYZ','남궁','010-1212-3434'); call(l2,'mf_coupon_register','MF-261121-WXYZ','','', expect_err='이미 등록'); ok('할인권 등록 · 두 번 등록 막음')
call(m1,'mf_consult_save',{'client_name':'다른분','consent':True,'discounts':[{'kind':'cp','code':'MF-261121-WXYZ','amount':100000}]}, expect_err=None) if False else None
# 장례
fu=call(m1,'mf_funeral_save',{'consult_id':c['id'],'deceased_name':'김영희','chief_name':'홍길동','chief_phone':'010-9999-0000','start_on':'2026-11-23','total':1690000,'status':'open',
   'data':{'type':'fam','hall':'서울병원장례식장','discounts':[{'kind':'cp','code':'MF-261120-ABCD','amount':100000}]}})
assert fu['case_no'].startswith('MF-F-'); ok('장례 접수 '+fu['case_no'])
cc=call(m1,'mf_consult_get',c['id']); assert cc['status']=='done' and cc['funeral_id']==fu['id']; ok('가입증서 → 장례로 이어짐')
g=call(boss,'mf_coupon_get','MF-261120-ABCD'); assert g['status']=='used' and g['case_no']==fu['case_no']; ok('할인권 「쓰임」')
call(l1,'mf_funeral_save',{'deceased_name':'다른고인','data':{'discounts':[{'kind':'cp','code':'MF-261120-ABCD'}]}}, expect_err='이미 장례에'); ok('같은 할인권 두 번 사용 막음')
call(l1,'mf_funeral_save',{'deceased_name':'두장','data':{'discounts':[{'kind':'cp','code':'MF-261122-AAAA'},{'kind':'cp','code':'MF-261122-BBBB'}]}}, expect_err='한 장만'); ok('장례 한 번에 한 장')
call(l1,'mf_funeral_save',{'consult_id':c['id'],'deceased_name':'새장례','data':{}}, expect_err='이미 다른 장례'); ok('증서 하나는 장례 하나')
fu2=call(m1,'mf_funeral_save',{'id':fu['id'],'consult_id':c['id'],'deceased_name':'김영희','chief_name':'홍길동','total':1790000,'status':'done','data':{'type':'fam','discounts':[]}})
g=call(boss,'mf_coupon_get','MF-261120-ABCD'); assert g['status']=='registered' and g['funeral_id'] is None; ok('장례에서 할인권 빼면 다시 「등록」')
call(l2,'mf_funeral_get',fu['id'], expect_err='찾지 못'); ok('다른 본부는 장례 기록 못 봄')
assert len(call(h1,'mf_funeral_list','','live',50))==1; ok('본부장 장례 목록')
call(boss,'mf_coupon_void','MF-261121-WXYZ','중복 발급'); g=call(l2,'mf_coupon_get','MF-261121-WXYZ'); assert g['status']=='void'; ok('본사 할인권 무효')
# 비밀번호
pw=call(boss,'mf_staff_reset_pw',m1); assert len(pw)==8; w=call(m1,'mf_whoami'); assert w['must_change_pw']; ok('비밀번호 초기화 → 다음에 새로 정함')
call(m1,'mf_change_pw','short', expect_err='8자'); call(m1,'mf_change_pw','newpass123'); assert not call(m1,'mf_whoami')['must_change_pw']; ok('비밀번호 바꿈')
call(h1,'mf_staff_reset_pw',l2, expect_err='초기화할 수 없는'); ok('본부장은 다른 본부 초기화 못 함')
lg=call(m1,'mf_log_list','funeral:'+str(fu['id'])); assert len(lg)>=2; ok('누가 언제 기록 %d줄'%len(lg))
# 표 직접 읽기 · 아무나 부르기 막힘
c2=cx.cursor()
for sql,role in [("select * from public.mf_consult",'authenticated'),("select public.mf_org()",'anon'),("select public.mf__me()",'authenticated'),("select public.mf_set_admin('1')",'authenticated')]:
    try:
        c2.execute("begin"); c2.execute(f"set local role {role}"); c2.execute(sql); print('  !! 막혀야 함:',sql); sys.exit(1)
    except psycopg2.Error as e: c2.execute("rollback")
ok('표 직접 읽기 · 도움 함수 · 본사 지정 함수는 앱에서 못 부름')
cur.execute("update public.mf_staff set status='stopped' where id=%s",(l2,)); call(l2,'mf_org', expect_err='멈춘'); ok('정지된 계정 막힘')
print('모두 통과')
