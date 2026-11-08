const assert = require('node:assert/strict');

// Observe the moving piece before releasing the pointer, including an off-centre grip.
module.exports = async function dragPiece(page, from, to, {touch, cancel=false}={}) {
  const board=page.locator('.study-board');
  const square=s=>board.locator('[data-square="'+s+'"]');
  const source=square(from);
  await source.scrollIntoViewIfNeeded();
  const piece=source.locator('.study-piece > svg');
  const [origin, sprite, destination, man, fen]=await Promise.all([
    source.boundingBox(), piece.boundingBox(), square(to).boundingBox(),
    piece.getAttribute('data-man'), board.getAttribute('data-fen')
  ]);
  const start={x:Math.round(origin.x+origin.width*.39),y:Math.round(origin.y+origin.height*.58)};
  const end={x:Math.round(destination.x+destination.width/2),y:Math.round(destination.y+destination.height/2)};
  const finger=(type,point)=>touch.send('Input.dispatchTouchEvent',{type,touchPoints:point?[point]:[]});
  if(touch)await finger('touchStart',start);
  else{await page.mouse.move(start.x,start.y);await page.mouse.down();}
  for(const fraction of [.4,.75,1]){
    const x=Math.round(start.x+(end.x-start.x)*fraction),y=Math.round(start.y+(end.y-start.y)*fraction);
    if(touch)await finger('touchMove',{x,y});else await page.mouse.move(x,y);
    await page.waitForFunction(({x,y,width,height})=>{
      const rect=document.querySelector('.drag-piece > svg')?.getBoundingClientRect();
      return rect && Math.abs(rect.x-x)<2 && Math.abs(rect.y-y)<2 &&
        Math.abs(rect.width-width)<1 && Math.abs(rect.height-height)<1;
    },{x:sprite.x+x-start.x,y:sprite.y+y-start.y,width:sprite.width,height:sprite.height});
    assert.equal(await page.locator('.drag-piece > svg').getAttribute('data-man'),man);
    assert.equal(await piece.isVisible(),false);
    assert.equal(await board.getAttribute('data-fen'),fen);
  }
  if(touch)await finger(cancel?'touchCancel':'touchEnd');
  else{if(cancel)await page.keyboard.press('Escape');await page.mouse.up();}
  assert.equal(await page.locator('.drag-piece,.drag-origin').count(),0);
  if(cancel){assert.equal(await board.getAttribute('data-fen'),fen);assert.ok(await piece.isVisible());}
};
