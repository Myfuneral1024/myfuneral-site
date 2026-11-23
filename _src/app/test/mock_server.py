# 가짜 수파베이스 (로그인 + 서버 함수) — 로컬 PostgreSQL(/tmp/mfpg:5499, db mf)에 붙어 실제 SQL 함수를 부른다.
# python3 mock_server.py <포트> <앱 폴더>
import sys, json, os, time, uuid, mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import psycopg2, psycopg2.extras

DSN = "host=/tmp/mfpg port=5499 user=postgres dbname=mf"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
ROOT = sys.argv[2] if len(sys.argv) > 2 else '/tmp/mfapp-out'
cx = psycopg2.connect(DSN); cx.autocommit = True

def argtypes(fn):
    c = cx.cursor()
    c.execute("""select p.proargnames, array(select format_type(t, null) from unnest(p.proargtypes) t)
                 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = %s""", (fn,))
    r = c.fetchone()
    return dict(zip(r[0] or [], r[1] or [])) if r else None

def token_for(uid): return {'access_token': 'm.' + str(uid), 'token_type': 'bearer', 'expires_in': 3600,
                            'expires_at': int(time.time()) + 3600, 'refresh_token': 'r.' + str(uid), 'user': {'id': str(uid)}}

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'apikey, authorization, content-type, x-client-info, prefer')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
    def out(self, code, obj=None, raw=None, ctype='application/json'):
        body = raw if raw is not None else (b'' if obj is None else json.dumps(obj, ensure_ascii=False, default=str).encode())
        self.send_response(code); self.cors(); self.send_header('Content-Type', ctype); self.send_header('Content-Length', str(len(body))); self.end_headers()
        self.wfile.write(body)
    def do_OPTIONS(self): self.out(204)
    def body(self):
        n = int(self.headers.get('Content-Length') or 0)
        return json.loads(self.rfile.read(n) or b'{}') if n else {}
    def uid(self):
        a = self.headers.get('Authorization', '')
        return a[9:] if a.startswith('Bearer m.') else None
    def do_GET(self):
        u = urlparse(self.path)
        if u.path == '/auth/v1/user':
            uid = self.uid(); return self.out(200, {'id': uid}) if uid else self.out(401, {'msg': 'no'})
        p = u.path
        if p.endswith('/'): p += 'index.html'
        f = os.path.normpath(os.path.join(ROOT, p.lstrip('/')))
        if not f.startswith(os.path.normpath(ROOT)) or not os.path.isfile(f): return self.out(404, {'msg': 'not found'})
        self.out(200, raw=open(f, 'rb').read(), ctype=mimetypes.guess_type(f)[0] or 'application/octet-stream')
    def do_POST(self):
        u = urlparse(self.path); q = parse_qs(u.query); b = self.body(); c = cx.cursor()
        if u.path == '/auth/v1/signup':
            c.execute("select 1 from auth.users where email = %s", (b.get('email'),))
            if c.fetchone(): return self.out(422, {'code': 422, 'error_code': 'user_already_exists', 'msg': 'User already registered'})
            if len(b.get('password') or '') < 6: return self.out(422, {'code': 422, 'error_code': 'weak_password', 'msg': 'Password should be at least 6 characters.'})
            c.execute("insert into auth.users(email, encrypted_password, raw_user_meta_data) values (%s, extensions.crypt(%s, extensions.gen_salt('bf')), %s) returning id",
                      (b['email'], b['password'], json.dumps(b.get('data') or {})))
            return self.out(200, token_for(c.fetchone()[0]))
        if u.path == '/auth/v1/token':
            gt = (q.get('grant_type') or [''])[0]
            if gt == 'password':
                c.execute("select id from auth.users where email = %s and encrypted_password = extensions.crypt(%s, encrypted_password)", (b.get('email'), b.get('password')))
                r = c.fetchone()
                return self.out(200, token_for(r[0])) if r else self.out(400, {'code': 400, 'error_code': 'invalid_credentials', 'msg': 'Invalid login credentials'})
            if gt == 'refresh_token':
                rt = b.get('refresh_token') or ''
                return self.out(200, token_for(rt[2:])) if rt.startswith('r.') else self.out(400, {'msg': 'bad'})
        if u.path == '/auth/v1/logout': return self.out(204)
        if u.path.startswith('/rest/v1/rpc/'):
            fn = u.path.rsplit('/', 1)[1]
            types = argtypes(fn)
            if types is None or fn.startswith('mf__') or fn in ('mf_set_admin', 'mf_on_signup'):
                return self.out(404, {'code': 'PGRST202', 'message': 'not found'})
            uid = self.uid()
            parts, vals = [], []
            for k, v in b.items():
                if k not in types: return self.out(400, {'message': 'unknown arg ' + k})
                parts.append(f"{k} => %s::{types[k]}"); vals.append(json.dumps(v) if isinstance(v, (dict, list)) else v)
            k2 = cx.cursor()
            try:
                k2.execute('begin'); k2.execute('set local role authenticated')
                k2.execute("select set_config('request.jwt.claim.sub', %s, true)", (uid or '',))
                k2.execute(f"select public.{fn}({', '.join(parts)})", vals)
                r = k2.fetchone()[0]; k2.execute('commit')
                return self.out(200, r) if r is not None else self.out(200, raw=b'null')
            except psycopg2.Error as e:
                k2.execute('rollback')
                return self.out(400, {'code': e.pgcode, 'message': e.diag.message_primary, 'details': None, 'hint': None})
        self.out(404, {'msg': 'no route'})

HTTPServer(('127.0.0.1', PORT), H).serve_forever()
