// Use a local PostgreSQL test database. Each run owns a new, isolated schema.
// TCA_TEST_DATABASE_URL=postgresql://...@127.0.0.1/test npm run test:e2e
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { once } = require('node:events');
const fs = require('node:fs/promises');
const net = require('node:net');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const http = require('node:http');
const https = require('node:https');
const os = require('node:os');
const { setTimeout: delay } = require('node:timers/promises');
const { chromium } = require('playwright');
const { Pool } = require('pg');

async function suite() {
  const url = new URL(process.env.TCA_TEST_DATABASE_URL);
  assert.ok(['localhost','127.0.0.1','[::1]'].includes(url.hostname),'Use a local test database.');
  const schema = 'tca_test_' + crypto.randomBytes(8).toString('hex');
  const admin = new Pool({connectionString:url.href});
  await admin.query('CREATE SCHEMA ' + schema);
  url.searchParams.set('options','-c search_path=' + schema);
  const db = new Pool({connectionString:url.href});
  const probe=net.createServer(); probe.listen(0,'127.0.0.1'); await once(probe,'listening');
  const port=probe.address().port; await new Promise(resolve=>probe.close(resolve));
  const upstream='http://127.0.0.1:' + port;
  // Terminate TLS locally just as Railway does, so all clients send Secure cookies.
  const certDir=await fs.mkdtemp(path.join(os.tmpdir(),'tca-tls-'));
  const keyPath=path.join(certDir,'key.pem'),certPath=path.join(certDir,'cert.pem');
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-subj','/CN=localhost','-keyout',keyPath,'-out',certPath],{stdio:'ignore'});
  const proxy=https.createServer({key:await fs.readFile(keyPath),cert:await fs.readFile(certPath)},(req,res)=>{
    const forward=http.request(upstream+req.url,{method:req.method,headers:req.headers},reply=>{
      res.writeHead(reply.statusCode,reply.headers);reply.pipe(res);
    });
    forward.on('error',()=>{res.writeHead(502);res.end();});req.pipe(forward);
  });
  proxy.listen(0,'127.0.0.1');await once(proxy,'listening');
  const base='https://127.0.0.1:'+proxy.address().port;
  let server, browser;
  const password=crypto.randomBytes(16).toString('hex');
  async function start() {
    server=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port),DATABASE_URL:url.href,TCA_ADMIN_USERNAMES:''},stdio:['ignore','ignore','inherit']});
    for(let i=0;i<80;i++) { if(server.exitCode!==null)throw Error('Server exited'); try {if((await fetch(upstream+'/health')).ok)return;}catch{} await delay(100); }
    throw Error('Server did not reach /health');
  }
  async function stop() { if(server&&server.exitCode===null){const exited=once(server,'exit');server.kill();await exited;}server=null; }
  const post=(route,body)=>fetch(upstream+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try {
    await start();
    for(const username of ['testowner','coach','pupil'])assert.equal((await post('/api/register',{name:username,username,password})).status,201);
    await stop();
    await db.query("UPDATE users SET username='p11' WHERE username='testowner'");
    await start(); // bootstraps the existing p11 using the normal production path
    const executable=process.env.TCA_TEST_CHROMIUM;
    browser=await chromium.launch({executablePath:executable||undefined,headless:true,
      args:process.env.TCA_TEST_SINGLE_PROCESS ? ['--no-sandbox','--no-zygote','--single-process','--disable-gpu']:[]});
    const context=await browser.newContext({ignoreHTTPSErrors:true,viewport:{width:1440,height:940},permissions:['clipboard-read','clipboard-write']});
    await context.route('https://fonts.**/*',route=>route.abort());
    const page=await context.newPage(), errors=[];
    page.setDefaultTimeout(10000);
    page.on('pageerror',error=>errors.push(error.message));
    const $=s=>page.locator(s), click=s=>$(s).click();
    const nav=route=>click('.platform-nav a[href="#/'+route+'"]');
    async function login(username) {
      await page.goto(base+'/#/login'); await $('#u').fill(username);await $('#p').fill(password);await click('#authForm button');
      await page.waitForSelector('.feature-action');
    }
    const logout=async()=>{await click('#logout');await page.waitForSelector('#authForm');};
    const request=(pathname,body)=>body?context.request.post(base+pathname,{data:body}):context.request.get(base+pathname);
    async function gate(status) {
      for(const endpoint of ['/analysis','/api/analysis/access','/api/analysis/board.mjs','/api/analysis/rules.mjs','/api/analysis/study.mjs'])
        assert.equal((await request(endpoint)).status(),status,endpoint);
      assert.equal((await request('/api/analysis/import',{pgn:'1. e4 *'})).status(),status);
    }
    async function snap(name) {
      if(process.env.TCA_TEST_SCREENSHOTS) {
        await fs.mkdir(process.env.TCA_TEST_SCREENSHOTS,{recursive:true});
        await page.screenshot({path:path.join(process.env.TCA_TEST_SCREENSHOTS,name+'.png'),fullPage:true});
      }
    }
    await gate(401);
    await login('pupil');assert.equal(await $('.platform-nav a').count(),4);await gate(403);
    assert.equal((await request('/api/superadmin/users')).status(),403);
    await nav('library');await click('a[href="#/book/1"]');await click('a[href="#/book/1/ch/0"]');
    await click('a[href="#/play/1"]');await page.waitForSelector('#exerciseBoard .wb-sq');
    await click('#openTutorial'); await page.waitForSelector('.tutorial-bg');await page.keyboard.press('Escape');
    await click('#showAnswer');await page.waitForSelector('#feedback .wp-feedback');
    await page.reload();await page.waitForSelector('#exerciseBoard');
    assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('tca.wp1.pupil'))['wp1-001']));
    await nav('videos');await page.waitForSelector('.video-empty'); await logout();
    await login('p11');await click('#superadminToggleUsers');await click('[data-user-admin="coach"]');
    await page.waitForSelector('[data-user-admin="coach"][data-grant="false"]');await logout();
    await page.goto(base+'/analysis');await $('#u').fill('coach');await $('#p').fill(password);await click('#authForm button');
    await page.waitForSelector('[data-square="e2"]');
    assert.equal(await $('.platform-nav a').count(),5);
    assert.equal((await request('/api/superadmin/users/role',{username:'pupil',isAdmin:true})).status(),403);
    console.log('PASS account roles, owner promotion, book, chapter, workbook, tutorial, progress, videos');

    const sq=(square)=>$('[data-square="'+square+'"]');
    const piece=square=>sq(square).getAttribute('data-piece');
    async function ingest(text,filename,valid=true) {
      await click('#analysisOpenImport');
      if(filename) await $('#analysisPgnFile').setInputFiles({name:filename,mimeType:'application/x-chess-pgn',buffer:Buffer.from(text)});
      else {await $('#analysisPgnText').fill(text);await click('#analysisImport');}
      if(valid)await $('#analysisImportModal').waitFor({state:'hidden'});
      else await page.waitForFunction(()=>document.querySelector('#analysisImportMessage').textContent.includes('Illegal')||document.querySelector('#analysisImportMessage').textContent.includes('Invalid'));
    }
    async function end(){await click('#analysisEnd');}
    await ingest('1. e4 e5 2. Nf3 *');assert.equal(await $('.notation-row').count(),2);
    await click('#analysisNext');assert.equal(await piece('e4'),'P');await page.keyboard.press('ArrowUp');assert.equal(await piece('f3'),'N');
    await page.keyboard.press('ArrowLeft');assert.equal(await piece('g1'),'N');await page.keyboard.press('ArrowDown');assert.equal(await piece('e2'),'P');
    await page.keyboard.press('ArrowRight');assert.equal(await piece('e4'),'P');
    const opera='[Event "Paris"]\n[White "Morphy"]\n[Black "Duke and Count"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0';
    await ingest(opera,'complete.pgn');await end();assert.equal(await piece('d8'),'R');assert.match(await $('#positionTurn').innerText(),/Checkmate/);assert.equal(await $('.san').count(),33);
    await snap('desktop-analysis');
    const branch='[Event "TCA"]\n[ChapterName "Italian"]\n\n{Start note} 1. e4! {Claim the centre [%cal Ge2e4]} (1. d4 d5 (1... Nf6)) e5 2. Nf3 *';
    await ingest(branch);assert.match(await $('#currentNote').innerText(),/Start note/);await click('#analysisNext');
    assert.match(await $('#currentNote').innerText(),/Claim the centre/);assert.match(await $('.san.current').innerText(),/!/);
    assert.equal(await $('.board-marks line').count(),1);
    await $('.branch-move').filter({hasText:'d4'}).click();assert.equal(await piece('d4'),'P');
    await $('.branch-move').filter({hasText:'Nf6'}).click();assert.equal(await piece('f6'),'n');
    await click('#analysisStart'); await sq('c2').click();assert.equal(await $('.study-square.legal').count(),2);
    await sq('c4').click();assert.equal(await piece('c4'),'P');assert.match(await $('.variation-row').first().innerText(),/e4/);
    await click('[data-edit-move]');await click('#deleteMove');assert.equal(await piece('c2'),'P');assert.equal(await $('.san.current').count(),0);
    await $('.san').filter({hasText:'e4'}).first().click();
    const geometry=async square=>{const b=await sq(square).boundingBox();return [b.x+b.width/2,b.y+b.height/2];};
    async function drag(from,to,button='left') {
      const a=await geometry(from), b=await geometry(to);await page.mouse.move(...a);await page.mouse.down({button});
      await page.mouse.move(...b,{steps:8});await page.mouse.up({button});
    }
    await drag('g8','f6','right');await sq('e5').click({button:'right'});
    assert.equal(await $('.board-marks circle').count(),1);assert.equal(await $('.board-marks [data-arrow]').count(),2);assert.equal(await $('.board-marks [data-arrow=knight]').count(),1);
    await click('#analysisFlip');assert.equal(await $('.study-square').first().getAttribute('data-square'),'h1');
    await click('#analysisMoreButton');assert.ok(await $('#analysisMoreMenu').isVisible());await click('[data-tool="clearMarks"]');
    assert.equal(await $('.board-marks circle,.board-marks [data-arrow]').count(),0);
    const annotationFen=await $('#analysisBoard').getAttribute('data-fen');
    for(let side=0;side<2;side++) {
      for(const dest of ['b3','b5','c2','c6','e2','e6','f3','f5']) {
        await drag('d4',dest,'right');
        const path=$('.board-marks [data-arrow=knight]');assert.equal(await path.count(),1);
        const nums=(await path.getAttribute('d')).match(/[0-9.]+/g).map(Number);
        assert.equal(nums.length,6);
        const [x,y,m,n,u,v]=nums;
        assert.ok((x===m && y!==n && n===v && m!==u)||(y===n && x!==m && m===u && n!==v));
        assert.ok(await path.getAttribute('marker-end'));
        await sq(dest).click({button:'right'});assert.equal(await path.count(),0);
      }
      await click('#analysisFlip');
    }
    await drag('a1','a6','right');await sq('a3').click({button:'right'});assert.equal(await $('.board-marks [data-arrow]').count(),0);
    await sq('b4').click({button:'right'});await sq('b4').click({button:'right'});assert.equal(await $('.board-marks circle').count(),0);
    await drag('d4','f5','right');await sq('g7').click({button:'right'});await sq('h3').click({button:'right',modifiers:['Alt']});
    assert.equal(await $('.board-marks [data-arrow],.board-marks circle').count(),0);
    assert.equal(await $('#analysisBoard').getAttribute('data-fen'),annotationFen);
    await click('#analysisMoreButton');await click('[data-tool="copyFen"]');
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await $('#analysisBoard').getAttribute('data-fen'));
    await click('#analysisMoreButton');const downloaded=page.waitForEvent('download');await click('[data-tool="download"]');
    const dl=await downloaded;const exported=await fs.readFile(await dl.path(),'utf8');assert.match(exported,/\(1\. d4 d5 \(1\.\.\. Nf6\)\)/);
    await drag('c7','c5');assert.equal(await piece('c5'),'p');
    await click('#analysisFlip');
    const fen='8/8/8/8/8/8/4K3/7k b - - 0 17';
    const multi=branch+'\n\n[ChapterName "Endgame"]\n[SetUp "1"]\n[FEN "'+fen+'"]\n\n17... Kg1 *';
    await ingest('\uFEFF'+multi.replaceAll('\n','\r\n'),'windows.pgn');assert.equal(await $('#analysisChapter option').count(),2);
    await $('#analysisChapter').selectOption('1');assert.equal(await $('#analysisBoard').getAttribute('data-fen'),fen);
    assert.match(await $('.notation-row').innerText(),/17\./);await end();assert.equal(await piece('g1'),'k');
    await $('#analysisChapter').selectOption('0');assert.equal(await piece('h1'),'R');
    await ingest(opera.replaceAll('\n','\r'),'classic-mac.pgn');await end();assert.equal(await piece('d8'),'R');
    await ingest('1. e4 e5 2. Bh6 *',null,false);assert.match(await $('#analysisImportMessage').innerText(),/Bh6/);await click('#closeImport');
    assert.equal(await piece('d8'),'R');
    await ingest('this is not a game','bad.pgn',false);await page.keyboard.press('Escape');assert.equal(await piece('d8'),'R');
    await ingest('1. e4 a6 2. e5 d5 *');await end();await sq('e5').click();await sq('d6').click();assert.equal(await piece('d6'),'P');assert.equal(await piece('d5'),'');
    await ingest('[FEN "7k/P7/8/8/8/8/8/4K3 w - - 0 1"]\n\n*');await sq('a7').click();await sq('a8').click();
    await click('[data-promotion="n"]');assert.equal(await piece('a8'),'N');
    console.log('PASS PGN file/paste, complete game, annotations/NAGs, nested branches, deletion, chapters, FEN, line endings, invalid/atomic import, keyboard, flip, drag, copy and export, castling, en passant, underpromotion');

    await ingest('[FEN "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"]\n\n1. O-O O-O-O *');
    const moves=await page.evaluate(()=>{
      const board=document.querySelector('#analysisBoard');
      const runs=()=>board.getAnimations({subtree:true}).map(a=>[a.effect.target.closest('[data-square]')?.dataset.square,a.effect.getTiming().duration]);
      document.querySelector('#analysisNext').click();const castle=runs();
      document.querySelector('#analysisPrev').click();const undo=runs();
      for(let i=0;i<12;i++){document.querySelector('#analysisNext').click();document.querySelector('#analysisPrev').click();}
      return {castle,undo,last:runs(),fen:board.dataset.fen};
    });
    assert.deepEqual(moves.castle.sort(),[['f1',150],['g1',150]]);assert.deepEqual(moves.undo.sort(),[['e1',150],['h1',150]]);
    assert.equal(moves.last.length,2);assert.match(moves.fen,/ w KQkq /);
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.evaluate(()=>{document.querySelector('#analysisNext').click();return document.querySelector('#analysisBoard').getAnimations({subtree:true}).length;}),0);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await ingest('1. e4 d5 2. exd5 *');await end();await click('#analysisPrev');
    const captured=await page.evaluate(()=>{document.querySelector('#analysisNext').click();return [document.querySelector('[data-square=d5]').dataset.piece,document.querySelectorAll('.motion-ghost').length];});
    assert.deepEqual(captured,['P',1]);await page.waitForFunction(()=>!document.querySelector('.motion-ghost'));
    await ingest('[FEN "7k/P7/8/8/8/8/8/4K3 w - - 0 1"]\n\n1. a8=N *');
    const promoted=await page.evaluate(()=>{document.querySelector('#analysisNext').click();const cell=document.querySelector('[data-square=a8]');return [cell.dataset.piece,cell.querySelector('.motion-ghost svg')?.dataset.man];});
    assert.deepEqual(promoted,['N','P']);await page.waitForFunction(()=>!document.querySelector('.motion-ghost'));
    await ingest('1. e4 *');const analysisPiece=await sq('f1').locator('svg').first().evaluate(el=>el.outerHTML);
    for(const man of 'KQRBNPkqrbnp')assert.ok(await $('#analysisBoard svg[data-set="tca-staunton"][data-man="'+man+'"]').count());
    await page.goto(base+'/#/play/205');await page.waitForSelector('#exerciseBoard .wb-sq');
    const bookBishop=await $('#exerciseBoard svg[data-man="B"]').count();if(bookBishop)assert.equal(await $('#exerciseBoard svg[data-man="B"]').first().evaluate(el=>el.outerHTML),analysisPiece);
    const wb=sq=>$('#exerciseBoard [data-sq="'+sq+'"]');const workbookPiece=await wb('f4').locator('svg').getAttribute('data-man');
    await wb('f4').click();await wb('g4').click();assert.equal(await wb('g4').locator('svg:not(.motion-ghost svg)').first().getAttribute('data-man'),workbookPiece);
    await click('#checkEx');await page.waitForSelector('#feedback .wp-feedback');await click('#resetEx');assert.ok(await wb('f4').locator('svg[data-set="tca-staunton"]').count());
    console.log('PASS original pieces, 8 knight routes in both orientations, erase by stroke, Alt-clear, board state, 150 ms castle/undo, capture, promotion, rapid navigation, reduced motion and workbook moves');

    await nav('calculator');await page.waitForSelector('[data-field="rating"]');
    await $('[data-field="rating"]').fill('2212');await $('[data-field="k"]').selectOption('40');
    const ratings=[1926,2011,2318,2067,2219,2585,2659,2464,2652], scores=[1,1,0,.5,.5,0,1,.5,.5];
    for(let i=0;i<ratings.length;i++) {
      if(i)await click('[data-add]');
      await $('[data-field=opponent]').nth(i).fill(String(ratings[i]));await $('.calc-row').nth(i).locator('[data-score="'+scores[i]+'"]').click();
    }
    assert.equal(await $('[data-total]').innerText(),'2268');await $('[data-remove]').last().click();assert.equal(await $('[data-total]').innerText(),'2252');
    await click('[data-mode=initial]');for(let i=0;i<5;i++){
      if(i)await click('[data-add]');await $('[data-field=opponent]').nth(i).fill('1800');
      await $('.calc-row').nth(i).locator('[data-score="'+[1,1,.5,.5,0][i]+'"]').click();
    }
    assert.equal(await $('[data-total]').innerText(),'1850');assert.match(await $('.calc-summary').innerText(),/Meets/);
    await click('[data-new-event]');assert.equal(await $('.game-group').count(),2);await click('[data-drop-event="1"]');
    await snap('desktop-calculator');await click('[data-reset]');assert.equal(await $('[data-total]').innerText(),'—');
    await click('[data-mode=norms]');await click('[data-action=demo]');assert.equal((await $('[data-needed]').innerText()).replace(/\s+/g,''),'2/3');
    assert.equal(await $('.norm-combos span').count(),2);await snap('desktop-norms');
    await $('[data-scope=game][data-key=rating][data-i="6"]').fill('');assert.equal(await $('[data-needed]').count(),0);assert.ok(await $('.norm-scenarios tbody tr').count());
    await $('[data-scope=game][data-key=rating][data-i="6"]').fill('2350');await click('[data-action=result][data-i="6"][data-value="1"]');
    await click('[data-action=result][data-i="7"][data-value="0.5"]');await click('[data-action=result][data-i="8"][data-value="0.5"]');
    assert.match(await $('#normHero h2').innerText(),/Sporting requirements met/);
    await $('#toolRoot [data-panel=conditions] > summary').click();
    for(const [key,v] of [['minutes','120'],['daily','2'],['hours','8'],['duration','7']])await $('[data-scope=event][data-key="'+key+'"]').fill(v);
    await $('[data-scope=event][data-key=duration]').press('Tab');
    for(const key of ['registration','laws','equalConditions','clocks','arbiters','ratingList'])await $('[data-scope=evidence][data-key="'+key+'"]').selectOption('yes');
    assert.match(await $('#normHero h2').innerText(),/Requirements met/);
    await click('[data-action=demo]');await $('[data-key=fed][data-scope=event]').fill('esp');
    await click('[data-action=pairings]');assert.equal(await $('.norm-round').count(),9);
    await click('[data-action=removeRound][data-i="8"]');await click('[data-action=add]');assert.equal(await $('.norm-round').count(),9);
    await click('[data-action=tab][data-value=titleTab]');await click('[data-action=addCert]');
    await $('[data-scope=cert][data-key=name]').fill('Galicia');await $('[data-scope=book][data-key=peak]').fill('2412');
    await $('[data-key=peakKind]').selectOption('published');assert.equal(await $('[data-check=peak]').getAttribute('data-state'),'met');
    for(let i=0;i<3;i++) {
      if(i)await click('[data-action=addCert]');
      const cv=k=>$('[data-scope=cert][data-key="'+k+'"][data-i="'+i+'"]');
      if(i)await cv('name').fill('Event '+(i+1));
      await cv('date').fill('2026-06-10');await cv('level').selectOption('IM');
      await cv('rounds').fill('9');await cv('games').fill('9');await cv('category').selectOption(i?'outside':'olympiad');
      await click('[data-panel=cert-'+i+'] > summary');
      for(const [k,v] of [['verified','yes'],['normal','yes'],['bye','no'],['short','no']])await cv(k).selectOption(v);
    }
    assert.equal(await $('.norm-portfolio-total b').innerText(),'27');assert.deepEqual(await $('#portfolioChecks li:not([data-state=met])').evaluateAll(list=>list.map(el=>[el.dataset.check,el.dataset.state])),[]);
    await page.reload();await click('[data-mode=norms]');assert.equal(await $('[data-scope=event][data-key=fed]').inputValue(),'ESP');
    await click('[data-action=tab][data-value=titleTab]');assert.equal(await $('[data-scope=cert][data-key=name]').first().inputValue(),'Galicia');
    await click('[data-action=tab][data-value=eventTab]');await click('[data-action=demo]');
    for (const [lang,label] of [['es','Calculadora de Elo FIDE'],['fr','Calculatrice Elo FIDE'],['zh','国际棋联等级分计算器'],['yue','國際棋聯等級分計算機'],['en','FIDE Elo calculator']]) {
      await click('.lang-button');await click('[data-lang="'+lang+'"]');await page.getByRole('heading',{name:label,exact:true}).waitFor();
      assert.ok(await $('[data-needed]').isVisible());await page.setViewportSize({width:320,height:844});
      assert.ok(await page.evaluate(()=>{const el=document.querySelector('.norm-workspace');return el.scrollWidth<=el.clientWidth+1;}),'Norms overflow in '+lang);
    }
    console.log('PASS norm calculator score scenarios, editable rounds, saved title tracker, five translated mobile layouts');
    assert.ok(await $('[data-needed]').isVisible());
    for(const width of [390,320,820,1024,1440]){
      await page.setViewportSize({width,height:860});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Calculator overflow at '+width);
    }
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await snap('mobile-norms');await click('.norm-jumps [data-value=normSimulation]');assert.ok(await $('[data-needed]').isVisible());
    await click('[data-mode=initial]');await snap('mobile-calculator');await nav('analysis');await page.waitForSelector('.study-square');
    await ingest(branch);await click('#drawToggle');
    const cdp=await context.newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
    async function touchMove(from,to){
      await sq(from).scrollIntoViewIfNeeded();
      const [x,y]=await geometry(from),[u,v]=await geometry(to);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      if(to!==from)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:u,y:v}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    await touchMove('d4','d4');assert.equal(await $('.board-marks circle').count(),1);
    await touchMove('d4','f5');assert.equal(await $('.board-marks [data-arrow=knight]').count(),1);
    const [holdX,holdY]=await geometry('h3');await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:holdX,y:holdY}]});await delay(620);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await $('.board-marks circle,.board-marks [data-arrow]').count(),0);
    await click('#drawToggle');await touchMove('g1','f3');assert.equal(await piece('f3'),'N');
    await cdp.detach();
    await click('#analysisMoreButton');assert.ok(await $('[data-tool=download]').isVisible());await page.keyboard.press('Escape');await snap('mobile-analysis');
    assert.ok(await page.evaluate(()=>{
      const nav=document.querySelector('.platform-rail').getBoundingClientRect();
      const content=document.querySelector('.platform-body').getBoundingClientRect();
      return document.documentElement.scrollWidth<=innerWidth && content.bottom<=nav.top+1;
    }),'Mobile navigation must reserve its own space');
    await nav('home');await snap('mobile-home');
    await logout();await login('p11');await click('#superadminToggleUsers');await click('[data-user-admin="coach"]');await page.waitForSelector('[data-user-admin="coach"][data-grant="true"]');
    await logout();await login('coach');await gate(403);assert.equal(await $('.platform-nav a').count(),4);await logout();
    await page.goto(base+'/calculator');await page.waitForSelector('[data-total]');assert.equal(await $('.platform-nav a[href="#/analysis"]').count(),0);
    assert.deepEqual(errors,[]);
    console.log('PASS two rating modes, official example, editing, deletion, reset, all five languages, responsive widths, mobile navigation, touch marking, role revocation and anonymous calculator');
  } finally {
    if(browser)await browser.close();
    proxy.closeAllConnections();await new Promise(resolve=>proxy.close(resolve));await fs.rm(certDir,{recursive:true,force:true});
    await stop();await db.end();await admin.query('DROP SCHEMA '+schema+' CASCADE');await admin.end();
  }
}
suite().catch(error=>{console.error(error);process.exitCode=1;});
