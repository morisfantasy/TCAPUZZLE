import { Chess, DEFAULT_POSITION } from './rules.mjs';
import { arrowRoute, arrowOutline, nearArrow } from './study-arrows.mjs';
import { makeChapter, appendMove, prefix, writeChapter } from './study.mjs';

const colors = { G:'#147b50', R:'#b73435', B:'#274bb7', Y:'#a86a00' };
const glyphs = { '$1':'!', '$2':'?', '$3':'!!', '$4':'??', '$5':'!?', '$6':'?!' };
let owner, chapters, index, flipped;
export function forgetStudy() { owner = null; chapters = null; }
function view(chapter) { return Object.assign(chapter, { current:0, preferred:new Map() }); }

export function mountAnalysis(root, { tr, esc, icon, pieceSVG, motion, user, denied }) {
  if (owner !== user || !chapters) {
    owner = user;
    chapters = [view(makeChapter(DEFAULT_POSITION))]; chapters[0].free = true; index = 0; flipped = false;
  }
  const $ = selector => root.querySelector(selector);
  const chapter = () => chapters[index];
  const node = () => chapter().nodes[chapter().current];
  const next = (id) => chapter().preferred.get(id) ?? chapter().nodes[id].children[0];
  let position, selected, legal = [], gesture, drawing = false, promotion, targetMove;
  let importRevision = 0, lastFocus = '', branchChoice = null;
  const control = (id, key, glyph) => '<button type="button" id="' + id + '" class="icon-button" title="' + tr(key) + '" aria-label="' + tr(key) + '">' + icon(glyph) + '</button>';
  root.innerHTML = '<section class="tool-title"><div class="title-icon">' + icon('analysis') + '</div><div><h1>' + tr('analysis') + '</h1></div></section>' +
    '<div class="study-layout"><div class="board-column"><div id="analysisBoard" class="study-board" tabindex="-1" aria-label="' + tr('analysis') + '"></div>' +
    '<div class="board-caption"><span id="positionTurn"></span><button class="draw-touch soft-button" id="drawToggle" aria-pressed="false">' + icon('pencil') + tr('annotate') + '</button></div>' +
    '<p class="board-hint" id="drawHint"></p><p id="analysisStatus" class="study-status" role="status"></p></div>' +
    '<aside class="move-panel tool-panel"><header class="move-head"><h2>' + tr('moves') + '</h2><button class="soft-button" id="analysisOpenImport">' + icon('upload') + tr('importPgn') + '</button>' +
    '<div class="menu-anchor"><button class="icon-button" id="analysisMoreButton" aria-haspopup="true" aria-controls="analysisMoreMenu" aria-expanded="false" aria-label="' + tr('tools') + '">' + icon('more') + '</button>' +
    '<div class="tool-menu" id="analysisMoreMenu" hidden>' + [['copyFen','copy'],['download','download'],['clearMarks','eraser']].map(([key,i])=>'<button data-tool="' + key + '">' + icon(i) + tr(key) + '</button>').join('') + '</div></div></header>' +
    '<div class="chapter-picker"><label for="analysisChapter">' + tr('chapter') + '</label><select id="analysisChapter"></select><div id="chapterDetails"></div></div>' +
    '<div class="move-scroll" id="analysisMoveList"></div><div class="branch-picker" id="branchPicker" hidden></div><div class="study-controls">' +
    control('analysisStart','first','first') + control('analysisPrev','previous','previous') + control('analysisNext','next','next') + control('analysisEnd','last','last') + control('analysisFlip','flip','flip') + '</div>' +
    '<div id="currentNote" class="current-note" hidden></div></aside></div>' +
    '<dialog id="analysisImportModal" class="tool-dialog" aria-labelledby="importTitle"><header><h2 id="importTitle">' + tr('importPgn') + '</h2>' + control('closeImport','close','close') + '</header>' +
    '<label class="file-choice" for="analysisPgnFile">' + icon('upload') + tr('file') + '<input type="file" id="analysisPgnFile" accept=".pgn,.txt,application/x-chess-pgn,text/plain"></label>' +
    '<label class="calc-field"><span>' + tr('paste') + '</span><textarea id="analysisPgnText" spellcheck="false" rows="7" placeholder="1. e4 e5 2. Nf3 Nc6 *"></textarea></label>' +
    '<p id="analysisImportMessage" role="alert"></p><button id="analysisImport" class="primary-button">' + tr('load') + '</button></dialog>' +
    '<dialog id="moveDialog" class="tool-dialog compact-dialog" aria-labelledby="moveTitle"><header><h2 id="moveTitle"></h2>' + control('closeMove','close','close') + '</header><button class="danger-button" id="deleteMove">' + icon('trash') + tr('deleteLine') + '</button></dialog>' +
    '<dialog id="promoDialog" class="tool-dialog compact-dialog" aria-labelledby="promoTitle"><header><h2 id="promoTitle">' + tr('promote') + '</h2>' + control('closePromo','close','close') + '</header><div class="promo-choices"></div></dialog>' +
    '<dialog id="fenDialog" class="tool-dialog" aria-label="FEN"><header><h2>FEN</h2>' + control('closeFen','close','close') + '</header><textarea readonly id="fenText" rows="3" aria-label="FEN"></textarea></dialog>';

  const board = $('#analysisBoard'), more = $('#analysisMoreMenu'), modal = $('#analysisImportModal'), moveList = $('#analysisMoveList');
  const listeners = new AbortController();
  const {signal} = listeners;
  const status = message => { $('#analysisStatus').textContent = message; };
  const title = (ch, i) => ch.headers.ChapterName || ch.headers.Chapter ||
    [ch.headers.White,ch.headers.Black].filter(v=>v && v!=='?').join(' – ') ||
    ch.headers.Event || (ch.free ? tr('free') : tr('game',i+1));

  function setupChapter() {
    $('#analysisChapter').innerHTML = chapters.map((ch,i)=>'<option value="' + i + '">' + esc(title(ch,i)) + '</option>').join('');
    $('#analysisChapter').value = String(index);
    const tags = Object.entries(chapter().headers).filter(([tag])=>!['FEN','SetUp'].includes(tag));
    $('#chapterDetails').innerHTML = tags.length ? '<details><summary>' + tr('details') + '</summary><dl>' +
      tags.map(([k,v])=>'<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join('') + '</dl></details>' : '';
    setPosition(chapter().current, false);
  }
  function coords(square) {
    const x = square.charCodeAt(0)-97, rank = +square[1];
    return [flipped ? 7.5-x : x+.5, flipped ? rank-.5 : 8.5-rank];
  }

  function eraseOrCircle(square,event,color) {
    const marks=node().marks, box=board.getBoundingClientRect();
    const p=[8*(event.clientX-box.left)/box.width,8*(event.clientY-box.top)/box.height];
    let i=marks.findIndex(m=>m.from===square && m.to===square);
    if (i<0) for(let j=marks.length-1;j>=0;j--) {
      const m=marks[j];
      if(m.from!==m.to && nearArrow(p,arrowRoute(coords(m.from),coords(m.to)))){i=j;break;}
    }
    if(i>=0){marks.splice(i,1);paintMarks();}else toggleMark(square,square,color);
  }
  function paintMarks() {
    const marks = [...node().marks];
    if (gesture?.draw && gesture.to && gesture.to!==gesture.from) marks.push(gesture);
    const shapes = marks.map(({from,to,color})=>{
      const [x,y] = coords(from), [u,v] = coords(to), ink = colors[color] || colors.G;
      if (from===to) return '<circle cx="' + x + '" cy="' + y + '" r=".42" stroke="' + ink + '" stroke-width=".09" fill="none"/>';
      const route=arrowRoute([x,y],[u,v]);
      return '<path data-arrow="'+(route.length===3?'knight':'straight')+'" d="'+arrowOutline(route)+'" fill="'+ink+'"/>';
    }).join('');
    board.querySelector('.board-marks').innerHTML=shapes;
  }
  function paintBoard() {
    motion.cancel(board);
    const targets = new Set(legal.map(m=>m.to)), checked = position.isCheck();
    let html = '';
    for (let row=0; row<8; row++) for (let col=0; col<8; col++) {
      const file=flipped?7-col:col, rank=flipped?row+1:8-row, square=String.fromCharCode(97+file)+rank;
      const p=position.get(square), piece=p ? p.color==='w'?p.type.toUpperCase():p.type : '';
      const name=p?tr('pieces').split(',')['pnbrqk'.indexOf(p.type)]:'';
      const classes=['study-square',(file+rank)%2?'dark':'light',node().from===square||node().to===square?'was-moved':'',
        square===selected?'selected':'', targets.has(square)?piece?'capture':'legal':'',
        checked&&p?.type==='k'&&p.color===position.turn()?'in-check':''].filter(Boolean).join(' ');
      html += '<button class="' + classes + '" data-square="' + square + '" data-piece="' + piece + '" aria-label="' + square + ' ' + name + '" tabindex="' + ((lastFocus||'e2')===square?'0':'-1') + '">' +
        (piece?'<span class="study-piece">' + pieceSVG(piece) + '</span>':'') +
        (col===0?'<small class="rank">' + rank + '</small>':'') + (row===7?'<small class="file">' + square[0] + '</small>':'') + '</button>';
    }
    board.innerHTML=html + '<svg class="board-marks" viewBox="0 0 8 8" aria-hidden="true"></svg>';
    board.dataset.fen=position.fen();
    paintMarks();
    const state=checked?tr(position.isCheckmate()?'mate':'check'):position.isStalemate()?tr('stalemate'):'';
    $('#positionTurn').innerHTML='<i class="turn-disc ' + position.turn() + '"></i>' + tr(position.turn()==='w'?'white':'black') + (state?' · ' + state:'');
  }
  function moveButton(id) {
    const n=chapter().nodes[id];
    return '<button class="san' + (chapter().current===id?' current':'') + '" data-node="' + id + '" aria-current="' + (chapter().current===id?'step':'false') + '">' +
      esc(n.san) + (n.nags||[]).map(v=>esc(glyphs[v]||v)).join(' ') + (n.comment||n.before?' <span class="note-dot">•</span>':'') + '</button>' +
      (chapter().current===id?'<button class="move-options" data-edit-move="' + id + '" title="' + tr('moveOptions') + '" aria-label="' + tr('moveOptions') + '">' + icon('more') + '</button>':'');
  }
  function paintMoves(scroll) {
    const {nodes,current} = chapter();
    const output=[];
    let parent=0, row;
    while (next(parent)!=null) {
      const id=next(parent), p=nodes[parent], side=p.fen.split(' ')[1];
      if (!row||side==='w') { row={number:p.fen.split(' ')[5],w:'',b:'',branches:[]}; output.push(row); }
      row[side]=moveButton(id);
      for (const child of p.children) if (child!==id) {
        row.branches.push('<button class="branch-move" data-node="' + child + '">' + icon('branch') + esc(prefix(p.fen) + ' ' + nodes[child].san) + '</button>');
      }
      parent=id;
    }
    moveList.innerHTML=output.length?output.map(r=>'<div class="notation-row"><span>' + r.number + '.</span><div>' + (r.w||'…') + '</div><div>' + r.b + '</div></div>' +
      (r.branches.length?'<div class="variation-row" aria-label="' + tr('variation') + '">' + r.branches.join('') + '</div>':'')).join('') :
      '<p class="moves-empty">' + tr('movesEmpty') + '</p>';
    $('#analysisStart').disabled=$('#analysisPrev').disabled=current===0;
    $('#analysisNext').disabled=$('#analysisEnd').disabled=next(current)==null;
    const currentNote=$('#currentNote'), n=nodes[current];
    currentNote.hidden=!n.comment&&!n.before;
    currentNote.textContent=[n.before,n.comment].filter(Boolean).join(' · ');
    paintBranchPicker();
    if (scroll) {
      const active=moveList.querySelector('.current');
      if (active) {
        const {top,bottom}=active.getBoundingClientRect(), box=moveList.getBoundingClientRect();
        if (top<box.top) moveList.scrollTop+=top-box.top;
        else if (bottom>box.bottom) moveList.scrollTop+=bottom-box.bottom;
      }
    }
  }
  function setPosition(id, scroll=true, dragged=false) {
    if (id==null) return;
    const ch=chapter(), n=ch.nodes[id];
    branchChoice=null;
    const previous=ch.nodes[ch.current], reverse=previous?.parent===id;
    const edge=scroll && (reverse?previous:n.parent===ch.current?n:null);
    const before=edge?motion.snapshot(board):null;
    if(n.parent!=null) ch.preferred.set(n.parent,id);
    ch.current=id; position=new Chess(n.fen); selected=null; legal=[];
    paintBoard(); if(edge)motion.play(board,before,edge,reverse,dragged); paintMoves(scroll);
  }
  function nearestBranch() {
    const ch=chapter();
    for(let id=ch.current;id!=null;id=ch.nodes[id].parent) {
      if(ch.nodes[id].children.length>1)return id;
    }
    return null;
  }
  function paintBranchPicker() {
    const picker=$('#branchPicker'), ch=chapter();
    if(!branchChoice) {
      const count=node().children.length;
      picker.hidden=count<2;
      picker.innerHTML=count<2?'':'<button class="branch-trigger" data-open-branch>'+icon('branch')+tr('chooseBranch')+' <b>'+count+'</b></button>';
      return;
    }
    const {parent,selected}=branchChoice, p=ch.nodes[parent];
    picker.hidden=false;
    const options=p.children.map((id,i)=>{
      const move=ch.nodes[id], follow=next(id);
      return '<button role="option" tabindex="-1" id="branchOption'+i+'" data-branch-option="'+id+'" aria-selected="'+(id===selected)+'"><strong>'+
        esc(prefix(p.fen)+' '+move.san)+'</strong>'+(follow!=null?'<span>'+esc(prefix(move.fen)+' '+ch.nodes[follow].san)+'</span>':'')+'</button>';
    }).join('');
    picker.innerHTML='<div class="branch-picker-title">'+icon('branch')+'<b>'+tr('chooseBranch')+'</b><button class="icon-button" data-cancel-branch aria-label="'+tr('close')+'">'+icon('close')+'</button></div>'+
      '<div role="listbox" tabindex="0" aria-label="'+tr('variation')+'" aria-activedescendant="branchOption'+p.children.indexOf(selected)+'">'+options+'</div><small>'+tr('branchKeys')+'</small>';
    const list=picker.querySelector('[role=listbox]');
    list.focus({preventScroll:true});
    const active=list.querySelector('[aria-selected=true]');
    if(active.offsetTop<list.scrollTop)list.scrollTop=active.offsetTop;
    else if(active.offsetTop+active.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=active.offsetTop+active.offsetHeight-list.clientHeight;
  }
  function chooseBranch(parent,step=0) {
    if(parent==null)return false;
    const ch=chapter(),choices=ch.nodes[parent].children;
    const current=branchChoice?.parent===parent?branchChoice.selected:next(parent);
    const i=(choices.indexOf(current)+step+choices.length)%choices.length;
    branchChoice={parent,selected:choices[i]};
    paintBranchPicker();return true;
  }
  function closeBranch() {
    branchChoice=null;paintBranchPicker();board.focus({preventScroll:true});
  }
  $('#branchPicker').onclick=e=>{
    const option=e.target.closest('[data-branch-option]');
    if(option){setPosition(Number(option.dataset.branchOption));board.focus({preventScroll:true});}
    else if(e.target.closest('[data-cancel-branch]'))closeBranch();
    else if(e.target.closest('[data-open-branch]'))chooseBranch(chapter().current);
  };
  function navigate(key) {
    const ch=chapter(), current=ch.current;
    if (key==='first') setPosition(0);
    if (key==='previous') setPosition(ch.nodes[current].parent);
    if (key==='next') {
      if(branchChoice){setPosition(branchChoice.selected);board.focus({preventScroll:true});}
      else if(ch.nodes[current].children.length>1)chooseBranch(current);
      else setPosition(next(current));
    }
    if (key==='last') { let id=current; while(next(id)!=null) id=next(id); setPosition(id); }
  }
  function select(square) {
    const piece=position.get(square);
    selected=selected!==square && piece?.color===position.turn()?square:null;
    legal=selected?position.moves({square:selected,verbose:true}):[];
    paintBoard();
  }
  function play(from,to,promoteTo,dragged=false) {
    const choices=position.moves({square:from,verbose:true}).filter(m=>m.to===to);
    if (!choices.length) return false;
    if (choices.some(m=>m.promotion) && !promoteTo) {
      promotion={from,to,dragged};
      $('.promo-choices').innerHTML=['q','r','b','n'].map(v=>'<button class="icon-button" data-promotion="' + v + '" aria-label="' + tr('pieces').split(',')['pnbrqk'.indexOf(v)] + '">' +
        pieceSVG(position.turn()==='w'?v.toUpperCase():v) + '</button>').join('');
      $('#promoDialog').showModal(); return true;
    }
    const move=position.move({from,to,promotion:promoteTo});
    const ch=chapter(), existing=node().children.find(id=>ch.nodes[id].san===move.san);
    if (existing==null && !node().children.length && onMainLine(ch.current) && ch.headers.Result) ch.headers.Result='*';
    const id=existing??appendMove(ch,ch.current,move); setPosition(id,true,dragged); status(''); return true;
  }
  function onMainLine(id) {
    const {nodes}=chapter();
    while (id!==0) { const parent=nodes[id].parent; if(nodes[parent].children[0]!==id)return false; id=parent; }
    return true;
  }
  function tap(square) { if (!selected||selected===square||!play(selected,square)) select(square); }
  function toggleMark(from,to,color) {
    const marks=node().marks, i=marks.findIndex(m=>m.from===from && m.to===to && m.color===color);
    if (i<0) marks.push({from,to,color}); else marks.splice(i,1);
    paintMarks();
  }
  function squareAt(e) {
    const el=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-square]');
    return el && board.contains(el)?el.dataset.square:null;
  }
  function finishGesture() {
    if(!gesture)return;
    gesture.ghost?.remove(); board.querySelector('.drag-origin')?.classList.remove('drag-origin');
    const id=gesture.id; gesture=null;
    if(board.hasPointerCapture(id))board.releasePointerCapture(id);
    paintMarks();
  }
  board.oncontextmenu=e=>e.preventDefault();
  board.onpointerdown=e=>{
    const sq=e.target.closest('[data-square]');
    if (!sq || gesture || ![0,2].includes(e.button))return;
    e.preventDefault(); lastFocus=sq.dataset.square;
    gesture={id:e.pointerId,from:sq.dataset.square,x:e.clientX,y:e.clientY,time:e.timeStamp,clear:e.altKey,draw:e.button===2||drawing,color:e.shiftKey?'R':'G'};
    board.setPointerCapture(e.pointerId);
  };
  board.onpointermove=e=>{
    if (!gesture||e.pointerId!==gesture.id)return;
    const to=squareAt(e);
    if (gesture.draw) { gesture.to=to; paintMarks(); return; }
    const {from}=gesture;
    if(!gesture.ghost && Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>5 && position.get(from)?.color===position.turn()) {
      selected=from; legal=position.moves({square:from,verbose:true}); paintBoard();
      const origin=board.querySelector('[data-square="' + from + '"]');
      gesture.ghost=origin.querySelector('.study-piece').cloneNode(true);
      gesture.ghost.className='drag-piece'; gesture.ghost.style.width=origin.clientWidth + 'px';
      origin.classList.add('drag-origin'); root.append(gesture.ghost);
    }
    if(gesture.ghost) { gesture.ghost.style.left=e.clientX+'px'; gesture.ghost.style.top=e.clientY+'px'; }
  };
  board.onpointerup=e=>{
    if (!gesture||gesture.id!==e.pointerId)return;
    const {from,draw,color,ghost,clear,time}=gesture, to=squareAt(e);
    finishGesture(); if(!to)return;
    if(draw && from===to && (clear || (e.pointerType!=='mouse' && e.timeStamp-time>=550))){node().marks=[];paintMarks();}
    else if(draw && from===to)eraseOrCircle(to,e,color);
    else if(draw)toggleMark(from,to,color);
    else if(ghost||from!==to){ if(from!==to)play(from,to,undefined,!!ghost); }
    else tap(to);
  };
  board.onlostpointercapture=board.onpointercancel=finishGesture;
  board.onclick=e=>{ if(e.detail===0){const sq=e.target.closest('[data-square]');if(sq)tap(sq.dataset.square);} };
  function closeMore() { more.hidden=true; $('#analysisMoreButton').setAttribute('aria-expanded','false'); }
  $('#analysisMoreButton').onclick=()=>{
    more.hidden=!more.hidden; $('#analysisMoreButton').setAttribute('aria-expanded',String(!more.hidden));
    if(!more.hidden)more.querySelector('button').focus();
  };
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('.menu-anchor'))closeMore();},{signal});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!more.hidden){closeMore();$('#analysisMoreButton').focus();return;}
    if(e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !more.hidden || root.querySelector('dialog[open]') ||
      e.target.closest('input,select,textarea,[contenteditable="true"],.lang-menu,.platform-nav,.bar-tools'))return;
    if(e.key==='ArrowDown' || e.key==='ArrowUp') {
      const parent=branchChoice?.parent??nearestBranch();
      if(parent!=null){e.preventDefault();chooseBranch(parent,e.key==='ArrowDown'?1:-1);}
      return;
    }
    if(branchChoice && ['Escape','ArrowLeft'].includes(e.key)){e.preventDefault();closeBranch();return;}
    const command={ArrowLeft:'previous',ArrowRight:'next',Home:'first',End:'last'}[e.key] || (branchChoice && e.key==='Enter'?'next':null);
    if(command){e.preventDefault();navigate(command);}
  },{signal});
  for(const [id,key] of [['Start','first'],['Prev','previous'],['Next','next'],['End','last']]) $('#analysis'+id).onclick=()=>navigate(key);
  $('#analysisFlip').onclick=()=>{flipped=!flipped;paintBoard();};
  $('#drawToggle').onclick=()=>{
    drawing=!drawing; $('#drawToggle').setAttribute('aria-pressed',String(drawing));
    $('#drawHint').textContent=tr(drawing?'drawTouch':'drawHint'); $('#drawHint').classList.toggle('touch-active',drawing);
  };
  $('#drawHint').textContent=tr('drawHint');
  $('#analysisChapter').onchange=e=>{index=+e.target.value;setupChapter();status('');board.focus({preventScroll:true});};
  function openMove(id) {
    targetMove=id; const ch=chapter(), n=ch.nodes[id];
    $('#moveTitle').textContent=prefix(ch.nodes[n.parent].fen)+' '+n.san;
    $('#moveDialog').showModal();
  }
  moveList.onclick=e=>{
    const edit=e.target.closest('[data-edit-move]'), b=e.target.closest('[data-node]');
    if(edit)openMove(+edit.dataset.editMove);else if(b)setPosition(+b.dataset.node);
  };
  moveList.oncontextmenu=e=>{const b=e.target.closest('[data-node]'); if(b){e.preventDefault();openMove(+b.dataset.node);}};
  $('#deleteMove').onclick=()=>{
    const ch=chapter(), n=ch.nodes[targetMove], parent=ch.nodes[n.parent];
    if(onMainLine(targetMove) && ch.headers.Result)ch.headers.Result='*';
    parent.children=parent.children.filter(id=>id!==targetMove);
    if(ch.preferred.get(n.parent)===targetMove)ch.preferred.delete(n.parent);
    let cursor=ch.current;
    while(cursor!=null&&cursor!==targetMove)cursor=ch.nodes[cursor].parent;
    $('#moveDialog').close(); setPosition(cursor===targetMove?n.parent:ch.current);
  };
  $('.promo-choices').onclick=e=>{
    const b=e.target.closest('[data-promotion]'); if(!b)return;
    $('#promoDialog').close(); play(promotion.from,promotion.to,b.dataset.promotion,promotion.dragged);
  };
  for(const [button,dialog] of [['#closeImport','#analysisImportModal'],['#closeMove','#moveDialog'],['#closePromo','#promoDialog'],['#closeFen','#fenDialog']]) $(button).onclick=()=>$(dialog).close();
  for(const d of root.querySelectorAll('dialog'))d.addEventListener('click',e=>{ if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close(); });
  more.onclick=async e=>{
    const key=e.target.closest('[data-tool]')?.dataset.tool;
    if(!key)return; closeMore();$('#analysisMoreButton').focus();
    if(key==='clearMarks'){node().marks=[]; paintMarks();}
    if(key==='copyFen'){
      try{await navigator.clipboard.writeText(position.fen());status(tr('copied'));}
      catch{ $('#fenText').value=position.fen();$('#fenDialog').showModal();$('#fenText').select(); }
    }
    if(key==='download'){
      const url=URL.createObjectURL(new Blob([chapters.map(writeChapter).join('\n\n')+'\n'],{type:'application/x-chess-pgn;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download='tca-study.pgn';root.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  };
  const area=$('#analysisPgnText'), file=$('#analysisPgnFile'), message=$('#analysisImportMessage');
  $('#analysisOpenImport').onclick=()=>{closeMore();message.textContent='';modal.showModal();area.focus();};
  modal.addEventListener('close',()=>{++importRevision; $('#analysisImport').disabled=false;file.disabled=false;});
  async function importPgn(read) {
    const request=++importRevision;
    const active=()=>request===importRevision && root.isConnected && modal.open;
    message.textContent=tr('busy');$('#analysisImport').disabled=true;file.disabled=true;
    try{
      const pgn=await read(); if(!active())return;
      if(new Blob([pgn]).size>1048576)throw Error(tr('pgnSize'));
      const response=await fetch('/api/analysis/import',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify({pgn}),signal});
      if(!active())return;
      if(response.status===401||response.status===403){denied();return;}
      const data=await response.json();
      if(!response.ok)throw Error(data.code?tr(data.code,data.detail):tr('unavailable'));
      if(!active())return;
      chapters=data.chapters.map(view);index=0;setupChapter();modal.close();area.value='';status(tr('imported',chapters.length));
    }catch(err){if(active())message.textContent=err.message||tr('unavailable');}
    finally{if(active()){$('#analysisImport').disabled=false;file.disabled=false;}}
  }
  $('#analysisImport').onclick=()=>importPgn(()=>area.value);
  file.onchange=()=>{
    const selectedFile=file.files[0];file.value='';if(!selectedFile)return;
    importPgn(async()=>{
      if(selectedFile.size>1048576)throw Error(tr('pgnSize'));
      const bytes=await selectedFile.arrayBuffer();let text;
      const encoding=new Uint8Array(bytes);
      if(encoding[0]===255&&encoding[1]===254)text=new TextDecoder('utf-16le').decode(bytes);
      else if(encoding[0]===254&&encoding[1]===255)text=new TextDecoder('utf-16be').decode(bytes);
      else try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{text=new TextDecoder('windows-1252').decode(bytes);}
      area.value=text;return text;
    });
  };
  setupChapter();
  return ()=>{listeners.abort(); motion.cancel(board); ++importRevision; gesture?.ghost?.remove();};
}
