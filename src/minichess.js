/* MiniChess — compact legal move generator with SAN, for The Chess Academy tactics trainer */
(function (root) {
  const FILES = 'abcdefgh';
  const sqName = i => FILES[i & 7] + ((i >> 3) + 1);
  const sqIdx = s => (s.charCodeAt(1) - 49) * 8 + (s.charCodeAt(0) - 97);
  const isW = p => p && p === p.toUpperCase();
  const colorOf = p => (p ? (isW(p) ? 'w' : 'b') : null);
  const KN = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]];
  const KG = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const step = (i, df, dr) => {
    const f = (i & 7) + df, r = (i >> 3) + dr;
    return f < 0 || f > 7 || r < 0 || r > 7 ? -1 : r * 8 + f;
  };

  class Game {
    constructor(fen) { this.load(fen); }
    load(fen) {
      const [pos, turn, cast, ep] = fen.trim().split(/\s+/);
      this.b = new Array(64).fill(null);
      const rows = pos.split('/');
      for (let r = 0; r < 8; r++) {
        let f = 0;
        for (const ch of rows[7 - r]) {
          if (/\d/.test(ch)) f += +ch; else { this.b[r * 8 + f] = ch; f++; }
        }
      }
      this.turn = turn || 'w';
      this.castle = cast && cast !== '-' ? cast : '';
      this.ep = ep && ep !== '-' ? sqIdx(ep) : -1;
      this.hist = [];
    }
    fen() {
      let rows = [];
      for (let r = 7; r >= 0; r--) {
        let s = '', e = 0;
        for (let f = 0; f < 8; f++) {
          const p = this.b[r * 8 + f];
          if (!p) e++; else { if (e) { s += e; e = 0; } s += p; }
        }
        if (e) s += e;
        rows.push(s);
      }
      return rows.join('/') + ' ' + this.turn + ' ' + (this.castle || '-') + ' ' + (this.ep >= 0 ? sqName(this.ep) : '-') + ' 0 1';
    }
    attacked(sq, by) { // is square attacked by color `by`
      const b = this.b, up = by === 'w';
      // pawns
      const pr = up ? -1 : 1, pc = up ? 'P' : 'p';
      for (const df of [-1, 1]) { const s = step(sq, df, pr); if (s >= 0 && b[s] === pc) return true; }
      const N = up ? 'N' : 'n', K = up ? 'K' : 'k', B = up ? 'B' : 'b', R = up ? 'R' : 'r', Q = up ? 'Q' : 'q';
      for (const [df, dr] of KN) { const s = step(sq, df, dr); if (s >= 0 && b[s] === N) return true; }
      for (const [df, dr] of KG) { const s = step(sq, df, dr); if (s >= 0 && b[s] === K) return true; }
      for (const [df, dr] of DIAG) {
        let s = sq;
        while ((s = step(s, df, dr)) >= 0) { if (b[s]) { if (b[s] === B || b[s] === Q) return true; break; } }
      }
      for (const [df, dr] of ORTH) {
        let s = sq;
        while ((s = step(s, df, dr)) >= 0) { if (b[s]) { if (b[s] === R || b[s] === Q) return true; break; } }
      }
      return false;
    }
    kingSq(c) { const k = c === 'w' ? 'K' : 'k'; return this.b.indexOf(k); }
    inCheck(c = this.turn) { const k = this.kingSq(c); return k >= 0 && this.attacked(k, c === 'w' ? 'b' : 'w'); }
    pseudo() {
      const b = this.b, c = this.turn, them = c === 'w' ? 'b' : 'w', mv = [];
      const add = (from, to, extra = {}) => mv.push(Object.assign({ from, to, piece: b[from], captured: b[to] }, extra));
      for (let i = 0; i < 64; i++) {
        const p = b[i];
        if (!p || colorOf(p) !== c) continue;
        const t = p.toLowerCase();
        if (t === 'p') {
          const dir = c === 'w' ? 1 : -1, startR = c === 'w' ? 1 : 6, lastR = c === 'w' ? 7 : 0;
          const pushPromo = (from, to, cap) => {
            if ((to >> 3) === lastR) for (const pr of ['q', 'r', 'b', 'n']) add(from, to, { promo: pr, ...(cap || {}) });
            else add(from, to, cap || {});
          };
          const one = step(i, 0, dir);
          if (one >= 0 && !b[one]) {
            pushPromo(i, one);
            const two = step(i, 0, 2 * dir);
            if ((i >> 3) === startR && !b[two]) add(i, two, { double: true });
          }
          for (const df of [-1, 1]) {
            const s = step(i, df, dir);
            if (s < 0) continue;
            if (b[s] && colorOf(b[s]) === them) pushPromo(i, s);
            else if (s === this.ep) add(i, s, { enpassant: true, captured: c === 'w' ? 'p' : 'P' });
          }
        } else if (t === 'n' || t === 'k') {
          for (const [df, dr] of t === 'n' ? KN : KG) {
            const s = step(i, df, dr);
            if (s >= 0 && colorOf(b[s]) !== c) add(i, s);
          }
          if (t === 'k') {
            const home = c === 'w' ? 4 : 60;
            if (i === home && !this.attacked(home, them)) {
              const ks = c === 'w' ? 'K' : 'k', qs = c === 'w' ? 'Q' : 'q';
              if (this.castle.includes(ks) && !b[home + 1] && !b[home + 2] && b[home + 3] === (c === 'w' ? 'R' : 'r') &&
                !this.attacked(home + 1, them) && !this.attacked(home + 2, them)) add(i, home + 2, { castle: 'K' });
              if (this.castle.includes(qs) && !b[home - 1] && !b[home - 2] && !b[home - 3] && b[home - 4] === (c === 'w' ? 'R' : 'r') &&
                !this.attacked(home - 1, them) && !this.attacked(home - 2, them)) add(i, home - 2, { castle: 'Q' });
            }
          }
        } else {
          const dirs = t === 'b' ? DIAG : t === 'r' ? ORTH : DIAG.concat(ORTH);
          for (const [df, dr] of dirs) {
            let s = i;
            while ((s = step(s, df, dr)) >= 0) {
              if (!b[s]) add(i, s);
              else { if (colorOf(b[s]) === them) add(i, s); break; }
            }
          }
        }
      }
      return mv;
    }
    _make(m) {
      const b = this.b, c = this.turn;
      this.hist.push({ m, castle: this.castle, ep: this.ep, b: b.slice() });
      b[m.to] = m.promo ? (c === 'w' ? m.promo.toUpperCase() : m.promo) : b[m.from];
      b[m.from] = null;
      if (m.enpassant) b[m.to + (c === 'w' ? -8 : 8)] = null;
      if (m.castle === 'K') { b[m.from + 1] = b[m.from + 3]; b[m.from + 3] = null; }
      if (m.castle === 'Q') { b[m.from - 1] = b[m.from - 4]; b[m.from - 4] = null; }
      let cr = this.castle;
      const strip = (sq) => {
        if (sq === 4) cr = cr.replace(/[KQ]/g, ''); if (sq === 60) cr = cr.replace(/[kq]/g, '');
        if (sq === 0) cr = cr.replace('Q', ''); if (sq === 7) cr = cr.replace('K', '');
        if (sq === 56) cr = cr.replace('q', ''); if (sq === 63) cr = cr.replace('k', '');
      };
      strip(m.from); strip(m.to);
      this.castle = cr;
      this.ep = m.double ? (m.from + m.to) / 2 : -1;
      this.turn = c === 'w' ? 'b' : 'w';
    }
    undo() {
      const h = this.hist.pop(); if (!h) return null;
      this.b = h.b; this.castle = h.castle; this.ep = h.ep; this.turn = this.turn === 'w' ? 'b' : 'w';
      return h.m;
    }
    moves() {
      const out = [];
      for (const m of this.pseudo()) {
        this._make(m);
        const ok = !this.inCheck(this.turn === 'w' ? 'b' : 'w');
        this.undo();
        if (ok) out.push(m);
      }
      for (const m of out) m.san = this._san(m, out);
      return out;
    }
    _san(m, legal) {
      let s;
      if (m.castle) s = m.castle === 'K' ? 'O-O' : 'O-O-O';
      else {
        const t = m.piece.toUpperCase();
        if (t === 'P') {
          s = (m.captured ? FILES[m.from & 7] + 'x' : '') + sqName(m.to) + (m.promo ? '=' + m.promo.toUpperCase() : '');
        } else {
          const amb = legal.filter(o => o !== m && o.piece === m.piece && o.to === m.to);
          let d = '';
          if (amb.length) {
            const sameF = amb.some(o => (o.from & 7) === (m.from & 7)), sameR = amb.some(o => (o.from >> 3) === (m.from >> 3));
            if (!sameF) d = FILES[m.from & 7]; else if (!sameR) d = String((m.from >> 3) + 1); else d = sqName(m.from);
          }
          s = t + d + (m.captured ? 'x' : '') + sqName(m.to);
        }
      }
      this._make(m);
      if (this.inCheck()) {
        const any = this.pseudo().some(mm => { this._make(mm); const ok = !this.inCheck(this.turn === 'w' ? 'b' : 'w'); this.undo(); return ok; });
        s += any ? '+' : '#';
      }
      this.undo();
      return s;
    }
    move(x) { // x: SAN string or {from,to,promo}
      const legal = this.moves();
      let m;
      if (typeof x === 'string') {
        const clean = v => v.replace(/[+#!?]/g, '').replace(/0/g, 'O');
        m = legal.find(l => clean(l.san) === clean(x));
      } else {
        const from = typeof x.from === 'string' ? sqIdx(x.from) : x.from, to = typeof x.to === 'string' ? sqIdx(x.to) : x.to;
        m = legal.find(l => l.from === from && l.to === to && (!l.promo || l.promo === (x.promo || 'q')));
      }
      if (!m) return null;
      this._make(m);
      return m;
    }
    isCheckmate() { return this.inCheck() && this.moves().length === 0; }
    isStalemate() { return !this.inCheck() && this.moves().length === 0; }
  }
  const api = { Game, sqName, sqIdx };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MiniChess = api;
})(this);
