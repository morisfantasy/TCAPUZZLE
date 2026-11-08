export async function admin(root,{api,t,esc,view,link,path,back,actions,button,money,errorBox,handler,disposed}){
  const $=selector=>root.querySelector(selector);
  if(!view){
    const {products}=await api();if(disposed())return;
    root.innerHTML=back(path(),t('back'))+'<header class="op-head"><h1>'+t('admin')+'</h1>'+link(path('admin','new'),t('create'),'primary-button')+'</header><div class="op-panel"><ul class="op-list">'+products.map(p=>'<li><div><b>'+esc(p.name)+'</b><small>'+esc(money(p.price))+' · '+t(p.published?'published':'draft')+'</small></div>'+link(path('admin',p.slug),t('edit'))+'</li>').join('')+'</ul></div>';return;
  }
  const fresh=view==='new',p=fresh?{name:'',slug:'',description:'',price:2900,side:'b',cover:'sicilian',revision:0,previewDepth:8,published:false}:await api('/admin/'+view);
  if(disposed())return;
  const field=(label,input)=>'<label>'+t(label)+input+'</label>';
  const input=(key,value,attrs='')=>'<input id="oa-'+key+'" value="'+esc(value)+'" '+attrs+'>';
  const opt=(v,label,selected)=>'<option value="'+esc(v)+'" '+(selected?'selected':'')+'>'+esc(label)+'</option>';
  let chapters=p.chapters||[],ref=p.previewRef,source='',image=p.cover.startsWith('data:')?p.cover:'',valid=!!chapters.length;
  root.innerHTML=back(path('admin'),t('admin'))+'<header class="op-head"><h1>'+esc(fresh?t('create'):p.name)+'</h1></header><section class="op-panel op-edit"><div class="op-fields">'+
    field('name',input('name',p.name,'maxlength="120" required'))+field('slug',input('slug',p.slug,(fresh?'':'readonly')+' minlength="2" maxlength="70"'))+
    field('side','<select id="oa-side">'+['w','b'].map(s=>opt(s,t(s),s===p.side)).join('')+'</select>')+
    field('price',input('price',(p.price/100).toFixed(2),'type="number" min="4" max="10000" step="0.01" aria-label="HKD"'))+
    field('description','<textarea id="oa-description" rows="3" maxlength="1600">'+esc(p.description)+'</textarea>')+
    field('cover','<select id="oa-cover">'+['sicilian','mint','amber','image'].map((c,i)=>opt(c,[t('openings'),'Mint','Amber',t('uploadCover')][i],c===(image?'image':p.cover))).join('')+'</select>')+
    field('uploadCover','<input id="oa-image" type="file" accept="image/png,image/jpeg,image/webp">')+
    field('pgn','<input id="oa-file" type="file" accept=".pgn,.txt,application/x-chess-pgn">')+'</div>'+
    actions(button('validate',t('validate')))+'<p id="oa-stats" role="status"></p><div class="op-fields">'+
    field('chapter','<select id="oa-chapter"></select>')+field('previewLine','<select id="oa-line"></select>')+field('depth',input('depth',p.previewDepth,'type="number" min="1" max="20"'))+'</div>'+
    '<label class="op-check"><input type="checkbox" id="oa-published" '+(p.published?'checked':'')+'>'+t('published')+'</label>'+actions(button('save',t('save'),'primary-button'))+errorBox+'<p id="oa-message" role="status"></p></section>'+
    (fresh?'':'<section class="op-panel op-edit"><h2>'+t('access')+'</h2>'+field('user',input('user','','autocomplete="off" maxlength="24"'))+actions(button('grant',t('grant'))+button('revoke',t('revoke')))+'<div id="oa-access"></div></section>');
  const get=k=>$('#oa-'+k).value;
  function drawLines(){
    const c=+get('chapter');$('#oa-line').innerHTML=(chapters[c]?.lines||[]).map(l=>opt(l.n,l.label,ref?.c===c&&ref?.n===l.n)).join('');
  }
  function draw(stats){
    $('#oa-chapter').innerHTML=chapters.map((ch,c)=>ch.lines.length?opt(c,ch.name,c===ref?.c):'').join('');drawLines();
    $('#oa-stats').textContent=stats?stats.chapters+' '+t('chapters')+' · '+stats.lines+' '+t('lines')+' · '+stats.positions+' '+t('positions'):t('validateFirst');
    $('[data-op=save]').disabled=!valid;
  }
  const invalidate=()=>{valid=false;chapters=[];ref=null;draw();};
  $('#oa-chapter').onchange=drawLines;$('#oa-side').onchange=invalidate;$('#oa-file').onchange=invalidate;
  function fileURL(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error(t('error')));r.readAsDataURL(file);});}
  $('#oa-image').onchange=()=>{if($('#oa-image').files.length)$('#oa-cover').value='image';};
  handler.validate=async b=>{
    b.disabled=true;try{const f=$('#oa-file').files[0];if(f&&f.size>1048576)throw Error('PGN exceeds 1 MB.');
      source=f?await f.text():'';const data=await api('/admin/validate',{slug:fresh?'':view,pgn:source,side:get('side')});
      if(disposed())return;chapters=data.chapters;valid=true;draw(data.stats);$('[data-op-error]').hidden=true;
    }finally{b.disabled=false;}
  };
  handler.save=async b=>{
    if(!valid)throw Error(t('validateFirst'));b.disabled=true;try{
      const f=$('#oa-image').files[0];if(f){if(f.size>256000)throw Error('Cover exceeds 250 KB.');image=await fileURL(f);}
      const data=await api('/admin/save',{revision:p.revision,slug:get('slug'),name:get('name'),description:get('description'),price:Math.round(+get('price')*100),side:get('side'),
        cover:get('cover')==='image'?image:get('cover'),pgn:source,previewRef:{c:+get('chapter'),n:+get('line')},previewDepth:+get('depth'),published:$('#oa-published').checked});
      if(disposed())return;p.revision=data.revision;$('[data-op-error]').hidden=true;$('#oa-message').textContent=t('saved')+' · '+t('version')+' '+data.version;
      if(fresh)location.hash=path('admin',data.slug);
    }finally{b.disabled=false;}
  };
  async function accessList(){
    const data=await api('/admin/'+view+'/access');if(disposed())return;
    $('#oa-access').innerHTML='<ul class="op-list">'+data.grants.map(g=>'<li><b>'+esc(g.username)+'</b><span>'+t(g.active?'active':'revoked')+' · v'+g.version+'</span></li>').join('')+'</ul><h3>'+t('history')+'</h3>'+
      (data.orders.length?'<ul class="op-list">'+data.orders.map(o=>'<li><span>'+esc(o.username)+' · '+esc(money(o.amount))+' · '+t(o.status)+(o.refund_amount?' · '+t('refunded')+' '+esc(money(o.refund_amount)):'')+(o.mode==='test'?' · '+t('test'):'')+'</span>'+
        (o.status==='paid'?'<button class="soft-button" data-op="refund" data-id="'+esc(o.id)+'">'+t('refund')+'</button>':'')+'</li>').join('')+'</ul>':'<p>'+t('noOrders')+'</p>');
  }
  for(const grant of [true,false])handler[grant?'grant':'revoke']=async b=>{
    const username=get('user').trim();if(!username){$('#oa-user').focus();return;}if(!grant&&!confirm(t('confirmRevoke')))return;
    b.disabled=true;try{await api('/admin/'+view+'/access',{username,grant});await accessList();if(!disposed()){$('[data-op-error]').hidden=true;$('#oa-message').textContent=t('saved');}}finally{b.disabled=false;}
  };
  handler.refund=async b=>{if(confirm(t('confirmRefund'))){b.disabled=true;try{await api('/admin/'+view+'/refund/'+b.dataset.id,{});$('#oa-message').textContent=t('pending');await accessList();}finally{b.disabled=false;}}};
  draw(p.stats);if(!fresh)await accessList();
}
