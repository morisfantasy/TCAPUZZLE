const {parse} = require('node-html-parser');
const directorySnapshot = require('./data/calendar-federations.json');
const origin = 'https://calendar.fide.com/';
const feed = origin+'calendar_server.php';
const directoryURL = 'https://directory.fide.com/a_fedslist.php';
const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const clean = value => String(value??'').replace(/\s+/g,' ').trim();
const textOf = element => clean(element?.text);
const monthOK = month => typeof month==='string' && /^(?:19|20)\d{2}-(?:0[1-9]|1[0-2])$/.test(month);
const idOK = id => /^[1-9]\d{0,8}$/.test(String(id));
const error = (status,message) => Object.assign(new Error(message),{status});
const isoDate = (y,m,d) => {
  const date=new Date(Date.UTC(y,m-1,d));
  return date.getUTCDate()===d && date.getUTCMonth()===m-1?date.toISOString().slice(0,10):null;
};
function monthBounds(month) {
  const [year,number]=month.split('-').map(Number);
  return [month+'-01',new Date(Date.UTC(year,number,0)).toISOString().slice(0,10)];
}
// FIDE tiles print "3-7 Nov", "29 Oct-3 Nov" or "29Nov". Anchor the missing
// year to the queried month, including events on either side of New Year.
function eventDates(value,month) {
  const raw=clean(value).replace(/\s/g,'').replace(/[–—]/g,'-').toLowerCase();
  const m=raw.match(/^(\d{1,2})([a-z]{3})?(\d{4})?(?:-(\d{1,2})([a-z]{3})(\d{4})?)?$/);
  if(!m || !(m[2]||m[5]))return {start:null,end:null};
  const firstMonth=monthNames.indexOf(m[2]||m[5])+1,lastMonth=monthNames.indexOf(m[5]||m[2])+1;
  const firstDay=+m[1],lastDay=+(m[4]||m[1]),base=+month.slice(0,4),[lo,hi]=monthBounds(month);
  for(const year of m[3]?[+m[3]]:[base,base-1,base+1]){
    const finalYear=m[6]?+m[6]:year+(lastMonth<firstMonth?1:0);
    const start=isoDate(year,firstMonth,firstDay),end=isoDate(finalYear,lastMonth,lastDay);
    if(start && end && start<=end && start<=hi && end>=lo)return {start,end};
  }
  return {start:null,end:null};
}
function tempoCodes(label) {
  const tempos=[['standard',/standard|classical/i],['rapid',/rapid/i],['blitz',/blitz/i]];
  const found=tempos.filter(([,re])=>re.test(label)).map(([code])=>code);
  return found.length?found:['other'];
}
function officialID(href) {
  try{const url=new URL(href,origin),id=url.searchParams.get('id');
    return url.origin===new URL(origin).origin && url.pathname==='/calendar.php' && idOK(id)?Number(id):null;
  }catch{return null;}
}
function readPage(html,month) {
  if(!html.trim())return {events:[],pages:1};
  const doc=parse(html), body=doc.querySelector('#calendar-t-body,#calendar_h_body');
  if(!body)throw error(502,'Unexpected FIDE calendar response');
  const events=[];
  for(const row of body.querySelectorAll('.calendar-t-tile,.calendar-h-row')){
    const anchor=row.querySelector('.tile-header-name a,.calendar-h-name a'), id=officialID(anchor?.getAttribute('href')),title=textOf(anchor);
    if(!id || !title)throw error(502,'Unrecognised FIDE event');
    const dateLabel=textOf(row.querySelector('.date_flag,.calendar-h-date-container'));
    const location=textOf(row.querySelector('.t-tile-city,.calendar-h-city'));
    const flag=row.querySelector('.flag')?.classNames.split(/\s+/).find(v=>/^[a-z]{3}$/i.test(v));
    const country=(flag||location.match(/,\s*([A-Z]{3})$/)?.[1]||'').toUpperCase();
    const city=clean(country?location.replace(new RegExp(',?\\s*\\b'+country+'$','i'),''):location);
    const tempo=textOf(row.querySelector('.t-tile-start,.calendar-h-start')).replace(/^time control\s*:\s*/i,'');
    const online=/\bonline\b/i.test(location) || !!row.querySelector('.onl-tile,.online-tile') || row.classNames.split(/\s+/).includes('online-tile');
    events.push({id,title,...eventDates(dateLabel,month),dateLabel,city,country,tempos:tempoCodes(tempo),online});
  }
  const pages=Math.max(1,...doc.querySelectorAll('.ranking-pagination [onclick]').map(el=>
    Number(el.getAttribute('onclick').match(/load(?:Tiles|Table)\(\s*(\d+)\s*\)/)?.[1])||1));
  return {events,pages};
}
function officialLink(raw) {
  if(!raw || raw.startsWith('#'))return null;
  try{const link=new URL(raw,origin);return ['https:','http:','mailto:'].includes(link.protocol)?link.href:null;}catch{return null;}
}
function detailDate(el) {
  const day=Number(textOf(el?.querySelector('h4'))), match=textOf(el?.querySelector('h5')).match(/^([a-z]{3})\s+(\d{4})$/i);
  return match?isoDate(+match[2],monthNames.indexOf(match[1].toLowerCase())+1,day):null;
}
const infoKeys={
  'number of players':'players','total prize fund':'prizes','type of event':'format','time control':'tempo','time control description':'timeDescription',
  'tournament system':'system','number of rounds':'rounds','country':'country','city':'city','venue':'venue','address':'address',
  'website':'website','e-mail':'email','email':'email','phone':'phone','contact':'contact','organizer':'organizer'
};
function readDetail(html,id) {
  const doc=parse(html), title=textOf(doc.querySelector('.event-title'));
  if(!title)throw error(html.trim()?502:404,'Event details unavailable');
  const dates=doc.querySelectorAll('.event-date'), fields=[], links=[],seen=new Set();
  function addLink(a,label) {
    const url=officialLink(a.getAttribute('href'));
    if(!url||seen.has(url))return;
    seen.add(url);links.push({label:clean(label)||textOf(a)||url,url});
  }
  for(const row of doc.querySelectorAll('.event-info-row')){
    const label=textOf(row.querySelector('.event-info-row-left')), right=row.querySelector('.event-info-row-right');
    const value=textOf(right), key=infoKeys[label.toLowerCase()]||'';
    if(!right || !label || (!value && !right.querySelector('a[href]')))continue;
    if(key && value)fields.push({key,value});
    else if(value && !right.querySelector('a[href]'))fields.push({key:'',label,value});
    for(const a of right.querySelectorAll('a[href]'))addLink(a,key?'':textOf(a)||label);
  }
  for(const a of doc.querySelectorAll('.event-left a[href]')){
    if(a.closest('.event-organizers')||a.closest('.event-info-row-right'))continue;
    addLink(a,a.getAttribute('title')||textOf(a)||a.querySelector('img')?.getAttribute('alt'));
  }
  const organizers=doc.querySelectorAll('.event-organizers').map(el=>({name:textOf(el.querySelector('h6')),
    role:textOf(el.querySelector('p')),url:officialLink(el.querySelector('a')?.getAttribute('href'))})).filter(p=>p.name);
  return {id:Number(id),title,start:detailDate(dates[0]),end:detailDate(dates[1])||detailDate(dates[0]),fields,links,organizers};
}
async function requestText(fetcher,url,options={}) {
  const res=await fetcher(url,{...options,signal:AbortSignal.timeout(12000)});
  if(!res.ok)throw error(res.status===404?404:502,'FIDE could not respond');
  return res.text();
}
async function fetchMonth(month,fetcher=fetch) {
  const [from_date,to_date]=monthBounds(month);
  async function page(n,show='tiles') {
    const body=new URLSearchParams({show,page:String(n),from_date,to_date,country:'all',name_filter:'',event_type:'all',time_control:'all','cat_cont[]':'0'});
    return readPage(await requestText(fetcher,feed,{method:'POST',body}),month);
  }
  let first=await page(1),mode='tiles';
  if(!first.events.length){mode='table';first=await page(1,mode);}
  if(first.pages>160)throw error(502,'Unexpected FIDE pagination');
  const rows=[...first.events];let next=2;
  // At most three simultaneous public listing requests per month.
  async function remaining() {
    while(next<=first.pages) {
      const n=next++, result=await page(n,mode);
      if(!result.events.length)throw error(502,'Incomplete FIDE calendar');
      rows.push(...result.events);
    }
  }
  await Promise.all(Array.from({length:Math.min(3,first.pages-1)},remaining));
  const unique=new Map(rows.map(item=>[item.id,item]));
  return [...unique.values()].sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999')||a.title.localeCompare(b.title)||a.id-b.id);
}
async function fetchDirectory(fetcher) {
  const rows=JSON.parse((await requestText(fetcher,directoryURL)).replace(/^\uFEFF/,''));
  if(!Array.isArray(rows)||rows.length<100)throw error(502,'FIDE federation directory unavailable');
  const out={};
  for(const row of rows){
    const code=clean(row.fed_short_name);
    if(/^[A-Z]{3}$/.test(code))out[code]=[clean(row.sort_name),clean(row.two_letter_code),clean(row.continent)];
  }
  return out;
}
function createCalendar({readCache,writeCache,fetcher=fetch,now=Date.now}) {
  const memory=new Map(),pending=new Map(),hour=3600000;
  function remember(key,snapshot) {
    memory.delete(key);memory.set(key,snapshot);
    if(memory.size>128)memory.delete(memory.keys().next().value);
  }
  function cached(key,lifetime,loader) {
    if(pending.has(key))return pending.get(key);
    const task=(async()=>{
      let previous=memory.get(key);
      if(!previous){try{previous=await readCache(key);if(previous)remember(key,previous);}catch{/* Live reads remain available. */}}
      if(previous && (now()-Date.parse(previous.updatedAt)<lifetime || now()<(previous.retryAt||0)))return {...previous,stale:!!previous.retryAt};
      try{
        const value=await loader(), snapshot={value,updatedAt:new Date(now()).toISOString()};
        remember(key,snapshot);
        try{await writeCache(key,snapshot);}catch{/* The in-process copy remains usable. */}
        return {...snapshot,stale:false};
      }catch(err){
        if(!previous)throw err;
        const stale={...previous,retryAt:now()+60000};remember(key,stale);return {...stale,stale:true};
      }
    })().finally(()=>pending.delete(key));
    pending.set(key,task);return task;
  }
  return {
    async month(month){
      if(!monthOK(month))throw error(400,'Invalid month');
      const [listing,directory]=await Promise.all([
        cached('month:'+month,hour,()=>fetchMonth(month,fetcher)),
        cached('federations',7*24*hour,()=>fetchDirectory(fetcher)).catch(()=>({value:directorySnapshot}))
      ]);
      return {month,events:listing.value,countries:directory.value,updatedAt:listing.updatedAt,stale:listing.stale};
    },
    async detail(id){
      if(!idOK(id))throw error(400,'Invalid event ID');
      const r=await cached('event:'+id,6*hour,async()=>readDetail(await requestText(fetcher,feed+'?id='+id+'&preview=0'),id));
      return {...r.value,updatedAt:r.updatedAt,stale:r.stale};
    }
  };
}
module.exports={createCalendar,fetchMonth,readPage,readDetail,eventDates,tempoCodes,monthOK,idOK,officialLink};
