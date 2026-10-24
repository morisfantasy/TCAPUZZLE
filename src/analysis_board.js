// Admin analysis board for coaches. Injected into workbook_app.js by build.js.
const ANALYSIS_START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const AnalysisBoard = {
  startFen: ANALYSIS_START_FEN, moves: [], redoMoves: [], currentPly: 0,
  chapters: [{ title: 'Free analysis', startFen: ANALYSIS_START_FEN, moves: [] }],
  chapterIndex: 0, flipped: false, selected: null, legal: [], annotations: [],
  dragFrom: null, rightStart: null, suppressClickUntil: 0, error: '',
  info: '', bound: false, globalBound: false
};
function analysisBoardMarkup() {
  return '<section class="analysis-workspace card" id="analysisWorkspace">' +
    '<div class="analysis-heading"><div><span class="analysis-eyebrow">COACH WORKSPACE</span><h2>Analysis board</h2><p>Explore positions, prepare lessons and annotate ideas.</p></div><span class="analysis-admin-pill">ADMIN</span></div>' +
    '<div class="analysis-layout"><div class="analysis-board-column">' +
      '<div class="analysis-toolbar"><button class="btn white" id="analysisStart" title="Go to start">|◀</button><button class="btn white" id="analysisPrev" title="Previous move">‹</button><button class="btn white" id="analysisNext" title="Next move">›</button><button class="btn white" id="analysisEnd" title="Go to end">▶|</button><span class="analysis-ply" id="analysisPly">Start position</span><span class="analysis-toolbar-spacer"></span><button class="btn white" id="analysisUndo">Undo</button><button class="btn white" id="analysisRedo">Redo</button><button class="btn white" id="analysisFlip">Flip</button><button class="btn white" id="analysisReset">Reset</button></div>' +
      '<div class="analysis-board-wrap"><div class="analysis-board" id="analysisBoard" aria-label="Interactive chess analysis board"></div></div>' +
      '<div class="analysis-board-note">Left-click or drag pieces to move. Right-click a square to circle it; right-drag to draw an arrow. Shift + right-click draws in red.</div><div class="analysis-status" id="analysisStatus" role="status"></div>' +
      '<div class="analysis-move-list-wrap"><div class="analysis-section-title">Moves</div><div class="analysis-move-list" id="analysisMoveList"></div></div>' +
    '</div><aside class="analysis-side">' +
      '<div class="analysis-side-card"><div class="analysis-section-title">PGN study or game</div><p class="analysis-help">Upload a .pgn file or paste PGN below. Multi-game PGNs are shown as chapters; variations are simplified to the main line.</p>' +
      '<label class="analysis-file-label" for="analysisPgnFile">Choose PGN file</label><input id="analysisPgnFile" type="file" accept=".pgn,.txt,text/plain,application/x-chess-pgn">' +
      '<textarea id="analysisPgnText" rows="8" spellcheck="false" placeholder="[Event &quot;Training game&quot;]&#10;[White &quot;White&quot;]&#10;[Black &quot;Black&quot;]&#10;&#10;1. e4 e5 2. Nf3 Nc6"></textarea><button class="btn mint block" id="analysisImport">Import PGN</button><div class="analysis-message" id="analysisImportMessage" aria-live="polite"></div></div>' +
      '<div class="analysis-side-card"><div class="analysis-section-title">Chapters</div><select id="analysisChapter" aria-label="Select PGN chapter"></select><div class="analysis-chapter-meta" id="analysisChapterMeta"></div></div>' +
      '<div class="analysis-side-card"><div class="analysis-section-title">Position tools</div><div class="analysis-tool-grid"><button class="btn white" id="analysisCopyFen">Copy FEN</button><button class="btn white" id="analysisExportPgn">Export PGN</button><button class="btn white" id="analysisClearMarks">Clear arrows</button></div><p class="analysis-help">No engine is running. Designed for free analysis and teaching.</p></div>' +
    '</aside></div></section>';
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
function analysisImportPgn(text) {
  if(!window.Chess)throw new Error('The chess rules library has not loaded. Refresh and try again.');
  const pgn=String(text||'').trim();if(!pgn)throw new Error('Choose a PGN file or paste a PGN first.');
  const parts=pgn.split(/(?=^\[Event\s)/m).map(s=>s.trim()).filter(s=>/^\[[A-Za-z]+\s+"/m.test(s)||/\d+\.\s*[KQRBNP]?[a-h1-8x=+#-]*/.test(s));
  const chapters=[];
  (parts.length?parts:[pgn]).forEach((part,i)=>{
    const headers=analysisParseHeaders(part),game=new window.Chess(),clean=analysisStripVariations(part);
    const loaded=game.load_pgn(clean,{sloppy:true});if(loaded===false)throw new Error('Could not read chapter '+(i+1)+'. Check that the PGN is valid.');
    let title=headers.ChapterName||headers.Chapter||headers.Event||'';
    if(title.startsWith('Study:'))title=title.slice(6).trim();
    if(!title||title.toLowerCase()==='casual game')title=[headers.White,headers.Black].filter(Boolean).join(' – ')||'Chapter '+(i+1);
    chapters.push({title,startFen:headers.FEN||ANALYSIS_START_FEN,moves:game.history()});
  });
  if(!chapters.length)throw new Error('No games or chapters were found in that PGN.');
  AnalysisBoard.chapters=chapters;AnalysisBoard.redoMoves=[];analysisLoadChapter(0);
  $('#analysisChapter').innerHTML=chapters.map((c,i)=>'<option value="'+i+'">'+esc((i+1)+'. '+c.title)+'</option>').join('');
  $('#analysisChapter').value='0';$('#analysisImportMessage').textContent='Imported '+chapters.length+(chapters.length===1?' game.':' chapters.');
}
function analysisLoadChapter(i) {
  const ch=AnalysisBoard.chapters[i];if(!ch)return;
  AnalysisBoard.chapterIndex=i;AnalysisBoard.startFen=ch.startFen||ANALYSIS_START_FEN;AnalysisBoard.moves=ch.moves.slice();AnalysisBoard.currentPly=0;
  AnalysisBoard.selected=null;AnalysisBoard.legal=[];AnalysisBoard.annotations=[];AnalysisBoard.error='';AnalysisBoard.info='Loaded: '+ch.title;analysisRenderBoard();
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
    if(AnalysisBoard.rightStart){const from=AnalysisBoard.rightStart.square,target=document.elementFromPoint(e.clientX,e.clientY),toEl=target&&target.closest?target.closest('[data-square]'):null,to=toEl?toEl.dataset.square:from,color=AnalysisBoard.rightStart.red?'#e64a3b':'#22a06b';
      const idx=AnalysisBoard.annotations.findIndex(a=>a.from===from&&a.to===to&&a.color===color);if(idx>=0)AnalysisBoard.annotations.splice(idx,1);else AnalysisBoard.annotations.push({from,to,color});
      AnalysisBoard.rightStart=null;analysisRenderBoard();}
    if(AnalysisBoard.dragFrom){const from=AnalysisBoard.dragFrom,target=document.elementFromPoint(e.clientX,e.clientY),toEl=target&&target.closest?target.closest('[data-square]'):null,to=toEl?toEl.dataset.square:null;AnalysisBoard.dragFrom=null;
      if(to&&to!==from&&analysisPlayMove(from,to))AnalysisBoard.suppressClickUntil=Date.now()+250;}
  };
  if(!AnalysisBoard.globalBound){document.addEventListener('pointerup',globalUp);AnalysisBoard.globalBound=true;}
  board.addEventListener('pointerup',e=>{if(e.button===2)e.preventDefault();});
  $('#analysisStart').onclick=()=>analysisSetPosition(0);$('#analysisPrev').onclick=()=>analysisSetPosition(AnalysisBoard.currentPly-1);
  $('#analysisNext').onclick=()=>analysisSetPosition(AnalysisBoard.currentPly+1);$('#analysisEnd').onclick=()=>analysisSetPosition(AnalysisBoard.moves.length);
  $('#analysisUndo').onclick=()=>{if(AnalysisBoard.currentPly>0){AnalysisBoard.redoMoves=AnalysisBoard.moves.slice(AnalysisBoard.currentPly-1).concat(AnalysisBoard.redoMoves);AnalysisBoard.moves=AnalysisBoard.moves.slice(0,AnalysisBoard.currentPly-1);AnalysisBoard.currentPly--;AnalysisBoard.annotations=[];AnalysisBoard.selected=null;AnalysisBoard.legal=[];analysisRenderBoard();}};
  $('#analysisRedo').onclick=()=>{if(AnalysisBoard.redoMoves.length){AnalysisBoard.moves.push(AnalysisBoard.redoMoves.shift());AnalysisBoard.currentPly=AnalysisBoard.moves.length;analysisRenderBoard();}};
  $('#analysisFlip').onclick=()=>{AnalysisBoard.flipped=!AnalysisBoard.flipped;analysisRenderBoard();};
  $('#analysisReset').onclick=()=>{AnalysisBoard.startFen=ANALYSIS_START_FEN;AnalysisBoard.moves=[];AnalysisBoard.redoMoves=[];AnalysisBoard.currentPly=0;AnalysisBoard.chapters=[{title:'Free analysis',startFen:ANALYSIS_START_FEN,moves:[]}];AnalysisBoard.chapterIndex=0;AnalysisBoard.annotations=[];AnalysisBoard.selected=null;AnalysisBoard.legal=[];AnalysisBoard.error='';AnalysisBoard.info='Board reset.';
    $('#analysisChapter').innerHTML='<option value="0">1. Free analysis</option>';$('#analysisImportMessage').textContent='';analysisRenderBoard();};
  $('#analysisChapter').onchange=e=>analysisLoadChapter(Number(e.target.value));
  $('#analysisPgnFile').onchange=async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{$('#analysisPgnText').value=await f.text();$('#analysisImportMessage').textContent='File loaded. Press Import PGN.';}catch{$('#analysisImportMessage').textContent='Could not read this file.';}};
  $('#analysisImport').onclick=()=>{try{analysisImportPgn($('#analysisPgnText').value);AnalysisBoard.error='';}catch(e){$('#analysisImportMessage').textContent=e.message;}};
  $('#analysisCopyFen').onclick=async()=>{try{await navigator.clipboard.writeText(analysisGameAt(AnalysisBoard.currentPly).fen());$('#analysisStatus').textContent='FEN copied.';}catch{$('#analysisStatus').textContent='Could not copy FEN. Your browser may block clipboard access.';}};
  $('#analysisExportPgn').onclick=()=>{try{const g=analysisGameAt(AnalysisBoard.moves.length),blob=new Blob([g.pgn({max_width:80,newline_char:'\n'})],{type:'application/x-chess-pgn;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tca-analysis.pgn';a.click();URL.revokeObjectURL(url);}catch(e){$('#analysisStatus').textContent=e.message;}};
  $('#analysisClearMarks').onclick=()=>{AnalysisBoard.annotations=[];analysisRenderBoard();};
  analysisRenderBoard();
}
function bindAnalysisBoard(){analysisBindBoard();}
