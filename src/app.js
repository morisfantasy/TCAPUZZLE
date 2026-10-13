(function () {
'use strict';
/* =========================================================
   CONFIG — edit prices / catalogue here
   ========================================================= */
const CONFIG = {
  currency: 'HK$',
  prices: { 1: 128, 2: 128, 3: 148, 4: 148 },   // placeholder prices
  totalBooks: 10,
  colors: ['sun', 'mint', 'coral', 'royal'],
  coverPiece: { 1: 'P', 2: 'N', 3: 'B', 4: 'R', 5: 'Q', 6: 'K', 7: 'P', 8: 'N', 9: 'B', 10: 'K' }
};
const { Game } = window.MiniChess;
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const app = document.getElementById('app');

/* ---------- language / i18n ---------- */
const LANGS = {
  en: 'English',
  zh: '中文（普通话）',
  yue: '廣東話',
  es: 'Español',
  fr: 'Français'
};
let currentLang = (() => { try { return localStorage.getItem('tca.lang') || 'en'; } catch { return 'en'; } })();

const I18N = {
  zh: {
    'Tactics Trainer':'战术训练器','Log out':'退出登录','Log in':'登录','Sign up':'注册','Welcome back!':'欢迎回来！',
    'Log in to continue your training.':'登录后继续训练。','Username':'用户名','Password':'密码','New here?':'第一次来？',
    'Create an account':'创建账户','Create your account':'创建账户','It takes less than a minute.':'不到一分钟即可完成。',
    'Your first name':'名字','Letters, numbers, dots or dashes. At least 3 characters.':'可使用字母、数字、点或短横线，至少 3 个字符。',
    'At least 6 characters.':'至少 6 个字符。','Already have an account?':'已经有账户？',
    'Solve every puzzle from The Chess Academy workbooks on an interactive board. Your progress is saved book by book.':'在互动棋盘上完成 The Chess Academy 练习册中的题目，并按书保存进度。',
    'Your move!':'轮到你了！','Choose how you want to train':'选择你的训练方式','Books and video courses live in one place.':'练习册和视频课程都集中在这里。',
    'Tactics Books':'战术练习册','Interactive puzzles':'互动题目','Open the workbook trainer and solve puzzles on the board.':'打开练习册训练器，在棋盘上完成题目。',
    'Open books':'打开练习册','Video Courses':'视频课程','Lessons & series':'课程与系列','Structured video learning from The Chess Academy coaches.':'由 The Chess Academy 教练提供的系统视频课程。',
    'Coming soon':'即将推出','Courses':'课程','Video courses are coming soon':'视频课程即将推出','This section is ready. Courses will appear here as soon as they are published.':'此区域已准备好，课程发布后会显示在这里。',
    'Back to home':'返回主页','My books':'我的练习册','More books':'更多练习册','Books':'练习册','Unlock':'解锁','Continue':'继续',
    'Start book':'开始练习','Start chapter':'开始章节','Solved':'已完成','First try':'首次成功','To fix':'待订正','Not started':'未开始',
    'Chapter complete':'章节完成','Previous':'上一个','Next puzzle':'下一题','Chapter overview':'章节总览','Flip board':'翻转棋盘',
    'Your moves':'你的走法','This chapter':'本章节','White to move':'白方走','Black to move':'黑方走','Make your move on the board.':'请在棋盘上走棋。',
    'Hint':'提示','Show solution':'查看答案','Try again':'再试一次','Skip for now':'暂时跳过','Finish chapter':'完成章节',
    'Try it yourself':'自己试试','Good move!':'好棋！','Now see how your opponent answers.':'看看对手如何应对。','Keep going!':'继续！',
    'Not this time.':'这次不对。','Puzzle to fix':'待订正题目','You missed this one before. Take your time.':'之前这题做错了，慢慢想。',
    'Already solved':'已完成','Play it again to practise.':'再做一次巩固。','Watch the solution':'观看答案','That is the solution.':'这就是答案。',
    'Solved!':'完成！','Solved on the first try!':'一次完成！','Mistake fixed. Well done!':'订正成功，做得好！','Chapter complete!':'章节完成！',
    'Find checkmate in one move.':'找到一步将杀。','You are in check. Capture the piece that gives check.':'你正在被将军，吃掉将军你的棋子。',
    'Find the exchange that leaves you ahead.':'找到能让你获利的交换。','Find the capture that wins material.':'找到赢得子力的吃子。',
    'Find the moves that let you promote or win material.':'找到能升变或赢得子力的走法。','Find the best move and win material.':'找到最佳走法并赢得子力。',
    'Enter your first name.':'请输入名字。','Enter your username and password.':'请输入用户名和密码。','Your password needs at least 6 characters.':'密码至少需要 6 个字符。',
    'That username is taken. Try another one.':'该用户名已被使用，请换一个。','Username or password is not right. Check them and try again.':'用户名或密码不正确，请检查后重试。',
    'Something went wrong. Please try again.':'出现问题，请重试。','In preparation':'准备中','Our coaches are writing this book. It will appear here when it is ready.':'我们的教练正在制作这本练习册，完成后会显示在这里。',
    'Pick a book and keep training.':'选择一本练习册继续训练。','Unlock your first book to start solving puzzles.':'解锁第一本练习册并开始做题。'
  },
  yue: {
    'Tactics Trainer':'戰術訓練器','Log out':'登出','Log in':'登入','Sign up':'註冊','Welcome back!':'歡迎返嚟！',
    'Log in to continue your training.':'登入之後繼續訓練。','Username':'用戶名','Password':'密碼','New here?':'第一次嚟？',
    'Create an account':'建立帳戶','Create your account':'建立帳戶','It takes less than a minute.':'唔使一分鐘就搞掂。',
    'Your first name':'名字','Letters, numbers, dots or dashes. At least 3 characters.':'可以用英文字母、數字、點或橫線，最少 3 個字元。',
    'At least 6 characters.':'最少 6 個字元。','Already have an account?':'已經有帳戶？',
    'Solve every puzzle from The Chess Academy workbooks on an interactive board. Your progress is saved book by book.':'喺互動棋盤完成 The Chess Academy 練習冊題目，進度會逐本保存。',
    'Your move!':'到你行！','Choose how you want to train':'揀你想點樣訓練','Books and video courses live in one place.':'練習冊同影片課程都喺同一個地方。',
    'Tactics Books':'戰術練習冊','Interactive puzzles':'互動題目','Open the workbook trainer and solve puzzles on the board.':'打開練習冊訓練器，喺棋盤解題。',
    'Open books':'打開練習冊','Video Courses':'影片課程','Lessons & series':'課堂同系列','Structured video learning from The Chess Academy coaches.':'由 The Chess Academy 教練提供有系統嘅影片課程。',
    'Coming soon':'即將推出','Courses':'課程','Video courses are coming soon':'影片課程即將推出','This section is ready. Courses will appear here as soon as they are published.':'呢個區域已經準備好，課程一推出就會顯示喺度。',
    'Back to home':'返主頁','My books':'我嘅練習冊','More books':'更多練習冊','Books':'練習冊','Unlock':'解鎖','Continue':'繼續',
    'Start book':'開始練習','Start chapter':'開始章節','Solved':'已完成','First try':'第一次成功','To fix':'要改正','Not started':'未開始',
    'Chapter complete':'章節完成','Previous':'上一題','Next puzzle':'下一題','Chapter overview':'章節總覽','Flip board':'反轉棋盤',
    'Your moves':'你嘅走法','This chapter':'呢個章節','White to move':'白方行','Black to move':'黑方行','Make your move on the board.':'喺棋盤行一步。',
    'Hint':'提示','Show solution':'睇答案','Try again':'再試','Skip for now':'暫時跳過','Finish chapter':'完成章節',
    'Try it yourself':'自己試','Good move!':'好棋！','Now see how your opponent answers.':'睇下對手點應。','Keep going!':'繼續！',
    'Not this time.':'今次唔啱。','Puzzle to fix':'要改正嘅題目','You missed this one before. Take your time.':'之前呢題做錯咗，慢慢諗。',
    'Already solved':'已完成','Play it again to practise.':'再做一次練習。','Watch the solution':'睇答案','That is the solution.':'呢個就係答案。',
    'Solved!':'完成！','Solved on the first try!':'一次完成！','Mistake fixed. Well done!':'改正成功，做得好！','Chapter complete!':'章節完成！',
    'Find checkmate in one move.':'搵一步將死。','You are in check. Capture the piece that gives check.':'你被將軍，食咗將軍你嗰隻棋。',
    'Find the exchange that leaves you ahead.':'搵一個令你着數嘅交換。','Find the capture that wins material.':'搵可以贏子嘅食法。',
    'Find the moves that let you promote or win material.':'搵可以升變或者贏子嘅走法。','Find the best move and win material.':'搵最佳走法並贏子。',
    'Enter your first name.':'請輸入名字。','Enter your username and password.':'請輸入用戶名同密碼。','Your password needs at least 6 characters.':'密碼最少要 6 個字元。',
    'That username is taken. Try another one.':'呢個用戶名已經有人用，試第二個。','Username or password is not right. Check them and try again.':'用戶名或者密碼唔啱，請再檢查。',
    'Something went wrong. Please try again.':'出咗問題，請再試。','In preparation':'準備中','Our coaches are writing this book. It will appear here when it is ready.':'我哋教練正喺度整呢本練習冊，完成後就會顯示。',
    'Pick a book and keep training.':'揀一本練習冊繼續訓練。','Unlock your first book to start solving puzzles.':'解鎖第一本練習冊開始做題。'
  },
  es: {
    'Tactics Trainer':'Entrenador de táctica','Log out':'Cerrar sesión','Log in':'Iniciar sesión','Sign up':'Registrarse','Welcome back!':'¡Bienvenido de nuevo!',
    'Log in to continue your training.':'Inicia sesión para continuar entrenando.','Username':'Usuario','Password':'Contraseña','New here?':'¿Eres nuevo?',
    'Create an account':'Crear una cuenta','Create your account':'Crea tu cuenta','It takes less than a minute.':'Tardarás menos de un minuto.',
    'Your first name':'Tu nombre','Letters, numbers, dots or dashes. At least 3 characters.':'Letras, números, puntos o guiones. Mínimo 3 caracteres.',
    'At least 6 characters.':'Mínimo 6 caracteres.','Already have an account?':'¿Ya tienes una cuenta?',
    'Solve every puzzle from The Chess Academy workbooks on an interactive board. Your progress is saved book by book.':'Resuelve los ejercicios de The Chess Academy en un tablero interactivo. Tu progreso se guarda libro a libro.',
    'Your move!':'¡Tu turno!','Choose how you want to train':'Elige cómo quieres entrenar','Books and video courses live in one place.':'Libros y cursos en vídeo, todo en un mismo sitio.',
    'Tactics Books':'Libros de táctica','Interactive puzzles':'Ejercicios interactivos','Open the workbook trainer and solve puzzles on the board.':'Abre el entrenador de los libros y resuelve los ejercicios en el tablero.',
    'Open books':'Abrir libros','Video Courses':'Cursos en vídeo','Lessons & series':'Clases y series','Structured video learning from The Chess Academy coaches.':'Aprendizaje en vídeo estructurado por los entrenadores de The Chess Academy.',
    'Coming soon':'Próximamente','Courses':'Cursos','Video courses are coming soon':'Los cursos en vídeo llegarán pronto','This section is ready. Courses will appear here as soon as they are published.':'Esta sección ya está preparada. Los cursos aparecerán aquí cuando se publiquen.',
    'Back to home':'Volver al inicio','My books':'Mis libros','More books':'Más libros','Books':'Libros','Unlock':'Desbloquear','Continue':'Continuar',
    'Start book':'Empezar libro','Start chapter':'Empezar capítulo','Solved':'Resuelto','First try':'A la primera','To fix':'Por corregir','Not started':'Sin empezar',
    'Chapter complete':'Capítulo completado','Previous':'Anterior','Next puzzle':'Siguiente ejercicio','Chapter overview':'Resumen del capítulo','Flip board':'Girar tablero',
    'Your moves':'Tus jugadas','This chapter':'Este capítulo','White to move':'Juegan blancas','Black to move':'Juegan negras','Make your move on the board.':'Haz tu jugada en el tablero.',
    'Hint':'Pista','Show solution':'Mostrar solución','Try again':'Intentar de nuevo','Skip for now':'Saltar por ahora','Finish chapter':'Terminar capítulo',
    'Try it yourself':'Inténtalo tú','Good move!':'¡Buena jugada!','Now see how your opponent answers.':'Ahora mira cómo responde tu rival.','Keep going!':'¡Sigue!',
    'Not this time.':'Esta vez no.','Puzzle to fix':'Ejercicio por corregir','You missed this one before. Take your time.':'Fallaste este ejercicio antes. Tómate tu tiempo.',
    'Already solved':'Ya resuelto','Play it again to practise.':'Repítelo para practicar.','Watch the solution':'Mira la solución','That is the solution.':'Esa es la solución.',
    'Solved!':'¡Resuelto!','Solved on the first try!':'¡Resuelto a la primera!','Mistake fixed. Well done!':'Error corregido. ¡Bien hecho!','Chapter complete!':'¡Capítulo completado!',
    'Find checkmate in one move.':'Encuentra mate en una jugada.','You are in check. Capture the piece that gives check.':'Estás en jaque. Captura la pieza que da jaque.',
    'Find the exchange that leaves you ahead.':'Encuentra el cambio que te deja con ventaja.','Find the capture that wins material.':'Encuentra la captura que gana material.',
    'Find the moves that let you promote or win material.':'Encuentra las jugadas que permiten promocionar o ganar material.','Find the best move and win material.':'Encuentra la mejor jugada y gana material.',
    'Enter your first name.':'Introduce tu nombre.','Enter your username and password.':'Introduce tu usuario y contraseña.','Your password needs at least 6 characters.':'La contraseña debe tener al menos 6 caracteres.',
    'That username is taken. Try another one.':'Ese usuario ya está ocupado. Prueba otro.','Username or password is not right. Check them and try again.':'El usuario o la contraseña no son correctos. Revísalos e inténtalo de nuevo.',
    'Something went wrong. Please try again.':'Algo ha salido mal. Inténtalo de nuevo.','In preparation':'En preparación','Our coaches are writing this book. It will appear here when it is ready.':'Nuestros entrenadores están preparando este libro. Aparecerá aquí cuando esté listo.',
    'Pick a book and keep training.':'Elige un libro y sigue entrenando.','Unlock your first book to start solving puzzles.':'Desbloquea tu primer libro para empezar a resolver ejercicios.'
  },
  fr: {
    'Tactics Trainer':'Entraîneur tactique','Log out':'Se déconnecter','Log in':'Se connecter','Sign up':'Créer un compte','Welcome back!':'Bon retour !',
    'Log in to continue your training.':'Connectez-vous pour continuer votre entraînement.','Username':'Nom d’utilisateur','Password':'Mot de passe','New here?':'Nouveau ici ?',
    'Create an account':'Créer un compte','Create your account':'Créez votre compte','It takes less than a minute.':'Cela prend moins d’une minute.',
    'Your first name':'Votre prénom','Letters, numbers, dots or dashes. At least 3 characters.':'Lettres, chiffres, points ou tirets. Au moins 3 caractères.',
    'At least 6 characters.':'Au moins 6 caractères.','Already have an account?':'Vous avez déjà un compte ?',
    'Solve every puzzle from The Chess Academy workbooks on an interactive board. Your progress is saved book by book.':'Résolvez les exercices des cahiers The Chess Academy sur un échiquier interactif. Votre progression est enregistrée livre par livre.',
    'Your move!':'À vous de jouer !','Choose how you want to train':'Choisissez votre façon de vous entraîner','Books and video courses live in one place.':'Livres et cours vidéo réunis au même endroit.',
    'Tactics Books':'Livres de tactique','Interactive puzzles':'Exercices interactifs','Open the workbook trainer and solve puzzles on the board.':'Ouvrez l’entraîneur des livres et résolvez les exercices sur l’échiquier.',
    'Open books':'Ouvrir les livres','Video Courses':'Cours vidéo','Lessons & series':'Leçons et séries','Structured video learning from The Chess Academy coaches.':'Un apprentissage vidéo structuré par les entraîneurs de The Chess Academy.',
    'Coming soon':'Bientôt disponible','Courses':'Cours','Video courses are coming soon':'Les cours vidéo arrivent bientôt','This section is ready. Courses will appear here as soon as they are published.':'Cette section est prête. Les cours apparaîtront ici dès leur publication.',
    'Back to home':'Retour à l’accueil','My books':'Mes livres','More books':'Plus de livres','Books':'Livres','Unlock':'Débloquer','Continue':'Continuer',
    'Start book':'Commencer le livre','Start chapter':'Commencer le chapitre','Solved':'Résolu','First try':'Du premier coup','To fix':'À corriger','Not started':'Pas commencé',
    'Chapter complete':'Chapitre terminé','Previous':'Précédent','Next puzzle':'Exercice suivant','Chapter overview':'Vue du chapitre','Flip board':'Retourner l’échiquier',
    'Your moves':'Vos coups','This chapter':'Ce chapitre','White to move':'Aux blancs','Black to move':'Aux noirs','Make your move on the board.':'Jouez votre coup sur l’échiquier.',
    'Hint':'Indice','Show solution':'Voir la solution','Try again':'Réessayer','Skip for now':'Passer pour l’instant','Finish chapter':'Terminer le chapitre',
    'Try it yourself':'Essayez vous-même','Good move!':'Bon coup !','Now see how your opponent answers.':'Voyez maintenant la réponse de votre adversaire.','Keep going!':'Continuez !',
    'Not this time.':'Pas cette fois.','Puzzle to fix':'Exercice à corriger','You missed this one before. Take your time.':'Vous aviez raté cet exercice. Prenez votre temps.',
    'Already solved':'Déjà résolu','Play it again to practise.':'Rejouez-le pour vous entraîner.','Watch the solution':'Voir la solution','That is the solution.':'Voici la solution.',
    'Solved!':'Résolu !','Solved on the first try!':'Résolu du premier coup !','Mistake fixed. Well done!':'Erreur corrigée. Bravo !','Chapter complete!':'Chapitre terminé !',
    'Find checkmate in one move.':'Trouvez le mat en un coup.','You are in check. Capture the piece that gives check.':'Vous êtes en échec. Capturez la pièce qui donne échec.',
    'Find the exchange that leaves you ahead.':'Trouvez l’échange qui vous donne l’avantage.','Find the capture that wins material.':'Trouvez la prise qui gagne du matériel.',
    'Find the moves that let you promote or win material.':'Trouvez les coups qui permettent de promouvoir ou de gagner du matériel.','Find the best move and win material.':'Trouvez le meilleur coup et gagnez du matériel.',
    'Enter your first name.':'Entrez votre prénom.','Enter your username and password.':'Entrez votre nom d’utilisateur et votre mot de passe.','Your password needs at least 6 characters.':'Le mot de passe doit contenir au moins 6 caractères.',
    'That username is taken. Try another one.':'Ce nom d’utilisateur est déjà pris. Essayez-en un autre.','Username or password is not right. Check them and try again.':'Le nom d’utilisateur ou le mot de passe est incorrect. Vérifiez et réessayez.',
    'Something went wrong. Please try again.':'Un problème est survenu. Réessayez.','In preparation':'En préparation','Our coaches are writing this book. It will appear here when it is ready.':'Nos entraîneurs préparent ce livre. Il apparaîtra ici lorsqu’il sera prêt.',
    'Pick a book and keep training.':'Choisissez un livre et continuez à vous entraîner.','Unlock your first book to start solving puzzles.':'Débloquez votre premier livre pour commencer les exercices.'
  }
};

function translatedExact(s) {
  if (currentLang === 'en') return s;
  return (I18N[currentLang] && I18N[currentLang][s]) || s;
}
function translateText(s) {
  const lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0], core = s.trim();
  if (!core || currentLang === 'en') return s;
  const exact = translatedExact(core);
  if (exact !== core) return lead + exact + tail;
  const dyn = {
    zh: {
      hi:n=>`你好，${n}！`, book:n=>`练习册 ${n}`, chapter:n=>`章节 ${n}`, puzzles:n=>`${n} 道题`, chapters:n=>`${n} 个章节`,
      solved:n=>`${n} 已完成`, fix:n=>`${n} 待订正`, todo:n=>`${n} 待完成`, correct:n=>`${n}% 正确`,
      count:(a,b)=>`第 ${a} 题，共 ${b} 题`, force:n=>`在 ${n} 步内强制将杀。`, fixm:n=>`订正错误（${n}）`
    },
    yue: {
      hi:n=>`你好，${n}！`, book:n=>`練習冊 ${n}`, chapter:n=>`章節 ${n}`, puzzles:n=>`${n} 題`, chapters:n=>`${n} 個章節`,
      solved:n=>`${n} 已完成`, fix:n=>`${n} 要改正`, todo:n=>`${n} 未做`, correct:n=>`${n}% 正確`,
      count:(a,b)=>`第 ${a} 題，共 ${b} 題`, force:n=>`喺 ${n} 步內強制將死。`, fixm:n=>`改正錯誤（${n}）`
    },
    es: {
      hi:n=>`¡Hola, ${n}!`, book:n=>`Libro ${n}`, chapter:n=>`Capítulo ${n}`, puzzles:n=>`${n} ejercicios`, chapters:n=>`${n} capítulos`,
      solved:n=>`${n} resueltos`, fix:n=>`${n} por corregir`, todo:n=>`${n} por hacer`, correct:n=>`${n}% correctos`,
      count:(a,b)=>`Ejercicio ${a} de ${b}`, force:n=>`Fuerza mate en ${n} jugadas.`, fixm:n=>`Corregir errores (${n})`
    },
    fr: {
      hi:n=>`Bonjour, ${n} !`, book:n=>`Livre ${n}`, chapter:n=>`Chapitre ${n}`, puzzles:n=>`${n} exercices`, chapters:n=>`${n} chapitres`,
      solved:n=>`${n} résolus`, fix:n=>`${n} à corriger`, todo:n=>`${n} à faire`, correct:n=>`${n}% correct`,
      count:(a,b)=>`Exercice ${a} sur ${b}`, force:n=>`Forcez le mat en ${n} coups.`, fixm:n=>`Corriger les erreurs (${n})`
    }
  }[currentLang];
  if (!dyn) return s;
  let m;
  if ((m=core.match(/^Hi, (.+)!$/))) return lead+dyn.hi(m[1])+tail;
  if ((m=core.match(/^Book (\d+)$/))) return lead+dyn.book(m[1])+tail;
  if ((m=core.match(/^Chapter (\d+)$/))) return lead+dyn.chapter(m[1])+tail;
  if ((m=core.match(/^(\d+) puzzles$/))) return lead+dyn.puzzles(m[1])+tail;
  if ((m=core.match(/^(\d+) chapters$/))) return lead+dyn.chapters(m[1])+tail;
  if ((m=core.match(/^(\d+) solved$/))) return lead+dyn.solved(m[1])+tail;
  if ((m=core.match(/^(\d+) to fix$/))) return lead+dyn.fix(m[1])+tail;
  if ((m=core.match(/^(\d+) to do$/))) return lead+dyn.todo(m[1])+tail;
  if ((m=core.match(/^(\d+)% correct$/))) return lead+dyn.correct(m[1])+tail;
  if ((m=core.match(/^Puzzle (\d+) of (\d+)$/))) return lead+dyn.count(m[1],m[2])+tail;
  if ((m=core.match(/^Force checkmate in (\d+) moves\.$/))) return lead+dyn.force(m[1])+tail;
  if ((m=core.match(/^Fix mistakes \((\d+)\)$/))) return lead+dyn.fixm(m[1])+tail;
  return s;
}
function applyTranslations(root=document) {
  if (currentLang === 'en') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes=[]; while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => { const x=translateText(n.nodeValue); if (x!==n.nodeValue) n.nodeValue=x; });
}
function languageSelect(id='langSel') {
  return `<select class="lang-select" id="${id}" aria-label="Language">${Object.entries(LANGS).map(([k,v])=>`<option value="${k}"${k===currentLang?' selected':''}>${v}</option>`).join('')}</select>`;
}
function bindLanguage() {
  document.querySelectorAll('.lang-select').forEach(s => s.onchange = () => {
    currentLang = s.value;
    try { localStorage.setItem('tca.lang', currentLang); } catch {}
    render();
  });
  applyTranslations(app);
}

/* ---------- puzzle index ---------- */
const PUZ = {};
BOOKS.forEach(b => b.ch.forEach((c, ci) => c.p.forEach((p, pi) => {
  PUZ[p[0]] = { id: p[0], book: b.n, ci, pi, fen: p[1], main: p[2].split(' '), alt: (p[3] || []).map(l => l.split(' ')), theme: c.t };
})));
const bookByN = n => BOOKS.find(b => b.n === +n);
const colorFor = n => CONFIG.colors[(n - 1) % CONFIG.colors.length];
const totalPuzzles = b => b.ch.reduce((a, c) => a + c.p.length, 0);

/* =========================================================
   AUTH — persistent server-backed accounts.
   Progress/purchases remain local for now and are keyed by username.
   ========================================================= */
const Store = (() => {
  const mem = {};
  const get = k => { try { const v = localStorage.getItem(k); if (v != null) return JSON.parse(v); } catch (e) {} return k in mem ? mem[k] : null; };
  const set = (k, v) => { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const del = k => { delete mem[k]; try { localStorage.removeItem(k); } catch (e) {} };
  return { get, set, del };
})();

async function authRequest(path, body) {
  const r = await fetch(path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
    cache: 'no-store'
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}
const Auth = {
  _user: null,
  current() { return this._user; },
  async restore() {
    try { this._user = (await authRequest('/api/me')).user; }
    catch { this._user = null; }
  },
  async register(name, username, pw) {
    const data = await authRequest('/api/register', { name, username, password: pw });
    this._user = data.user;
    const key = this._user.key;
    if (!Store.get('tca.u.' + key)) Store.set('tca.u.' + key, { owned: [], progress: {}, last: {} });
  },
  async login(username, pw) {
    const data = await authRequest('/api/login', { username, password: pw });
    this._user = data.user;
    const key = this._user.key;
    if (!Store.get('tca.u.' + key)) Store.set('tca.u.' + key, { owned: [], progress: {}, last: {} });
  },
  logout() {
    this._user = null;
    fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  }
};
const Data = {
  get() { const u = Auth.current(); return u ? (Store.get('tca.u.' + u.key) || { owned: [], progress: {}, last: {} }) : null; },
  save(d) { const u = Auth.current(); if (u) Store.set('tca.u.' + u.key, d); },
  owns(n) { const d = this.get(); return !!d && d.owned.includes(+n); },
  buy(n) { const d = this.get(); if (!d.owned.includes(+n)) d.owned.push(+n); this.save(d); },
  rec(id) { const d = this.get(); return (d && d.progress[id]) || null; },
  setRec(id, r) { const d = this.get(); d.progress[id] = r; this.save(d); },
  setLast(book, ci) { const d = this.get(); d.last[book] = ci; this.save(d); }
};
function statsFor(list) { // list of puzzle arrays
  let c = 0, w = 0, stars = 0;
  for (const p of list) { const r = Data.rec(p[0]); if (r && r.s === 'c') { c++; if (r.star) stars++; } else if (r && r.s === 'w') w++; }
  return { c, w, u: list.length - c - w, total: list.length, stars, pct: list.length ? Math.round(c * 100 / list.length) : 0 };
}
const bookList = b => b.ch.flatMap(c => c.p);

/* ---------- icons ---------- */
const ICON = {
  lock: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#17175F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2.5" fill="#FFD043"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="#17175F" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z" fill="#FFD043" stroke="#17175F" stroke-width="2" stroke-linejoin="round"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="#17175F" stroke-width="3.2" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  fix: '<svg viewBox="0 0 24 24" fill="none" stroke="#17175F" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="#17175F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" fill="#FFD043"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="#17175F" stroke-width="2.6"><circle cx="12" cy="12" r="8.5" fill="#fff"/><circle cx="12" cy="12" r="4.5" fill="#FF7A59"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  flip: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v14M4 15l3 3 3-3M17 20V6M14 9l3-3 3 3"/></svg>'
};
const pieceSVG = p => PIECES[p];

/* ---------- theme helpers ---------- */
const WORDS = { One: 1, Two: 2, Three: 3, Four: 4, Five: 5, Six: 6, Seven: 7, Eight: 8 };
function mateIn(theme) { const m = theme.match(/Mate in (One|Two|Three|Four|Five|Six|Seven|Eight)/); return m ? WORDS[m[1]] : 0; }
function taskFor(theme) {
  const n = mateIn(theme);
  if (n === 1) return 'Find checkmate in one move.';
  if (n) return `Force checkmate in ${n} moves.`;
  if (/Checking Piece/.test(theme)) return 'You are in check. Capture the piece that gives check.';
  if (/Exchanges/.test(theme)) return 'Find the exchange that leaves you ahead.';
  if (/Capture|Winning Captures/.test(theme)) return 'Find the capture that wins material.';
  if (/Promotion/.test(theme)) return 'Find the moves that let you promote or win material.';
  return 'Find the best move and win material.';
}

/* ---------- router ---------- */
let cleanup = null;
function go(h) { if (location.hash === h) render(); else location.hash = h; }
window.addEventListener('hashchange', render);
function render() {
  if (cleanup) { cleanup(); cleanup = null; }
  closeModal();
  const user = Auth.current();
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!user) { renderAuth(parts[0] === 'signup' ? 'signup' : 'login'); return; }
  if (parts[0] === 'home' || !parts[0]) renderHome();
  else if (parts[0] === 'courses') renderCourses();
  else if (parts[0] === 'library') renderLibrary();
  else if (parts[0] === 'book' && bookByN(parts[1])) {
    if (!Data.owns(parts[1])) { go('#/library'); return; }
    if (parts[2] === 'ch' && bookByN(parts[1]).ch[+parts[3]]) renderChapter(+parts[1], +parts[3]);
    else renderBook(+parts[1]);
  } else if (parts[0] === 'play' && PUZ[parts[1]]) {
    if (!Data.owns(PUZ[parts[1]].book)) { go('#/library'); return; }
    renderPlay(parts[1]);
  } else renderHome();
  requestAnimationFrame(() => {
    applyTranslations(app);
    if (parts[0] === 'play') {
      const play = document.querySelector('.play');
      if (play) play.scrollIntoView({ block: 'start', behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  });
}

/* ---------- shell ---------- */
function shell(inner) {
  const u = Auth.current();
  return `<header class="topbar"><div class="topbar-in">
    <a href="#/home" class="logo-sticker" aria-label="The Chess Academy"><img src="${LOGO}" alt="The Chess Academy"></a>
    <span class="prod">Tactics Trainer</span><span class="spacer"></span>
    ${languageSelect()}
    <div class="user-pill"><span class="avatar" aria-hidden="true">${esc(u.name.trim()[0] || '?').toUpperCase()}</span>
      <span class="nm">${esc(u.name)}</span>
      <button class="btn white" id="logout">Log out</button></div>
  </div></header><div class="checker" aria-hidden="true"></div>
  <main class="wrap">${inner}</main>`;
}
function bindShell() { bindLanguage(); const b = $('#logout'); if (b) b.onclick = () => { Auth.logout(); go('#/login'); }; }

/* ---------- static board ---------- */
function staticBoard(fen, orient = 'w') {
  const g = new Game(fen); let h = '';
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    const r = orient === 'w' ? 7 - row : row, f = orient === 'w' ? col : 7 - col, i = r * 8 + f, p = g.b[i];
    h += `<div class="sq${(r + f) % 2 ? '' : ' d'}">${p ? `<span class="pc">${pieceSVG(p)}</span>` : ''}</div>`;
  }
  return `<div class="board" aria-hidden="true">${h}</div>`;
}

/* =========================================================
   AUTH
   ========================================================= */
function renderAuth(mode) {
  const demoCh = BOOKS[0].ch.find(c => /Mate in One: Queen/.test(c.t)) || BOOKS[0].ch[0];
  const demo = PUZ[demoCh.p[2][0]];
  app.innerHTML = `<div class="auth">
    <div class="auth-lang">${languageSelect('langSelAuth')}</div>
    <section class="auth-hero">
      <span class="logo-sticker"><img src="${LOGO}" alt="The Chess Academy"></span>
      <h1>Tactics<span>Trainer</span></h1>
      <p class="lead">Solve every puzzle from The Chess Academy workbooks on an interactive board. Your progress is saved book by book.</p>
      <div class="hero-board-wrap"><span class="bubble">Your move!</span>${staticBoard(demo.fen, demo.fen.split(' ')[1])}</div>
    </section>
    <section class="auth-side">
      <div class="card auth-card">
        <div class="tabs" role="tablist">
          <button role="tab" aria-selected="${mode === 'login'}" data-m="login">Log in</button>
          <button role="tab" aria-selected="${mode === 'signup'}" data-m="signup">Sign up</button>
        </div>
        ${mode === 'login' ? `
          <h2>Welcome back!</h2><p class="sub">Log in to continue your training.</p>
          <form id="f" novalidate>
            <div id="err"></div>
            <div class="field"><label for="u">Username</label><input id="u" autocomplete="username" required></div>
            <div class="field"><label for="p">Password</label><input id="p" type="password" autocomplete="current-password" required></div>
            <button class="btn block" type="submit">Log in</button>
          </form>
          <p style="margin-top:16px;font-weight:700;text-align:center">New here? <button class="link" data-m="signup">Create an account</button></p>`
      : `
          <h2>Create your account</h2><p class="sub">It takes less than a minute.</p>
          <form id="f" novalidate>
            <div id="err"></div>
            <div class="field"><label for="n">Your first name</label><input id="n" autocomplete="given-name" required></div>
            <div class="field"><label for="u">Username</label><input id="u" autocomplete="username" required><span class="hint">Letters, numbers, dots or dashes. At least 3 characters.</span></div>
            <div class="field"><label for="p">Password</label><input id="p" type="password" autocomplete="new-password" required><span class="hint">At least 6 characters.</span></div>
            <button class="btn block" type="submit">Create account</button>
          </form>
          <p style="margin-top:16px;font-weight:700;text-align:center">Already have an account? <button class="link" data-m="login">Log in</button></p>`}
      </div>
    </section>
    <div class="auth-floor" aria-hidden="true"></div>
  </div>`;
  app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => go('#/' + b.dataset.m));
  const showErr = m => { $('#err').innerHTML = `<div class="form-error" role="alert">${esc(m)}</div>`; };
  $('#f').onsubmit = async e => {
    e.preventDefault();
    const u = $('#u').value.trim(), p = $('#p').value;
    try {
      if (mode === 'signup') {
        const n = $('#n').value.trim();
        if (!n) return showErr('Enter your first name.');
        if (!/^[A-Za-z0-9._-]{3,24}$/.test(u)) return showErr('Usernames need 3 to 24 letters, numbers, dots or dashes.');
        if (p.length < 6) return showErr('Your password needs at least 6 characters.');
        await Auth.register(n, u, p);
      } else {
        if (!u || !p) return showErr('Enter your username and password.');
        await Auth.login(u, p);
      }
      go('#/home');
    } catch (err) { showErr(err.message); }
  };
  bindLanguage();
  setTimeout(() => { const f = $(mode === 'signup' ? '#n' : '#u'); f && f.focus(); }, 50);
}

/* =========================================================
   HOME / COURSES HUB
   ========================================================= */
function renderHome() {
  const u = Auth.current();
  app.innerHTML = shell(`
    <section class="hub-head">
      <h1>Choose how you want to train</h1>
      <p>Books and video courses live in one place.</p>
    </section>
    <div class="hub-grid">
      <a class="card hub-card books" href="#/library">
        <span class="eyebrow">Interactive puzzles</span>
        <h2>Tactics Books</h2>
        <p>Open the workbook trainer and solve puzzles on the board.</p>
        <span class="soon-pill">Open books</span>
        <span class="hub-icon" aria-hidden="true">♟️</span>
      </a>
      <a class="card hub-card courses" href="#/courses">
        <span class="eyebrow">Lessons & series</span>
        <h2>Video Courses</h2>
        <p>Structured video learning from The Chess Academy coaches.</p>
        <span class="soon-pill">Coming soon</span>
        <span class="hub-icon" aria-hidden="true">▶️</span>
      </a>
    </div>`);
  bindShell();
}

function renderCourses() {
  app.innerHTML = shell(`
    <nav class="crumbs"><a href="#/home">Back to home</a><span class="sep">/</span><span>Courses</span></nav>
    <section class="card empty-courses">
      <div class="big" aria-hidden="true">🎬</div>
      <h1>Video courses are coming soon</h1>
      <p>This section is ready. Courses will appear here as soon as they are published.</p>
      <a class="btn" href="#/home">Back to home</a>
    </section>`);
  bindShell();
}

/* =========================================================
   LIBRARY
   ========================================================= */
function coverHTML(n, title, level) {
  const col = n <= BOOKS.length ? colorFor(n) : '';
  return `<div class="cover ${col}"><span class="cv-check"></span>
    <span class="cv-piece">${pieceSVG(CONFIG.coverPiece[n] || 'P')}</span>
    <span class="cv-num">${n}</span>
    <div><span class="cv-level">${esc(level)}</span><div class="cv-title">${esc(title)}</div></div></div>`;
}
function progressHTML(s) {
  return `<div class="pbar" role="img" aria-label="${s.c} solved, ${s.w} to fix, ${s.u} not started">
    <i class="c" style="width:${s.c * 100 / s.total}%"></i><i class="w" style="width:${s.w * 100 / s.total}%"></i></div>
    <div class="pcounts"><span><i class="dot c"></i>${s.c} solved</span><span><i class="dot w"></i>${s.w} to fix</span><span><i class="dot u"></i>${s.u} to do</span></div>`;
}
function renderLibrary() {
  const u = Auth.current(), owned = BOOKS.filter(b => Data.owns(b.n)), shop = BOOKS.filter(b => !Data.owns(b.n));
  const ownedCards = owned.map(b => {
    const s = statsFor(bookList(b));
    return `<article class="card book">${coverHTML(b.n, b.title, b.level)}
      <div class="book-body"><div class="meta">Book ${b.n} &nbsp;|&nbsp; ${s.total} puzzles &nbsp;|&nbsp; ${b.ch.length} chapters</div>
      ${progressHTML(s)}
      <div class="book-actions"><span class="meta">${s.pct}% correct</span>
      <a class="btn mint" href="#/book/${b.n}">${s.c + s.w ? 'Continue' : 'Start book'}</a></div></div></article>`;
  }).join('');
  const shopCards = shop.map(b => `<article class="card book locked">${coverHTML(b.n, b.title, b.level).replace('</div></div>', '</div></div>')}
      <div class="book-body"><div class="meta">Book ${b.n} &nbsp;|&nbsp; ${totalPuzzles(b)} puzzles &nbsp;|&nbsp; ${b.ch.length} chapters</div>
      <p class="desc">${esc(b.desc)}</p>
      <div class="book-actions"><span class="price">${CONFIG.currency}${CONFIG.prices[b.n]}</span>
      <button class="btn" data-buy="${b.n}">${ICON.lock.replace('width="20" height="20"', 'width="18" height="18"')} Unlock</button></div></div></article>`).join('');
  let soon = '';
  for (let n = BOOKS.length + 1; n <= CONFIG.totalBooks; n++)
    soon += `<article class="card book soon">${coverHTML(n, 'Coming soon', 'In preparation')}<div class="book-body"><div class="meta">Book ${n}</div><p class="desc">Our coaches are writing this book. It will appear here when it is ready.</p></div></article>`;

  app.innerHTML = shell(`
    <div class="greet"><div><h1>Hi, ${esc(u.name)}!</h1><p>${owned.length ? 'Pick a book and keep training.' : 'Unlock your first book to start solving puzzles.'}</p></div></div>
    ${owned.length ? `<div class="section-h"><h2>My books</h2></div><div class="books">${ownedCards}</div>` : ''}
    ${shop.length ? `<div class="section-h"><h2>${owned.length ? 'More books' : 'Books'}</h2></div><div class="books">${shopCards}${soon}</div>`
      : `<div class="section-h"><h2>Coming soon</h2></div><div class="books">${soon}</div>`}
  `);
  bindShell();
  app.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => openBuy(+b.dataset.buy));
}

/* ---------- purchase modal ---------- */
function closeModal() { const m = $('.modal-bg'); if (m) m.remove(); document.removeEventListener('keydown', escClose); }
function escClose(e) { if (e.key === 'Escape') closeModal(); }
function openBuy(n) {
  const b = bookByN(n);
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="card modal" role="dialog" aria-modal="true" aria-labelledby="mt">${coverHTML(b.n, b.title, b.level)}
    <div class="modal-body"><h2 id="mt">Book ${b.n}: ${esc(b.title)}</h2><p style="font-weight:600">${esc(b.desc)}</p>
    <div class="pcounts"><span>${totalPuzzles(b)} puzzles</span><span>${b.ch.length} chapters</span><span>Full solutions</span></div>
    <div class="row"><span>Total</span><span class="price">${CONFIG.currency}${CONFIG.prices[n]}</span></div>
    <p class="demo-note">Demo checkout: this preview does not take a real payment.</p>
    <div class="actions" style="justify-content:flex-end"><button class="btn ghost" data-x>Cancel</button><button class="btn" id="pay">Buy for ${CONFIG.currency}${CONFIG.prices[n]}</button></div></div></div>`;
  document.body.appendChild(bg);
  bg.onclick = e => { if (e.target === bg || e.target.closest('[data-x]')) closeModal(); };
  document.addEventListener('keydown', escClose);
  const pay = $('#pay'); pay.focus();
  pay.onclick = () => {
    pay.disabled = true; pay.textContent = 'Processing…';
    setTimeout(() => {
      Data.buy(n);
      $('.modal-body', bg).innerHTML = `<h2>Book unlocked!</h2><p style="font-weight:700">Book ${b.n}: ${esc(b.title)} is now in your library.</p>
        <div class="actions" style="justify-content:flex-end"><button class="btn ghost" data-x>Back to my books</button><a class="btn mint" href="#/book/${n}">Open book</a></div>`;
      $('.modal-body a', bg).focus();
      bg.onclick = e => { if (e.target === bg || e.target.closest('[data-x]')) { closeModal(); renderLibrary(); } };
      confetti();
    }, 900);
  };
}

/* =========================================================
   BOOK
   ========================================================= */
function nextTarget(b) {
  const d = Data.get(), lastCi = d.last[b.n];
  const order = lastCi != null ? [...b.ch.keys()].slice(lastCi).concat([...b.ch.keys()].slice(0, lastCi)) : [...b.ch.keys()];
  for (const ci of order) { const p = b.ch[ci].p.find(p => !Data.rec(p[0])); if (p) return p[0]; }
  for (const ci of order) { const p = b.ch[ci].p.find(p => Data.rec(p[0]).s === 'w'); if (p) return p[0]; }
  return null;
}
function chapterBadge(s) {
  if (s.c === s.total) return `<span class="badge done">${ICON.check.replace('<svg', '<svg width="14" height="14"')} Complete</span>`;
  if (s.c + s.w === 0) return `<span class="badge new">Not started</span>`;
  return `<span class="badge prog">${s.pct}% correct</span>`;
}
function renderBook(n) {
  const b = bookByN(n), s = statsFor(bookList(b)), target = nextTarget(b), col = colorFor(n);
  const chaps = b.ch.map((c, ci) => {
    const cs = statsFor(c.p);
    return `<a class="card chap${cs.c === cs.total ? ' done' : ''}" href="#/book/${n}/ch/${ci}">
      <span class="num">${cs.c === cs.total ? ICON.check.replace('<svg', '<svg width="28" height="28"') : ci + 1}</span>
      <span class="info"><span class="t">${esc(c.t)}</span>
        <span class="pbar" style="height:12px"><i class="c" style="width:${cs.c * 100 / cs.total}%"></i><i class="w" style="width:${cs.w * 100 / cs.total}%"></i></span>
        <span class="row"><span>${cs.total} puzzles${cs.w ? ` &nbsp;|&nbsp; ${cs.w} to fix` : ''}</span>${chapterBadge(cs)}</span></span></a>`;
  }).join('');
  app.innerHTML = shell(`
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/library">My books</a><span class="sep">/</span><span>Book ${n}</span></nav>
    <section class="card welcome ${col}">
      <div><div class="kicker">Book ${n} &nbsp;|&nbsp; ${esc(b.level)}</div><h1>Welcome to ${esc(b.title)}</h1><p>${esc(b.desc)} Choose any chapter below, or the one your coach gave you.</p>
        <div class="stats"><span class="chip"><i class="dot c"></i>${s.c} solved</span><span class="chip"><i class="dot w"></i>${s.w} to fix</span><span class="chip"><i class="dot u"></i>${s.u} to do</span>${s.stars ? `<span class="chip">${ICON.star.replace('<svg', '<svg width="18" height="18"')}${s.stars} first try</span>` : ''}</div></div>
      <div class="side"><div class="ring" style="--p:${s.pct}"><b>${s.pct}%</b></div>
        ${target ? `<a class="btn white" href="#/play/${target}">${s.c + s.w ? 'Continue' : 'Start training'}</a>` : `<span class="chip">${ICON.check.replace('<svg', '<svg width="18" height="18"')} Book complete</span>`}</div>
    </section>
    <div class="section-h"><h2>Chapters</h2></div>
    <div class="chapters">${chaps}</div>`);
  bindShell();
}

/* =========================================================
   CHAPTER
   ========================================================= */
function renderChapter(n, ci) {
  const b = bookByN(n), c = b.ch[ci], s = statsFor(c.p);
  Data.setLast(n, ci);
  const tiles = c.p.map((p, i) => {
    const r = Data.rec(p[0]), cls = r ? r.s : '';
    const mk = r && r.s === 'c' ? (r.star ? ICON.star : ICON.check) : r && r.s === 'w' ? ICON.fix : '';
    const lbl = `Puzzle ${i + 1}, ${r ? (r.s === 'c' ? (r.star ? 'solved first try' : 'solved') : 'to fix') : 'not started'}`;
    return `<a class="tile ${cls}" href="#/play/${p[0]}" aria-label="${lbl}">${i + 1}${mk ? `<span class="mk">${mk}</span>` : ''}</a>`;
  }).join('');
  const firstNew = c.p.find(p => !Data.rec(p[0])), firstFix = c.p.find(p => (Data.rec(p[0]) || {}).s === 'w');
  let cta = '';
  if (firstNew) cta += `<a class="btn" href="#/play/${firstNew[0]}">${s.c + s.w ? 'Continue' : 'Start chapter'}</a>`;
  if (firstFix) cta += `<a class="btn coral" href="#/play/${firstFix[0]}">Fix mistakes (${s.w})</a>`;
  app.innerHTML = shell(`
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/library">My books</a><span class="sep">/</span><a href="#/book/${n}">Book ${n}: ${esc(b.title)}</a><span class="sep">/</span><span>Chapter ${ci + 1}</span></nav>
    <div class="chap-head"><div><h1>${esc(c.t)}</h1><p class="task">${esc(taskFor(c.t))} &nbsp;${c.p.length} puzzles.</p></div>
      <div class="actions">${cta || `<span class="badge done" style="font-size:1rem;padding:6px 14px">${ICON.check.replace('<svg', '<svg width="18" height="18"')} Chapter complete</span>`}</div></div>
    <div class="card" style="padding:18px 20px;display:grid;gap:10px">${progressHTML(s)}</div>
    <div class="legend"><span><span class="tile c" style="width:22px;height:22px;border-radius:6px;box-shadow:none;border-width:2px"></span>Solved</span>
      <span>${ICON.star.replace('<svg', '<svg width="20" height="20"')}First try</span>
      <span><span class="tile w" style="width:22px;height:22px;border-radius:6px;box-shadow:none;border-width:2px"></span>To fix</span>
      <span><span class="tile" style="width:22px;height:22px;border-radius:6px;box-shadow:none;border-width:2px"></span>Not started</span></div>
    <div class="tiles">${tiles}</div>`);
  bindShell();
}

/* =========================================================
   PLAY
   ========================================================= */
const clean = s => s.replace(/[+#]/g, '');
function buildTree(pz) {
  const root = { kids: [] };
  for (const line of [pz.main, ...pz.alt]) {
    let node = root;
    for (const san of line) {
      let k = node.kids.find(x => clean(x.san) === clean(san));
      if (!k) { k = { san, kids: [] }; node.kids.push(k); }
      node = k;
    }
  }
  return root;
}
function renderPlay(id) {
  const pz = PUZ[id], b = bookByN(pz.book), ch = b.ch[pz.ci];
  Data.setLast(pz.book, pz.ci);
  const userColor = pz.fen.split(' ')[1];
  const S = { game: new Game(pz.fen), node: buildTree(pz), orient: userColor, sel: -1, last: null, marks: {}, moves: [], status: 'play', mistake: false, hint: false, busy: false, timers: [] };
  const later = (fn, ms) => S.timers.push(setTimeout(fn, ms));
  cleanup = () => { S.timers.forEach(clearTimeout); document.removeEventListener('keydown', onKey); };
  const prev = ch.p[pz.pi - 1], next = ch.p[pz.pi + 1];
  const nm = mateIn(pz.theme);

  app.innerHTML = shell(`
    <nav class="crumbs" aria-label="Breadcrumb"><a href="#/library">My books</a><span class="sep">/</span><a href="#/book/${pz.book}">Book ${pz.book}</a><span class="sep">/</span><a href="#/book/${pz.book}/ch/${pz.ci}">${esc(ch.t)}</a></nav>
    <div class="play">
      <div class="board-col"><div class="board" id="board" role="grid" aria-label="Chess board"></div>
        <div class="board-tools"><span class="pid">Puzzle ${pz.id} &nbsp;|&nbsp; Book page ${Math.floor(pz.pi / 4) + 1 + b.ch.slice(0, pz.ci).reduce((a, c) => a + c.p.length / 4, 0)}</span>
        <button class="btn ghost sm" id="flip">${ICON.flip} Flip board</button></div></div>
      <aside class="card panel">
        <div class="ptop"><span class="count">Puzzle ${pz.pi + 1} of ${ch.p.length}</span>
          <span class="turn ${userColor}"><i></i>${userColor === 'w' ? 'White' : 'Black'} to move</span></div>
        <div><h2>${esc(ch.t)}</h2><p class="task-box" style="margin-top:6px">${esc(taskFor(pz.theme))}</p></div>
        <div id="fb"></div>
        <div><div class="mini-label" style="margin-bottom:6px">Your moves</div><div class="moves" id="moves"></div></div>
        <div class="actions" id="acts"></div>
        <div><div class="mini-label" style="margin-bottom:8px">This chapter</div><div class="strip" id="strip"></div></div>
        <div class="actions" style="justify-content:space-between">
          ${prev ? `<a class="btn ghost sm" href="#/play/${prev[0]}">${ICON.back} Previous</a>` : '<span></span>'}
          ${next ? `<a class="btn ghost sm" href="#/play/${next[0]}">Next puzzle</a>` : `<a class="btn ghost sm" href="#/book/${pz.book}/ch/${pz.ci}">Chapter overview</a>`}
        </div>
      </aside>
    </div>`);
  bindShell();
  const boardEl = $('#board');

  function strip() {
    $('#strip').innerHTML = ch.p.map((p, i) => { const r = Data.rec(p[0]); return `<a href="#/play/${p[0]}" class="${r ? r.s : ''}${p[0] === id ? ' cur' : ''}" title="Puzzle ${i + 1}" aria-label="Puzzle ${i + 1}"></a>`; }).join('');
  }
  function feedback(kind, title, sub, icon) {
    $('#fb').innerHTML = `<div class="feedback ${kind} pop" role="status" aria-live="polite"><span class="ico">${icon}</span><div>${title}${sub ? `<div class="sub">${sub}</div>` : ''}</div></div>`;
  }
  function moveList() {
    const start = userColor === 'w' ? 0 : 1;
    $('#moves').innerHTML = S.moves.length ? S.moves.map((m, i) => {
      const ply = i + start, num = Math.floor(ply / 2) + 1, white = ply % 2 === 0;
      const pre = white ? `${num}. ` : (i === 0 ? `${num}... ` : '');
      return `<span class="m ${m.user ? 'u' : ''} ${m.bad ? 'x' : ''}">${pre}${esc(m.san)}</span>`;
    }).join('') : '<span class="empty">Make your move on the board.</span>';
  }
  function actions() {
    let h = '';
    if (S.status === 'play') h = `<button class="btn white sm" id="hint">${ICON.bulb.replace('<svg', '<svg width="18" height="18"')} Hint</button><button class="btn ghost sm" id="show">Show solution</button>`;
    else if (S.status === 'solved') h = next ? `<a class="btn mint" href="#/play/${next[0]}" id="nextbtn">Next puzzle</a>` : `<a class="btn mint" href="#/book/${pz.book}/ch/${pz.ci}" id="nextbtn">Finish chapter</a>`;
    else if (S.status === 'failed') h = `<button class="btn" id="retry">Try again</button><button class="btn ghost sm" id="show">Show solution</button>${next ? `<a class="btn ghost sm" href="#/play/${next[0]}">Skip for now</a>` : ''}`;
    else if (S.status === 'shown') h = `<button class="btn" id="retry">Try it yourself</button>${next ? `<a class="btn ghost sm" href="#/play/${next[0]}">Next puzzle</a>` : ''}`;
    $('#acts').innerHTML = h;
    const on = (s, f) => { const e = $(s); if (e) e.onclick = f; };
    on('#hint', giveHint); on('#show', showSolution); on('#retry', reset);
  }
  function draw() {
    const g = S.game, chkSq = g.inCheck() ? g.kingSq(g.turn) : -1;
    const dests = S.sel >= 0 ? g.moves().filter(m => m.from === S.sel) : [];
    let h = '';
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      const r = S.orient === 'w' ? 7 - row : row, f = S.orient === 'w' ? col : 7 - col, i = r * 8 + f, p = g.b[i];
      const cls = ['sq']; if ((r + f) % 2 === 0) cls.push('d');
      if (S.last && (S.last.from === i || S.last.to === i)) cls.push('last');
      if (S.sel === i) cls.push('sel');
      if (S.marks[i]) cls.push(S.marks[i]);
      if (i === chkSq) cls.push('chk');
      const mine = p && S.status === 'play' && !S.busy && g.turn === userColor && (p === p.toUpperCase() ? 'w' : 'b') === userColor;
      if (mine) cls.push('mine');
      const d = dests.find(m => m.to === i);
      const sqn = 'abcdefgh'[f] + (r + 1);
      h += `<div class="${cls.join(' ')}" data-sq="${i}" role="gridcell" tabindex="${row === 7 && col === 0 ? 0 : -1}" aria-label="${sqn}${p ? ' ' + pieceName(p) : ''}">`
        + (p ? `<span class="pc">${pieceSVG(p)}</span>` : '')
        + (d ? `<span class="mv${d.captured ? ' cap' : ''}"></span>` : '')
        + (row === 7 ? `<span class="co f">${'abcdefgh'[f]}</span>` : '') + (col === 0 ? `<span class="co r">${r + 1}</span>` : '')
        + '</div>';
    }
    boardEl.innerHTML = h;
  }
  function pieceName(p) { return (p === p.toUpperCase() ? 'white ' : 'black ') + { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }[p.toLowerCase()]; }

  /* ---- move handling ---- */
  function attempt(from, to) {
    const legal = S.game.moves().filter(m => m.from === from && m.to === to);
    if (!legal.length) return false;
    if (legal.some(m => m.promo)) { askPromo(from, to); return true; }
    commit(from, to);
    return true;
  }
  function askPromo(from, to) {
    const ov = document.createElement('div'); ov.className = 'promo';
    const pcs = ['q', 'r', 'b', 'n'].map(x => userColor === 'w' ? x.toUpperCase() : x);
    ov.innerHTML = `<div class="promo-box" role="dialog" aria-label="Choose a piece">${pcs.map(p => `<button data-p="${p.toLowerCase()}" aria-label="${pieceName(p)}">${pieceSVG(p)}</button>`).join('')}</div>`;
    boardEl.appendChild(ov);
    ov.querySelector('button').focus();
    ov.onclick = e => { const bt = e.target.closest('button'); ov.remove(); if (bt) commit(from, to, bt.dataset.p); else { S.sel = -1; draw(); } };
  }
  function commit(from, to, promo) {
    const m = S.game.move({ from, to, promo });
    if (!m) return;
    S.sel = -1; S.last = m; S.marks = {};
    const kid = S.node.kids.find(k => clean(k.san) === clean(m.san));
    if (kid || S.game.isCheckmate()) {
      S.moves.push({ san: m.san, user: true });
      if (kid && kid.kids.length && !S.game.isCheckmate()) {
        S.node = kid; S.busy = true; draw(); moveList();
        feedback('go', 'Good move!', 'Now see how your opponent answers.', ICON.check);
        later(() => {
          const reply = S.node.kids[0];
          const rm = S.game.move(reply.san);
          S.moves.push({ san: rm.san }); S.last = rm; S.node = reply; S.busy = false;
          if (!S.node.kids.length) { solved(); return; }
          draw(); moveList();
          feedback('go', 'Keep going!', `Your opponent played ${rm.san}. Find the next move.`, ICON.target);
        }, 650);
      } else { draw(); moveList(); solved(); }
    } else {
      S.moves.push({ san: m.san, user: true, bad: true });
      S.marks = { [m.to]: 'bad' }; S.busy = true;
      draw(); moveList();
      boardEl.classList.remove('shake'); void boardEl.offsetWidth; boardEl.classList.add('shake');
      markWrong();
      feedback('bad', 'Not this time.', `${m.san} does not work here. Look again: checks, captures and threats.`, ICON.cross);
      later(() => { S.game.undo(); S.last = null; S.marks = {}; S.busy = false; S.status = 'failed'; draw(); actions(); }, 900);
    }
  }
  function markWrong() {
    S.mistake = true;
    const r = Data.rec(id);
    if (!r || r.s !== 'c') Data.setRec(id, { s: 'w', tries: (r ? r.tries : 0) + 1, star: false });
    else Data.setRec(id, Object.assign({}, r, { tries: r.tries + 1 }));
    strip();
  }
  function solved() {
    S.status = 'solved'; S.busy = false;
    const r = Data.rec(id), first = !r && !S.mistake && !S.hint;
    const already = r && r.s === 'c';
    Data.setRec(id, { s: 'c', tries: (r ? r.tries : 0) + 1, star: already ? r.star : first });
    if (S.last) S.marks = { [S.last.to]: 'good' };
    draw(); moveList(); actions(); strip();
    const mate = S.game.isCheckmate();
    if (first) feedback('ok', mate ? 'Checkmate! Solved on the first try.' : 'Solved on the first try!', 'You earned a star for this puzzle.', ICON.star);
    else if (r && r.s === 'w') feedback('ok', mate ? 'Checkmate! Mistake fixed.' : 'Mistake fixed. Well done!', 'This puzzle now counts as solved.', ICON.check);
    else feedback('ok', mate ? 'Checkmate! Solved.' : 'Solved!', S.hint ? 'Next time, try it without the hint to earn a star.' : '', ICON.check);
    const cs = statsFor(ch.p);
    if (cs.c === cs.total && !already) { confetti(); toast('Chapter complete!'); }
    const nb = $('#nextbtn'); if (nb) nb.focus();
  }
  function giveHint() {
    if (S.status !== 'play' || S.busy) return;
    const k = S.node.kids[0]; if (!k) return;
    const m = S.game.moves().find(x => clean(x.san) === clean(k.san));
    S.hint = true; S.marks = { [m.from]: 'hint' }; S.sel = -1; draw();
    feedback('go', 'Hint', 'Move the highlighted piece. Where does it do the most damage?', ICON.bulb);
  }
  function showSolution() {
    if (S.busy) return;
    const r = Data.rec(id);
    if (!r || r.s !== 'c') { Data.setRec(id, { s: 'w', tries: (r ? r.tries : 0) + (S.status === 'failed' ? 0 : 1), star: false }); strip(); }
    S.game = new Game(pz.fen); S.moves = []; S.last = null; S.marks = {}; S.sel = -1; S.busy = true; S.status = 'shown';
    draw(); moveList(); $('#acts').innerHTML = '';
    feedback('go', 'Watch the solution', 'Then try it yourself to fix this puzzle.', ICON.bulb);
    pz.main.forEach((san, i) => later(() => {
      const m = S.game.move(san); S.last = m; S.moves.push({ san: m.san, user: i % 2 === 0 }); draw(); moveList();
      if (i === pz.main.length - 1) { S.busy = false; actions(); feedback('go', 'That is the solution.', pz.alt.length ? 'Other defences are possible, but the first move stays the same.' : 'Press "Try it yourself" to play it on the board.', ICON.bulb); }
    }, 700 + i * 850));
  }
  function reset() {
    S.timers.forEach(clearTimeout); S.timers = [];
    S.game = new Game(pz.fen); S.node = buildTree(pz); S.moves = []; S.last = null; S.marks = {}; S.sel = -1; S.busy = false; S.status = 'play'; S.mistake = false;
    draw(); moveList(); actions(); intro();
  }
  function intro() {
    const r = Data.rec(id);
    if (r && r.s === 'w') feedback('bad', 'Puzzle to fix', 'You missed this one before. Take your time.', ICON.fix);
    else if (r && r.s === 'c') feedback('', 'Already solved', 'Play it again to practise.', r.star ? ICON.star : ICON.check);
    else feedback('', 'Your move!', nm > 1 ? 'Play all your moves. The computer answers for your opponent.' : 'Drag a piece or tap it, then tap a square.', ICON.target);
  }

  /* ---- pointer: click + drag ---- */
  const sqAt = (x, y) => { const el = document.elementFromPoint(x, y); const s = el && el.closest('.sq'); return s && boardEl.contains(s) ? +s.dataset.sq : -1; };
  let drag = null;
  boardEl.addEventListener('pointerdown', e => {
    if (e.button !== 0 || S.status !== 'play' || S.busy || $('.promo', boardEl)) return;
    const sq = sqAt(e.clientX, e.clientY); if (sq < 0) return;
    const p = S.game.b[sq], mine = p && (p === p.toUpperCase() ? 'w' : 'b') === userColor;
    if (S.sel >= 0 && !mine) { attempt(S.sel, sq) || (S.sel = -1, draw()); return; }
    if (!mine) { S.sel = -1; draw(); return; }
    if (S.marks[sq] === 'hint') S.marks = {};
    const wasSel = S.sel === sq;
    S.sel = sq; draw();
    drag = { sq, x: e.clientX, y: e.clientY, on: false, wasSel, ghost: null };
    boardEl.setPointerCapture(e.pointerId);
  });
  boardEl.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.on && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) {
      drag.on = true;
      const size = boardEl.getBoundingClientRect().width / 8;
      const gh = document.createElement('div'); gh.className = 'drag-ghost'; gh.style.width = gh.style.height = size + 'px';
      gh.innerHTML = pieceSVG(S.game.b[drag.sq]); document.body.appendChild(gh); drag.ghost = gh;
      const from = boardEl.querySelector(`[data-sq="${drag.sq}"]`); from && from.classList.add('dragfrom');
    }
    if (drag.on) { drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px'; }
  });
  const endDrag = e => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.ghost) d.ghost.remove();
    if (d.on) {
      const to = sqAt(e.clientX, e.clientY);
      if (to >= 0 && to !== d.sq && attempt(d.sq, to)) return;
      draw();
    } else if (d.wasSel) { S.sel = -1; draw(); }
  };
  boardEl.addEventListener('pointerup', endDrag);
  boardEl.addEventListener('pointercancel', e => { if (drag && drag.ghost) drag.ghost.remove(); drag = null; draw(); });

  /* ---- keyboard: arrows move focus, Enter/Space selects ---- */
  function onKey(e) {
    const cur = document.activeElement && document.activeElement.closest && document.activeElement.closest('.sq');
    if (!cur || !boardEl.contains(cur)) return;
    const cells = [...boardEl.querySelectorAll('.sq')], idx = cells.indexOf(cur);
    const mv = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8 }[e.key];
    if (mv != null) { e.preventDefault(); const n = idx + mv; if (n >= 0 && n < 64) { cur.tabIndex = -1; cells[n].tabIndex = 0; cells[n].focus(); } return; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); if (S.status !== 'play' || S.busy) return;
      const sq = +cur.dataset.sq, p = S.game.b[sq], mine = p && (p === p.toUpperCase() ? 'w' : 'b') === userColor;
      if (S.sel >= 0 && !mine) { if (!attempt(S.sel, sq)) { S.sel = -1; draw(); } }
      else if (mine) { S.sel = S.sel === sq ? -1 : sq; draw(); }
      refocus(sq);
    }
  }
  function refocus(sq) { const el = boardEl.querySelector(`[data-sq="${sq}"]`); if (el) { boardEl.querySelectorAll('.sq').forEach(c => c.tabIndex = -1); el.tabIndex = 0; el.focus(); } }
  document.addEventListener('keydown', onKey);

  $('#flip').onclick = () => { S.orient = S.orient === 'w' ? 'b' : 'w'; draw(); };
  draw(); moveList(); actions(); strip(); intro();
}

/* ---------- celebrations ---------- */
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div'); c.className = 'confetti';
  const cols = ['#FFD043', '#3AD4AE', '#FF7A59', '#3A41D8', '#FFFFFF'];
  for (let i = 0; i < 80; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw'; p.style.background = cols[i % cols.length];
    p.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px'); p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    p.style.animationDelay = Math.random() * .4 + 's'; p.style.border = '2px solid #17175F';
    c.appendChild(p);
  }
  document.body.appendChild(c); setTimeout(() => c.remove(), 3200);
}
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }

Auth.restore().finally(render);
})();
