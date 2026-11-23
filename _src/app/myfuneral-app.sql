-- ════════════════════════════════════════════════════════════════════
-- 나만의장례 업무 앱 · 수파베이스 SQL (2026-11-23)
-- 수파베이스 → SQL Editor 에 이 파일 전체를 붙여 넣고 Run.
-- 여러 번 실행해도 됩니다 (이미 있는 것은 그대로 두고, 함수만 새로 고칩니다).
--
-- 표: mf_hq(본부) · mf_team(팀) · mf_staff(직원) · mf_consult(사전 상담 · 가입증서)
--     mf_coupon(할인권) · mf_funeral(장례 행사) · mf_setting(직인 등) · mf_log(누가 언제 무엇을)
-- 앱은 표를 직접 읽지 못하고, 아래 mf_ 함수로만 읽고 씁니다 (보는 범위를 함수가 지킴).
-- 보는 범위: 본사(admin) 전체 · 본부장(head) 자기 본부 · 팀장(leader) 자기 팀 · 팀원(member) 자기 것
-- 로그인 아이디는 휴대폰 번호 → 내부 이메일 「번호@staff.myfuneral.co.kr」 (메일은 보내지 않음)
-- ════════════════════════════════════════════════════════════════════

-- ── 표 ──────────────────────────────────────────────────────────────
create table if not exists public.mf_hq (
  id bigint generated always as identity primary key,
  name text not null unique,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.mf_team (
  id bigint generated always as identity primary key,
  hq_id bigint not null references public.mf_hq(id),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hq_id, name)
);
create table if not exists public.mf_staff (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  phone text not null default '',
  role text not null default 'member' check (role in ('admin','head','leader','member')),
  status text not null default 'pending' check (status in ('pending','active','stopped')),
  hq_id bigint references public.mf_hq(id),
  team_id bigint references public.mf_team(id),
  wish text not null default '',
  must_change_pw boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid
);
create table if not exists public.mf_consult (
  id bigint generated always as identity primary key,
  cert_no text not null unique,
  owner_id uuid not null references public.mf_staff(id),
  hq_id bigint references public.mf_hq(id),
  team_id bigint references public.mf_team(id),
  joined_on date not null default ((now() at time zone 'Asia/Seoul')::date),
  client_name text not null,
  client_phone text not null default '',
  target_name text not null default '',
  relation text not null default '',
  product text not null default 'und' check (product in ('nob','fam','und')),
  burial text not null default 'cre' check (burial in ('cre','bur')),
  discounts jsonb not null default '[]'::jsonb,
  cond text not null default '',
  memo text not null default '',
  note text not null default '',
  consent boolean not null default false,
  consent_at timestamptz,
  status text not null default 'active' check (status in ('active','done','cancel')),
  funeral_id bigint,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_by uuid,
  updated_at timestamptz not null default now()
);
create table if not exists public.mf_funeral (
  id bigint generated always as identity primary key,
  case_no text not null unique,
  consult_id bigint references public.mf_consult(id),
  owner_id uuid not null references public.mf_staff(id),
  hq_id bigint references public.mf_hq(id),
  team_id bigint references public.mf_team(id),
  status text not null default 'open' check (status in ('open','done','settled','cancel')),
  deceased_name text not null default '',
  chief_name text not null default '',
  chief_phone text not null default '',
  start_on date,
  total bigint not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_by uuid,
  updated_at timestamptz not null default now()
);
create table if not exists public.mf_coupon (
  code text primary key,
  amount int not null default 100000,
  status text not null default 'registered' check (status in ('registered','used','void')),
  client_name text not null default '',
  client_phone text not null default '',
  consult_id bigint references public.mf_consult(id),
  funeral_id bigint references public.mf_funeral(id),
  owner_id uuid references public.mf_staff(id),
  hq_id bigint, team_id bigint,
  registered_by uuid, registered_at timestamptz not null default now(),
  used_by uuid, used_at timestamptz,
  void_by uuid, void_at timestamptz, void_reason text not null default ''
);
create table if not exists public.mf_setting (
  key text primary key,
  value text not null default '',
  updated_by uuid,
  updated_at timestamptz not null default now()
);
create table if not exists public.mf_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  action text not null,
  target text not null default '',
  detail jsonb not null default '{}'::jsonb
);
create index if not exists mf_consult_owner on public.mf_consult(owner_id);
create index if not exists mf_consult_hq on public.mf_consult(hq_id, team_id);
create index if not exists mf_funeral_owner on public.mf_funeral(owner_id);
create index if not exists mf_funeral_hq on public.mf_funeral(hq_id, team_id);
create index if not exists mf_log_target on public.mf_log(target);

-- 표는 함수로만 (직접 읽기 · 쓰기 막음)
alter table public.mf_hq enable row level security;
alter table public.mf_team enable row level security;
alter table public.mf_staff enable row level security;
alter table public.mf_consult enable row level security;
alter table public.mf_funeral enable row level security;
alter table public.mf_coupon enable row level security;
alter table public.mf_log enable row level security;
alter table public.mf_setting enable row level security;
revoke all on public.mf_hq, public.mf_team, public.mf_staff, public.mf_consult, public.mf_funeral, public.mf_coupon, public.mf_log, public.mf_setting from anon, authenticated;

-- ── 가입하면 직원 줄을 「승인 대기」로 만든다 ──────────────────────────
create or replace function public.mf_on_signup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.mf_staff(id, name, phone, wish)
  values (new.id,
          left(coalesce(new.raw_user_meta_data->>'name',''),40),
          left(coalesce(new.raw_user_meta_data->>'phone',''),20),
          left(coalesce(new.raw_user_meta_data->>'wish',''),80))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists mf_on_signup on auth.users;
create trigger mf_on_signup after insert on auth.users for each row execute function public.mf_on_signup();

-- ── 도움 함수 (앱에서 직접 부르지 않음) ───────────────────────────────
create or replace function public.mf__err(msg text) returns void language plpgsql as $$
begin raise exception using message = msg, errcode = 'P0001'; end $$;

create or replace function public.mf__me() returns public.mf_staff
language plpgsql stable security definer set search_path = public as $$
declare s public.mf_staff;
begin
  select * into s from public.mf_staff where id = auth.uid();
  if s.id is null then perform public.mf__err('로그인이 필요해요.'); end if;
  if s.status = 'pending' then perform public.mf__err('본사 승인을 기다리고 있어요.'); end if;
  if s.status = 'stopped' then perform public.mf__err('사용이 멈춘 계정이에요. 본사에 문의해 주세요.'); end if;
  return s;
end $$;

create or replace function public.mf__see(me public.mf_staff, p_owner uuid, p_hq bigint, p_team bigint) returns boolean
language sql immutable as $$
  select me.role = 'admin'
      or p_owner = me.id
      or (me.role = 'head' and me.hq_id is not null and p_hq = me.hq_id)
      or (me.role = 'leader' and me.team_id is not null and p_team = me.team_id)
$$;

create or replace function public.mf__code(prefix text) returns text language plpgsql volatile as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; r text := ''; i int;
begin
  for i in 1..4 loop r := r || substr(a, 1 + floor(random()*32)::int, 1); end loop;
  return prefix || to_char(now() at time zone 'Asia/Seoul', 'YYMMDD') || '-' || r;
end $$;

create or replace function public.mf__log(p_action text, p_target text, p_detail jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.mf_log(actor, action, target, detail) values (auth.uid(), p_action, coalesce(p_target,''), coalesce(p_detail,'{}'::jsonb));
$$;

create or replace function public.mf__name(p uuid) returns text language sql stable security definer set search_path = public as $$
  select coalesce((select name from public.mf_staff where id = p), '')
$$;

create or replace function public.mf__digits(t text) returns text language sql immutable as $$
  select regexp_replace(coalesce(t,''), '\D', '', 'g')
$$;

-- ── 내 정보 ─────────────────────────────────────────────────────────
create or replace function public.mf_whoami() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s public.mf_staff;
begin
  select * into s from public.mf_staff where id = auth.uid();
  if s.id is null then return null; end if;
  return jsonb_build_object('id', s.id, 'name', s.name, 'phone', s.phone, 'role', s.role, 'status', s.status,
    'hq_id', s.hq_id, 'hq_name', (select name from public.mf_hq where id = s.hq_id),
    'team_id', s.team_id, 'team_name', (select name from public.mf_team where id = s.team_id),
    'must_change_pw', s.must_change_pw,
    'pending', case when s.role = 'admin' and s.status = 'active' then (select count(*) from public.mf_staff where status = 'pending') else 0 end);
end $$;

create or replace function public.mf_set_my_name(p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me();
begin
  if length(trim(coalesce(p_name,''))) = 0 then perform public.mf__err('이름을 넣어 주세요.'); end if;
  update public.mf_staff set name = left(trim(p_name),40) where id = me.id;
end $$;

create or replace function public.mf_change_pw(p_new text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare s public.mf_staff;
begin
  select * into s from public.mf_staff where id = auth.uid();
  if s.id is null or s.status = 'stopped' then perform public.mf__err('로그인이 필요해요.'); end if;
  if length(coalesce(p_new,'')) < 8 then perform public.mf__err('비밀번호는 8자 이상으로 정해 주세요.'); end if;
  update auth.users set encrypted_password = extensions.crypt(p_new, extensions.gen_salt('bf')), updated_at = now() where id = s.id;
  update public.mf_staff set must_change_pw = false where id = s.id;
  perform public.mf__log('비밀번호 바꿈', 'staff:'||s.id, '{}'::jsonb);
end $$;

-- ── 본부 · 팀 ───────────────────────────────────────────────────────
create or replace function public.mf_org() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me();
begin
  return coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'name', h.name, 'active', h.active,
      'staff', (select count(*) from public.mf_staff s where s.hq_id = h.id and s.status = 'active'),
      'teams', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'active', t.active,
                 'staff', (select count(*) from public.mf_staff s where s.team_id = t.id and s.status = 'active')) order by t.name)
               from public.mf_team t where t.hq_id = h.id), '[]'::jsonb)) order by h.sort, h.name)
    from public.mf_hq h), '[]'::jsonb);
end $$;

create or replace function public.mf_save_hq(p_id bigint, p_name text, p_active boolean default true) returns bigint
language plpgsql security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); v bigint;
begin
  if me.role <> 'admin' then perform public.mf__err('본사만 본부를 만들 수 있어요.'); end if;
  if length(trim(coalesce(p_name,''))) = 0 then perform public.mf__err('본부 이름을 넣어 주세요.'); end if;
  if exists (select 1 from public.mf_hq where name = trim(p_name) and id is distinct from p_id) then perform public.mf__err('같은 이름의 본부가 있어요.'); end if;
  if p_id is null then
    insert into public.mf_hq(name, active) values (trim(p_name), coalesce(p_active,true)) returning id into v;
  else
    update public.mf_hq set name = trim(p_name), active = coalesce(p_active,true) where id = p_id returning id into v;
  end if;
  perform public.mf__log(case when p_id is null then '본부 만듦' else '본부 고침' end, 'hq:'||v, jsonb_build_object('name', trim(p_name), 'active', p_active));
  return v;
end $$;

create or replace function public.mf_save_team(p_id bigint, p_hq bigint, p_name text, p_active boolean default true) returns bigint
language plpgsql security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); v bigint;
begin
  if me.role <> 'admin' then perform public.mf__err('본사만 팀을 만들 수 있어요.'); end if;
  if length(trim(coalesce(p_name,''))) = 0 then perform public.mf__err('팀 이름을 넣어 주세요.'); end if;
  if not exists (select 1 from public.mf_hq where id = p_hq) then perform public.mf__err('본부를 골라 주세요.'); end if;
  if exists (select 1 from public.mf_team where hq_id = p_hq and name = trim(p_name) and id is distinct from p_id) then perform public.mf__err('이 본부에 같은 이름의 팀이 있어요.'); end if;
  if p_id is null then
    insert into public.mf_team(hq_id, name, active) values (p_hq, trim(p_name), coalesce(p_active,true)) returning id into v;
  else
    update public.mf_team set hq_id = p_hq, name = trim(p_name), active = coalesce(p_active,true) where id = p_id returning id into v;
    update public.mf_staff set hq_id = p_hq where team_id = p_id;
  end if;
  perform public.mf__log(case when p_id is null then '팀 만듦' else '팀 고침' end, 'team:'||v, jsonb_build_object('name', trim(p_name), 'hq', p_hq, 'active', p_active));
  return v;
end $$;

-- ── 직원 ────────────────────────────────────────────────────────────
create or replace function public.mf_staff_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me();
begin
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'phone', s.phone, 'role', s.role, 'status', s.status,
      'hq_id', s.hq_id, 'hq_name', h.name, 'team_id', s.team_id, 'team_name', t.name, 'wish', s.wish,
      'created_at', s.created_at, 'approved_at', s.approved_at) order by (s.status = 'pending') desc, h.name nulls first, t.name nulls first,
      array_position(array['admin','head','leader','member'], s.role), s.name)
    from public.mf_staff s left join public.mf_hq h on h.id = s.hq_id left join public.mf_team t on t.id = s.team_id
    where me.role = 'admin'
       or (me.role = 'head' and s.hq_id = me.hq_id and s.status <> 'pending')
       or (me.role = 'leader' and s.team_id = me.team_id and s.status <> 'pending')
       or s.id = me.id), '[]'::jsonb);
end $$;

create or replace function public.mf_staff_set(p_id uuid, p_role text, p_status text, p_hq bigint, p_team bigint) returns void
language plpgsql security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); old public.mf_staff; v_hq bigint := p_hq;
begin
  if me.role <> 'admin' then perform public.mf__err('본사만 직원 승인 · 역할을 정할 수 있어요.'); end if;
  select * into old from public.mf_staff where id = p_id;
  if old.id is null then perform public.mf__err('직원을 찾지 못했어요.'); end if;
  if p_role not in ('admin','head','leader','member') then perform public.mf__err('역할을 골라 주세요.'); end if;
  if p_status not in ('pending','active','stopped') then perform public.mf__err('상태를 골라 주세요.'); end if;
  if p_team is not null then
    select hq_id into v_hq from public.mf_team where id = p_team;
    if v_hq is null then perform public.mf__err('팀을 찾지 못했어요.'); end if;
  end if;
  if p_status = 'active' and p_role = 'head' and v_hq is null then perform public.mf__err('본부장은 본부를 골라 주세요.'); end if;
  if p_status = 'active' and p_role in ('leader','member') and p_team is null then perform public.mf__err('팀장 · 팀원은 팀을 골라 주세요.'); end if;
  if p_id = me.id and p_status <> 'active' then perform public.mf__err('내 계정은 정지할 수 없어요.'); end if;
  if old.role = 'admin' and old.status = 'active' and (p_role <> 'admin' or p_status <> 'active')
     and (select count(*) from public.mf_staff where role = 'admin' and status = 'active') <= 1 then
    perform public.mf__err('본사 계정이 하나는 있어야 해요.');
  end if;
  update public.mf_staff set role = p_role, status = p_status,
    hq_id = v_hq,
    team_id = case when p_role in ('admin','head') then null else p_team end,
    approved_at = case when old.status = 'pending' and p_status = 'active' then now() else approved_at end,
    approved_by = case when old.status = 'pending' and p_status = 'active' then me.id else approved_by end
  where id = p_id;
  perform public.mf__log(case when old.status = 'pending' and p_status = 'active' then '가입 승인' else '직원 고침' end, 'staff:'||p_id,
    jsonb_build_object('name', old.name, 'role', p_role, 'status', p_status, 'hq', v_hq, 'team', p_team,
                       'before', jsonb_build_object('role', old.role, 'status', old.status, 'hq', old.hq_id, 'team', old.team_id)));
end $$;

create or replace function public.mf_staff_reset_pw(p_id uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare me public.mf_staff := public.mf__me(); t public.mf_staff; pw text;
begin
  select * into t from public.mf_staff where id = p_id;
  if t.id is null then perform public.mf__err('직원을 찾지 못했어요.'); end if;
  if not (me.role = 'admin' or (me.role = 'head' and t.hq_id = me.hq_id and t.role in ('leader','member'))) then
    perform public.mf__err('비밀번호를 초기화할 수 없는 직원이에요.');
  end if;
  pw := lpad((floor(random()*1000000))::int::text, 6, '0') || 'mf';
  update auth.users set encrypted_password = extensions.crypt(pw, extensions.gen_salt('bf')), updated_at = now() where id = p_id;
  update public.mf_staff set must_change_pw = true where id = p_id;
  perform public.mf__log('비밀번호 초기화', 'staff:'||p_id, jsonb_build_object('name', t.name));
  return pw;
end $$;

-- ── 사전 상담 · 가입증서 ──────────────────────────────────────────────
create or replace function public.mf__consult_json(c public.mf_consult) returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(c) || jsonb_build_object('owner_name', public.mf__name(c.owner_id), 'owner_phone', (select phone from public.mf_staff where id = c.owner_id),
    'hq_name', (select name from public.mf_hq where id = c.hq_id), 'team_name', (select name from public.mf_team where id = c.team_id),
    'funeral_case_no', (select case_no from public.mf_funeral where id = c.funeral_id),
    'updated_name', public.mf__name(c.updated_by))
$$;

-- 할인권 칸(kind = cp, code)을 할인권 표와 맞춘다
create or replace function public.mf__coupon_hold(me public.mf_staff, p_code text, p_name text, p_phone text, p_consult bigint, p_owner uuid, p_hq bigint, p_team bigint) returns void
language plpgsql security definer set search_path = public as $$
declare cp public.mf_coupon;
begin
  if p_code !~ '^MF-[0-9]{6}-[A-HJ-NP-Z2-9]{4}$' then perform public.mf__err('할인권 번호 「'||p_code||'」가 맞지 않아요. MF-숫자6자리-글자4자리예요.'); end if;
  select * into cp from public.mf_coupon where code = p_code for update;
  if cp.code is null then
    insert into public.mf_coupon(code, client_name, client_phone, consult_id, owner_id, hq_id, team_id, registered_by)
    values (p_code, coalesce(p_name,''), coalesce(p_phone,''), p_consult, p_owner, p_hq, p_team, me.id);
    perform public.mf__log('할인권 등록', 'coupon:'||p_code, jsonb_build_object('consult', p_consult));
  elsif cp.status = 'void' then perform public.mf__err('할인권 '||p_code||'은 무효 처리된 번호예요.');
  elsif cp.status = 'used' then perform public.mf__err('할인권 '||p_code||'은 이미 장례에 쓰였어요.');
  elsif cp.consult_id is not null and p_consult is not null and cp.consult_id <> p_consult then
    perform public.mf__err('할인권 '||p_code||'은 다른 상담(증서)에 등록돼 있어요.');
  elsif cp.consult_id is null and p_consult is not null then
    update public.mf_coupon set consult_id = p_consult where code = p_code;
  end if;
end $$;

create or replace function public.mf_consult_save(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); c public.mf_consult; v_id bigint := nullif(p->>'id','')::bigint;
        v_owner uuid; o public.mf_staff; d jsonb; v_code text;
begin
  if length(trim(coalesce(p->>'client_name',''))) = 0 then perform public.mf__err('가입하신 분 성함을 넣어 주세요.'); end if;
  if coalesce((p->>'consent')::boolean, false) is not true then perform public.mf__err('개인정보 수집 · 이용 동의를 받으셨는지 체크해 주세요.'); end if;
  if coalesce(p->>'product','und') not in ('nob','fam','und') then perform public.mf__err('상품을 골라 주세요.'); end if;
  if jsonb_typeof(coalesce(p->'discounts','[]'::jsonb)) <> 'array' then perform public.mf__err('할인 내역이 맞지 않아요.'); end if;
  if v_id is not null then
    select * into c from public.mf_consult where id = v_id for update;
    if c.id is null or not public.mf__see(me, c.owner_id, c.hq_id, c.team_id) then perform public.mf__err('상담을 찾지 못했어요.'); end if;
    v_owner := c.owner_id;
  else
    v_owner := me.id;
  end if;
  if me.role in ('admin','head','leader') and nullif(p->>'owner_id','') is not null then
    select * into o from public.mf_staff where id = (p->>'owner_id')::uuid and status = 'active';
    if o.id is null or not public.mf__see(me, o.id, o.hq_id, o.team_id) then perform public.mf__err('담당자를 바꿀 수 없어요.'); end if;
    v_owner := o.id;
  end if;
  select * into o from public.mf_staff where id = v_owner;
  if v_id is null then
    loop v_code := public.mf__code('MF-G-'); exit when not exists (select 1 from public.mf_consult where cert_no = v_code); end loop;
    insert into public.mf_consult(cert_no, owner_id, hq_id, team_id, client_name, created_by, updated_by)
    values (v_code, v_owner, o.hq_id, o.team_id, trim(p->>'client_name'), me.id, me.id) returning * into c;
  end if;
  update public.mf_consult set
    owner_id = v_owner, hq_id = case when v_owner <> c.owner_id then o.hq_id else hq_id end, team_id = case when v_owner <> c.owner_id then o.team_id else team_id end,
    joined_on = coalesce(nullif(p->>'joined_on','')::date, joined_on),
    client_name = left(trim(p->>'client_name'),40), client_phone = left(coalesce(p->>'client_phone',''),20),
    target_name = left(coalesce(p->>'target_name',''),40), relation = left(coalesce(p->>'relation',''),20),
    product = coalesce(p->>'product','und'), burial = case when p->>'burial' = 'bur' then 'bur' else 'cre' end,
    discounts = coalesce(p->'discounts','[]'::jsonb), cond = left(coalesce(p->>'cond',''),120), memo = left(coalesce(p->>'memo',''),2000), note = left(coalesce(p->>'note',''),200),
    consent = true, consent_at = coalesce(consent_at, now()),
    status = case when p->>'status' in ('active','cancel') and status <> 'done' then p->>'status' else status end,
    updated_by = me.id, updated_at = now()
  where id = c.id returning * into c;
  -- 할인권: 새로 적은 번호는 등록, 빠진 번호는 이 상담에서 풀기 (장례에 쓰인 것은 그대로)
  for d in select * from jsonb_array_elements(c.discounts) loop
    if d->>'kind' = 'cp' and coalesce(d->>'code','') <> '' then
      perform public.mf__coupon_hold(me, upper(trim(d->>'code')), c.client_name, c.client_phone, c.id, c.owner_id, c.hq_id, c.team_id);
    end if;
  end loop;
  update public.mf_coupon cc set consult_id = null where cc.consult_id = c.id and cc.status = 'registered'
    and cc.code not in (select upper(trim(x->>'code')) from jsonb_array_elements(c.discounts) x where x->>'kind' = 'cp' and coalesce(x->>'code','') <> '');
  perform public.mf__log(case when v_id is null then '상담 저장' else '상담 고침' end, 'consult:'||c.id, jsonb_build_object('cert_no', c.cert_no, 'client', c.client_name));
  return public.mf__consult_json(c);
end $$;

create or replace function public.mf_consult_get(p_id bigint) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); c public.mf_consult;
begin
  select * into c from public.mf_consult where id = p_id;
  if c.id is null or not public.mf__see(me, c.owner_id, c.hq_id, c.team_id) then perform public.mf__err('상담을 찾지 못했어요.'); end if;
  return public.mf__consult_json(c);
end $$;

create or replace function public.mf_consult_list(p_q text default '', p_status text default '', p_limit int default 50) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); q text := trim(coalesce(p_q,'')); qd text := public.mf__digits(p_q);
begin
  return coalesce((select jsonb_agg(x order by (x->>'created_at') desc) from (
    select jsonb_build_object('id', c.id, 'cert_no', c.cert_no, 'client_name', c.client_name, 'client_phone', c.client_phone,
      'target_name', c.target_name, 'relation', c.relation, 'product', c.product, 'burial', c.burial, 'status', c.status,
      'joined_on', c.joined_on, 'owner_name', public.mf__name(c.owner_id), 'team_name', (select name from public.mf_team where id = c.team_id),
      'funeral_id', c.funeral_id, 'created_at', c.created_at,
      'disc', coalesce((select sum((d->>'amount')::bigint) from jsonb_array_elements(c.discounts) d), 0)) x
    from public.mf_consult c
    where public.mf__see(me, c.owner_id, c.hq_id, c.team_id)
      and (coalesce(p_status,'') = '' or c.status = p_status)
      and (q = '' or c.client_name ilike '%'||q||'%' or c.target_name ilike '%'||q||'%' or c.cert_no ilike '%'||q||'%'
           or (length(qd) >= 4 and public.mf__digits(c.client_phone) like '%'||qd||'%'))
    order by c.created_at desc limit least(greatest(coalesce(p_limit,50),1),200)) t), '[]'::jsonb);
end $$;

-- ── 가입자 찾기 (상담 + 장례, 보는 범위 안에서) ───────────────────────────
create or replace function public.mf_find(p_q text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); q text := trim(coalesce(p_q,'')); qd text := public.mf__digits(p_q);
begin
  if length(q) < 2 then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(x order by (x->>'at') desc) from (
    select jsonb_build_object('kind','consult','id', c.id, 'no', c.cert_no, 'name', c.client_name, 'phone', c.client_phone,
      'sub', trim(both ' ' from concat_ws(' · ', nullif(c.target_name,'') || case when c.relation <> '' then ' ('||c.relation||')' else '' end,
             case c.product when 'nob' then '무빈소장' when 'fam' then '가족장' else '상품 상담 때' end)),
      'status', c.status, 'owner_name', public.mf__name(c.owner_id), 'at', c.created_at, 'funeral_id', c.funeral_id) x
    from public.mf_consult c
    where public.mf__see(me, c.owner_id, c.hq_id, c.team_id)
      and (c.client_name ilike '%'||q||'%' or c.target_name ilike '%'||q||'%' or c.cert_no ilike '%'||q||'%'
           or (length(qd) >= 4 and public.mf__digits(c.client_phone) like '%'||qd||'%'))
    union all
    select jsonb_build_object('kind','funeral','id', f.id, 'no', f.case_no, 'name', '故 '||f.deceased_name, 'phone', f.chief_phone,
      'sub', trim(both ' ' from concat_ws(' · ', nullif('상주 '||f.chief_name,'상주 '), nullif(f.data->>'hall',''))),
      'status', f.status, 'owner_name', public.mf__name(f.owner_id), 'at', f.created_at)
    from public.mf_funeral f
    where public.mf__see(me, f.owner_id, f.hq_id, f.team_id)
      and (f.deceased_name ilike '%'||q||'%' or f.chief_name ilike '%'||q||'%' or f.case_no ilike '%'||q||'%'
           or (length(qd) >= 4 and public.mf__digits(f.chief_phone) like '%'||qd||'%'))
    limit 40) t), '[]'::jsonb);
end $$;

-- ── 할인권 ──────────────────────────────────────────────────────────
create or replace function public.mf_coupon_get(p_code text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); cp public.mf_coupon; v_code text := upper(trim(coalesce(p_code,''))); ok boolean; vis boolean; dt date;
begin
  ok := v_code ~ '^MF-[0-9]{6}-[A-HJ-NP-Z2-9]{4}$';
  if ok then begin dt := to_date('20'||substr(v_code,4,6), 'YYYYMMDD'); exception when others then ok := false; end; end if;
  if ok and to_char(dt,'YYMMDD') <> substr(v_code,4,6) then ok := false; end if;
  if ok and (dt > (now() at time zone 'Asia/Seoul')::date or dt < date '2026-10-01') then ok := false; end if;
  select * into cp from public.mf_coupon c where c.code = v_code;
  if cp.code is null then
    return jsonb_build_object('found', false, 'code', v_code, 'format_ok', ok, 'issued_on', case when ok then dt end);
  end if;
  vis := public.mf__see(me, cp.owner_id, cp.hq_id, cp.team_id) or me.role = 'admin';
  return jsonb_build_object('found', true, 'code', cp.code, 'format_ok', ok, 'issued_on', case when ok then dt end,
    'status', cp.status, 'amount', cp.amount,
    'client_name', case when vis then cp.client_name else left(cp.client_name,1)||'○○' end,
    'client_phone', case when vis then cp.client_phone else '' end,
    'registered_at', cp.registered_at, 'registered_name', public.mf__name(cp.registered_by),
    'consult_id', case when vis then cp.consult_id end, 'cert_no', (select cert_no from public.mf_consult where id = cp.consult_id),
    'used_at', cp.used_at, 'used_name', public.mf__name(cp.used_by),
    'funeral_id', case when vis then cp.funeral_id end, 'case_no', (select case_no from public.mf_funeral where id = cp.funeral_id),
    'void_reason', cp.void_reason, 'visible', vis);
end $$;

create or replace function public.mf_coupon_register(p_code text, p_name text, p_phone text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); v_code text := upper(trim(coalesce(p_code,'')));
begin
  if exists (select 1 from public.mf_coupon c where c.code = v_code) then perform public.mf__err('이미 등록된 할인권이에요. 조회해서 상태를 봐 주세요.'); end if;
  perform public.mf__coupon_hold(me, v_code, left(coalesce(p_name,''),40), left(coalesce(p_phone,''),20), null, me.id, me.hq_id, me.team_id);
  return public.mf_coupon_get(v_code);
end $$;

create or replace function public.mf_coupon_void(p_code text, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); v_code text := upper(trim(coalesce(p_code,''))); cp public.mf_coupon;
begin
  if me.role <> 'admin' then perform public.mf__err('본사만 무효로 할 수 있어요.'); end if;
  if v_code !~ '^MF-[0-9]{6}-[A-HJ-NP-Z2-9]{4}$' then perform public.mf__err('할인권 번호가 맞지 않아요.'); end if;
  select * into cp from public.mf_coupon c where c.code = v_code for update;
  if cp.code is null then
    insert into public.mf_coupon(code, status, registered_by, void_by, void_at, void_reason) values (v_code, 'void', me.id, me.id, now(), left(coalesce(p_reason,''),120));
  elsif cp.status = 'used' then perform public.mf__err('장례에 쓰인 할인권은 장례 기록에서 먼저 빼 주세요.');
  else
    update public.mf_coupon c set status = 'void', void_by = me.id, void_at = now(), void_reason = left(coalesce(p_reason,''),120) where c.code = v_code;
  end if;
  perform public.mf__log('할인권 무효', 'coupon:'||v_code, jsonb_build_object('reason', p_reason));
  return public.mf_coupon_get(v_code);
end $$;

create or replace function public.mf_coupon_list(p_status text default '', p_limit int default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me();
begin
  return coalesce((select jsonb_agg(x order by (x->>'registered_at') desc) from (
    select jsonb_build_object('code', c.code, 'status', c.status, 'amount', c.amount, 'client_name', c.client_name,
      'registered_at', c.registered_at, 'registered_name', public.mf__name(c.registered_by), 'used_at', c.used_at,
      'cert_no', (select cert_no from public.mf_consult where id = c.consult_id), 'case_no', (select case_no from public.mf_funeral where id = c.funeral_id)) x
    from public.mf_coupon c
    where (me.role = 'admin' or public.mf__see(me, c.owner_id, c.hq_id, c.team_id))
      and (coalesce(p_status,'') = '' or c.status = p_status)
    order by c.registered_at desc limit least(greatest(coalesce(p_limit,100),1),300)) t), '[]'::jsonb);
end $$;

-- ── 장례 행사 ───────────────────────────────────────────────────────
create or replace function public.mf__funeral_json(f public.mf_funeral) returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(f) || jsonb_build_object('owner_name', public.mf__name(f.owner_id), 'owner_phone', (select phone from public.mf_staff where id = f.owner_id), 'updated_name', public.mf__name(f.updated_by),
    'hq_name', (select name from public.mf_hq where id = f.hq_id), 'team_name', (select name from public.mf_team where id = f.team_id),
    'cert_no', (select cert_no from public.mf_consult where id = f.consult_id))
$$;

create or replace function public.mf_funeral_save(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); f public.mf_funeral; v_id bigint := nullif(p->>'id','')::bigint; o public.mf_staff;
        v_owner uuid; v_consult bigint := nullif(p->>'consult_id','')::bigint; c public.mf_consult; v_data jsonb := coalesce(p->'data','{}'::jsonb);
        v_code text; codes text[]; cp public.mf_coupon;
begin
  if jsonb_typeof(v_data) <> 'object' then perform public.mf__err('장례 기록 모양이 맞지 않아요.'); end if;
  if length(trim(coalesce(p->>'deceased_name',''))) = 0 and length(trim(coalesce(p->>'chief_name',''))) = 0 then
    perform public.mf__err('고인 성함이나 상주 성함을 넣어 주세요.');
  end if;
  if v_id is not null then
    select * into f from public.mf_funeral where id = v_id for update;
    if f.id is null or not public.mf__see(me, f.owner_id, f.hq_id, f.team_id) then perform public.mf__err('장례 기록을 찾지 못했어요.'); end if;
    v_owner := f.owner_id;
  else
    v_owner := me.id;
  end if;
  if me.role in ('admin','head','leader') and nullif(p->>'owner_id','') is not null then
    select * into o from public.mf_staff where id = (p->>'owner_id')::uuid and status = 'active';
    if o.id is null or not public.mf__see(me, o.id, o.hq_id, o.team_id) then perform public.mf__err('담당자를 바꿀 수 없어요.'); end if;
    v_owner := o.id;
  end if;
  select * into o from public.mf_staff where id = v_owner;
  if v_consult is not null then
    select * into c from public.mf_consult where id = v_consult for update;
    if c.id is null or not public.mf__see(me, c.owner_id, c.hq_id, c.team_id) then perform public.mf__err('사전 상담을 찾지 못했어요.'); end if;
    if c.funeral_id is not null and c.funeral_id is distinct from v_id then perform public.mf__err('이 가입증서는 이미 다른 장례에 이어졌어요.'); end if;
  end if;
  if v_id is null then
    loop v_code := public.mf__code('MF-F-'); exit when not exists (select 1 from public.mf_funeral where case_no = v_code); end loop;
    insert into public.mf_funeral(case_no, owner_id, hq_id, team_id, created_by, updated_by)
    values (v_code, v_owner, o.hq_id, o.team_id, me.id, me.id) returning * into f;
  end if;
  -- 이어진 상담이 바뀌었으면 예전 상담은 「가입」으로 되돌림
  if f.consult_id is not null and f.consult_id is distinct from v_consult then
    update public.mf_consult set status = 'active', funeral_id = null where id = f.consult_id and funeral_id = f.id;
  end if;
  update public.mf_funeral set
    owner_id = v_owner, hq_id = case when v_owner <> f.owner_id then o.hq_id else hq_id end, team_id = case when v_owner <> f.owner_id then o.team_id else team_id end,
    consult_id = v_consult,
    status = case when p->>'status' in ('open','done','settled','cancel') then p->>'status' else status end,
    deceased_name = left(trim(coalesce(p->>'deceased_name','')),40), chief_name = left(trim(coalesce(p->>'chief_name','')),40),
    chief_phone = left(coalesce(p->>'chief_phone',''),20), start_on = nullif(p->>'start_on','')::date,
    total = coalesce(nullif(p->>'total','')::bigint, 0), data = v_data, updated_by = me.id, updated_at = now()
  where id = f.id returning * into f;
  if v_consult is not null then update public.mf_consult set status = 'done', funeral_id = f.id where id = v_consult; end if;
  -- 할인권: 이 장례의 번호는 「쓰임」, 빠진 번호는 다시 「등록」으로 (장례 한 번에 한 장)
  select coalesce(array_agg(distinct upper(trim(x->>'code'))), array[]::text[]) into codes
    from jsonb_array_elements(coalesce(v_data->'discounts','[]'::jsonb)) x where x->>'kind' = 'cp' and coalesce(x->>'code','') <> '';
  if array_length(codes,1) > 1 then perform public.mf__err('할인권은 장례 한 번에 한 장만 쓸 수 있어요.'); end if;
  update public.mf_coupon cc set status = 'registered', funeral_id = null, used_by = null, used_at = null
    where cc.funeral_id = f.id and cc.status = 'used' and not (cc.code = any(codes));
  foreach v_code in array codes loop
    select * into cp from public.mf_coupon c2 where c2.code = v_code for update;
    if cp.code is not null and cp.status = 'used' and cp.funeral_id = f.id then continue; end if;
    perform public.mf__coupon_hold(me, v_code, f.chief_name, f.chief_phone, null, f.owner_id, f.hq_id, f.team_id);
    update public.mf_coupon cc set status = 'used', funeral_id = f.id, used_by = me.id, used_at = now() where cc.code = v_code;
    perform public.mf__log('할인권 사용', 'coupon:'||v_code, jsonb_build_object('case_no', f.case_no));
  end loop;
  perform public.mf__log(case when v_id is null then '장례 접수' else '장례 고침' end, 'funeral:'||f.id,
    jsonb_build_object('case_no', f.case_no, 'deceased', f.deceased_name, 'status', f.status, 'total', f.total));
  return public.mf__funeral_json(f);
end $$;

create or replace function public.mf_funeral_get(p_id bigint) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); f public.mf_funeral;
begin
  select * into f from public.mf_funeral where id = p_id;
  if f.id is null or not public.mf__see(me, f.owner_id, f.hq_id, f.team_id) then perform public.mf__err('장례 기록을 찾지 못했어요.'); end if;
  return public.mf__funeral_json(f);
end $$;

create or replace function public.mf_funeral_list(p_q text default '', p_status text default '', p_limit int default 50) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); q text := trim(coalesce(p_q,'')); qd text := public.mf__digits(p_q);
begin
  return coalesce((select jsonb_agg(x order by (x->>'created_at') desc) from (
    select jsonb_build_object('id', f.id, 'case_no', f.case_no, 'status', f.status, 'deceased_name', f.deceased_name, 'chief_name', f.chief_name,
      'chief_phone', f.chief_phone, 'start_on', f.start_on, 'total', f.total, 'hall', f.data->>'hall', 'type', f.data->>'type',
      'owner_name', public.mf__name(f.owner_id), 'team_name', (select name from public.mf_team where id = f.team_id),
      'cert_no', (select cert_no from public.mf_consult where id = f.consult_id), 'created_at', f.created_at) x
    from public.mf_funeral f
    where public.mf__see(me, f.owner_id, f.hq_id, f.team_id)
      and (coalesce(p_status,'') = '' or f.status = p_status or (p_status = 'live' and f.status in ('open','done')))
      and (q = '' or f.deceased_name ilike '%'||q||'%' or f.chief_name ilike '%'||q||'%' or f.case_no ilike '%'||q||'%'
           or coalesce(f.data->>'hall','') ilike '%'||q||'%' or (length(qd) >= 4 and public.mf__digits(f.chief_phone) like '%'||qd||'%'))
    order by f.created_at desc limit least(greatest(coalesce(p_limit,50),1),200)) t), '[]'::jsonb);
end $$;

-- ── 기록 보기 (누가 언제) ─────────────────────────────────────────────
create or replace function public.mf_log_list(p_target text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me(); ok boolean := false; k text := split_part(coalesce(p_target,''),':',1); v text := split_part(coalesce(p_target,''),':',2);
begin
  if me.role = 'admin' then ok := true;
  elsif v !~ '^[0-9]+$' then ok := false;
  elsif k = 'consult' then ok := exists (select 1 from public.mf_consult c where c.id = v::bigint and public.mf__see(me, c.owner_id, c.hq_id, c.team_id));
  elsif k = 'funeral' then ok := exists (select 1 from public.mf_funeral f where f.id = v::bigint and public.mf__see(me, f.owner_id, f.hq_id, f.team_id));
  end if;
  if not ok then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('at', l.at, 'name', public.mf__name(l.actor), 'action', l.action) order by l.at desc)
    from (select * from public.mf_log where (p_target = '' and me.role = 'admin') or target = p_target order by at desc limit 100) l), '[]'::jsonb);
end $$;

-- ── 회사 공통 설정 (직인 그림 등) ─────────────────────────────────────
create or replace function public.mf_settings() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me();
begin
  return coalesce((select jsonb_object_agg(key, value) from public.mf_setting where key in ('stamp')), '{}'::jsonb);
end $$;

create or replace function public.mf_setting_set(p_key text, p_value text) returns void
language plpgsql security definer set search_path = public as $$
declare me public.mf_staff := public.mf__me();
begin
  if me.role <> 'admin' then perform public.mf__err('본사만 바꿀 수 있어요.'); end if;
  if p_key not in ('stamp') then perform public.mf__err('바꿀 수 없는 설정이에요.'); end if;
  if length(coalesce(p_value,'')) > 300000 then perform public.mf__err('그림이 너무 커요.'); end if;
  if coalesce(p_value,'') <> '' and p_value !~ '^data:image/(png|jpeg);base64,' then perform public.mf__err('그림 파일이 아니에요.'); end if;
  insert into public.mf_setting(key, value, updated_by, updated_at) values (p_key, coalesce(p_value,''), me.id, now())
  on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();
  perform public.mf__log('설정 바꿈', 'setting:'||p_key, '{}'::jsonb);
end $$;

-- ── 처음 한 번: 본사(관리자) 정하기 ─────────────────────────────────────
-- 앱에서 대표님이 먼저 가입하신 뒤, SQL Editor 에서 아래처럼 휴대폰 번호를 넣어 한 번 실행합니다.
--   select public.mf_set_admin('01012345678');
create or replace function public.mf_set_admin(p_phone text) returns text
language plpgsql security definer set search_path = public as $$
declare s public.mf_staff;
begin
  select * into s from public.mf_staff where public.mf__digits(phone) = public.mf__digits(p_phone) order by created_at limit 1;
  if s.id is null then return '그 번호로 가입한 직원이 없어요. 앱에서 먼저 가입해 주세요.'; end if;
  update public.mf_staff set role = 'admin', status = 'active', approved_at = coalesce(approved_at, now()) where id = s.id;
  insert into public.mf_log(actor, action, target, detail) values (s.id, '본사 지정', 'staff:'||s.id, jsonb_build_object('name', s.name));
  return s.name || ' 님을 본사(관리자)로 정했어요.';
end $$;

-- ── 함수 권한: 로그인한 사람만, 도움 함수는 앱에서 못 부름 ─────────────────
do $$ declare r record; begin
  for r in select p.oid::regprocedure as f, p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'mf\_%' loop
    execute format('revoke all on function %s from public, anon, authenticated', r.f);
    if r.proname not like 'mf\_\_%' and r.proname not in ('mf_on_signup','mf_set_admin') then
      execute format('grant execute on function %s to authenticated', r.f);
    end if;
  end loop;
end $$;
