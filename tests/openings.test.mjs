import test from 'node:test';
import assert from 'node:assert/strict';
import {compile,trace,preview,plan,grade,dashboard,moveResult,nextInLine,positionKey} from '../src/opening-core.mjs';
import {paymentConfig} from '../src/opening-payments.mjs';
const pgn='[ChapterName "White"]\n\n1. Nf3 (1. g3 d5 2. Nf3 Nf6 3. Bg2) d5 2. g3 Nf6 3. Bg2 {Develop [%cal Gf1g2]} (3. d4) *';
test('sources preserve branches, marks, free line boundary, promoted pieces and black-start FEN',()=>{
  const w=compile(pgn,'w'),b=compile(pgn,'b');assert.equal(w.stats.lines,3);
  const head=w.chapters[0].nodes[0];assert.equal(moveResult(w,{c:0,n:0},'g1f3').kind,'correct');assert.equal(moveResult(w,{c:0,n:0},'g2g3').kind,'correct');
  assert.equal(moveResult(w,{c:0,n:0},'e2e4').kind,'miss');assert.equal(moveResult(w,{c:0,n:0},'e2e5').kind,'illegal');
  assert.equal(head.children.length,2);assert.ok(w.chapters[0].nodes.some(n=>n.comment==='Develop'&&n.marks.length));
  const sample=preview(w,w.lines[0],2);assert.equal(sample.nodes.length,3);assert.ok(!JSON.stringify(sample).includes('children'));
  assert.ok(Object.values(b.cards).some(k=>k.refs.length>1));assert.throws(()=>compile('1. e4 e5 2. Bh6 *','b'),/illegalPgn/);
  const promotion=compile('[SetUp "1"]\n[FEN "4k3/8/8/8/8/3K4/p7/8 b - - 0 41"]\n\n41... a1=N *','b');
  assert.deepEqual(promotion.cards[promotion.order[0]].moves,['a2a1n']);assert.equal(moveResult(promotion,{c:0,n:0},'a2a1n').kind,'correct');
});
test('transpositions share equivalent cards, different chapter intentions remain contextual, unchanged identities survive edits',()=>{
  const a='[ChapterName "One"]\n\n1. Nf3 d5 2. g3 Nf6 3. Bg2 *';
  const b='[ChapterName "Two"]\n\n1. g3 d5 2. Nf3 Nf6 3. Bg2 *';const m=compile(a+'\n\n'+b,'w');
  const card=m.cards[m.chapters[0].nodes[4].card];assert.equal(card.refs.length,2);
  const v=compile(a+'\n\n'+b.replace('3. Bg2','3. d4'),'w');
  assert.equal(moveResult(v,{c:0,n:4},'d2d4').kind,'context');assert.equal(v.chapters[0].nodes[4].card,card.key);assert.notEqual(v.chapters[1].nodes[4].card,card.key);
  assert.notEqual(positionKey('8/8/8/8/8/8/8/8 w - - 0 1'),positionKey('8/8/8/8/8/8/8/8 b - - 0 1'));
});
test('due before new, bounded selection for one PGN line, deterministic recovery and persistent mature review intervals',()=>{
  const m=compile(pgn,'w'),now=Date.parse('2026-11-01T00:00:00Z');let state=null,previous=0;
  for(let i=0;i<8;i++){state=grade(state,true,now+i*86400000);assert.ok(state.interval>previous);previous=state.interval;}
  assert.equal(state.level,4);assert.equal(state.interval,90*1440);const failed=grade(state,false,now);assert.ok(failed.interval<=10);
  assert.deepEqual(grade(state,false,now),failed);assert.ok(grade(failed,false,now).interval<failed.interval);
  const prog={[m.order[1]]:{...state,due:new Date(now-1).toISOString()},[m.order[2]]:state};
  const q=plan(m,prog,{limit:3,newLimit:1},now);assert.equal(q[0].key,m.order[1]);assert.equal(q.length,2);
  assert.equal(dashboard(m,prog,now).due,1);assert.equal(dashboard(m,prog,now).mastered,2);
  const ref=m.lines.at(-1),only=plan(m,{},{limit:20,newLimit:20,line:ref},now);
  assert.ok(only.every(r=>r.c===ref.c&&trace(m.chapters[ref.c],ref.n).includes(r.n)));
  const session={queue:plan(m,{},{limit:3,newLimit:3},now).slice(1),seen:[m.order[0]]};
  nextInLine(m,session,{c:0,n:0},moveResult(m,{c:0,n:0},'g2g3'),{});
  const second=m.chapters[0].nodes[session.queue[0].n];assert.ok(second.fen.includes(' b ')===false);assert.match(second.fen,/5NP1|6P1/);
});
test('billing stays unavailable without signed webhook, matching key mode and explicit commercial switch',()=>{
  const env={STRIPE_SECRET_KEY:'sk_live_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',TCA_STRIPE_MODE:'live',TCA_OPENINGS_ORIGIN:'https://example.test'};
  assert.equal(paymentConfig(env).ready,false);assert.equal(paymentConfig({...env,TCA_OPENINGS_ALLOW_LIVE:'true'}).ready,true);
  assert.equal(paymentConfig({...env,TCA_STRIPE_MODE:'test'}).ready,false);assert.equal(paymentConfig({}).ready,false);
});
