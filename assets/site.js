(function(){
'use strict';
const $=(s,r)=> (r||document).querySelector(s);
const $$=(s,r)=> Array.from((r||document).querySelectorAll(s));
const PHONE='1661-4214';
const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ── 알림 · 복사 · 파일 저장 ── */
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.hidden=false; clearTimeout(toast._t); toast._t=setTimeout(()=>{t.hidden=true;},2800); }
function copyText(text, okMsg, el){
  let p;
  try{ p=navigator.clipboard.writeText(text); }catch(e){ p=Promise.reject(e); }
  p.then(()=>toast(okMsg||'복사했습니다')).catch(()=>{
    if(el){ const r=document.createRange(); r.selectNodeContents(el); const s=getSelection(); s.removeAllRanges(); s.addRange(r); }
    toast(el?'선택된 글을 길게 눌러 복사해 주세요':'번호를 길게 눌러 복사해 주세요: '+text);
  });
}
let dlPromise=null;
const BROWSER_DL={save:function(o){ return new Promise(function(res,rej){ try{ const ext=(o.filename.split('.').pop()||'').toLowerCase(); const type={pdf:'application/pdf',png:'image/png'}[ext]||'application/octet-stream'; const blob=o.data instanceof Blob?o.data:new Blob([o.data],{type:type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=o.filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); },5000); res({status:'saved'}); }catch(e){ rej({code:'unavailable'}); } }); }};
function getDownloads(){
  if(!dlPromise){ dlPromise=(window.claude&&typeof window.claude.use==='function')?window.claude.use('downloads').then(d=>d||null).catch(()=>null):Promise.resolve(BROWSER_DL); }
  return dlPromise;
}
async function saveFile(filename,data,okMsg){
  const dl=await getDownloads();
  if(!dl){ toast('이 화면에서는 파일 저장을 쓸 수 없어요'); return false; }
  try{ const r=await dl.save({filename,data}); if(r&&r.status==='delivered'){return true;} toast(okMsg); return true; }
  catch(err){ const c=err&&err.code; toast(c==='declined'?'저장을 취소했습니다':c==='rate_limited'?'저장 창이 이미 열려 있어요':'파일을 저장하지 못했습니다'); return false; }
}
document.addEventListener('click',e=>{
  const c=e.target.closest('[data-copy]'); if(c){ copyText(c.getAttribute('data-copy'),'전화번호를 복사했습니다'); }
  const g=e.target.closest('[data-goto-tab]'); if(g){ PS.tab=g.getAttribute('data-goto-tab'); }
});

/* ── 화면 이동 (메뉴마다 주소가 따로 있음) ── */
const PAGES=['home','urgent','nobinso','price','print','clan','chon','manners'];
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
}

/* ── 본관 자료 ── */
const CLAN_SRC='김:金=김해:金海,경주:慶州,광산:光山,김녕:金寧,안동:安東,의성:義城,강릉:江陵,선산:善山,청풍:淸風,연안:延安,언양:彦陽,삼척:三陟,상산:商山,영광:靈光,해평:海平,울산:蔚山,서흥:瑞興,예안:禮安,순천:順天,원주:原州,수원:水原,경산:慶山,의령:宜寧,나주:羅州,청도:淸道,고령:高靈,함창:咸昌,개성:開城,부안:扶安,통진:通津,화순:和順,양근:楊根,진주:晉州,전주:全州,광주:光州,도강:道康,영동:永同,풍산:豊山,평해:平海,고성:固城,춘천:春川,청주:淸州,상주:尙州,수안:遂安,해풍:海豊,영산:永山'
+';이:李=전주:全州,경주:慶州,성주:星州,광주:廣州,연안:延安,한산:韓山,전의:全義,고성:固城,합천:陜川,인천:仁川,진성:眞城,벽진:碧珍,덕수:德水,경산:京山,여주:驪州,재령:載寧,용인:龍仁,신평:新平,공주:公州,함평:咸平,양성:陽城,영천:永川,청주:淸州,단양:丹陽,원주:原州,수안:遂安,홍주:洪州,우봉:牛峰,예안:禮安,학성:鶴城,아산:牙山,평창:平昌,가평:加平,장수:長水,안악:安岳,진주:晉州,봉산:鳳山,영해:寧海,개성:開城,양산:梁山,우계:羽溪,부평:富平,서림:西林,순천:順天'
+';박:朴=밀양:密陽,반남:潘南,함양:咸陽,순천:順天,무안:務安,죽산:竹山,고령:高靈,상주:尙州,충주:忠州,영해:寧海,진원:珍原,비안:比安,울산:蔚山,운봉:雲峰,춘천:春川,강릉:江陵,음성:陰城,면천:沔川,문의:文義,태안:泰安,영암:靈巖,구산:龜山,경주:慶州'
+';최:崔=경주:慶州,전주:全州,해주:海州,강릉:江陵,수성:隋城,화순:和順,탐진:耽津,삭녕:朔寧,통천:通川,충주:忠州,초계:草溪,양천:陽川,영천:永川,강화:江華,흥해:興海,원주:原州,청주:淸州,동주:東州,월성:月城'
+';정:鄭=동래:東萊,경주:慶州,진주:晉州,연일:延日,영일:迎日,하동:河東,초계:草溪,광주:光州,청주:淸州,해주:海州,서산:瑞山,나주:羅州,봉화:奉化,온양:溫陽,진양:晉陽'
+';정:丁=나주:羅州,압해:押海,영광:靈光,의성:義城;정:程=하남:河南'
+';강:姜=진주:晉州,금천:衿川;강:康=신천:信川,곡산:谷山,재령:載寧'
+';조:趙=한양:漢陽,함안:咸安,풍양:豊壤,양주:楊州,임천:林川,평양:平壤,김제:金堤,순창:淳昌,배천:白川,횡성:橫城,옥천:玉川,진보:眞寶;조:曺=창녕:昌寧'
+';윤:尹=파평:坡平,해남:海南,칠원:漆原,해평:海平,남원:南原,무송:茂松,함안:咸安,영천:永川,여주:驪州,신령:新寧'
+';장:張=인동:仁同,안동:安東,흥덕:興德,단양:丹陽,결성:結城,덕수:德水,순천:順天,목천:木川,울진:蔚珍,창녕:昌寧,진천:鎭川;장:蔣=아산:牙山'
+';임:林=나주:羅州,평택:平澤,예천:醴泉,부안:扶安,울진:蔚珍,은진:恩津,조양:兆陽;임:任=풍천:豊川,장흥:長興'
+';한:韓=청주:淸州,곡산:谷山;오:吳=해주:海州,동복:同福,보성:寶城,나주:羅州,군위:軍威,함양:咸陽,낙안:樂安,고창:高敞'
+';서:徐=달성:達城,이천:利川,대구:大丘,연산:連山,장성:長城,부여:扶餘'
+';신:申=평산:平山,고령:高靈;신:辛=영산:靈山,영월:寧越;신:愼=거창:居昌;권:權=안동:安東,예천:醴泉'
+';황:黃=창원:昌原,장수:長水,평해:平海,우주:紆州,회덕:懷德,상주:尙州;안:安=순흥:順興,죽산:竹山,광주:廣州,탐진:耽津'
+';송:宋=여산:礪山,은진:恩津,진천:鎭川,야성:冶城,김해:金海,신평:新平,홍주:洪州'
+';전:全=천안:天安,정선:旌善,옥천:沃川,용궁:龍宮,경산:慶山,완산:完山;전:田=담양:潭陽,남원:南原;전:錢=문경:聞慶'
+';홍:洪=남양:南陽,풍산:豊山,부림:缶林;류:柳=문화:文化,전주:全州,진주:晉州,고흥:高興,풍산:豊山,서산:瑞山'
+';유:兪=기계:杞溪,무안:務安,창원:昌原;유:劉=강릉:江陵,거창:居昌;유:庾=무송:茂松,평산:平山'
+';고:高=제주:濟州,장흥:長興,횡성:橫城,개성:開城;문:文=남평:南平,감천:甘泉;양:梁=남원:南原,제주:濟州,충주:忠州;양:楊=청주:淸州,남원:南原'
+';손:孫=밀양:密陽,경주:慶州,평해:平海,안동:安東,일직:一直;배:裵=성주:星州,분성:盆城,달성:達城,경주:慶州,흥해:興海,대구:大丘'
+';백:白=수원:水原;허:許=김해:金海,양천:陽川,하양:河陽,태인:泰仁;남:南=의령:宜寧,영양:英陽,고성:固城'
+';심:沈=청송:靑松,삼척:三陟,풍산:豊山,부유:富有;노:盧=광주:光州,교하:交河,풍천:豊川,장연:長淵,안강:安康;노:魯=함평:咸平,강화:江華'
+';하:河=진주:晉州;하:夏=달성:達城;곽:郭=현풍:玄風,청주:淸州;성:成=창녕:昌寧;차:車=연안:延安'
+';주:朱=신안:新安,능성:綾城;주:周=상주:尙州,초계:草溪;우:禹=단양:丹陽;구:具=능성:綾城,창원:昌原;구:丘=평해:平海'
+';민:閔=여흥:驪興;진:陳=여양:驪陽,삼척:三陟;진:秦=풍기:豊基;진:晋=남원:南原;지:池=충주:忠州;엄:嚴=영월:寧越'
+';채:蔡=평강:平康,인천:仁川;원:元=원주:原州;천:千=영양:潁陽;방:方=온양:溫陽,군위:軍威;방:房=남양:南陽;공:孔=곡부:曲阜'
+';현:玄=연주:延州;함:咸=강릉:江陵,양근:楊根;변:卞=초계:草溪,밀양:密陽;변:邊=원주:原州,황주:黃州;염:廉=파주:坡州,서원:瑞原'
+';여:呂=함양:咸陽,성주:星州;여:余=의령:宜寧;추:秋=추계:秋溪;도:都=성주:星州,팔거:八莒;소:蘇=진주:晉州'
+';석:石=충주:忠州,해주:海州;석:昔=월성:月城;선:宣=보성:寶城;설:薛=순창:淳昌,경주:慶州;마:馬=장흥:長興,목천:木川'
+';길:吉=해평:海平;연:延=곡산:谷山;표:表=신창:新昌;명:明=서촉:西蜀,연안:延安;기:奇=행주:幸州;반:潘=거제:巨濟,광주:光州'
+';왕:王=개성:開城;금:琴=봉화:奉化;옥:玉=의령:宜寧;육:陸=옥천:沃川;인:印=교동:喬桐;맹:孟=신창:新昌;제:諸=칠원:漆原'
+';모:牟=함평:咸平;탁:卓=광산:光山;국:鞠=담양:潭陽;어:魚=함종:咸從,충주:忠州;은:殷=행주:幸州;편:片=절강:浙江'
+';용:龍=홍천:洪川;예:芮=의흥:義興;경:慶=청주:淸州;봉:奉=하음:河陰,강화:江華;사:史=청주:淸州;부:夫=제주:濟州'
+';가:賈=소주:蘇州;복:卜=면천:沔川;태:太=영순:永順,협계:陜溪;목:睦=사천:泗川;계:桂=수안:遂安;피:皮=괴산:槐山'
+';두:杜=두릉:杜陵;감:甘=회산:檜山;음:陰=죽산:竹山;빈:賓=달성:達城;승:承=연일:延日;동:董=광천:廣川;위:魏=장흥:長興'
+';호:扈=신평:新平;온:溫=금구:金溝;갈:葛=남양:南陽;단:段=강음:江陰;견:甄=전주:全州;간:簡=가평:加平;상:尙=목천:木川'
+';형:邢=진주:晉州;궁:弓=토산:兎山;시:施=절강:浙江;나:羅=나주:羅州,금성:錦城,안정:安定;당:唐=밀양:密陽'
+';남궁:南宮=함열:咸悅;제갈:諸葛=남양:南陽;황보:皇甫=영천:永川;선우:鮮于=태원:太原;서문:西門=안음:安陰;독고:獨孤=남원:南原';
const CLANS=[];
CLAN_SRC.split(';').forEach(g=>{
  const parts=g.split('='); if(parts.length<2) return;
  const sur=parts[0].split(':');
  parts[1].split(',').forEach(it=>{ const b=it.split(':'); if(b.length===2) CLANS.push({bk:b[0],bh:b[1],sk:sur[0],sh:sur[1]}); });
});
function nrm(s){ return String(s||'').replace(/\s/g,'').replace(/류/g,'유').replace(/로/g,'노').replace(/림/g,'임').replace(/리/g,'이').replace(/라/g,'나'); }
function searchClans(q,limit){
  const n=nrm(q), raw=String(q||'').replace(/\s/g,''); if(!n) return [];
  const out=[];
  CLANS.forEach((c,i)=>{
    const full=nrm(c.bk+c.sk), s=nrm(c.sk), b=nrm(c.bk);
    let sc=-1;
    if(full===n) sc=5; else if(s===n) sc=4; else if(b===n) sc=3; else if(full.indexOf(n)>=0) sc=2; else if((c.bh+c.sh).indexOf(raw)>=0) sc=1;
    if(sc>=0) out.push({sc,i,c});
  });
  out.sort((a,b)=>b.sc-a.sc||a.i-b.i);
  return out.slice(0,limit||400).map(x=>x.c);
}
const clanLabel=c=> c? ((c.bk||'')+' '+(c.sk||'')).trim() : '';

/* ── 서식 규칙 ── */
const REL={
  f:{g:'m',h:'顯考',r:'현고',gen:1}, m:{g:'f',h:'顯妣',r:'현비',gen:1},
  gf:{g:'m',h:'顯祖考',r:'현조고',gen:2}, gm:{g:'f',h:'顯祖妣',r:'현조비',gen:2},
  ggf:{g:'m',h:'顯曾祖考',r:'현증조고',gen:3}, ggm:{g:'f',h:'顯曾祖妣',r:'현증조비',gen:3},
  gggf:{g:'m',h:'顯高祖考',r:'현고조고',gen:4}, gggm:{g:'f',h:'顯高祖妣',r:'현고조비',gen:4},
  hus:{g:'m',h:'顯辟',r:'현벽'}, wife:{g:'f',h:'亡室',r:'망실'},
  bro:{g:'m',h:'顯兄',r:'현형'}, sil:{g:'f',h:'顯兄嫂',r:'현형수'},
  ybro:{g:'m',h:'亡弟',r:'망제'}, son:{g:'m',h:'亡子',r:'망자',named:true}
};
const PAIRS={1:['f','m'],2:['gf','gm'],3:['ggf','ggm'],4:['gggf','gggm']};
const PAIR_LABEL={1:'부모님',2:'조부모님',3:'증조부모님',4:'고조부모님'};
const WIFE_LABEL={1:'어머니 본관 · 성씨',2:'할머니 본관 · 성씨',3:'증조할머니 본관 · 성씨',4:'고조할머니 본관 · 성씨'};
const TTL={hak:['學生','학생'],cheo:['處士','처사']};
const JB={L:[50,195,'대'],S:[40,175,'소'],T:[60,220,'전통']};
const MJ={A4x2:{w:210,ph:297,n:2,l:'A4 2장 이어 붙이기'},A4x3:{w:210,ph:297,n:3,l:'A4 3장 이어 붙이기'},A3x2:{w:297,ph:420,n:2,l:'A3 2장 이어 붙이기'}};
const CKT={'孤子':'고자','哀子':'애자','孤哀子':'고애자','孝子':'효자','孤孫':'고손','哀孫':'애손'};
const CKN={jojeon:'조전축',balin:'발인축',sansin:'산신축',jeju:'제주축',u1:'초우축',u2:'재우축',u3:'삼우축'};
const ENV={buui:['賻儀'],geunjo:['謹弔'],chumo:['追慕'],chudo:['追悼'],aedo:['哀悼'],myeongbok:['삼가 고인의','명복을 빕니다'],buuiK:['부의']};
const LM=[["2025-01-29",2025,1,0],["2025-02-28",2025,2,0],["2025-03-29",2025,3,0],["2025-04-28",2025,4,0],["2025-05-27",2025,5,0],["2025-06-25",2025,6,0],["2025-07-25",2025,6,1],["2025-08-23",2025,7,0],["2025-09-22",2025,8,0],["2025-10-21",2025,9,0],["2025-11-20",2025,10,0],["2025-12-20",2025,11,0],["2026-01-19",2025,12,0],["2026-02-17",2026,1,0],["2026-03-19",2026,2,0],["2026-04-17",2026,3,0],["2026-05-17",2026,4,0],["2026-06-15",2026,5,0],["2026-07-14",2026,6,0],["2026-08-13",2026,7,0],["2026-09-11",2026,8,0],["2026-10-11",2026,9,0],["2026-11-09",2026,10,0],["2026-12-09",2026,11,0],["2027-01-08",2026,12,0],["2027-02-07",2027,1,0],["2027-03-08",2027,2,0],["2027-04-07",2027,3,0],["2027-05-06",2027,4,0],["2027-06-05",2027,5,0],["2027-07-04",2027,6,0],["2027-08-02",2027,7,0],["2027-09-01",2027,8,0],["2027-09-30",2027,9,0],["2027-10-29",2027,10,0],["2027-11-28",2027,11,0],["2027-12-28",2027,12,0],["2028-01-27",2028,1,0],["2028-02-25",2028,2,0],["2028-03-26",2028,3,0],["2028-04-25",2028,4,0],["2028-05-24",2028,5,0],["2028-06-23",2028,5,1],["2028-07-22",2028,6,0],["2028-08-20",2028,7,0],["2028-09-19",2028,8,0],["2028-10-18",2028,9,0],["2028-11-16",2028,10,0],["2028-12-16",2028,11,0]];
const GS='甲乙丙丁戊己庚辛壬癸',GB='子丑寅卯辰巳午未申酉戌亥',KS='갑을병정무기경신임계',KB='자축인묘진사오미신유술해';
const WD=['일','월','화','수','목','금','토'];
const NH=['','一','二','三','四','五','六','七','八','九'],NK=['','일','이','삼','사','오','육','칠','팔','구'];
const MK=['','정','이','삼','사','오','유','칠','팔','구','시','십일','십이'];
const isoOk=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'');
const utcDays=s=>{const p=s.split('-').map(Number);return Math.floor(Date.UTC(p[0],p[1]-1,p[2])/86400000);};
const dayIdx=s=>((utcDays(s)+17)%60+60)%60;
const gzH=i=>GS[i%10]+GB[i%12], gzK=i=>KS[i%10]+KB[i%12];
const numH=n=>n<10?NH[n]:(Math.floor(n/10)>1?NH[Math.floor(n/10)]:'')+'十'+NH[n%10];
const numK=n=>n<10?NK[n]:(Math.floor(n/10)>1?NK[Math.floor(n/10)]:'')+'십'+NK[n%10];
function lunar(s){ if(!isoOk(s)) return null; let st=null; for(const r of LM){ if(r[0]<=s) st=r; else break; } if(!st) return null; const d=utcDays(s)-utcDays(st[0])+1; if(d>30) return null; return {y:st[1],m:st[2],leap:st[3],d,shuo:dayIdx(st[0]),day:dayIdx(s)}; }
function fmtD(s){ if(!isoOk(s)) return '[날짜]'; const p=s.split('-').map(Number); const w=new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay(); return p[1]+'월 '+String(p[2]).padStart(2,'0')+'일('+WD[w]+')'; }
const or=(x,ph)=> (x&&String(x).trim())?x:ph;

/* ── 출력실 상태 ── */
const findClan=(bk,sk)=>CLANS.find(c=>c.bk===bk&&c.sk===sk)||CLANS[0];
const PS={
  tab:'jb', rlg:'yu', rel:'f', c1:findClan('남양','홍'), c2:findClan('김해','김'), man:false, mbk:'', msk:'', mbh:'', msh:'',
  nameK:'길동', ttl:'hak', ttlH:'', role:'집사', bap:'요셉', beop:'', wonHo:'', jbCus:false, jbText:'', pair:false, han:'0', bon:true, wt:800, font:'my',
  jbSize:'L', copies:3, mjSize:'A4x2', hbItem:'box', hbChar:'前', hbSize:10, hbName:false,
  ck:'balin', ckDate:'2026-10-20', ckTitle:'auto', sjFrom:'2026-10-18', sjTo:'2026-10-20', sjHall:true, sjL1:'집안에 상(喪)을 당하여', sjL2:'문을 닫습니다.', sjL3:'너그러운 양해 부탁드립니다.', sjSign:'주인 올림', sjTel:'',
  envWord:'buui', envName:'김민수', envOrg:'',
  sangK:'홍민준', sangH:'', tel:'010-0000-0000', hall:'○○장례식장', room:'3호실', hallTel:'', dDie:'2026-10-18', dOut:'2026-10-20', tOut:'오전 8시', place:'○○추모공원'
};
let HIST=[];
try{ HIST=JSON.parse(localStorage.getItem('mf-hist')||'[]')||[]; }catch(e){ HIST=[]; }

function C1(){ return PS.man?{bk:PS.mbk,sk:PS.msk,bh:PS.mbh,sh:PS.msh}:PS.c1; }
function model(){
  const R=REL[PS.rel]||REL.f, c1=C1(), c2=PS.c2;
  const T=PS.ttl==='cus'?[PS.ttlH||'學生',PS.ttlH||'학생']:(TTL[PS.ttl]||TTL.hak);
  const fullK=(c1.sk||'')+(PS.nameK||'');
  const isYu=PS.rlg==='yu', canPair=isYu&&!!R.gen, pairOn=canPair&&!!PS.pair;
  const nmH=PS.nameK||'';
  const one=(rk,c)=>{ const r=REL[rk];
    if(r.g==='m'){ if(r.named) return {h:r.h+'秀才'+(nmH||'○○')+'之靈',k:r.r+'수재'+(PS.nameK||'○○')+'지령'}; return {h:r.h+T[0]+'府君神位',k:r.r+T[1]+'부군신위'}; }
    return {h:r.h+'孺人'+(PS.bon?c.bh:'')+c.sh+'氏神位',k:r.r+'유인'+(PS.bon?c.bk:'')+c.sk+'씨신위'}; };
  let jcols;
  if(!isYu){
    const bp=(PS.beop||'').trim(), wh=(PS.wonHo||'').trim();
    const mm=R.g==='m', bnH=c1.bh||'', bnK=c1.bk||'', nmF=or(fullK,'○○○');
    const pre={f:['先嚴父','선엄부'],m:['先慈母','선자모'],gf:['先祖父','선조부'],gm:['先祖母','선조모']}[PS.rel]||['故','고'];
    if(PS.rlg==='chr') jcols=[{h:(PS.role||'성도')+' 故'+nmF,k:(PS.role||'성도')+' 고'+nmF}];
    else if(PS.rlg==='cat') jcols=[{h:(PS.bap||'세례명')+' 故'+nmF,k:(PS.bap||'세례명')+' 고'+nmF}];
    else if(PS.rlg==='sgi') jcols=[{h:'妙法'+nmF+'之靈',k:'묘법'+nmF+'지령'}];
    else if(PS.rlg==='bud') jcols=[{h:pre[0]+bnH+(mm?'后人':'孺人')+bp+nmF+'靈駕',k:pre[1]+bnK+(mm?'후인':'유인')+bp+nmF+'영가'}];
    else if(PS.rlg==='won') jcols=[{h:wh+nmF+'영가',k:wh+nmF+'영가'}];
    else jcols=[{h:'故'+(c1.bh||'')+(c1.sh||'')+(mm?'公':'氏')+'靈位',k:'고'+bnK+(c1.sk||'')+(mm?'공':'씨')+'영위'}];
  } else if(pairOn){ const pr=PAIRS[R.gen]; jcols=[one(pr[0],c1),one(pr[1],R.g==='f'?c1:c2)]; }
  else jcols=[one(PS.rel,c1)];
  const han=PS.han==='1';
  const jbAuto=jcols.map(t=>han?t.k:t.h);
  const cus=PS.jbCus&&String(PS.jbText||'').trim()?String(PS.jbText).split('\n').map(x=>x.trim()).filter(Boolean).slice(0,3):null;
  const jb=cus||jbAuto;
  const nmFull=or(fullK,'○○○');
  const faith=cus?null:PS.rlg==='chr'?{kind:'cross',color:'#a32323',role:PS.role||'성도',name:'故'+nmFull,right:['나는','부활이요','생명이니','나를','믿는','자는','죽더라도'],left:['살겠고','살아서','믿는','자는','영원히','죽지','않을','것이다.'],sideTop:0.18}
    :PS.rlg==='cat'?{kind:'cross',color:'#1b1b1b',role:or(PS.bap,'세례명'),name:'故'+nmFull,right:['주여','망자에게','영원한','안식을','주소서'],left:['영원한','빛을','그에게','비추소서'],sideTop:0.35}
    :PS.rlg==='sgi'?{kind:'sgi',name:nmFull}
    :PS.rlg==='won'?{kind:'won'}:null;
  const dims=(faith&&(faith.kind==='cross'))?{w:85,h:255,l:'종교 위패',fixed:true}:(faith&&faith.kind==='sgi')?{w:40,h:175,l:'SGI 위패',fixed:true}:(function(){ const z=JB[PS.jbSize]; return {w:jb.length>1?Math.round(z[0]*(jb.length>2?2.4:1.7)):z[0],h:z[1],l:z[2],single:z[0],fixed:false}; })();
  const male=R.g==='m', bon=or((c1.bh||'')+(c1.sh||''),'本貫姓'), bonK=or((c1.bk||'')+(c1.sk||''),'본관성');
  const gH=male?'公':'氏', gK=male?'공':'씨', nmK=or(fullK,'○○○');
  const RH={'성도':'聖徒','집사':'執事','권사':'勸士','장로':'長老','목사':'牧師'};
  const role=PS.role||'성도', bap=(PS.bap||'').trim(), bp2=(PS.beop||'').trim(), wh2=(PS.wonHo||'').trim();
  const mjAll=[
    {v:'yu',l:'일반',h:male?T[0]+bon+'公之柩':'孺人'+bon+'氏之柩',k:male?T[1]+' '+bonK+'공 지구':'유인 '+bonK+'씨 지구'},
    {v:'chr',l:'기독교',h:(RH[role]||'聖徒')+bon+gH+'之柩',k:role+' '+bonK+gK+' 지구'},
    {v:'cat',l:'천주교',h:'敎友'+bon+gH+(bap||'세례명')+'之柩',k:'교우 '+bonK+gK+' '+(bap||'세례명')+' 지구'},
    {v:'bud',l:'불교',h:(male?'淸信士':'淸信女')+bon+gH+bp2+'之柩',k:(male?'청신사 ':'청신녀 ')+bonK+gK+' '+(bp2?bp2+' ':'')+'지구'},
    {v:'won',l:'원불교',h:(wh2?wh2+' ':'敎徒')+bon+gH+'之柩',k:(wh2||'교도')+' '+bonK+gK+' 지구'},
    {v:'sgi',l:'SGI',h:'妙法'+bon+gH+'之柩',k:'묘법 '+bonK+gK+' 지구'}
  ];
  const mjSel=mjAll.find(x=>x.v===PS.rlg)||mjAll[0];
  const mjT={h:mjSel.h,k:mjSel.k};
  const dec=R.g==='m'?(R.named?[R.h+T[0]+nmH,R.r+T[1]+(PS.nameK||'')]:[R.h+T[0]+'府君',R.r+T[1]+'부군']):[R.h+'孺人'+(PS.bon?c1.bh:'')+c1.sh+'氏',R.r+'유인'+(PS.bon?c1.bk:'')+c1.sk+'씨'];
  const autoT={f:'孤子',m:'哀子',gf:'孤孫',gm:'哀孫'}[PS.rel]||'孝子';
  const ckt=PS.ckTitle==='auto'?autoT:PS.ckTitle;
  const sH=or(PS.sangH||PS.sangK,'某'), sK=or(PS.sangK,'모');
  const who=[ckt+' '+sH+' 敢昭告于',(CKT[ckt]||'')+' '+sK+' 감소고우'];
  const ref=R.g==='m'?[T[0]+c1.bh+c1.sh+'公',T[1]+c1.bk+c1.sk+'공']:['孺人'+c1.bh+c1.sh+'氏','유인'+c1.bk+c1.sk+'씨'];
  const lines=[]; let lunarNote='', ckWarn='';
  const hdr=!(PS.ck==='balin'||PS.ck==='jojeon');
  if(hdr){ const L=lunar(PS.ckDate);
    if(!L){ ckWarn='음력 · 간지 자동 계산은 2025년 1월 29일부터 2028년 12월까지 날짜만 됩니다.'; lunarNote='날짜를 다시 골라 주세요.'; }
    else { const yi=((L.y-4)%60+60)%60;
      const mH=(L.leap?'閏':'')+(L.m===1?'正':numH(L.m))+'月', mK=(L.leap?'윤':'')+MK[L.m]+'월';
      lines.push(['維 歲次 '+gzH(yi)+' '+mH+' '+gzH(L.shuo)+'朔','유 세차 '+gzK(yi)+' '+mK+' '+gzK(L.shuo)+'삭']);
      lines.push([numH(L.d)+'日 '+gzH(L.day),numK(L.d)+'일 '+gzK(L.day)]);
      lunarNote='음력 '+(L.leap?'윤':'')+L.m+'월 '+L.d+'일 · '+gzK(yi)+'년 '+gzK(L.day)+'일'; } }
  if(PS.ck==='balin') lines.push(['靈輀旣駕','영이기가'],['往卽幽宅','왕즉유택'],['載陳遣禮','재진견례'],['永訣終天','영결종천']);
  else if(PS.ck==='jojeon') lines.push(['永遷之禮','영천지례'],['靈辰不留','영신불류'],['今奉柩車','금봉구거'],['式遵祖道','식준조도']);
  else if(PS.ck==='sansin') lines.push(['幼學 '+sH+' 敢昭告于','유학 '+sK+' 감소고우'],['土地之神','토지지신'],['今爲 '+ref[0]+' 營建宅兆','금위 '+ref[1]+' 영건택조'],['神其保佑 俾無後艱','신기보우 비무후간'],['謹以 淸酌脯醢','근이 청작포혜'],['祗薦于神 尙饗','지천우신 상향']);
  else if(PS.ck==='jeju') lines.push(who,dec,['形歸窀穸 神返室堂','형귀둔석 신반실당'],['神主旣成 伏惟尊靈','신주기성 복유존령'],['舍舊從新 是憑是依','사구종신 시빙시의']);
  else { const U={u1:['初虞','초우','祫事','협사'],u2:['再虞','재우','虞事','우사'],u3:['三虞','삼우','成事','성사']}[PS.ck];
    lines.push(who,dec,['日月不居 奄及'+U[0],'일월불거 엄급'+U[1]],['夙興夜處 哀慕不寧','숙흥야처 애모불녕'],['謹以 淸酌庶羞','근이 청작서수'],['哀薦'+U[2]+' 尙饗','애천'+U[3]+' 상향']); }
  const fullName=or(fullK,'[고인 성함]');
  const hbName=jb[0]? (isYu? (dec[0]) : jb[0]) : '';
  return {R,c1,c2,T,fullK,fullName,isYu,canPair,pairOn,jb,jbAuto,faith,dims,mjAll,mj:mjT.h,dec,lines,lunarNote,ckWarn,hdr,ckWho:['jeju','u1','u2','u3'].indexOf(PS.ck)>=0,hbName};
}

/* ── 그리기 ── */
const SERIF_MY='"Shippori Mincho","Noto Serif KR","Nanum Myeongjo","AppleMyungjo",serif';
const SERIF_BR='"Yuji Syuku","ChosunGs","Shippori Mincho","Noto Serif KR",serif';
const SANS='"IBM Plex Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif';
const fnt=(wt,px,fam)=>fam?(wt+' '+px+'px '+fam):(PS.font==='brush'?'400 '+px+'px '+SERIF_BR:wt+' '+px+'px '+SERIF_MY);
function spread(ctx,chars,cx,top,bottom,fs){ ctx.textAlign='center'; ctx.textBaseline='middle'; const n=chars.length; if(!n) return; if(n===1){ ctx.fillText(chars[0],cx,(top+bottom)/2); return; } const step=(bottom-top-fs)/(n-1); chars.forEach((ch,i)=>ctx.fillText(ch,cx,top+fs/2+i*step)); }
function flowV(ctx,str,cx,top,fs,pitch){ ctx.textAlign='center'; ctx.textBaseline='middle'; let y=top+fs/2; for(const ch of Array.from(str)){ if(ch===' '){ y+=fs*0.55; continue; } ctx.fillText(ch,cx,y); y+=fs*pitch; } }
function vlen(str,fs,pitch){ let L=0; for(const ch of Array.from(str)){ L+= ch===' '?fs*0.55:fs*pitch; } return L; }
function chamfer(ctx,x,y,w,h,c){ ctx.beginPath(); ctx.moveTo(x+c,y); ctx.lineTo(x+w-c,y); ctx.lineTo(x+w,y+c); ctx.lineTo(x+w,y+h); ctx.lineTo(x,y+h); ctx.lineTo(x,y+c); ctx.closePath(); }
function cutLine(ctx,k){ ctx.setLineDash([1.4*k,1*k]); ctx.lineWidth=Math.max(1,0.25*k); ctx.strokeStyle='#8a918a'; }

function drawJibang(ctx,x,y,w,h,k,strs,wt,singleW){
  const X=x*k,Y=y*k,W=w*k,H=h*k,c=(singleW||w)*0.12*k;
  ctx.save(); chamfer(ctx,X,Y,W,H,c); ctx.fillStyle='#ffffff'; ctx.fill(); cutLine(ctx,k); ctx.stroke(); ctx.setLineDash([]);
  const n=Math.max(1,...strs.map(s=>Array.from(s).length)); const colW=W/strs.length;
  const fs=Math.min(colW*0.62,(H*0.84)/n*0.9);
  ctx.fillStyle='#111111'; ctx.font=fnt(wt,fs);
  strs.forEach((s,j)=>spread(ctx,Array.from(s),X+colW*(j+0.5),Y+H*0.075,Y+H-H*0.06,fs));
  ctx.restore();
}
function drawCross(ctx,cx,top,w,h,col){ const t=w*0.24; ctx.fillStyle=col; ctx.fillRect(cx-t/2,top,t,h); ctx.fillRect(cx-w/2,top+h*0.26,w,t); }
function drawFaith(ctx,x,y,w,h,k,sp,wt){
  const X=x*k,Y=y*k,W=w*k,H=h*k;
  ctx.save(); ctx.fillStyle='#ffffff'; ctx.fillRect(X,Y,W,H); cutLine(ctx,k); ctx.strokeRect(X,Y,W,H); ctx.setLineDash([]);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  if(sp.kind==='cross'){
    drawCross(ctx,X+W/2,Y+H*0.05,W*0.44,H*0.18,sp.color);
    ctx.fillStyle='#111111'; let rf=W*0.12; ctx.font=fnt(500,rf); while(rf>W*0.05&&ctx.measureText(sp.role).width>W*0.5){ rf*=0.94; ctx.font=fnt(500,rf); }
    ctx.fillText(sp.role,X+W/2,Y+H*0.285);
    const nm=Array.from(sp.name), ntop=Y+H*0.335, nbot=Y+H*0.965; const nf=Math.min(W*0.29,(nbot-ntop)/(nm.length*1.22)); ctx.font=fnt(wt,nf);
    nm.forEach((ch,i)=>ctx.fillText(ch,X+W/2,ntop+nf*0.61+i*nf*1.22));
    const side=(words,cx)=>{ const top=Y+H*sp.sideTop; const chars=words.reduce((a,w2)=>a+Array.from(w2).length,0), gaps=words.length-1; const f=Math.min(W*0.1,(Y+H*0.965-top)/(chars*1.06+gaps*0.42)); ctx.font=fnt(500,f); let yy=top+f/2; words.forEach(wd=>{ Array.from(wd).forEach(c=>{ ctx.fillText(c,cx,yy); yy+=f*1.06; }); yy+=f*0.42; }); };
    side(sp.right,X+W*0.855); side(sp.left,X+W*0.145);
  } else if(sp.kind==='sgi'){
    const groups=[['妙','法'],Array.from(sp.name),['之','靈']]; const n=groups.reduce((a,g)=>a+g.length,0);
    const top=Y+H*0.05, bot=Y+H*0.95; const f=Math.min(W*0.6,(bot-top)/(n*1.16+2*0.7)); ctx.fillStyle='#111111'; ctx.font=fnt(wt,f);
    const used=n*f*1.16+2*f*0.7; let yy=top+(bot-top-used)/2+f*0.58;
    groups.forEach((g,gi)=>{ g.forEach(c=>{ ctx.fillText(c,X+W/2,yy); yy+=f*1.16; }); if(gi<2) yy+=f*0.7; });
  }
  ctx.restore();
}
function drawWon(ctx,x,y,w,h,k,str,wt){
  const X=x*k,Y=y*k,W=w*k,H=h*k,c=w*0.12*k;
  ctx.save(); chamfer(ctx,X,Y,W,H,c); ctx.fillStyle='#ffffff'; ctx.fill(); cutLine(ctx,k); ctx.stroke(); ctx.setLineDash([]);
  const r=Math.min(W*0.24,H*0.055); ctx.beginPath(); ctx.arc(X+W/2,Y+H*0.04+r*1.1,r,0,Math.PI*2); ctx.lineWidth=r*0.16; ctx.strokeStyle='#111111'; ctx.stroke();
  const ch=Array.from(str); const top=Y+H*0.04+r*2.2+H*0.03, bot=Y+H*0.95; const fs=Math.min(W*0.62,(bot-top)/ch.length*0.9);
  ctx.fillStyle='#111111'; ctx.font=fnt(wt,fs); spread(ctx,ch,X+W/2,top,bot,fs); ctx.restore();
}
function drawCard(ctx,x,y,k,m,wt){ const d=m.dims;
  if(m.faith&&(m.faith.kind==='cross'||m.faith.kind==='sgi')) return drawFaith(ctx,x,y,d.w,d.h,k,m.faith,wt);
  if(m.faith&&m.faith.kind==='won') return drawWon(ctx,x,y,d.w,d.h,k,m.jb[0],wt);
  return drawJibang(ctx,x,y,d.w,d.h,k,m.jb,wt,d.single); }
function drawMyeong(ctx,x,y,w,h,k,str,wt){
  const X=x*k,Y=y*k,W=w*k,H=h*k; ctx.save(); ctx.fillStyle='#7a2420'; ctx.fillRect(X,Y,W,H);
  const ch=Array.from(str); const fs=Math.min(W*0.5,(H*0.84)/ch.length*0.88);
  ctx.fillStyle='#f4efe6'; ctx.font=fnt(wt,fs); spread(ctx,ch,X+W/2,Y+H*0.07,Y+H-H*0.06,fs); ctx.restore();
}
function drawHonbaek(ctx,k,m){
  const item=PS.hbItem; ctx.fillStyle='#111111';
  if(item==='box'){
    const s=Math.max(30,Math.min(190,Number(PS.hbSize)*10||100)); const x=(210-s)/2, y=30;
    ctx.save(); ctx.lineWidth=Math.max(1,0.3*k); ctx.strokeStyle='#111111'; ctx.strokeRect(x*k,y*k,s*k,s*k); ctx.restore();
    ctx.save(); cutLine(ctx,k); ctx.strokeRect((x-4)*k,(y-4)*k,(s+8)*k,(s+8)*k); ctx.restore();
    const big=s*(PS.hbName?0.48:0.58); ctx.fillStyle='#111111'; ctx.font=fnt(900,big*k); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(PS.hbChar,(x+s/2)*k,(y+s*(PS.hbName?0.40:0.5))*k);
    if(PS.hbName&&m.hbName){ const t=m.hbName; let fs=Math.min(s*0.11,(s*0.86)/Math.max(1,Array.from(t).length)); ctx.font=fnt(700,fs*k); ctx.fillText(t,(x+s/2)*k,(y+s*0.82)*k); }
    ctx.font=fnt(500,3.2*k,SANS); ctx.fillStyle='#59615b'; ctx.fillText('혼백상자 표지 · '+(s/10)+'×'+(s/10)+'cm · 점선을 따라 자르세요',105*k,(y+s+12)*k);
  } else if(item==='up'){
    const s=40, cols=3, rows=4, gx=12, gy=12; const bw=cols*s+(cols-1)*gx, bh=rows*s+(rows-1)*gy; const x0=(210-bw)/2, y0=(297-bh)/2;
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ const x=x0+c*(s+gx), y=y0+r*(s+gy); ctx.save(); cutLine(ctx,k); ctx.strokeRect(x*k,y*k,s*k,s*k); ctx.restore(); ctx.fillStyle='#111111'; ctx.font=fnt(900,s*0.62*k); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('上',(x+s/2)*k,(y+s/2)*k); }
    ctx.font=fnt(500,3.2*k,SANS); ctx.fillStyle='#59615b'; ctx.textAlign='center'; ctx.fillText('혼백 윗부분에 붙이는 上 글자 · 4×4cm',105*k,(y0+bh+10)*k);
  } else {
    const s=Math.max(30,Math.min(190,Number(PS.hbSize)*10||180)); const x=(210-s)/2, y=(297-s)/2;
    ctx.save(); cutLine(ctx,k); ctx.strokeRect(x*k,y*k,s*k,s*k); ctx.setLineDash([0.6*k,1.6*k]); ctx.strokeStyle='#b4bab3';
    ctx.beginPath(); ctx.moveTo((x+s/2)*k,y*k); ctx.lineTo((x+s/2)*k,(y+s)*k); ctx.moveTo(x*k,(y+s/2)*k); ctx.lineTo((x+s)*k,(y+s/2)*k); ctx.stroke(); ctx.restore();
    ctx.font=fnt(500,3.2*k,SANS); ctx.fillStyle='#59615b'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('혼백지 '+(s/10)+'×'+(s/10)+'cm · 굵은 점선은 자르는 선, 가는 점선은 가운데 접는 선',105*k,(y+s+10)*k);
  }
}
function drawChukmun(ctx,k,m,W,H){
  const L=m.lines.length; const mx=22, top=24, bot=22;
  const pitch=Math.min(20,(W-2*mx)/Math.max(L,1)); const avail=H-top-bot;
  const maxLen=Math.max(1,...m.lines.map(l=>vlen(l[0],1,1.12)));
  const fs=Math.min(pitch*0.6,avail/maxLen,13);
  ctx.fillStyle='#111111'; ctx.font=fnt(500,fs*k);
  const totalW=pitch*L; const startX=W-(W-totalW)/2-pitch/2;
  m.lines.forEach((l,i)=>flowV(ctx,l[0],(startX-i*pitch)*k,top*k,fs*k,1.12));
}
function drawSangjung(ctx,k){
  ctx.fillStyle='#111111'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font=fnt(900,52*k); ctx.fillText('喪 中',105*k,58*k);
  ctx.fillRect(55*k,86*k,100*k,Math.max(1,0.6*k));
  const tx=v=>String(v||'').trim();
  const lines=[tx(PS.sjL1),fmtD(PS.sjFrom)+'부터',fmtD(PS.sjTo)+'까지'+(tx(PS.sjL2)?' '+tx(PS.sjL2):''),tx(PS.sjL3)].filter(Boolean);
  const fit=(t,max,px)=>{ let f=px; ctx.font=fnt(500,f*k); while(f>5&&ctx.measureText(t).width>max*k){ f-=0.25; ctx.font=fnt(500,f*k); } return f; };
  const y0=116+(4-lines.length)*8.5;
  lines.forEach((t,i)=>{ fit(t,170,9.5); ctx.fillText(t,105*k,(y0+i*17)*k); });
  if(PS.sjHall){ ctx.fillStyle='#3a413c'; const hl='빈소 · '+or(tx(PS.hall),'[장례식장]')+(tx(PS.room)?' '+tx(PS.room):''); let f=6.6; ctx.font=fnt(500,f*k,SANS); while(f>4&&ctx.measureText(hl).width>170*k){ f-=0.2; ctx.font=fnt(500,f*k,SANS); } ctx.fillText(hl,105*k,214*k); if(tx(PS.hallTel)){ ctx.font=fnt(500,6.2*k,SANS); ctx.fillText('빈소 전화 '+tx(PS.hallTel),105*k,225*k); } }
  ctx.fillStyle='#111111'; const sg=or(tx(PS.sjSign),''); if(sg){ let f=8; ctx.font=fnt(700,f*k); while(f>5&&ctx.measureText(sg).width>170*k){ f-=0.25; ctx.font=fnt(700,f*k); } ctx.fillText(sg,105*k,(tx(PS.sjTel)?256:262)*k); }
  if(tx(PS.sjTel)){ ctx.font=fnt(500,6.6*k,SANS); ctx.fillStyle='#3a413c'; ctx.fillText('연락처 '+tx(PS.sjTel),105*k,(sg?268:262)*k); }
}
function drawEnvFront(ctx,k,ox){
  const lines=ENV[PS.envWord]||ENV.buui; ctx.fillStyle='#111111'; ctx.textAlign='center'; ctx.textBaseline='middle';
  if(lines.length===1){ const ch=Array.from(lines[0]); const fs=ch.length<=2?24:18; ctx.font=fnt(700,fs*k); const gap=fs*1.6; const tot=gap*(ch.length-1); ch.forEach((c,i)=>ctx.fillText(c,(ox+52.5)*k,(110-tot/2+i*gap)*k)); }
  else { const fs=11; ctx.font=fnt(700,fs*k); const len=Math.max(...lines.map(l=>vlen(l,fs,1.25))); const top=110-len/2; lines.forEach((l,i)=>flowV(ctx,l,(ox+52.5+ (lines.length-1)*8 - i*16)*k,top*k,fs*k,1.25)); }
}
function drawEnvBack(ctx,k,ox){
  ctx.fillStyle='#111111'; const nm=or(PS.envName,'이름'); const fs=8; ctx.font=fnt(700,fs*k);
  const len=vlen(nm,fs,1.3); flowV(ctx,nm,(ox+24)*k,(202-len)*k,fs*k,1.3);
  if(PS.envOrg){ const f2=4.6; ctx.font=fnt(500,f2*k); const l2=vlen(PS.envOrg,f2,1.25); flowV(ctx,PS.envOrg,(ox+33)*k,(202-len-3)*k,f2*k,1.25); }
}

/* 받을 PDF 쪽들 */
function pagesFor(m){
  const wt=PS.wt; const t=PS.tab; const nm=(m.fullName||'고인').replace(/[\\/:*?"<>|]/g,'');
  if(t==='jb'){ const h=m.dims.h; const pw=m.dims.w; const gap=6;
    const cols=Math.max(1,Math.floor((190+gap)/(pw+gap))), rows=Math.max(1,Math.floor((277+gap)/(h+gap))), per=cols*rows; const pages=[];
    for(let st=0;st<PS.copies;st+=per){ const cnt=Math.min(per,PS.copies-st);
      pages.push({w:210,h:297,draw:(ctx,k)=>{ const used=cnt, rc=Math.ceil(used/cols), uc=Math.min(used,cols); const bw=uc*pw+(uc-1)*gap, bh=rc*h+(rc-1)*gap; const x0=(210-bw)/2, y0=Math.max(10,(297-bh)/2);
        for(let i=0;i<used;i++){ const r=Math.floor(i/cols), c=i%cols; drawCard(ctx,x0+c*(pw+gap),y0+r*(h+gap),k,m,wt); } }}); }
    return {pages,name:(m.isYu?'지방_':'위패_')+'故'+nm, per, sheets:pages.length}; }
  if(t==='mj'){ const z=MJ[PS.mjSize]; const pages=[]; for(let c=0;c<PS.copies;c++) for(let i=0;i<z.n;i++){ pages.push({w:z.w,h:z.ph,draw:(ctx,k)=>{ ctx.save(); ctx.translate(0,-i*z.ph*k); drawMyeong(ctx,0,0,z.w,z.ph*z.n,k,m.mj,wt); ctx.restore(); }}); }
    return {pages,name:'명정_故'+nm}; }
  if(t==='hb') return {pages:[{w:210,h:297,draw:(ctx,k)=>drawHonbaek(ctx,k,m)}],name:'혼백_故'+nm};
  if(t==='ck') return {pages:[{w:297,h:210,draw:(ctx,k)=>drawChukmun(ctx,k,m,297,210)}],name:(CKN[PS.ck]||'축문')+'_故'+nm};
  if(t==='sj') return {pages:[{w:210,h:297,draw:(ctx,k)=>drawSangjung(ctx,k)}],name:'상중안내문'};
  if(t==='env') return {pages:[{w:105,h:220,draw:(ctx,k)=>drawEnvFront(ctx,k,0)},{w:105,h:220,draw:(ctx,k)=>drawEnvBack(ctx,k,0)}],name:'부의봉투_'+or(PS.envName,'')};
  return {pages:[],name:''};
}
function docText(m){ return [m.jb.join(''),m.faith?[m.faith.role||'',m.faith.name||'',(m.faith.right||[]).join(''),(m.faith.left||[]).join(''),'妙法之靈'].join(''):'',m.mjAll.map(x=>x.h).join(''),PS.sjL1,PS.sjL2,PS.sjL3,PS.sjSign,PS.hall,PS.room,m.lines.map(l=>l[0]).join(''),'喪中上前',(ENV[PS.envWord]||[]).join(''),PS.envName,PS.envOrg,m.hbName,'집안에상을당하여부터까지문을닫습니다너그러운양해부탁드립니다주인올림'].join(''); }
const fontDone=new Set();
function ensureFonts(text){
  const key=PS.font+'|'+PS.wt+'|'+text; if(fontDone.has(key)||!document.fonts||!document.fonts.load) return Promise.resolve(false);
  const L=(f)=>document.fonts.load(f,text).catch(()=>null);
  const list=PS.font==='brush'?[L('400 40px "Yuji Syuku"'),L('400 40px "ChosunGs"'),L('800 40px "Shippori Mincho"')]
    :[L('800 40px "Shippori Mincho"'),L('700 40px "Shippori Mincho"'),L('500 40px "Shippori Mincho"'),L('800 40px "Noto Serif KR"'),L('700 40px "Noto Serif KR"'),L('500 40px "Noto Serif KR"')];
  list.push(document.fonts.load('500 20px "IBM Plex Sans KR"','혼백상자표지점선을따라자르세요빈소연락처전화').catch(()=>null));
  return Promise.all(list).then(()=>{fontDone.add(key);return true;}).catch(()=>false);
}

/* 미리보기 */
function preview(m){
  const box=$('#pvbox'), cv=$('#pv'); if(!box||!cv) return;
  const availW=Math.max(260,Math.min((box.clientWidth||600)-24,700)); const tall=window.innerWidth<700?400:470; const dpr=Math.min(2,window.devicePixelRatio||1);
  let cssW, cssH, draw, cap='', sheet='';
  const t=PS.tab;
  if(t==='jb'){ const d=m.dims; const pw=d.w; const kk=Math.min(tall/d.h,(availW-12)/d.w); cssW=pw*kk+12; cssH=d.h*kk+12;
    draw=(ctx,k)=>drawCard(ctx,6/kk,6/kk,k,m,PS.wt);
    draw.k=kk; const P=pagesFor(m); cap=(m.isYu?'지방 ':'위패 ')+d.l+' · '+(pw/10)+' × '+(d.h/10)+'cm · 화면은 실제의 '+Math.round(kk/3.78*100)+'%'; sheet='A4 한 장에 '+P.per+'장씩 · '+PS.copies+'장이면 종이 '+P.sheets+'장'; }
  else if(t==='mj'){ const L=m.mjAll, n=L.length, gap=10, lab=30; const bw=Math.max(40,Math.min(70,(availW-gap*(n-1))/n)); const bh=tall-lab;
    cssW=n*bw+(n-1)*gap+8; cssH=tall;
    draw=(ctx,k)=>{ L.forEach((x,i)=>{ const X=4+i*(bw+gap); const on=x.v===PS.rlg;
      drawMyeong(ctx,X,4,bw,bh-4,k,x.h.replace(/ /g,''),PS.wt);
      if(on){ ctx.save(); ctx.strokeStyle='#111111'; ctx.lineWidth=2*k; ctx.strokeRect((X-3)*k,1*k,(bw+6)*k,(bh+lab-3)*k); ctx.restore(); }
      ctx.fillStyle=on?'#111111':'#59615b'; ctx.font=fnt(on?700:500,13*k,SANS); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(x.l,(X+bw/2)*k,(bh+lab/2)*k); }); };
    draw.k=1; cap='종교별 명정 쓰는 예 · 출력용이 아닌 참고용입니다'; sheet=''; }
  else if(t==='hb'){ const kk=tall/297; cssW=210*kk; cssH=tall; draw=(ctx,k)=>{ ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,210*k,297*k); drawHonbaek(ctx,k,m); }; draw.k=kk; cap='A4 세로 · 실제 크기로 인쇄하면 표지 크기가 맞습니다'; sheet='A4 1장'; }
  else if(t==='ck'){ const kk=Math.min(availW,660)/297; cssW=297*kk; cssH=210*kk; draw=(ctx,k)=>{ ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,297*k,210*k); drawChukmun(ctx,k,m,297,210); }; draw.k=kk; cap=(CKN[PS.ck]||'')+' · A4 가로 · 오른쪽 줄부터 읽습니다'; sheet='A4 가로 1장'; }
  else if(t==='sj'){ const kk=tall/297; cssW=210*kk; cssH=tall; draw=(ctx,k)=>{ ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,210*k,297*k); drawSangjung(ctx,k); }; draw.k=kk; cap='A4 세로 · 문 앞에 붙이는 안내문'; sheet='A4 세로 1장'; }
  else if(t==='env'){ const kk=Math.min(tall*0.86,420)/220; const g=10/kk; cssW=(210+g)*kk; cssH=220*kk;
    draw=(ctx,k)=>{ [0,105+g].forEach((ox,i)=>{ ctx.fillStyle='#ffffff'; ctx.fillRect(ox*k,0,105*k,220*k); ctx.strokeStyle='#9aa199'; ctx.lineWidth=1; ctx.strokeRect(ox*k+0.5,0.5,105*k-1,220*k-1); if(i===0) drawEnvFront(ctx,k,ox); else drawEnvBack(ctx,k,ox); }); };
    draw.k=kk; cap='왼쪽 앞면 · 오른쪽 뒷면 · 규격 봉투 220×105mm'; sheet='봉투 2쪽 (앞면 · 뒷면)'; }
  else return;
  cv.width=Math.round(cssW*dpr); cv.height=Math.round(cssH*dpr); cv.style.width=Math.round(cssW)+'px'; cv.style.height=Math.round(cssH)+'px';
  const ctx=cv.getContext('2d'); ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height);
  draw(ctx,draw.k*dpr);
  $('#pv-cap').textContent=cap; $('#sheet-note').textContent=sheet;
}

/* ── 출력실 화면 ── */
function setVis(el,on){ el.hidden=!on; }
function renderPicker(which){
  const q=$(which==='c1'?'#p-c1q':'#p-c2q').value; const box=$(which==='c1'?'#c1-res':'#c2-res');
  const res=q.trim()?searchClans(q,12):[]; box.innerHTML='';
  res.forEach(c=>{ const b=document.createElement('button'); b.type='button'; b.innerHTML='<span></span><span class="hz"></span>'; b.firstChild.textContent=clanLabel(c); b.lastChild.textContent=c.bh+c.sh;
    b.addEventListener('click',()=>{ if(which==='c1'){ PS.c1=c; PS.man=false; $('#p-c1q').value=''; } else { PS.c2=c; $('#p-c2q').value=''; } renderPrint(); }); box.appendChild(b); });
  if(which==='c1') $('#c1-none').hidden=!(q.trim()&&res.length===0);
}
function renderPrint(){
  const m=model(); const R=m.R;
  $$('[data-seg]').forEach(b=>{ const k=b.getAttribute('data-seg'); b.setAttribute('aria-pressed',String(String(PS[k])===b.getAttribute('data-v'))); });
  $$('#ptabs [data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.getAttribute('data-tab')===PS.tab)));
  const cond={
    c1list:!PS.man, c1man:PS.man, ttl:m.isYu&&(R.g==='m'||m.pairOn), ttlCus:PS.ttl==='cus', chr:PS.rlg==='chr', cat:PS.rlg==='cat', jbFixed:!!m.dims.fixed, jbSizeF:!m.dims.fixed, jbHanF:!m.faith&&!PS.jbCus&&PS.rlg!=='won', bud:PS.rlg==='bud', won:PS.rlg==='won', jbCus:!!PS.jbCus, out:PS.tab!=='mj', mjInfo:PS.tab==='mj', sjHallOn:!!PS.sjHall,
    canPair:m.canPair, p2:m.pairOn&&R.g==='m', female:m.isYu&&(m.pairOn||R.g==='f'),
    ckHdr:m.hdr, ckWho:m.ckWho, hbBox:PS.hbItem==='box', hbSizeF:PS.hbItem!=='up', copies:PS.tab==='jb',
    doc:PS.tab!=='tx', tx:PS.tab==='tx', ckReading:PS.tab==='ck', hbInfo:PS.tab==='hb'
  };
  $$('[data-show]').forEach(el=>setVis(el,!!cond[el.getAttribute('data-show')]));
  $$('[data-panel]').forEach(el=>{ el.hidden=el.getAttribute('data-panel')!==PS.tab; });
  const c1=m.c1; $('#c1-label').textContent=or(clanLabel(c1),'본관 · 성'); $('#c1-hz').textContent=(c1.bh||'')+(c1.sh||'');
  $('#c2-label').textContent=clanLabel(PS.c2); $('#c2-hz').textContent=PS.c2.bh+PS.c2.sh;
  $('#pair-label').textContent=PAIR_LABEL[R.gen]||''; $('#c2-title').textContent=WIFE_LABEL[R.gen]||'';
  $('#hbs-label').textContent=PS.hbItem==='paper'?'혼백지 크기 (cm, 정사각형)':'표지 크기 (cm, 정사각형)';
  $$('[data-k]').forEach(el=>{ const k=el.getAttribute('data-k'); if(document.activeElement===el) return; if(el.type==='checkbox') el.checked=!!PS[k]; else if(el.value!==String(PS[k]??'')) el.value=PS[k]??''; });
  $('#cp-val').textContent=PS.copies;
  $('#ck-lunar').textContent=m.lunarNote; $('#ck-reading').textContent=m.lines.map(l=>l[1]).join('\n');
  let warn='';
  if(PS.tab==='jb'&&m.isYu&&R.named&&!PS.nameK) warn='아들 지방에는 이름이 들어갑니다. 이름을 입력하세요.';
  else if(PS.tab!=='tx'&&PS.man&&(!PS.mbh||!PS.msh)) warn='본관과 성을 한자로 입력하세요.';
  else if(PS.tab==='ck') warn=m.ckWarn;
  else if(PS.tab==='sj'&&isoOk(PS.sjFrom)&&isoOk(PS.sjTo)&&PS.sjTo<PS.sjFrom) warn='마지막 날이 첫날보다 빠릅니다.';
  const w=$('#pv-warn'); w.hidden=!warn; w.textContent=warn?'주의 · '+warn:'';
  $('#jb-fixed-note').textContent=m.dims.fixed?(PS.rlg==='sgi'?'SGI 위패는 4 × 17.5cm 고정 규격입니다. A4 한 장에 4장까지 들어갑니다.':'기독교 · 천주교 위패는 8.5 × 25.5cm 고정 규격입니다. A4 한 장에 2장씩 나옵니다.'):'';
  if(PS.tab==='mj'){ const dl=$('#mj-list'); dl.innerHTML=''; m.mjAll.forEach(x=>{ const dt=document.createElement('dt'); dt.textContent=x.l; if(x.v===PS.rlg) dt.className='on'; else dt.style.color='var(--muted)'; const dd=document.createElement('dd'); const a=document.createElement('span'); a.className='hz'; a.textContent=x.h; const b=document.createElement('span'); b.className='rd'; b.textContent=x.k; dd.appendChild(a); dd.appendChild(b); dl.appendChild(dt); dl.appendChild(dd); }); }
  if(PS.tab==='tx'){ $('#msg-bugo').textContent=bugoText(m); $('#msg-thanks').textContent=thanksText(m); }
  else { preview(m); ensureFonts(docText(m)).then(ch=>{ if(ch) preview(model()); }); }
  const dn=({jb:m.isYu?'지방':'위패',mj:'명정',hb:'혼백',ck:'축문',sj:'안내문',env:'봉투'}[PS.tab]||'서식');
  $('#print-btn').textContent=dn+' 바로 인쇄'; $('#pdf-btn').textContent=dn+' PDF로 받기';
  renderHist();
}
function bugoText(m){ return '[부고]\n故 '+m.fullName+'님께서 '+fmtD(PS.dDie)+' 별세하셨기에 삼가 알려 드립니다.\n\n상주  '+or(PS.sangK,'[상주]')+'\n빈소  '+or(PS.hall,'[장례식장]')+' '+(PS.room||'')+'\n발인  '+fmtD(PS.dOut)+' '+(PS.tOut||'')+'\n장지  '+or(PS.place,'[장지]')+(PS.tel?'\n연락처  '+PS.tel:'')+'\n\n마음으로 함께해 주시면 감사하겠습니다.'; }
function thanksText(m){ return '故 '+m.fullName+'님의 장례에 함께해 주시고 따뜻한 위로를 보내 주셔서 진심으로 감사드립니다.\n\n직접 찾아뵙고 인사드려야 마땅하나 먼저 글로 대신합니다. 보내 주신 마음 오래 기억하겠습니다.\n\n상주 '+or(PS.sangK,'[상주]')+' 올림'; }
function renderHist(){
  const ul=$('#hist'); ul.innerHTML=''; $('#hist-empty').hidden=HIST.length>0;
  HIST.forEach(h=>{ const li=document.createElement('li'); const s=document.createElement('span'); s.innerHTML='<b></b> <span class="muted"></span><br><span class="note"></span>'; s.children[0].textContent=h.who; s.children[1].textContent='· '+h.what; s.children[3].textContent=h.t; const b=document.createElement('button'); b.type='button'; b.className='btn btn-line'; b.style.minHeight='44px'; b.textContent='같은 내용 열기';
    b.addEventListener('click',()=>{ Object.assign(PS,h.state||{}); renderPrint(); window.scrollTo({top:0}); toast('그때 입력한 내용을 불러왔습니다'); }); li.appendChild(s); li.appendChild(b); ul.appendChild(li); });
}
function histWhat(m){ return {jb:(m.isYu?'지방 ':'위패 ')+m.dims.l+(m.pairOn?' 합설':'')+' '+PS.copies+'장',mj:'명정 '+MJ[PS.mjSize].l+' '+PS.copies+'벌',hb:'혼백 '+({box:'상자 표지',up:'上 글자 표',paper:'혼백지'}[PS.hbItem]),ck:CKN[PS.ck],sj:'상중 안내문',env:'부의 봉투'}[PS.tab]; }
function addHist(m,how){ const now=new Date();
  HIST=[{who:'故 '+m.fullName,what:histWhat(m)+' · '+how,t:(now.getMonth()+1)+'월 '+String(now.getDate()).padStart(2,'0')+'일 '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'),state:JSON.parse(JSON.stringify(PS))}].concat(HIST).slice(0,6);
  try{ localStorage.setItem('mf-hist',JSON.stringify(HIST)); }catch(e){} renderHist(); }
function renderPage(pg,dpi,type){ const k=dpi/25.4; const c=document.createElement('canvas'); c.width=Math.round(pg.w*k); c.height=Math.round(pg.h*k); const x=c.getContext('2d'); x.fillStyle='#ffffff'; x.fillRect(0,0,c.width,c.height); pg.draw(x,k); return type==='png'?c.toDataURL('image/png'):c.toDataURL('image/jpeg',0.92); }
async function savePdf(){
  const btn=$('#pdf-btn'); const m=model();
  if(!window.jspdf||!window.jspdf.jsPDF){ toast('PDF 도구를 불러오는 중입니다. 잠시 뒤 다시 눌러 주세요'); return; }
  btn.disabled=true; const old=btn.textContent; btn.textContent='PDF 만드는 중…';
  try{
    await ensureFonts(docText(m));
    const P=pagesFor(m); let doc=null;
    P.pages.forEach((pg,i)=>{ const o=pg.w>pg.h?'l':'p'; if(i===0) doc=new window.jspdf.jsPDF({unit:'mm',format:[pg.w,pg.h],orientation:o,compress:true}); else doc.addPage([pg.w,pg.h],o);
      doc.addImage(renderPage(pg,250,'jpg'),'JPEG',0,0,pg.w,pg.h); });
    const buf=doc.output('arraybuffer');
    const ok=await saveFile(P.name+'.pdf',buf,'PDF를 저장했습니다. 실제 크기(100%)로 인쇄하세요');
    if(ok) addHist(m,'PDF');
  }catch(e){ toast('PDF를 만들지 못했습니다. 다시 시도해 주세요'); }
  btn.disabled=false; btn.textContent=old;
}
const FRAMED=(function(){ try{ return window.self!==window.top; }catch(e){ return true; } })();
async function directPrint(){
  if(FRAMED){ toast('미리보기 화면에서는 인쇄 창이 막혀 있어 PDF로 저장합니다'); return savePdf(); }
  const btn=$('#print-btn'); const m=model(); btn.disabled=true; const old=btn.textContent; btn.textContent='인쇄 준비 중…';
  try{
    await ensureFonts(docText(m));
    const P=pagesFor(m); const root=$('#print-root'); root.innerHTML='';
    let css=document.getElementById('page-css'); if(!css){ css=document.createElement('style'); css.id='page-css'; document.head.appendChild(css); }
    css.textContent='@page{size:'+P.pages[0].w+'mm '+P.pages[0].h+'mm;margin:0}';
    await Promise.all(P.pages.map(pg=>new Promise(res=>{ const img=new Image(); img.alt=''; img.style.width=pg.w+'mm'; img.style.height=pg.h+'mm'; img.onload=res; img.onerror=res; root.appendChild(img); img.src=renderPage(pg,300,'png'); })));
    window.print(); addHist(m,'인쇄');
  }catch(e){ toast('인쇄를 준비하지 못했습니다. PDF로 받아 인쇄해 주세요'); }
  btn.disabled=false; btn.textContent=old;
}
window.addEventListener('afterprint',()=>{ const r=document.getElementById('print-root'); if(r) r.innerHTML=''; });
function bindPrint(){
  $$('[data-seg]').forEach(b=>b.addEventListener('click',()=>{ const k=b.getAttribute('data-seg'); PS[k]=b.getAttribute('data-v'); renderPrint(); }));
  const swapDoc=()=>['.doc','.msgs'].forEach(q=>{ const el=$(q); if(el){ el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); } });
  $$('#ptabs [data-tab]').forEach(b=>b.addEventListener('click',()=>{ PS.tab=b.getAttribute('data-tab'); renderPrint(); swapDoc(); }));
  $('#ptabs').addEventListener('keydown',e=>{ if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft') return; const tabs=$$('#ptabs [data-tab]'); const i=tabs.findIndex(t=>t.getAttribute('data-tab')===PS.tab); const n=tabs[(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length]; PS.tab=n.getAttribute('data-tab'); renderPrint(); n.focus(); });
  $$('[data-k]').forEach(el=>{ const k=el.getAttribute('data-k'); const ev=(el.tagName==='SELECT'||el.type==='checkbox'||el.type==='date')?'change':'input';
    const h=()=>{ if(el.type==='checkbox') PS[k]=el.checked; else if(el.type==='number') PS[k]=el.value; else PS[k]=el.value; if(k==='dOut'&&isoOk(el.value)) PS.ckDate=el.value; renderPrint(); };
    el.addEventListener(ev,h); if(ev==='change'&&el.type==='date') el.addEventListener('input',h); });
  $('#p-c1q').addEventListener('input',()=>renderPicker('c1'));
  $('#p-c2q').addEventListener('input',()=>renderPicker('c2'));
  $('#c1-man-on').addEventListener('click',()=>{ const c=PS.c1; PS.man=true; PS.mbk=c.bk; PS.msk=c.sk; PS.mbh=c.bh; PS.msh=c.sh; $('#c1-res').innerHTML=''; renderPrint(); $('#p-mbk').focus(); });
  $('#c1-man-off').addEventListener('click',()=>{ PS.man=false; renderPrint(); });
  $('#cp-minus').addEventListener('click',()=>{ PS.copies=Math.max(1,PS.copies-1); renderPrint(); });
  $('#cp-plus').addEventListener('click',()=>{ PS.copies=Math.min(30,PS.copies+1); renderPrint(); });
  $('#p-jbcus').addEventListener('change',()=>{ if(PS.jbCus&&!String(PS.jbText||'').trim()){ PS.jbText=model().jbAuto.join('\n'); renderPrint(); } });
  $('#jb-auto').addEventListener('click',()=>{ PS.jbText=model().jbAuto.join('\n'); renderPrint(); });
  $('#pdf-btn').addEventListener('click',savePdf);
  $('#print-btn').addEventListener('click',directPrint);
  if(FRAMED) $('#print-note').innerHTML='지금 보시는 미리보기 화면에서는 인쇄 창이 막혀 있어 <b>바로 인쇄</b>를 누르면 PDF로 저장됩니다. 홈페이지 주소에 올리면 프린터로 바로 나갑니다. 배율은 <b>실제 크기(100%)</b>로 두세요.';
  $('#copy-bugo').addEventListener('click',()=>copyText(bugoText(model()),'부고 문자를 복사했습니다',$('#msg-bugo')));
  $('#copy-thanks').addEventListener('click',()=>copyText(thanksText(model()),'감사 문자를 복사했습니다',$('#msg-thanks')));
  let rt; window.addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{ if(!$('[data-page="print"]').hidden&&PS.tab!=='tx') preview(model()); },150); });
}

/* ── 본관 찾기 화면 ── */
let clanSur='';
function clanCard(c){ const b=document.createElement('button'); b.type='button'; b.className='clan-card'; b.innerHTML='<b></b><span class="hz"></span>'; b.firstChild.textContent=clanLabel(c); b.lastChild.textContent=c.bh+c.sh; b.setAttribute('aria-label',clanLabel(c)+' '+c.bh+c.sh+', 출력실 고인 본관으로 쓰기');
  b.addEventListener('click',()=>{ location.href='/print/?clan='+CLANS.indexOf(c); }); return b; }
function renderClanPage(){
  const q=$('#clan-q').value.trim(); const list=$('#clan-list'); list.innerHTML='';
  let res; if(q) res=searchClans(q,400); else if(clanSur) res=CLANS.filter(c=>c.sk+':'+c.sh===clanSur); else res=CLANS.slice(0,24);
  res.forEach(c=>list.appendChild(clanCard(c)));
  const sCount=new Set(CLANS.map(c=>c.sk+c.sh)).size;
  $('#clan-count').textContent=q?(res.length?'‘'+q+'’ 찾은 본관 '+res.length+'곳 · 누르면 출력실에 들어갑니다':'‘'+q+'’에 맞는 본관이 목록에 없습니다. 출력실에서 직접 입력할 수 있습니다.'):(clanSur?clanSur.split(':')[0]+'('+clanSur.split(':')[1]+')씨 본관 '+res.length+'곳':'성씨 '+sCount+'개 · 본관 '+CLANS.length+'곳이 들어 있습니다. 많이 쓰는 본관부터 보여 드립니다.');
  const idx=$('#sur-index'); if(!idx.childElementCount){ const seen=[]; CLANS.forEach(c=>{ const k=c.sk+':'+c.sh; if(seen.indexOf(k)<0) seen.push(k); });
    seen.sort((a,b)=>a.localeCompare(b,'ko')).forEach(k=>{ const b=document.createElement('button'); b.type='button'; const p=k.split(':'); b.textContent=p[0]+' '+p[1]; b.setAttribute('data-sur',k); b.addEventListener('click',()=>{ clanSur=clanSur===k?'':k; $('#clan-q').value=''; renderClanPage(); $('#clan-list').scrollIntoView({block:'start'}); }); idx.appendChild(b); }); }
  $$('#sur-index button').forEach(b=>b.setAttribute('aria-pressed',String(b.getAttribute('data-sur')===clanSur&&!q)));
}

/* ── 금액 계산 : 한 번에 한 가지씩 ── */
const PRICE={
  type:[['nob','무빈소 장례',60,'빈소를 차리지 않고 가족끼리 조용히 모십니다. 조문객을 맞지 않으니 빈소 사용료와 접객 비용이 들지 않습니다.'],
        ['fam','가족장 (3일장)',70,'조문객을 맞는 빈소를 차리는 3일장입니다. 전담 장례지도사가 사흘 동안 함께합니다.']],
  burial:[['cre','화장',0,'화장장에서 화장한 뒤 봉안당 · 수목장 · 해양장 같은 곳에 모십니다. 요즘 가장 많이 하는 방식입니다.'],
          ['bur','매장',0,'관을 그대로 묘지에 모십니다. 선산이나 공원묘지가 있을 때 합니다.'],
          ['und','아직 정하지 못했어요',0,'관을 고를 때 화장용과 매장용을 모두 보여 드립니다. 상담하면서 정하셔도 됩니다.']],
  coffin:[['c1','화장용 오동나무',20,'오동나무는 가볍고 습기에 강한 나무입니다. 화장용은 약 1.8cm(6푼) 두께로 얇게 만들어 잘 타기 때문에, 화장할 때 가장 많이 씁니다.'],
          ['c2','화장용 오동나무 (특수관)',30,'같은 오동나무 화장용 관 가운데 한 단계 높은 관입니다. 기본 관과 무엇이 다른지는 상담 때 실물 사진으로 보여 드립니다.'],
          ['c3','매장용 오동나무',30,'땅속에서 습기와 벌레로부터 고인을 지키도록 화장용보다 두껍고 튼튼하게 만든 오동나무 관입니다. 가볍고 값이 합리적입니다.'],
          ['c4','매장용 솔송관',80,'솔송나무는 소나무과에 속하는 바늘잎나무입니다. 단단하고 잘 썩지 않아 주로 매장할 때 쓰는 고급 관이며, 무게가 꽤 나갑니다.'],
          ['c5','매장용 향나무관',160,'향나무는 아주 단단하고 은은한 향이 나는 나무입니다. 향이 벌레를 막아 준다고 알려져 있어, 매장용 관 가운데 가장 귀하게 여깁니다.']],
  shroud:[['s1','면수의',15,'무명(면)으로 지은 수의입니다. 부드럽고 부담이 가장 적어 기본 수의로 많이 씁니다.'],
          ['s2','저마수의',20,'저마는 모시풀에서 얻는 모시입니다. 예부터 여름 옷감으로 쓰였고, 가볍고 시원한 결이 특징입니다. 예전에는 귀한 옷감이었습니다.'],
          ['s3','황토수의',30,'황토로 물들인 옷감으로 지은 수의입니다. 은은한 흙빛이 나는 자연 소재입니다.'],
          ['s4','쟈가드수의',50,'자카드 직기로 무늬를 넣어 짠 옷감으로 지은 수의입니다. 은은한 무늬와 광택이 있어 단정하고 품위 있게 보입니다.'],
          ['s5','대마수의',60,'대마(삼)에서 얻은 삼베로 지은 수의입니다. 바람이 잘 통하고 흙에서 자연으로 돌아가는 소재라, 오늘날 수의를 대표하는 옷감입니다.']],
  ipgwan:[['none','하지 않음',0,'하지 않으셔도 염습과 입관의 예우는 똑같이 갖춥니다.'],
          ['i1','생화 꽃장식',20,'입관할 때 관 안팎을 생화로 꾸밉니다. 가족이 고인을 마지막으로 뵙는 자리를 환하게 해 드립니다.'],
          ['i2','궁중대렴',20,'대렴은 수의를 입힌 고인을 베로 감싸 묶는 염습 절차입니다. 궁중대렴은 이를 왕실 예법처럼 더 정성껏 갖춰 하는 방식입니다.'],
          ['i3','생화 꽃장식 + 궁중대렴',30,'두 가지를 함께 합니다. 따로 하는 것보다 10만원 적습니다.']],
  binso:[['none','하지 않음',0,'헌화 없이 분향만 하셔도 됩니다.'],
         ['b1','헌화 30송이',5,'조문객이 영정 앞에 한 송이씩 올리는 꽃입니다. 조문객이 많지 않을 때 알맞습니다.'],
         ['b2','헌화 50송이',7,'조문객이 많을 것 같을 때 고르세요.']],
  car:[['none','필요 없음',0,'화장장 안에 있는 장례식장을 이용하실 때만 장의 차량이 필요 없습니다. 다른 장례식장에서 발인하시면 장의 차량이 꼭 필요합니다.'],
       ['v1','카니발 · 스타리아',30,'무빈소나 소규모 가족장에 자주 씁니다. 차에 함께 타실 가족이 많지 않을 때 알맞습니다.'],
       ['v2','리무진 (편도)',40,'고인을 모시고 1차 장지 또는 화장장까지 가는 편도입니다. 기준 거리 200km.'],
       ['v3','장의버스 (왕복)',45,'가족과 조문객이 함께 타고 다녀오는 왕복입니다. 기준 거리 200km.'],
       ['v4','리무진 (편도) + 장의버스 (왕복)',80,'리무진은 1차 장지 또는 화장장까지 편도, 장의버스는 왕복입니다.']],
  disc:[['gen','일반',0,'가격표 금액 그대로입니다.'],['sup','수급자 · 국가유공자',-20,'기초생활수급자나 국가유공자 가족이시면 20만원을 할인해 드립니다. 장제급여 등 지원금 범위 안에서 장례를 설계하고, 청구 서류도 챙겨 드립니다.']]
};
const COFFIN_FOR={cre:['c1','c2'],bur:['c3','c4','c5'],und:['c1','c2','c3','c4','c5']};
const coffinOpts=()=>PRICE.coffin.filter(o=>(COFFIN_FOR[PR.burial]||COFFIN_FOR.und).indexOf(o[0])>=0);
const PR_DEF={type:'nob',burial:'cre',coffin:'c1',shroud:'s1',ipgwan:'none',binso:'none',car:'none',disc:'gen',staff1:0,staff2:0,mm:0,mf:0};
const PR=Object.assign({},PR_DEF);
const won=n=>n.toLocaleString('ko-KR')+'원';
const lineVal=l=>l[3]||(l[1]<0?'−'+won(-l[1]):l[1]?won(l[1]):'무료');
const pick=(g,id)=>PRICE[g].find(o=>o[0]===id);
const WZ=[
  {k:'type',q:'어떤 장례로 모실까요?',h:'빈소를 차리지 않으면 무빈소 장례, 조문객을 맞으시려면 가족장입니다. 두 가지 모두 장례지도사와 입관지도사, 입관용품이 들어 있고 고인 이송 차량, 모바일 부고, 장지 안내, 화장 예약은 무료입니다.'},
  {k:'burial',q:'화장으로 모실까요, 매장으로 모실까요?',h:'모시는 방식에 따라 관이 달라집니다. 화장장 사용료나 묘지 비용은 이 견적과 따로 냅니다.'},
  {k:'coffin',q:'관은 어떤 것으로 할까요?',h:()=>PR.burial==='cre'?'화장할 때 쓰는 관입니다. 화장용 관은 얇고 가볍게 만들어 잘 탑니다.':PR.burial==='bur'?'매장할 때 쓰는 관입니다. 땅속에서 습기와 벌레로부터 고인을 지키도록 화장용보다 튼튼하게 만듭니다.':'화장하시면 화장용, 매장하시면 매장용을 고르시면 됩니다. 관은 예부터 나무로 만들고 쇠붙이는 쓰지 않습니다.'},
  {k:'shroud',q:'수의는 어떤 것으로 할까요?',h:'옷감에 따라 금액이 다릅니다. 화장하실 때는 잘 타는 자연 소재가, 매장하실 때는 흙에서 자연스럽게 삭는 소재가 좋습니다.'},
  {k:'ipgwan',q:'입관하실 때 꽃장식이나 궁중대렴을 하실까요?',h:'입관은 고인을 깨끗이 모시고 수의를 입혀 관에 모시는 자리입니다. 가족이 함께 마지막 인사를 나눕니다.'},
  {k:'binso',q:'빈소에 헌화를 준비할까요?',h:'헌화는 조문객이 분향 대신, 또는 분향과 함께 영정 앞에 꽃을 올리는 것입니다.',skip:()=>PR.type==='nob'},
  {k:'car',q:'발인 때 장의 차량이 필요하신가요?',h:'화장장 안의 장례식장이 아니라면 장의 차량이 꼭 필요합니다. 리무진은 1차 장지 또는 화장장까지 가는 편도이고, 장의버스는 다녀오는 왕복입니다. 기준 거리 200km를 넘으면 1km당 1,800원이 붙습니다.'},
  {k:'staff',q:'조문객을 맞을 접객 도우미가 필요하신가요?',h:'빈소에서 음식을 차리고 조문객 맞이를 돕습니다. 첫째 날과 둘째 날 필요한 인원을 각각 골라 주세요. 1인당 12만원이고, 필요 없으시면 0명으로 두세요.',type:'count',skip:()=>PR.type==='nob'},
  {k:'mourn',q:'가족분들 상복은 몇 벌 준비할까요?',h:'상주와 가족이 장례 기간 동안 입는 옷입니다. 남성용에는 셔츠와 타이가 함께 들어 있습니다. 갖고 계시면 0벌로 두세요.',type:'mourn'},
  {k:'disc',q:'특별 할인 대상이신가요?',h:'기초생활수급자나 국가유공자 가족이시면 20만원을 할인해 드립니다. 할인 대상인지는 상담 때 확인해 드립니다.'},
  {k:'done'}
];
let WK='type', WDIR='';
const wzVis=()=>WZ.filter(s=>!(s.skip&&s.skip()));
function estLines(){
  if(PR.type==='nob'){ PR.staff1=0; PR.staff2=0; PR.binso='none'; }
  if((COFFIN_FOR[PR.burial]||COFFIN_FOR.und).indexOf(PR.coffin)<0) PR.coffin=(COFFIN_FOR[PR.burial]||COFFIN_FOR.und)[0];
  const L=[]; const t=pick('type',PR.type); L.push([t[1],t[2]*10000,'type']);
  const bu=pick('burial',PR.burial); L.push(['모시는 방식 · '+(PR.burial==='und'?'정하지 않음':bu[1]),0,'burial',PR.burial==='cre'?'화장장 사용료 별도':PR.burial==='bur'?'묘지 비용 별도':'상담 때 결정']);
  const c=pick('coffin',PR.coffin); L.push(['관 · '+c[1],c[2]*10000,'coffin']);
  const s=pick('shroud',PR.shroud); L.push(['수의 · '+s[1],s[2]*10000,'shroud']);
  ['ipgwan','binso','car'].forEach(g=>{ const o=pick(g,PR[g]); if(o&&o[2]) L.push([({ipgwan:'입관 · ',binso:'빈소 · ',car:'장의 차량 · '}[g])+o[1],o[2]*10000,g]); });
  if(PR.staff1) L.push(['접객 도우미 · 첫째 날 '+PR.staff1+'명',PR.staff1*120000,'staff']);
  if(PR.staff2) L.push(['접객 도우미 · 둘째 날 '+PR.staff2+'명',PR.staff2*120000,'staff']);
  if(PR.mm) L.push(['남성 상복 '+PR.mm+'벌',PR.mm*50000,'mourn']);
  if(PR.mf) L.push(['여성 상복 '+PR.mf+'벌',PR.mf*30000,'mourn']);
  if(PR.disc==='sup') L.push(['수급자 · 국가유공자 할인',-200000,'disc']);
  L.push(['고인 이송 · 모바일 부고 · 장지 안내 · 화장 예약',0,'']);
  return L;
}
const estTotal=()=>estLines().reduce((a,l)=>a+l[1],0);
let WZ_BUSY=false;
function wzLeave(dir,then){
  const stage=$('#wz-stage'); if(RM||!stage||!stage.animate||!stage.firstChild){ then(); return; }
  WZ_BUSY=true; const a=stage.animate([{opacity:1,transform:'translate3d(0,0,0)'},{opacity:0,transform:'translate3d('+(dir>0?-36:36)+'px,0,0)'}],{duration:170,easing:'cubic-bezier(0.4,0,1,1)',fill:'forwards'});
  a.onfinish=()=>{ then(); a.cancel(); WZ_BUSY=false; };
}
function wzGo(dir){ if(WZ_BUSY) return; const v=wzVis(); let i=v.findIndex(x=>x.k===WK); if(i<0) i=0; const j=Math.max(0,Math.min(v.length-1,i+dir)); if(j===i) return; wzLeave(dir,()=>{ WDIR=dir>0?'next':'prev'; WK=v[j].k; renderWizard(true); }); }
function wzJump(k){ if(WZ_BUSY) return; wzLeave(-1,()=>{ WDIR='prev'; WK=k; renderWizard(true); }); }
function wzEnter(stage,dir,oldH){
  if(RM||!stage.animate) return;
  const newH=stage.offsetHeight;
  if(oldH&&Math.abs(newH-oldH)>2){ stage.animate([{height:oldH+'px'},{height:newH+'px'}],{duration:420,easing:'cubic-bezier(0.645,0.045,0.355,1)'}); }
  const kids=[...stage.children]; const items=[]; kids.forEach(k=>{ if(k.matches('.wz-opts,.wz-sum')) items.push(...k.children); else items.push(k); });
  items.forEach((el,i)=>{ el.animate([{opacity:0,transform:'translate3d('+(dir==='prev'?-40:40)+'px,0,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:560,delay:Math.min(i*45,315),easing:'cubic-bezier(0.19,1,0.22,1)',fill:'backwards'}); });
}
function setRun(v){ const el=$('#wz-run'); if(!el) return; const from=el._v==null?v:el._v; el._v=v; cancelAnimationFrame(el._raf);
  if(RM||from===v){ el.textContent=won(v); return; } const t0=performance.now(), dur=520;
  const step=t=>{ const p=Math.min(1,(t-t0)/dur), e=1-Math.pow(1-p,3); el.textContent=won(Math.round((from+(v-from)*e)/1000)*1000); if(p<1) el._raf=requestAnimationFrame(step); else el.textContent=won(v); };
  el._raf=requestAnimationFrame(step); }
function updNav(){ const v=wzVis(); const i=v.findIndex(x=>x.k===WK); const prev=$('#wz-prev'), next=$('#wz-next'); prev.disabled=i<=0; next.hidden=v[i].k==='done'; next.textContent=(v[i+1]&&v[i+1].k==='done')?'견적 보기':'다음'; setRun(estTotal()); }
function wzStepper(key,label,sub,min,max,unit){
  const row=document.createElement('div'); row.className='stepper wz-step';
  row.innerHTML='<span><b></b><br><span class="note"></span></span><div class="ctl"><button type="button">−</button><output aria-live="polite"></output><button type="button">+</button></div>';
  row.querySelector('b').textContent=label; row.querySelector('.note').textContent=sub;
  const bs=row.querySelectorAll('button'), mi=bs[0], pl=bs[1], out=row.querySelector('output');
  mi.setAttribute('aria-label',label+' 하나 줄이기'); pl.setAttribute('aria-label',label+' 하나 늘리기');
  const upd=()=>{ out.textContent=PR[key]+unit; mi.disabled=PR[key]<=min; pl.disabled=PR[key]>=max; setRun(estTotal()); };
  mi.addEventListener('click',()=>{ PR[key]=Math.max(min,PR[key]-1); upd(); });
  pl.addEventListener('click',()=>{ PR[key]=Math.min(max,PR[key]+1); upd(); });
  upd(); return row;
}
function renderWizard(focus){
  const v=wzVis(); if(!v.find(x=>x.k===WK)) WK=v[0].k;
  const i=v.findIndex(x=>x.k===WK), st=v[i], total=v.length-1;
  $('#wz-bar').style.transform='scaleX('+(st.k==='done'?1:i/total).toFixed(4)+')';
  $('#wz-count').textContent=st.k==='done'?'견적이 나왔습니다':(i+1)+' / '+total+' 단계';
  const stage=$('#wz-stage'); const oldH=WDIR?stage.offsetHeight:0; stage.innerHTML='';
  const h=document.createElement('h2'); h.className='wz-q'; h.tabIndex=-1; stage.appendChild(h);
  const help=document.createElement('p'); help.className='wz-help'; stage.appendChild(help);
  if(st.k==='done'){
    h.textContent='나만의장례 예상 견적'; help.textContent='고르신 항목입니다. 바꾸고 싶은 항목은 ‘고치기’를 누르세요.';
    const ul=document.createElement('ul'); ul.className='sum-lines wz-sum';
    estLines().forEach(l=>{ const li=document.createElement('li'); const a=document.createElement('span'); a.textContent=l[0]; const b=document.createElement('span'); b.textContent=lineVal(l); li.appendChild(a); li.appendChild(b);
      if(l[2]){ const f=document.createElement('button'); f.type='button'; f.className='fix'; f.textContent='고치기'; f.setAttribute('aria-label',l[0]+' 고치기'); f.addEventListener('click',()=>wzJump(l[2])); li.appendChild(f); } else li.appendChild(document.createElement('span'));
      ul.appendChild(li); });
    stage.appendChild(ul);
    const tot=document.createElement('div'); tot.className='total'; tot.style.marginTop='14px'; tot.innerHTML='<span>합계</span><b></b>'; tot.lastChild.textContent=won(estTotal()); stage.appendChild(tot);
    if(PR.disc==='sup'){ const n=document.createElement('p'); n.className='note'; n.style.marginTop='10px'; n.textContent='수급자 · 국가유공자 할인 20만원이 들어간 금액입니다. 할인 대상인지는 상담 때 확인해 드립니다.'; stage.appendChild(n); }
    const act=document.createElement('div'); act.className='actions'; act.style.margin='20px 0 12px';
    act.innerHTML='<a class="btn btn-primary" href="tel:16614214">이 견적으로 상담 · 1661-4214</a><button type="button" class="btn btn-line" data-a="copy">견적 글 복사</button><button type="button" class="btn btn-line" data-a="img">견적 이미지 저장</button><button type="button" class="btn btn-ghost" data-a="again">처음부터 다시</button>';
    act.querySelector('[data-a="copy"]').addEventListener('click',()=>copyText(estText(),'견적 내용을 복사했습니다',ul));
    act.querySelector('[data-a="img"]').addEventListener('click',saveEstImg);
    act.querySelector('[data-a="again"]').addEventListener('click',()=>{ if(WZ_BUSY) return; wzLeave(-1,()=>{ Object.assign(PR,PR_DEF); WK='type'; WDIR='prev'; renderWizard(true); }); });
    stage.appendChild(act);
  } else {
    h.textContent=st.q; help.textContent=typeof st.h==='function'?st.h():st.h;
    if(st.type==='count'){ stage.appendChild(wzStepper('staff1','첫째 날','1인당 12만원',0,10,'명')); stage.appendChild(wzStepper('staff2','둘째 날','1인당 12만원',0,10,'명')); const n=document.createElement('p'); n.className='note'; n.style.marginTop='12px'; n.textContent='4일장 이상으로 진행하시면 도우미 인원과 금액은 현장에서 따로 상담해 드립니다.'; stage.appendChild(n); }
    else if(st.type==='mourn'){ stage.appendChild(wzStepper('mm','남성용 상복','1벌 5만원',0,20,'벌')); stage.appendChild(wzStepper('mf','여성용 상복','1벌 3만원',0,20,'벌')); }
    else {
      const box=document.createElement('div'); box.className='wz-opts'; box.setAttribute('role','radiogroup'); box.setAttribute('aria-label',st.q);
      (st.k==='coffin'?coffinOpts():PRICE[st.k]).forEach(o=>{
        const lab=document.createElement('label'); lab.className='wz-opt';
        const inp=document.createElement('input'); inp.type='radio'; inp.name='wz-'+st.k; inp.value=o[0]; inp.id='wz-'+st.k+'-'+o[0]; inp.checked=PR[st.k]===o[0]; lab.setAttribute('for',inp.id);
        const t=document.createElement('span'); t.className='t'; t.textContent=o[1];
        const pr=document.createElement('span'); pr.className='p'; pr.textContent=st.k==='type'?'기본 '+o[2]+'만원':st.k==='burial'?'':st.k==='disc'?(o[2]<0?'−'+(-o[2])+'만원 할인':''):(o[2]?'+'+o[2]+'만원':'0원');
        lab.appendChild(inp); lab.appendChild(t); lab.appendChild(pr);
        if(o[3]){ const d=document.createElement('span'); d.className='d'; d.textContent=o[3]; lab.appendChild(d); }
        inp.addEventListener('change',()=>{ PR[st.k]=o[0]; if(st.k==='type'&&o[0]==='nob'){ PR.staff1=0; PR.staff2=0; PR.binso='none'; } if(st.k==='burial'){ const ok=COFFIN_FOR[o[0]]||COFFIN_FOR.und; if(ok.indexOf(PR.coffin)<0) PR.coffin=ok[0]; } updNav(); });
        box.appendChild(lab); });
      stage.appendChild(box);
    }
  }
  updNav();
  if(WDIR){ wzEnter(stage,WDIR,oldH); WDIR=''; }
  if(focus){ try{ h.focus({preventScroll:true}); }catch(e){ h.focus(); } const top=$('.wiz').getBoundingClientRect().top; if(top<0) window.scrollBy({top:top-140,behavior:'smooth'}); }
}
function bindWizard(){ $('#wz-prev').addEventListener('click',()=>wzGo(-1)); $('#wz-next').addEventListener('click',()=>wzGo(1)); }
function estText(){ const L=estLines(); return '[나만의장례 맞춤 견적]\n'+L.map(l=>l[0]+'  '+lineVal(l)).join('\n')+'\n합계  '+won(L.reduce((a,l)=>a+l[1],0))+(PR.disc==='sup'?'\n(수급자 · 국가유공자 할인 20만원 포함 · 대상 확인은 상담 때)':'')+'\n\n* 장례식장 시설 사용료 · 음식값 별도\n* 리무진은 1차 장지 또는 화장장까지 편도, 장의버스는 왕복\n* 장의 차량 기준 거리 200km 초과 시 1km당 1,800원\n상담 1661-4214 (24시간)'; }
const LOGO={mark:new Image(),word:new Image()};
const logoReady=Promise.all(['mark','word'].map(k=>new Promise(r=>{ LOGO[k].onload=r; LOGO[k].onerror=r; LOGO[k].src={mark:'data:image/png;base64,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',word:'data:image/png;base64,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'}[k]; })));
function saveEstImg(){
  const L=estLines(); const W=1080, row=64, H=300+L.length*row+260; const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  const draw=()=>{ x.fillStyle='#ffffff'; x.fillRect(0,0,W,H); x.fillStyle='#252525'; x.fillRect(0,0,W,14);
    x.textBaseline='alphabetic'; x.textAlign='left'; try{ if(LOGO.mark.naturalWidth) x.drawImage(LOGO.mark,72,56,92,94); if(LOGO.word.naturalWidth) x.drawImage(LOGO.word,184,74,253,48); }catch(e){} x.font=fnt(500,28,SANS); x.fillStyle='#59615b'; x.fillText('소규모 가족장 · 무빈소장 전문  |  맞춤 견적 '+new Date().toLocaleDateString('ko-KR'),184,150);
    x.fillStyle='#1a1e1b'; x.fillRect(72,230,W-144,3); let y=230;
    L.forEach(l=>{ y+=row; x.font=fnt(500,30,SANS); x.fillStyle='#1a1e1b'; x.textAlign='left'; x.fillText(l[0],72,y-20); x.textAlign='right'; x.fillText(lineVal(l),W-72,y-20); x.fillStyle='#d3d7cf'; x.fillRect(72,y,W-144,2); });
    y+=40; x.fillStyle='#1a1e1b'; x.fillRect(72,y,W-144,3);
    x.textAlign='left'; x.font=fnt(700,32,SANS); x.fillText('합계',80,y+70); x.textAlign='right'; x.font=fnt(900,52); x.fillText(won(L.reduce((a,l)=>a+l[1],0)),W-80,y+76);
    x.textAlign='left'; x.font=fnt(500,24,SANS); x.fillStyle='#59615b'; x.fillText('장례식장 시설 사용료 · 음식값 별도 · 장례 후 정산',72,y+150); x.fillStyle='#1a1e1b'; x.font=fnt(700,30,SANS); x.fillText('24시간 상담 1661-4214',72,y+196); };
  Promise.all([ensureFonts('나만의장례맞춤견적합계무료소규모가족장무빈소장전문0123456789,원'),logoReady]).then(()=>{ draw(); c.toBlob(b=>{ if(b) saveFile('나만의장례_맞춤견적.png',b,'견적 이미지를 저장했습니다'); else toast('이미지를 만들지 못했습니다'); },'image/png'); });
}

/* ── 촌수 · 호칭 지도 ── */
const MAPS={
  blood:{cols:9,rows:7,gen:['고조','증조','조부모','부모','나','자녀','손주'],nodes:[
    {id:'gg2',x:3,y:0,name:'고조할아버지 · 고조할머니',chon:4,formal:'고조부(高祖父) · 고조모(高祖母)',call:'고조할아버지 · 고조할머니',jibang:'顯高祖考 · 顯高祖妣',rel:'gggf',note:'기제사는 보통 고조부모까지 4대를 모십니다.'},
    {id:'gg',x:3,y:1,p:'gg2',name:'증조할아버지 · 증조할머니',chon:3,formal:'증조부(曾祖父) · 증조모(曾祖母)',call:'증조할아버지 · 증조할머니',jibang:'顯曾祖考 · 顯曾祖妣',rel:'ggf'},
    {id:'gp',x:3,y:2,p:'gg',name:'할아버지 · 할머니',chon:2,formal:'조부(祖父) · 조모(祖母)',call:'할아버지 · 할머니',refer:'할아버지 · 할머니 (남의 조부는 조부님)',jibang:'顯祖考 · 顯祖妣',rel:'gf'},
    {id:'gu',x:7,y:2,p:'gg',name:'큰할아버지 · 작은할아버지',chon:4,formal:'종조부(從祖父)',call:'큰할아버지 · 작은할아버지',spouse:'큰할머니 · 작은할머니 (종조모 從祖母)',note:'할아버지의 형제입니다.'},
    {id:'gaunt',x:8,y:2,p:'gg',name:'고모할머니',chon:4,formal:'대고모(大姑母) · 왕고모',call:'고모할머니',spouse:'고모할아버지',note:'할아버지의 누이입니다.'},
    {id:'mgp',x:1,y:2,mat:1,name:'외할아버지 · 외할머니',chon:2,formal:'외조부(外祖父) · 외조모(外祖母)',call:'외할아버지 · 외할머니',jibang:'顯外祖考 · 顯外祖妣 (외손이 제사를 모실 때)'},
    {id:'fa',x:3,y:3,p:'gp',name:'아버지',chon:1,formal:'부친(父親)',call:'아버지',refer:'아버지 · 가친(家親)',dead:'선친(先親) · 선고(先考)',jibang:'顯考 (현고)',rel:'f'},
    {id:'mo',x:2,y:3,p:'mgp',mat:1,name:'어머니',chon:1,formal:'모친(母親)',call:'어머니',refer:'어머니 · 자친(慈親)',dead:'선비(先妣) · 선자(先慈)',jibang:'顯妣 (현비)',rel:'m'},
    {id:'unc',x:5,y:3,p:'gp',name:'큰아버지 · 작은아버지',chon:3,formal:'백부(伯父) · 숙부(叔父)',call:'큰아버지 · 작은아버지 (결혼 전이면 삼촌)',spouse:'큰어머니(백모 伯母) · 작은어머니(숙모 叔母)'},
    {id:'aunt',x:6,y:3,p:'gp',name:'고모',chon:3,formal:'고모(姑母)',call:'고모',spouse:'고모부(姑母夫)',note:'아버지의 누이입니다.'},
    {id:'dang',x:7,y:3,p:'gu',name:'당숙',chon:5,formal:'당숙(堂叔) · 종숙(從叔)',call:'아저씨 · 당숙',spouse:'아주머니 · 당숙모',note:'아버지의 사촌 형제, 흔히 5촌 아저씨라고 합니다.'},
    {id:'muncle',x:0,y:3,p:'mgp',mat:1,name:'외삼촌',chon:3,formal:'외숙(外叔)',call:'외삼촌',spouse:'외숙모(外叔母)',note:'어머니의 남자 형제입니다.'},
    {id:'maunt',x:1,y:3,p:'mgp',mat:1,name:'이모',chon:3,formal:'이모(姨母)',call:'이모',spouse:'이모부(姨母夫)',note:'어머니의 여자 형제입니다.'},
    {id:'me',x:3,y:4,p:'fa',me:1,name:'나',chon:'',note:'촌수는 나를 기준으로 셉니다. 다른 칸을 눌러 보세요.'},
    {id:'sib',x:4,y:4,p:'fa',name:{m:'형 · 누나 · 동생',f:'오빠 · 언니 · 동생'},chon:2,formal:'형제자매(兄弟姉妹)',call:{m:'형 · 누나 · 이름(동생)',f:'오빠 · 언니 · 이름(동생)'},refer:{m:'형 · 누님 · 아우 · 누이동생',f:'오빠 · 언니 · 남동생 · 여동생'},spouse:{m:'형의 아내 형수님 · 남동생의 아내 제수씨 · 누나의 남편 매형(자형) · 여동생의 남편 매제',f:'오빠의 아내 새언니 · 남동생의 아내 올케 · 언니의 남편 형부 · 여동생의 남편 제부'},jibang:'형 顯兄 · 형수 顯兄嫂 · 동생 亡弟',rel:'bro'},
    {id:'cous',x:5,y:4,p:'unc',name:'사촌',chon:4,formal:'종형제(從兄弟)',call:'나이에 따라 형 · 누나 · 오빠 · 언니 · 이름',refer:'사촌 형 · 사촌 동생'},
    {id:'gcous',x:6,y:4,p:'aunt',name:'고종사촌',chon:4,formal:'고종형제(姑從兄弟) · 내종(內從)',call:'나이에 따라 형 · 누나 · 오빠 · 언니 · 이름',note:'고모의 자녀입니다.'},
    {id:'jae',x:7,y:4,p:'dang',name:'육촌',chon:6,formal:'재종형제(再從兄弟)',call:'나이에 따라 형 · 누나 · 이름',note:'당숙의 자녀입니다.'},
    {id:'mcous',x:0,y:4,p:'muncle',mat:1,name:'외사촌',chon:4,formal:'외종형제(外從兄弟)',call:'나이에 따라 형 · 누나 · 오빠 · 언니 · 이름',note:'외삼촌의 자녀입니다.'},
    {id:'icous',x:1,y:4,p:'maunt',mat:1,name:'이종사촌',chon:4,formal:'이종형제(姨從兄弟)',call:'나이에 따라 형 · 누나 · 오빠 · 언니 · 이름',note:'이모의 자녀입니다.'},
    {id:'inlaw',x:2,y:5,inl:1,name:'며느리 · 사위',chon:1,formal:'자부(子婦) · 서(壻)',call:'며느리: 아가 · 새아가 · ○○ 어미 / 사위: ○ 서방 · 자네',note:'자녀의 배우자는 인척 1촌입니다.'},
    {id:'ch',x:3,y:5,p:'me',name:'아들 · 딸',chon:1,formal:'자(子) · 여(女)',call:'이름',refer:'아들 · 딸 (남의 자녀는 아드님 · 따님)',jibang:'아들 亡子 (망자)',rel:'son'},
    {id:'nep',x:4,y:5,p:'sib',name:{m:'조카 · 생질',f:'조카 · 이질'},chon:3,formal:{m:'형제의 자녀 조카(姪) · 자매의 자녀 생질(甥姪)',f:'남자 형제의 자녀 조카(姪) · 자매의 자녀 이질(姨姪)'},call:'이름',spouse:'조카며느리 · 조카사위'},
    {id:'cnep',x:5,y:5,p:'cous',name:'5촌 조카',chon:5,formal:'당질(堂姪)',call:'이름',note:'사촌의 자녀입니다.'},
    {id:'gch',x:3,y:6,p:'ch',name:'손자 · 손녀',chon:2,formal:'손자(孫子) · 손녀(孫女)',call:'이름',spouse:'손자며느리 · 손녀사위'}
  ],wed:[['mo','fa']],dash:[['inlaw','ch']]},
  cheo:{cols:7,rows:3,gen:['장인 · 장모','아내 형제','처조카'],nodes:[
    {id:'jang',x:3,y:0,inl:1,name:'장인 · 장모',chon:1,formal:'장인(丈人) · 장모(丈母)',call:'장인어른 · 아버님 / 장모님 · 어머님',refer:'장인 · 장모 (남의 장인은 빙장 聘丈 · 빙모 聘母)'},
    {id:'me',x:1,y:1,me:1,name:'나 (남편)',chon:'',note:'아내 쪽 가족은 아내를 기준으로 촌수를 셉니다.'},
    {id:'wife',x:2,y:1,p:'jang',name:'아내',chon:'무촌',formal:'처(妻)',call:'여보 · ○○ 씨',refer:'아내 · 집사람 · 안사람',jibang:'亡室 (망실)',rel:'wife'},
    {id:'wbo',x:3,y:1,p:'jang',inl:1,name:'아내의 오빠',chon:2,formal:'처남(妻男) · 손위',call:'형님',refer:'처남',spouse:'아주머니'},
    {id:'wby',x:4,y:1,p:'jang',inl:1,name:'아내의 남동생',chon:2,formal:'처남(妻男)',call:'처남 · ○○ 씨',spouse:'처남댁'},
    {id:'wso',x:5,y:1,p:'jang',inl:1,name:'아내의 언니',chon:2,formal:'처형(妻兄)',call:'처형',spouse:'형님 (동서)'},
    {id:'wsy',x:6,y:1,p:'jang',inl:1,name:'아내의 여동생',chon:2,formal:'처제(妻弟)',call:'처제',spouse:'○ 서방 · 동서'},
    {id:'wnep',x:4,y:2,p:'wby',inl:1,name:'처조카',chon:3,formal:'처질(妻姪)',call:'이름'}
  ],wed:[['me','wife']],dash:[]},
  si:{cols:7,rows:3,gen:['시부모','남편 형제','시조카'],nodes:[
    {id:'sibu',x:3,y:0,inl:1,name:'시아버지 · 시어머니',chon:1,formal:'시부(媤父) · 시모(媤母)',call:'아버님 · 어머님',refer:'시아버지 · 시어머니'},
    {id:'me',x:1,y:1,me:1,name:'나 (아내)',chon:'',note:'남편 쪽 가족은 남편을 기준으로 촌수를 셉니다. 요즘은 도련님 · 아가씨 대신 ‘○○ 씨’처럼 이름으로 부르기도 합니다.'},
    {id:'hus',x:2,y:1,p:'sibu',name:'남편',chon:'무촌',formal:'부(夫)',call:'여보 · ○○ 씨',refer:'남편 · 바깥양반 · ○○ 아빠',jibang:'顯辟 (현벽)',rel:'hus'},
    {id:'hbo',x:3,y:1,p:'sibu',inl:1,name:'남편의 형',chon:2,formal:'시숙(媤叔)',call:'아주버님',spouse:'형님 (손윗동서)'},
    {id:'hby',x:4,y:1,p:'sibu',inl:1,name:'남편의 남동생',chon:2,formal:'시동생(媤同生)',call:'도련님 (결혼 전) · 서방님 (결혼 후)',spouse:'동서'},
    {id:'hso',x:5,y:1,p:'sibu',inl:1,name:'남편의 누나',chon:2,formal:'시누이',call:'형님',spouse:'아주버님'},
    {id:'hsy',x:6,y:1,p:'sibu',inl:1,name:'남편의 여동생',chon:2,formal:'시누이',call:'아가씨 · 아기씨',spouse:'서방님'},
    {id:'hnep',x:4,y:2,p:'hby',inl:1,name:'시조카',chon:3,formal:'시질(媤姪)',call:'이름'}
  ],wed:[['me','hus']],dash:[]}
};
const CS={mode:'find',map:'blood',me:'m',sel:'fa'};
const gv=v=>v&&typeof v==='object'?v[CS.me]:v;
const CW=134, RH=104, NW=118, NDH=66, PADL=64, PADT=20;
function swapIn(el){ if(!el) return; el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); }
function renderChon(center){
  const M=MAPS[CS.map]; const map=$('#map'); map.innerHTML='';
  if(!M.nodes.find(n=>n.id===CS.sel)) CS.sel=M.nodes.find(n=>!n.me).id;
  const W=PADL+M.cols*CW+16, H=PADT+M.rows*RH+10; map.style.width=W+'px'; map.style.height=H+'px';
  const pos={}; M.nodes.forEach(n=>{ pos[n.id]={x:PADL+n.x*CW+(CW-NW)/2,y:PADT+n.y*RH}; });
  const svgNS='http://www.w3.org/2000/svg'; const svg=document.createElementNS(svgNS,'svg'); svg.setAttribute('width',W); svg.setAttribute('height',H); svg.setAttribute('aria-hidden','true');
  const path=(d,cls)=>{ const p=document.createElementNS(svgNS,'path'); p.setAttribute('d',d); if(cls) p.setAttribute('class',cls); svg.appendChild(p); };
  M.nodes.forEach(n=>{ if(!n.p||!pos[n.p]) return; const a=pos[n.p], b=pos[n.id]; const ax=a.x+NW/2, ay=a.y+NDH, bx=b.x+NW/2, by=b.y; const my=ay+(by-ay)/2; path('M'+ax+' '+ay+'V'+my+'H'+bx+'V'+by); });
  M.wed.forEach(w=>{ const a=pos[w[0]], b=pos[w[1]]; if(!a||!b) return; const y=a.y+NDH/2; const x1=Math.min(a.x,b.x)+NW, x2=Math.max(a.x,b.x); path('M'+x1+' '+(y-3)+'H'+x2+'M'+x1+' '+(y+3)+'H'+x2,'wed'); });
  M.dash.forEach(w=>{ const a=pos[w[0]], b=pos[w[1]]; if(!a||!b) return; const y=a.y+NDH/2; path('M'+(Math.min(a.x,b.x)+NW)+' '+y+'H'+Math.max(a.x,b.x),'dash'); });
  map.appendChild(svg);
  M.gen.forEach((g,i)=>{ const s=document.createElement('span'); s.className='gen-lbl'; s.style.top=(PADT+i*RH+NDH/2-9)+'px'; s.textContent=g; map.appendChild(s); });
  M.nodes.forEach(n=>{ const b=document.createElement('button'); b.type='button'; b.className='node'+(n.me?' me':'')+(n.mat?' mat':'')+(n.inl?' inl':''); b.style.left=pos[n.id].x+'px'; b.style.top=pos[n.id].y+'px';
    const nm=gv(n.name); const ch=n.chon===''?'':(typeof n.chon==='number'?n.chon+'촌':n.chon);
    b.innerHTML='<b></b><small></small>'; b.firstChild.textContent=nm; b.lastChild.textContent=ch; b.setAttribute('aria-pressed',String(CS.sel===n.id)); b.setAttribute('aria-label',nm+(ch?' '+ch:''));
    b.addEventListener('click',()=>{ CS.sel=n.id; $$('#map .node').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); renderDetail(); swapIn($('#detail')); });
    map.appendChild(b); });
  $$('#ctabs [data-map]').forEach(b=>b.setAttribute('aria-selected',String(b.getAttribute('data-map')===CS.map)));
  renderDetail();
  if(center){ const meN=pos.me, box=$('#mapbox'); if(meN&&box) box.scrollLeft=Math.max(0,meN.x-box.clientWidth/2+NW/2); }
}
function renderDetail(){
  const M=MAPS[CS.map]; const n=M.nodes.find(x=>x.id===CS.sel)||M.nodes[0]; const d=$('#detail'); d.innerHTML='';
  const h=document.createElement('h2'); h.textContent=gv(n.name); d.appendChild(h);
  const dl=document.createElement('dl'); dl.className='dl';
  const add=(k,v)=>{ if(!v&&v!==0) return; const dt=document.createElement('dt'); dt.textContent=k; const dd=document.createElement('dd'); dd.textContent=v; dl.appendChild(dt); dl.appendChild(dd); };
  add('촌수',n.chon===''?'':(typeof n.chon==='number'?n.chon+'촌'+(n.inl?' (인척)':''):n.chon));
  add('부를 때',gv(n.call)); add('남에게 말할 때',gv(n.refer)); add('한자 이름',gv(n.formal)); add('돌아가신 뒤',gv(n.dead)); add('배우자',gv(n.spouse)); add('지방에 쓰는 말',gv(n.jibang));
  if(dl.childElementCount) d.appendChild(dl);
  if(n.note){ const p=document.createElement('p'); p.className='muted'; p.textContent=n.note; d.appendChild(p); }
  if(n.rel) d.appendChild(jibangLink(n.rel));
}
function jibangLink(rel){ const b=document.createElement('a'); b.className='btn btn-line'; b.href='/print/?rel='+encodeURIComponent(rel); b.textContent='이 관계로 지방 만들기'; b.style.alignSelf='flex-start'; b.addEventListener('click',()=>{ PS.rel=rel; PS.tab='jb'; if(!REL[rel].gen) PS.pair=false; }); return b; }

/* ── 가족 관계 계산 ── */
function mk(g,sex,born){ const o={sex,born,father:null,mother:null,spouse:null,ageSet:false}; g.push(o); return o; }
function couple(a,b){ if(a&&b){ a.spouse=b; b.spouse=a; } }
function setParent(c,p){ if(p.sex==='m') c.father=p; else c.mother=p; }
function getParent(g,x,sex){ let p=sex==='m'?x.father:x.mother; if(p) return p; p=mk(g,sex,x.born-30); setParent(x,p); const o=sex==='m'?x.mother:x.father; if(o) couple(p,o); return p; }
function ensureParents(g,x){ const f=getParent(g,x,'m'), m=getParent(g,x,'f'); couple(f,m); return [f,m]; }
function addSibling(g,x,sex,age){ const pr=ensureParents(g,x); const s=mk(g,sex,x.born+(age==='+'?-3:3)); s.ageSet=true; setParent(s,pr[0]); setParent(s,pr[1]); return s; }
function addChild(g,x,sex){ const c=mk(g,sex,x.born+30); setParent(c,x); if(x.spouse) setParent(c,x.spouse); return c; }
function getSpouse(g,x){ if(x.spouse) return x.spouse; const s=mk(g,x.sex==='m'?'f':'m',x.born+(x.sex==='m'?2:-2)); couple(x,s); return s; }
function addCousin(g,x,type,sex,age){ const ps=(type==='c'||type==='gc')?'m':'f', us=(type==='c'||type==='mc')?'m':'f'; const p=getParent(g,x,ps); const u=addSibling(g,p,us,'+'); u.ageSet=false; const c=addChild(g,u,sex); c.born=x.born+(age==='+'?-3:3); c.ageSet=true; return c; }
function ancestry(x){ const res=new Map(); const q=[[x,[x]]]; while(q.length){ const it=q.shift(), n=it[0], ch=it[1]; if(res.has(n)) continue; res.set(n,ch); if(n.father) q.push([n.father,ch.concat([n.father])]); if(n.mother) q.push([n.mother,ch.concat([n.mother])]); } return res; }
function bloodDesc(a,b){
  const A=ancestry(a), B=ancestry(b); let best=null;
  A.forEach((ca,node)=>{ if(B.has(node)){ const cb=B.get(node); const d=ca.length+cb.length; if(!best||d<best.d) best={d,ca,cb}; } });
  if(!best) return null;
  const ca=best.ca, cb=best.cb, u=ca.length-1, dn=cb.length-1; const up=[], down=[];
  for(let i=1;i<=u;i++) up.push(ca[i-1].father===ca[i]?'F':'M');
  if(u>0&&dn>0){ const ac=ca[u-1], bc=cb[dn-1]; if(ac.father&&ac.father===bc.father&&ac.mother&&ac.mother===bc.mother) up[u-1]='P'; }
  for(let i=dn-1;i>=0;i--) down.push(cb[i].sex);
  let age=''; const gg=u-dn; if(u>0&&dn>0&&gg>=0&&gg<u&&b.ageSet){ age=b.born<ca[gg].born?'+':'-'; }
  return {up,down,age,sex:b.sex,u,dn};
}
const chonOf=d=>d.dn===0?d.u:(d.u===0?d.dn:d.u+d.dn);
function sibWord(sex,age,bs){ if(sex==='m') return age==='+'?(bs==='m'?'형':'오빠'):age==='-'?'남동생':'남자 형제'; return age==='+'?(bs==='m'?'누나':'언니'):age==='-'?'여동생':'여자 형제'; }
const L_UP={F:['아버지','아버지','부친(父親)'],M:['어머니','어머니','모친(母親)'],FF:['할아버지','할아버지','조부(祖父)'],FM:['할머니','할머니','조모(祖母)'],MF:['외할아버지','외할아버지','외조부(外祖父)'],MM:['외할머니','외할머니','외조모(外祖母)'],FFF:['증조할아버지','증조할아버지','증조부(曾祖父)'],FFM:['증조할머니','증조할머니','증조모(曾祖母)'],FMF:['진외할아버지 (아버지의 외할아버지)','할아버지',''],FMM:['진외할머니 (아버지의 외할머니)','할머니',''],MFF:['외증조할아버지','외증조할아버지','외증조부(外曾祖父)'],MFM:['외증조할머니','외증조할머니','외증조모(外曾祖母)'],FFFF:['고조할아버지','고조할아버지','고조부(高祖父)'],FFFM:['고조할머니','고조할머니','고조모(高祖母)'],MMF:['어머니의 외할아버지','할아버지',''],MMM:['어머니의 외할머니','할머니','']};
const L_DOWN={S:['아들','이름','자(子)'],D:['딸','이름','여(女)'],SS:['손자','이름','손자(孫子)'],SD:['손녀','이름','손녀(孫女)'],DS:['외손자','이름','외손자(外孫子)'],DD:['외손녀','이름','외손녀(外孫女)'],SSS:['증손자','이름','증손(曾孫)'],SSD:['증손녀','이름','증손녀(曾孫女)']};
function bloodTerm(d,bs){
  const up=d.up, down=d.down, age=d.age, sex=d.sex, u=d.u, dn=d.dn, m=sex==='m';
  if(dn===0){ const k=up.join(''), T=L_UP[k]; return T?{id:k,name:T[0],call:T[1],formal:T[2]}:{id:'x',name:u+'대 위 조상',call:m?'할아버지':'할머니'}; }
  if(u===0){ const k=down.map(x=>x==='m'?'S':'D').join(''), T=L_DOWN[k]; return T?{id:k,name:T[0],call:T[1],formal:T[2]}:{id:'x',name:dn+'대 아래 자손',call:'이름'}; }
  const line=up.slice(0,u-1).join(''), br=down[0];
  if(u===1&&dn===1){ const w=sibWord(sex,age,bs); return {id:(age==='-'?'y':'e')+(m?'B':'Z'),name:w,call:age==='-'?'이름':w,formal:m?(age==='-'?'제(弟)':'형(兄)'):(age==='-'?'매(妹)':'자(姊)')}; }
  if(u===1&&dn===2){ if(br==='m') return {id:'nep',name:m?'조카':'조카딸',call:'이름',formal:m?'질(姪)':'질녀(姪女)',note:'형제의 자녀입니다.'};
    return bs==='m'?{id:'nep',name:m?'생질':'생질녀',call:'이름',formal:'생질(甥姪)',note:'누이의 자녀입니다.'}:{id:'nep',name:m?'이질':'이질녀',call:'이름',formal:'이질(姨姪)',note:'자매의 자녀입니다.'}; }
  if(u===1&&dn===3) return {id:'x',name:br==='m'?(m?'종손자':'종손녀'):'형제자매의 손주',call:'이름',formal:br==='m'?'종손(從孫)':''};
  if(u===2&&dn===1){
    if(line==='F'){ if(m) return age==='+'?{id:'pUo',name:'큰아버지',call:'큰아버지',formal:'백부(伯父)'}:age==='-'?{id:'pUy',name:'작은아버지',call:'작은아버지 (결혼 전이면 삼촌)',formal:'숙부(叔父)'}:{id:'pU',name:'큰아버지 · 작은아버지',call:'큰아버지 · 작은아버지'}; return {id:'pA',name:'고모',call:'고모',formal:'고모(姑母)',note:'아버지의 누이입니다.'}; }
    if(m) return {id:'mU',name:'외삼촌',call:'외삼촌',formal:'외숙(外叔)',note:'어머니의 남자 형제입니다.'}; return {id:'mA',name:'이모',call:'이모',formal:'이모(姨母)',note:'어머니의 여자 형제입니다.'}; }
  if(u===2&&dn===2){ const t=line==='F'?(br==='m'?['사촌','종형제(從兄弟)','cF']:['고종사촌','고종(姑從)','cFA']):(br==='m'?['외사촌','외종(外從)','cM']:['이종사촌','이종(姨從)','cMA']);
    if(!age) return {id:t[2],name:t[0],call:'나이에 따라 '+(bs==='m'?'형 · 누나':'오빠 · 언니')+' · 이름',formal:t[1],cous:t[0],sibw:''};
    const w=sibWord(sex,age,bs); return {id:t[2],name:t[0]+' '+w,call:age==='+'?w:'이름',formal:t[1],cous:t[0],sibw:w}; }
  if(u===2&&dn===3){ const pre=line==='F'?(br==='m'?'':'고종 '):(br==='m'?'외종 ':'이종 '); return {id:'cnep',name:pre+'5촌 조카',call:'이름',formal:pre===''?(m?'당질(堂姪)':'당질녀(堂姪女)'):'',note:'사촌의 자녀입니다.'}; }
  if(u===3&&dn===1){
    if(line==='FF') return m?{id:'gU',name:age==='+'?'큰할아버지':age==='-'?'작은할아버지':'큰할아버지 · 작은할아버지',call:age==='+'?'큰할아버지':age==='-'?'작은할아버지':'할아버지',formal:'종조부(從祖父)',note:'할아버지의 형제입니다.'}:{id:'gA',name:'고모할머니',call:'고모할머니',formal:'대고모(大姑母)',note:'할아버지의 누이입니다.'};
    if(line==='MF') return m?{id:'mgU',name:'외종조부',call:'외할아버지',formal:'외종조부(外從祖父)',note:'외할아버지의 형제입니다.'}:{id:'x',name:'외할아버지의 누이',call:'할머니'};
    if(line==='FM') return m?{id:'x',name:'아버지의 외삼촌 (진외종조부)',call:'할아버지'}:{id:'x',name:'아버지의 이모',call:'할머니'};
    return m?{id:'x',name:'어머니의 외삼촌',call:'할아버지'}:{id:'x',name:'어머니의 이모',call:'할머니'}; }
  if(u===3&&dn===2){
    if(line==='FF'&&br==='m') return m?{id:'dang',name:'당숙',call:'아저씨 · 당숙',formal:'종숙(從叔)',note:'아버지의 사촌 형제입니다. 흔히 5촌 아저씨라고 합니다.'}:{id:'dangA',name:'당고모',call:'고모 · 당고모',formal:'종고모(從姑母)',note:'아버지의 사촌 자매, 5촌 고모입니다.'};
    if(line==='FF') return {id:'x',name:'아버지의 고종사촌',call:m?'아저씨':'아주머니 · 고모',note:'할아버지 누이의 자녀입니다.'};
    if(line==='FM') return {id:'x',name:'아버지의 '+(br==='m'?'외사촌':'이종사촌'),call:m?'아저씨':'아주머니',note:'할머니 형제자매의 자녀입니다.'};
    if(line==='MF'&&br==='m') return m?{id:'mdang',name:'외당숙',call:'아저씨 · 외당숙',formal:'외종숙(外從叔)',note:'어머니의 사촌 형제, 외5촌 아저씨입니다.'}:{id:'mdangA',name:'종이모',call:'이모',formal:'종이모(從姨母)',note:'어머니의 사촌 자매입니다.'};
    return {id:'x',name:'어머니의 '+(line==='MF'?'고종사촌':(br==='m'?'외사촌':'이종사촌')),call:m?'아저씨':'이모'}; }
  if(u===3&&dn===3&&line==='FF'&&br==='m'){ const w=age?sibWord(sex,age,bs):''; return {id:'x',name:'육촌'+(w?' '+w:''),call:age==='+'?w:'이름',formal:'재종(再從)',note:'당숙의 자녀입니다.'}; }
  if(u===4&&dn===1&&line==='FFF') return m?{id:'x',name:'증조할아버지의 형제',call:'할아버지',formal:'종증조부(從曾祖父)'}:{id:'x',name:'증조할아버지의 누이',call:'할머니'};
  if(u===4&&dn===2&&line==='FFF') return m?{id:'x',name:'할아버지의 사촌 형제',call:'할아버지',formal:'재종조부(再從祖父)'}:{id:'x',name:'할아버지의 사촌 누이',call:'할머니'};
  if(u===4&&dn===3&&line==='FFF'&&br==='m') return m?{id:'x',name:'재당숙',call:'아저씨',formal:'재종숙(再從叔)',note:'아버지의 육촌 형제, 7촌 아저씨입니다.'}:{id:'x',name:'재당고모',call:'고모',note:'아버지의 육촌 자매, 7촌 고모입니다.'};
  if(u===4&&dn===4&&line==='FFF'&&br==='m'){ const w=age?sibWord(sex,age,bs):''; return {id:'x',name:'팔촌'+(w?' '+w:''),call:age==='+'?w:'이름',formal:'삼종(三從)'}; }
  const gg=u-dn; return {id:'x',name:(u+dn)+'촌 친척',call:gg>=2?(m?'할아버지':'할머니'):gg===1?(m?'아저씨':'아주머니'):gg===0?(age==='+'?(m?'형님':'누님'):'이름'):'이름',note:'따로 정해진 호칭이 없으면 항렬과 나이에 맞춰 아저씨 · 아주머니 · 형님처럼 부르거나 이름을 부릅니다.'};
}
const SP_OF={F:['어머니'],M:['아버지'],FF:['할머니'],FM:['할아버지'],MF:['외할머니'],MM:['외할아버지'],S:['며느리','아가 · 새아가 · ○○ 어미','자부(子婦)'],D:['사위','○ 서방 · 자네','서(壻)'],SS:['손자며느리','아가'],SD:['손녀사위','○ 서방'],DS:['외손자며느리','아가'],DD:['외손녀사위','○ 서방'],pUo:['큰어머니','큰어머니','백모(伯母)'],pUy:['작은어머니','작은어머니','숙모(叔母)'],pU:['큰어머니 · 작은어머니','큰어머니 · 작은어머니'],pA:['고모부','고모부','고모부(姑母夫)'],mU:['외숙모','외숙모','외숙모(外叔母)'],mA:['이모부','이모부','이모부(姨母夫)'],gU:['큰할머니 · 작은할머니','할머니','종조모(從祖母)'],gA:['고모할아버지','할아버지'],mgU:['외종조모','외할머니'],dang:['당숙모','아주머니 · 당숙모','종숙모(從叔母)'],dangA:['당고모부','아저씨'],mdang:['외당숙모','아주머니'],mdangA:['종이모부','이모부']};
function spouseOf(t,bs,relSex){
  const id=t.id; if(SP_OF[id]){ const r=SP_OF[id]; return {name:r[0],call:r[1]||r[0],formal:r[2]||''}; }
  if(id==='eB') return bs==='m'?{name:'형수',call:'형수님',formal:'형수(兄嫂)'}:{name:'새언니',call:'언니 · 새언니',formal:'올케'};
  if(id==='yB') return bs==='m'?{name:'제수',call:'제수씨 · 계수씨',formal:'제수(弟嫂)'}:{name:'올케',call:'올케 · ○○ 씨',formal:'올케'};
  if(id==='eZ') return bs==='m'?{name:'매형',call:'매형 · 자형',formal:'자형(姊兄)'}:{name:'형부',call:'형부',formal:'형부'};
  if(id==='yZ') return bs==='m'?{name:'매제',call:'○ 서방 · 매제',formal:'매제(妹弟)'}:{name:'제부',call:'○ 서방 · 제부',formal:'제부'};
  if(id==='nep') return relSex==='m'?{name:'조카며느리',call:'아가 · 이름'}:{name:'조카사위',call:'○ 서방'};
  if(t.cous&&t.sibw){ const sw={'형':'형수','오빠':'새언니','남동생':bs==='m'?'제수':'올케','누나':'매형','언니':'형부','여동생':bs==='m'?'매제':'제부'}[t.sibw]; if(sw) return {name:t.cous+' '+sw,call:sw==='형수'?'형수님':sw}; }
  return null;
}
const JB_OF={F:'f',M:'m',FF:'gf',FM:'gm',FFF:'ggf',FFM:'ggm',FFFF:'gggf',FFFM:'gggm',eB:'bro',yB:'ybro',S:'son'};
const IN_M={F:['장인','장인어른 · 아버님','장인(丈人)'],M:['장모','장모님 · 어머님','장모(丈母)'],FF:['처조부','할아버님'],FM:['처조모','할머님'],MF:['처외조부','외할아버님'],MM:['처외조모','외할머님'],eB:['처남 (아내의 오빠)','형님','처남(妻男)'],yB:['처남 (아내의 남동생)','처남 · ○○ 씨','처남(妻男)'],eZ:['처형 (아내의 언니)','처형','처형(妻兄)'],yZ:['처제 (아내의 여동생)','처제','처제(妻弟)'],nep:['처조카','이름','처질(妻姪)'],pUo:['처삼촌','처삼촌 어른','처백부(妻伯父)'],pUy:['처삼촌','처삼촌 어른','처숙부(妻叔父)'],pU:['처삼촌','처삼촌 어른'],pA:['처고모','고모님'],mU:['처외삼촌','외삼촌'],mA:['처이모','이모님']};
const IN_F={F:['시아버지','아버님','시부(媤父)'],M:['시어머니','어머님','시모(媤母)'],FF:['시조부','할아버님'],FM:['시조모','할머님'],MF:['시외조부','외할아버님'],MM:['시외조모','외할머님'],eB:['아주버님 (남편의 형)','아주버님','시숙(媤叔)'],yB:['시동생 (남편의 남동생)','도련님 (결혼 전) · 서방님 (결혼 후)','시동생(媤同生)'],eZ:['손위 시누이 (남편의 누나)','형님','시누이'],yZ:['손아래 시누이 (남편의 여동생)','아가씨 · 아기씨','시누이'],nep:['시조카','이름','시질(媤姪)'],pUo:['시백부','큰아버님','시백부(媤伯父)'],pUy:['시숙부','작은아버님','시숙부(媤叔父)'],pU:['시삼촌','큰아버님 · 작은아버님'],pA:['시고모','고모님'],mU:['시외삼촌','외삼촌'],mA:['시이모','이모님']};
const INE_M={eB:['처남댁 (아내 오빠의 아내)','아주머니'],yB:['처남댁 (아내 남동생의 아내)','처남댁'],eZ:['동서 (처형의 남편)','형님'],yZ:['동서 (처제의 남편)','○ 서방 · 동서']};
const INE_F={eB:['손윗동서 (아주버님의 아내)','형님'],yB:['동서 (시동생의 아내)','동서'],eZ:['시누이 남편 (손위 시누이의 남편)','아주버님'],yZ:['시누이 남편 (손아래 시누이의 남편)','서방님']};
function chonText(n,kind){ return typeof n==='number'?n+'촌'+(kind?' ('+kind+')':''):n; }
function relate(a,b){
  if(a===b) return {name:'본인',chonText:''};
  if(a.spouse===b) return a.sex==='m'?{name:'아내',call:'여보 · ○○ 씨',formal:'처(妻)',chonText:'무촌',kind:'부부',rel:'wife'}:{name:'남편',call:'여보 · ○○ 씨',formal:'부(夫)',chonText:'무촌',kind:'부부',rel:'hus'};
  let d=bloodDesc(a,b);
  if(d){ const t=bloodTerm(d,a.sex); const sp=spouseOf(t,a.sex,b.sex); return {name:t.name,call:t.call,formal:t.formal,note:t.note,chonText:chonText(chonOf(d)),kind:'혈족',spouse:sp?sp.name:'',rel:JB_OF[t.id]||''}; }
  if(b.spouse){ d=bloodDesc(a,b.spouse); if(d){ const t=bloodTerm(d,a.sex); const sp=spouseOf(t,a.sex,b.spouse.sex); const nm=sp?sp.name:t.name+'의 '+(b.sex==='m'?'남편':'아내');
    return {name:nm,call:sp?sp.call:(b.born<a.born-15?(b.sex==='m'?'아저씨':'아주머니'):'○○ 씨'),formal:sp?sp.formal:'',note:t.name+'의 '+(b.sex==='m'?'남편':'아내')+'입니다.',chonText:chonText(chonOf(d),'인척'),kind:'인척 · 내 가족의 배우자',rel:(t.id==='eB'&&a.sex==='m')?'sil':''}; } }
  if(a.spouse){
    d=bloodDesc(a.spouse,b);
    if(d){ const t=bloodTerm(d,a.spouse.sex); const T=(a.sex==='m'?IN_M:IN_F)[t.id]; const sw=a.sex==='m'?'아내':'남편';
      if(T) return {name:T[0],call:T[1],formal:T[2]||'',chonText:chonText(chonOf(d),'인척'),kind:'인척 · 배우자의 가족',note:sw+'의 '+t.name+'입니다.'};
      if(t.cous) return {name:(a.sex==='m'?'처':'시')+t.cous,call:t.call,chonText:chonText(chonOf(d),'인척'),kind:'인척 · 배우자의 가족',note:sw+'의 '+t.name+'입니다.'};
      return {name:sw+'의 '+t.name,call:t.call,chonText:chonText(chonOf(d),'인척'),kind:'인척 · 배우자의 가족'}; }
    if(b.spouse){ d=bloodDesc(a.spouse,b.spouse); if(d){ const t=bloodTerm(d,a.spouse.sex); const T=(a.sex==='m'?INE_M:INE_F)[t.id]; const sw=a.sex==='m'?'아내':'남편'; const desc=sw+'의 '+t.name+'의 '+(b.sex==='m'?'남편':'아내');
      return {name:T?T[0]:desc,call:T?T[1]:(b.born<a.born-15?'어른':'○○ 씨'),chonText:chonText(chonOf(d),'인척'),kind:'인척 · 배우자 가족의 배우자',note:desc+'입니다.'}; } }
  }
  return {name:'사돈',call:b.born<a.born-15?'사돈어른':'사돈',chonText:'촌수 없음',kind:'법적 친족 아님',note:'내 가족의 배우자 쪽 가족입니다. 촌수를 따지지 않고 서로 사돈이라고 부릅니다.'};
}
function josa(w,a,b){ for(let i=w.length-1;i>=0;i--){ const c=w.charCodeAt(i); if(c>=0xAC00&&c<=0xD7A3) return ((c-0xAC00)%28)?a:b; } return b; }
function renderAnswer(box,pathText,r){
  box.innerHTML=''; swapIn(box);
  const p=document.createElement('p'); p.className='ans-path'; p.textContent=pathText; box.appendChild(p);
  const n=document.createElement('p'); n.className='ans-name'; n.textContent=r.name; box.appendChild(n);
  const dl=document.createElement('dl'); dl.className='dl';
  const add=(k,v)=>{ if(!v) return; const dt=document.createElement('dt'); dt.textContent=k; const dd=document.createElement('dd'); dd.textContent=v; dl.appendChild(dt); dl.appendChild(dd); };
  add('촌수',r.chonText); add('부를 때',r.call); add('한자 이름',r.formal); add('관계',r.kind); add('배우자',r.spouse);
  if(dl.childElementCount) box.appendChild(dl);
  if(r.note){ const q=document.createElement('p'); q.className='muted'; q.textContent=r.note; box.appendChild(q); }
}

/* 관계 찾기 */
const KINDS=[['fa','아버지'],['mo','어머니'],['sib','형제자매'],['child','자녀'],['sp','배우자'],['c','사촌 (큰·작은아버지의 자녀)'],['gc','고종사촌 (고모의 자녀)'],['mc','외사촌 (외삼촌의 자녀)'],['ic','이종사촌 (이모의 자녀)']];
const needSex=k=>['sib','child','c','gc','mc','ic'].indexOf(k)>=0;
const needAge=k=>['sib','c','gc','mc','ic'].indexOf(k)>=0;
const CH={steps:[{k:'fa'},{k:'c',sex:'m',age:'-'}]};
const EX=[
  ['아버지의 사촌 남동생',[{k:'fa'},{k:'c',sex:'m',age:'-'}]],
  ['아버지의 사촌 여동생',[{k:'fa'},{k:'c',sex:'f',age:'-'}]],
  ['할아버지의 누나',[{k:'fa'},{k:'fa'},{k:'sib',sex:'f',age:'+'}]],
  ['어머니의 사촌 오빠',[{k:'mo'},{k:'c',sex:'m',age:'+'}]],
  ['아버지의 고종사촌',[{k:'fa'},{k:'gc',sex:'m',age:'-'}]],
  ['큰아버지의 아내',[{k:'fa'},{k:'sib',sex:'m',age:'+'},{k:'sp'}]],
  ['아내의 언니의 남편',[{k:'sp'},{k:'sib',sex:'f',age:'+'},{k:'sp'}],'m'],
  ['남편의 남동생의 아내',[{k:'sp'},{k:'sib',sex:'m',age:'-'},{k:'sp'}],'f'],
  ['형의 아내의 아버지',[{k:'sib',sex:'m',age:'+'},{k:'sp'},{k:'fa'}],'m']
];
function buildChain(es,steps){
  const g=[]; const ego=mk(g,es,1990); ego.ageSet=true; let cur=ego; const words=[];
  steps.forEach(s=>{ const ps=cur.sex; let w='';
    if(s.k==='fa'){ cur=getParent(g,cur,'m'); w='아버지'; }
    else if(s.k==='mo'){ cur=getParent(g,cur,'f'); w='어머니'; }
    else if(s.k==='sib'){ cur=addSibling(g,cur,s.sex||'m',s.age||'-'); w=sibWord(s.sex||'m',s.age||'-',ps); }
    else if(s.k==='child'){ cur=addChild(g,cur,s.sex||'m'); w=(s.sex||'m')==='m'?'아들':'딸'; }
    else if(s.k==='sp'){ cur=getSpouse(g,cur); w=ps==='m'?'아내':'남편'; }
    else { cur=addCousin(g,cur,s.k,s.sex||'m',s.age||'-'); w={c:'사촌',gc:'고종사촌',mc:'외사촌',ic:'이종사촌'}[s.k]+' '+sibWord(s.sex||'m',s.age||'-',ps); }
    words.push(w); });
  let phrase=words.join('의 ');
  [['아버지의 아버지의 아버지','증조할아버지'],['아버지의 아버지의 어머니','증조할머니'],['아버지의 아버지','할아버지'],['아버지의 어머니','할머니'],['어머니의 아버지','외할아버지'],['어머니의 어머니','외할머니']].forEach(r=>{ phrase=phrase.split(r[0]).join(r[1]); });
  return {ego,cur,phrase};
}
function renderChain(){
  const keep=document.activeElement&&document.activeElement.id;
  const ol=$('#chain'); ol.innerHTML='';
  const head=document.createElement('li'); head.className='chain-me'; head.textContent=CS.me==='m'?'나 (남자)의':'나 (여자)의'; ol.appendChild(head);
  CH.steps.forEach((s,i)=>{
    const li=document.createElement('li'); li.className='chain-step';
    const sel=(id,opts,val,label,on)=>{ const e=document.createElement('select'); e.className='in'; e.id=id; e.setAttribute('aria-label',label); opts.forEach(o=>{ const op=document.createElement('option'); op.value=o[0]; op.textContent=o[1]; e.appendChild(op); }); e.value=val; e.addEventListener('change',()=>on(e.value)); return e; };
    li.appendChild(sel('ch-k-'+i,KINDS,s.k,(i+1)+'번째 관계',v=>{ s.k=v; if(needSex(v)&&!s.sex) s.sex='m'; if(needAge(v)&&!s.age) s.age='-'; renderChain(); }));
    if(needSex(s.k)) li.appendChild(sel('ch-s-'+i,[['m','남자'],['f','여자']],s.sex||'m',(i+1)+'번째 성별',v=>{ s.sex=v; renderChain(); }));
    if(needAge(s.k)) li.appendChild(sel('ch-a-'+i,[['+','손위 (나이 많음)'],['-','손아래 (나이 적음)']],s.age||'-',(i+1)+'번째 나이',v=>{ s.age=v; renderChain(); }));
    if(CH.steps.length>1){ const x=document.createElement('button'); x.type='button'; x.className='icon-btn'; x.setAttribute('aria-label',(i+1)+'번째 관계 지우기'); x.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'; x.addEventListener('click',()=>{ CH.steps.splice(i,1); renderChain(); }); li.appendChild(x); }
    if(i<CH.steps.length-1){ const ui=document.createElement('span'); ui.className='chain-ui'; ui.textContent='의'; li.appendChild(ui); }
    ol.appendChild(li); });
  const r=buildChain(CS.me,CH.steps); const res=relate(r.ego,r.cur);
  const box=$('#ch-ans'); renderAnswer(box,'나의 '+r.phrase+josa(r.phrase,'은','는'),res);
  if(res.rel&&REL[res.rel]) box.appendChild(jibangLink(res.rel));
  $('#ch-add').disabled=CH.steps.length>=6;
  if(keep){ const e=document.getElementById(keep); if(e) e.focus(); }
}

/* 두 사람 사이 */
const PAIR_ORDER=['me','fa','mo','gf','gm','mgf','mgm','uo','uow','uy','uyw','ao','aoh','ay','ayh','mu','muw','ma','mah','eb','ebw','ez','ezh','yb','ybw','yz','yzh','cs','sp','spf','spm','spe','spy','son','dau'];
const PS2={a:'mo',b:'ao'};
function familyGraph(es){
  const g=[], N={}; const m=es==='m';
  const add=(id,sex,born,label)=>{ const o=mk(g,sex,born); o.ageSet=true; o.key=id; o.label=label; N[id]=o; return o; };
  const kid=(id,sex,born,label,p1,p2)=>{ const o=add(id,sex,born,label); setParent(o,p1); setParent(o,p2); return o; };
  const wed=(id,born,label,of)=>{ const o=add(id,of.sex==='m'?'f':'m',born,label); couple(of,o); return o; };
  const gf=add('gf','m',1932,'할아버지'), gm=add('gm','f',1935,'할머니'); couple(gf,gm);
  const mgf=add('mgf','m',1934,'외할아버지'), mgm=add('mgm','f',1937,'외할머니'); couple(mgf,mgm);
  const fa=kid('fa','m',1960,'아버지',gf,gm), mo=kid('mo','f',1962,'어머니',mgf,mgm); couple(fa,mo);
  const me=kid('me',es,1990,'나',fa,mo);
  const uo=kid('uo','m',1956,'큰아버지',gf,gm); wed('uow',1958,'큰어머니',uo);
  const uy=kid('uy','m',1964,'작은아버지',gf,gm); wed('uyw',1966,'작은어머니',uy);
  const ao=kid('ao','f',1957,'고모 (아버지의 누나)',gf,gm); wed('aoh',1955,'고모부 (아버지 누나의 남편)',ao);
  const ay=kid('ay','f',1967,'고모 (아버지의 여동생)',gf,gm); wed('ayh',1965,'고모부 (아버지 여동생의 남편)',ay);
  const mu=kid('mu','m',1959,'외삼촌 (어머니의 오빠)',mgf,mgm); wed('muw',1961,'외숙모',mu);
  const ma=kid('ma','f',1966,'이모 (어머니의 여동생)',mgf,mgm); wed('mah',1964,'이모부',ma);
  const eb=kid('eb','m',1987,m?'형':'오빠',fa,mo); wed('ebw',1988,m?'형수 (형의 아내)':'새언니 (오빠의 아내)',eb);
  const ez=kid('ez','f',1985,m?'누나':'언니',fa,mo); wed('ezh',1983,m?'매형 (누나의 남편)':'형부 (언니의 남편)',ez);
  const yb=kid('yb','m',1993,'남동생',fa,mo); wed('ybw',1994,m?'제수 (남동생의 아내)':'올케 (남동생의 아내)',yb);
  const yz=kid('yz','f',1996,'여동생',fa,mo); wed('yzh',1994,m?'매제 (여동생의 남편)':'제부 (여동생의 남편)',yz);
  kid('cs','m',1984,'사촌 (큰아버지의 아들)',uo,N.uow);
  const spf=add('spf','m',m?1962:1958,m?'장인':'시아버지'), spm=add('spm','f',m?1964:1961,m?'장모':'시어머니'); couple(spf,spm);
  const sp=kid('sp',m?'f':'m',m?1992:1988,m?'아내':'남편',spf,spm); couple(me,sp);
  kid('spe','f',m?1989:1985,m?'처형 (아내의 언니)':'손위 시누이 (남편의 누나)',spf,spm);
  kid('spy','m',m?1995:1991,m?'처남 (아내의 남동생)':'시동생 (남편의 남동생)',spf,spm);
  kid('son','m',2019,'아들',me,sp); kid('dau','f',2021,'딸',me,sp);
  return N;
}
const shortLabel=l=>l.replace(/\s*\(.*\)\s*$/,'');
function renderPair(){
  const N=familyGraph(CS.me);
  [['#pa','a'],['#pb','b']].forEach(([q,k])=>{ const e=$(q); e.innerHTML=''; PAIR_ORDER.forEach(id=>{ const o=document.createElement('option'); o.value=id; o.textContent=N[id].label; e.appendChild(o); }); e.value=PS2[k]; });
  const A=N[PS2.a], B=N[PS2.b], box=$('#pair-ans'); box.innerHTML='';
  if(A===B){ const p=document.createElement('p'); p.className='muted'; p.textContent='서로 다른 두 사람을 골라 주세요.'; box.appendChild(p); return; }
  [[A,B],[B,A]].forEach(pr=>{ const x=pr[0], y=pr[1]; const card=document.createElement('div'); card.className='card pad ans-card'; const ys=shortLabel(y.label);
    renderAnswer(card,shortLabel(x.label)+'에게 '+y.label+josa(ys,'은','는'),relate(x,y)); box.appendChild(card); });
}

/* 촌수 화면 전체 */
function renderChonAll(center){
  $$('#cmodes [data-mode]').forEach(b=>b.setAttribute('aria-selected',String(b.getAttribute('data-mode')===CS.mode)));
  $$('[data-me]').forEach(b=>b.setAttribute('aria-pressed',String(b.getAttribute('data-me')===CS.me)));
  $$('[data-cmode]').forEach(el=>{ el.hidden=el.getAttribute('data-cmode')!==CS.mode; });
  if(CS.mode==='find') renderChain(); else if(CS.mode==='pair') renderPair(); else renderChon(center);
}
function bindChon(){
  $$('#cmodes [data-mode]').forEach(b=>b.addEventListener('click',()=>{ CS.mode=b.getAttribute('data-mode'); renderChonAll(true); swapIn($('[data-cmode="'+CS.mode+'"]')); }));
  $('#cmodes').addEventListener('keydown',e=>{ if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft') return; const t=$$('#cmodes [data-mode]'); const i=t.findIndex(x=>x.getAttribute('data-mode')===CS.mode); const n=t[(i+(e.key==='ArrowRight'?1:t.length-1))%t.length]; CS.mode=n.getAttribute('data-mode'); renderChonAll(true); n.focus(); });
  $$('#ctabs [data-map]').forEach(b=>b.addEventListener('click',()=>{ CS.map=b.getAttribute('data-map'); if(CS.map==='cheo') CS.me='m'; if(CS.map==='si') CS.me='f'; CS.sel=''; renderChonAll(true); }));
  $$('[data-me]').forEach(b=>b.addEventListener('click',()=>{ CS.me=b.getAttribute('data-me'); if(CS.map==='cheo'&&CS.me==='f') CS.map='si'; else if(CS.map==='si'&&CS.me==='m') CS.map='cheo'; renderChonAll(false); }));
  $('#ch-add').addEventListener('click',()=>{ CH.steps.push({k:'fa'}); renderChain(); const e=$('#ch-k-'+(CH.steps.length-1)); if(e) e.focus(); });
  $('#ch-reset').addEventListener('click',()=>{ CH.steps=[{k:'fa'}]; renderChain(); });
  $('#pa').addEventListener('change',e=>{ PS2.a=e.target.value; renderPair(); });
  $('#pb').addEventListener('change',e=>{ PS2.b=e.target.value; renderPair(); });
  $('#pswap').addEventListener('click',()=>{ const t=PS2.a; PS2.a=PS2.b; PS2.b=t; renderPair(); });
  const ex=$('#ch-ex'); EX.forEach(x=>{ const b=document.createElement('button'); b.type='button'; b.textContent=x[0]; b.addEventListener('click',()=>{ CH.steps=JSON.parse(JSON.stringify(x[1])); if(x[2]) CS.me=x[2]; renderChonAll(false); }); ex.appendChild(b); });
}

/* ── 시작 : 이 주소의 화면만 준비 ── */
const SS={get:function(k){ try{ return JSON.parse(sessionStorage.getItem(k)||'null'); }catch(e){ return null; } },set:function(k,v){ try{ sessionStorage.setItem(k,JSON.stringify(v)); }catch(e){} }};
const sameClan=(a,b)=>a&&b&&a.bk===b.bk&&a.sk===b.sk&&a.sh===b.sh;
if(PAGE==='print'){
  const s=SS.get('mf-ps');
  if(s&&typeof s==='object'){
    Object.keys(s).forEach(k=>{ if(k!=='c1'&&k!=='c2'&&Object.prototype.hasOwnProperty.call(PS,k)) PS[k]=s[k]; });
    ['c1','c2'].forEach(k=>{ const f=s[k]&&CLANS.find(c=>sameClan(c,s[k])); if(f) PS[k]=f; });
  }
  const q=new URLSearchParams(location.search); let msg='';
  const t=q.get('tab'); if(t&&['jb','mj','hb','ck','sj','env','tx'].indexOf(t)>=0) PS.tab=t;
  const r=q.get('rel'); if(r&&Object.prototype.hasOwnProperty.call(REL,r)){ PS.rel=r; PS.tab='jb'; if(!REL[r].gen) PS.pair=false; msg='고르신 관계로 지방을 준비했습니다'; }
  const ci=q.get('clan'); if(ci!==null&&/^\d+$/.test(ci)&&CLANS[+ci]){ const c=CLANS[+ci]; PS.c1=c; PS.man=false; msg=clanLabel(c)+' '+c.bh+c.sh+' · 고인 본관에 넣었습니다'; }
  if(location.search) try{ history.replaceState(null,'',location.pathname); }catch(e){}
  bindPrint();
  window.addEventListener('pagehide',()=>SS.set('mf-ps',PS));
  if(msg) setTimeout(()=>toast(msg),400);
}
if(PAGE==='price'){
  const s=SS.get('mf-pr');
  if(s&&s.PR) Object.keys(PR_DEF).forEach(k=>{ if(Object.prototype.hasOwnProperty.call(s.PR,k)) PR[k]=s.PR[k]; });
  if(s&&typeof s.WK==='string') WK=s.WK;
  bindWizard();
  window.addEventListener('pagehide',()=>SS.set('mf-pr',{PR:PR,WK:WK}));
}
if(PAGE==='chon'){
  const s=SS.get('mf-ch');
  if(s){ if(s.CS) Object.assign(CS,s.CS); if(s.CH&&Array.isArray(s.CH.steps)&&s.CH.steps.length) CH.steps=s.CH.steps; if(s.PS2) Object.assign(PS2,s.PS2); }
  bindChon();
  window.addEventListener('pagehide',()=>SS.set('mf-ch',{CS:CS,CH:CH,PS2:PS2}));
}
if(PAGE==='clan') $('#clan-q').addEventListener('input',()=>{ clanSur=''; renderClanPage(); });
route();

/* 스크롤 효과 : 첫 화면은 그대로 두고, 아래 내용만 들어올 때 부드럽게 */
(function(){
  if(RM||!('IntersectionObserver' in window)||!Element.prototype.animate) return;
  const vh=window.innerHeight||800;
  const els=$$('.page-head>*,.hero-main>*,.hero>.trim,.sec>h2,.sec>h3,.sec>.sec-lead,.sec>p,.sec>.btn,.sec>.callout,.sec>.card,.sec>.actions,.sec>.tblwrap,.sec>.dowe,.num-step>li,.promise>div,.svc>a,.sec .grid2>*,.sec .grid3>*,.sec .grid4>*,.faq,.terms').filter(el=>!el.closest('[hidden]')&&el.getBoundingClientRect().top>vh*0.98);
  if(!els.length) return;
  els.forEach(el=>el.classList.add('rv'));
  let queue=[], timer=0;
  const flush=()=>{ timer=0; queue.sort((a,b)=>(a.getBoundingClientRect().top-b.getBoundingClientRect().top)||(a.getBoundingClientRect().left-b.getBoundingClientRect().left));
    queue.forEach((el,i)=>{ const d=Math.min(i*85,340);
      el.style.willChange='opacity, transform'; el.classList.remove('rv');
      const a=el.animate([{opacity:0,transform:'translate3d(0,28px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:900,delay:d,easing:'cubic-bezier(0.19,1,0.22,1)',fill:'backwards'});
      a.onfinish=a.oncancel=()=>{ el.style.willChange=''; }; });
    queue=[]; };
  const io=new IntersectionObserver(list=>{ list.forEach(e=>{ if(e.isIntersecting){ queue.push(e.target); io.unobserve(e.target); } }); if(queue.length&&!timer) timer=requestAnimationFrame(flush); },{rootMargin:'0px 0px -4% 0px',threshold:0});
  els.forEach(el=>io.observe(el));
})();
})();
