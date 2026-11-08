import {Chess} from './opening-chess.mjs';
import {arrowRoute,arrowOutline} from './opening-arrows.mjs';

export function openingBoard(el,{side,pieceSVG,motion,t,onMove,onIllegal}){
  const board=el.querySelector('.study-board'),promo=el.querySelector('.op-promotion');
  let chess,selected=null,marked=[],lastMove=null,press=null,choices=[],canMove=false;
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
  function set(fen,{move=null,marks=[],reverse=false,interactive=false}={}){
    const before=chess&&motion.snapshot(board);chess=new Chess(fen);selected=null;canMove=interactive;marked=marks;lastMove=move;choices=[];promo.hidden=true;
    board.toggleAttribute('data-playing',interactive);paint();if(move&&before)motion.play(board,before,move,reverse);
  }
  function submit(from,to){
    const moves=chess.moves({square:from,verbose:true}).filter(m=>m.to===to);
    if(!moves.length){onIllegal?.();return;}
    if(moves.length>1){choices=moves;promo.innerHTML='<span>'+t('promote')+'</span>'+moves.map(m=>'<button type="button" class="soft-button" data-promo="'+m.promotion+'">'+pieceSVG(side==='w'?m.promotion.toUpperCase():m.promotion)+'</button>').join('');promo.hidden=false;return;}
    onMove(from+to+(moves[0].promotion||''));
  }
  function select(s){
    if(!canMove||!s)return;
    const man=chess.get(s);
    if(s===selected){selected=null;paint();return;}
    if(man?.color===chess.turn()){selected=s;paint();return;}
    if(selected)submit(selected,s);
  }
  board.onpointerdown=e=>{if(!canMove||e.button!==0)return;const cell=e.target.closest('[data-square]');if(cell){press={s:cell.dataset.square,x:e.clientX,y:e.clientY};board.setPointerCapture(e.pointerId);}};
  board.onpointerup=e=>{
    if(!press)return;const from=press.s,target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-square]'),to=target?.dataset.square;
    const dragged=Math.hypot(e.clientX-press.x,e.clientY-press.y)>8;press=null;
    if(!target||!board.contains(target))return;
    if(dragged&&from!==to&&chess.get(from)?.color===chess.turn())submit(from,to);else select(to);
  };
  board.onpointercancel=()=>{press=null;};
  board.onclick=e=>{if(!e.detail)select(e.target.closest('[data-square]')?.dataset.square);};
  promo.onclick=e=>{const p=e.target.closest('[data-promo]')?.dataset.promo,m=choices.find(v=>v.promotion===p);if(m){promo.hidden=true;onMove(m.from+m.to+p);}};
  return {set,disable(){canMove=false;selected=null;promo.hidden=true;},clear(){motion.cancel(board);}};
}
