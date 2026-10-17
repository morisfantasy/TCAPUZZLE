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
const BOOK_TEXT={"es":{"description":"300 ejercicios originales para aprender el tablero, mover las piezas, defender y encontrar jaque mate.","journeyTitle":"Tu camino con White Pawn","journeySub":"Una idea cada vez. Cada página de práctica contiene doce diagramas.","chapters":[{"title":"Conoce el tablero","subtitle":"Lee el tablero y colócalo correctamente","theory":["Cada casilla tiene una letra (a-h) y un número (1-8). Busca su columna y su fila y escribe primero la letra: e y 4 forman e4.","Un tablero tiene 8 × 8 casillas. Con las blancas abajo, la esquina derecha debe ser clara.","En cada primera fila: torre, caballo y alfil desde cada esquina; la dama va en su propio color y el rey a su lado. Los peones empiezan delante."],"examples":["Mira el tablero","Busca la letra e debajo del tablero y el número 4 a un lado. Se cruzan en e4.","Consejo del entrenador","Comprueba el tamaño del tablero y la esquina derecha. Después compara ambas primeras filas y las filas de peones."],"instructions":["Escribe la casilla.","Comprueba cada posición inicial. Marca TODAS las piezas mal colocadas. Si el propio tablero está mal, indica por qué. Si todo es correcto, responde OK."]},{"title":"Torres, alfiles y damas","subtitle":"Detecta el obstáculo y después elige","theory":["La torre se mueve por filas y columnas, el alfil por diagonales y la dama de ambas formas.","Un alfil permanece siempre en casillas del mismo color. Ninguna de estas piezas puede saltar por encima de un obstáculo.","Peón = 1 punto; alfil y caballo = 3; torre = 5; dama = 9. Después de una captura, ¿puede el rival recapturar?"],"examples":["Bloqueo amigo","La torre de b2 no puede saltar por encima de su propio peón de b4.","Primer enemigo","El alfil de b2 puede capturar en d4, pero el peón corta su línea hacia f6.","¿Seguro o perdido?","Torre c2-c6 ataca el alfil. Torre c2-e2 pierde por ...Rxe2."],"instructions":["Marca TODAS las piezas enemigas que esta torre, alfil o dama puede capturar ahora. Un obstáculo corta la línea.","Haz la captura con la mayor ganancia de puntos. Resta el valor de tu pieza si puede ser recapturada inmediatamente.","Haz UNA jugada que ataque de forma segura la pieza marcada. ¿Puede ser capturada después tu torre, alfil o dama?"]},{"title":"El caballo","subtitle":"El saltador sorprendente","theory":["Un caballo salta dos casillas en una dirección y una hacia un lado: forma una L.","Puede saltar por encima de otras piezas y cambia el color de su casilla en cada jugada.","Un ataque doble, o tenedor, amenaza dos piezas enemigas a la vez. Localiza ambos objetivos antes de mover."],"examples":["Mira el tablero","Caballo d4xf5 captura la torre con un salto en L. Puede pasar por encima de piezas.","Consejo del entrenador","Comprueba dónde aterriza el caballo y qué ataca desde su nueva casilla."],"instructions":["¿Puede este caballo llegar a la casilla marcada con UN solo salto? Responde SÍ o NO.","Haz UN salto de caballo que ataque LAS DOS piezas enemigas marcadas.","Haz UN salto seguro que ataque dos piezas enemigas. En los últimos seis ejercicios, otro salto tentador pierde el caballo."]},{"title":"Peones y promoción","subtitle":"Avanza y después promociona","theory":["Un peón avanza una casilla, o dos desde su casilla inicial si ambas están libres. Captura en diagonal.","Las blancas avanzan hacia la fila 8 y las negras hacia la fila 1. Una pieza delante bloquea el avance.","En la última fila puedes elegir dama, torre, alfil o caballo. La dama casi siempre es la pieza más fuerte."],"examples":["Mira el tablero","El peón de e2 puede avanzar a e3 o e4, o capturar el peón negro de d3.","Consejo del entrenador","Un peón no puede convertirse en rey ni en otro peón. Los ejercicios especiales de promoción aparecen después de mate y ahogado."],"instructions":["Marca todas las casillas a las que el peón puede avanzar en línea recta, o NINGUNA. Un peón no puede saltar sobre ninguna pieza.","Marca todas las piezas enemigas que este peón puede capturar en diagonal, o NINGUNA. No puede capturar hacia delante.","Promociona el peón a dama en UNA jugada. Haz la jugada y elige D."]},{"title":"El rey y el jaque","subtitle":"Encuentra todas las formas de salir del jaque","theory":["El rey se mueve una casilla en cualquier dirección. Dos reyes nunca pueden estar uno junto al otro.","Jaque significa que tu rey está atacado. Debes escapar inmediatamente: mover el rey, bloquear la línea o capturar al atacante.","Nunca muevas tu rey a una casilla atacada. Después de bloquear, comprueba también la siguiente captura del rival."],"examples":["Tres respuestas al jaque","ESCAPAR: Rey e1-f2. BLOQUEAR: Alfil c4-e2. CAPTURAR: Torre h8xe8.","","Un rey también puede capturar a un atacante sin defensa. Practícalo en los ejercicios."],"instructions":["Marca TODAS las casillas a las que el rey puede llegar con seguridad en una jugada. Puede capturar una pieza enemiga sin defensa.","¿Está en JAQUE el rey del bando al que le toca mover? Responde SÍ o NO. Mira más allá de otras piezas para encontrar el ataque real.","Tu rey está en jaque. Haz UNA respuesta legal: mueve el rey, bloquea el ataque o captura al atacante."]},{"title":"Jaque y finales de partida","subtitle":"Hazte dos preguntas","theory":["¿Está atacado el rey? Si sí, está en JAQUE. Si ninguna pieza tiene una respuesta legal, es JAQUE MATE.","Sin jaque, AHOGADO significa que todo el bando no tiene ninguna jugada legal, ni siquiera con un peón o un alfil.","Si no hay jaque y existe al menos una jugada legal, elige NINGUNO. Una respuesta al jaque puede mover otra pieza."],"examples":["Jaque","El rey está atacado, pero puede capturar la torre.","Jaque mate","La dama de g7 está protegida por su rey; no hay respuesta.","Ahogado","No está en jaque; las negras no tienen ninguna jugada legal.","Ninguno","No está en jaque; las negras pueden mover."],"instructions":["Para el bando al que le toca mover, elige JAQUE, JAQUE MATE, AHOGADO o NINGUNO. ¿Está atacado el rey? ¿Puede responder ALGUNA pieza?","Coloca tu dama protegida justo delante del rey enemigo para dar mate en una. Después selecciona la pieza que la protege.","Encuentra mate en UNA salvo cuando la indicación diga PROMOCIONAR. En esas posiciones, elige la pieza que da mate o evita el ahogado."]},{"title":"Salva tus piezas","subtitle":"Cuatro formas de responder a un ataque","theory":["MUEVE la pieza atacada a una casilla segura, o CAPTURA la pieza que la ataca.","PROTEGER añade un defensor: si capturan tu pieza atacada, tu defensor puede recapturar.","BLOQUEA la línea de una torre, alfil o dama con otra pieza. Comprueba qué puede capturar después tu bloqueador."],"examples":["Mira el tablero","Alfil c4-e6 bloquea. Si la torre captura en e6, el peón f5xe6 recaptura.","Consejo del entrenador","En la última página, elige cualquier defensa segura sin que se indique el método."],"instructions":["La pieza marcada está atacada. Haz UNA jugada segura que la salve.","La pieza marcada está atacada. Protégela para que, si la capturan, una de tus piezas pueda recapturar.","La pieza marcada está atacada en una línea. Bloquea de forma segura y comprueba cómo puede recapturar tu bando.","La pieza marcada está atacada. Haz UNA defensa segura; elige cualquier método que funcione."]},{"title":"Enroque","subtitle":"Sigue al rey y elige seguridad","theory":["Para enrocar, mueve tu rey dos casillas hacia una torre y coloca esa torre al lado del rey.","Ninguna de las dos piezas puede haberse movido y no puede haber ninguna pieza entre ellas.","El rey no puede empezar, cruzar ni terminar en una casilla atacada. La torre o b1/b8 sí pueden estar atacadas. Si ambos enroques son legales, elige el refugio más seguro."],"examples":["Antes","Las blancas enrocan corto: rey e1-g1, torre h1-f1.","Después","Tras el enroque: rey g1, torre f1.","Enroque largo","Rey e1-c1; torre a1-d1."],"instructions":["Para el jugador indicado sobre cada tablero, selecciona todos los enroques legales. Si ninguno funciona, elige NO."]},{"title":"Mate de última fila y mate de escalera","subtitle":"Empuja y remata","theory":["Un mate de última fila atrapa al rey detrás de sus propios peones mientras una torre ataca a lo largo de la última fila.","En un mate de escalera, una torre quita la fila que queda detrás del rey mientras la otra da jaque y lo empuja hacia el borde.","Primero encuentra un jaque que obligue al rey a retroceder. Cerca del borde, comprueba todas las casillas de escape antes de elegir el mate."],"examples":["Trampa de última fila","La torre va de e7 a e8. Los peones encierran al rey.","Paso de escalera","La torre va de b8 a b5. Cualquier respuesta del rey lo hace avanzar una fila hacia el borde."],"instructions":["Encuentra un jaque mate en UNA jugada de torre: detecta la última fila o termina la escalera."]},{"title":"Ataques tempranos de dama","subtitle":"Detecta la amenaza y la respuesta","theory":["Al comienzo, solo el rey protege f7 para las negras y f2 para las blancas. Un alfil y una dama pueden atacar juntos.","Una captura de dama en f7 o f2 solo es mate si su camino está libre, está protegida y el rey no tiene respuesta.","Para defender, bloquea el camino de la dama, protege el objetivo o interrumpe al alfil. Pueden aparecer mates parecidos en h7/h2."],"examples":["Amenaza blanca","Dama h5xf7 es mate; alfil c4 protege f7.","Amenaza negra","Dama h4xf2 es mate; alfil c5 protege f2."],"instructions":["¿Puede la dama capturar ahora el peón marcado y dar JAQUE MATE? Responde SÍ/NO; si NO, descubre por qué.","Tu rival amenaza capturar con la dama el peón marcado y dar mate. Elige A/B y realiza la defensa."]}]},"fr":{"description":"300 exercices originaux pour apprendre l’échiquier, déplacer les pièces, défendre et trouver le mat.","journeyTitle":"Votre parcours White Pawn","journeySub":"Une idée à la fois. Chaque page d’exercices contient douze diagrammes.","chapters":[{"title":"Découvrir l’échiquier","subtitle":"Lire l’échiquier et le mettre en place","theory":["Chaque case a une lettre (a-h) et un chiffre (1-8). Trouvez sa colonne et sa rangée, puis écrivez d’abord la lettre : e et 4 donnent e4.","Un échiquier fait 8 × 8 cases. Avec les Blancs en bas, la case d’angle à droite est claire.","Sur chaque première rangée : tour, cavalier, fou depuis chaque coin ; la dame sur sa propre couleur, le roi à côté. Les pions commencent devant."],"examples":["Regardez l’échiquier","Trouvez la lettre e sous l’échiquier et le chiffre 4 sur le côté. Ils se croisent en e4.","Conseil du coach","Vérifiez la taille de l’échiquier et la case d’angle à droite. Comparez ensuite les deux premières rangées et les rangées de pions."],"instructions":["Écrivez la case.","Vérifiez chaque position initiale. Sélectionnez TOUTES les pièces mal placées. Si l’échiquier lui-même est incorrect, indiquez pourquoi. Si tout est correct, choisissez OK."]},{"title":"Tours, fous et dames","subtitle":"Repérez l’obstacle, puis choisissez","theory":["La tour se déplace sur les rangées et les colonnes, le fou sur les diagonales et la dame de ces deux façons.","Un fou reste toujours sur des cases de la même couleur. Aucune de ces pièces ne peut sauter par-dessus un obstacle.","Pion = 1 point ; fou et cavalier = 3 ; tour = 5 ; dame = 9. Après une prise, l’adversaire peut-il reprendre ?"],"examples":["Obstacle ami","La tour en b2 ne peut pas sauter par-dessus son propre pion en b4.","Premier ennemi","Le fou en b2 peut prendre d4, mais le pion coupe sa ligne vers f6.","Sûr ou perdu ?","Tour c2-c6 attaque le fou. Tour c2-e2 perd après ...Rxe2."],"instructions":["Sélectionnez TOUTES les pièces ennemies que cette tour, ce fou ou cette dame peut prendre maintenant. Un obstacle coupe la ligne.","Jouez la prise qui donne le meilleur gain de points. Soustrayez la valeur de votre pièce si elle peut être reprise immédiatement.","Jouez UN coup qui attaque la pièce marquée sans danger. Votre tour, fou ou dame peut-il être pris ensuite ?"]},{"title":"Le cavalier","subtitle":"Le sauteur surprenant","theory":["Un cavalier saute de deux cases dans une direction puis d’une case sur le côté : une forme en L.","Il peut sauter par-dessus les autres pièces et change de couleur de case à chaque coup.","Une double attaque, ou fourchette, menace deux pièces ennemies à la fois. Repérez les deux cibles avant de jouer."],"examples":["Regardez l’échiquier","Cavalier d4xf5 prend la tour avec un saut en L. Il peut passer par-dessus les pièces.","Conseil du coach","Vérifiez où arrive le cavalier et ce qu’il attaque depuis sa nouvelle case."],"instructions":["Ce cavalier peut-il atteindre la case marquée en UN saut ? Répondez OUI ou NON.","Jouez UN saut de cavalier qui attaque LES DEUX pièces ennemies marquées.","Jouez UN saut sûr qui attaque deux pièces ennemies. Dans les six derniers exercices, un autre saut tentant perd le cavalier."]},{"title":"Pions et promotion","subtitle":"Avancez, puis faites promotion","theory":["Un pion avance d’une case, ou de deux depuis sa case de départ si les deux cases sont libres. Il prend en diagonale.","Les Blancs avancent vers la 8e rangée et les Noirs vers la 1re. Une pièce devant le pion bloque son avance.","Sur la dernière rangée, choisissez une dame, une tour, un fou ou un cavalier. La dame est presque toujours la plus forte."],"examples":["Regardez l’échiquier","Le pion e2 peut avancer en e3 ou e4, ou prendre le pion noir en d3.","Conseil du coach","Un pion ne peut pas devenir un roi ni un autre pion. Les exercices spéciaux de promotion viennent après le mat et le pat."],"instructions":["Sélectionnez toutes les cases que le pion peut atteindre droit devant, ou AUCUNE. Un pion ne peut sauter par-dessus aucune pièce.","Sélectionnez toutes les pièces ennemies que ce pion peut prendre en diagonale, ou AUCUNE. Il ne peut pas prendre droit devant.","Faites promotion en dame en UN coup. Jouez le coup et choisissez D."]},{"title":"Le roi et l’échec","subtitle":"Trouvez toutes les façons de sortir de l’échec","theory":["Un roi se déplace d’une case dans n’importe quelle direction. Deux rois ne peuvent jamais être côte à côte.","Échec signifie que votre roi est attaqué. Répondez immédiatement : déplacez le roi, bloquez la ligne ou capturez l’attaquant.","Ne déplacez jamais votre roi sur une case attaquée. Après un blocage, vérifiez aussi la prochaine prise de l’adversaire."],"examples":["Trois réponses à l’échec","FUITE : Roi e1-f2. BLOCAGE : Fou c4-e2. PRISE : Tour h8xe8.","","Un roi peut aussi capturer un attaquant non protégé. Essayez-le dans les exercices."],"instructions":["Sélectionnez TOUTES les cases que le roi peut atteindre sans danger en un coup. Il peut capturer une pièce ennemie non protégée.","Le roi du camp au trait est-il en ÉCHEC ? Répondez OUI ou NON. Regardez au-delà des autres pièces pour trouver la vraie attaque.","Votre roi est en échec. Jouez UNE réponse légale : déplacez le roi, bloquez l’attaque ou capturez l’attaquant."]},{"title":"Échec et fins de partie","subtitle":"Posez-vous deux questions","theory":["Le roi est-il attaqué ? Si oui, il est en ÉCHEC. Si aucune pièce n’a de réponse légale, c’est ÉCHEC ET MAT.","Sans échec, le PAT signifie que tout le camp n’a aucun coup légal, même avec un pion ou un fou.","S’il n’y a pas échec et qu’au moins un coup légal existe, choisissez AUCUN. Une réponse à l’échec peut déplacer une autre pièce."],"examples":["Échec","Le roi est attaqué, mais il peut prendre la tour.","Échec et mat","La dame en g7 est protégée par son roi ; aucune réponse.","Pat","Pas d’échec ; les Noirs n’ont aucun coup légal.","Aucun","Pas d’échec ; les Noirs peuvent jouer."],"instructions":["Pour le camp au trait, choisissez ÉCHEC, ÉCHEC ET MAT, PAT ou AUCUN. Le roi est-il attaqué ? UNE pièce peut-elle répondre ?","Placez votre dame protégée juste devant le roi adverse pour mater en un coup. Sélectionnez ensuite la pièce qui la protège.","Trouvez le mat en UN coup sauf si l’indication dit PROMOTION. Dans ces positions, choisissez la pièce qui mate ou évite le pat."]},{"title":"Sauvez vos pièces","subtitle":"Quatre façons de répondre à une attaque","theory":["DÉPLACEZ la pièce attaquée vers une case sûre, ou CAPTUREZ la pièce qui l’attaque.","PROTÉGER ajoute un défenseur : si la pièce attaquée est prise, votre défenseur peut reprendre.","BLOQUEZ la ligne d’une tour, d’un fou ou d’une dame avec une autre pièce. Vérifiez ce qui peut ensuite prendre votre bloqueur."],"examples":["Regardez l’échiquier","Fou c4-e6 bloque. Si la tour prend e6, le pion f5xe6 reprend.","Conseil du coach","Sur la dernière page, choisissez n’importe quelle défense sûre sans indication de méthode."],"instructions":["La pièce marquée est attaquée. Jouez UN coup sûr qui la sauve.","La pièce marquée est attaquée. Protégez-la afin que, si elle est prise, une de vos pièces puisse reprendre.","La pièce marquée est attaquée sur une ligne. Bloquez sans danger, puis vérifiez comment votre camp peut reprendre.","La pièce marquée est attaquée. Jouez UNE défense sûre ; choisissez n’importe quelle méthode valable."]},{"title":"Le roque","subtitle":"Suivez le roi, puis choisissez la sécurité","theory":["Pour roquer, déplacez votre roi de deux cases vers une tour ; placez cette tour à côté du roi.","Aucune des deux pièces ne doit avoir bougé et aucune pièce ne doit se trouver entre elles.","Le roi ne peut pas commencer, traverser ou finir sur une case attaquée. La tour ou b1/b8 peuvent être attaquées. Si les deux roques sont légaux, choisissez l’abri le plus sûr."],"examples":["Avant","Les Blancs roquent côté roi : roi e1-g1, tour h1-f1.","Après","Après le roque : roi g1, tour f1.","Grand roque","Roi e1-c1 ; tour a1-d1."],"instructions":["Pour le joueur indiqué au-dessus de chaque échiquier, sélectionnez tous les roques légaux. Si aucun ne fonctionne, choisissez NON."]},{"title":"Mats de dernière rangée et en escalier","subtitle":"Repoussez, puis terminez","theory":["Un mat de dernière rangée enferme le roi derrière ses propres pions tandis qu’une tour attaque sur toute la dernière rangée.","Dans un mat en escalier, une tour retire la rangée derrière le roi tandis que l’autre donne échec et le pousse vers le bord.","Trouvez d’abord un échec qui force le roi à reculer. Près du bord, vérifiez toutes les cases de fuite avant de choisir le mat."],"examples":["Piège de dernière rangée","La tour va de e7 à e8. Les pions enferment le roi.","Étape de l’escalier","La tour va de b8 à b5. Chaque réponse du roi le rapproche d’une rangée du bord."],"instructions":["Trouvez un échec et mat en UN coup de tour : repérez la dernière rangée ou terminez l’escalier."]},{"title":"Attaques précoces de dame","subtitle":"Repérez la menace et la réponse","theory":["Au début, seul le roi protège f7 pour les Noirs et f2 pour les Blancs. Un fou et une dame peuvent attaquer ensemble.","Une prise de dame en f7 ou f2 n’est mat que si son trajet est libre, qu’elle est protégée et que le roi n’a aucune réponse.","Pour défendre, bloquez la route de la dame, protégez la cible ou interrompez le fou. Des mats similaires peuvent apparaître en h7/h2."],"examples":["Menace blanche","Dame h5xf7 est mat ; le fou c4 protège f7.","Menace noire","Dame h4xf2 est mat ; le fou c5 protège f2."],"instructions":["La dame peut-elle prendre maintenant le pion marqué et donner ÉCHEC ET MAT ? Répondez OUI/NON ; si NON, trouvez pourquoi.","Votre adversaire menace de prendre le pion marqué avec la dame et de mater. Choisissez A/B et jouez la défense."]}]},"zh":{"description":"300道原创练习，学习棋盘、棋子走法、防守以及将死。","journeyTitle":"你的 White Pawn 学习旅程","journeySub":"一次掌握一个概念。每一页练习都有十二个棋盘图。","chapters":[{"title":"认识棋盘","subtitle":"读懂棋盘并正确摆放","theory":["每个格子都有一个字母（a-h）和一个数字（1-8）。先找到纵线和横线，再先写字母：e 和 4 组成 e4。","棋盘是 8×8。白方在下方时，右下角必须是浅色格。","每方底线从角落开始依次是车、马、象；后放在自己颜色的格子上，王在后旁边。兵放在它们前面。"],"examples":["观察棋盘","找到棋盘下方的字母 e 和侧面的数字 4，它们相交在 e4。","教练提示","检查棋盘大小和右下角颜色，然后比较双方底线和兵线。"],"instructions":["写出格子名称。","检查每个初始摆法。选出所有摆错的棋子。如果棋盘本身有问题，指出原因。如果全部正确，选择 OK。"]},{"title":"车、象和后","subtitle":"先看障碍，再作选择","theory":["车沿横线和纵线移动，象沿斜线移动，后两者都可以。","象始终停留在同一种颜色的格子上。这些棋子都不能跳过阻挡物。","兵=1分；象和马=3分；车=5分；后=9分。吃子后，对手能立即回吃吗？"],"examples":["己方阻挡","b2 的车不能跳过自己在 b4 的兵。","第一个敌子","b2 的象可以吃 d4，但这个兵挡住了通往 f6 的路线。","安全还是会丢？","车 c2-c6 攻击象；车 c2-e2 会被 ...Rxe2 吃掉。"],"instructions":["选出这辆车、象或后现在能够吃掉的所有敌方棋子。阻挡物会截断路线。","走出净得分最高的吃子。如果你的棋子会立刻被回吃，要减去它的价值。","走一步安全地攻击标记的棋子。走完后，你的车、象或后会不会被吃？"]},{"title":"马","subtitle":"会跳跃的棋子","theory":["马沿一个方向走两格，再横向走一格，形成 L 形。","马可以跳过其他棋子，并且每走一步都会换到另一种颜色的格子。","双重攻击（叉）同时威胁两个敌方棋子。走之前先找出两个目标。"],"examples":["观察棋盘","马 d4xf5 用 L 形跳跃吃掉车，并且可以跳过其他棋子。","教练提示","检查马落在哪个格子，以及从新位置攻击哪些棋子。"],"instructions":["这匹马能否用一次跳跃到达标记格？选择 是 或 否。","走一步马，同时攻击两个被标记的敌方棋子。","走一步安全的马，同时攻击两个敌方棋子。最后六题中，另一个看似诱人的跳法会丢马。"]},{"title":"兵与升变","subtitle":"向前推进，然后升变","theory":["兵通常向前走一格；如果还在起始格且前两格都空，可以走两格。兵斜着吃子。","白兵向第8横线前进，黑兵向第1横线前进。正前方有棋子就不能前进。","到达最后一横线时，可以升变为后、车、象或马。后几乎总是最强。"],"examples":["观察棋盘","e2 的兵可以走到 e3 或 e4，也可以吃 d3 的黑兵。","教练提示","兵不能升变成王或另一个兵。特殊升变题会在将死与逼和之后出现。"],"instructions":["选出兵可以直线前进到达的所有格子，或选择 无。兵不能跳过任何棋子。","选出这个兵可以斜着吃掉的所有敌方棋子，或选择 无。兵不能向前吃子。","用一步将兵升变为后。走出这一步并选择 后。"]},{"title":"王与将军","subtitle":"找出所有解除将军的方法","theory":["王可以向任意方向走一格。两个王绝不能相邻。","将军表示你的王正在被攻击。必须立即应对：移动王、挡住攻击路线或吃掉攻击者。","绝不能把王走到被攻击的格子。挡住攻击后，还要检查对手下一步能否吃掉你的挡子。"],"examples":["三种应将方法","逃王：王 e1-f2。挡住：象 c4-e2。吃子：车 h8xe8。","","王也可以吃掉没有保护的攻击者。请在练习中尝试。"],"instructions":["选出王一步内可以安全到达的所有格子。王可以吃掉没有保护的敌子。","轮到走棋的一方，其王是否正在被将军？选择 是 或 否。要越过其他棋子检查真正的攻击路线。","你的王正在被将军。走一个合法应对：移动王、挡住攻击或吃掉攻击者。"]},{"title":"将军与对局结束","subtitle":"先问自己两个问题","theory":["王是否被攻击？如果是，就是将军。如果没有任何棋子可以合法应对，就是将死。","在没有将军的情况下，如果整方都没有合法走法，即为逼和；即使兵或象也无棋可走。","如果没有将军且至少有一个合法走法，选择 无。应将不一定要移动王，也可以走其他棋子。"],"examples":["将军","王被攻击，但可以吃掉车。","将死","g7 的后被自己的王保护；没有应对。","逼和","没有被将军；黑方没有任何合法走法。","无","没有被将军；黑方仍有合法走法。"],"instructions":["对轮到走棋的一方，选择 将军、将死、逼和 或 无。王是否被攻击？是否有任何棋子能够应对？","把受保护的后直接放到敌王前方一步将死，并选择保护后的棋子。","除非提示写着 升变，否则都要找一步将死。在升变题中，选择能够将死或避免逼和的升变棋子。"]},{"title":"拯救你的棋子","subtitle":"应对攻击的四种方法","theory":["把被攻击的棋子移动到安全格，或者吃掉正在攻击它的棋子。","保护：增加一个防守者。如果被攻击棋子被吃，你的防守者可以回吃。","用另一枚棋子挡住车、象或后的攻击路线。然后检查对方能否吃掉你的挡子。"],"examples":["观察棋盘","象 c4-e6 挡住攻击。如果车吃 e6，兵 f5xe6 可以回吃。","教练提示","最后一页没有指定方法，只要选择任何一种安全防守即可。"],"instructions":["被标记的棋子正在被攻击。走一步安全的棋把它救下来。","被标记的棋子正在被攻击。保护它，使得如果它被吃，你的某个棋子可以回吃。","被标记的棋子正在一条线上被攻击。安全地挡住攻击，然后检查己方如何回吃。","被标记的棋子正在被攻击。走一步安全防守；任何有效方法都可以。"]},{"title":"王车易位","subtitle":"跟着王走，再选择安全位置","theory":["王车易位时，王朝一辆车方向走两格，再把那辆车放到王旁边。","王和参与易位的车都不能移动过，并且它们之间不能有棋子。","王不能从被攻击的格子出发、经过或停在被攻击的格子。车本身或 b1/b8 可以被攻击。如果两边都能易位，选择更安全的一边。"],"examples":["之前","白方王翼易位：王 e1-g1，车 h1-f1。","之后","易位后：王 g1，车 f1。","后翼易位","王 e1-c1；车 a1-d1。"],"instructions":["根据棋盘上方指定的一方，选出所有合法的易位方式。如果两边都不行，选择 否。"]},{"title":"底线将死与阶梯将死","subtitle":"逼退，再完成将死","theory":["底线将死是把王困在自己兵的后面，同时用车沿最后一横线攻击。","阶梯将死中，一辆车封住王身后的横线，另一辆车将军并把王一步步逼向边线。","先找到能迫使王后退的将军。接近边线时，在选择将死前检查所有逃跑格。"],"examples":["底线陷阱","车从 e7 走到 e8。兵把王困住。","阶梯一步","车从 b8 走到 b5。王的每种应对都会被逼向边线一横线。"],"instructions":["用车一步将死：识别底线将死，或完成阶梯将死。"]},{"title":"开局早期的后攻击","subtitle":"看懂威胁和应对","theory":["开局时，黑方的 f7 和白方的 f2 都只有王在保护。象和后可以联手攻击。","后在 f7 或 f2 吃兵只有在路线畅通、后受到保护且王没有应对时才是将死。","防守时，可以挡住后的路线、保护目标，或切断象的保护。类似的将死也可能发生在 h7/h2。"],"examples":["白方威胁","后 h5xf7 将死；象 c4 保护 f7。","黑方威胁","后 h4xf2 将死；象 c5 保护 f2。"],"instructions":["后现在能否吃掉标记的兵并形成将死？选择 是/否；如果否，找出原因。","对手威胁用后吃掉被标记的兵并将死。选择 A/B，并走出防守。"]}]},"yue":{"description":"300題原創練習，學識棋盤、棋子行法、防守同埋將死。","journeyTitle":"你嘅 White Pawn 學習旅程","journeySub":"一次學一個概念。每一頁練習都有十二個棋盤圖。","chapters":[{"title":"認識棋盤","subtitle":"睇懂棋盤同正確擺棋","theory":["每個格都有一個字母（a-h）同一個數字（1-8）。先搵直線同橫線，再先寫字母：e 同 4 就係 e4。","棋盤係 8×8。白方喺下面時，右下角一定係淺色格。","每邊底線由角落開始係車、馬、象；后放喺自己顏色嘅格，王喺后隔離。兵放喺前面。"],"examples":["睇棋盤","搵棋盤下面嘅 e 同側邊嘅 4，佢哋交界就係 e4。","教練提示","檢查棋盤大小同右下角顏色，再比較兩邊底線同兵線。"],"instructions":["寫出格名。","檢查每個開局擺法。揀出所有擺錯嘅棋。如果棋盤本身有問題，指出原因。如果全部正確，就揀 OK。"]},{"title":"車、象同后","subtitle":"先睇阻擋，再作選擇","theory":["車沿橫線同直線行，象沿斜線行，后兩種都可以。","象永遠留喺同一隻顏色嘅格。呢啲棋都唔可以跳過阻擋物。","兵=1分；象同馬=3分；車=5分；后=9分。食完之後，對手可唔可以即刻食返？"],"examples":["自己棋阻住","b2 嘅車唔可以跳過自己 b4 嘅兵。","第一隻敵棋","b2 嘅象可以食 d4，但個兵截住咗去 f6 嘅線。","安全定會輸？","車 c2-c6 攻擊象；車 c2-e2 會俾 ...Rxe2 食。"],"instructions":["揀出呢隻車、象或者后而家可以食到嘅所有敵棋。阻擋物會截斷條線。","行出淨得分最高嘅食子。如果你隻棋會即刻俾人食返，就要扣返佢嘅分值。","行一步安全噉攻擊標記嘅棋。行完之後，你嘅車、象或者后會唔會俾人食？"]},{"title":"馬","subtitle":"識跳嘅棋子","theory":["馬向一個方向行兩格，再向側邊行一格，形成 L 形。","馬可以跳過其他棋，而且每行一步都會去另一種顏色嘅格。","雙重攻擊（叉）會同時威脅兩隻敵棋。行之前先搵晒兩個目標。"],"examples":["睇棋盤","馬 d4xf5 用 L 形跳法食咗車，而且可以跳過其他棋。","教練提示","睇清楚馬落喺邊個格，同埋由新位置攻擊邊啲棋。"],"instructions":["呢隻馬可唔可以一跳去到標記格？揀 係 或 唔係。","行一步馬，同時攻擊兩隻標記咗嘅敵棋。","行一步安全嘅馬，同時攻擊兩隻敵棋。最後六題入面，另一個睇落吸引嘅跳法會輸馬。"]},{"title":"兵同升變","subtitle":"向前行，再升變","theory":["兵通常向前行一格；如果仲喺起始格，而且前面兩格都空，可以行兩格。兵斜線食子。","白兵向第8橫線行，黑兵向第1橫線行。正前面有棋就行唔到。","去到最後一橫線，可以升變做后、車、象或者馬。后差唔多永遠最強。"],"examples":["睇棋盤","e2 嘅兵可以行去 e3 或 e4，亦可以食 d3 嘅黑兵。","教練提示","兵唔可以變做王或者另一隻兵。特別升變題會喺將死同逼和之後出現。"],"instructions":["揀出兵可以直行去到嘅所有格，或者揀 冇。兵唔可以跳過任何棋。","揀出呢隻兵可以斜線食到嘅所有敵棋，或者揀 冇。兵唔可以向前食子。","用一步將兵升變做后。行出呢步，再揀 后。"]},{"title":"王同將軍","subtitle":"搵晒所有解將方法","theory":["王可以向任何方向行一格。兩個王永遠唔可以貼住。","將軍即係你嘅王正被攻擊。一定要即刻應對：走王、擋住條線，或者食咗攻擊者。","永遠唔好將王行去被攻擊嘅格。擋住之後，都要再睇對手下一步可唔可以食你隻擋子。"],"examples":["三種解將方法","走王：王 e1-f2。擋住：象 c4-e2。食子：車 h8xe8。","","王亦可以食一隻冇保護嘅攻擊者。喺練習試下。"],"instructions":["揀出王一步之內可以安全去到嘅所有格。王可以食冇保護嘅敵棋。","輪到行棋嗰邊，個王係咪被將軍？揀 係 或 唔係。要睇穿其他棋，搵真正嘅攻擊線。","你嘅王被將軍。行一個合法應對：走王、擋住攻擊，或者食咗攻擊者。"]},{"title":"將軍同對局完結","subtitle":"先問自己兩個問題","theory":["個王係咪被攻擊？如果係，就係將軍。如果冇任何棋可以合法應對，就係將死。","冇將軍嘅情況下，如果成邊都冇合法步，包括兵或者象都冇得行，就係逼和。","如果冇將軍而且至少有一步合法棋，就揀 冇。解將唔一定要走王，可以行其他棋。"],"examples":["將軍","王被攻擊，但可以食咗架車。","將死","g7 嘅后有自己個王保護；冇應對。","逼和","冇被將軍；黑方冇任何合法步。","冇","冇被將軍；黑方仲有合法步。"],"instructions":["對輪到行棋嗰邊，揀 將軍、將死、逼和 或 冇。個王係咪被攻擊？有冇任何棋可以應對？","將受保護嘅后直接放喺敵王前面一步將死，再揀保護后嗰隻棋。","除非提示寫住 升變，否則都要搵一步將死。升變題要揀可以將死或者避免逼和嘅棋。"]},{"title":"救你嘅棋","subtitle":"應對攻擊嘅四種方法","theory":["將被攻擊嘅棋移去安全格，或者食咗攻擊佢嗰隻棋。","保護：加一個防守者。如果被攻擊嘅棋俾人食，你嘅防守者可以食返。","用另一隻棋擋住車、象或者后嘅攻擊線。之後要睇對手可唔可以食你隻擋子。"],"examples":["睇棋盤","象 c4-e6 擋住攻擊。如果車食 e6，兵 f5xe6 可以食返。","教練提示","最後一頁唔會提示方法，只要揀任何一個安全防守就得。"],"instructions":["標記咗嘅棋被攻擊。行一步安全棋救返佢。","標記咗嘅棋被攻擊。保護佢，等佢如果俾人食，你其中一隻棋可以食返。","標記咗嘅棋喺一條線上被攻擊。安全噉擋住，再睇自己點樣食返。","標記咗嘅棋被攻擊。行一步安全防守；任何有效方法都得。"]},{"title":"王車易位","subtitle":"跟住個王，再揀安全位置","theory":["王車易位時，王向一架車方向行兩格，再將嗰架車放喺王隔離。","王同參與易位嘅車都唔可以行過，而且中間唔可以有棋。","王唔可以由被攻擊嘅格開始、經過或者停喺被攻擊嘅格。架車本身或者 b1/b8 可以被攻擊。如果兩邊都可以易位，揀較安全嗰邊。"],"examples":["之前","白方王翼易位：王 e1-g1，車 h1-f1。","之後","易位後：王 g1，車 f1。","后翼易位","王 e1-c1；車 a1-d1。"],"instructions":["按棋盤上面指定嗰邊，揀出所有合法易位。如果兩邊都唔得，揀 否。"]},{"title":"底線將死同階梯將死","subtitle":"逼退，再完成將死","theory":["底線將死係將個王困喺自己啲兵後面，再用車沿最後一條橫線攻擊。","階梯將死入面，一架車封住王後面嗰條橫線，另一架車將軍並一步步逼個王去邊線。","先搵一個可以迫王後退嘅將軍。接近邊線時，揀將死之前要檢查晒所有逃走格。"],"examples":["底線陷阱","車由 e7 行去 e8。啲兵困住個王。","階梯一步","車由 b8 行去 b5。王每一個應對都會被逼近邊線一條橫線。"],"instructions":["用車一步將死：搵到底線將死，或者完成階梯將死。"]},{"title":"開局早期嘅后攻擊","subtitle":"睇清威脅同應對","theory":["開局時，黑方 f7 同白方 f2 都只有王保護。象同后可以一齊攻擊。","后喺 f7 或 f2 食兵，只有喺路線暢通、后有保護，而且個王冇應對時先係將死。","防守可以擋住后嘅路線、保護目標，或者截斷象嘅保護。類似將死亦可能出現喺 h7/h2。"],"examples":["白方威脅","后 h5xf7 將死；象 c4 保護 f7。","黑方威脅","后 h4xf2 將死；象 c5 保護 f2。"],"instructions":["后而家可唔可以食標記嘅兵並將死？揀 係/唔係；如果唔係，搵出原因。","對手威脅用后食標記嘅兵並將死。揀 A/B，再行出防守。"]}]}};
function bookCopy(ci){
  const ch=BOOK.ch[ci], loc=BOOK_TEXT[lang]?.chapters?.[ci];
  return loc||ch;
}
function bookDescription(){ return BOOK_TEXT[lang]?.description||BOOK.description; }
function journeyTitle(){ return BOOK_TEXT[lang]?.journeyTitle||'Your White Pawn journey'; }
function journeySub(){ return BOOK_TEXT[lang]?.journeySub||'One idea at a time. Every practice page holds twelve diagrams.'; }
function bookInstruction(ci,pi){ return BOOK_TEXT[lang]?.chapters?.[ci]?.instructions?.[pi]||BOOK.ch[ci].practice[pi].instruction; }
function bookLabel(s){
  if(lang==='en') return s||'';
  let x=String(s||'');
  const maps={
    es:[['WHITE TO MOVE','JUEGAN BLANCAS'],['BLACK TO MOVE','JUEGAN NEGRAS'],['WHITE /','BLANCAS /'],['BLACK /','NEGRAS /'],['MATE IN ONE','MATE EN UNA'],['SAFE KING MOVES','JUGADAS SEGURAS DEL REY'],['IN CHECK?','¿EN JAQUE?'],['ESCAPE CHECK','SALIR DEL JAQUE'],['DOUBLE ATTACK','ATAQUE DOBLE'],['SAFE ATTACK','ATAQUE SEGURO'],['SAVE PIECE','SALVAR PIEZA'],['PROTECT','PROTEGER'],['BLOCK','BLOQUEAR'],['PROMOTE','PROMOCIONAR'],['Qxf7 MATE?','¿Qxf7 MATE?'],['Qxf2 MATE?','¿Qxf2 MATE?']],
    fr:[['WHITE TO MOVE','AUX BLANCS'],['BLACK TO MOVE','AUX NOIRS'],['WHITE /','BLANCS /'],['BLACK /','NOIRS /'],['MATE IN ONE','MAT EN UN'],['SAFE KING MOVES','CASES SÛRES DU ROI'],['IN CHECK?','EN ÉCHEC ?'],['ESCAPE CHECK','SORTIR DE L’ÉCHEC'],['DOUBLE ATTACK','DOUBLE ATTAQUE'],['SAFE ATTACK','ATTAQUE SÛRE'],['SAVE PIECE','SAUVER LA PIÈCE'],['PROTECT','PROTÉGER'],['BLOCK','BLOQUER'],['PROMOTE','PROMOTION'],['Qxf7 MATE?','Qxf7 MAT ?'],['Qxf2 MATE?','Qxf2 MAT ?']],
    zh:[['WHITE TO MOVE','白方走'],['BLACK TO MOVE','黑方走'],['WHITE /','白方 /'],['BLACK /','黑方 /'],['MATE IN ONE','一步将死'],['SAFE KING MOVES','王的安全走法'],['IN CHECK?','是否将军？'],['ESCAPE CHECK','解除将军'],['DOUBLE ATTACK','双重攻击'],['SAFE ATTACK','安全攻击'],['SAVE PIECE','拯救棋子'],['PROTECT','保护'],['BLOCK','挡住'],['PROMOTE','升变'],['Qxf7 MATE?','Qxf7 将死？'],['Qxf2 MATE?','Qxf2 将死？']],
    yue:[['WHITE TO MOVE','白方行'],['BLACK TO MOVE','黑方行'],['WHITE /','白方 /'],['BLACK /','黑方 /'],['MATE IN ONE','一步將死'],['SAFE KING MOVES','王嘅安全行法'],['IN CHECK?','係咪將軍？'],['ESCAPE CHECK','解將'],['DOUBLE ATTACK','雙重攻擊'],['SAFE ATTACK','安全攻擊'],['SAVE PIECE','救棋'],['PROTECT','保護'],['BLOCK','擋住'],['PROMOTE','升變'],['Qxf7 MATE?','Qxf7 將死？'],['Qxf2 MATE?','Qxf2 將死？']]
  }[lang]||[];
  maps.forEach(([a,b])=>{x=x.replaceAll(a,b);});
  return x;
}
const LANG_SHORT={en:'EN',zh:'普',yue:'粵',es:'ES',fr:'FR'};
function langSelect(id='lang'){
  return '<div class="lang-picker" id="'+id+'"><button type="button" class="lang-button" aria-haspopup="true" aria-expanded="false"><span class="lang-globe">🌐</span><span class="lang-code">'+esc(LANG_SHORT[lang])+'</span><span class="lang-name">'+esc(LANGS[lang])+'</span><span class="lang-caret">▼</span></button><div class="lang-menu" role="menu">'+
    Object.entries(LANGS).map(([k,v])=>'<button type="button" class="lang-option '+(lang===k?'active':'')+'" data-lang="'+k+'" role="menuitem"><span class="short">'+esc(LANG_SHORT[k])+'</span><span>'+esc(v)+'</span><span class="tick">'+(lang===k?'✓':'')+'</span></button>').join('')+
    '</div></div>';
}
function bindLang(){
  $$('.lang-picker').forEach(p=>{
    const b=$('.lang-button',p);
    b.onclick=e=>{
      e.stopPropagation();
      const open=p.classList.toggle('open');
      b.setAttribute('aria-expanded',open?'true':'false');
      $$('.lang-picker').filter(x=>x!==p).forEach(x=>{
        x.classList.remove('open');
        const xb=$('.lang-button',x); if(xb) xb.setAttribute('aria-expanded','false');
      });
    };
    $$('.lang-option',p).forEach(o=>o.onclick=e=>{
      e.stopPropagation();
      lang=o.dataset.lang;
      try{localStorage.setItem('tca.lang',lang)}catch{}
      render();
    });
  });
  document.onclick=()=>$$('.lang-picker').forEach(p=>{
    p.classList.remove('open');
    const b=$('.lang-button',p); if(b)b.setAttribute('aria-expanded','false');
  });
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
    '<div class="wp-book-info"><span class="badge prog">LEVEL 1 · VOLUME 1</span><h2>White Pawn</h2><p>'+esc(bookDescription())+'</p><div class="wp-metrics"><b>300</b> '+esc(t('exercises'))+' · <b>10</b> '+esc(t('chapters'))+'</div>'+progressBar(s)+
    '<a class="btn mint" href="#/book/1">'+esc(s.c||s.w?t('continue'):t('openBook'))+'</a></div></article></div>');
  bindShell();
}
function progressBar(s){
  return '<div class="wp-progress"><div class="wp-progress-track"><i style="width:'+s.pct+'%"></i></div><div class="wp-progress-meta"><span>'+s.c+' '+esc(t('solved'))+'</span><span>'+s.pct+'%</span></div></div>';
}
function renderBook(){
  const cards=BOOK.ch.map((ch,ci)=>{
    const list=chapterExercises(ci),s=stat(list);
    return '<a class="card wp-chapter-card" href="#/book/1/ch/'+ci+'"><span class="wp-ch-num">'+String(ci+1).padStart(2,'0')+'</span><div><span class="mini-label">'+esc(t('chapter'))+' '+(ci+1)+'</span><h2>'+esc(bookCopy(ci).title)+'</h2><p>'+esc(bookCopy(ci).subtitle)+'</p><div class="wp-ch-meta">'+list.length+' '+esc(t('exercises'))+' · '+s.c+' '+esc(t('solved'))+'</div>'+progressBar(s)+'</div><span class="wp-arrow">›</span></a>';
  }).join('');
  root.innerHTML=shell('<nav class="crumbs"><a href="#/library">'+esc(t('myBooks'))+'</a><span class="sep">/</span><span>White Pawn</span></nav>'+
    '<section class="wp-book-head"><div><span class="badge prog">LEVEL 1 · VOLUME 1</span><h1>White Pawn</h1><p>'+esc(bookDescription())+'</p></div><div class="wp-big-pawn">'+pieceSVG('P')+'</div></section>'+
    '<div class="wp-journey"><h2>'+esc(journeyTitle())+'</h2><p>'+esc(journeySub())+'</p></div><div class="wp-chapters">'+cards+'</div>');
  bindShell();
}
function renderChapter(ci){
  const ch=BOOK.ch[ci]; if(!ch)return go('#/book/1');
  const copy=bookCopy(ci);
  const theory='<section class="card wp-theory"><div class="wp-theory-head"><span class="mini-label">'+esc(t('lesson'))+'</span><h2>'+esc(copy.title)+'</h2><p>'+esc(copy.subtitle)+'</p></div><div class="wp-theory-body"><h3>'+esc(t('theory'))+'</h3><ul>'+copy.theory.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+
    (copy.examples?.length?'<h3>'+esc(t('examples'))+'</h3><div class="wp-example-grid">'+pairExamples(copy.examples)+'</div>':'')+'</div></section>';
  const pages=ch.practice.map((pg,pi)=>{
    const s=stat(pg.exercises);
    return '<section class="card wp-practice"><div class="wp-practice-head"><div><span class="mini-label">'+esc(t('page'))+' '+pg.page+'</span><h3>'+esc(bookInstruction(ci,pi))+'</h3></div><span class="badge">'+s.c+'/'+s.total+'</span></div><div class="wp-ex-grid">'+pg.exercises.map(ex=>exerciseTile(ex)).join('')+'</div></section>';
  }).join('');
  root.innerHTML=shell('<nav class="crumbs"><a href="#/library">'+esc(t('myBooks'))+'</a><span class="sep">/</span><a href="#/book/1">White Pawn</a><span class="sep">/</span><span>'+esc(t('chapter'))+' '+(ci+1)+'</span></nav>'+
    '<header class="wp-chapter-head"><span class="wp-ch-num">'+String(ci+1).padStart(2,'0')+'</span><div><span class="mini-label">'+esc(t('chapter'))+' '+(ci+1)+'</span><h1>'+esc(copy.title)+'</h1><p>'+esc(copy.subtitle)+'</p></div></header>'+theory+'<div class="section-h"><h2>'+esc(t('practice'))+'</h2></div>'+pages);
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
  const ch=BOOK.ch[ex.ci], copy=bookCopy(ex.ci), pg=ch.practice[ex.pi], prev=BY_ID[id-1], next=BY_ID[id+1];
  const state={selected:new Set(),from:null,to:null,promo:null,guard:null,special:null,choice:null,revealed:false};
  root.innerHTML=shell('<nav class="crumbs"><a href="#/library">'+esc(t('myBooks'))+'</a><span class="sep">/</span><a href="#/book/1">White Pawn</a><span class="sep">/</span><a href="#/book/1/ch/'+ex.ci+'">'+esc(copy.title)+'</a></nav>'+
    '<div class="wp-play"><div class="wp-board-col"><div id="exerciseBoard">'+boardHtml(ex,true)+'</div><div class="wp-book-page">'+esc(t('page'))+' '+pg.page+' · '+esc(t('exercise'))+' '+String(ex.id).padStart(3,'0')+'</div></div>'+
    '<aside class="card wp-task"><div class="wp-task-top"><span class="count">'+esc(t('exercise'))+' '+String(ex.id).padStart(3,'0')+'</span><span class="badge">'+esc(bookLabel(ex.label||''))+'</span></div>'+
    '<h2>'+esc(copy.title)+'</h2><p class="wp-instruction">'+esc(bookInstruction(ex.ci,ex.pi))+'</p><div class="wp-help" id="help"></div><div id="controls"></div><div id="feedback"></div>'+
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