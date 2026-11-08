import {createHash} from 'node:crypto';
import {Chess} from 'chess.js';
import {parseStudy} from './pgn.mjs';

export const problem=(status,message)=>Object.assign(new Error(message),{status});
const digest=s=>createHash('sha256').update(s).digest('hex');
export const positionKey=fen=>fen.split(' ').slice(0,4).join(' ');
export const uci=node=>node.from+node.to+(node.san.match(/=([QRBN])/)?.[1].toLowerCase()||'');
export function trace(ch,id) {
  const ids=[];for(let at=id;at!=null;at=ch.nodes[at].parent)ids.push(at);
  return ids.reverse();
}
export function compile(pgn,side) {
  if(!['w','b'].includes(side))throw problem(400,'Choose a training side.');
  if(typeof pgn!=='string'||!pgn.trim()||Buffer.byteLength(pgn)>1048576)throw problem(400,'Upload a PGN of up to 1 MB.');
  let chapters;try{chapters=parseStudy(pgn);}catch(e){throw problem(422,[e.code||'invalidPgn',e.detail].filter(Boolean).join(' · '));}
  const cards={},positions={},order=[],lines=[];let plies=0;
  for(const [c,ch] of chapters.entries()){
    ch.name=ch.headers.ChapterName||ch.headers.Chapter||ch.headers.Event||'Chapter '+(c+1);
    const stack=[0];while(stack.length){
      const n=stack.pop(),node=ch.nodes[n];
      if(!node.children.length){if(n)lines.push({c,n});continue;}
      if(node.fen.split(' ')[1]===side){
        const pos=positionKey(node.fen),moves=[...new Set(node.children.map(i=>uci(ch.nodes[i])))].sort();
        const key=digest(pos+'|'+moves.join(','));
        if(!cards[key]){cards[key]={key,moves,refs:[]};order.push(key);}
        cards[key].refs.push({c,n});node.card=key;
        const all=positions[pos]??=[];for(const move of moves)if(!all.includes(move))all.push(move);
      }
      for(let i=node.children.length-1;i>=0;i--)stack.push(node.children[i]);
    }
    plies+=ch.nodes.length-1;
  }
  if(!order.length)throw problem(422,'There are no moves to train for this side.');
  return {side,chapters,cards,order,positions,lines,stats:{chapters:chapters.length,lines:lines.length,positions:order.length,plies}};
}
export const fingerprint=(pgn,side)=>digest(side+'\n'+pgn.replace(/\r\n?/g,'\n').trim());
export function lineCatalogue(model) {
  return model.chapters.map((ch,c)=>({name:ch.name,lines:model.lines.filter(l=>l.c===c).map(({n},i)=>{
    const path=trace(ch,n),tail=path.slice(-5).filter(id=>id>0).map(id=>ch.nodes[id].san);
    return {n,label:(i+1)+' · '+tail.join(' '),plies:path.length-1};
  })}));
}
export function preview(model,ref,depth) {
  if(!Number.isInteger(depth)||depth<1||depth>20)throw problem(400,'Preview length must be 1–20 half-moves.');
  const line=model.lines.find(l=>l.c===ref?.c&&l.n===ref?.n);
  if(!line)throw problem(400,'Select a valid preview line.');
  const ch=model.chapters[line.c],path=trace(ch,line.n).slice(0,depth+1);
  return {name:ch.name,side:model.side,nodes:path.map(id=>{
    const {fen,san,from,to,marks,comment,before,nags}=ch.nodes[id];return {fen,san,from,to,marks,comment,before,nags};
  })};
}
export const initial=()=>({hits:0,misses:0,streak:0,level:0,history:[],interval:0,last:null,due:null});
export function grade(previous,correct,now) {
  const state={...initial(),...previous},last=new Date(now).toISOString();
  const history=[...state.history,{ok:correct,at:last}].slice(-12);
  const streak=correct?Math.min(100,state.streak+1):0;
  const level=correct?(streak>=6?4:streak>=4?3:streak>=2?2:1):1;
  const errors=history.slice(-5).filter(h=>!h.ok).length;
  const target=[0,60,1440,4320,10080,20160,43200,86400,129600][Math.min(8,streak)];
  const interval=correct?Math.max(30,Math.round(target*(1-.12*errors))):Math.max(2,12-2*errors);
  return {hits:state.hits+Number(correct),misses:state.misses+Number(!correct),streak,level,history,interval,last,
    due:new Date(+new Date(now)+interval*60000).toISOString()};
}
function cardRef(model,key) {return {key,...model.cards[key].refs[0]};}
export function plan(model,progress,{limit=12,newLimit=8,line=null}={},now=Date.now()) {
  if(!Number.isInteger(limit)||limit<1||limit>40||!Number.isInteger(newLimit)||newLimit<0||newLimit>limit)throw problem(400,'Invalid session limits.');
  let keys=model.order,refs;
  if(line){
    if(!model.lines.some(r=>r.c===line.c&&r.n===line.n))throw problem(400,'Unknown training line.');
    refs=new Map();const ch=model.chapters[line.c];for(const n of trace(ch,line.n)){const k=ch.nodes[n].card;if(k&&!refs.has(k))refs.set(k,{key:k,c:line.c,n});}
    keys=[...refs.keys()];
  }
  const overdue=keys.filter(k=>progress[k]&&Date.parse(progress[k].due)<=now).sort((a,b)=>Date.parse(progress[a].due)-Date.parse(progress[b].due));
  const fresh=keys.filter(k=>!progress[k]).slice(0,newLimit);
  return [...overdue,...fresh].slice(0,limit).map(k=>({... (refs?.get(k)||cardRef(model,k)),fresh:!progress[k]}));
}
export function dashboard(model,progress,now=Date.now()){
  const states=model.order.map(k=>progress[k]).filter(Boolean),upcoming=states.map(p=>p.due).sort(),learned=states.filter(p=>p.level>=2).length;
  const recent=states.flatMap(p=>p.history).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,30);
  const levels=[model.order.length-states.length,0,0,0,0];for(const s of states)levels[s.level]++;
  return {total:model.order.length,levels,learned,percent:Math.round(100*learned/model.order.length),new:model.order.length-states.length,
    due:states.filter(p=>Date.parse(p.due)<=now).length,mastered:states.filter(p=>p.level>=3).length,
    accuracy:recent.length?Math.round(recent.filter(h=>h.ok).length*100/recent.length):null,next:upcoming[0]||null};
}
export function moveResult(model,ref,move) {
  const ch=model.chapters[ref.c],node=ch.nodes[ref.n];
  if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move||''))return {kind:'illegal'};
  let played;try{played=new Chess(node.fen).move({from:move.slice(0,2),to:move.slice(2,4),promotion:move[4]});}catch{return {kind:'illegal'};}
  const matches=node.children.filter(id=>uci(ch.nodes[id])===move);
  if(!matches.length && model.positions[positionKey(node.fen)].includes(move))return {kind:'context'};
  const correct=!!matches.length,child=ch.nodes[matches[0]??node.children[0]];
  return {kind:correct?'correct':'miss',san:played.san,from:child.from,to:child.to,after:child.fen,answer:child.san,
    alternatives:node.children.map(i=>ch.nodes[i].san),child:matches[0]??node.children[0]};
}
export function nextInLine(model,session,ref,result,progress){
  const ch=model.chapters[ref.c],reply=ch.nodes[result.child];
  const choices=reply.children.map(n=>({key:ch.nodes[n].card,c:ref.c,n})).filter(r=>r.key);
  // Preserve overdue priority. Within new material continue the actual chosen PGN branch.
  const next=session.queue[0];if(!next || !next.fresh || next.retry)return;
  const known=choices.find(o=>o.key===next.key);
  if(known){if(!session.line||known.c===next.c&&known.n===next.n)Object.assign(next,known);return;}
  if(session.line)return;
  const chosen=choices.find(o=>!progress[o.key]&&!session.seen.includes(o.key));
  if(!chosen)return;
  const existing=session.queue.findIndex(o=>o.key===chosen.key);
  if(existing>=0){const entry=session.queue.splice(existing,1)[0];session.queue.unshift({...entry,...chosen});}
  else session.queue[0]={...chosen,fresh:true};
}
export function prompt(model,ref){
  if(!ref)return null;
  const ch=model.chapters[ref.c],node=ch.nodes[ref.n],parent=ch.nodes[node.parent];
  return {fen:node.fen,chapter:ch.name,side:model.side,trail:trace(ch,ref.n).slice(1).slice(-8).map(i=>ch.nodes[i].san).join(' '),
    incoming:parent?{fen:parent.fen,from:node.from,to:node.to,san:node.san}:null,retry:!!ref.retry};
}
