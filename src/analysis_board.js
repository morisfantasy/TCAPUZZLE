// Admin analysis board for coaches. Injected into workbook_app.js by build.js.
const ANALYSIS_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AnalysisBoard = {
  startFen: ANALYSIS_START_FEN, moves: [], redoMoves: [], currentPly: 0,
  chapters: [{ title: 'Free analysis', startFen: ANALYSIS_START_FEN, moves: [] }],
  chapterIndex: 0, flipped: false, selected: null, legal: [], annotations: [], uiBound: false,
  dragFrom: null, rightStart: null, suppressClickUntil: 0, error: '',
  info: '', bound: false, globalBound: false
};
function analysisBoardMarkup() {
  return '<section class="analysis-page" id="analysisPage">' +
    '<div class="analysis-layout"><div class="analysis-board-column">' +
      '<div class="analysis-board-wrap"><div class="analysis-board" id="analysisBoard" aria-label="Interactive chess analysis board"></div></div>' +
      '<div class="analysis-board-toolbar" aria-label="Board controls">' +
        '<button class="analysis-icon-btn" id="analysisFlip" title="Flip board" aria-label="Flip board">⇅</button>' +
      '</div><div class="analysis-status" id="analysisStatus" role="status"></div>' +
    '</div><aside class="analysis-side"><div class="analysis-moves-panel">' +
      '<div class="analysis-moves-head"><h2>Moves</h2><div class="analysis-moves-actions">' +
        '<button class="analysis-icon-btn" id="analysisOpenImport" title="Import PGN" aria-label="Import PGN">↥</button>' +
        '<button class="analysis-icon-btn" id="analysisMoreButton" title="More tools" aria-label="More tools" aria-expanded="false">⋯</button>' +
      '</div></div>' +
      '<div class="analysis-more-menu" id="analysisMoreMenu" hidden>' +
        '<button type="button" id="analysisCopyFen">Copy current position (FEN)</button><button type="button" id="analysisExportPgn">Download moves (PGN)</button><button type="button" id="analysisClearMarks">Clear arrows and circles</button>' +
      '</div>' +
      '<div class="analysis-chapter-select" id="analysisChapterWrap" hidden><label for="analysisChapter">Chapter</label><select id="analysisChapter" aria-label="Select PGN chapter"></select></div>' +
      '<div class="analysis-chapter-meta" id="analysisChapterMeta"></div><div class="analysis-move-list" id="analysisMoveList"></div>' +
      '<div class="analysis-navigation-toolbar" aria-label="Move navigation">' +
        '<button class="analysis-icon-btn" id="analysisStart" title="Go to beginning (Down Arrow)" aria-label="Go to beginning">⏮</button>' +
        '<button class="analysis-icon-btn" id="analysisPrev" title="Previous move (Left Arrow)" aria-label="Previous move">←</button>' +
        '<button class="analysis-icon-btn" id="analysisNext" title="Next move (Right Arrow)" aria-label="Next move">→</button>' +
        '<button class="analysis-icon-btn" id="analysisEnd" title="Go to end (Up Arrow)" aria-label="Go to end">⏭</button>' +
        '<span class="analysis-ply" id="analysisPly">Start position</span>' +
      '</div>' +
    '</div></aside></div>' +
    '<div class="analysis-import-modal" id="analysisImportModal" hidden><div class="analysis-import-backdrop" data-close-analysis-import></div><section class="analysis-import-dialog" role="dialog" aria-modal="true" aria-labelledby="analysisImportTitle">' +
      '<div class="analysis-import-dialog-head"><div><span class="analysis-eyebrow">THE CHESS ACADEMY</span><h2 id="analysisImportTitle">Import PGN</h2><p>Load a game or a study with multiple chapters.</p></div><button type="button" class="analysis-icon-btn" id="analysisCloseImport" aria-label="Close import dialog">×</button></div>' +
      '<label class="analysis-file-label" for="analysisPgnFile">Choose PGN file</label><input id="analysisPgnFile" type="file" accept=".pgn,.txt,text/plain,application/x-chess-pgn">' +
      '<label class="analysis-file-label" for="analysisPgnText">Or paste PGN</label><textarea id="analysisPgnText" rows="9" spellcheck="false" placeholder="[Event &quot;Training game&quot;]&#10;[White &quot;White&quot;]&#10;[Black &quot;Black&quot;]&#10;&#10;1. e4 e5 2. Nf3 Nc6"></textarea>' +
      '<div class="analysis-import-dialog-footer"><div class="analysis-message" id="analysisImportMessage" aria-live="polite"></div><button class="btn mint" id="analysisImport">Import PGN</button></div>' +
    '</section></div><div class="analysis-move-context" id="analysisMoveContextMenu" hidden><button type="button" id="analysisDeleteFromHere">Delete from here</button></div>' +
    '</section>';
}
function analysisGameAt(ply) {
  if (!window.Chess) throw new Error('The chess rules library did not load. Refresh and try again.');
  let game;
  try { game = new window.Chess(AnalysisBoard.startFen); } catch { game = new window.Chess(); }
  for (let i = 0; i < Math.min(ply, AnalysisBoard.moves.length); i++) {
    if (!game.move(AnalysisBoard.moves[i], { sloppy: true })) break;
  }
  return game;
}
function analysisFenBoard(fen) {
  return String(fen).split(' ')[0].split('/').map(row => {
    const a = [];
    for (const ch of row) { if (/[1-8]/.test(ch)) for (let i=0;i<Number(ch);i++) a.push(''); else a.push(ch); }
    return a;
  });
}
function analysisSquareName(file, rank) { return 'abcdefgh'[file] + String(rank); }
function analysisSquareCoords(s) { return { file:'abcdefgh'.indexOf(s[0]), rank:Number(s[1]) }; }
function analysisSquarePosition(s) {
  const p=analysisSquareCoords(s);
  return {x:(AnalysisBoard.flipped?7-p.file:p.file)+.5,y:(AnalysisBoard.flipped?p.rank-1:8-p.rank)+.5};
}
function analysisAnnotationSvg() {
  let svg='<svg class="analysis-annotations" viewBox="0 0 8 8" preserveAspectRatio="none" aria-hidden="true"><defs>' +
    '<marker id="analysisArrowGreen" markerWidth=".7" markerHeight=".7" refX=".5" refY=".35" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L.7,.35 L0,.7 Z" fill="#22a06b"/></marker>' +
    '<marker id="analysisArrowRed" markerWidth=".7" markerHeight=".7" refX=".5" refY=".35" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L.7,.35 L0,.7 Z" fill="#e64a3b"/></marker></defs>';
  AnalysisBoard.annotations.forEach(a=>{
    const p=analysisSquarePosition(a.from);
    if(a.from===a.to) svg+='<circle cx="'+p.x+'" cy="'+p.y+'" r=".39" fill="'+a.color+'" fill-opacity=".34" stroke="'+a.color+'" stroke-width=".07"/>';
    else { const q=analysisSquarePosition(a.to), marker=a.color==='#e64a3b'?'analysisArrowRed':'analysisArrowGreen';
      svg+='<line x1="'+p.x+'" y1="'+p.y+'" x2="'+q.x+'" y2="'+q.y+'" stroke="'+a.color+'" stroke-width=".16" stroke-linecap="round" stroke-opacity=".8" marker-end="url(#'+marker+')"/>'; }
  });
  return svg+'</svg>';
}
function analysisRenderMoves() {
  const el=$('#analysisMoveList'); if(!el)return;
  if(!AnalysisBoard.moves.length){el.innerHTML='<span class="analysis-empty-moves">No moves yet. Select a piece to begin.</span>';return;}
  let html='';
  for(let i=0;i<AnalysisBoard.moves.length;i+=2){
    const wp=i+1,bp=i+2;
    html+='<div class="analysis-move-row"><span class="analysis-move-number">'+(Math.floor(i/2)+1)+'.</span><button class="analysis-san '+(AnalysisBoard.currentPly===wp?'current':'')+'" data-ply="'+wp+'">'+esc(AnalysisBoard.moves[i])+'</button>'+
      (AnalysisBoard.moves[i+1]?'<button class="analysis-san '+(AnalysisBoard.currentPly===bp?'current':'')+'" data-ply="'+bp+'">'+esc(AnalysisBoard.moves[i+1])+'</button>':'')+'</div>';
  }
  el.innerHTML=html;
  $$('.analysis-san',el).forEach(b=>b.onclick=()=>analysisSetPosition(Number(b.dataset.ply)));
}
function analysisRenderBoard() {
  const el=$('#analysisBoard'); if(!el)return;
  let game;
  try{game=analysisGameAt(AnalysisBoard.currentPly);}catch(e){$('#analysisStatus').textContent=e.message;return;}
  const b=analysisFenBoard(game.fen()), legal=AnalysisBoard.legal.map(m=>m.to);
  let last={from:'',to:''};
  if(AnalysisBoard.currentPly){const h=game.history({verbose:true});const m=h[h.length-1];if(m)last={from:m.from,to:m.to};}
  let html='';
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
    const file=AnalysisBoard.flipped?7-col:col,rank=AnalysisBoard.flipped?row+1:8-row,sq=analysisSquareName(file,rank),piece=b[8-rank]?.[file]||'';
    const dark=(file+rank)%2===1,selected=AnalysisBoard.selected===sq,isLegal=legal.includes(sq);
    html+='<div class="analysis-square '+(dark?'dark':'light')+(selected?' selected':'')+(isLegal?' legal':'')+((last.from===sq||last.to===sq)?' last-move':'')+'" data-square="'+sq+'" role="button" tabindex="0" aria-label="'+sq+'">'+
      (piece?'<span class="analysis-piece '+(piece===piece.toUpperCase()?'white-piece':'black-piece')+'">'+pieceSVG(piece)+'</span>':'')+
      (isLegal?'<i class="analysis-legal-dot"></i>':'')+
      ((AnalysisBoard.flipped?col===7:col===0)?'<span class="analysis-rank">'+rank+'</span>':'')+
      (row===7?'<span class="analysis-file">'+'abcdefgh'[file]+'</span>':'')+'</div>';
  }
  el.innerHTML=html+analysisAnnotationSvg();
  $('#analysisPly').textContent=AnalysisBoard.currentPly===0?'Start position':'Move '+AnalysisBoard.currentPly+' / '+AnalysisBoard.moves.length;
  $('#analysisStatus').textContent=AnalysisBoard.error||AnalysisBoard.info||'';
  $('#analysisChapterMeta').textContent=(game.turn()==='w'?'White to move':'Black to move')+' · '+AnalysisBoard.moves.length+' plies';
  analysisRenderMoves();
}
function analysisSetPosition(ply) {
  AnalysisBoard.currentPly=Math.max(0,Math.min(AnalysisBoard.moves.length,ply));
  AnalysisBoard.selected=null;AnalysisBoard.legal=[];AnalysisBoard.error='';analysisRenderBoard();
}
function analysisPlayMove(from,to) {
  if(!from||!to||from===to)return false;
  let game;try{game=analysisGameAt(AnalysisBoard.currentPly);}catch(e){AnalysisBoard.error=e.message;analysisRenderBoard();return false;}
  const legal=game.moves({square:from,verbose:true}).filter(m=>m.to===to);if(!legal.length)return false;
  let promotion='q';
  if(legal.some(m=>m.promotion)){const answer=window.prompt('Promote to: q (queen), r (rook), b (bishop), or n (knight)','q');if(answer===null)return false;promotion=String(answer).trim().toLowerCase();if(!['q','r','b','n'].includes(promotion))promotion='q';}
  const move=game.move({from,to,promotion});if(!move)return false;
  AnalysisBoard.moves=AnalysisBoard.moves.slice(0,AnalysisBoard.currentPly);AnalysisBoard.redoMoves=[];AnalysisBoard.moves.push(move.san);AnalysisBoard.currentPly=AnalysisBoard.moves.length;
  if(AnalysisBoard.chapters[AnalysisBoard.chapterIndex])AnalysisBoard.chapters[AnalysisBoard.chapterIndex].moves=AnalysisBoard.moves.slice();
  AnalysisBoard.selected=null;AnalysisBoard.legal=[];AnalysisBoard.annotations=[];AnalysisBoard.error='';AnalysisBoard.info=move.san;analysisRenderBoard();return true;
}
function analysisSelectSquare(sq) {
  if(Date.now()<AnalysisBoard.suppressClickUntil)return;
  let game;try{game=analysisGameAt(AnalysisBoard.currentPly);}catch(e){AnalysisBoard.error=e.message;analysisRenderBoard();return;}
  if(AnalysisBoard.selected){
    if(analysisPlayMove(AnalysisBoard.selected,sq))return;
    if(AnalysisBoard.selected===sq){AnalysisBoard.selected=null;AnalysisBoard.legal=[];analysisRenderBoard();return;}
  }
  const p=game.get(sq);
  if(p&&p.color===game.turn()){AnalysisBoard.selected=sq;AnalysisBoard.legal=game.moves({square:sq,verbose:true});AnalysisBoard.error='';}
  else{AnalysisBoard.selected=null;AnalysisBoard.legal=[];}
  analysisRenderBoard();
}
function analysisParseHeaders(pgn) {
  const h={};String(pgn).replace(/^\[(\w+)\s+"([^"]*)"\]\s*$/gm,(_,k,v)=>{h[k]=v;return _;});return h;
}
function analysisStripVariations(pgn) {
  let out='',depth=0,brace=false,semi=false,tag=false;
  for(let i=0;i<pgn.length;i++){const c=pgn[i];
    if(semi){if(c==='\n'){semi=false;if(!depth)out+=c;}continue;}
    if(brace){if(c==='}')brace=false;continue;}
    if(tag){if(c===']')tag=false;if(!depth)out+=c;continue;}
    if(c==='['&&depth===0){tag=true;out+=c;continue;}
    if(c==='{'){brace=true;continue;}if(c===';'){semi=true;continue;}
    if(c==='('){depth++;continue;}if(c===')'){depth=Math.max(0,depth-1);continue;}
    if(!depth)out+=c;
  }return out;
}
function analysisSplitPgnGames(pgn) {
  const normalized=String(pgn||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
  if(!normalized)return [];
  // PGN study exports normally delimit each game/chapter with an Event header.
  return normalized.split(/(?=^\[Event\s+")/m).map(s=>s.trim()).filter(Boolean);
}
function analysisPgnTitle(headers,index) {
  let title=headers.ChapterName||headers.Chapter||headers.Event||'';
  if(title.startsWith('Study:'))title=title.slice(6).trim();
  if(!title||title.toLowerCase()==='casual game')title=[headers.White,headers.Black].filter(Boolean).join(' – ')||'Game '+(index+1);
  return title;
}
function analysisImportPgn(text) {
  if(!window.Chess)throw new Error('The chess rules library has not loaded. Refresh and try again.');
  const pgn=String(text||'').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').trim();
  if(!pgn)throw new Error('Choose a PGN file or paste a PGN first.');
  const parts=analysisSplitPgnGames(pgn),chapters=[];
  (parts.length?parts:[pgn]).forEach((part,i)=>{
    const headers=analysisParseHeaders(part);
    const clean=analysisStripVariations(part).replace(/^%.*$/gm,'').replace(/\$\d+/g,'').trim();
    let game=new window.Chess(),loaded=false,parseError=null;
    try { loaded=game.load_pgn(clean,{sloppy:true}); } catch(e) { parseError=e; }
    if(loaded===false||parseError) {
      // Retry untouched PGN for exports whose comments/annotations need the native parser.
      try {
        const retry=new window.Chess(),retryLoaded=retry.load_pgn(part,{sloppy:true});
        if(retryLoaded!==false){game=retry;loaded=retryLoaded;parseError=null;}
        else loaded=false;
      } catch(e) { parseError=e;loaded=false; }
    }
    if(loaded===false||parseError) {
      throw new Error('Could not read game/chapter '+(i+1)+'. Check that the file is a valid PGN with standard chess notation.'+(parseError&&parseError.message?' ('+parseError.message+')':''));
    }
    chapters.push({title:analysisPgnTitle(headers,i),startFen:headers.FEN||ANALYSIS_START_FEN,moves:game.history()});
  });
  if(!chapters.length)throw new Error('No games or chapters were found in that PGN.');
  // Do not replace the current board until every chapter has parsed successfully.
  AnalysisBoard.chapters=chapters;AnalysisBoard.redoMoves=[];analysisLoadChapter(0);
  $('#analysisChapter').innerHTML=chapters.map((c,i)=>'<option value="'+i+'">'+esc((i+1)+'. '+c.title)+'</option>').join('');
  $('#analysisChapterWrap').hidden=chapters.length<2;
  $('#analysisChapter').value='0';
  $('#analysisImportMessage').textContent='Imported '+chapters.length+(chapters.length===1?' game.':' chapters.');
  $('#analysisImportModal').hidden=true;
}
function analysisLoadChapter(i) {
  const ch=AnalysisBoard.chapters[i];if(!ch)return;
  AnalysisBoard.chapterIndex=i;AnalysisBoard.startFen=ch.startFen||ANALYSIS_START_FEN;AnalysisBoard.moves=ch.moves.slice();AnalysisBoard.currentPly=0;
  AnalysisBoard.selected=null;AnalysisBoard.legal=[];AnalysisBoard.annotations=[];AnalysisBoard.error='';AnalysisBoard.info='';
  const selector=$('#analysisChapter');if(selector)selector.value=String(i);
  const wrap=$('#analysisChapterWrap');if(wrap)wrap.hidden=AnalysisBoard.chapters.length<2;
  analysisRenderBoard();
}
function analysisBindBoard() {
  const board=$('#analysisBoard');if(!board)return;
  board.addEventListener('click',e=>{const sq=e.target.closest('[data-square]');if(sq)analysisSelectSquare(sq.dataset.square);});
  board.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const sq=e.target.closest('[data-square]');if(sq){e.preventDefault();analysisSelectSquare(sq.dataset.square);}});
  board.addEventListener('contextmenu',e=>e.preventDefault());
  board.addEventListener('pointerdown',e=>{
    const sq=e.target.closest('[data-square]');if(!sq)return;
    if(e.button===2){e.preventDefault();AnalysisBoard.rightStart={square:sq.dataset.square,red:e.shiftKey};return;}
    if(e.button===0){let g=analysisGameAt(AnalysisBoard.currentPly);const p=g.get(sq.dataset.square);if(p&&p.color===g.turn())AnalysisBoard.dragFrom=sq.dataset.square;}
  });
  const globalUp=e=>{
    if(AnalysisBoard.rightStart){const from=AnalysisBoard.rightStart.square,target=document.elementFromPoint(e.clientX,e.clientY),toEl=target&&target.closest?target.closest('[data-square]'):null,to=toEl?toEl.dataset.square:from,color=AnalysisBoard.rightStart.red?'#d84b45':'#22a06b';
      const idx=AnalysisBoard.annotations.findIndex(a=>a.from===from&&a.to===to&&a.color===color);if(idx>=0)AnalysisBoard.annotations.splice(idx,1);else AnalysisBoard.annotations.push({from,to,color});
      AnalysisBoard.rightStart=null;analysisRenderBoard();}
    if(AnalysisBoard.dragFrom){const from=AnalysisBoard.dragFrom,target=document.elementFromPoint(e.clientX,e.clientY),toEl=target&&target.closest?target.closest('[data-square]'):null,to=toEl?toEl.dataset.square:null;AnalysisBoard.dragFrom=null;
      if(to&&to!==from&&analysisPlayMove(from,to))AnalysisBoard.suppressClickUntil=Date.now()+250;}
  };
  if(!AnalysisBoard.globalBound){document.addEventListener('pointerup',globalUp);AnalysisBoard.globalBound=true;}
  if(!AnalysisBoard.uiBound){
    document.addEventListener('keydown',e=>{
      const modal=$('#analysisImportModal'),context=$('#analysisMoveContextMenu');
      if(e.key==='Escape'){if(modal&&!modal.hidden)modal.hidden=true;if(context)context.hidden=true;return;}
      if(!$('#analysisPage')||(modal&&!modal.hidden))return;
      const target=e.target;
      if(target&&(target.matches('input,textarea,select,[contenteditable="true"]')||target.closest('.analysis-import-dialog')))return;
      if(e.key==='ArrowLeft'){e.preventDefault();analysisSetPosition(AnalysisBoard.currentPly-1);}
      else if(e.key==='ArrowRight'){e.preventDefault();analysisSetPosition(AnalysisBoard.currentPly+1);}
      else if(e.key==='ArrowUp'){e.preventDefault();analysisSetPosition(AnalysisBoard.moves.length);}
      else if(e.key==='ArrowDown'){e.preventDefault();analysisSetPosition(0);}
    });
    document.addEventListener('click',e=>{
      const context=$('#analysisMoveContextMenu'),menu=$('#analysisMoreMenu');
      if(context&&!e.target.closest('#analysisMoveContextMenu')&&!e.target.closest('#analysisMoveList'))context.hidden=true;
      if(menu&&!menu.hidden&&!e.target.closest('#analysisMoreMenu')&&!e.target.closest('#analysisMoreButton')){
        menu.hidden=true;$('#analysisMoreButton')?.setAttribute('aria-expanded','false');
      }
    });
    AnalysisBoard.uiBound=true;
  }
  board.addEventListener('pointerup',e=>{if(e.button===2)e.preventDefault();});
  $('#analysisStart').onclick=()=>analysisSetPosition(0);
  $('#analysisPrev').onclick=()=>analysisSetPosition(AnalysisBoard.currentPly-1);
  $('#analysisNext').onclick=()=>analysisSetPosition(AnalysisBoard.currentPly+1);
  $('#analysisEnd').onclick=()=>analysisSetPosition(AnalysisBoard.moves.length);
  $('#analysisFlip').onclick=()=>{AnalysisBoard.flipped=!AnalysisBoard.flipped;analysisRenderBoard();};
  const modal=$('#analysisImportModal'),input=$('#analysisPgnText'),file=$('#analysisPgnFile');
  const openImport=()=>{modal.hidden=false;$('#analysisMoreMenu').hidden=true;$('#analysisMoreButton').setAttribute('aria-expanded','false');input.focus();};
  const closeImport=()=>{modal.hidden=true;};
  $('#analysisOpenImport').onclick=openImport;
  $('#analysisCloseImport').onclick=closeImport;
  $$('[data-close-analysis-import]').forEach(x=>x.onclick=closeImport);
  file.onchange=async e=>{
    const f=e.target.files&&e.target.files[0];if(!f)return;
    const message=$('#analysisImportMessage');message.textContent='Reading '+f.name+'…';
    try{
      let contents;
      if(typeof f.text==='function')contents=await f.text();
      else contents=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('Could not read this file.'));reader.readAsText(f);});
      input.value=contents;
      analysisImportPgn(contents);
      AnalysisBoard.error='';
    }catch(err){message.textContent=err&&err.message?err.message:'Could not import this PGN file.';}
    finally{file.value='';}
  };
  $('#analysisImport').onclick=()=>{try{analysisImportPgn(input.value);AnalysisBoard.error='';}catch(e){$('#analysisImportMessage').textContent=e&&e.message?e.message:'Could not import this PGN.';}};
  $('#analysisChapter').onchange=e=>analysisLoadChapter(Number(e.target.value));
  $('#analysisMoreButton').onclick=()=>{
    const menu=$('#analysisMoreMenu'),button=$('#analysisMoreButton'),open=menu.hidden;
    if(open){
      const rect=button.getBoundingClientRect(),menuWidth=205,menuHeight=132;
      menu.style.position='fixed';menu.style.right='auto';
      menu.style.left=Math.max(8,Math.min(rect.right-menuWidth,window.innerWidth-menuWidth-8))+'px';
      menu.style.top=Math.max(8,Math.min(rect.bottom+6,window.innerHeight-menuHeight-8))+'px';
    }
    menu.hidden=!open;button.setAttribute('aria-expanded',String(open));
  };
  $('#analysisCopyFen').onclick=async()=>{
    const fen=analysisGameAt(AnalysisBoard.currentPly).fen();
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(fen);
      else throw new Error('Clipboard API unavailable');
    }catch{
      let copied=false;const fallback=document.createElement('textarea');fallback.value=fen;fallback.setAttribute('readonly','');
      fallback.style.position='fixed';fallback.style.opacity='0';document.body.appendChild(fallback);fallback.select();
      try{copied=document.execCommand('copy');}catch{}fallback.remove();
      if(!copied){$('#analysisStatus').textContent='Could not copy FEN. Select and copy it manually from the board position.';return;}
    }
    AnalysisBoard.info='FEN copied to clipboard.';analysisRenderBoard();$('#analysisMoreMenu').hidden=true;
  };
  $('#analysisExportPgn').onclick=()=>{
    try{
      const g=analysisGameAt(AnalysisBoard.moves.length);
      const blob=new Blob([g.pgn({max_width:80,newline_char:'\\n'})],{type:'application/x-chess-pgn;charset=utf-8'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tca-analysis.pgn';
      document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      AnalysisBoard.info='PGN download started.';analysisRenderBoard();$('#analysisMoreMenu').hidden=true;
    }catch(e){$('#analysisStatus').textContent=e&&e.message?e.message:'Could not export PGN.';}
  };
  $('#analysisClearMarks').onclick=()=>{
    AnalysisBoard.annotations=[];AnalysisBoard.info='Arrows and circles cleared.';analysisRenderBoard();$('#analysisMoreMenu').hidden=true;
  };
  const context=$('#analysisMoveContextMenu');let deletePly=null;
  $('#analysisMoveList').addEventListener('contextmenu',e=>{
    const move=e.target.closest('[data-ply]');if(!move)return;
    e.preventDefault();deletePly=Number(move.dataset.ply);
    context.style.left=Math.min(e.clientX,window.innerWidth-190)+'px';
    context.style.top=Math.min(e.clientY,window.innerHeight-70)+'px';
    context.hidden=false;
  });
  $('#analysisMoveList').addEventListener('click',e=>{if(!e.target.closest('[data-ply]'))context.hidden=true;});
  $('#analysisDeleteFromHere').onclick=()=>{
    if(deletePly===null)return;
    const cut=Math.max(0,deletePly-1);
    AnalysisBoard.moves=AnalysisBoard.moves.slice(0,cut);
    AnalysisBoard.currentPly=Math.min(AnalysisBoard.currentPly,AnalysisBoard.moves.length);
    AnalysisBoard.redoMoves=[];
    if(AnalysisBoard.chapters[AnalysisBoard.chapterIndex])AnalysisBoard.chapters[AnalysisBoard.chapterIndex].moves=AnalysisBoard.moves.slice();
    AnalysisBoard.selected=null;AnalysisBoard.legal=[];AnalysisBoard.annotations=[];AnalysisBoard.error='';AnalysisBoard.info='Continuation deleted.';
    context.hidden=true;deletePly=null;analysisRenderBoard();
  };
  analysisRenderBoard();
}
function bindAnalysisBoard(){analysisBindBoard();}
