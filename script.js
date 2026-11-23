const $=id=>document.getElementById(id);
/* Base URL of the Phonetics Lab API, no trailing slash. Leave empty to run fully offline. */
const API_URL='https://phonetics-backend-production.up.railway.app';
const ADMIN_HASH='8d008f8b98c07ba5072c02dc108351f872260bb6af85a016253f2e084909eba5'; /* SHA-256 of the admin password */
/* true = students must record every sound in order to unlock the next step. false = every section is open. */
const REQUIRE_RECORDING=false;
/* Backend: login, progress sync, quiz scores. Fails quietly so the module still works offline. */
const uid=()=>(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));
function logEvent(type,extra){
 if(type==='quiz')return api('POST','/api/me/quiz',{attempt_id:uid(),level:extra.level,score:extra.score,total:extra.total});
 if(type==='download'||type.startsWith('done-'))return api('POST','/api/me/events',{type});
}
const el=(t,h='',c='')=>{const e=document.createElement(t);e.innerHTML=h;if(c)e.className=c;return e};
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuf=a=>[...a].sort(()=>Math.random()-.5);
const ld=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const sv=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}if(k==='recd'||k==='rate'||k==='escDone')pushSoon()};
let apiTok=ld('tok',null),syncT=null;
async function apiLogin(){
 if(!API_URL||!user)return;
 const r=await fetch(API_URL+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({no:user.no,name:user.n})});
 if(r.status===403){toast('Your class number is not on the class list, so progress will not be saved online.');return}
 if(!r.ok)return;
 const j=await r.json();apiTok=j.token;sv('tok',apiTok);
 const p=j.progress;p.recorded.forEach(s=>recd.add(s));
 for(const s in p.ratings)if(!rate[s])rate[s]=p.ratings[s];
 if(p.escaped)escDone=true;
 sv('recd',[...recd]);sv('rate',rate);sv('escDone',escDone);prog();
}
async function api(method,path,body,again=true){
 if(!API_URL||!user)return null;
 try{
  if(!apiTok)await apiLogin();
  if(!apiTok)return null;
  const r=await fetch(API_URL+path,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+apiTok},body:body?JSON.stringify(body):undefined,keepalive:true});
  if(r.status===401&&again){apiTok=null;return api(method,path,body,false)}
  return r.ok?r:null;
 }catch(e){return null}
}
function pushSoon(){clearTimeout(syncT);syncT=setTimeout(()=>api('PUT','/api/me/progress',{recorded:[...recd],ratings:rate,escaped:!!escDone}),1500)}
const P=(s,k)=>s.trim().split('\n').map(l=>{const[a,b,c,d]=l.split('|');return{s:a,w:b,t:c,tip:d,k}});

const MONO=P(`iː|sheep|ʃiːp|Long. Lips spread, tongue high and forward.
ɪ|ship|ʃɪp|Short. Relaxed lips, tongue a little lower than /iː/.
ʊ|good|gʊd|Short. Lips slightly rounded, tongue high at the back.
uː|shoot|ʃuːt|Long. Lips rounded, tongue high at the back.
e|bed|bed|Short. Mouth half open, tongue forward.
ə|teacher|ˈtiːtʃə|Schwa. Weak, relaxed and very short.
ɜː|bird|bɜːd|Long. Lips neutral, tongue in the centre.
ɔː|door|dɔː|Long. Lips rounded, tongue back and mid-low.
æ|cat|kæt|Short. Mouth wide open, tongue low and forward.
ʌ|up|ʌp|Short. Mouth relaxed and open, tongue central.
ɑː|far|fɑː|Long. Mouth wide open, tongue low and back.
ɒ|on|ɒn|Short. Lips slightly rounded, tongue low and back.`,'Monophthong');
const DIPH=P(`ɪə|here|hɪə|Glide from /ɪ/ to /ə/.
eɪ|wait|weɪt|Glide from /e/ up to /ɪ/.
ʊə|tourist|ˈtʊərɪst|Glide from /ʊ/ to /ə/.
ɔɪ|coin|kɔɪn|Glide from /ɔː/ up to /ɪ/.
əʊ|show|ʃəʊ|Glide from /ə/ to /ʊ/.
eə|hair|heə|Glide from /e/ to /ə/.
aɪ|my|maɪ|Glide from /a/ up to /ɪ/.
aʊ|cow|kaʊ|Glide from /a/ up to /ʊ/.`,'Diphthong');
const CONS=P(`p|pen|pen|Voiceless plosive.
b|bad|bæd|Voiced plosive.
t|tea|tiː|Voiceless plosive.
d|did|dɪd|Voiced plosive.
k|cat|kæt|Voiceless plosive.
g|get|get|Voiced plosive.
f|fall|fɔːl|Voiceless fricative. Upper teeth on lower lip.
v|van|væn|Voiced fricative. Upper teeth on lower lip.
θ|thin|θɪn|Voiceless fricative. Tongue between the teeth.
ð|this|ðɪs|Voiced fricative. Tongue between the teeth.
s|see|siː|Voiceless fricative.
z|zoo|zuː|Voiced fricative.
ʃ|shoe|ʃuː|Voiceless fricative. Lips slightly rounded.
ʒ|vision|ˈvɪʒn|Voiced fricative.
h|hat|hæt|Voiceless. A breath of air from the throat.
m|man|mæn|Voiced nasal. Lips closed.
n|now|naʊ|Voiced nasal. Tongue tip on the ridge behind the teeth.
ŋ|sing|sɪŋ|Voiced nasal. Back of the tongue touches the soft palate.
l|leg|leg|Voiced lateral. Air flows around the tongue.
r|red|red|Voiced approximant. Tongue curls back without touching.
j|yes|jes|Voiced glide, like a quick /iː/.
w|wet|wet|Voiced glide. Lips rounded, like a quick /uː/.
tʃ|chain|tʃeɪn|Voiceless affricate: /t/ then /ʃ/.
dʒ|jam|dʒæm|Voiced affricate: /d/ then /ʒ/.`,'Consonant');
const ALL=[...MONO,...DIPH,...CONS];

const POS={'iː':[12,9],'uː':[90,9],'ɪ':[30,25],'ʊ':[72,25],'e':[32,50],'ə':[54,38],'ɜː':[50,58],'ɔː':[84,55],'æ':[44,80],'ʌ':[66,72],'ɒ':[64,90],'ɑː':[88,92]};
const PAIRS=`iː|ɪ|sheep|ship
ɪ|e|bit|bet
e|æ|bed|bad
æ|ʌ|cat|cut
ɑː|ʌ|heart|hut
ʊ|uː|full|fool
ɒ|ɔː|cot|caught
eɪ|aɪ|late|light
əʊ|ɔː|boat|bought
θ|s|think|sink
ð|d|then|den
ʃ|tʃ|ship|chip
v|w|vine|wine
l|r|light|right`.split('\n').map(l=>{const[a,b,x,y]=l.split('|');return{a,b,x,y}});

const QB=`Which word contains the vowel sound /æ/?|Cat|Car|Cup|Cot|0|“cat” is /kæt/. “Car” has /ɑː/, “cup” has /ʌ/, “cot” has /ɒ/.|
Which word contains the diphthong /aɪ/?|Boy|Wait|My|Cow|2|“my” is /maɪ/. “Boy” has /ɔɪ/, “wait” has /eɪ/, “cow” has /aʊ/.|
What is the first sound in “shoe”?|/s/|/ʃ/|/tʃ/|/ʒ/|1|“shoe” is /ʃuː/, a voiceless fricative.|
The symbol /θ/ appears in which word?|This|Thin|Tin|Then|1|“thin” is /θɪn/. “This” and “then” start with the voiced /ð/.|
The weak, relaxed vowel /ə/ is called…|Schwa|Diphthong|Plosive|Fricative|0|/ə/ is the schwa, the most common vowel sound in English.|
How many monophthongs are in standard British English?|8|12|20|24|1|There are 12 monophthongs, 8 diphthongs and 24 consonants.|
Which of these is a long vowel?|/ɪ/|/iː/|/ʊ/|/e/|1|The mark ː shows length, so /iː/ is long.|
Listen and choose the word you hear.|sheep|ship|chip|sip|1|The word was “ship” /ʃɪp/, with the short vowel /ɪ/.|ship
Which word contains the diphthong /eɪ/?|Wait|Hair|Here|Coin|0|“wait” is /weɪt/. “Hair” has /eə/, “here” has /ɪə/, “coin” has /ɔɪ/.|
Which pair is a minimal pair?|ship – sheep|cat – dog|bed – table|my – cow|0|Minimal pairs differ by one sound only: /ʃɪp/ and /ʃiːp/.|
Which word contains the consonant /ŋ/?|Sing|Sin|Sit|Six|0|“sing” is /sɪŋ/, with the nasal /ŋ/ at the end.|
Which diphthong is in “coin”?|/ɔɪ/|/aɪ/|/eɪ/|/ʊə/|0|“coin” is /kɔɪn/.|`.split('\n').map(l=>{const a=l.split('|');return{q:a[0],o:a.slice(1,5),a:+a[5],x:a[6],say:a[7]}});

let user=ld('user',null),seen=new Set(ld('seen',[])),recd=new Set(ld('recd',[])),rate=ld('rate',{}),best=ld('best',0),escDone=ld('escDone',false),cur=null;
let admin=false;try{admin=sessionStorage.getItem('admin')==='1'}catch(e){}

/* audio */
let voice=null;
function pickVoice(){const v=speechSynthesis.getVoices();voice=v.find(x=>x.lang==='en-GB')||v.find(x=>x.lang.startsWith('en'))||null}
if(window.speechSynthesis){pickVoice();speechSynthesis.onvoiceschanged=pickVoice}
function say(w,r=.9){if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(w);u.lang='en-GB';if(voice)u.voice=voice;u.rate=r;
 const wv=$('dlgWave');if(wv){u.onstart=()=>wv.classList.add('playing');u.onend=()=>wv.classList.remove('playing');u.onerror=()=>wv.classList.remove('playing')}
 speechSynthesis.speak(u)}

/* login + navigation */
$('lf').onsubmit=e=>{e.preventDefault();user={n:$('sn').value.trim(),no:$('sno').value};sv('user',user);apiTok=null;sv('tok',null);enter();apiLogin().catch(()=>{})};
function logout(){if(confirm('Are you sure you want to log out? This will clear your progress on this device.')){
 ['user','tok','seen','recd','rate','best','escDone','qAtt','qLv','menuC','tutDone'].forEach(k=>localStorage.removeItem(k));
 location.reload()
}}
const PAGES=[['home','Home'],['learn','Sounds'],['chart','Vowel Chart'],['pairs','Minimal Pairs'],['cards','Flashcards'],['quiz','Quiz'],['escape','Escape Room'],['port','Portfolio']];
const R={home:renderHome,learn:()=>renderLearn(true),chart:renderChart,pairs:renderPairs,cards:renderCard,quiz:showLevels,escape:renderEscape,port:renderPort};
const GROUPS=[['Monophthong','Monophthongs'],['Diphthong','Diphthongs'],['Consonant','Consonants']];
const GATED=['chart','pairs','cards','quiz','escape'];
const cnt=k=>ALL.filter(x=>x.k===k).length,got=k=>ALL.filter(x=>x.k===k&&recd.has(x.s)).length,done=k=>got(k)===cnt(k);
const allDone=()=>GROUPS.every(g=>done(g[0]));
const gi=k=>GROUPS.findIndex(g=>g[0]===k);
const isOpen=k=>!REQUIRE_RECORDING||admin||gi(k)===0||done(GROUPS[gi(k)-1][0]);
const locked=id=>REQUIRE_RECORDING&&!admin&&GATED.includes(id)&&!allDone();
const firstOpen=()=>{const g=GROUPS.find(g=>!done(g[0]));return g?g[0]:GROUPS[GROUPS.length-1][0]};
function toast(m){const t=$('toast');t.textContent=m;t.classList.remove('hide');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add('hide'),3000)}
function burst(){if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const c=el('div','','burst');($('dlg').open?$('dlg'):document.body).append(c);
 const colors=['#FF8A3D','#E8479B','#FFD65A','#5EE0A0','#A78BFA','#F5F1FF'];
 for(let i=0;i<42;i++){const p=el('i');const sz=Math.random()>.5?`${8+Math.random()*6}px`:`${10+Math.random()*6}px`;const isRound=Math.random()>.6;
  p.style.cssText=`left:${42+Math.random()*16}%;width:${sz};height:${isRound?sz:`${12+Math.random()*8}px`};border-radius:${isRound?'50%':'3px'};--x:${(Math.random()-.5)*100}vw;--y:${-(20+Math.random()*38)}vh;--r:${Math.random()*1080-540}deg;background:${colors[i%colors.length]};animation-delay:${Math.random()*.12}s`;c.append(p)}
 setTimeout(()=>c.remove(),1950)}
function enter(){
 $('login').classList.add('hide');$('app').classList.remove('hide');const nm=user.n.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());$('wn').textContent=nm;$('bn').textContent=nm;$('bno').textContent='Class number '+user.no;menuSet(ld('menuC',false));
 if(!$('nav').children.length)AREAS.forEach(a=>{const b=el('button',a[1]);b.dataset.a=a[0];b.onclick=()=>go(a[2].find(p=>!locked(p))||a[2][0]);$('nav').append(b)});
 grp=firstOpen();adminUI();prog();go('home');if(!ld('tutDone',false))setTimeout(()=>tour(0),500)}
function navState(){document.querySelectorAll('#nav button').forEach(b=>{const a=AREAS.find(x=>x[0]===b.dataset.a),lk=a[2].every(locked);b.classList.toggle('lk',lk);b.title=lk?'Record all 44 sounds to unlock':''})}
function go(id){if(locked(id)){toast('Record all 44 sounds, in order, to unlock this section.');return}
 const A=AREAS.find(a=>a[2].includes(id));
 document.querySelectorAll('.pg').forEach(p=>p.classList.toggle('on',p.id===id));
 document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.a===A[0]));
 const s=$('sub');s.innerHTML='';s.classList.toggle('hide',A[2].length<2);
 A[2].forEach(p=>{const b=el('button',LBL[p],(p===id?'on':'')+(locked(p)?' lk':''));b.onclick=()=>go(p);s.append(b)});
 if(R[id])R[id]();window.scrollTo(0,0)}
function prog(){const n=recd.size,t=ALL.length;$('bar').style.width=n/t*100+'%';$('ptxt').textContent=`Recorded ${n} of ${t} sounds`;navState()}
function renderPath(){const p=$('path');p.innerHTML='<h3>Your learning path</h3>';
 GROUPS.forEach(([k,l],i)=>p.append(el('div',`<span><b>${i+1}. ${l}</b></span><span>${got(k)} of ${cnt(k)} recorded${done(k)?', complete':''}</span>`,'step')));
 const q=Object.values(QS).filter(s=>s.best>=PASS).length;
 p.append(el('div',`<span><b>4. Quiz levels</b></span><span>${q} of 5 passed</span>`,'step'));
 const b=el('button',allDone()?'Go to the quiz':'Continue learning','btn pri');b.style.marginTop='14px';b.onclick=()=>go(allDone()?'quiz':'learn');p.append(b)}

/* sounds */
let grp='Monophthong',jump=null,lastRec=null,lastUnlock=null;
function renderLearn(anim){if(!isOpen(grp))grp=firstOpen();const s=$('seg');s.innerHTML='';
 GROUPS.forEach(([k,l])=>{const lk=!isOpen(k);const b=el('button',`${lk?'🔒 ':''}${l} (${got(k)}/${cnt(k)})`,(k===grp?'on':'')+(k===lastUnlock?' unl':''));
  b.disabled=lk;b.title=lk?'Record every sound in the previous group first':'';b.onclick=()=>{grp=k;renderLearn(true)};s.append(b)});
 const i=gi(grp),L=GROUPS[i][1].toLowerCase(),nx=GROUPS[i+1];
 $('lm').textContent=`Tap a card, listen, then press Record yourself. ${got(grp)} of ${cnt(grp)} ${L} recorded.`;
 const g=$('grid');g.innerHTML='';g.classList.toggle('anim',!!anim);
 ALL.filter(x=>x.k===grp).forEach((x,n)=>{const r=recd.has(x.s);const b=el('button',`<b>/${x.s}/</b><span>${x.w}</span>${r?'<small>✓ recorded</small>':''}`,'card'+(r?' seen':'')+(x.s===lastRec?' just':''));b.style.setProperty('--i',n);b.onclick=()=>openD(x);g.append(b)});
 lastRec=null;lastUnlock=null}
function beat(){const d=$('dS');if(d){d.classList.remove('sp');void d.offsetWidth;d.classList.add('sp')}
 const wv=$('dlgWave');if(wv){wv.classList.add('playing');clearTimeout(beat.t);beat.t=setTimeout(()=>wv.classList.remove('playing'),1100)}}
function setSpeed(r){$('bN').classList.toggle('pri',r!==.5);$('bS').classList.toggle('pri',r===.5)}
function playD(r){setSpeed(r);say(cur.w,r);beat()}
function openD(x){cur=x;$('dK').textContent=x.k;$('dS').textContent='/'+x.s+'/';$('dW').textContent=x.w;$('dT').textContent='/'+x.t+'/';$('dTip').textContent=x.tip;
 $('ra').classList.add('hide');$('rd').classList.add('hide');$('rm2').textContent=recd.has(x.s)?'Recorded ✓':'';$('rb').textContent=recd.has(x.s)?'Record again':'Record yourself';setSpeed(.9);markRate();
 $('dlgRateHint').textContent = rate[cur.s] ? 'Your self-assessment:' : '💡 Rate your confidence to add this to your Portfolio!';
 seen.add(x.s);sv('seen',[...seen]);prog();$('dlg').showModal();say(x.w);beat()}
$('dlg').onclose=()=>{if(mr&&mr.state==='recording')mr.stop();if(jump){grp=jump;jump=null}if($('learn').classList.contains('on'))renderLearn()};
function markRate(){
 [...$('rt').children].forEach(b=>b.classList.toggle('on',rate[cur.s]===+b.dataset.v));
 if(rate[cur.s]) $('dlgRateHint').textContent = 'Your self-assessment:';
}
[...$('rt').children].forEach(b=>b.onclick=()=>{rate[cur.s]=+b.dataset.v;sv('rate',rate);markRate()});
let mr=null,ch=[];
async function rec(b){const x=cur;try{
 if(mr&&mr.state==='recording'){mr.stop();return}
 const st=await navigator.mediaDevices.getUserMedia({audio:true});mr=new MediaRecorder(st);ch=[];
 mr.ondataavailable=e=>ch.push(e.data);
 mr.onstop=()=>{b.classList.remove('recing');st.getTracks().forEach(t=>t.stop());const mt=mr.mimeType||'audio/webm',bl=new Blob(ch,{type:mt}),u=URL.createObjectURL(bl);
  if(bl.size<800){b.textContent=recd.has(x.s)?'Record again':'Record yourself';$('rm2').textContent='No sound was captured. Check your microphone and try again.';return}
  $('ra').src=u;$('ra').classList.remove('hide');const d=$('rd');d.href=u;d.download=`${user?user.no+'-'+user.n.replace(/\W+/g,'-'):'student'}-${x.w}.${mt.includes('mp4')?'m4a':'webm'}`;d.classList.remove('hide');b.textContent='Record again';
  const was=done(x.k);recd.add(x.s);lastRec=x.s;sv('recd',[...recd]);prog();
  let m='Recorded ✓ Compare your recording with the model audio.';
  if(!was&&done(x.k)){const i=gi(x.k),nx=GROUPS[i+1];logEvent('done-'+x.k,{explored:recd.size});burst();lastUnlock=nx?nx[0]:null;
   if(nx){jump=nx[0];m=`Recorded ✓ All ${GROUPS[i][1].toLowerCase()} done! Next up: ${nx[1]}. Close this panel to continue.`}
   else m='Recorded ✓ All 44 sounds recorded! Try the Quiz next.'}
  $('rm2').textContent=m;
  if(!$('dlg').open&&$('learn').classList.contains('on')){if(jump){grp=jump;jump=null}renderLearn()}};
 mr.start();b.classList.add('recing');b.textContent='Stop recording'
}catch(e){$('rm2').textContent='Microphone is not available here. Allow microphone access or open the page in its own tab.'}}

/* admin override */
async function sha(t){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function adminUI(){const b=$('adm');b.textContent=admin?'Admin on · Log out':'Admin';b.classList.toggle('on',admin)}
function adminBtn(){if(admin){admin=false;try{sessionStorage.removeItem('admin')}catch(e){}adminUI();navState();go('home');toast('Admin mode off.');return}
 $('apw').value='';$('amsg').textContent='';$('adlg').showModal();$('apw').focus()}
$('af').onsubmit=async e=>{e.preventDefault();
 try{if(!window.crypto||!crypto.subtle)throw 0;
  if(await sha($('apw').value.trim().toLowerCase())===ADMIN_HASH){admin=true;try{sessionStorage.setItem('admin','1')}catch(x){}$('adlg').close();adminUI();navState();go('home');toast('Admin mode on. Every section is unlocked.')}
  else $('amsg').textContent='Wrong password.'
 }catch(x){$('amsg').textContent='Admin login needs https or localhost.'}};

/* vowel chart */
function renderChart(){const c=$('vc');if(!c.querySelector('.dot'))MONO.forEach((m,n)=>{const b=el('button','/'+m.s+'/','dot');b.style.setProperty('--i',n);b.style.left=POS[m.s][0]+'%';b.style.top=POS[m.s][1]+'%';b.onclick=()=>openD(m);c.append(b)});
 const d=$('dc');if(!d.children.length)DIPH.forEach(x=>{const b=el('button',`<b>/${x.s}/</b><small>${x.w}: ${x.tip}</small>`);b.onclick=()=>openD(x);d.append(b)})}

/* minimal pairs */
let PA=0,PW=[],pc=null,ok=0,tot=0,stk=0;
function renderPairs(){const l=$('pl');if(!l.children.length)PAIRS.forEach(p=>{const r=el('div','','pr');
  const a=el('button','Listen: '+p.x,'btn'),b=el('button','Listen: '+p.y,'btn');a.onclick=()=>say(p.x);b.onclick=()=>say(p.y);
  r.append(a,el('span',`/${p.a}/ vs /${p.b}/`),b);l.append(r)});nextPair()}
function nextPair(){pc=rnd(PAIRS);PW=[pc.x,pc.y];PA=Math.random()<.5?0:1;const o=$('pgo');o.innerHTML='';
 PW.forEach((w,i)=>{const b=el('button',`${w}<small>/${i?pc.b:pc.a}/</small>`,'opt');b.onclick=()=>{
   tot++;const good=i===PA;if(good){ok++;stk++}else stk=0;
   [...o.children].forEach((x,j)=>{x.disabled=true;if(j===PA)x.classList.add('ok');else if(j===i)x.classList.add('no')});
   $('pgm').textContent=good?'Correct!':`Not quite. You heard “${PW[PA]}”.`;
   const stTxt=stk>=3?`<span class="streak-banner">🔥 Streak ${stk}</span>`:`Streak ${stk}.`;
   $('pgs').innerHTML=`Score ${ok}/${tot}. ${stTxt}`;
   if(good&&(stk===5||stk===10))burst()};o.append(b)});
 $('pgm').textContent='Listen, then choose the word you hear.';say(PW[PA],.8)}

/* flashcards */
let deck=shuf(ALL),di=0,fl=0;
function renderCard(){const x=deck[di];$('fc').classList.toggle('flip',!!fl);$('fF').textContent='/'+x.s+'/';
 $('fB').innerHTML=`<b style="font-family:inherit;font-size:1.8rem">${x.w}</b><span class="ipa">/${x.t}/</span><small>${x.tip}</small>`;$('fn').textContent=`Card ${di+1} of ${deck.length}`}
function flipC(){fl=fl?0:1;$('fc').classList.toggle('flip',!!fl);if(fl)say(deck[di].w)}
function moveC(n){const f=$('fc');if(f){f.classList.remove('slide-left','slide-right');void f.offsetWidth;f.classList.add(n>0?'slide-left':'slide-right');setTimeout(()=>f.classList.remove('slide-left','slide-right'),360)}
 di=(di+n+deck.length)%deck.length;fl=0;renderCard()}

/* per-student question sets: seeded by the class number (absen) */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const seedOf=salt=>((parseInt(user&&user.no)||0)*2654435761+salt*40503+977)>>>0;
const sRnd=(r,a)=>a[Math.floor(r()*a.length)];
const sShuf=(r,a)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const pickN=(r,a,n)=>sShuf(r,a).slice(0,n);
const uniq=(a,f)=>{const s=new Set();return a.filter(x=>{const k=f(x);if(s.has(k))return false;s.add(k);return true})};
const slash=s=>'/'+s+'/';
const KL={Monophthong:'vowel',Diphthong:'diphthong',Consonant:'consonant'};
const NOFIRST=['ʒ','ŋ'],COMP={'tʃ':['t','ʃ'],'dʒ':['d','ʒ']};
const ESC_D=ALL.filter(x=>!x.t.includes('ˈ'));
const QG={
 word(r){const x=sRnd(r,ALL),d=pickN(r,uniq(ALL.filter(y=>y.w!==x.w&&!y.t.includes(x.s)),y=>y.w),3);
  return{q:`Which word contains the ${KL[x.k]} sound /${x.s}/?`,o:[x.w,...d.map(y=>y.w)],a:0,x:`“${x.w}” is /${x.t}/.`}},
 first(r){const L=CONS.filter(x=>!NOFIRST.includes(x.s)),x=sRnd(r,L),d=pickN(r,L.filter(y=>y!==x&&!(COMP[x.s]||[]).includes(y.s)),3);
  return{q:`Which symbol represents the first sound in “${x.w}”?`,o:[x.s,...d.map(y=>y.s)].map(slash),a:0,x:`“${x.w}” is /${x.t}/, so it starts with /${x.s}/.`}},
 vowel(r){const L=MONO.filter(x=>x.s!=='ə'),x=sRnd(r,L),d=pickN(r,L.filter(y=>y!==x),3);
  return{q:`Which symbol is the vowel sound in “${x.w}”?`,o:[x.s,...d.map(y=>y.s)].map(slash),a:0,x:`“${x.w}” is /${x.t}/.`}},
 diph(r){const L=DIPH.filter(x=>x.s!=='ʊə'),x=sRnd(r,L),d=pickN(r,DIPH.filter(y=>y!==x),3);
  return{q:`Which diphthong is in “${x.w}”?`,o:[x.s,...d.map(y=>y.s)].map(slash),a:0,x:`“${x.w}” is /${x.t}/.`}},
 type(r){const x=sRnd(r,ALL),O=['Monophthong','Diphthong','Consonant'];
  return{q:`What type of sound is /${x.s}/?`,o:O,a:O.indexOf(x.k),x:`/${x.s}/ is a ${x.k.toLowerCase()}, as in “${x.w}”.`}},
 voice(r){const x=sRnd(r,CONS);
  return{q:`Is the consonant /${x.s}/ voiced or voiceless?`,o:['Voiced','Voiceless'],a:x.tip.startsWith('Voiceless')?1:0,x:`/${x.s}/ in “${x.w}”: ${x.tip}`}},
 len(r){const x=sRnd(r,MONO.filter(x=>x.s!=='ə'));
  return{q:`Is the vowel /${x.s}/ long or short?`,o:['Long','Short'],a:x.tip.startsWith('Long')?0:1,x:`/${x.s}/ in “${x.w}”: ${x.tip}`}},
 listen(r){const p=sRnd(r,PAIRS),w=r()<.5?p.x:p.y,o=w===p.x?p.y:p.x,d=pickN(r,uniq(PAIRS.flatMap(z=>[z.x,z.y]).filter(z=>z!==p.x&&z!==p.y),z=>z),2);
  return{q:'Listen and choose the word you hear.',o:[w,o,...d],a:0,say:w,x:`The word was “${w}”.`}},
 intr(r){const x=sRnd(r,ALL),d=pickN(r,uniq(ALL.filter(y=>y.w!==x.w),y=>y.w),3);
  return{q:`Which word is written /${x.t}/ in IPA?`,o:[x.w,...d.map(y=>y.w)],a:0,x:`/${x.t}/ is “${x.w}”.`}},
 tr(r){const x=sRnd(r,ALL),d=pickN(r,uniq(ALL.filter(y=>y.t!==x.t),y=>y.t),3);
  return{q:`Which is the correct transcription of “${x.w}”?`,o:[x.t,...d.map(y=>y.t)].map(slash),a:0,x:`“${x.w}” is /${x.t}/.`}},
 tip(r){const L=ALL.filter(x=>ALL.filter(y=>y.tip===x.tip).length===1&&!x.tip.includes('/'+x.s+'/')),x=sRnd(r,L),d=pickN(r,ALL.filter(y=>y.k===x.k&&y!==x&&y.tip.split('.')[0]!==x.tip.split('.')[0]),3);
  return{q:`Which sound matches this description? “${x.tip}”`,o:[x.s,...d.map(y=>y.s)].map(slash),a:0,x:`/${x.s}/ as in “${x.w}”: ${x.tip}`}}
};
/* ===== quiz: 5 levels, a different set for every class number ===== */
const SYM=[...new Set(ALL.map(x=>x.s))].sort((a,b)=>b.length-a.length);
const tok=t=>{const o=[];for(let i=0;i<t.length;){const m=SYM.find(s=>t.startsWith(s,i));if(m){o.push(m);i+=m.length}else i++}return o};
const has=(t,s)=>tok(t).includes(s);
const CF={'iː':['ɪ'],'ɪ':['iː','e'],'e':['ɪ','æ'],'æ':['e','ʌ'],'ʌ':['æ','ɑː'],'ɑː':['ʌ','ɔː'],'ɒ':['ɔː','ʌ'],'ɔː':['ɒ','ɜː'],'ʊ':['uː'],'uː':['ʊ'],'ɜː':['ɔː','ə'],'ə':['ɜː','ʌ'],'θ':['ð','s'],'ð':['θ','d'],'s':['z','ʃ'],'z':['s'],'ʃ':['tʃ','s'],'ʒ':['dʒ','ʃ'],'tʃ':['ʃ','dʒ'],'dʒ':['tʃ','ʒ'],'p':['b'],'b':['p'],'t':['d'],'d':['t'],'k':['g'],'g':['k'],'f':['v'],'v':['f','w'],'n':['ŋ','m'],'m':['n'],'ŋ':['n'],'l':['r'],'r':['l'],'w':['v'],'eɪ':['aɪ','e'],'aɪ':['eɪ'],'əʊ':['ɔɪ','ɔː'],'ɔɪ':['əʊ'],'ɪə':['eə'],'eə':['ɪə'],'ʊə':['ɔː'],'aʊ':['əʊ']};
const VP=[['p','b'],['t','d'],['k','g'],['f','v'],['θ','ð'],['s','z'],['ʃ','ʒ'],['tʃ','dʒ']];
const OS=[...CONS.map(x=>x.s),'iː','uː','æ','ʌ','ɑː','ɒ','ɜː','ɔː'];
Object.assign(QG,{
 bank(r){const q=sRnd(r,QB.filter(z=>!z.say));return{q:q.q,o:q.o,a:q.a,x:q.x}},
 trHard(r){const L=ALL.filter(x=>tok(x.t).reduce((n,s)=>n+(CF[s]||[]).length,0)>=3),x=sRnd(r,L),T=tok(x.t),st=x.t.startsWith('ˈ')?'ˈ':'',c=st+T.join(''),
  idx=T.map((s,i)=>CF[s]?i:-1).filter(i=>i>=0),ds=new Set();
  for(let g=0;g<40&&ds.size<3;g++){const i=sRnd(r,idx),U=[...T];U[i]=sRnd(r,CF[T[i]]);const m=st+U.join('');if(m!==c)ds.add(m)}
  return{q:`Which is the correct transcription of “${x.w}”?`,o:[c,...ds].map(slash),a:0,w:x.w,x:`“${x.w}” is /${x.t}/.`}},
 listenTr(r){const q=QG.trHard(r);return{q:'Listen. Which transcription matches the word you hear?',o:q.o,a:0,say:q.w,x:`The word was “${q.w}”. ${q.x.replace(/^“.+?” is /,'It is ')}`}},
 gap(r){const x=sRnd(r,ALL.filter(y=>tok(y.t).length>=3)),T=tok(x.t),i=Math.floor(r()*T.length),s=T[i],k=ALL.find(y=>y.s===s).k,
  ds=uniq([...(CF[s]||[]),...pickN(r,ALL.filter(y=>y.k===k).map(y=>y.s),5)].filter(z=>z!==s),z=>z).slice(0,3),st=x.t.startsWith('ˈ')?'ˈ':'';
  return{q:`Complete the transcription of “${x.w}”: /${st+T.map((z,j)=>j===i?'_':z).join('')}/`,o:[s,...ds].map(slash),a:0,x:`“${x.w}” is /${x.t}/.`}},
 odd(r){const S=OS.filter(s=>uniq(ALL.filter(y=>has(y.t,s)),y=>y.w).length>=3),s=sRnd(r,S),W=uniq(ALL.filter(y=>has(y.t,s)),y=>y.w),N=uniq(ALL.filter(y=>!y.t.includes(s)),y=>y.w),a=sRnd(r,N),ws=pickN(r,W,3);
  return{q:`Which word does NOT contain the sound /${s}/?`,o:[a.w,...ws.map(y=>y.w)],a:0,x:`“${a.w}” is /${a.t}/. ${ws.map(y=>`“${y.w}” /${y.t}/`).join(', ')} all contain /${s}/.`}},
 pairdiff(r){const p=sRnd(r,PAIRS),d=pickN(r,PAIRS.filter(z=>!(z.a===p.a&&z.b===p.b)),3);
  return{q:`The minimal pair “${p.x}” and “${p.y}” differs in which two sounds?`,o:[p,...d].map(z=>`/${z.a}/ and /${z.b}/`),a:0,x:`“${p.x}” and “${p.y}” differ only in /${p.a}/ and /${p.b}/.`}},
 partner(r){const[a,b]=sRnd(r,VP),f=r()<.5,s=f?a:b,t=f?b:a,d=pickN(r,CONS.filter(y=>y.s!==a&&y.s!==b).map(y=>y.s),3);
  return{q:`Which consonant is the ${f?'voiced':'voiceless'} partner of /${s}/?`,o:[t,...d].map(slash),a:0,x:`/${a}/ is voiceless and /${b}/ is voiced. They are made in the same place.`}},
 count(r){const x=sRnd(r,ALL),n=tok(x.t).length;
  return{q:`How many sounds are in /${x.t}/ (“${x.w}”)? Count each long vowel, diphthong and affricate as one sound.`,o:[n,...pickN(r,[n-2,n-1,n+1,n+2].filter(v=>v>0),3)].map(String),a:0,x:`/${x.t}/ has ${n} sounds: ${tok(x.t).map(slash).join(' ')}.`}},
 dtip(r){const x=sRnd(r,DIPH),d=pickN(r,uniq(ALL.filter(y=>y.w!==x.w&&!has(y.t,x.s)),y=>y.w),3);
  return{q:`Which word has the diphthong described here? “${x.tip}”`,o:[x.w,...d.map(y=>y.w)],a:0,x:`“${x.w}” is /${x.t}/, so it has /${x.s}/.`}}
});
const LV=[
 {t:'Easy',d:'Sound types, vowel length and simple words.',p:['type','len','word','vowel','bank','listen']},
 {t:'Easy',d:'Symbols, first sounds and transcriptions.',p:['first','tr','intr','voice','diph','listen','bank']},
 {t:'Medium',d:'Diphthongs, voiced pairs and counting sounds.',p:['tip','dtip','partner','count','tr','diph','first','intr','listen']},
 {t:'Hard',d:'Look-alike transcriptions and the odd one out.',p:['trHard','odd','pairdiff','count','partner','tip','dtip','gap']},
 {t:'Hard',d:'Listen, decode and complete the IPA.',p:['listenTr','trHard','gap','odd','pairdiff','count','dtip','partner']}];
const PASS=7,QS=ld('qLv',{});
let ql=1;
function quizFor(l){const r=mulberry32(seedOf(l*1000+((QS[l]||{}).att||0)*97+1)),P=LV[l-1].p,out=[],seen=new Set();
 const add=k=>{const q=QG[k](r),key=q.q+'|'+q.o.join('|');if(!seen.has(key)){seen.add(key);out.push(q)}};
 const lk=P.find(k=>k.startsWith('listen'));if(lk)add(lk);
 for(let n=0;n<400&&out.length<10;n++)add(sRnd(r,P));
 return sShuf(r,out)}

/* quiz screens */
let qs=[],qi=0,sc=0,wr=[];
function showLevels(){$('qBox').classList.add('hide');$('qR').classList.add('hide');$('qIntro').classList.remove('hide');const g=$('lvls');g.innerHTML='';
 LV.forEach((v,i)=>{const l=i+1,s=QS[l]||{},ps=s.best>=PASS;
  const b=el('button',`<span class="lvn">${l}</span><span class="lvt"><b>Level ${l}</b><small>${v.t}</small></span><span class="lvd">${v.d}</span><span class="lvb">${s.best==null?'Not played yet':(ps?'Passed. Best ':'Best ')+s.best+' / 10'}</span>`,'lv '+v.t.toLowerCase()+(ps?' pass':''));
  b.onclick=()=>startQuiz(l);g.append(b)})}
function startQuiz(l){ql=l;qs=quizFor(l);qi=0;sc=0;wr=[];$('qIntro').classList.add('hide');$('qR').classList.add('hide');$('qBox').classList.remove('hide');showQ()}
function showQ(){const q=qs[qi];$('qn').textContent=`Level ${ql} (${LV[ql-1].t}) · Question ${qi+1} of ${qs.length} · Set for class number ${user.no}`;$('qp').style.width=qi/qs.length*100+'%';
 $('qt').textContent=q.q;$('qf').textContent='';$('qx').classList.add('hide');$('qx').textContent=qi===qs.length-1?'See results':'Next question';
 $('qa').innerHTML='';if(q.say){const b=el('button','Play word','btn pri');b.onclick=()=>say(q.say,.8);$('qa').append(b);say(q.say,.8)}
 const o=$('qo');o.innerHTML='';
 shuf(q.o.map((t,j)=>({t,c:j===q.a}))).forEach((x,n)=>{const b=el('button','','opt');b.style.setProperty('--i',n);b.textContent=x.t;b.onclick=()=>{
  [...o.children].forEach(y=>y.disabled=true);
  if(x.c){sc++;b.classList.add('ok')}else{b.classList.add('no');wr.push(q);[...o.children].forEach(y=>{if(y.textContent===q.o[q.a])y.classList.add('ok')})}
  $('qf').textContent=(x.c?'Correct. ':'Not quite. ')+q.x;$('qx').classList.remove('hide')};o.append(b)})}
$('qx').onclick=()=>{qi++;qi<qs.length?showQ():finishQuiz()};
function finishQuiz(){$('qBox').classList.add('hide');$('qR').classList.remove('hide');
 const s=QS[ql]||(QS[ql]={});s.best=Math.max(s.best==null?0:s.best,sc);s.att=(s.att||0)+1;sv('qLv',QS);best=Math.max(best,sc);sv('best',best);
 logEvent('quiz',{level:ql,score:sc,total:qs.length,explored:recd.size});
 $('rn').textContent=`${user.n} (class number ${user.no}), Level ${ql} ${LV[ql-1].t}`;$('rs').textContent=`${sc} / ${qs.length}`;
 if(sc>=PASS)burst();
 $('rm').textContent=sc>=PASS?(ql<5?'🎉 Level passed! Level '+(ql+1)+' is ready when you are.':'🏆 Level passed! You finished every level.'):'Not passed yet. You need '+PASS+' correct. Review the answers below and try again: you get a new set of questions.';
 $('qNext').classList.toggle('hide',ql>=5);
 $('rw').innerHTML=wr.length?'<h3>Review</h3>'+wr.map(q=>`<p><b>${q.q}</b><br>${q.x}</p>`).join(''):''}

/* escape room: every class number gets its own puzzles and PIN */
let escS={pc:0,safe:0,radio:0,poster:0},EP=null;
function escPuz(){const r=mulberry32(seedOf(7777));
 const dg=[0,0,0,0].map(()=>Math.floor(r()*10));
 const L=CONS.filter(x=>!NOFIRST.includes(x.s)),fc=sRnd(r,L);
 const po=sShuf(r,[fc.s,...pickN(r,L.filter(y=>y!==fc&&!(COMP[fc.s]||[]).includes(y.s)),2).map(y=>y.s)]);
 const sf=sRnd(r,ESC_D),pr=sRnd(r,PAIRS),rw=r()<.5?pr.x:pr.y;
 const ro=sShuf(r,[pr.x,pr.y,sRnd(r,PAIRS.flatMap(z=>[z.x,z.y]).filter(z=>z!==pr.x&&z!==pr.y))]);
 const T=[['Monophthongs minus Diphthongs',4],['Consonants minus Diphthongs',16],['Consonants minus Monophthongs',12],['Monophthongs plus Diphthongs',20],['Consonants divided by Diphthongs',3],['Consonants divided by Monophthongs',2]];
 const t=sRnd(r,T),n=1+Math.floor(r()*9),pa=t[1]+n;
 const pop=sShuf(r,[pa,...pickN(r,[-3,-2,-1,1,2,3].map(d=>pa+d).filter(v=>v>0),2)]).map(String);
 return{dg,fc,po,sf,rw,ro,pq:`${t[0]}, then add ${n}`,pa:String(pa),pop}}
function renderEscape(){
 $('escIntro').classList.remove('hide');
 $('escGame').classList.add('hide');
 $('escDialog').classList.add('hide');
}
function escTap(id){const P=EP||(EP=escPuz()),d=$('escDialog');d.classList.remove('hide');let h='';
 const inp='style="padding:10px;margin:12px 0;border-radius:8px;border:1px solid var(--bd);background:var(--bg);color:var(--tx)"';
 if(id==='door'){
  h=`<h3>🚪 Main Door</h3><p>The door is locked with a digital keypad. Collect the 4 digits from the computer, safe, radio and poster, in that order.</p>
   <input id="escPin" type="text" inputmode="numeric" maxlength="4" placeholder="4-digit PIN" style="padding:10px;margin:12px 0;width:100%;max-width:220px;border-radius:8px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);font-size:1.2rem;letter-spacing:4px">
   <br><button class="btn pri" onclick="escCheckPin()">Unlock Door</button> <p class="msg" id="escPinMsg" style="margin-top:10px"></p>`;
 }else if(id==='pc'){
  h=escS.pc?`<h3>💻 Computer</h3><p>Screen unlocked. <b>First digit: ${P.dg[0]}</b></p>`
   :`<h3>💻 Computer</h3><p>Password hint: Which symbol represents the first sound in “${P.fc.w}”?</p>
   <div class="opts">${P.po.map((s,i)=>`<button class="opt" onclick="escCheck('pc',${i})">/${s}/</button>`).join('')}</div>`;
 }else if(id==='safe'){
  h=escS.safe?`<h3>🗄️ Safe</h3><p>Safe opened. <b>Second digit: ${P.dg[1]}</b></p>`
   :`<h3>🗄️ Safe</h3><p>Type the English word for the transcription <b>/${P.sf.t}/</b></p>
   <input id="escSafeAns" type="text" placeholder="Word" ${inp} style="text-transform:lowercase"><br><button class="btn" onclick="escCheck('safe',$('escSafeAns').value.trim().toLowerCase())">Open Safe</button>`;
 }else if(id==='radio'){
  h=escS.radio?`<h3>📻 Radio</h3><p>Tuned in. <b>Third digit: ${P.dg[2]}</b></p>`
   :`<h3>📻 Radio</h3><p>Listen to the static broadcast and identify the word.</p>
   <button class="btn" onclick="say('${P.rw}',0.8)">Play Audio</button>
   <div class="opts" style="margin-top:16px">${P.ro.map((w,i)=>`<button class="opt" onclick="escCheck('radio',${i})">${w}</button>`).join('')}</div>`;
 }else if(id==='poster'){
  h=escS.poster?`<h3>📜 Poster</h3><p>Puzzle solved. <b>Fourth digit: ${P.dg[3]}</b></p>`
   :`<h3>📜 Poster</h3><p>A torn chart reads: Monophthongs = 12, Diphthongs = 8, Consonants = 24. <i>${P.pq}.</i></p>
   <div class="opts">${P.pop.map((v,i)=>`<button class="opt" onclick="escCheck('poster',${i})">${v}</button>`).join('')}</div>`;
 }
 d.innerHTML=h}
function escCheck(id,a){const P=EP;let ok=0;
 if(id==='pc'&&P.po[a]===P.fc.s){escS.pc=ok=1;toast('Correct! You found a clue.')}
 else if(id==='safe'&&a===P.sf.w){escS.safe=ok=1;toast('Safe unlocked!')}
 else if(id==='radio'&&P.ro[a]===P.rw){escS.radio=ok=1;toast('Correct word!')}
 else if(id==='poster'&&P.pop[a]===P.pa){escS.poster=ok=1;toast('Math correct!')}
 if(ok)escTap(id);else toast('Incorrect. Try again!')}
function escCheckPin(){const P=EP||(EP=escPuz());
 if($('escPin').value.trim()===P.dg.join('')){
  escDone=true;sv('escDone',true);
  $('escDialog').innerHTML=`<h3>🎉 You Escaped!</h3><p class="lead">Congratulations ${user.n}! You have successfully used your phonetics knowledge to escape the lab.</p><button class="btn pri" style="margin-top:10px" onclick="go('home')">Return Home</button>`;
  logEvent('escape_room');burst();
 }else{$('escPinMsg').textContent='Wrong PIN. The door remains locked.'}}

/* portfolio */
function renderPort(){
 $('pi').textContent=`${user.n} · Class number ${user.no}`;
 const L=['','Need practice','Getting there','Confident'],c=[0,0,0,0];
 ALL.forEach(x=>c[rate[x.s]||0]++);
 $('ps').innerHTML=`
  <div class="port-grid">
   <div class="port-card"><h3>🎙️ Sounds Recorded</h3><p class="big">${recd.size} <span style="font-size:1.1rem;color:var(--mu)">/ ${ALL.length}</span></p><p class="msg">Confident: ${c[3]} | Practice: ${c[1]}</p></div>
   <div class="port-card"><h3>Quiz Levels</h3><p class="big">${Object.values(QS).filter(s=>s.best>=PASS).length} <span style="font-size:1.1rem;color:var(--mu)">/ 5</span></p><p class="msg">Best scores: ${LV.map((_,i)=>QS[i+1]?QS[i+1].best:'-').join(', ')}</p></div>
   <div class="port-card"><h3>🚪 Escape Room</h3><p class="big" style="font-size:${escDone?'1.4rem':'1.2rem'}; padding-top:10px; color:${escDone?'var(--ok)':'var(--no)'}">${escDone ? '🔓 Unlocked' : '🔒 Locked'}</p><p class="msg">${escDone ? 'Escaped the lab!' : 'Solve puzzles to escape'}</p></div>
  </div>
 `;
 const rated=ALL.filter(x=>rate[x.s]);
 $('pt').innerHTML=rated.length
  ? '<tr><th>Sound</th><th>Example</th><th>Self-assessment</th></tr>'+rated.map(x=>`<tr><td>/${x.s}/</td><td>${x.w}</td><td>${L[rate[x.s]]}</td></tr>`).join('')
  : `<tr><td colspan="3" style="text-align:center; padding:40px 20px; background:var(--hl); border-radius:12px; border:2px dashed var(--p); border-bottom: none;">
      <b style="font-size:1.3rem; color:var(--p2)">⚠️ Your Portfolio is Empty!</b><br><br>
      <span style="color:var(--tx); line-height:1.6">You haven't evaluated your pronunciation yet.<br>To build your portfolio and track your progress:</span><br><br>
      <span style="color:var(--mu); font-size:0.95rem">1. Go to the <b>📚 Sounds</b> section.<br>2. Tap on any sound card and listen.<br>3. Rate yourself using <b>Need practice</b>, <b>Getting there</b>, or <b>Confident</b>.</span>
     </td></tr>`;
}

/* areas: Materials, Games and Portfolio live in separate places */
const AREAS=[['home','Home',['home']],['mat','Materials',['history','learn','chart','pairs']],['games','Games',['cards','quiz','escape']],['port','Portfolio',['port']]];
const LBL={home:'Welcome',history:'History',learn:'Sounds',chart:'Vowel Chart',pairs:'Minimal Pairs',cards:'Flashcards',quiz:'Quiz',escape:'Escape Room',port:'Portfolio'};
function renderHome(){renderPath();const s=$('sg');if(!s.children.length)for(let i=0;i<44;i++){const b=el('i');b.style.setProperty('--h',(18+Math.abs(Math.sin(i*.5)*58+Math.sin(i*1.9)*22))+'%');b.style.setProperty('--i',i);s.append(b)}}
/* step-by-step tour, shown once and always skippable */
const TUT=[
['ə','Welcome to the lab','This short tour shows how the module works. It takes about a minute, and you can skip it at any time.'],
['iː','Start in Materials','Open Materials to read the history of phonetics, then learn the 44 English sounds on the Sounds page.'],
['ɪ','Tap a sound card','Each card plays an example word and shows a tip for shaping your mouth. Use Slow to hear it again more clearly.'],
['ɔː','Record yourself','Press Record yourself, say the word, then compare your voice with the model. Record all the sounds in a group to complete it.'],
['ʊ','Rate your confidence','Choose Need practice, Getting there or Confident. Your ratings fill your Portfolio.'],
['æ','Play the games','Open Games for Flashcards, a five-level Quiz and an Escape Room. Your quiz questions depend on your class number, so every student gets a different set.'],
['ʃ','Download your portfolio','Open Portfolio to see your progress, print it as a PDF or download it as a CSV file. Press Help in the menu to see this tour again.']];
function tour(i){const d=$('tut'),s=TUT[i],last=i===TUT.length-1;if(!d.open)d.showModal();
 $('tG').textContent='/'+s[0]+'/';$('tS').textContent=`Step ${i+1} of ${TUT.length}`;$('tT').textContent=s[1];$('tP').textContent=s[2];
 $('tB').classList.toggle('hide',i===0);$('tK').classList.toggle('hide',last);$('tN').textContent=last?'Start learning':'Next';
 $('tB').onclick=()=>tour(i-1);$('tN').onclick=()=>last?d.close():tour(i+1)}
$('tut').onclose=()=>{sv('tutDone',true)};
function dlCSV(){const L=['Not rated','Need practice','Getting there','Confident'],q=c=>'"'+String(c).replace(/"/g,'""')+'"';
 const rows=[['Sound','Example','Type','Recorded','Self-assessment'],...ALL.map(x=>[x.s,x.w,x.k,recd.has(x.s)?'yes':'no',L[rate[x.s]||0]])];
 const u=URL.createObjectURL(new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'})),a=el('a');
 a.href=u;a.download=`portfolio-${user.no}-${user.n.replace(/\W+/g,'-')}.csv`;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(u);logEvent('download')}

function menuSet(c){$('app').classList.toggle('collapsed',c);$('menuBtn').setAttribute('aria-expanded',String(!c));sv('menuC',c)}
$('menuBtn').onclick=()=>menuSet(!$('app').classList.contains('collapsed'));
if(user)enter();
