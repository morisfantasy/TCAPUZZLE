// The pieces in the DOM always represent the destination position. Any transitory
// captured or promoting piece lives only for the duration of its animation.
const BoardMotion = (() => {
  const active = new WeakMap();
  const cellAt = (board,sq) => board.querySelector('[data-square="'+sq+'"],[data-sq="'+sq+'"]');
  function snapshot(board) {
    const pieces = new Map();
    for (const svg of board.querySelectorAll('.study-piece > svg,.pc > svg')) {
      const cell = svg.closest('[data-square],[data-sq]');
      if (cell && !svg.closest('.motion-ghost')) pieces.set(cell.dataset.square || cell.dataset.sq, svg.dataset.man);
    }
    return pieces;
  }
  function cancel(board) {
    for (const animation of active.get(board) || []) animation.cancel();
    active.delete(board);
    board.querySelectorAll('.motion-ghost').forEach(el=>el.remove());
  }
  function pieceDrag(board, cell, down, selectOrigin) {
    const startX=down.clientX, startY=down.clientY;
    let ghost, left, top;
    return {
      get active() { return !!ghost; },
      move(event) {
        const dx=event.clientX-startX, dy=event.clientY-startY;
        if (!ghost) {
          if (Math.hypot(dx,dy)<4) return;
          cancel(board);
          const piece=cell.querySelector('.study-piece');
          if (!piece) return;
          const rect=piece.getBoundingClientRect();
          left=rect.left; top=rect.top;
          ghost=piece.cloneNode(true);
          ghost.className='drag-piece';
          ghost.setAttribute('aria-hidden','true');
          ghost.style.width=rect.width+'px';
          ghost.style.height=rect.height+'px';
          document.body.append(ghost);
          board.querySelectorAll('.selected,.legal,.capture').forEach(sq=>sq.classList.remove('selected','legal','capture'));
          cell.classList.add('drag-origin','selected');
          board.classList.add('piece-dragging');
          for (const move of selectOrigin()) {
            const target=cellAt(board,move.to);
            target.classList.add(target.dataset.piece?'capture':'legal');
          }
        }
        ghost.style.transform='translate3d('+(left+dx)+'px,'+(top+dy)+'px,0)';
      },
      remove() {
        if (!ghost) return;
        ghost.remove(); ghost=null;
        cell.classList.remove('drag-origin');
        board.classList.remove('piece-dragging');
      }
    };
  }
  // Keep the dropped pawn on the last rank while its promotion is being chosen.
  function parkPromotion(board, from, to) {
    const source=cellAt(board,from), target=cellAt(board,to);
    const pawn=source.querySelector('.study-piece'), capture=target.querySelector('.study-piece');
    if (capture) capture.style.visibility='hidden';
    target.append(pawn);
    return ()=>{source.prepend(pawn);if(capture)capture.style.visibility='';};
  }
  function play(board, before, move, reverse=false, dragged=false) {
    if (!before || !move || !Element.prototype.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations = [], duration = 150, after = snapshot(board);
    active.set(board,animations);
    const start = reverse ? move.to : move.from, end = reverse ? move.from : move.to;
    const source = before.get(start);
    if (!source || !after.has(end)) return;
    function run(el, frames, cleanup=()=>{}) {
      const animation=el.animate(frames,{duration,easing:'cubic-bezier(.23,.7,.27,1)'});
      animations.push(animation);
      animation.onfinish=animation.oncancel=cleanup;
    }
    function ghost(sq,code) {
      const cell=cellAt(board,sq), el=document.createElement('span');
      el.className=(cell.hasAttribute('data-sq')?'pc':'study-piece')+' motion-ghost';
      el.setAttribute('aria-hidden','true'); el.innerHTML=pieceSVG(code);cell.append(el);return el;
    }
    const movers=[[start,end]];
    if(source.toLowerCase()==='k' && Math.abs(move.from.charCodeAt(0)-move.to.charCodeAt(0))===2) {
      const kingSide=move.to[0]==='g', rank=move.from[1], rook=[(kingSide?'h':'a')+rank,(kingSide?'f':'d')+rank];
      movers.push(reverse?rook.reverse():rook);
    }
    for (const [from,to] of movers) {
      const cell=cellAt(board,to), piece=cell?.querySelector('.study-piece,.pc');
      if (!piece || (dragged && from===start)) continue;
      const a=cellAt(board,from).getBoundingClientRect(), b=cell.getBoundingClientRect();
      const translate='translate('+(a.left-b.left)+'px,'+(a.top-b.top)+'px)';
      const promoting=before.get(from)!==after.get(to);
      if (promoting) {
        const pawn=ghost(to,before.get(from));
        run(pawn,[{transform:translate,opacity:1,zIndex:7},{transform:'none',opacity:1,zIndex:7,offset:.82},{opacity:0,zIndex:7}],()=>pawn.remove());
        run(piece,[{opacity:0},{opacity:0,offset:.8},{opacity:1}]);
      } else run(piece,[{transform:translate,zIndex:7},{transform:'none',zIndex:7}]);
    }
    const movingSources=new Set(movers.map(m=>m[0])), movingTargets=new Set(movers.map(m=>m[1]));
    for (const [sq,code] of before) {
      if (movingSources.has(sq) || after.get(sq)===code) continue;
      const captured=ghost(sq,code);
      run(captured,[{opacity:.85},{opacity:0,offset:.85},{opacity:0}],()=>captured.remove());
    }
    for (const [sq,code] of after) {
      if (!movingTargets.has(sq) && before.get(sq)!==code) {
        const el=cellAt(board,sq).querySelector('.study-piece,.pc');
        run(el,[{opacity:0},{opacity:1}]);
      }
    }
  }
  return {snapshot,cancel,play,pieceDrag,parkPromotion};
})();
