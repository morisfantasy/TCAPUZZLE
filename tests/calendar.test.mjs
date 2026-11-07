import test from 'node:test';
import assert from 'node:assert/strict';
import source from '../src/fide-calendar.cjs';
import {filterEvents} from '../src/calendar.mjs';

const {readPage,readDetail,fetchMonth,eventDates,createCalendar}=source;
const month='2026-11';
function tile(id,title,dates='3-8 Nov',city='A Coruña, ESP',tempo='Standard') {
  return '<div class="calendar-t-tile"><div class="date_flag">'+dates+'</div><p class="t-tile-city">'+city+
    '</p><p class="tile-header-name"><a href="calendar.php?id='+id+'">'+title+
    '</a></p><p class="t-tile-start">Time control: '+tempo+'</p></div>';
}
const listing=(rows,pages=1)=>'<div id="calendar-t-body">'+rows.join('')+'</div><div class="ranking-pagination"><span onclick="loadTiles('+pages+')"></span></div>';
const response=body=>new Response(body,{status:200});
const field=(label,value)=>'<div class="event-info-row"><div class="event-info-row-left">'+label+'</div><div class="event-info-row-right">'+value+'</div></div>';

test('calendar dates cover a single day, month boundaries, year boundaries and leap days',()=>{
  for(const [label,query,start,end] of [
    ['29Nov',month,'2026-11-29','2026-11-29'],['3–8 Nov',month,'2026-11-03','2026-11-08'],
    ['29 Oct-3 Nov',month,'2026-10-29','2026-11-03'],['28 Dec-2 Jan','2027-01','2026-12-28','2027-01-02'],
    ['28 Dec-2 Jan','2026-12','2026-12-28','2027-01-02'],['29 Feb','2028-02','2028-02-29','2028-02-29'],
    ['31 Feb','2028-02',null,null],['To be confirmed',month,null,null]
  ])assert.deepEqual(eventDates(label,query),{start,end},label);
});
test('listing consumes every FIDE page, deduplicates IDs, maps controls and sorts across months',async()=>{
  const pages=[],first=tile(11,'First &amp; last','28 Oct-2 Nov'),last=tile(22,'Blitz final','28 Nov','Hong Kong, HKG','Rapid and Blitz');
  const events=await fetchMonth(month,async(url,{method,body})=>{
    assert.equal(method,'POST');assert.equal(body.get('show'),'tiles');assert.equal(body.get('from_date'),'2026-11-01');assert.equal(body.get('to_date'),'2026-11-30');
    const n=Number(body.get('page'));pages.push(n);
    return response(listing([...[first,tile(19,'Festival','6 Nov','Paris, FRA','other'),last].slice(n-1,n),...(n===2?[first]:[])],3));
  });
  assert.deepEqual(pages.sort(),[1,2,3]);assert.deepEqual(events.map(e=>e.id),[11,19,22]);
  assert.equal(events[0].title,'First & last');assert.equal(events[0].city,'A Coruña');assert.equal(events[0].start,'2026-10-28');
  assert.deepEqual(events[2].tempos,['rapid','blitz']);assert.deepEqual(events[1].tempos,['other']);
  assert.throws(()=>readPage('<html>unexpected</html>',month),{status:502});
  assert.throws(()=>readPage(listing([tile('garbage','broken')]),month),{status:502});
  await assert.rejects(fetchMonth(month,async(url,{body})=>response(body.get('page')==='1'?listing([first],2):'')),{status:502});
  const modes=[];assert.deepEqual(await fetchMonth(month,async(url,{body})=>{modes.push(body.get('show'));return response('');}),[]);
  assert.deepEqual(modes,['tiles','table']);
});
test('detail uses public fields and official event dates and exposes only supported link schemes',()=>{
  const date=n=>'<div class="event-date"><h4>'+n+'</h4><h5>Nov 2026</h5></div>';
  const html='<div class="event-left"><h1 class="event-title">Test &amp; Open</h1>'+date(4)+date(8)+
    field('City','A Coruña')+field('Number of rounds','7')+field('Time control description','90 + 30')+
    field('Website','<a href="https://example.org/open">Organizer site</a>')+field('Regulations','<a href="/files/rules.pdf">Regulations PDF</a>')+
    '<a href="javascript:void(0)">Map</a><div class="event-organizers"><a href="https://ratings.fide.com/profile/123"><h6>Jane</h6></a><p>Arbiter</p></div></div>';
  const d=readDetail(html,'12');assert.equal(d.title,'Test & Open');assert.equal(d.end,'2026-11-08');assert.equal(d.start,'2026-11-04');
  assert.ok(d.fields.some(f=>f.key==='rounds'&&f.value==='7'));assert.deepEqual(d.links.map(l=>l.url),['https://example.org/open','https://calendar.fide.com/files/rules.pdf']);
  assert.deepEqual(d.organizers,[{name:'Jane',role:'Arbiter',url:'https://ratings.fide.com/profile/123'}]);
  assert.equal(source.officialLink('data:text/plain,hello'),null);assert.throws(()=>readDetail('','999'),{status:404});
});
test('simultaneous month requests share work, a partial upstream failure preserves the complete prior snapshot',async()=>{
  let time=Date.parse('2026-11-07T06:00:00Z'),badSecond=false,pageRequests=0;const snapshots=new Map();
  const service=createCalendar({now:()=>time,readCache:async key=>snapshots.get(key),writeCache:async(k,v)=>snapshots.set(k,v),
    fetcher:async(url,{body})=>{
      if(!body)return new Response('',{status:503});
      pageRequests++;if(badSecond&&body.get('page')==='2')return new Response('',{status:503});
      return response(listing([tile(Number(body.get('page')),'Open '+body.get('page'))],2));
    }});
  const [a,b]=await Promise.all([service.month(month),service.month(month)]);
  assert.deepEqual(a,b);assert.equal(pageRequests,2);assert.equal(a.events.length,2);assert.equal(a.stale,false);assert.equal(a.countries.HKG[2],'Asia');
  time+=3600001;badSecond=true;const stale=await service.month(month);
  assert.equal(stale.stale,true);assert.deepEqual(stale.events,a.events);assert.equal(stale.updatedAt,a.updatedAt);
  assert.deepEqual(snapshots.get('month:'+month).value,a.events);const count=pageRequests;
  await service.month(month);assert.equal(pageRequests,count);
  time+=61000;badSecond=false;const fresh=await service.month(month);assert.equal(fresh.stale,false);assert.notEqual(fresh.updatedAt,a.updatedAt);
  await assert.rejects(service.month('2026-99'),{status:400});await assert.rejects(service.detail('-1'),{status:400});
});
test('country, FIDE continent, time control and accent-insensitive search combine',()=>{
  const countries={ESP:['Spain','ES','Europe'],HKG:['Hong Kong, China','HK','Asia']};
  const events=[{title:'Festival de la Ría',city:'A Coruña',country:'ESP',tempos:['rapid','blitz']},
    {title:'Summer Rapid',city:'Hong Kong',country:'HKG',tempos:['rapid']}];
  const run=(opts)=>filterEvents({countries,events},{q:'',...opts},c=>c==='ESP'?'España':'Hong Kong');
  assert.deepEqual(run({q:'CORUNA ria',tempo:'blitz',region:'Europe',country:'ESP'}),[events[0]]);
  assert.deepEqual(run({q:'Spain'}),[events[0]]);assert.deepEqual(run({region:'Asia',country:'ESP'}),[]);assert.deepEqual(run({tempo:'standard'}),[]);
});
