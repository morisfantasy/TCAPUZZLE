import { parse } from '@mliebelt/pgn-parser';
import { Chess, DEFAULT_POSITION } from 'chess.js';
import { appendMove, makeChapter, prefix } from './study.mjs';

export class ImportError extends Error {
  constructor(code, detail = '') {
    super(detail || code);
    this.code = code;
    this.detail = detail;
  }
}

function notes(diagram, text) {
  const marks = [];
  for (const value of [...(diagram?.colorArrows || []), ...(diagram?.colorFields || [])]) {
    const match = /^([GRYB])([a-h][1-8])([a-h][1-8])?$/.exec(value);
    if (match) marks.push({ color: match[1], from: match[2], to: match[3] || match[2] });
  }
  const directives = Object.entries(diagram || {})
    .filter(([key]) => !['comment', 'colorArrows', 'colorFields'].includes(key))
    .map(([key, value]) => '[%' + key + ' ' + (value?.value ?? value) + ']').join(' ');
  return { comment: text || diagram?.comment || '', marks, directives };
}

export function parseStudy(input) {
  const text = String(input || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').replace(/^%[^\n]*(?:\n|$)/gm, '').trim();
  if (!text) throw new ImportError('emptyPgn');
  let games;
  try { games = parse(text, { startRule: 'games' }); }
  catch (err) {
    const where = err.location?.start;
    if (where) throw new ImportError('syntaxPgn', where.line + ' · ' + where.column);
    throw new ImportError('complexPgn');
  }
  if (!games.length) throw new ImportError('emptyPgn');
  let count = 0;
  return games.map(({ tags, moves, gameComment }, index) => {
    const headers = Object.fromEntries(Object.entries(tags || {})
      .filter(([key]) => key !== 'messages')
      .map(([key, value]) => [key, String(value?.value ?? value)]));
    if (!moves.length && !headers.FEN && !Object.keys(headers).some(key => key !== 'Result')) {
      throw new ImportError('emptyPgn');
    }
    const fen = headers.FEN || DEFAULT_POSITION;
    let start;
    try {
      if (headers.SetUp === '1' && !headers.FEN) throw new Error();
      start = new Chess(fen);
    } catch { throw new ImportError('invalidFen', String(index + 1)); }
    const chapter = makeChapter(start.fen(), headers);
    Object.assign(chapter.nodes[0], notes(gameComment));
    function addLine(plies, parent, depth) {
      if (depth > 100) throw new ImportError('complexPgn');
      const game = new Chess(chapter.nodes[parent].fen);
      for (const step of plies) {
        if (++count > 15000) throw new ImportError('complexPgn');
        const token = step.notation.notation;
        let move;
        try { move = game.move(token.replace(/^0-0(-0)?/, s => s.replace(/0/g, 'O')), { strict: true }); }
        catch { throw new ImportError('illegalPgn', (index + 1) + ' · ' + prefix(game.fen()) + ' ' + token); }
        const next = appendMove(chapter, parent, move, {
          before: step.commentMove || '', nags: step.nag || [], ...notes(step.commentDiag, step.commentAfter)
        });
        for (const variation of step.variations) addLine(variation, parent, depth + 1);
        parent = next;
      }
    }
    addLine(moves, 0, 0);
    return chapter;
  });
}
