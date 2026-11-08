const words={
levels:'Mastery levels|Niveles de dominio|Niveaux de maîtrise|掌握程度|掌握程度',learning:'Learning|Aprendiendo|En apprentissage|学习中|學習中',progressing:'In progress|En progreso|En cours|进步中|進步中',consolidated:'Consolidated|Consolidadas|Consolidées|已巩固|已鞏固',
trainLine:'Train this line|Entrenar esta variante|Travailler cette variante|训练此变化|訓練這條變化',
openings:'Openings|Aperturas|Ouvertures|开局|開局',catalog:'Opening repertoires|Repertorios de aperturas|Répertoires d’ouvertures|开局谱库|開局棋譜庫',
back:'All repertoires|Todos los repertorios|Tous les répertoires|全部开局|所有棋譜',product:'Repertoire|Repertorio|Répertoire|开局谱|棋譜',study:'Learn|Aprender|Étudier|学习|學習',
train:'Start Training|Empezar a entrenar|Commencer la séance|开始训练|開始訓練',resume:'Resume session|Reanudar sesión|Reprendre la séance|继续训练|繼續訓練',
preview:'Free preview|Vista previa gratuita|Aperçu gratuit|免费预览|免費預覽',view:'Explore repertoire|Ver repertorio|Voir le répertoire|查看开局谱|查看棋譜',owned:'Purchased or granted|Con acceso|Accès acquis|已解锁|已解鎖',
w:'White|Blancas|Blancs|白方|白方',b:'Black|Negras|Noirs|黑方|黑方',side:'Training side|Color de entrenamiento|Couleur travaillée|训练方|訓練方',
lines:'Lines|Variantes|Variantes|变化|變化',positions:'Training positions|Posiciones entrenables|Positions à travailler|训练局面|訓練局面',chapters:'Chapters|Capítulos|Chapitres|章节|章節',
price:'Price|Precio|Prix|价格|價格',once:'One-time purchase|Pago único|Paiement unique|一次性购买|一次性購買',buy:'Buy for {0}|Comprar por {0}|Acheter pour {0}|以 {0} 购买|以 {0} 購買',
closed:'Checkout is not open yet.|La compra aún no está abierta.|Les achats ne sont pas encore ouverts.|暂未开放购买。|暫未開放購買。',test:'Test checkout|Pago de prueba|Paiement de test|测试支付|測試付款',
login:'Sign in|Iniciar sesión|Se connecter|登录|登入',manage:'Manage repertoires|Administrar repertorios|Gérer les répertoires|管理开局谱|管理棋譜',history:'Purchase history|Historial de compras|Historique des achats|购买记录|購買紀錄',
empty:'No repertoires published yet.|Aún no hay repertorios publicados.|Aucun répertoire publié.|暂无已发布的开局谱。|暫無已發佈的棋譜。',noOrders:'No purchases yet.|Todavía no hay compras.|Aucun achat.|暂无购买记录。|暫無購買紀錄。',
progress:'Your progress|Tu progreso|Votre progression|学习进度|學習進度',new:'New|Nuevas|Nouvelles|新局面|新局面',due:'Due now|Por repasar|À réviser|待复习|待溫習',mastered:'Mastered|Dominadas|Maîtrisées|已掌握|已掌握',acc:'Recent accuracy|Precisión reciente|Précision récente|近期正确率|近期準確率',
nextReview:'Next review|Próximo repaso|Prochaine révision|下次复习|下次溫習',now:'Now|Ahora|Maintenant|现在|現在',none:'—|—|—|—|—',learned:'learned|aprendido|appris|已学|已學',
settings:'Session settings|Ajustes de sesión|Réglages de séance|训练设置|訓練設定',limit:'Session limit|Máximo por sesión|Limite de séance|每次训练上限|每次訓練上限',fresh:'New position limit|Máximo de nuevas|Limite de nouvelles positions|新局面上限|新局面上限',
version:'Version|Versión|Version|版本|版本',chapter:'Chapter|Capítulo|Chapitre|章节|章節',line:'Line|Variante|Variante|变化|變化',moves:'Moves|Jugadas|Coups|着法|着法',previous:'Previous move|Jugada anterior|Coup précédent|上一步|上一步',next:'Next move|Jugada siguiente|Coup suivant|下一步|下一步',
position:'Position {0} of {1}|Posición {0} de {1}|Position {0} sur {1}|第 {0} / {1} 个局面|第 {0} / {1} 個局面',turn:'Play the repertoire move|Juega la jugada del repertorio|Jouez le coup du répertoire|请走出谱中的着法|請走出棋譜着法',
promote:'Promote to|Coronar en|Promouvoir en|升变为|升變為',correct:'Correct|Correcto|Correct|正确|正確',miss:'Outside this line. The repertoire plays {0}.|Jugada legal fuera de esta variante. El repertorio juega {0}.|Coup légal hors variante. Le répertoire joue {0}.|这是合法着法，本变化走 {0}。|這是合法着法，本變化走 {0}。',
illegal:'That move is illegal in this position.|Esa jugada es ilegal en esta posición.|Ce coup est illégal dans cette position.|这步棋不合法。|這步棋不合法。',context:'That move belongs to another line. Try this line’s reply.|Esa jugada pertenece a otra variante. Prueba la respuesta de esta línea.|Ce coup appartient à une autre variante. Essayez la réponse de cette ligne.|此着属于另一条变化，请尝试当前变化。|此着屬另一條變化，請嘗試目前變化。',
continue:'Continue|Continuar|Continuer|继续|繼續',pause:'Pause|Pausar|Pause|暂停|暫停',finish:'Finish session|Finalizar sesión|Terminer la séance|结束训练|結束訓練',summary:'Session results|Resultado de la sesión|Bilan de séance|训练结果|訓練結果',
practised:'Positions practised|Posiciones practicadas|Positions travaillées|练习局面|練習局面',hits:'Correct answers|Aciertos|Bonnes réponses|正确次数|答對次數',misses:'Mistakes|Errores|Erreurs|错误次数|錯誤次數',
improved:'Positions promoted|Posiciones que subieron de nivel|Positions en progression|升级局面|升級局面',accuracy:'Accuracy|Precisión|Précision|正确率|準確率',retryCard:'Repeat position|Posición de refuerzo|Position à revoir|再练此局面|重練此局面',
loading:'Loading…|Cargando…|Chargement…|加载中…|載入中…',retry:'Try again|Reintentar|Réessayer|重试|重試',error:'Unable to load this page.|No se ha podido cargar la página.|Impossible de charger cette page.|无法加载页面。|無法載入頁面。',
draft:'Unpublished|Sin publicar|Non publié|未发布|未發佈',published:'Published|Publicado|Publié|已发布|已發佈',checkoutWait:'Waiting for payment confirmation. Refresh to check access.|Esperando confirmación del pago. Actualiza para comprobar el acceso.|En attente de confirmation du paiement. Actualisez pour vérifier l’accès.|正在等待支付确认，请刷新查看。|等候付款確認，請重新整理查看。',
cancelled:'Checkout cancelled.|Compra cancelada.|Paiement annulé.|已取消付款。|已取消付款。',refresh:'Refresh|Actualizar|Actualiser|刷新|重新整理',
admin:'Repertoire administration|Administración de aperturas|Gestion des répertoires|开局管理|棋譜管理',create:'New repertoire|Nuevo repertorio|Nouveau répertoire|新建开局谱|新增棋譜',edit:'Edit|Editar|Modifier|编辑|編輯',name:'Name|Nombre|Nom|名称|名稱',slug:'Identifier|Identificador|Identifiant|标识符|識別碼',
description:'Description|Descripción|Description|描述|描述',cover:'Cover|Portada|Couverture|封面|封面',uploadCover:'Upload cover|Subir portada|Importer une couverture|上传封面|上載封面',pgn:'PGN file|Archivo PGN|Fichier PGN|PGN 文件|PGN 檔案',validate:'Validate PGN|Validar PGN|Valider le PGN|验证 PGN|驗證 PGN',
previewLine:'Preview line|Variante gratuita|Variante gratuite|预览变化|預覽變化',depth:'Preview half-moves|Medias jugadas gratuitas|Demi-coups gratuits|预览半回合数|預覽半回合數',save:'Save product|Guardar producto|Enregistrer le produit|保存产品|儲存產品',saved:'Saved|Guardado|Enregistré|已保存|已儲存',
access:'Purchases and access|Compras y accesos|Achats et accès|购买与权限|購買及權限',user:'Username|Usuario|Identifiant|用户名|用戶名',grant:'Grant access|Conceder acceso|Accorder l’accès|授予权限|授予權限',revoke:'Revoke access|Revocar acceso|Retirer l’accès|撤销权限|撤銷權限',refund:'Refund|Reembolsar|Rembourser|退款|退款',
confirmRefund:'Confirm full refund?|¿Confirmas el reembolso completo?|Confirmer le remboursement intégral ?|确认全额退款？|確認全額退款？',confirmRevoke:'Revoke access for this user?|¿Revocar el acceso a este usuario?|Retirer cet accès ?|撤销此用户的权限？|撤銷此用戶的權限？',
active:'Active|Activo|Actif|有效|有效',revoked:'Revoked|Revocado|Retiré|已撤销|已撤銷',paid:'Paid|Pagado|Payé|已支付|已付款',pending:'Pending|Pendiente|En attente|待处理|處理中',expired:'Expired|Caducado|Expiré|已过期|已過期',refunded:'Refunded|Reembolsado|Remboursé|已退款|已退款',created:'Created|Creado|Créé|创建时间|建立時間',
validateFirst:'Validate the PGN and choose a preview line.|Valida el PGN y elige una variante gratuita.|Validez le PGN et choisissez une variante gratuite.|请先验证 PGN 并选择预览变化。|請先驗證 PGN 並選取預覽變化。',previewEnd:'End of free preview|Fin de la vista previa|Fin de l’aperçu|免费预览结束|免費預覽完結',noDue:'Your reviews are up to date.|Tienes los repasos al día.|Vos révisions sont à jour.|当前复习已完成。|目前溫習已完成。'
};
export function openingText(locale='en'){
  const i=/^es/i.test(locale)?1:/^fr/i.test(locale)?2:/HK|Hant|yue/i.test(locale)?4:/^zh/i.test(locale)?3:0;
  return (k,...a)=>(words[k]?.split('|')[i]||k).replace(/\{(\d+)\}/g,(_,n)=>a[n]??'');
}
