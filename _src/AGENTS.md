# 나만의장례 홈페이지 · 작업 안내 (Claude용)

www.myfuneral.co.kr · 저장소 `Myfuneral1024/myfuneral-site` (공개) · `main` 브랜치 / (root) → GitHub Pages

## 1. 구성
- **원본은 `_src/src.html` 한 파일**이다. 안에 CSS · 8개 화면 HTML · 스크립트가 다 들어 있다.
- 공개 파일은 `python3 _src/build.py`로 만든다. **공개 파일을 직접 고치지 않는다**:
  `index.html`, `urgent/ nobinso/ price/ print/ clan/ chon/ manners/`의 `index.html`, `assets/site.css`, `assets/site.js`, `sitemap.xml`, `404.html`
- 그대로 두는 파일: `CNAME`(www.myfuneral.co.kr), `favicon.svg`, `apple-touch-icon.png`, `og.png`(카톡 공유 그림), `robots.txt`, `naverb64ba87306a5179497b82d3c875bb21e.html`(네이버 소유확인 — 지우면 안 됨), `assets/fonts/chosungs.woff`(조선궁서체)
- `_src/`는 밑줄로 시작해 GitHub Pages에 공개되지 않는다.

| 주소 | 화면 | `data-page` |
|---|---|---|
| `/` | 처음 (로고를 누르면 여기로, 메뉴엔 없음) | home |
| `/urgent/` | 장례가 발생하면 | urgent |
| `/nobinso/` | 무빈소 장례 | nobinso |
| `/price/` | 비용 계산 (한 화면에 질문 하나) | price |
| `/print/` | 출력실 (지방·위패, 명정 예시, 혼백, 축문, 상중 안내문, 부의 봉투, 부고·감사 문자) | print |
| `/clan/` | 본관 찾기 (139개 성씨 · 423개 본관) | clan |
| `/chon/` | 촌수와 호칭 (관계 찾기 · 두 사람 사이 · 가족 지도) | chon |
| `/manners/` | 조문 예절 · 부의 봉투 쓰는 법 | manners |

### build.py가 하는 일
- CSS · JS를 `assets/`로 분리, 페이지마다 그 화면 `<section>`만 넣음 (검색 노출용).
- 페이지별 title · description · canonical · og (`META` 표), 메뉴 `aria-current`, `href="#price"` → `/price/`.
- 스크립트의 `route()`를 주소 기반(`body[data-route]`)으로 바꾸고, 시작 블록을 화면별 준비 코드로 바꾼다.
  화면 사이 넘김: `/print/?clan=번호`, `/print/?rel=관계`, `/print/?tab=env`. 상태 유지: sessionStorage `mf-ps`(출력실) · `mf-pr`(비용) · `mf-ch`(촌수).
- 출력실 페이지에만 jsPDF와 서식 서체(Shippori Mincho · Yuji Syuku · 조선궁서체) 링크.
- 모든 페이지에 speculationrules prefetch, 처음 페이지에 네이버 확인 태그 · 옛 `#주소` → 새 주소 이동 · JSON-LD.
- `sitemap.xml`(8개 주소), `404.html`(옛 Framer 주소 `/services` → `/price/` 등).
- **build.py는 src.html의 특정 코드를 글자 그대로 찾아 바꾼다** (`one()`가 정확히 1번인지 확인). src.html의 `/* ── 화면 이동 ── */` 블록이나 `/* ── 시작 ── */` 블록, `clanCard` · `jibangLink`를 고치면 build.py도 같이 맞춘다.
- 메인 스크립트는 `<script>` 다음 줄이 `(function(){`로 시작해야 한다. head 안 짧은 인라인 스크립트는 줄바꿈 없이 쓴다.

## 2. 고치는 순서
1. `_src/src.html`만 고친다. 여러 군데면 Python 치환 + `assert s.count(old)==1`.
2. `python3 _src/build.py` (확인용 따로: `--out /tmp/x`)
3. `python3 -m http.server 8771` (저장소 폴더) → Playwright Chromium으로 확인
   - 8개 페이지 × 1280×900, 390×844 · pageerror 0 · 가로 스크롤 없음
   - 끝까지 스크롤한 뒤 `main` 안에 opacity 0으로 남은 것 없음 (스크롤 효과)
   - 출력실: 종교마다 위패 미리보기, 명정 예시, 상중 안내문, 축문 캡처를 Read로 열어 눈으로 본다
   - 비용 계산: 다음/이전/고치기 · 연타 · 합계 · 마지막 견적 화면
   - 화면 사이 넘김: 본관 → 출력실, 촌수 지도 → 지방, 조문 예절 → 부의 봉투
4. 배포: 저장소 연결돼 있으면 commit · push 후 `git clone`해서 확인. 아니면 저장소 전체를 '올릴파일' 폴더로 압축해 보내고, 사용자가 올린 뒤 `git clone --depth 1` + `diff -rq`로 빠진 파일 확인 (**assets 폴더가 통째로 빠진 적 있음**).
5. 이 작업 환경의 셸에서는 www.myfuneral.co.kr · 구글 폰트 · jsdelivr 접속이 막힌다. 실제 사이트 확인은 WebFetch나 사용자 컴퓨터의 브라우저(연결돼 있을 때)로.

## 3. 출력실 서식 규칙
- **지방 (일반)** — 본관 · 성은 한자, 이름은 넣지 않는다.
  아버지 `顯考學生府君神位` · 어머니 `顯妣孺人南陽洪氏神位`(본관 넣기 선택) · 남동생 `亡弟學生府君神位` · 아들 `亡子秀才○○之靈`(이름 칸 값) · 합설은 두 칸.
- **종교 위패** (경쟁사 하늘휴 sjb.gaondnc.com/jibang/ 구성을 기준으로):
  - 기독교: 빨간 십자가 + 직분 + `故 성명`(세로) + 양옆 요한복음 11:25–26 「나는 부활이요 생명이니 나를 믿는 자는 죽더라도 / 살겠고 살아서 믿는 자는 영원히 죽지 않을 것이다.」 · 8.5×25.5cm 고정 · A4에 2장
  - 천주교: 검은 십자가 + 세례명 + `故 성명` + 양옆 「주여 망자에게 영원한 안식을 주소서 / 영원한 빛을 그에게 비추소서」 · 8.5×25.5cm
  - SGI: `妙法 성명 之靈` · 4×17.5cm (하늘휴의 SGI 마크 그림은 단체 로고라 넣지 않음)
  - 불교: `先嚴父/先慈母/故 + 本貫 + 后人/孺人 + (법명) + 성명 + 靈駕` · 원불교: 일원상(○) + `(법호) 성명 영가` · 기타: `故 + 本貫姓 + 公/氏 + 靈位`
  - 불교 · 원불교 문구는 확실한 근거를 못 찾아 사용자 확인을 기다리는 중.
  - 「문구 직접 고치기」: 어느 종교든 줄 단위(한 줄 = 한 칸)로 덮어쓰기.
- **명정** — 출력하지 않는다. 「명정 예시」: 종교 6개를 나란히 + 한자 · 읽는 법 목록.
  일반 `學生本貫姓公之柩` / `孺人本貫姓氏之柩` · 기독교 직분(聖徒 · 執事 · 勸士 · 長老 · 牧師) + 本貫姓公/氏之柩 · 천주교 `敎友` + 本貫姓公/氏 + 세례명 + 之柩 (근거: 한국장례지도사협회 · 장례식장 안내) · 불교 淸信士/淸信女 · 원불교 법호(없으면 敎徒) · SGI 妙法.
- **이름 한자 입력칸은 사용자 요청으로 없앴다.** 축문용 「상주 이름 한자」 칸은 남아 있다.
- **서체**: 「고급 명조」 Shippori Mincho 800 + 한글 Noto Serif KR · 「붓글씨」 Yuji Syuku + 조선궁서체 + Shippori. **구글의 Noto Serif KR에는 妣 · 辟 · 姊 등이 없으므로 서식 주 서체로 쓰지 않는다.**
- **상중 안내문**: 날짜 · 첫 문장 · 날짜 뒤 문구 · 끝 문장 · 빈소(장례식장 · 호실, 왼쪽 장례 정보와 연동) · 올리는 사람 · 연락처.
- **인쇄**: 실제 주소에서는 `window.print()` + `@page` 실제 크기 이미지. 미리보기 창(iframe) 안에서는 PDF 저장으로 대신.

## 4. 비용 계산 (가격 단위: 만원)
- 장례 형태: 무빈소 60 · 가족장(3일장) 70 → 모시는 방식: 화장 · 매장 · 미정
- 관: 화장용 오동나무 20 · 화장용 오동나무(특수관) 30 · 매장용 오동나무 30 · 매장용 솔송관 80 · 매장용 향나무관 160 (화장이면 c1 · c2, 매장이면 c3 · c4 · c5)
- 수의: 면 15 · 저마 20 · 황토 30 · 쟈가드 50 · 대마 60 / 입관: 없음 · 생화 꽃장식 20 · 궁중대렴 20 · 둘 다 30 / 빈소 헌화: 30송이 5 · 50송이 7
- 장의 차량: 필요 없음(화장장 안 장례식장을 쓸 때만) · 카니발·스타리아 30 · 리무진(편도, 1차 장지 또는 화장장까지) 40 · 장의버스(왕복) 45 · 둘 다 80
- 접객 도우미: 첫째 날 · 둘째 날 인원, 1인 12만원 (4일장 이상은 현장 상담) · 상복 남 5만 · 여 3만 · 수급자 · 국가유공자 −20
- 선택해도 바로 넘어가지 않고 「다음」을 눌러야 넘어간다. 항목마다 설명 문구가 있다.

## 5. 움직임
- **첫 화면은 숨기지 않는다** (예전에 미리 숨겼다가 "화면이 늦게 온다"는 지적을 받음).
- 화면 밖에 있던 내용만 `.rv` → IntersectionObserver → Web Animations (900ms, `cubic-bezier(0.19,1,0.22,1)`, 28px, 85ms 간격).
- 메뉴 이동: `@view-transition{navigation:auto}`, `.top` · `.callbar`는 고정 이름, 본문만 vtOut 200ms / vtIn 520ms.
- 비용 계산: `wzLeave` 170ms → `renderWizard` → `wzEnter`(높이 420ms, 항목 560ms · 45ms 간격), 진행 막대 scaleX 600ms, 합계 `setRun` 숫자 올라감, `WZ_BUSY`로 연타 막음.
- `prefers-reduced-motion`이면 모두 끈다.

## 6. 함정
- Playwright 녹화 영상은 프레임이 빠져 끊겨 보인다 → 시연 영상은 CDP `Animation.setPlaybackRate 0.2`로 녹화하고 ffmpeg `setpts=0.2*PTS`로 되돌린다.
- 글꼴 확인: 셸에서 구글 폰트를 못 받으니 npm `@fontsource/*` · `@noonnu/chosun-gs`를 받아 Playwright `route`로 대신 넣는다. 글자가 있는지는 fontTools로 cmap 확인.
- `pkill -f "http.server …"`는 명령줄이 겹쳐 자기 셸까지 끝낼 수 있다 → 포트를 바꿔 새로 띄운다.
- DNS(가비아): A @ 185.199.108~111.153, CNAME www → `myfuneral1024.github.io.` · `cost` CNAME(다른 서비스)은 건드리지 않는다.
