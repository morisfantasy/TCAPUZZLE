import {openingText} from './opening-text.mjs';
import {openingBoard} from './opening-board.mjs';

export function mountOpenings(root,{parts,locale,user,esc,icon,pieceSVG,motion}){
  const t=openingText(locale),$=s=>root.querySelector(s),base='/api/openings',path=(slug='',section='')=>'#/openings'+(slug?'/'+slug:'')+(section?'/'+section:'');
  const [slug,view,id]=parts,query=new URLSearchParams(location.hash.split('?')[1]||'');
  const v=query.get('version'),vQuery=v?'?version='+encodeURIComponent(v):'';
  const money=n=>new Intl.NumberFormat(locale,{style:'currency',currency:'HKD',currencyDisplay:'code',minimumFractionDigits:0,maximumFractionDigits:2}).format(n/100);
  const date=iso=>iso?(Date.parse(iso)<=Date.now()?t('now'):new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))):'—';
  const link=(href,label,cls='soft-button')=>'<a class="'+cls+'" href="'+esc(href)+'">'+esc(label)+'</a>';
  const button=(cmd,label,cls='soft-button')=>'<button type="button" class="'+cls+'" data-op="'+cmd+'">'+esc(label)+'</button>';
  const back=(href,label)=>'<a class="tools-crumb" href="'+esc(href)+'">'+icon('previous')+esc(label)+'</a>';
  const actions=(html)=>'<div class="op-actions">'+html+'</div>';
  const metric=(label,value)=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>';
  const badge=(label)=>'<span class="op-badge">'+esc(label)+'</span>';
  let board=null,disposed=false,timer=null,handler={},keyHandler=null,adminCleanup=null;
  const pending=new AbortController();
  async function api(suffix='',body){
    const res=await fetch(base+suffix,{credentials:'same-origin',cache:'no-store',signal:pending.signal,
      ...(body!==undefined?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
    const data=await res.json();if(!res.ok)throw Object.assign(new Error(data.error||t('error')),{status:res.status});return data;
  }
  function error(e){if(disposed||e.name==='AbortError')return;const box=$('[data-op-error]');if(box){box.hidden=false;box.textContent=e.message;}else root.innerHTML='<p role="alert">'+esc(e.message)+'</p>'+button('reload',t('retry'));}
  const errorBox='<p data-op-error role="alert" class="op-error" hidden></p>';
  const listen=()=>{root.onclick=async e=>{
    const b=e.target.closest('[data-op]');if(!b||!handler[b.dataset.op])return;
    try{await handler[b.dataset.op](b);}catch(err){error(err);}
  };};
  const onKey=e=>{if(!e.altKey&&!e.metaKey&&!e.ctrlKey&&!e.target.closest('input,select,textarea,[contenteditable=true]'))keyHandler?.(e);};
  document.addEventListener('keydown',onKey,{signal:pending.signal});
  function art(p){
    if(p.cover.startsWith('data:image/'))return '<div class="op-art uploaded"><img alt="" src="'+esc(p.cover)+'"></div>';
    return '<div aria-hidden="true" class="op-art op-'+esc(p.cover)+' op-art-'+p.side+'"><div class="op-art-grid"></div><span class="op-art-shadow">'+pieceSVG(p.side==='b'?'N':'n')+'</span><span class="op-art-knight">'+pieceSVG(p.side==='b'?'n':'N')+'</span><span class="op-art-sign">TCA</span></div>';
  }
  const heroStats=p=>'<dl class="op-statline">'+metric(t('side'),t(p.side))+metric(t('lines'),p.stats.lines)+metric(t('positions'),p.stats.positions)+'</dl>';
  const notice=p=>p.payment?.ready?(p.payment.mode==='test'?'<small class="op-muted">'+t('test')+'</small>':''):'<small class="op-muted">'+t('closed')+'</small>';
  async function catalog(){
    const data=await api();if(disposed)return;
    root.innerHTML='<header class="op-head"><div class="op-title"><span class="title-icon">'+icon('openings')+'</span><h1>'+t('catalog')+'</h1></div>'+actions(
      (user?link(path('purchases'),t('history')):'')+(user?.isAdmin?link(path('admin'),t('manage')):''))+'</header>'+
      (data.products.length?'<div class="op-catalog">'+data.products.map(p=>'<article class="op-product-card"><a tabindex="-1" aria-hidden="true" href="'+path(p.slug)+'">'+art(p)+'</a>'+
        '<div class="op-copy"><div class="op-kicker">'+p.stats.chapters+' '+t('chapters')+'</div><h2><a href="'+path(p.slug)+'">'+esc(p.name)+'</a></h2><p>'+esc(p.description)+'</p>'+
        heroStats(p)+'<div class="op-price">'+(p.owned?badge(t('owned')):'<strong>'+esc(money(p.price))+'</strong>')+(p.published?'':badge(t('draft')))+'</div>'+
        actions(p.allowed?link(path(p.slug,'train')+'?start=1',t('train'),'primary-button')+link(path(p.slug),t('view')):link(path(p.slug),t('view'),'primary-button'))+'</div></article>').join('')+'</div>':'<p>'+t('empty')+'</p>');
  }
  function purchaseControls(p){
    if(p.allowed){
      const version='?version='+p.version;
      const start=p.session?link(path(p.slug,'session/'+p.session.id),t('resume'),'primary-button'):
        p.progress.due||p.progress.new?button('startDefault',t('train'),'primary-button'):'<small>'+t('noDue')+'</small>';
      return actions(start+link(path(p.slug,'learn')+version,t('study'))+link(path(p.slug,'train')+version,t('settings'),'op-text-link'));
    }
    const sign='#/login?next='+encodeURIComponent('openings/'+p.slug),buy=t('buy',money(p.price));
    const checkout=p.payment.ready?(user?button('buy',buy,'primary-button'):link(sign,buy,'primary-button')):'<button type="button" class="soft-button" disabled>'+esc(buy)+'</button>';
    return '<div class="op-price"><strong>'+esc(money(p.price))+'</strong><span>'+t('once')+'</span></div>'+actions(link(path(p.slug,'preview'),t('preview'),p.payment.ready?'soft-button':'primary-button')+checkout+(!p.payment.ready&&!user?link(sign,t('login'),'op-text-link'):''))+notice(p);
  }
  async function product(){
    const p=await api('/'+slug+vQuery);if(disposed)return;
    const pg=p.progress,returning=query.get('checkout');
    root.innerHTML=back(path(),t('back'))+
      (returning&&(!p.allowed||returning==='cancelled')?'<div class="op-notice">'+esc(t(returning==='cancelled'?'cancelled':'checkoutWait'))+' '+button('reload',t('refresh'))+'</div>':'')+
      '<article class="op-product-card">'+art(p)+'<div class="op-copy"><div class="op-kicker">'+p.stats.chapters+' '+t('chapters')+'</div><h1>'+esc(p.name)+'</h1><p>'+esc(p.description)+'</p>'+heroStats(p)+purchaseControls(p)+'</div></article>'+
      (pg?'<section class="op-panel op-dashboard"><header><h2>'+t('progress')+'</h2><strong>'+pg.percent+'% '+t('learned')+'</strong></header><progress max="100" value="'+pg.percent+'"></progress>'+
      '<dl class="op-metrics">'+metric(t('new'),pg.new)+metric(t('due'),pg.due)+metric(t('mastered'),pg.mastered)+metric(t('acc'),pg.accuracy==null?'—':pg.accuracy+'%')+
      metric(t('nextReview'),pg.due||pg.new?t('now'):date(pg.next))+'</dl><details class="op-levels"><summary>'+t('levels')+'</summary><dl class="op-metrics">'+['new','learning','progressing','mastered','consolidated'].map((k,i)=>metric(t(k),pg.levels[i])).join('')+'</dl></details>'+
      (p.versions.length>1?'<label>'+t('version')+' <select id="opVersion">'+p.versions.map(n=>'<option '+(n===p.version?'selected':'')+'>'+n+'</option>').join('')+'</select></label>':'')+'</section>':'')+
      (user?.isAdmin?actions(link(path('admin',slug),t('edit'))):'')+errorBox;
    handler.startDefault=async b=>{b.disabled=true;try{const s=await api('/'+slug+'/sessions',{version:p.version});location.hash=path(slug,'session/'+s.id);}finally{b.disabled=false;}};
    handler.buy=async b=>{b.disabled=true;try{const data=await api('/'+slug+'/checkout',{});location.assign(data.url);}catch(e){b.disabled=false;throw e;}};
    if($('#opVersion'))$('#opVersion').onchange=e=>location.hash=path(slug)+'?version='+e.target.value;
  }
  function layout(title,content){
    root.innerHTML=back(path(slug)+vQuery,t('product'))+'<div class="op-head"><h1>'+esc(title)+'</h1></div><div class="op-work"><div class="op-board-column"><div class="study-board" aria-label="'+t('openings')+'"></div><div class="op-promotion" hidden></div></div><section class="op-panel op-side">'+content+errorBox+'</section></div>';
  }
  async function learn(free){
    const d=await api('/'+slug+(free?'':'/learn'+vQuery));if(disposed)return;
    const model=free?{side:d.side,chapters:[{name:d.preview.name,nodes:d.preview.nodes.map((n,i)=>({...n,parent:i?i-1:null,children:i<d.preview.nodes.length-1?[i+1]:[]}))}],lines:[{lines:[{n:d.preview.nodes.length-1,label:'1'}]}]}:d;
    let c=0,l=0,ply=0,line=[];
    layout(free?t('preview'):t('study'),'<div class="op-kicker">'+t(model.side)+'</div>'+
      (free?'<h2>'+esc(d.preview.name)+'</h2>':'<label>'+t('chapter')+'<select id="opCh">'+model.chapters.map((ch,i)=>'<option value="'+i+'">'+esc(ch.name)+'</option>').join('')+'</select></label><label>'+t('line')+'<select id="opLine"></select></label>')+
      '<p id="opPly" class="op-muted"></p><div class="op-read-moves" aria-label="'+t('moves')+'"></div><p id="opNote"></p>'+
      actions(button('prev','← '+t('previous'))+button('next',t('next')+' →'))+(!free?actions(button('trainLine',t('trainLine'),'primary-button')+link(path(slug,'train')+vQuery,t('settings'))):'<p class="op-muted" id="opPreviewEnd" hidden>'+t('previewEnd')+'</p>'));
    board=openingBoard(root,{side:model.side,pieceSVG,motion,t});
    function show(to,animate=true){
      if(to<0||to>=line.length)return;const ch=model.chapters[c],old=ply;ply=to;
      const n=ch.nodes[line[ply]],edge=animate&&Math.abs(old-ply)===1?ch.nodes[line[Math.max(ply,old)]]:null;
      board.set(n.fen,{move:edge,reverse:old>ply,marks:n.marks});$('#opPly').textContent=t('position',ply+1,line.length);
      $('#opNote').textContent=[n.before,n.comment,n.directives].filter(Boolean).join(' · ');
      $('.op-read-moves').innerHTML=line.slice(1).map((id,i)=>{const node=ch.nodes[id],fen=ch.nodes[node.parent].fen.split(' ');
        return '<button data-op="jump" data-i="'+(i+1)+'" aria-current="'+(i+1===ply?'step':'false')+'">'+fen[5]+(fen[1]==='w'?'. ':'… ')+esc(node.san)+(node.nags||[]).map(x=>esc(({'$1':'!','$2':'?','$3':'!!','$4':'??','$5':'!?','$6':'?!'})[x]||x)).join('')+'</button>';}).join('');
      $('[data-op=prev]').disabled=ply===0;$('[data-op=next]').disabled=ply===line.length-1;
      if(free)$('#opPreviewEnd').hidden=ply!==line.length-1;
    }
    function select(){
      line=[];let n=model.lines[c].lines[l]?.n??0;while(n!=null){line.unshift(n);n=model.chapters[c].nodes[n].parent;}ply=0;show(0,false);
    }
    function chapter(){l=0;if(!free)$('#opLine').innerHTML=model.lines[c].lines.map((x,i)=>'<option value="'+i+'">'+esc(x.label)+'</option>').join('');select();}
    if(!free){$('#opCh').onchange=e=>{c=+e.target.value;chapter();};$('#opLine').onchange=e=>{l=+e.target.value;select();};}
    handler.trainLine=async b=>{b.disabled=true;try{const s=await api('/'+slug+'/sessions',{version:d.version,line:{c,n:model.lines[c].lines[l]?.n},limit:20,newLimit:20});location.hash=path(slug,'session/'+s.id);}finally{b.disabled=false;}};
    handler.prev=()=>show(ply-1);handler.next=()=>show(ply+1);handler.jump=b=>show(+b.dataset.i);
    keyHandler=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();show(ply+(e.key==='ArrowRight'?1:-1));}};
    chapter();
  }
  async function trainingSetup(){
    const p=await api('/'+slug+vQuery);if(disposed)return;
    if(!p.allowed){location.hash=path(slug);return;}
    const active=p.session,pg=p.progress;
    if(query.get('start')==='1'&&(active||pg.due||pg.new)){
      const s=active||await api('/'+slug+'/sessions',{version:p.version});if(!disposed)location.hash=path(slug,'session/'+s.id);return;
    }
    root.innerHTML=back(path(slug)+vQuery,p.name)+'<section class="op-panel op-setup"><div class="op-kicker">'+esc(p.name)+'</div><h1>'+t('settings')+'</h1><dl class="op-metrics">'+metric(t('due'),pg.due)+metric(t('new'),pg.new)+'</dl>'+
      (!active?'<div class="op-fields"><label>'+t('limit')+'<input type="number" id="opLimit" min="1" max="40" value="12"></label><label>'+t('fresh')+'<input type="number" id="opFresh" min="0" max="40" value="8"></label></div>':'')+
      actions(active?link(path(slug,'session/'+active.id),t('resume'),'primary-button'):pg.due||pg.new?button('start',t('train'),'primary-button'):'<p>'+t('noDue')+' '+date(pg.next)+'</p>')+errorBox+'</section>';
    handler.start=async b=>{b.disabled=true;try{const s=await api('/'+slug+'/sessions',{limit:+$('#opLimit').value,newLimit:Math.min(+$('#opLimit').value,+$('#opFresh').value),version:p.version});location.hash=path(slug,'session/'+s.id);}finally{b.disabled=false;}};
  }
  async function training(){
    let s=await api('/'+slug+'/sessions/'+id);if(disposed)return;
    let locked=false,side=s.prompt?.side;
    const summary=()=>{
      clearTimeout(timer);keyHandler=null;board?.clear();const x=s.summary;
      root.innerHTML=back(path(slug),t('product'))+'<section class="op-panel op-setup"><span class="title-icon">'+icon('award')+'</span><h1>'+t('summary')+'</h1><dl class="op-metrics">'+
        metric(t('practised'),x.positions)+metric(t('hits'),x.hits)+metric(t('misses'),x.misses)+metric(t('accuracy'),x.hits+x.misses?Math.round(100*x.hits/(x.hits+x.misses))+'%':'—')+
        metric(t('improved'),x.improved)+metric(t('nextReview'),date(x.next))+'</dl>'+link(path(slug),t('progress'),'primary-button')+'</section>';
    };
    if(!s.active){summary();return;}
    layout(t('train'),'<div class="op-kicker" id="opChapter"></div><h2 id="opTurn"></h2><p class="op-trail" id="opTrail"></p><progress id="opSessionProgress"></progress><p class="op-muted" id="opCounter"></p><p id="opFeedback" role="status"></p>'+
      actions(button('continue',t('continue'),'primary-button')+link(path(slug),t('pause'))+button('finish',t('finish'))));
    function drawPrompt(){
      if(!s.active){summary();return;}const q=s.prompt;locked=true;const fb=$('#opFeedback');fb.textContent=q.retry?t('retryCard'):'';fb.className='';
      $('#opChapter').textContent=q.chapter+' · '+t(q.side);$('#opTurn').textContent=t('turn');$('#opTrail').textContent=q.trail;
      $('#opSessionProgress').max=Math.max(1,s.step+s.remaining);$('#opSessionProgress').value=s.step;
      $('#opCounter').textContent=t('position',s.step+1,s.step+s.remaining);$('[data-op=continue]').hidden=true;
      const enable=()=>{if(disposed||!root.isConnected)return;board.set(q.fen,{move:q.incoming,interactive:true});locked=false;};
      clearTimeout(timer);if(q.incoming){board.set(q.incoming.fen);timer=setTimeout(enable,260);}else enable();
    }
    async function answer(move){
      if(locked)return;locked=true;board.disable();const before=s;
      try{
        const updated=await api('/'+slug+'/sessions/'+id+'/answer',{step:s.step,move});if(disposed)return;s=updated;
        const f=s.feedback;if(!f){drawPrompt();return;}
        if(['context','illegal'].includes(f.kind)){board.set(s.prompt.fen,{interactive:true});$('#opFeedback').textContent=t(f.kind);locked=false;return;}
        board.set(f.after,{move:f});$('#opFeedback').className=f.kind==='correct'?'op-correct':'op-miss';
        $('#opFeedback').textContent=f.kind==='correct'?t('correct')+' · '+f.answer:t('miss',f.alternatives.join(' / '));
        $('[data-op=continue]').hidden=false;
        if(f.kind==='correct'){clearTimeout(timer);timer=setTimeout(()=>{if(!disposed)drawPrompt();},850);}
      }catch(e){if(!disposed){s=before;drawPrompt();error(e);}}
    }
    board=openingBoard(root,{side,pieceSVG,motion,t,onMove:answer,onIllegal:()=>{$('#opFeedback').textContent=t('illegal');}});
    handler.continue=()=>{clearTimeout(timer);drawPrompt();};
    handler.finish=async b=>{b.disabled=true;clearTimeout(timer);try{s=await api('/'+slug+'/sessions/'+id+'/finish',{step:s.step});if(!disposed){if(s.active)drawPrompt();else summary();}}finally{b.disabled=false;}};
    drawPrompt();
  }
  async function history(){
    const rows=await api('/purchases');if(disposed)return;
    root.innerHTML=back(path(),t('back'))+'<section class="op-panel"><h1>'+t('history')+'</h1>'+(rows.length?'<ul class="op-list">'+rows.map(o=>'<li>'+link(path(o.product),o.name,'op-text-link')+'<span>'+esc(money(o.amount))+' · '+t(o.status)+(o.refund_amount?' · '+t('refunded')+' '+esc(money(o.refund_amount)):'')+' · '+esc(new Intl.DateTimeFormat(locale).format(new Date(o.created_at)))+'</span></li>').join('')+'</ul>':'<p>'+t('noOrders')+'</p>')+'</section>';
  }
  async function render(){
    try{
      if(!slug)await catalog();else if(slug==='admin'){
        if(!user?.isAdmin){location.hash=path();return;}
        const {admin}=await import('./opening-admin.mjs');if(!disposed)adminCleanup=await admin(root,{api,t,esc,view,link,path,back,actions,button,money,errorBox,handler,disposed:()=>disposed});
      }else if(slug==='purchases')await history();else if(view==='preview'||view==='learn')await learn(view==='preview');else if(view==='train')await trainingSetup();else if(view==='session'&&id)await training();else await product();
    }catch(e){error(e);}
  }
  handler.reload=()=>location.reload();listen();render();
  return ()=>{disposed=true;clearTimeout(timer);pending.abort();board?.clear();adminCleanup?.();root.onclick=null;};
}
