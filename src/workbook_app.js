(function () {
'use strict';

const root = document.getElementById('app');
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BOOK = BOOKS[0];

const LANGS = { en:'English', zh:'中文（普通话）', yue:'廣東話', es:'Español', fr:'Français' };
const UI = {
  en:{trainer:'Tactics Trainer',logout:'Log out',login:'Log in',signup:'Sign up',welcome:'Welcome back!',loginSub:'Log in to continue your training.',username:'Username',password:'Password',newHere:'New here?',create:'Create an account',createTitle:'Create your account',createSub:'It takes less than a minute.',firstName:'Your first name',userHint:'Letters, numbers, dots or dashes. At least 3 characters.',passHint:'At least 6 characters.',already:'Already have an account?',hero:'Learn directly from The Chess Academy workbooks on an interactive board.',yourMove:'Your move!',choose:'Choose how you want to train',chooseSub:'Books and video courses live in one place.',books:'Tactics Books',booksEyebrow:'Interactive workbook',booksDesc:'Study the lessons and complete every exercise from White Pawn.',openBooks:'Open books',courses:'Video Courses',coursesEyebrow:'Lessons & series',coursesDesc:'Structured video learning from The Chess Academy coaches.',soon:'Coming soon',backHome:'Back to home',coursesSoon:'Video courses are coming soon',coursesSoonSub:'This section is ready. Courses will appear here as soon as they are published.',myBooks:'My books',openBook:'Open book',chapters:'chapters',exercises:'exercises',chapter:'Chapter',lesson:'Lesson',theory:'Key ideas',examples:'Examples from the book',practice:'Practice',start:'Start',continue:'Continue',solved:'solved',notStarted:'not started',toReview:'to review',page:'Workbook page',exercise:'Exercise',check:'Check answer',show:'Show book answer',reset:'Reset',previous:'Previous',next:'Next exercise',chapterOverview:'Chapter overview',correct:'Correct!',answer:'Book answer',tryAgain:'Try again.',selectSquares:'Select the required squares on the board.',selectMove:'Select the piece, then its destination.',selectGuard:'Now select the piece that guards the queen.',promotion:'Choose the promotion piece',yes:'YES',no:'NO',none:'NONE',kingside:'Kingside',queenside:'Queenside',neither:'Neither',ok:'OK',colors:'Board colours are reversed',size:'Board is 9 × 9',checkLabel:'CHECK',mate:'CHECKMATE',stalemate:'STALEMATE',notExample:'That is not the example in the book answer key. Other moves can sometimes satisfy the exercise, so compare your idea with the book answer.',sourceNote:'For one-move tasks, the workbook answer key gives one possible answer; another move can also be correct if it meets the rule.',done:'Done',bookOriginal:'White Pawn · Level 1 · Volume 1'},
  es:{trainer:'Entrenador de táctica',logout:'Cerrar sesión',login:'Iniciar sesión',signup:'Registrarse',welcome:'¡Bienvenido de nuevo!',loginSub:'Inicia sesión para continuar entrenando.',username:'Usuario',password:'Contraseña',newHere:'¿Eres nuevo?',create:'Crear una cuenta',createTitle:'Crea tu cuenta',createSub:'Tardarás menos de un minuto.',firstName:'Tu nombre',userHint:'Letras, números, puntos o guiones. Mínimo 3 caracteres.',passHint:'Mínimo 6 caracteres.',already:'¿Ya tienes una cuenta?',hero:'Aprende directamente con los libros de The Chess Academy en un tablero interactivo.',yourMove:'¡Tu turno!',choose:'Elige cómo quieres entrenar',chooseSub:'Libros y cursos en vídeo, todo en un mismo sitio.',books:'Libros de táctica',booksEyebrow:'Libro interactivo',booksDesc:'Estudia las lecciones y completa todos los ejercicios de White Pawn.',openBooks:'Abrir libros',courses:'Cursos en vídeo',coursesEyebrow:'Clases y series',coursesDesc:'Aprendizaje en vídeo estructurado por los entrenadores de The Chess Academy.',soon:'Próximamente',backHome:'Volver al inicio',coursesSoon:'Los cursos en vídeo llegarán pronto',coursesSoonSub:'Esta sección ya está preparada. Los cursos aparecerán aquí cuando se publiquen.',myBooks:'Mis libros',openBook:'Abrir libro',chapters:'capítulos',exercises:'ejercicios',chapter:'Capítulo',lesson:'Lección',theory:'Ideas clave',examples:'Ejemplos del libro',practice:'Práctica',start:'Empezar',continue:'Continuar',solved:'resueltos',notStarted:'sin empezar',toReview:'por revisar',page:'Página del libro',exercise:'Ejercicio',check:'Comprobar',show:'Ver respuesta del libro',reset:'Reiniciar',previous:'Anterior',next:'Siguiente ejercicio',chapterOverview:'Resumen del capítulo',correct:'¡Correcto!',answer:'Respuesta del libro',tryAgain:'Inténtalo de nuevo.',selectSquares:'Selecciona las casillas necesarias en el tablero.',selectMove:'Selecciona la pieza y después la casilla de destino.',selectGuard:'Ahora selecciona la pieza que protege a la dama.',promotion:'Elige la pieza de promoción',yes:'SÍ',no:'NO',none:'NINGUNO',kingside:'Enroque corto',queenside:'Enroque largo',neither:'Ninguno',ok:'OK',colors:'Los colores del tablero están invertidos',size:'El tablero es de 9 × 9',checkLabel:'JAQUE',mate:'JAQUE MATE',stalemate:'AHOGADO',notExample:'No coincide con el ejemplo del solucionario. En algunos ejercicios puede haber otras jugadas válidas; compara tu idea con la respuesta del libro.',sourceNote:'En los ejercicios de una jugada, el solucionario muestra una respuesta posible; otra también puede ser correcta si cumple la regla.',done:'Hecho',bookOriginal:'White Pawn · Nivel 1 · Volumen 1'},
  fr:{trainer:'Entraîneur tactique',logout:'Se déconnecter',login:'Se connecter',signup:'Créer un compte',welcome:'Bon retour !',loginSub:'Connectez-vous pour continuer votre entraînement.',username:'Nom d’utilisateur',password:'Mot de passe',newHere:'Nouveau ici ?',create:'Créer un compte',createTitle:'Créez votre compte',createSub:'Cela prend moins d’une minute.',firstName:'Votre prénom',userHint:'Lettres, chiffres, points ou tirets. Au moins 3 caractères.',passHint:'Au moins 6 caractères.',already:'Vous avez déjà un compte ?',hero:'Apprenez directement avec les cahiers The Chess Academy sur un échiquier interactif.',yourMove:'À vous de jouer !',choose:'Choisissez votre façon de vous entraîner',chooseSub:'Livres et cours vidéo réunis au même endroit.',books:'Livres de tactique',booksEyebrow:'Cahier interactif',booksDesc:'Étudiez les leçons et réalisez tous les exercices de White Pawn.',openBooks:'Ouvrir les livres',courses:'Cours vidéo',coursesEyebrow:'Leçons et séries',coursesDesc:'Un apprentissage vidéo structuré par les entraîneurs de The Chess Academy.',soon:'Bientôt disponible',backHome:'Retour à l’accueil',coursesSoon:'Les cours vidéo arrivent bientôt',coursesSoonSub:'Cette section est prête. Les cours apparaîtront ici dès leur publication.',myBooks:'Mes livres',openBook:'Ouvrir le livre',chapters:'chapitres',exercises:'exercices',chapter:'Chapitre',lesson:'Leçon',theory:'Idées clés',examples:'Exemples du livre',practice:'Pratique',start:'Commencer',continue:'Continuer',solved:'résolus',notStarted:'pas commencés',toReview:'à revoir',page:'Page du cahier',exercise:'Exercice',check:'Vérifier',show:'Voir la réponse du livre',reset:'Recommencer',previous:'Précédent',next:'Exercice suivant',chapterOverview:'Vue du chapitre',correct:'Correct !',answer:'Réponse du livre',tryAgain:'Réessayez.',selectSquares:'Sélectionnez les cases demandées sur l’échiquier.',selectMove:'Sélectionnez la pièce puis sa case de destination.',selectGuard:'Sélectionnez maintenant la pièce qui protège la dame.',promotion:'Choisissez la pièce de promotion',yes:'OUI',no:'NON',none:'AUCUN',kingside:'Petit roque',queenside:'Grand roque',neither:'Aucun',ok:'OK',colors:'Les couleurs de l’échiquier sont inversées',size:'L’échiquier fait 9 × 9',checkLabel:'ÉCHEC',mate:'ÉCHEC ET MAT',stalemate:'PAT',notExample:'Ce coup ne correspond pas à l’exemple du corrigé. Certains exercices admettent d’autres solutions valides : comparez votre idée avec la réponse du livre.',sourceNote:'Pour les exercices en un coup, le corrigé donne une réponse possible ; un autre coup peut être correct s’il respecte la consigne.',done:'Terminé',bookOriginal:'White Pawn · Niveau 1 · Volume 1'},
  zh:{trainer:'战术训练器',logout:'退出登录',login:'登录',signup:'注册',welcome:'欢迎回来！',loginSub:'登录后继续训练。',username:'用户名',password:'密码',newHere:'第一次来？',create:'创建账户',createTitle:'创建账户',createSub:'不到一分钟即可完成。',firstName:'名字',userHint:'可使用字母、数字、点或短横线，至少 3 个字符。',passHint:'至少 6 个字符。',already:'已经有账户？',hero:'在互动棋盘上直接学习 The Chess Academy 练习册。',yourMove:'轮到你了！',choose:'选择你的训练方式',chooseSub:'练习册和视频课程都集中在这里。',books:'战术练习册',booksEyebrow:'互动练习册',booksDesc:'学习课程并完成 White Pawn 的全部练习。',openBooks:'打开练习册',courses:'视频课程',coursesEyebrow:'课程与系列',coursesDesc:'由 The Chess Academy 教练提供的系统视频课程。',soon:'即将推出',backHome:'返回主页',coursesSoon:'视频课程即将推出',coursesSoonSub:'此区域已准备好，课程发布后会显示在这里。',myBooks:'我的练习册',openBook:'打开练习册',chapters:'章节',exercises:'练习',chapter:'章节',lesson:'课程',theory:'关键知识',examples:'书中示例',practice:'练习',start:'开始',continue:'继续',solved:'已完成',notStarted:'未开始',toReview:'待复习',page:'书本页码',exercise:'练习',check:'检查答案',show:'查看书本答案',reset:'重置',previous:'上一个',next:'下一题',chapterOverview:'章节总览',correct:'正确！',answer:'书本答案',tryAgain:'再试一次。',selectSquares:'在棋盘上选择所需的格子。',selectMove:'先选择棋子，再选择目标格。',selectGuard:'现在选择保护皇后的棋子。',promotion:'选择升变棋子',yes:'是',no:'否',none:'无',kingside:'王翼易位',queenside:'后翼易位',neither:'都不可以',ok:'正确摆放',colors:'棋盘颜色颠倒',size:'棋盘是 9 × 9',checkLabel:'将军',mate:'将死',stalemate:'逼和',notExample:'这与答案册中的示例不同。有些练习可能有其他有效答案，请将你的想法与书本答案比较。',sourceNote:'对于一步题，答案册给出的是一种可行答案；如果符合题目规则，其他走法也可能正确。',done:'完成',bookOriginal:'White Pawn · 1级 · 第1册'},
  yue:{trainer:'戰術訓練器',logout:'登出',login:'登入',signup:'註冊',welcome:'歡迎返嚟！',loginSub:'登入之後繼續訓練。',username:'用戶名',password:'密碼',newHere:'第一次嚟？',create:'建立帳戶',createTitle:'建立帳戶',createSub:'唔使一分鐘就搞掂。',firstName:'名字',userHint:'可以用英文字母、數字、點或橫線，最少 3 個字元。',passHint:'最少 6 個字元。',already:'已經有帳戶？',hero:'喺互動棋盤直接學 The Chess Academy 練習冊。',yourMove:'到你行！',choose:'揀你想點樣訓練',chooseSub:'練習冊同影片課程都喺同一個地方。',books:'戰術練習冊',booksEyebrow:'互動練習冊',booksDesc:'學習課堂並完成 White Pawn 所有練習。',openBooks:'打開練習冊',courses:'影片課程',coursesEyebrow:'課堂同系列',coursesDesc:'由 The Chess Academy 教練提供有系統嘅影片課程。',soon:'即將推出',backHome:'返主頁',coursesSoon:'影片課程即將推出',coursesSoonSub:'呢個區域已準備好，課程推出後就會顯示。',myBooks:'我嘅練習冊',openBook:'打開練習冊',chapters:'章節',exercises:'練習',chapter:'章節',lesson:'課堂',theory:'重點知識',examples:'書中例子',practice:'練習',start:'開始',continue:'繼續',solved:'已完成',notStarted:'未開始',toReview:'要重溫',page:'書本頁碼',exercise:'練習',check:'檢查答案',show:'睇書本答案',reset:'重設',previous:'上一題',next:'下一題',chapterOverview:'章節總覽',correct:'啱！',answer:'書本答案',tryAgain:'再試。',selectSquares:'喺棋盤揀需要嘅格。',selectMove:'先揀棋子，再揀目的地。',selectGuard:'而家揀保護皇后嘅棋子。',promotion:'揀升變棋子',yes:'係',no:'唔係',none:'冇',kingside:'王翼易位',queenside:'后翼易位',neither:'兩邊都唔得',ok:'正確擺位',colors:'棋盤顏色倒轉咗',size:'棋盤係 9 × 9',checkLabel:'將軍',mate:'將死',stalemate:'逼和',notExample:'呢步唔同答案冊嘅示例。有啲練習可能有其他正確答案，請同書本答案比較。',sourceNote:'一步題答案冊只畀一個可行答案；如果符合題目規則，其他走法都可能啱。',done:'完成',bookOriginal:'White Pawn · 第1級 · 第1冊'}
};
let lang = (() => { try { return localStorage.getItem('tca.lang') || 'en'; } catch { return 'en'; } })();
const t = k => (UI[lang] && UI[lang][k]) || UI.en[k] || k;
function langSelect(id='lang'){ return '<select class="lang-select" id="'+id+'" aria-label="Language">'+Object.entries(LANGS).map(([k,v])=>'<option value="'+k+'"'+(lang===k?' selected':'')+'>'+v+'</option>').join('')+'</select>'; }
function bindLang(){
  $$('.lang-select').forEach(s => s.onchange = () => { lang=s.value; try{localStorage.setItem('tca.lang',lang)}catch{} render(); });
}

const Store = (() => {
  const get = k => { try { const v=localStorage.getItem(k); return v==null?null:JSON.parse(v); } catch { return null; } };
  const set = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };
  const del = k => { try { localStorage.removeItem(k); } catch {} };
  return {get,set,del};
})();
async function api(path, body){
  const r=await fetch(path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,credentials:'same-origin',cache:'no-store'});
  const d=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(d.error||'Something went wrong. Please try again.');
  return d;
}
const Auth={
  user:null,
  current(){return this.user;},
  async restore(){try{this.user=(await api('/api/me')).user;}catch{this.user=null;}},
  async register(name,username,password){this.user=(await api('/api/register',{name,username,password})).user;},
  async login(username,password){this.user=(await api('/api/login',{username,password})).user;},
  async logout(){this.user=null; try{await api('/api/logout',{});}catch{}}
};
function progress(){
  const u=Auth.current(); if(!u) return {};
  return Store.get('tca.wp1.'+u.key)||{};
}
function saveProgress(p){ const u=Auth.current(); if(u) Store.set('tca.wp1.'+u.key,p); }
function rec(id){ return progress()[id]||null; }
function mark(id,status){ const p=progress(); p[id]={s:status,at:Date.now()}; saveProgress(p); }
const keyOf=id=>'wp1-'+String(id).padStart(3,'0');

const ALL=[];
BOOK.ch.forEach((ch,ci)=>ch.practice.forEach((pg,pi)=>pg.exercises.forEach((ex,ei)=>ALL.push(Object.assign({ci,pi,ei,type:pg.type,instruction:pg.instruction,page:pg.page},ex)))));
const BY_ID=Object.fromEntries(ALL.map(x=>[x.id,x]));
const chapterExercises=ci=>ALL.filter(x=>x.ci===ci);
function stat(list){
  let c=0,w=0; list.forEach(x=>{const r=rec(keyOf(x.id)); if(r?.s==='c')c++; else if(r?.s==='w')w++;});
  return {c,w,u:list.length-c-w,total:list.length,pct:list.length?Math.round(100*c/list.length):0};
}

function shell(inner){
  const u=Auth.current();
  return '<header class="topbar"><div class="topbar-in">'+
    '<a href="#/home" class="logo-sticker"><img src="'+LOGO+'" alt="The Chess Academy"></a>'+
    '<span class="prod">'+esc(t('trainer'))+'</span><span class="spacer"></span>'+langSelect()+
    '<div class="user-pill"><span class="avatar">'+esc((u?.name||'?')[0].toUpperCase())+'</span><span class="nm">'+esc(u?.name||'')+'</span><button class="btn white" id="logout">'+esc(t('logout'))+'</button></div>'+
    '</div></header><div class="checker"></div><main class="wrap">'+inner+'</main>';
}
function bindShell(){
  bindLang();
  const b=$('#logout'); if(b)b.onclick=async()=>{await Auth.logout(); location.hash='#/login';};
}
function go(h){ if(location.hash===h) render(); else location.hash=h; }
window.addEventListener('hashchange',render);

function renderAuth(mode){
  const demo=BY_ID[193];
  root.innerHTML='<div class="auth"><div class="auth-lang">'+langSelect('authLang')+'</div>'+
    '<section class="auth-hero"><span class="logo-sticker"><img src="'+LOGO+'" alt="The Chess Academy"></span><h1>Tactics<span>Trainer</span></h1>'+
    '<p class="lead">'+esc(t('hero'))+'</p><div class="hero-board-wrap"><span class="bubble">'+esc(t('yourMove'))+'</span>'+boardHtml(demo,false)+'</div></section>'+
    '<section class="auth-side"><div class="card auth-card"><div class="tabs"><button data-mode="login" aria-selected="'+(mode==='login')+'">'+esc(t('login'))+'</button><button data-mode="signup" aria-selected="'+(mode==='signup')+'">'+esc(t('signup'))+'</button></div>'+
    (mode==='login'
      ?'<h2>'+esc(t('welcome'))+'</h2><p class="sub">'+esc(t('loginSub'))+'</p><form id="authForm"><div id="err"></div><div class="field"><label>'+esc(t('username'))+'</label><input id="u" autocomplete="username" required></div><div class="field"><label>'+esc(t('password'))+'</label><input id="p" type="password" autocomplete="current-password" required></div><button class="btn block">'+esc(t('login'))+'</button></form><p style="margin-top:16px;text-align:center;font-weight:700">'+esc(t('newHere'))+' <button class="link" data-mode="signup">'+esc(t('create'))+'</button></p>'
      :'<h2>'+esc(t('createTitle'))+'</h2><p class="sub">'+esc(t('createSub'))+'</p><form id="authForm"><div id="err"></div><div class="field"><label>'+esc(t('firstName'))+'</label><input id="n" autocomplete="given-name" required></div><div class="field"><label>'+esc(t('username'))+'</label><input id="u" autocomplete="username" required><span class="hint">'+esc(t('userHint'))+'</span></div><div class="field"><label>'+esc(t('password'))+'</label><input id="p" type="password" autocomplete="new-password" required><span class="hint">'+esc(t('passHint'))+'</span></div><button class="btn block">'+esc(t('create'))+'</button></form><p style="margin-top:16px;text-align:center;font-weight:700">'+esc(t('already'))+' <button class="link" data-mode="login">'+esc(t('login'))+'</button></p>')+
    '</div></section><div class="auth-floor"></div></div>';
  bindLang();
  $$('[data-mode]').forEach(b=>b.onclick=()=>go('#/'+b.dataset.mode));
  $('#authForm').onsubmit=async e=>{
    e.preventDefault(); const u=$('#u').value.trim(),p=$('#p').value; const err=$('#err');
    try{
      if(mode==='signup'){
        const n=$('#n').value.trim();
        if(!n) throw new Error('Enter your first name.');
        if(!/^[A-Za-z0-9._-]{3,24}$/.test(u)) throw new Error('Usernames need 3 to 24 letters, numbers, dots or dashes.');
        if(p.length<6) throw new Error('Your password needs at least 6 characters.');
        await Auth.register(n,u,p);
      }else{
        if(!u||!p) throw new Error('Enter your username and password.');
        await Auth.login(u,p);
      }
      go('#/home');
    }catch(x){err.innerHTML='<div class="form-error">'+esc(x.message)+'</div>';}
  };
}
function renderHome(){
  root.innerHTML=shell('<section class="hub-head"><h1>'+esc(t('choose'))+'</h1><p>'+esc(t('chooseSub'))+'</p></section>'+
  '<div class="hub-grid"><a class="card hub-card books" href="#/library"><span class="eyebrow">'+esc(t('booksEyebrow'))+'</span><h2>'+esc(t('books'))+'</h2><p>'+esc(t('booksDesc'))+'</p><span class="soon-pill">'+esc(t('openBooks'))+'</span><span class="hub-icon">♟️</span></a>'+
  '<a class="card hub-card courses" href="#/courses"><span class="eyebrow">'+esc(t('coursesEyebrow'))+'</span><h2>'+esc(t('courses'))+'</h2><p>'+esc(t('coursesDesc'))+'</p><span class="soon-pill">'+esc(t('soon'))+'</span><span class="hub-icon">▶️</span></a></div>');
  bindShell();
}
function renderCourses(){
  root.innerHTML=shell('<nav class="crumbs"><a href="#/home">'+esc(t('backHome'))+'</a><span class="sep">/</span><span>'+esc(t('courses'))+'</span></nav>'+
    '<section class="card empty-courses"><div class="big">🎬</div><h1>'+esc(t('coursesSoon'))+'</h1><p>'+esc(t('coursesSoonSub'))+'</p><a class="btn" href="#/home">'+esc(t('backHome'))+'</a></section>');
  bindShell();
}
function renderLibrary(){
  const s=stat(ALL);
  root.innerHTML=shell('<nav class="crumbs"><a href="#/home">'+esc(t('backHome'))+'</a><span class="sep">/</span><span>'+esc(t('myBooks'))+'</span></nav>'+
    '<div class="section-h"><h1>'+esc(t('myBooks'))+'</h1></div>'+
    '<div class="wp-library"><article class="card wp-book-card"><div class="wp-cover"><div class="wp-cover-kicker">THE LEVEL SYSTEM</div><div class="wp-cover-title">WHITE<br>PAWN</div><div class="wp-cover-rule"></div><div class="wp-cover-level">'+esc(t('bookOriginal'))+'</div><div class="wp-cover-piece">'+pieceSVG('P')+'</div></div>'+
    '<div class="wp-book-info"><span class="badge prog">LEVEL 1 · VOLUME 1</span><h2>White Pawn</h2><p>'+esc(BOOK.description)+'</p><div class="wp-metrics"><b>300</b> '+esc(t('exercises'))+' · <b>10</b> '+esc(t('chapters'))+'</div>'+progressBar(s)+
    '<a class="btn mint" href="#/book/1">'+esc(s.c||s.w?t('continue'):t('openBook'))+'</a></div></article></div>');
  bindShell();
}
function progressBar(s){
  return '<div class="wp-progress"><div class="wp-progress-track"><i style="width:'+s.pct+'%"></i></div><div class="wp-progress-meta"><span>'+s.c+' '+esc(t('solved'))+'</span><span>'+s.pct+'%</span></div></div>';
}
function renderBook(){
  const cards=BOOK.ch.map((ch,ci)=>{
    const list=chapterExercises(ci),s=stat(list);
    return '<a class="card wp-chapter-card" href="#/book/1/ch/'+ci+'"><span class="wp-ch-num">'+String(ci+1).padStart(2,'0')+'</span><div><span class="mini-label">'+esc(t('chapter'))+' '+(ci+1)+'</span><h2>'+esc(ch.title)+'</h2><p>'+esc(ch.subtitle)+'</p><div class="wp-ch-meta">'+list.length+' '+esc(t('exercises'))+' · '+s.c+' '+esc(t('solved'))+'</div>'+progressBar(s)+'</div><span class="wp-arrow">›</span></a>';
  }).join('');
  root.innerHTML=shell('<nav class="crumbs"><a href="#/library">'+esc(t('myBooks'))+'</a><span class="sep">/</span><span>White Pawn</span></nav>'+
    '<section class="wp-book-head"><div><span class="badge prog">LEVEL 1 · VOLUME 1</span><h1>White Pawn</h1><p>'+esc(BOOK.description)+'</p></div><div class="wp-big-pawn">'+pieceSVG('P')+'</div></section>'+
    '<div class="wp-journey"><h2>Your White Pawn journey</h2><p>One idea at a time. Every practice page holds twelve diagrams.</p></div><div class="wp-chapters">'+cards+'</div>');
  bindShell();
}
function renderChapter(ci){
  const ch=BOOK.ch[ci]; if(!ch)return go('#/book/1');
  const theory='<section class="card wp-theory"><div class="wp-theory-head"><span class="mini-label">'+esc(t('lesson'))+'</span><h2>'+esc(ch.title)+'</h2><p>'+esc(ch.subtitle)+'</p></div><div class="wp-theory-body"><h3>'+esc(t('theory'))+'</h3><ul>'+ch.theory.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
    (ch.examples?.length?'<h3>'+esc(t('examples'))+'</h3><div class="wp-example-grid">'+pairExamples(ch.examples)+'</div>':'')+'</div></section>';
  const pages=ch.practice.map(pg=>{
    const s=stat(pg.exercises);
    return '<section class="card wp-practice"><div class="wp-practice-head"><div><span class="mini-label">'+esc(t('page'))+' '+pg.page+'</span><h3>'+esc(pg.instruction)+'</h3></div><span class="badge">'+s.c+'/'+s.total+'</span></div><div class="wp-ex-grid">'+pg.exercises.map(ex=>exerciseTile(ex)).join('')+'</div></section>';
  }).join('');
  root.innerHTML=shell('<nav class="crumbs"><a href="#/library">'+esc(t('myBooks'))+'</a><span class="sep">/</span><a href="#/book/1">White Pawn</a><span class="sep">/</span><span>'+esc(t('chapter'))+' '+(ci+1)+'</span></nav>'+
    '<header class="wp-chapter-head"><span class="wp-ch-num">'+String(ci+1).padStart(2,'0')+'</span><div><span class="mini-label">'+esc(t('chapter'))+' '+(ci+1)+'</span><h1>'+esc(ch.title)+'</h1><p>'+esc(ch.subtitle)+'</p></div></header>'+theory+'<div class="section-h"><h2>'+esc(t('practice'))+'</h2></div>'+pages);
  bindShell();
}
function pairExamples(a){
  let h=''; for(let i=0;i<a.length;i+=2)h+='<div class="wp-example"><b>'+esc(a[i]||'')+'</b><p>'+esc(a[i+1]||'')+'</p></div>'; return h;
}
function exerciseTile(ex){
  const r=rec(keyOf(ex.id));
  return '<a href="#/play/'+ex.id+'" class="wp-ex-tile '+(r?.s||'')+'"><span>'+String(ex.id).padStart(3,'0')+'</span>'+(r?.s==='c'?'<b>✓</b>':r?.s==='w'?'<b>↻</b>':'')+'</a>';
}

function parseFen(fen){
  const map={}; if(!fen)return map;
  const rows=fen.split(' ')[0].split('/');
  rows.forEach((row,ri)=>{let f=0; for(const c of row){if(/\d/.test(c)){f+=+c;}else{map['abcdefgh'[f]+(8-ri)]=c;f++;}}});
  return map;
}
function pieceSVG(p){ return PIECES[p]||''; }
function boardHtml(ex,interactive=true,sel=[]){
  const n=ex.size||8, files='abcdefghi'.slice(0,n), map=ex.size===9?(ex.pieces||{}):parseFen(ex.fen), selected=new Set(sel);
  let h='<div class="wb-board '+(ex.reversedColors?'reversed':'')+'" style="--n:'+n+'">';
  for(let row=n;row>=1;row--)for(let fi=0;fi<n;fi++){
    const sq=files[fi]+row, p=map[sq], dark=((fi+row)%2===1);
    h+='<button type="button" class="wb-sq '+(dark?'d ':'')+(selected.has(sq)?'sel ':'')+((ex.markers||[]).includes(sq)?'marked ':'')+'" data-sq="'+sq+'" '+(!interactive?'tabindex="-1"':'')+'>'+
      (p?'<span class="pc">'+pieceSVG(p)+'</span>':'')+
      (row===1?'<span class="coord file">'+files[fi]+'</span>':'')+(fi===0?'<span class="coord rank">'+row+'</span>':'')+'</button>';
  }
  return h+'</div>';
}
function normalizeMove(s){
  const m=String(s||'').toLowerCase().replace(/\s+/g,'').match(/([a-i][1-9])[x-]([a-i][1-9])(?:=(queen|rook|bishop|knight))?/);
  return m?{from:m[1],to:m[2],promo:m[3]||''}:null;
}
function sameSet(a,b){ const A=[...a].sort(),B=[...b].sort(); return A.length===B.length&&A.every((x,i)=>x===B[i]); }

function renderExercise(id){
  const ex=BY_ID[id]; if(!ex)return go('#/book/1');
  const ch=BOOK.ch[ex.ci], pg=ch.practice[ex.pi], prev=BY_ID[id-1], next=BY_ID[id+1];
  const state={selected:new Set(),from:null,to:null,promo:null,guard:null,special:null,choice:null,revealed:false};
  root.innerHTML=shell('<nav class="crumbs"><a href="#/library">'+esc(t('myBooks'))+'</a><span class="sep">/</span><a href="#/book/1">White Pawn</a><span class="sep">/</span><a href="#/book/1/ch/'+ex.ci+'">'+esc(ch.title)+'</a></nav>'+
    '<div class="wp-play"><div class="wp-board-col"><div id="exerciseBoard">'+boardHtml(ex,true)+'</div><div class="wp-book-page">'+esc(t('page'))+' '+pg.page+' · '+esc(t('exercise'))+' '+String(ex.id).padStart(3,'0')+'</div></div>'+
    '<aside class="card wp-task"><div class="wp-task-top"><span class="count">'+esc(t('exercise'))+' '+String(ex.id).padStart(3,'0')+'</span><span class="badge">'+esc(ex.label||'')+'</span></div>'+
    '<h2>'+esc(ch.title)+'</h2><p class="wp-instruction">'+esc(pg.instruction)+'</p><div class="wp-help" id="help"></div><div id="controls"></div><div id="feedback"></div>'+
    '<div class="wp-task-actions"><button class="btn white sm" id="resetEx">'+esc(t('reset'))+'</button><button class="btn ghost sm" id="showAnswer">'+esc(t('show'))+'</button></div>'+
    '<p class="wp-source-note">'+esc(t('sourceNote'))+'</p><div class="wp-nav">'+(prev?'<a class="btn ghost sm" href="#/play/'+prev.id+'">‹ '+esc(t('previous'))+'</a>':'<span></span>')+
    (next?'<a class="btn ghost sm" href="#/play/'+next.id+'">'+esc(t('next'))+' ›</a>':'<a class="btn ghost sm" href="#/book/1/ch/'+ex.ci+'">'+esc(t('chapterOverview'))+'</a>')+'</div></aside></div>');
  bindShell();

  const boardWrap=$('#exerciseBoard'), controls=$('#controls'), help=$('#help'), fb=$('#feedback');
  function paintBoard(){ boardWrap.innerHTML=boardHtml(ex,true,[...state.selected]); bindBoard(); }
  function bindBoard(){
    $$('.wb-sq',boardWrap).forEach(s=>s.onclick=()=>{
      const sq=s.dataset.sq;
      if(ex.type==='select' || (ex.type==='setup' && ex.accepted?.mode==='squares')){
        state.selected.has(sq)?state.selected.delete(sq):state.selected.add(sq); paintBoard(); return;
      }
      if(ex.type==='move' || ex.type==='moveguard'){
        if(!state.from){state.from=sq;state.selected=new Set([sq]);help.textContent=t('selectMove');paintBoard();}
        else if(!state.to){state.to=sq;state.selected.add(sq); if(ex.type==='moveguard'){help.textContent=t('selectGuard');} paintBoard(); renderControls();}
        else if(ex.type==='moveguard' && !state.guard){state.guard=sq;state.selected.add(sq);paintBoard();}
        else{state.from=sq;state.to=null;state.guard=null;state.promo=null;state.selected=new Set([sq]);paintBoard();renderControls();}
      }
    });
  }
  function renderControls(){
    let h='';
    if(ex.type==='square'){
      h='<div class="field"><label>Square</label><input id="squareInput" maxlength="2" placeholder="e4" autocomplete="off"></div>';
    }else if(ex.type==='yesno'){
      h='<div class="wp-choice-row"><button class="btn white" data-choice="yes">'+esc(t('yes'))+'</button><button class="btn white" data-choice="no">'+esc(t('no'))+'</button></div>';
    }else if(ex.type==='choice4'){
      h='<div class="wp-choice-grid"><button class="btn white" data-choice="check">'+esc(t('checkLabel'))+'</button><button class="btn white" data-choice="checkmate">'+esc(t('mate'))+'</button><button class="btn white" data-choice="stalemate">'+esc(t('stalemate'))+'</button><button class="btn white" data-choice="none">'+esc(t('none'))+'</button></div>';
    }else if(ex.type==='castle'){
      h='<div class="wp-choice-grid"><button class="btn white" data-toggle="kingside">'+esc(t('kingside'))+'</button><button class="btn white" data-toggle="queenside">'+esc(t('queenside'))+'</button><button class="btn white" data-special="neither">'+esc(t('neither'))+'</button></div>';
    }else if(ex.type==='ab'){
      h='<div class="wp-choice-grid"><button class="btn white" data-choice="A">A · '+esc(ex.options?.A||'')+'</button><button class="btn white" data-choice="B">B · '+esc(ex.options?.B||'')+'</button></div>';
    }else if(ex.type==='setup' && ex.accepted?.mode!=='squares'){
      h='<div class="wp-choice-grid"><button class="btn white" data-special="ok">'+esc(t('ok'))+'</button><button class="btn white" data-special="colors">'+esc(t('colors'))+'</button><button class="btn white" data-special="size">'+esc(t('size'))+'</button></div>';
    }
    const mv=normalizeMove(ex.canonicalMove);
    if((ex.type==='move'||ex.type==='moveguard') && mv?.promo && state.to){
      h+='<div class="mini-label" style="margin-top:12px">'+esc(t('promotion'))+'</div><div class="wp-choice-row">'+['queen','rook','bishop','knight'].map(p=>'<button class="btn white sm" data-promo="'+p+'">'+p[0].toUpperCase()+'</button>').join('')+'</div>';
    }
    if(['select','setup','move','moveguard','square','castle'].includes(ex.type)) h+='<button class="btn block" id="checkEx" style="margin-top:14px">'+esc(t('check'))+'</button>';
    controls.innerHTML=h;
    $$('[data-choice]',controls).forEach(b=>b.onclick=()=>{state.choice=b.dataset.choice;$$('[data-choice]',controls).forEach(x=>x.classList.toggle('mint',x===b));});
    $$('[data-toggle]',controls).forEach(b=>b.onclick=()=>{const x=b.dataset.toggle;state.selected.has(x)?state.selected.delete(x):state.selected.add(x);b.classList.toggle('mint',state.selected.has(x));});
    $$('[data-special]',controls).forEach(b=>b.onclick=()=>{state.special=b.dataset.special;$$('[data-special]',controls).forEach(x=>x.classList.toggle('mint',x===b));});
    $$('[data-promo]',controls).forEach(b=>b.onclick=()=>{state.promo=b.dataset.promo;$$('[data-promo]',controls).forEach(x=>x.classList.toggle('mint',x===b));});
    const chk=$('#checkEx'); if(chk)chk.onclick=checkAnswer;
  }
  function result(ok,neutral=false){
    if(ok){ mark(keyOf(ex.id),'c'); fb.innerHTML='<div class="wp-feedback ok"><b>'+esc(t('correct'))+'</b><p>'+esc(ex.answer)+'</p></div>'; }
    else if(neutral){ fb.innerHTML='<div class="wp-feedback info"><b>'+esc(t('answer'))+'</b><p>'+esc(t('notExample'))+'</p><p><strong>'+esc(ex.answer)+'</strong></p></div>'; }
    else{ mark(keyOf(ex.id),'w'); fb.innerHTML='<div class="wp-feedback bad"><b>'+esc(t('tryAgain'))+'</b></div>'; }
  }
  function checkAnswer(){
    if(ex.type==='square'){
      const v=($('#squareInput')?.value||'').trim().toLowerCase(); result((ex.accepted||[]).map(x=>x.toLowerCase()).includes(v)); return;
    }
    if(ex.type==='select'){ result(sameSet(state.selected,new Set(ex.accepted||[]))); return; }
    if(ex.type==='setup'){
      if(ex.accepted?.mode==='squares') result(sameSet(state.selected,new Set(ex.accepted.squares||[])));
      else result(state.special===ex.accepted?.mode);
      return;
    }
    if(ex.type==='castle'){
      const wanted=new Set(ex.accepted||[]); const got=state.special==='neither'?new Set():new Set([...state.selected].filter(x=>x==='kingside'||x==='queenside'));
      result(sameSet(got,wanted)); return;
    }
    if(ex.type==='move'||ex.type==='moveguard'){
      const m=normalizeMove(ex.canonicalMove), exact=m&&state.from===m.from&&state.to===m.to&&(!m.promo||state.promo===m.promo)&&(!ex.guard||state.guard===ex.guard);
      result(!!exact,!exact&&!!state.from&&!!state.to); return;
    }
  }
  $$('[data-choice]',controls).forEach(b=>b.onclick=()=>{state.choice=b.dataset.choice; const ok=String(state.choice).toLowerCase()===String(ex.accepted).toLowerCase(); result(ok);});
  function rebindDirect(){
    $$('[data-choice]',controls).forEach(b=>b.onclick=()=>{state.choice=b.dataset.choice;$$('[data-choice]',controls).forEach(x=>x.classList.toggle('mint',x===b));result(String(state.choice).toLowerCase()===String(ex.accepted).toLowerCase());});
  }
  rebindDirect();
  $('#resetEx').onclick=()=>{state.selected.clear();state.from=state.to=state.promo=state.guard=state.special=state.choice=null;fb.innerHTML='';paintBoard();renderControls();rebindDirect();};
  $('#showAnswer').onclick=()=>{mark(keyOf(ex.id),'w');fb.innerHTML='<div class="wp-feedback info"><b>'+esc(t('answer'))+'</b><p>'+esc(ex.answer)+'</p></div>';};
  help.textContent=(ex.type==='move'||ex.type==='moveguard')?t('selectMove'):ex.type==='select'?t('selectSquares'):'';
  paintBoard(); renderControls(); rebindDirect();
}

function render(){
  const parts=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean);
  if(!Auth.current()){ renderAuth(parts[0]==='signup'?'signup':'login'); return; }
  if(!parts[0]||parts[0]==='home')renderHome();
  else if(parts[0]==='courses')renderCourses();
  else if(parts[0]==='library')renderLibrary();
  else if(parts[0]==='book'&&parts[2]==='ch')renderChapter(+parts[3]);
  else if(parts[0]==='book')renderBook();
  else if(parts[0]==='play')renderExercise(+parts[1]);
  else renderHome();
  window.scrollTo({top:0,left:0,behavior:'auto'});
}
Auth.restore().finally(render);
})();