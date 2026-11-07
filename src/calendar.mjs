import {calendarText} from './calendar-text.mjs';

const FIDE='https://calendar.fide.com/calendar.php';
const regions=['Africa','America','Asia','Europe'],tempos=['standard','rapid','blitz','other'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const localDate=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const isMonth=v=>/^(?:19|20)\d{2}-(0[1-9]|1[0-2])$/.test(v||'');
const normalize=v=>String(v||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase();
const byDate=(event,date)=>!!event.start && event.start<=date && (event.end||event.start)>=date;
const eventURL=id=>FIDE+'?id='+id;
const cache=new Map();
function dateFormatter(locale,options) {
  const fmt=new Intl.DateTimeFormat(locale,{timeZone:'UTC',...options});
  return value=>fmt.format(new Date(value+'T12:00:00Z'));
}
function queryState(query,today){
  const month=isMonth(query.get('month'))?query.get('month'):today.slice(0,7),day=query.get('day')||'';
  const [year,number]=month.split('-').map(Number),last=new Date(Date.UTC(year,number,0)).getUTCDate();
  const validDay=day.startsWith(month+'-') && /^\d{4}-\d{2}-\d{2}$/.test(day) && +day.slice(-2)>0 && +day.slice(-2)<=last;
  return {month,day:validDay?day:'',
    region:regions.includes(query.get('region'))?query.get('region'):'',country:/^[A-Z]{3}$/.test(query.get('country')||'')?query.get('country'):'',
    tempo:tempos.includes(query.get('tempo'))?query.get('tempo'):'',q:(query.get('q')||'').slice(0,120)};
}
function queryFor(state) {
  return new URLSearchParams(Object.entries(state).filter(([,v])=>v!=='')).toString();
}
export function filterEvents(data,s,countryName) {
  const words=normalize(s.q).trim().split(/\s+/).filter(Boolean);
  return data.events.filter(e=>{
    if(s.region && data.countries[e.country]?.[2]!==s.region)return false;
    if(s.country && e.country!==s.country || s.tempo && !e.tempos.includes(s.tempo))return false;
    const haystack=normalize([e.title,e.city,e.country,countryName(e.country),data.countries[e.country]?.[0]].join(' '));
    return words.every(w=>haystack.includes(w));
  });
}
export function mountCalendar(root,{id,icon,locale}) {
  const t=calendarText(locale),today=localDate(new Date()),query=new URLSearchParams(location.hash.split('?')[1]||'');
  const state=queryState(query,today),$=selector=>root.querySelector(selector);
  const fmtDate=dateFormatter(locale,{day:'numeric',month:'short',year:'numeric'}),shortDate=dateFormatter(locale,{day:'numeric',month:'short'});
  const monthFmt=dateFormatter(locale,{month:'long',year:'numeric'}),weekday=dateFormatter(locale,{weekday:'short'});
  const regionNames=new Intl.DisplayNames([locale],{type:'region'}),cmp=new Intl.Collator(locale);
  const when=new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'});
  let data=null,controller=null,revision=0,visible=12,labels=new Map();
  const dateRange=(e,full=false)=>{
    if(!e.start)return e.dateLabel||t('datesPending');
    const fmt=full?fmtDate:shortDate;
    return !e.end || e.end===e.start?fmt(e.start):fmt(e.start)+' – '+fmt(e.end);
  };
  function countryName(code){
    if(labels.has(code))return labels.get(code);
    const info=data?.countries[code];let name=info?.[0]||code;
    if(['ENG','SCO','WLS','TPE'].includes(code))name=t(code);
    else if(/^[A-Z]{2}$/.test(info?.[1]||''))name=regionNames.of(info[1])||name;
    labels.set(code,name);return name;
  }
  const countLabel=n=>n===1?t('one'):t('count',n);
  const external=(url,label,cls='')=>'<a class="'+cls+'" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>';
  const fileSource=(snapshot)=>'<small class="cal-sync'+(snapshot.stale?' stale':'')+'">'+esc(t(snapshot.stale?'stale':'updated',when.format(new Date(snapshot.updatedAt))))+'</small>';
  const option=(value,label)=>'<option value="'+esc(value)+'">'+esc(label)+'</option>';
  const selector=(key,text,values)=>'<label class="cal-field"><span>'+t(text)+'</span><select data-filter="'+key+'">'+values+'</select></label>';
  function setURL(){history.replaceState(history.state,'','#/calendar?'+queryFor(state));}
  function filters(){
    const country=$('[data-filter=country]'), names=new Set(Object.keys(data?.countries||{}));
    for(const e of data?.events||[])if(e.country)names.add(e.country);
    const codes=[...names].filter(c=>!state.region || data?.countries[c]?.[2]===state.region).sort((a,b)=>cmp.compare(countryName(a),countryName(b)));
    if(state.country && !codes.includes(state.country) && data){state.country='';setURL();}
    country.innerHTML=option('',t('allCountries'))+codes.map(code=>option(code,countryName(code)+' · '+code)).join('');
    country.value=state.country;
    $('[data-filter=region]').value=state.region;
    $('[data-filter=tempo]').value=state.tempo;
    $('[data-filter=q]').value=state.q;
  }
  function monthHead(){
    $('#calMonth').value=state.month;$('#calMonthName').textContent=monthFmt(state.month+'-01');
    $('#calPrevious').disabled=state.month==='1900-01';$('#calNext').disabled=state.month==='2099-12';
  }
  function controls(){
    root.innerHTML='<section class="tool-title cal-title"><div class="title-icon">'+icon('calendar')+'</div><div><h1>'+t('title')+'</h1></div>'+
      external(FIDE,t('official'),'cal-source')+'</section><div class="cal-filters">'+
      '<label class="cal-field cal-search"><span>'+t('search')+'</span><span class="cal-search-input">'+icon('search')+'<input type="search" data-filter="q" maxlength="120" placeholder="'+t('placeholder')+'"></span></label>'+
      selector('region','continent',option('',t('allRegions'))+regions.map(v=>option(v,t(v))).join(''))+
      selector('country','country',option('',t('allCountries')))+selector('tempo','tempo',option('',t('allTempos'))+tempos.map(v=>option(v,t(v))).join(''))+'</div>'+
      '<button class="cal-list-shortcut cal-link-button" data-cal-action="results" hidden></button><div class="cal-layout"><section class="cal-card cal-month"><header class="cal-month-head"><label class="cal-month-name"><strong id="calMonthName"></strong>'+icon('calendar')+
      '<input type="month" id="calMonth" min="1900-01" max="2099-12" aria-label="'+t('month')+'"></label>'+
      '<div class="cal-controls"><button type="button" class="soft-button" id="calToday">'+t('today')+'</button>'+
      '<button class="icon-button" id="calPrevious" aria-label="'+t('previous')+'">'+icon('previous')+'</button><button class="icon-button" id="calNext" aria-label="'+t('next')+'">'+icon('next')+'</button></div></header>'+
      '<div class="cal-weekdays" aria-hidden="true">'+Array.from({length:7},(_,i)=>'<span>'+esc(weekday('2024-01-'+pad(i+1)))+'</span>').join('')+'</div>'+
      '<div id="calDays" class="cal-days"></div><p class="cal-day-hint">'+t('dayHint')+'</p><div id="calSync"></div></section>'+
      '<section class="cal-card cal-agenda" id="calAgenda" tabindex="-1" aria-live="polite"></section></div>';
    filters();monthHead();
  }
  function grid(events){
    const [y,m]=state.month.split('-').map(Number), first=(new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7;
    const length=new Date(Date.UTC(y,m,0)).getUTCDate();
    let html=Array.from({length:first},()=>'<span class="cal-blank" aria-hidden="true"></span>').join('');
    for(let d=1;d<=length;d++){
      const date=state.month+'-'+pad(d),count=events.filter(e=>byDate(e,date)).length;
      html+='<button type="button" class="cal-day" data-day="'+date+'" aria-label="'+esc(fmtDate(date)+' · '+countLabel(count))+'" aria-pressed="'+(date===state.day)+'"'+
        (date===today?' aria-current="date"':'')+'><b>'+d+'</b>'+(count?'<span class="cal-day-count">'+count+'</span>':'')+'</button>';
    }
    const trailing=(7-(first+length)%7)%7;
    $('#calDays').innerHTML=html+'<span class="cal-blank" aria-hidden="true"></span>'.repeat(trailing);
  }
  function row(e) {
    const country=countryName(e.country),place=[e.city,normalize(e.city)===normalize(country)?'':country].filter(Boolean).join(', ')||(e.online?t('online'):t('locationPending'));
    const query=queryFor(state);
    return '<a class="cal-event" data-event-id="'+e.id+'" href="#/calendar/'+e.id+'?'+esc(query)+'"><div class="cal-event-top"><span>'+esc(dateRange(e))+'</span>'+
      '<span class="cal-tempos">'+e.tempos.map(v=>'<span class="cal-tempo '+v+'">'+t(v)+'</span>').join('')+'</span></div><h3>'+esc(e.title)+'</h3>'+
      '<div class="cal-event-foot"><span>'+esc(place)+'</span>'+icon('arrow')+'</div></a>';
  }
  function showResults(){
    if(!data)return;
    const all=filterEvents(data,state,countryName),events=state.day?all.filter(e=>byDate(e,state.day)):all;
    grid(all);$('#calSync').innerHTML=fileSource(data);
    const jump=$('[data-cal-action=results]');jump.hidden=false;jump.textContent=t('showList',countLabel(events.length));
    const filtered=!!(state.country||state.region||state.tempo||state.q.trim());
    $('#calAgenda').innerHTML='<header class="cal-agenda-head"><div><h2>'+esc(state.day?t('onDate',shortDate(state.day)):t('monthlyList'))+'</h2><span class="cal-results-count">'+
      esc(filtered?t('filtered',countLabel(events.length),data.events.length):countLabel(events.length))+'</span></div>'+
      (state.day?'<button class="cal-link-button" data-cal-action="whole">'+t('fullMonth')+'</button>':'')+
      (filtered?'<button class="cal-link-button" data-cal-action="clear">'+t('clear')+'</button>':'')+'</header>'+
      (events.length?'<div class="cal-event-list">'+events.slice(0,visible).map(row).join('')+'</div>'+
        (visible<events.length?'<button class="soft-button cal-more" data-cal-action="more">'+t('more')+'</button>':''):
        '<p class="cal-empty">'+t(data.events.length?'noMatch':'empty')+'</p>');
  }
  async function get(path) {
    const current=++revision;
    controller?.abort();controller=new AbortController();
    const cached=cache.get(path);
    if(cached && Date.now()-cached.time<60000)return cached.value;
    const res=await fetch(path,{signal:controller.signal});
    if(!res.ok)throw Error(String(res.status));
    const value=await res.json();
    if(current!==revision || !root.isConnected)return null;
    if(!value.stale){
      cache.set(path,{value,time:Date.now()});
      if(cache.size>16)cache.delete(cache.keys().next().value);
    }
    return value;
  }
  function retry(msg){
    return '<div class="cal-notice" role="status"><p>'+t(msg)+'</p><button type="button" class="soft-button" data-cal-action="retry">'+t('retry')+'</button></div>';
  }
  async function loadMonth(){
    const month=state.month;monthHead();data=null;labels=new Map();visible=12;
    grid([]);$('[data-cal-action=results]').hidden=true;$('#calSync').textContent='';$('#calAgenda').innerHTML='<p class="cal-loading" role="status">'+t('loading')+'</p>';root.setAttribute('aria-busy','true');
    try{
      const loaded=await get('/api/calendar?month='+month);
      if(!loaded || state.month!==month || !root.isConnected)return;
      data=loaded;labels.clear();filters();showResults();
    }catch(e){if(e.name!=='AbortError' && root.isConnected && month===state.month)$('#calAgenda').innerHTML=retry('error');}
    finally{if(root.isConnected && state.month===month)root.setAttribute('aria-busy','false');}
  }
  function setMonth(month,day=''){
    if(!isMonth(month))return;
    const same=month===state.month;state.month=month;state.day=day;visible=12;setURL();
    if(same && data)showResults();else loadMonth();
  }
  function backLink(snapshot) {
    const back={...state};if(!query.has('month') && snapshot?.start)back.month=snapshot.start.slice(0,7);
    return '<a class="cal-back" href="#/calendar?'+esc(queryFor(back))+'">'+icon('previous')+t('back')+'</a>';
  }
  function detailBody(d) {
    const hasLink=f=>d.links.some(l=>l.url.includes(f.value)||l.label===f.value);
    const fields=d.fields.filter(f=>!['email','website'].includes(f.key)||!hasLink(f)),value=k=>d.fields.find(f=>f.key===k)?.value;
    const location=[value('city'),value('country')].filter(Boolean).join(', ');
    return backLink(d)+'<article class="cal-detail"><header class="cal-detail-header"><div class="cal-detail-icon">'+icon('calendar')+'</div><div><p>'+esc(dateRange(d,true))+(location?' · '+esc(location):'')+
      '</p><h1>'+esc(d.title)+'</h1></div>'+external(eventURL(d.id),t('officialEvent'),'cal-official')+'</header>'+
      '<div class="cal-detail-sections">'+(fields.length?'<section><h2>'+t('details')+'</h2><dl class="cal-facts">'+fields.map(f=>'<div><dt>'+esc(f.key?t(f.key):f.label)+'</dt><dd>'+esc(f.value)+'</dd></div>').join('')+'</dl></section>':'')+
      (d.links.length?'<section><h2>'+t('links')+'</h2><ul class="cal-links">'+d.links.map(l=>{
        const fk=d.fields.find(f=>['website','email'].includes(f.key) && (l.url.includes(f.value)||l.label===f.value));
        return '<li>'+external(l.url,fk?.key==='website'?t('website'):l.label)+'</li>';
      }).join('')+'</ul></section>':'')+(d.organizers.length?'<section><h2>'+t('organizers')+'</h2><ul class="cal-officials">'+d.organizers.map(o=>'<li>'+(o.url?external(o.url,o.name):esc(o.name))+(o.role?'<small>'+esc(o.role)+'</small>':'')+'</li>').join('')+'</ul></section>':'')+
      '</div>'+fileSource(d)+'</article>';
  }
  async function detail(){
    root.innerHTML=backLink()+'<p class="cal-loading">'+t('loadingEvent')+'</p>';root.setAttribute('aria-busy','true');
    try {
      if(!/^[1-9]\d{0,8}$/.test(id))throw Error();
      const d=await get('/api/calendar/events/'+id);
      if(d && root.isConnected)root.innerHTML=detailBody(d);
    }catch(e){
      if(e.name!=='AbortError' && root.isConnected) root.innerHTML=backLink()+retry('errorEvent')+
        external(/^[1-9]\d{0,8}$/.test(id)?eventURL(id):FIDE,t('officialEvent'),'cal-official');
    }finally{if(root.isConnected)root.setAttribute('aria-busy','false');}
  }
  root.oninput=e=>{
    if(e.target.dataset.filter!=='q')return;
    state.q=e.target.value;visible=12;setURL();showResults();
  };
  root.onchange=e=>{
    const key=e.target.dataset.filter;
    if(e.target.id==='calMonth'){if(isMonth(e.target.value))setMonth(e.target.value);return;}
    if(!['country','region','tempo'].includes(key))return;
    state[key]=e.target.value;visible=12;
    if(key==='region'){if(data && state.country && state.region && data.countries[state.country]?.[2]!==state.region)state.country='';filters();}
    setURL();showResults();
  };
  function jumpToAgenda(){
    const agenda=$('#calAgenda');agenda.focus({preventScroll:true});agenda.scrollIntoView({block:'start'});
  }
  root.onclick=e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.id==='calPrevious'||b.id==='calNext'){
      const [y,m]=state.month.split('-').map(Number),n=new Date(Date.UTC(y,m-1+(b.id==='calNext'?1:-1),1));
      setMonth(n.toISOString().slice(0,7));return;
    }
    if(b.id==='calToday'){setMonth(today.slice(0,7),today);return;}
    if(b.dataset.day){
      state.day=state.day===b.dataset.day?'':b.dataset.day;visible=12;setURL();showResults();
      if(data && matchMedia('(max-width:740px)').matches)jumpToAgenda();else root.querySelector('[data-day="'+b.dataset.day+'"]')?.focus({preventScroll:true});
      return;
    }
    switch(b.dataset.calAction) {
      case 'results':jumpToAgenda();break;
      case 'whole':state.day='';visible=12;setURL();showResults();break;
      case 'clear':Object.assign(state,{q:'',region:'',country:'',tempo:''});visible=12;setURL();filters();showResults();break;
      case 'more':visible+=12;showResults();break;
      case 'retry':if(id)detail();else loadMonth();break;
    }
  };
  if(id)detail();else{controls();loadMonth();}
  return ()=>{revision++;controller?.abort();root.oninput=root.onchange=root.onclick=null;};
}
