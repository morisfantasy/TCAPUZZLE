import test from 'node:test';
import assert from 'node:assert/strict';
import {dp,averages,minimumScore,evaluate,portfolio,blankEvent,blankGame,blankCert,commonEvidence} from '../src/norms.mjs';

const rule=(r,key)=>r.checks.find(c=>c.key===key);
const game=(i,extra={})=>({...blankGame(i+1),status:'played',score:1,rating:'2450',title:['IM','GM','IM','WFM','FM','none','none','none','none'][i%9],fed:['ESP','FRA','HKG'][i%3],...extra});
function event(over={}) {
  return {...blankEvent(),fed:'HKG',rounds:9,minutes:120,daily:2,hours:8,duration:7,
    evidence:Object.fromEntries(commonEvidence.map(k=>[k,'yes'])),games:Array.from({length:9},(_,i)=>game(i)),...over};
}
const allDone=(e,scores)=>e.games.forEach((g,i)=>{g.score=scores[i];g.status='played';});
test('All 101 official dp entries, exact half-up at 12.5% and half-up mean',()=>{
  const positive=[0,7,14,21,29,36,43,50,57,65,72,80,87,95,102,110,117,125,133,141,149,158,166,175,184,193,202,211,220,230,240,251,262,273,284,296,309,322,336,351,366,383,401,422,444,470,501,538,589,677,800];
  for(let p=0;p<=100;p++)assert.equal(dp(p,100),Math.sign(p-50)*positive[Math.abs(p-50)]);
  assert.equal(dp(1,8),-322);assert.equal(dp(3.5,10),-110);
  assert.equal(averages([game(0,{rating:2400}),game(1,{rating:2401})],'IM').adjusted,2401);
  assert.equal(minimumScore(9,2370,'IM'),5.5);assert.equal(minimumScore(9,2369,'IM'),6);
  assert.equal(minimumScore(9,2229,'IM'),null);
});
test('FIDE Arbiters’ Manual 2025, example 3: adjusted 2476, 5.5/8, draw required for GM',()=>{
  const e=event({target:'GM',fed:'ARM'});
  const entries=[['NOR','GM',2470,0],['GEO','none',2150,1],['GER','none',2410,1],['ARM','IM',2570,0],
    ['GEO','none',2340,1],['GEO','FM',2380,1],['ARM','GM',2675,.5],['ENG','IM',2540,1],['USA','GM',2695,null]];
  e.games=entries.map(([fed,title,rating,score],i)=>game(i,{fed,title,rating,score,status:score===null?'future':'played'}));
  const r=evaluate(e);assert.equal(r.average.adjusted,2476);assert.equal(r.score,5.5);assert.equal(r.simulation.required,.5);
  assert.deepEqual(r.simulation.combinations,[{w:0,d:1,l:0}]);e.games[8].status='played';e.games[8].score=.5;
  const done=evaluate(e);assert.equal(done.rp,2601);assert.equal(done.overall,'met');assert.equal(done.credit,9);
});
test('Manual 2025 example 1: single adjustment, then legally removing a win',()=>{
  const e=event({target:'GM',rounds:11});
  const values=[2140,2160,2400,2400,2400,2400,2400,2400,2400,2400,2636];
  e.games=values.map((rating,i)=>game(i,{rating,title:i>=2&&i<=5?'GM':i===6||i===7?'FM':'none',score:i<9?1:0}));
  const full=evaluate(e);assert.equal(full.current.real,2376);assert.equal(full.current.adjusted,2381);assert.equal(full.overall,'met');
  e.games[0].status='omitWin';assert.equal(evaluate(e).overall,'pending');e.evidence.omitWin='yes';
  const r=evaluate(e);assert.equal(r.current.real,2400);assert.equal(r.current.adjusted,2404);assert.equal(r.overall,'met');
});
test('Only the lowest opponent is raised; other unrated count as 1400; blank remains unknown',()=>{
  const rows=[game(0,{rating:'UR'}),game(1,{rating:'UR'}),game(2,{rating:2010}),game(3,{rating:2600})];
  assert.deepEqual(averages(rows,'IM'),{real:1853,adjusted:2015,sum:8060,raised:1});
  assert.equal(averages(rows,'GM').adjusted,2053);rows[0].rating='';assert.equal(averages(rows,'IM'),null);
});
test('GM / IM, 50% titles, CM/WCM excluded; 35% and integer caps',()=>{
  const e=event();e.games.forEach((g,i)=>g.title=['IM','IM','GM','WCM','CM','none','none','none','none'][i]);
  let r=evaluate(e);assert.ok(r.rp>=2450);assert.equal(rule(r,'titleHolders').status,'failed');assert.equal(rule(r,'elite').status,'met');
  e.target='GM';r=evaluate(e);assert.equal(rule(r,'elite').status,'failed');
  e.games.forEach(g=>g.rating=2800);allDone(e,[1,1,1,0,0,0,0,0,0]);assert.equal(rule(evaluate(e),'minScore').status,'failed');
  e.games[3].score=.5;assert.equal(rule(evaluate(e),'minScore').status,'met');
});
test('Foreign federations, FID, caps and Swiss and national exceptions',()=>{
  const e=event();e.games.forEach((g,i)=>g.fed=i<6?'HKG':i===6?'FID':'ESP');
  let r=evaluate(e);assert.equal(rule(r,'foreign').value,1);assert.equal(rule(r,'ownCap').status,'failed');assert.equal(rule(r,'oneCap').status,'met');
  e.games[6].fed='HKG';assert.equal(rule(evaluate(e),'oneCap').status,'failed');
  e.event='nationalFinal';e.host='ESP';e.evidence.national='yes';assert.equal(rule(evaluate(e),'foreign').status,'failed');
  e.host='HKG';r=evaluate(e);assert.equal(r.opposition.normal,false);assert.equal(r.overall,'met');
  e.event='regular';e.exemption='swiss20';assert.equal(rule(evaluate(e),'foreign').status,'pending');
  e.evidence.swiss20='yes';assert.equal(evaluate(e).overall,'met');e.format='rr';assert.equal(rule(evaluate(e),'foreign').status,'failed');
});
test('DRR annex counts distinct opponents; six players, three necessary titleholders, repeated identity',()=>{
  const e=event({format:'drr',rounds:'10',players:6});
  e.games=Array.from({length:10},(_,i)=>game(i,{id:String(101+i%5),title:['GM','IM','IM','WFM','none'][i%5],fed:['HKG','HKG','ESP','FRA','GER'][i%5]}));
  assert.equal(evaluate(e).overall,'met');for(const i of [1,6])e.games[i].title='FM';
  let r=evaluate(e);assert.equal(rule(r,'elite').value,2);assert.equal(rule(r,'elite').target,3);assert.equal(rule(r,'elite').status,'failed');
  e.games[1].title=e.games[6].title='IM';e.games[0].id='';assert.equal(rule(evaluate(e),'identity').status,'pending');
  e.players=5;assert.equal(rule(evaluate(e),'drrSize').status,'failed');
});
test('Excluded games, valid 8+allocated bye, ordinary request, Cup and 7-round special teams',()=>{
  const e=event();e.games[8].status='allocatedBye';e.games.forEach((g,i)=>g.score=i<4?1:0);
  let r=evaluate(e);assert.equal(r.bye8,true);assert.equal(r.played,8);assert.equal(r.credit,9);
  e.games[8].status='otherBye';assert.equal(rule(evaluate(e),'games').status,'failed');
  e.games[8].status='forfeitWin';assert.equal(evaluate(e).bye8,true);
  e.games[8].status='adjudicated';e.event='worldCup';assert.equal(evaluate(e).credit,9);
  e.event='worldTeam';e.rounds=7;e.games=e.games.slice(0,7);assert.equal(evaluate(e).min,7);
  e.event='regular';assert.equal(evaluate(e).overall,'failed');
  e.rounds=9;e.games=event().games;e.games[0].fed='NON';assert.equal(evaluate(e).played,8);
});
test('Unrated RR opponent with zero vs rated is excluded; missing official data or a missing federation stays pending',()=>{
  const e=event({format:'rr'});e.games[2].rating='UR';e.games[2].rrPoints='no';assert.equal(evaluate(e).played,8);
  e.games[2].rrPoints='';assert.equal(rule(evaluate(e),'eligible').status,'pending');
  e.games[2].rrPoints='yes';e.games[2].fed='ZZZ';assert.equal(rule(evaluate(e),'eligible').status,'pending');
  e.games[2].fed='FID';assert.equal(evaluate(e).played,9);
  e.games[2].rating=2450;delete e.evidence.arbiters;assert.equal(evaluate(e).sport,'met');assert.equal(evaluate(e).overall,'pending');
});
test('Final opponent default requires a loss sufficient AND the missing game and explicit evidence',()=>{
  const e=event();e.games[8].status='lastDefault';e.evidence.lastDefault='yes';assert.equal(evaluate(e).overall,'met');
  e.games.forEach(g=>g.score=0);assert.equal(evaluate(e).overall,'failed');e.games[7].status='lastDefault';assert.equal(rule(evaluate(e),'eligible').status,'failed');
});
test('Six completed games, two points from three; unknown opponent ratings yield conditional scenarios only',()=>{
  const e=event();e.games.forEach((g,i)=>{g.rating=2350;g.status=i<6?'played':'future';g.score=[1,1,.5,0,1,.5][i]??null;});
  let r=evaluate(e);assert.equal(r.score,4);assert.equal(r.rp,2475);assert.equal(r.simulation.required,2);
  assert.deepEqual(r.simulation.combinations,[{w:1,d:2,l:0},{w:2,d:0,l:1}]);
  e.games[6].rating='';r=evaluate(e);assert.equal(r.simulation.required,null);
  const scenario=r.simulation.scenarios.find(s=>s.points===2);assert.equal(scenario.ra,2325);assert.equal(scenario.opponent,2121);
  e.games[6].rating=scenario.opponent;assert.equal(evaluate(e).simulation.required,2);
  e.games[6].rating--;assert.ok(evaluate(e).simulation.required>2);
});
test('Mathematically impossible missing score, titles or foreign federations with rounds remaining',()=>{
  const e=event();e.games.forEach(g=>{g.rating=2350;g.score=0;g.title='none';g.fed='HKG';});
  e.games[8]=blankGame(9);let r=evaluate(e);assert.equal(r.overall,'impossible');assert.equal(r.simulation.impossible,true);
  assert.equal(rule(r,'elite').status,'impossible');assert.equal(rule(r,'oneCap').status,'impossible');
  e.games[8].title='';e.games[8].rating=2600;assert.equal(evaluate(e).simulation.impossible,true);
});
test('Registration, two rounds/day, 12 hours, 2026 pilot, long tournaments and format approval',()=>{
  const e=event();e.minutes=90;assert.equal(rule(evaluate(e),'minutes').status,'failed');e.pilot='yes';assert.equal(rule(evaluate(e),'minutes').status,'pending');
  e.evidence.pilot='yes';assert.equal(rule(evaluate(e),'minutes').status,'met');e.minutes=74;assert.equal(rule(evaluate(e),'minutes').status,'failed');
  e.daily=3;e.hours=13;e.duration=91;e.format='other';const r=evaluate(e);
  for(const k of ['hours','daily'])assert.equal(rule(r,k).status,'failed');
  for(const k of ['longList','duration','format'])assert.equal(rule(r,k).status,'pending');
  e.evidence.longList=e.evidence.duration=e.evidence.format='yes';assert.equal(rule(evaluate(e),'longList').status,'met');
});
test('Using a prefix, duplicate rounds, excess points and the 13-game cap',()=>{
  const e=event({rounds:14});e.games=Array.from({length:14},(_,i)=>game(i,{title:i<7?'GM':'FM'}));
  assert.equal(evaluate(e).credit,13);e.until=9;e.evidence.prefix='yes';assert.equal(evaluate(e).overall,'met');
  e.format='rr';assert.equal(rule(evaluate(e),'prefix').status,'failed');e.until='';e.games[1].round=1;assert.equal(rule(evaluate(e),'roundData').status,'pending');
  const nine=evaluate(event());assert.equal(nine.credit,13);
});
function cert(i,extra={}){return {...blankCert(),name:'Event '+i,date:'2025-02-11',games:9,rounds:9,level:'GM',category:i===0?'olympiad':'outside',normal:'yes',single:'no',short:'no',bye:'no',verified:'yes',...extra};}
test('Portfolio handles 27 games, category 1.5.6, ordinary mix, single-round days and interim proof',()=>{
  const b={peak:2500,peakKind:'published',certs:[cert(0),cert(1),cert(2)]};let r=portfolio(b,'GM');assert.equal(rule(r,'singleDays').status,'failed');
  b.certs[0].single='yes';assert.equal(portfolio(b,'GM').status,'met');b.peakKind='interim';assert.equal(rule(portfolio(b,'GM'),'peak').status,'pending');
  b.proof='yes';b.certs[0].category='outside';assert.equal(rule(portfolio(b,'GM'),'article156').status,'failed');
  b.certs.forEach(c=>c.date='2022-06-30');assert.equal(rule(portfolio(b,'GM'),'article156').status,'met');
  b.certs[0].date='2022-07-01';assert.equal(rule(portfolio(b,'GM'),'article156').status,'failed');
  b.certs.forEach(c=>c.normal='no');assert.equal(rule(portfolio(b,'IM'),'normalMix').status,'failed');
});
test('Portfolio rejects duplicate / expired / incompatible certificates, counts selected applications, permits four norms',()=>{
  const b={peak:2400,peakKind:'published',certs:[0,1,2,3].map(i=>cert(i,{rounds:7,games:7}))};assert.equal(portfolio(b,'IM').status,'met');
  b.certs[0].date='2005-06-30';assert.equal(rule(portfolio(b,'IM'),'legacy').status,'pending');b.certs[0].legacy='no';assert.equal(rule(portfolio(b,'IM'),'legacy').status,'failed');
  b.certs[1].short=b.certs[2].short='yes';b.certs[1].bye=b.certs[2].bye='yes';let r=portfolio(b,'IM');
  assert.equal(rule(r,'onePilot').status,'failed');assert.equal(rule(r,'oneBye').status,'failed');
  b.certs[1].use=false;assert.equal(portfolio(b,'IM').total,21);
  b.certs.push({...b.certs[0]});assert.equal(rule(portfolio(b,'IM'),'certificates').status,'failed');
  b.certs[0].rounds=16;b.certs[0].games=15;assert.equal(rule(portfolio(b,'IM'),'credits').status,'pending');
  b.certs[0].direct='yes';b.certs[0].games=7;assert.equal(rule(portfolio(b,'IM'),'credits').status,'pending');
});
