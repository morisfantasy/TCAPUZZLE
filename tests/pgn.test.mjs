import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStudy } from '../src/pgn.mjs';
import { writeChapter } from '../src/study.mjs';
import { Chess } from 'chess.js';

test('chapter metadata, pre-game notes, comments, NAGs, nested variations, exported study',()=>{
  const text='[Event "TCA"]\n[ChapterName "Centre"]\n[Date "2026.11.07"]\n\n{Introduction} 1. e4! {Centre [%cal Ge2e4] [%csl Rd5]} (1. d4 $2 d5 (1... Nf6)) e5 ;Reply\n 2. Nf3 *';
  const [ch]=parseStudy(text);
  assert.equal(ch.headers.Date,'2026.11.07');assert.equal(ch.nodes[0].comment,'Introduction');
  assert.deepEqual(ch.nodes[0].children.map(i=>ch.nodes[i].san),['e4','d4']);
  assert.deepEqual(ch.nodes[2].children.map(i=>ch.nodes[i].san),['d5','Nf6']);
  assert.deepEqual(ch.nodes[1].nags,['$1']);assert.equal(ch.nodes[1].comment,'Centre');
  assert.deepEqual(ch.nodes[1].marks.map(m=>m.to),['e4','d5']);
  assert.equal(ch.nodes.find(n=>n.san==='e5').comment,'Reply');
  assert.deepEqual(parseStudy(writeChapter(ch))[0],ch);
});
test('tagged and tagless games, BOM, LF, CRLF and bare CR',()=>{
  for(const nl of ['\n','\r\n','\r']){
    const text='\uFEFF[White "A"]\n\n1. e4 *\n\n[White "B"]\n\n1. d4 *';
    assert.deepEqual(parseStudy(text.replaceAll('\n',nl)).map(ch=>ch.nodes[1].san),['e4','d4']);
  }
  assert.equal(parseStudy('1. e4 *\n\n1. c4 *').length,2);
});
test('black-to-move custom FEN and a setup-only chapter',()=>{
  const fen='8/8/8/8/8/8/4K3/7k b - - 0 17';
  const [ch]=parseStudy('[FEN "'+fen+'"]\n[SetUp "1"]\n\n17... Kg1 *');
  assert.equal(ch.nodes[0].fen,fen);assert.equal(new Chess(ch.nodes[1].fen).get('g1').type,'k');
  assert.match(writeChapter(ch),/17\.\.\. Kg1/);
  assert.equal(parseStudy('[FEN "'+fen+'"]\n\n*')[0].nodes.length,1);
});
test('syntax errors, illegal SAN on any line, empty files, invalid FEN',()=>{
  for (const [pgn,code] of [['','emptyPgn'],['%%% bad\nnot a game','syntaxPgn'],['1. e4 (1. Bh6) *','illegalPgn'],['[SetUp "1"]\n\n*','invalidFen'],['[FEN "nonsense"]\n\n*','invalidFen']])
    assert.throws(()=>parseStudy(pgn),e=>e.code===code);
});
