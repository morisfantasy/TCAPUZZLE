// FIDE Handbook B.01 §§1.1, 1.4–1.7, Annex, and the 2026 Council time-control decision.
import { performanceDifference } from './rating.mjs';
import { federations } from './federations.mjs';

export const limits = {
  GM:{ rp:2600, ra:2380, floor:2200, peak:2500 },
  IM:{ rp:2450, ra:2230, floor:2050, peak:2400 }
};
export const titleCodes = ['GM','IM','WGM','WIM','FM','WFM','CM','WCM','none'];
export const certificateEvents = ['swiss40','olympiad','candidates','cupQualifier','eve','nationalFinal'];
export const commonEvidence = ['registration','laws','equalConditions','clocks','arbiters','ratingList'];
export const blankGame = round => ({round,status:'future',rating:'',title:'',fed:'',score:null,id:'',rrPoints:''});
export const blankEvent = () => ({target:'IM',rounds:9,format:'swiss',event:'regular',fed:'',host:'',duration:'',minutes:'',daily:'',hours:'',pilot:'',exemption:'',until:'',evidence:{},games:[blankGame(1)]});
const scoreOK = s => [0,.5,1].includes(s);
const rated = g => g.rating==='UR'?1400:(/^\d+$/.test(String(g.rating)) && Number.isSafeInteger(+g.rating) && +g.rating>=1400 ? +g.rating:null);
const fed = code => federations.has(code)?code:null;
const integer = (x,min=1,max=Infinity) => x!=='' && x!=null && Number.isInteger(+x) && +x>=min && +x<=max;
const tri = v => v==='yes'?'met':v==='no'?'failed':'pending';
const validFormat = ['swiss','rr','drr','ko'];
const dead = s => s==='failed' || s==='impossible';
const check = (key,status,value='',target='',group='sport') => ({key,status,value,target,group});
const sign = (ok,open) => ok?'met':open?'impossible':'failed';
const titleHolder = g => titleCodes.slice(0,6).includes(g.title);
const isElite = (g,target) => g.title==='GM' || (target==='IM' && g.title==='IM');
const count = (xs,p) => xs.filter(p).length;
function threshold(known,unknownPast,unknownFuture,goal) {
  if (known>=goal) return 'met';
  if (known+unknownPast+unknownFuture<goal) return unknownFuture?'impossible':'failed';
  return unknownPast?'pending':'reachable';
}
export function dp(score,games) {
  if (!games || !Number.isInteger(2*score) || score<0 || score>games) return null;
  return performanceDifference(Math.floor((200*score+games)/(2*games)));
}
export function averages(games,target) {
  if (!games.length || games.some(g=>rated(g)===null)) return null;
  const values=games.map(rated), low=Math.min(...values), floor=limits[target].floor;
  const lowest=games[values.indexOf(low)], raw=values.reduce((a,b)=>a+b,0);
  // One person can appear twice in a DRR. Only that opponent can be adjusted.
  const bonus=games.reduce((sum,g,i)=>sum+((g===lowest || (lowest.id && g.id===lowest.id))?Math.max(0,floor-values[i]):0),0);
  return {real:Math.round(raw/games.length),adjusted:Math.round((raw+bonus)/games.length),sum:raw+bonus,raised:bonus?lowest.round:null};
}
export function minimumScore(n,average,target) {
  if(!n || average<limits[target].ra)return null;
  for(let halves=Math.ceil(7*n/10);halves<=2*n;halves++) if(average+dp(halves/2,n)>=limits[target].rp)return halves/2;
  return null;
}
function combinations(required,n) {
  const out=[];
  for(let w=0;w<=n;w++) {
    const d=2*(required-w), l=n-w-d;
    if(d>=0 && l>=0)out.push({w,d,l});
  }
  return out;
}
function simulation(all,played,future,score,target,average) {
  const n=all.length, left=future.length;
  const out={left,required:null,combinations:[],scenarios:[],unknown:count(all,g=>rated(g)===null),impossible:false};
  if(!left || !n || score===null)return out;
  if(average) {
    const total=minimumScore(n,average.adjusted,target);
    if(total===null || total>score+left){out.impossible=true;return out;}
    out.required=Math.max(0,total-score);out.combinations=combinations(out.required,left);
  } else if(!played.some(g=>rated(g)===null)) {
    const ratingByMean=new Map();
    function opponentRating(mean) {
      if(ratingByMean.has(mean))return ratingByMean.get(mean);
      let lo=1400,hi=n*mean;
      while(lo<hi) {
        const mid=Math.floor((lo+hi)/2);
        const simulated=all.map(g=>rated(g)===null?{...g,rating:mid}:g);
        if(averages(simulated,target).adjusted>=mean)hi=mid;else lo=mid+1;
      }
      ratingByMean.set(mean,lo);return lo;
    }
    // Each scenario states the required mean for the ENTIRE field after the one permitted adjustment.
    for(let h=0;h<=2*left;h++) {
      const total=score+h/2;
      if(total*100<35*n)continue;
      const ra=Math.max(limits[target].ra,limits[target].rp-dp(total,n));
      out.scenarios.push({points:h/2,ra,opponent:opponentRating(ra)});
    }
    if(!out.scenarios.length)out.impossible=true;
  }
  return out;
}
function opponentPool(all,e,checks) {
  if(e.format!=='drr')return {people:all,base:all.length};
  const groups=new Map(), slots=[], scheduledOpponents=Number(e.players)-1;
  for(const g of all) {
    if(!g.id){slots.push(g);continue;}
    if(!groups.has(g.id))groups.set(g.id,[]);
    groups.get(g.id).push(g);
  }
  const regular=integer(e.players,6) && (+e.rounds===scheduledOpponents*2 || +e.rounds===scheduledOpponents*2+2 && +e.players%2===1);
  // Odd fields may schedule a resting round in each cycle.
  const known=Array.from(groups.values()), missing=slots.length>0;
  const invalid=known.some(gs=>gs.length>2) || (integer(e.players) && known.length>scheduledOpponents);
  checks.push(check('drrSize',!integer(e.players)?'pending':regular?'met':'failed',e.players||'','≥ 6','event'));
  checks.push(check('identity',invalid?'failed':missing?'pending':'met','','','mix'));
  const people=known.map(gs=>({...gs[0],title:gs.find(g=>g.title)?.title||'',fed:gs.find(g=>g.fed)?.fed||'',future:gs.every(g=>g.future)}));
  // Unidentified games cannot count as different titled/federated players until linked.
  const base=integer(e.players,2)?scheduledOpponents:Math.max(people.length,Math.ceil(all.length/2));
  const unassigned=Math.max(0,base-people.length);
  for(let i=0;i<unassigned;i++) people.push({future:slots.some(g=>g.future)});
  return {people,base};
}
function exemption(e) {
  if(e.event==='zonal')return 'met';
  if(['nationalFinal','nationalTeam'].includes(e.event)) {
    if(!fed(e.fed)||!fed(e.host))return 'pending';
    if(e.fed!==e.host)return 'failed';
    return tri(e.evidence.national);
  }
  if(e.format==='swiss' && e.exemption==='swiss20')return tri(e.evidence.swiss20);
  return 'failed';
}
function mix(all,e,checks,short) {
  const {people,base}=opponentPool(all,e,checks), open=all.some(g=>g.future);
  const neededT=Math.ceil(base/2), neededE=e.format==='drr'?Math.ceil(base/2):Math.max(3,Math.ceil(base/3));
  const held=count(people,titleHolder), elite=count(people,g=>isElite(g,e.target));
  const unknown=people.filter(g=>!titleCodes.includes(g.title));
  for(const [key,known,goal] of [['titleHolders',held,neededT],['elite',elite,neededE]]) {
    let s=threshold(known,count(unknown,g=>!g.future),count(unknown,g=>g.future),goal);
    if(s==='failed' && open)s='impossible';
    checks.push(check(key,s,known,goal,'mix'));
  }
  const codes=people.map(g=>fed(g.fed)), missing=codes.filter(c=>!c).length, own=fed(e.fed);
  const tally=new Map();
  for(const code of codes.filter(Boolean))tally.set(code,(tally.get(code)||0)+1);
  const foreign=Array.from(tally.keys()).filter(c=>c!==own && c!=='FID').length;
  const maximum=Math.max(0,...tally.values()), ownCount=tally.get(own)||0;
  const maxOwn=Math.floor(3*base/5), maxOne=Math.floor(2*base/3);
  const cap=(value,limit)=>value>limit?sign(false,open):value+missing<=limit?'met':open?'reachable':'pending';
  const exempt=exemption(e), annex=short && base>=7 && base<=8;
  function add(key,normal,value,goal) {
    // In its 7/8-game tables the Annex marks federation limits irrelevant.
    // B.01 gives priority to the articles and 1.4.1c requires the correct mix.
    let status=normal;
    if(normal!=='met') {
      if(exempt==='met')status='met';
      else if(annex && e.evidence.shortMix==='yes')status='met';
      else if(exempt==='pending' || (annex && !e.evidence.shortMix))status='pending';
    }
    const item=check(key,status,value,goal,'feds');
    if(normal!=='met' && status==='met')item.waiver=exempt==='met'?'§1.4.3':'§1.4.1 / Annex';
    checks.push(item);
    return normal;
  }
  const foreignState=!own?'pending':threshold(foreign,count(people,g=>!fed(g.fed)&&!g.future),count(people,g=>!fed(g.fed)&&g.future),2);
  const normal=[add('foreign',foreignState==='failed'&&open?'impossible':foreignState,own?foreign:'',2),
    add('ownCap',own?cap(ownCount,maxOwn):'pending',own?ownCount:'','≤ '+maxOwn),
    add('oneCap',cap(maximum,maxOne),maximum,'≤ '+maxOne)];
  return {normal:normal.every(s=>s==='met'),exempt:exempt==='met',neededT:Math.max(0,neededT-held),neededE:Math.max(0,neededE-elite),
    neededF:own?Math.max(0,2-foreign):null,maxOwn,ownRoom:Math.max(0,maxOwn-ownCount),fullFeds:[...tally].filter(([code,v])=>v>=maxOne || (code===own && v>=maxOwn)).map(([code])=>code)};
}
function conditions(e,checks) {
  const add=(key,s,value='',target='')=>checks.push(check(key,s,value,target,'event'));
  for(const key of commonEvidence)add(key,tri(e.evidence[key]));
  add('format',validFormat.includes(e.format)?'met':e.format==='other'||e.format==='special'?tri(e.evidence.format):'pending');
  const number=(value,ok)=>value===''||value==null||!Number.isFinite(+value)?'pending':ok?'met':'failed';
  add('daily',number(e.daily,integer(e.daily,1,2)),e.daily,'≤ 2');
  add('hours',number(e.hours,+e.hours>0 && +e.hours<=12),e.hours,'≤ 12');
  let clock=number(e.minutes,+e.minutes>=120);
  if(clock==='failed' && +e.minutes>=75 && e.pilot==='yes')clock=tri(e.evidence.pilot);
  add('minutes',clock,e.minutes,e.pilot==='yes'?'2026 QC':'≥ 120');
  add('duration',!integer(e.duration)?'pending':+e.duration>90?tri(e.evidence.duration):'met',e.duration);
  if(+e.duration>30)add('longList',tri(e.evidence.longList));
}
export function evaluate(e) {
  const checks=[], rule=limits[e.target];
  const rounds=integer(e.rounds,1,200)?Number(e.rounds):0, end=e.until?Number(e.until):rounds;
  const byRound=new Map(), rr=['rr','drr'].includes(e.format);
  let inputOK=!!rounds && integer(end,1,rounds);
  for(const g of e.games) {
    if(!integer(g.round,1,rounds)||byRound.has(+g.round))inputOK=false;
    else byRound.set(+g.round,g);
  }
  checks.push(check('roundData',inputOK?'met':'pending','','','event'));
  if(end<rounds)checks.push(check('prefix',rr?'failed':tri(e.evidence.prefix),'','','event'));
  const rows=Array.from({length:Math.max(0,Math.min(rounds,end||0))},(_,i)=>byRound.get(i+1)||blankGame(i+1));
  let removedWin=false, eligibility='met', finalDefault=false;
  const all=[];
  for(const g of rows) {
    if(g.status==='omitWin'){removedWin=true;continue;}
    if(g.status==='lastDefault'){
      if(+g.round!==rounds || finalDefault)eligibility='failed';
      finalDefault=true;all.push({...g,score:0,future:false});continue;
    }
    if(!['played','future'].includes(g.status) || g.fed==='NON')continue;
    if(rr && g.rating==='UR'){
      if(g.rrPoints==='no')continue;
      if(g.rrPoints!=='yes')eligibility='pending';
    }
    all.push({...g,future:g.status==='future'});
  }
  const played=all.filter(g=>!g.future), future=all.filter(g=>g.future), n=all.length, open=!!future.length;
  const specialTeam=e.event==='worldTeam' && rounds>=7 && rounds<=9, cup=e.event==='worldCup';
  const bye8=!specialTeam && !cup && rounds===9 && n===8 && rows.filter(g=>['allocatedBye','forfeitWin'].includes(g.status)).length===1;
  const min=specialTeam?7:cup||bye8?8:9;
  if(finalDefault){
    if(n!==min)eligibility='failed';
    else if(eligibility!=='failed' && tri(e.evidence.lastDefault)!=='met')eligibility=tri(e.evidence.lastDefault);
  }
  if(removedWin)checks.push(check('omitWin',tri(e.evidence.omitWin),'','','event'));
  checks.push(check('ownFed',fed(e.fed)?'met':'pending',e.fed,'','feds'));
  const missingFed=played.some(g=>!fed(g.fed));
  checks.push(check('eligible',eligibility==='met' && missingFed?'pending':eligibility,'','','sport'));
  checks.push(check('games',n<min?sign(false,open):played.length>=min?'met':'reachable',played.length,min));
  const opposition=mix(all,e,checks,specialTeam||cup||bye8);
  const score=played.every(g=>scoreOK(g.score))?played.reduce((s,g)=>s+g.score,0):null;
  const knownIDs=e.format!=='drr'||all.every(g=>g.id);
  const current=averages(played,e.target), average=averages(all,e.target);
  const calc=simulation(all,played,future,score,e.target,average);
  if(!inputOK || eligibility!=='met' || (!knownIDs && all.some(g=>rated(g)!==null && rated(g)<rule.floor))) {
    calc.required=null;calc.combinations=[];calc.scenarios=[];calc.impossible=false;calc.unverified=true;
  }
  const rp=current && played.length && score!==null?current.adjusted+dp(score,played.length):null;
  const reqScore=Math.ceil(7*n/10)/2;
  checks.push(check('minScore',!n?'failed':score===null?'pending':score>=reqScore?'met':score+future.length>=reqScore?'reachable':sign(false,open),score,reqScore));
  let raStatus=average?sign(average.adjusted>=rule.ra,open):open && !played.some(g=>rated(g)===null)?'reachable':'pending';
  let rpStatus='pending';
  if(score!==null && average && n)rpStatus=score+future.length<reqScore || average.adjusted+dp(score+future.length,n)<rule.rp?sign(false,open):open?'reachable':'met';
  else if(open && score!==null && !played.some(g=>rated(g)===null))rpStatus=calc.impossible?'impossible':'reachable';
  if(!knownIDs && all.some(g=>rated(g)!==null && rated(g)<rule.floor)){raStatus='pending';rpStatus='pending';}
  checks.push(check('average',raStatus,average?.adjusted??'',rule.ra),check('performance',rpStatus,open?'':rp,rule.rp));
  conditions(e,checks);
  const sporting=checks.filter(c=>c.group!=='event');
  const verdict=items=>items.some(c=>dead(c.status))?(open?'impossible':'failed'):items.some(c=>c.status==='pending')?'pending':items.some(c=>c.status==='reachable')?'reachable':'met';
  const sport=verdict(sporting), overall=verdict(checks);
  const required=average?minimumScore(n,average.adjusted,e.target):null;
  const rawCredit=(bye8||cup && n===8?9:n)+(required===null||score===null?0:Math.max(0,Math.floor(score-required)));
  return {checks,score,rp,current,average,played:played.length,n,rounds,open,min,bye8,opposition,simulation:calc,sport,overall,
    credit:!open && overall==='met' && required!==null?(rounds>13?Math.min(13,rawCredit):rawCredit):null};
}

export const blankCert=()=>({name:'',date:'',games:'',rounds:'',level:'',category:'',normal:'',single:'',short:'',bye:'',verified:'',legacy:'',use:true});
export function portfolio(book,target) {
  const certs=book.certs.filter(c=>c.use!==false), checks=[];
  const add=(key,status,value='',goal='')=>checks.push(check(key,status,value,goal));
  const any=(key,applicable=true)=>!applicable?'met':certs.some(c=>c[key]==='yes')?'met':certs.some(c=>!c[key])?'pending':'failed';
  const atMostOne=key=>count(certs,c=>c[key]==='yes')>1?'failed':count(certs,c=>c[key]!=='no')<=1?'met':'pending';
  const dates=certs.map(c=>{
    const parsed=Date.parse(c.date);
    return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0,10)===c.date?c.date:null;
  });
  const checked=certs.every(c=>c.verified==='yes'), annual=certs.some(c=>c.verified==='no');
  let total=0, creditsKnown=true, invalidCredit=false;
  for(const c of certs) {
    const maxCredit=+c.rounds>13?13:+c.rounds+Math.floor(.65*(+c.rounds));
    if(!integer(c.games) || !integer(c.rounds)){creditsKnown=false;continue;}
    if(c.direct==='yes'?+c.games!==9:+c.games>maxCredit){invalidCredit=true;creditsKnown=false;continue;}
    total+=Number(c.games);
  }
  add('creditRules',invalidCredit?'failed':creditsKnown && certs.length?'met':'pending');
  add('credits',creditsKnown?(total>=27?'met':'failed'):'pending',total,27);
  const identifiers=certs.map(c=>String(c.name||'').trim().toLowerCase()+'|'+(c.date||''));
  add('certificates',annual || new Set(identifiers.filter(x=>x!=='|')).size<identifiers.filter(x=>x!=='|').length?'failed':
    certs.length && checked && dates.every(Boolean) && certs.every(c=>c.name.trim())?'met':'pending',certs.length);
  add('certLevel',certs.some(c=>c.level && c.level!=='GM' && c.level!==target)?'failed':certs.length && certs.every(c=>c.level)?'met':'pending');
  const peak=+book.peak, reached=integer(book.peak,1)&&peak>=limits[target].peak;
  add('peak',!integer(book.peak)?'pending':!reached?'failed':book.peakKind==='published'?'met':book.peakKind==='interim'?tri(book.proof):'pending',book.peak,limits[target].peak);
  const modern=dates.some(d=>d && d>'2022-06-30'), qualifies=certs.some(c=>certificateEvents.includes(c.category));
  add('article156',qualifies?'met':!modern && dates.every(Boolean) && certs.length?'met':modern && certs.every(c=>c.category)?'failed':'pending');
  add('normalMix',any('normal'));
  if(target==='GM')add('singleDays',any('single'));
  add('oneBye',atMostOne('bye'));add('onePilot',atMostOne('short'));
  const old=certs.filter((c,i)=>dates[i] && dates[i]<'2005-07-01');
  add('legacy',old.some(c=>c.legacy==='no')?'failed':old.some(c=>c.legacy!=='yes') || dates.some(d=>!d)?'pending':'met');
  return {total,count:certs.length,checks,status:checks.some(c=>dead(c.status))?'failed':checks.some(c=>c.status!=='met')?'pending':'met'};
}
