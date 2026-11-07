import {blankEvent,blankGame,blankCert,evaluate,portfolio,limits,titleCodes,certificateEvents,commonEvidence} from './norms.mjs';
import {federations} from './federations.mjs';
import {normLanguage} from './norm-text.mjs';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const freshBook=()=>({peak:'',peakKind:'',proof:'',certs:[]});
let cacheKey, data, example, tab='eventTab';
export function resetNormView(){cacheKey=null;data=null;example=null;tab='eventTab';}
function restore(user){
  const key='tca.norms.v1.'+(user?'user.'+user:'guest');
  if(cacheKey===key && data)return;
  cacheKey=key;example=null;tab='eventTab';data={event:blankEvent(),book:freshBook()};
  try{
    const v=JSON.parse(localStorage.getItem(key));
    if(v?.event?.evidence && limits[v.event.target] && Array.isArray(v.event.games) && Array.isArray(v.book?.certs))data=v;
  }catch{}
}
function exampleEvent() {
  const e=blankEvent();e.fed='HKG';e.example=true;
  const scores=[1,1,.5,0,1,.5], titles=['IM','FM','IM','none','WFM','none','GM','FM','none'];
  e.games=['ESP','HKG','FRA','IND','HKG','SGP','CHN','PHI','VIE'].map((fed,i)=>({...blankGame(i+1),fed,rating:'2350',title:titles[i],score:scores[i]??null,status:i<6?'played':'future'}));
  return e;
}

export function mountNorms(root,{locale,icon,user}) {
  restore(user);
  const t=normLanguage(locale), format=new Intl.NumberFormat(locale,{maximumFractionDigits:1,useGrouping:false});
  const num=v=>v==null||v===''?'—':typeof v==='number'?format.format(v):esc(v);
  const fmtScore=v=>v==null?'—':num(v);
  const event=()=>example||data.event;
  const save=()=>{try{localStorage.setItem(cacheKey,JSON.stringify(data));}catch{}};
  const opt=(vals,val,allowEmpty=true)=> (allowEmpty?'<option value="">'+t('unknown')+'</option>':'')+vals.map(k=>
    '<option value="'+esc(k)+'"'+(String(val)===k?' selected':'')+'>'+esc(t(k))+'</option>').join('');
  const field=(key,control)=>'<label class="norm-field"><span>'+esc(t(key))+'</span>'+control+'</label>';
  const attr=(scope,key,i)=>' data-scope="'+scope+'" data-key="'+key+'"'+(i==null?'':' data-i="'+i+'"');
  const input=(scope,o,key,i,type='text',extra='',label=key)=>field(label,'<input type="'+type+'"'+attr(scope,key,i)+' value="'+esc(o[key])+'" '+extra+'>');
  const select=(scope,o,key,vals,i,label=key,allowEmpty=true)=>field(label,'<select'+attr(scope,key,i)+'>'+opt(vals,o[key],allowEmpty)+'</select>');
  const yes=(scope,o,key,i,label=key)=>select(scope,o,key,['yes','no'],i,label);
  const eventInput=(e,key,extra='min="1" max="200"')=>input('event',e,key,null,'number',extra);
  const proof=(e,key,label=key)=>yes('evidence',e.evidence,key,null,label);
  const fedInput=(scope,o,key,i,label)=>input(scope,o,key,i,'text','list="normFederations" maxlength="3" autocomplete="off" autocapitalize="characters" placeholder="HKG"',label);
  const details=(id,label,body,open=false)=>'<details class="norm-details" data-panel="'+id+'"'+(open?' open':'')+'><summary>'+esc(t(label))+'</summary><div class="norm-details-body">'+body+'</div></details>';
  const labelBtn=(action,label,glyph)=>'<button type="button" class="soft-button" data-action="'+action+'">'+(glyph?icon(glyph):'')+esc(t(label))+'</button>';
  const mark=s=>({met:'✓',pending:'?',failed:'×',reachable:'↗',impossible:'×'}[s]||'·');
  const badge=s=>'<span class="norm-status '+s+'"><i aria-hidden="true">'+mark(s)+'</i>'+esc(t(s))+'</span>';
  const newRound=e=>{const used=new Set(e.games.map(g=>+g.round));for(let n=1;n<=+e.rounds&&n<=200;n++)if(!used.has(n))return n;return null;};
  const href=(url,key)=>'<a href="'+url+'" target="_blank" rel="noopener">'+esc(t(key))+' ↗</a>';
  function sources(){
    return details('sources','sources','<p>'+t('selectionNote')+'</p><p>'+t('floorNote')+'</p><p>'+t('limitsNote')+'</p><p>'+t('directNote')+'</p><div class="norm-links">'+
      href('https://handbook.fide.com/chapter/B012024','FIDE Handbook · B.01')+href('https://doc.fide.com/docs/DOC/3FC2023/FC3_2023_26.pdf','B.01 · PDF')+
      href('https://handbook.fide.com/chapter/B01DirectTitles2026','sourceDirect')+href('https://www.fide.com/wp-content/uploads/Resolution_of_the_FIDE_Council_in_Relation_to_Time_Controls.pdf','pilot')+
      href('https://qc.fide.com/2024/01/06/formats-to-be-used-in-title-tournaments/','format')+'</div>');
  }
  function officialFields(e) {
    return '<div class="norm-grid">'+['minutes','daily','hours','duration'].map(k=>eventInput(e,k,'min="1" step="'+(k==='hours'?'.25':'1')+'"')).join('')+
      (e.target==='GM'?eventInput(e,'singleCount','min="0" max="200"'):'')+yes('event',e,'pilot')+eventInput(e,'until','min="1" max="'+esc(e.rounds)+'"')+
      (e.format==='swiss'?select('event',e,'exemption',['swiss20'],null,'swiss20'):'')+'</div><div class="norm-proof">'+
      commonEvidence.map(k=>proof(e,k)).join('')+(e.pilot==='yes'?proof(e,'pilot','pilotProof'):'')+
      (+e.duration>30?proof(e,'longList'):'')+(+e.duration>90?proof(e,'duration','longApproval'):'')+
      (['other','special'].includes(e.format)?proof(e,'format','formatProof'):'')+
      (['nationalFinal','nationalTeam'].includes(e.event)?proof(e,'national','nationalProof'):'')+
      (e.exemption==='swiss20'&&e.format==='swiss'?proof(e,'swiss20','swissProof'):'')+
      (e.until && +e.until<+e.rounds?proof(e,'prefix'):'')+
      (e.games.some(g=>g.status==='omitWin')?proof(e,'omitWin','omitProof'):'')+
      (e.games.some(g=>g.status==='lastDefault')?proof(e,'lastDefault','lastProof'):'')+
      (['worldTeam','worldCup'].includes(e.event)||e.games.some(g=>['forfeitWin','allocatedBye'].includes(g.status))?proof(e,'shortMix'):'')+'</div>';
  }
  function settings(e){
    return '<section class="norm-card"><h3>'+t('settings')+'</h3><div class="norm-grid">'+
      fedInput('event',e,'fed',null,'ownFed')+select('event',e,'format',['swiss','rr','drr','ko','other','special'],null,'format',false)+
      eventInput(e,'rounds')+select('event',e,'event',['regular','worldTeam','worldCup','nationalFinal','nationalTeam','zonal'],null,'event',false)+
      (e.format==='drr'?eventInput(e,'players'):'')+(['nationalFinal','nationalTeam'].includes(e.event)?fedInput('event',e,'host',null,'host'):'')+
      '</div>'+details('conditions','docs',officialFields(e))+'</section>';
  }
  function gameRow(g,i,e){
    const played=g.status==='played', active=played||g.status==='future'||g.status==='lastDefault', onlyDefault=g.status==='lastDefault';
    const head='<div class="norm-round-head"><label>'+t('round')+' <input type="number" min="1" max="'+esc(e.rounds)+'" aria-label="'+t('round')+'"'+attr('game','round',i)+' value="'+esc(g.round)+'"></label>'+
      '<select aria-label="'+t('status')+'"'+attr('game','status',i)+'>'+opt(['future','played','allocatedBye','forfeitWin','otherBye','forfeit','adjudicated','omitWin','lastDefault'],g.status,false)+'</select>'+
      '<button class="icon-button" type="button" data-action="removeRound" data-i="'+i+'" aria-label="'+t('remove')+' '+t('round')+' '+esc(g.round)+'">'+icon('trash')+'</button></div>';
    const rating='<div class="norm-field"><label class="norm-rating"><span>'+t('rating')+'</span><input type="text" inputmode="numeric" pattern="[0-9]+|UR" placeholder="2350"'+attr('game','rating',i)+' value="'+esc(g.rating==='UR'?'':g.rating)+'"'+(g.rating==='UR'?' disabled':'')+'></label><label class="norm-unrated"><input type="checkbox" data-action="unrated" data-i="'+i+'"'+(g.rating==='UR'?' checked':'')+'>'+t('unrated')+'</label></div>';
    const fields=rating+select('game',g,'title',titleCodes,i,'oppTitle')+fedInput('game',g,'fed',i,'fed')+
      (e.format==='drr'?input('game',g,'id',i,'text','inputmode="numeric" maxlength="20" placeholder="FIDE ID"'):'')+
      (g.rating==='UR' && ['rr','drr'].includes(e.format)?yes('game',g,'rrPoints',i):'');
    const scoreButtons='<div class="norm-score" role="group" aria-label="'+t('points')+'">'+[[1,'win','1'],[.5,'draw','½'],[0,'loss','0']].map(([score,k,label])=>
      '<button type="button" data-action="result" data-i="'+i+'" data-value="'+score+'" aria-pressed="'+(played&&g.score===score)+'" title="'+t(k)+'" aria-label="'+t(k)+'">'+label+'</button>').join('')+'</div>';
    return '<article class="norm-round" data-round-index="'+i+'">'+head+(active?'<div class="norm-round-fields">'+fields+'</div>'+(onlyDefault?'':scoreButtons):'')+'</article>';
  }
  function editor(e){
    return '<section class="norm-card" id="normOpponents"><h3>'+t('opponents')+'</h3><p class="norm-note">'+t('futureHelp')+'</p><div class="norm-opponents">'+e.games.map((g,i)=>gameRow(g,i,e)).join('')+'</div>'+
      (newRound(e)?'<div class="norm-actions">'+labelBtn('add','add','plus')+labelBtn('pairings','pairings')+'</div>':'')+'</section>';
  }
  function checksList(list){
    return '<ul class="norm-checks">'+list.map(c=>'<li data-check="'+c.key+'" data-state="'+c.status+'"><div><span>'+t(c.key)+'</span>'+
      (c.value!=='' && c.value!=null || c.target!==''?'<small>'+num(c.value)+(c.target!==''?' / '+num(c.target):'')+(c.waiver?' · '+t('exempt')+' '+c.waiver:'')+'</small>':'')+'</div>'+badge(c.status)+'</li>').join('')+'</ul>';
  }
  function stat(key,value,sub=''){
    return '<div><dt>'+t(key)+'</dt><dd>'+value+'</dd>'+(sub?'<small>'+sub+'</small>':'')+'</div>';
  }
  function headline(r,e){
    const pendingRules=r.checks.some(c=>c.group==='event' && c.status==='pending');
    const label=r.overall==='met'?'verified':r.sport==='met'&&r.overall==='pending'?'sportPending':
      r.open && r.sport==='reachable' && ['pending','reachable'].includes(r.overall)?'progressTitle':r.overall;
    return '<div class="norm-overline">'+t('live')+' <b>'+esc(e.target)+'</b> · '+num(r.rounds)+' '+t('rounds').toLowerCase()+'</div><div class="norm-headline"><h2>'+t(label)+'</h2>'+(label==='progressTitle' && pendingRules?'<p>'+t('officialPending')+'</p>':'')+'</div><dl class="norm-hero-stats">'+
      stat('points',fmtScore(r.score)+'<small> / '+num(r.played)+'</small>')+stat('currentRp',num(r.rp),t('minRp')+' '+limits[e.target].rp)+
      stat('real',num(r.current?.real))+stat('adjusted',num(r.current?.adjusted),r.current?.raised?t('raised')+' '+r.current.raised:'')+'</dl>';
  }
  function simulate(r,e){
    const s=r.simulation, m=r.opposition;
    let body;
    if(!s.left)body='<p>'+t('noRemaining')+'</p>';
    else if(s.unverified)body='<p>'+t('eligibilityFirst')+'</p>';
    else if(s.impossible)body='<p>'+t('noScore')+'</p>';
    else if(s.required!==null)body='<span class="norm-note">'+t('needed')+'</span><strong class="norm-scoreline" data-needed>'+num(s.required)+'<small> / '+s.left+'</small></strong><p>'+t('conditional')+'</p><h4>'+t('combinations')+'</h4><div class="norm-combos">'+s.combinations.map(c=>'<span>'+c.w+' · '+c.d+' · '+c.l+'</span>').join('')+'</div>';
    else {
      body='<p>'+t(s.scenarios.length?'needPair':'completeResults')+'</p>';
      if(s.scenarios.length)body+=details('scenarios','scenarios','<table class="norm-scenarios"><thead><tr><th>'+t('points')+'</th><th>'+t('average')+'</th><th>'+t('uniform')+'</th></tr></thead><tbody>'+s.scenarios.map(c=>'<tr><td>'+num(c.points)+' / '+s.left+'</td><td>≥ '+c.ra+'</td><td>≥ '+c.opponent+'</td></tr>').join('')+'</tbody></table><p>'+t('uniformNote')+'</p>',true);
    }
    if(s.left)body+='<h4>'+t('opposition')+'</h4><dl class="norm-def">'+[
      [e.target==='GM'?'GM':'GM / IM',m.neededE],[t('titleHolders'),m.neededT],
      ...(m.exempt?[[t('exempt'),'✓']]:[[t('foreign'),m.neededF],[t('ownRoom'),m.ownRoom],...(m.fullFeds.length?[[t('fieldFull'),m.fullFeds.join(', ')]]:[])])
    ].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+num(v)+'</dd></div>').join('')+'</dl>';
    const blocked=s.left && s.required!==null && r.checks.some(c=>['failed','impossible'].includes(c.status));
    return '<h3>'+t('sim')+'</h3>'+(blocked?'<p class="norm-blocked">'+t('oppositionBlocked')+'</p>':'')+body;
  }
  function evidenceDays(r){
    const e=event();
    if(e.target!=='GM' || !r.rounds)return '';
    const days=e.singleCount,verified=days==='' || days==null?'pending':+days>=3?'met':'failed';
    return '<div class="norm-gm-days">'+t('singleDays')+' '+badge(verified)+'</div>';
  }
  function requirements(r){
    return '<h3>'+t('requirements')+'</h3>'+['sport','mix','feds','event'].map(k=>{
      const items=r.checks.filter(c=>c.group===k);
      return details('group-'+k,k==='event'?'eventChecks':k,checksList(items),k!=='event');
    }).join('')+(evidenceDays(r))+(r.credit?'<p>'+t('credits')+' <b>'+r.credit+'</b></p>':'');
  }
  function certRow(c,i){
    return '<article class="norm-cert"><div class="norm-cert-head"><h4>'+t('certificate')+' '+(i+1)+'</h4><label><input type="checkbox"'+attr('cert','use',i)+(c.use!==false?' checked':'')+'>'+t('selectCert')+'</label><button type="button" class="icon-button" data-action="removeCert" data-i="'+i+'" aria-label="'+t('remove')+'">'+icon('trash')+'</button></div><div class="norm-grid">'+
      input('cert',c,'name',i,'text','maxlength="160"')+input('cert',c,'date',i,'date')+select('cert',c,'level',['GM','IM'],i,'target')+
      input('cert',c,'rounds',i,'number','min="1" max="200"')+input('cert',c,'games',i,'number','min="1" max="200"','credits')+
      select('cert',c,'category',[...certificateEvents,'outside'],i,'article156')+'</div>'+
      details('cert-'+i,'docs','<div class="norm-proof">'+yes('cert',c,'verified',i,'certProof')+yes('cert',c,'normal',i)+
        (event().target==='GM'?yes('cert',c,'single',i):'')+yes('cert',c,'bye',i,'byeCert')+yes('cert',c,'short',i,'pilot')+yes('cert',c,'direct',i)+
        (c.date && c.date<'2005-07-01'?yes('cert',c,'legacy',i):'')+'</div>')+'</article>';
  }
  function tracker(){
    const b=data.book;
    return '<div class="norm-layout"><div class="norm-editor"><section class="norm-card"><h3>'+t('peak')+'</h3><div class="norm-grid">'+
      input('book',b,'peak',null,'number','min="1" max="4000"')+select('book',b,'peakKind',['published','interim'])+'</div>'+
      (b.peakKind==='interim'?'<div class="norm-proof">'+yes('book',b,'proof')+'</div>':'')+'</section><section class="norm-card"><h3>'+t('certificates')+'</h3><p class="norm-note">'+t('portfolioNote')+'</p><p class="norm-note">'+t('articleNote')+'</p>'+
      b.certs.map(certRow).join('')+labelBtn('addCert','addCert','plus')+'</section></div><aside class="norm-side"><section class="norm-card" id="portfolioChecks"></section>'+sources()+'</aside></div>';
  }
  function preservePanels(container,fn){
    const state=new Map(Array.from(container.querySelectorAll('details[data-panel]'),x=>[x.dataset.panel,x.open]));
    fn();container.querySelectorAll('details[data-panel]').forEach(d=>{if(state.has(d.dataset.panel))d.open=state.get(d.dataset.panel);});
  }
  function results(){
    const e=event();
    if(tab==='titleTab'){
      const r=portfolio(data.book,e.target);
      root.querySelector('#portfolioChecks').innerHTML='<h3>'+t('titleTab')+' · '+e.target+'</h3><div class="norm-portfolio-total"><b>'+r.total+'</b> / 27</div><p>'+t('credits')+' · '+r.count+' '+t('certificates').toLowerCase()+'</p>'+checksList(r.checks)+'<p class="norm-note">'+t('authority')+'</p>';
      return;
    }
    const r=evaluate(e), sim=root.querySelector('#normSimulation'), checks=root.querySelector('#normRequirements');
    root.querySelector('#normHero').innerHTML=headline(r,e);
    preservePanels(sim,()=>sim.innerHTML=simulate(r,e));preservePanels(checks,()=>checks.innerHTML=requirements(r));
    root.querySelectorAll('[data-scope=game][data-key=round],[data-scope=event][data-key=until]').forEach(el=>el.max=String(r.rounds));
    root.querySelectorAll('[data-key="fed"],[data-key="host"]').forEach(el=>el.setAttribute('aria-invalid',String(!!el.value && !federations.has(el.value) && !(el.dataset.scope==='game'&&el.value==='NON'))));
    root.querySelectorAll('[data-key="rating"]').forEach(el=>el.setAttribute('aria-invalid',String(!!el.value && (!/^\d+$/.test(el.value)||+el.value<1400))));
  }
  function render(){
    const e=event();
    preservePanels(root,()=>{
      root.innerHTML='<datalist id="normFederations">'+Array.from(federations,c=>'<option value="'+c+'"></option>').join('')+'<option value="NON">'+t('nonFed')+'</option></datalist>'+
        '<div class="norm-toolbar"><div class="norm-subtabs">'+['eventTab','titleTab'].map(k=>'<button type="button" data-action="tab" data-value="'+k+'" aria-pressed="'+(tab===k)+'">'+t(k)+'</button>').join('')+'</div>'+
        '<div class="norm-target" role="group" aria-label="'+t('target')+'">'+['GM','IM'].map(k=>'<button type="button" data-action="target" data-value="'+k+'" aria-pressed="'+(e.target===k)+'">'+k+'</button>').join('')+'</div></div>'+
        (tab==='titleTab'?tracker():'<section class="norm-hero" id="normHero" aria-live="polite"></section><nav class="norm-jumps">'+[['normOpponents','opponents'],['normSimulation','sim'],['normRequirements','requirements']].map(([id,k])=>'<button type="button" data-action="jump" data-value="'+id+'">'+t(k)+'</button>').join('')+'</nav><div class="norm-layout"><div class="norm-editor">'+
          (example?'<div class="norm-example"><span>'+t('demoNote')+'</span>'+labelBtn('demo','clearDemo')+'</div>':'')+settings(e)+editor(e)+
          (!example?'<div>'+labelBtn('demo','demo')+'</div>':'')+'</div><aside class="norm-side"><section class="norm-card norm-simulation" id="normSimulation"></section>'+
          '<section class="norm-card" id="normRequirements"></section>'+sources()+'<p class="norm-note">'+t('authority')+'</p></aside></div>')+
        '<small class="norm-local">'+t('local')+'</small>';
      results();
    });
  }
  function layoutKey(scope,key,index){
    const e=event();
    if(scope==='cert' && key==='date')return !!data.book.certs[index].date && data.book.certs[index].date<'2005-07-01';
    if(scope==='event' && key==='duration')return Number(+e.duration>30)+Number(+e.duration>90);
    if((scope==='event' && ['rounds','until'].includes(key)) || (scope==='game' && key==='round'))
      return String(newRound(e)!==null)+'/'+String(!!e.until && +e.until<+e.rounds);
    return null;
  }
  function change(el,structural){
    const {scope,key,i}=el.dataset;if(!scope)return;
    const e=event(), obj={event:e,evidence:e.evidence,game:e.games[i],book:data.book,cert:data.book.certs[i]}[scope];
    if(!obj)return;
    const shape=layoutKey(scope,key,i);
    let v=el.type==='checkbox'?el.checked:el.value;
    if(['fed','host'].includes(key)){v=v.toUpperCase().trim();el.value=v;}
    obj[key]=v;
    if(scope==='game' && key==='status' && v!=='played')obj.score=null;
    save();
    if(structural || shape!==layoutKey(scope,key,i)) {
      const focus=document.activeElement===el, start=el.selectionStart, end=el.selectionEnd;
      render();
      if(focus){
        const next=root.querySelector('[data-scope="'+scope+'"][data-key="'+key+'"]'+(i==null?'':'[data-i="'+i+'"]'));
        next?.focus({preventScroll:true});
        if(next?.type==='text' && start!=null)next.setSelectionRange(start,end);
      }
    } else results();
  }
  root.oninput=ev=>{
    if(ev.target.tagName==='SELECT' || ev.target.type==='checkbox')return;
    change(ev.target,false);
  };
  root.onchange=ev=>{
    const el=ev.target,{scope,key,i,action}=el.dataset, e=event();
    if(action==='unrated'){e.games[i].rating=el.checked?'UR':'';save();render();return;}
    if(!scope)return;
    const struct=['format','event','pilot','exemption','status','peakKind'].includes(key);
    if(el.tagName==='SELECT'||el.type==='checkbox')change(el,struct);
    else change(el,false);
  };
  root.onclick=ev=>{
    const b=ev.target.closest('button[data-action]');if(!b)return;
    const {action,i,value}=b.dataset,e=event();
    if(action==='jump'){root.querySelector('#'+value)?.scrollIntoView({block:'start'});return;}
    if(action==='tab'){tab=value;render();return;}
    if(action==='demo'){example=example?null:exampleEvent();render();return;}
    if(action==='target'){e.target=value; if(tab==='titleTab')data.event.target=value;}
    if(action==='result'){e.games[i].status='played';e.games[i].score=Number(value);}
    if(action==='add'||action==='pairings') {
      let n=newRound(e);while(n){e.games.push(blankGame(n));if(action==='add')break;n=newRound(e);}
    }
    if(action==='removeRound')e.games.splice(+i,1);
    if(action==='addCert')data.book.certs.push(blankCert());
    if(action==='removeCert')data.book.certs.splice(+i,1);
    save();render();
    if(action==='add')root.querySelector('[data-round-index="'+(e.games.length-1)+'"] [data-key="rating"]')?.focus();
    if(action==='addCert')root.querySelector('[data-scope="cert"][data-i="'+(data.book.certs.length-1)+'"][data-key="name"]')?.focus();
  };
  render();
}
