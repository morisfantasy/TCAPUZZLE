import {Chess} from './opening-chess.mjs';
import {arrowRoute,arrowOutline} from './opening-arrows.mjs';

export function openingBoard(el,{side,pieceSVG,motion,t,onMove,onIllegal}){
  const board=el.querySelector('.study-board'),promo=el.querySelector('.op-promotion');
  let chess,selected=null,marked=[],lastMove=null,press=null,promotion=null,canMove=false;
  const coord=sq=>{const file=sq.charCodeAt(0)-97,rank=+sq[1];return side==='b'?[7.5-file,rank-.5]:[file+.5,8.5-rank];};
  function marks(){
    const colors={G:'#147b50',R:'#b73435',B:'#274bb7',Y:'#a86a00'};
    return marked.map(m=>{const [x,y]=coord(m.from),[u,v]=coord(m.to),ink=colors[m.color]||colors.G;
      if(m.from===m.to)return '<circle cx="'+x+'" cy="'+y+'" r=".42" fill="none" stroke="'+ink+'" stroke-width=".09"/>';
      return '<path d="'+arrowOutline(arrowRoute([x,y],[u,v]))+'" fill="'+ink+'"/>';
    }).join('');
  }
  function paint(){
    motion.cancel(board);const cells=[],legal=selected?chess.moves({square:selected,verbose:true}).map(m=>m.to):[];
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){
      const file=side==='b'?7-x:x,rank=side==='b'?y+1:8-y,s=String.fromCharCode(97+file)+rank,p=chess.get(s);
      const man=p?(p.color==='w'?p.type.toUpperCase():p.type):'',cls=['study-square',(file+rank)%2?'dark':'light'];
      if(lastMove&&[lastMove.from,lastMove.to].includes(s))cls.push('was-moved');
      if(s===selected)cls.push('selected');if(legal.includes(s))cls.push(man?'capture':'legal');
      cells.push('<button type="button" class="'+cls.join(' ')+'" data-square="'+s+'" data-piece="'+man+'" aria-label="'+s+' '+man+'">'+
        (man?'<span class="study-piece">'+pieceSVG(man)+'</span>':'')+(x===0?'<small class="rank">'+rank+'</small>':'')+
        (y===7?'<small class="file">'+s[0]+'</small>':'')+'</button>');
    }
    board.dataset.fen=chess.fen();board.innerHTML=cells.join('')+'<svg class="board-marks" viewBox="0 0 8 8" aria-hidden="true">'+marks()+'</svg>';
  }
  function endPress(){
    if(!press)return;
    const {id,drag}=press;press=null;
    drag?.remove();
    if(board.hasPointerCapture(id))board.releasePointerCapture(id);
  }
  function closePromotion(){
    promotion?.restore?.();promotion=null;promo.hidden=true;
  }
  function set(fen,{move=null,marks=[],reverse=false,interactive=false,dragged=false}={}){
    endPress();closePromotion();
    const before=move&&chess&&motion.snapshot(board);
    chess=new Chess(fen);selected=null;canMove=interactive;marked=marks;lastMove=move;
    board.toggleAttribute('data-playing',interactive);paint();if(before)motion.play(board,before,move,reverse,dragged);
  }
  function commit(move,dragged){
    if(dragged)set(move.after,{move,dragged:true});
    onMove(move.from+move.to+(move.promotion||''),dragged?move.after:null);
  }
  function submit(from,to,dragged=false){
    const moves=chess.moves({square:from,verbose:true}).filter(m=>m.to===to);
    if(!moves.length){onIllegal?.();return;}
    if(moves.length>1){
      promotion={moves,dragged,restore:dragged?motion.parkPromotion(board,from,to):null};
      promo.innerHTML='<span>'+t('promote')+'</span>'+moves.map(m=>'<button type="button" class="soft-button" data-promo="'+m.promotion+'">'+pieceSVG(side==='w'?m.promotion.toUpperCase():m.promotion)+'</button>').join('');
      promo.hidden=false;return;
    }
    commit(moves[0],dragged);
  }
  function select(s){
    if(!canMove||promotion||!s)return;
    const man=chess.get(s);
    if(s===selected){selected=null;paint();return;}
    if(man?.color===chess.turn()){selected=s;paint();return;}
    if(selected)submit(selected,s);
  }
  board.onpointerdown=e=>{
    if(!canMove||press||promotion||e.button!==0)return;
    const cell=e.target.closest('[data-square]');if(!cell)return;
    e.preventDefault();
    const from=cell.dataset.square;
    const drag=chess.get(from)?.color===chess.turn()?motion.pieceDrag(board,cell,e,()=>{
      selected=from;return chess.moves({square:from,verbose:true});
    }):null;
    press={id:e.pointerId,from,drag};board.setPointerCapture(e.pointerId);
  };
  board.onpointermove=e=>{if(press?.id===e.pointerId)press.drag?.move(e);};
  board.onpointerup=e=>{
    if(press?.id!==e.pointerId)return;
    const {from,drag}=press,target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-square]'),dragged=!!drag?.active;
    endPress();
    if(!target||!board.contains(target))return;
    const to=target.dataset.square;
    if(dragged){if(from!==to)submit(from,to,true);}
    else if(from===to)select(to);
  };
  board.onpointercancel=e=>{if(press?.id===e.pointerId)endPress();};
  board.onlostpointercapture=e=>{if(e.target===board && press?.id===e.pointerId)endPress();};
  const listeners=new AbortController();
  window.addEventListener('blur',endPress,{signal:listeners.signal});
  window.addEventListener('keydown',e=>{
    if(e.key==='Escape'){endPress();closePromotion();}
  },{signal:listeners.signal});
  board.onclick=e=>{if(e.detail===0)select(e.target.closest('[data-square]')?.dataset.square);};
  promo.onclick=e=>{
    const p=e.target.closest('[data-promo]')?.dataset.promo,move=promotion?.moves.find(m=>m.promotion===p);
    if(move){const {dragged}=promotion;closePromotion();commit(move,dragged);}
  };
  return {
    set,
    disable(){endPress();closePromotion();canMove=false;selected=null;board.removeAttribute('data-playing');},
    clear(){listeners.abort();endPress();closePromotion();motion.cancel(board);}
  };
}
