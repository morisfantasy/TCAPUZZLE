const assert=require('node:assert/strict');
const dragPiece=require('./piece-drag.cjs');
module.exports=async function({page,base,login,logout,request,snap,password,restart}){
  const loc=s=>page.locator(s),click=s=>loc(s).click();
  const go=async p=>{await page.goto(base+p);};
  await go('/openings');await page.getByRole('heading',{name:'Opening repertoires'}).waitFor();
  if(process.env.TCA_SICILIAN_PGN_GZIP){
    await page.getByRole('link',{name:'Aggressive Sicilian'}).click();await loc('.op-copy h1').waitFor();assert.match(await loc('.op-statline').innerText(),/1373/);
    assert.equal((await request('/api/openings/aggressive-sicilian/learn')).status(),401);await snap('openings-product');
    await click('a[href="#/openings/aggressive-sicilian/preview"]');await loc('.study-board [data-square]').first().waitFor();
    assert.equal(await loc('.study-square').first().getAttribute('data-square'),'h1');
    await click('[data-op=next]');assert.ok(await loc('.study-board [data-square=e4][data-piece=P]').count());
    const preview=await (await request('/api/openings/aggressive-sicilian')).json();assert.equal(preview.preview.nodes.length,9);assert.equal(preview.chapters,undefined);
  }
  await login('p11');
  if(process.env.TCA_SICILIAN_PGN_GZIP){
    await page.setViewportSize({width:1400,height:900});await go('/openings');await page.getByRole('link',{name:'Aggressive Sicilian'}).waitFor();await snap('desktop-opening-catalog');
    await go('/openings/aggressive-sicilian/learn');await loc('#opCh').waitFor();assert.equal(await loc('#opCh option').count(),6);
    await loc('#opCh').selectOption('2');assert.equal(await loc('#opLine option').count(),41);assert.match(await loc('.study-board').getAttribute('data-fen'),/ w KQkq - 0 2$/);
    await loc('#opCh').selectOption('5');assert.equal(await loc('#opLine option').count(),136);await loc('#opLine').selectOption('135');await click('[data-op=next]');await snap('desktop-opening-study');
    await click('[data-op=trainLine]');await loc('.study-board[data-playing]').waitFor();await click('[data-square=c7]');await click('[data-square=c5]');await loc('.op-correct').waitFor();
    await click('[data-op=continue]');await click('[data-op=finish]');await page.getByRole('heading',{name:'Session results'}).waitFor();
  }
  await go('/openings/admin/new');await loc('#oa-name').fill('Club repertoire');
  await loc('#oa-slug').fill('club-test');await loc('#oa-description').fill('A training fixture');await loc('#oa-price').fill('29');
  const upload=async text=>loc('#oa-file').setInputFiles({name:'sample.pgn',mimeType:'application/x-chess-pgn',buffer:Buffer.from(text)});
  await upload('1. e4 e5 2. Bh6 *');await click('[data-op=validate]');await loc('[data-op-error]:visible').waitFor();assert.match(await loc('[data-op-error]').innerText(),/illegalPgn/);
  await upload('1. e4 c5 (1... e5) 2. Nf3 d6 (2... Nc6) 3. d4 cxd4 *');await click('[data-op=validate]');
  await loc('#oa-line option').first().waitFor({state:'attached'});await loc('#oa-depth').fill('2');await loc('#oa-published').check();await click('[data-op=save]');
  await loc('#oa-access').waitFor();await loc('#oa-user').fill('pupil');await click('[data-op=grant]');await page.waitForFunction(()=>document.querySelector('#oa-access')?.textContent.includes('pupil'));
  await logout();await login('pupil');await go('/openings/club-test');await loc('.op-dashboard').waitFor();
  assert.equal((await request('/api/openings/admin/club-test')).status(),403);await click('a[href*="/learn"]');
  await loc('#opLine').waitFor();assert.equal(await loc('#opLine option').count(),3);await click('[data-op=next]');await page.keyboard.press('ArrowRight');
  assert.equal(await loc('.study-square[data-square=c5]').getAttribute('data-piece'),'p');await click('[data-op=prev]');
  await go('/openings/club-test/train');await loc('#opLimit').fill('2');await loc('#opFresh').fill('2');await click('[data-op=start]');
  await loc('.study-board[data-playing]').waitFor();const sessionURL=page.url();
  async function play(from,to){await loc('.study-board[data-playing]').waitFor();await click('[data-square="'+from+'"]');await click('[data-square="'+to+'"]');}
  await dragPiece(page,'e7','e4');assert.match(await loc('#opFeedback').innerText(),/illegal/);
  assert.equal(await loc('[data-square=e7]').getAttribute('data-piece'),'p');
  await dragPiece(page,'a7','a6');await loc('.op-miss').waitFor();assert.match(await loc('#opFeedback').innerText(),/c5/);
  assert.equal(await loc('[data-square=a7]').getAttribute('data-piece'),'p');
  assert.equal(await loc('[data-square=c5]').getAttribute('data-piece'),'p');
  await click('[data-op=continue]');await click('.op-side a[href="#/openings/club-test"]');
  await page.getByRole('link',{name:'Resume session'}).click();await loc('.study-board[data-playing]').waitFor();
  assert.equal(page.url(),sessionURL);
  const answerURL='**/api/openings/club-test/sessions/*/answer';
  let releaseAnswer,landing,submissions=0;
  const gate=new Promise(resolve=>{releaseAnswer=resolve;});
  await page.route(answerURL,async route=>{submissions++;await gate;await route.continue();});
  try{
    await dragPiece(page,'d7','d6');
    assert.equal(await loc('[data-square=d7]').getAttribute('data-piece'),'');
    landing=await loc('[data-square=d6] .study-piece').elementHandle();
    assert.equal(await landing.getAttribute('class'),'study-piece');
    assert.equal(await loc('.op-correct').count(),0);
  }finally{releaseAnswer();}
  await loc('.op-correct').waitFor();await page.unroute(answerURL);
  assert.equal(submissions,1);assert.ok(await landing.evaluate(el=>el.isConnected));
  await click('[data-op=continue]');
  await play('e7','e5');await loc('.op-correct').waitFor();await click('[data-op=continue]');await page.getByRole('heading',{name:'Session results'}).waitFor();
  assert.match(await loc('.op-metrics').innerText(),/Mistakes\s*1/);await go('/openings/club-test');await loc('.op-dashboard').waitFor();await page.reload();await loc('.op-dashboard').waitFor();
  const pg=(await (await request('/api/openings/club-test')).json()).progress;await restart();
  const device=await require('playwright').request.newContext({ignoreHTTPSErrors:true,baseURL:base});
  try{assert.ok((await device.post('/api/login',{data:{username:'pupil',password}})).ok());
    const other=await (await device.get('/api/openings/club-test')).json();assert.deepEqual(other.progress,pg);
  }finally{await device.dispose();}
  await page.setViewportSize({width:390,height:844});await go('/openings/club-test/learn');await loc('#opCh').waitFor();await snap('mobile-opening-study');
  for(const lang of ['es','fr','zh','yue','en']){
    await click('.lang-button');await click('[data-lang="'+lang+'"]');await loc('#opLine').waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.equal(await loc('.platform-nav a:visible').count(),5);
  }
  await logout();await login('p11');await go('/openings/admin/club-test');await loc('#oa-access').waitFor();await loc('#oa-user').fill('pupil');
  page.once('dialog',d=>d.accept());await click('[data-op=revoke]');await page.waitForFunction(()=>document.querySelector('#oa-access')?.textContent.includes('Revoked'));
  await logout();await login('pupil');assert.equal((await request('/api/openings/club-test/learn')).status(),403);
  await go('/openings/club-test');await loc('.op-copy').waitFor();assert.equal(await loc('.op-dashboard').count(),0);
  await logout();await login('p11');await go('/openings/admin/club-test');await loc('#oa-side').selectOption('w');await click('[data-op=validate]');await loc('#oa-line option').first().waitFor({state:'attached'});await click('[data-op=save]');await page.waitForFunction(()=>document.querySelector('#oa-message')?.textContent.includes('2'));
  await go('/openings/club-test/train');await loc('#opLimit').fill('1');await loc('#opFresh').fill('1');await click('[data-op=start]');await loc('.study-board[data-playing]').waitFor();
  assert.equal(await loc('.study-square').first().getAttribute('data-square'),'a8');
  const touch=await page.context().newCDPSession(page);
  await touch.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await dragPiece(page,'e2','e4',{touch,cancel:true});
  await dragPiece(page,'e2','e4',{touch});await touch.detach();
  await loc('.op-correct').waitFor();await click('[data-op=continue]');await page.getByRole('heading',{name:'Session results'}).waitFor();
  await logout();console.log('PASS real PGN preview if supplied, administrator import/validation/publication and access, legal/illegal/alternative moves, failed position returning, mobile study in five languages, pause/resume and revocation');
};
