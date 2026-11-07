// Standard chess, FIDE Handbook B.02, §§7.1.4, 7.2.1, 8.1–8.3.
// https://handbook.fide.com/chapter/B022024 (including the October 2025 amendment).
const maxDifference = [
  3,10,17,25,32,39,46,53,61,68,76,83,91,98,106,113,121,129,137,145,
  153,162,170,179,188,197,206,215,225,235,245,256,267,278,290,302,315,
  328,344,357,374,391,411,432,456,484,517,559,619,735,Infinity
];
const dpFromHalf = [
  0,7,14,21,29,36,43,50,57,65,72,80,87,95,102,110,117,125,133,141,
  149,158,166,175,184,193,202,211,220,230,240,251,262,273,284,296,
  309,322,336,351,366,383,401,422,444,470,501,538,589,677,800
];
export const isRating = value => Number.isSafeInteger(+value) && +value >= 1400;
export const isGame = game => isRating(game.opponent) && [0, 0.5, 1].includes(game.score);

export function expectedPercent(rating, opponent) {
  const difference = rating - opponent;
  const absolute = Math.abs(difference);
  const effective = rating < 2650 ? Math.min(400, absolute) : absolute;
  return 50 + Math.sign(difference) * maxDifference.findIndex(limit => effective <= limit);
}

export function ratingPeriod(rating, nominalK, games, otherGames = 0) {
  const count = games.filter(isGame).length;
  const n = count + otherGames;
  const validK = [10,20,40].includes(nominalK);
  const k = validK ? (n ? Math.min(nominalK, Math.floor(700 / n)) : nominalK) : null;
  let running = 0;
  const rows = games.map(game => {
    if (!isRating(game.opponent) || !isRating(rating)) return null;
    const expected = expectedPercent(rating, +game.opponent);
    if (!isGame(game) || k === null) return { expected, delta:null, running:null };
    const delta = (100 * game.score - expected) * k;
    running += delta;
    return { expected, delta: delta / 100, running: running / 100 };
  });
  // Keep hundredths as integers until the single end-of-period rounding.
  const rounded = Math.sign(running) * Math.floor((Math.abs(running) + 50) / 100);
  return { rows, count, k, raw: running / 100, rounded, final: +rating + rounded };
}

function monthIndex(value) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : NaN;
}

export function initialRating(events, asOf) {
  const end = monthIndex(asOf);
  const included = [];
  let started = false, zeroGames = 0, outside = 0;
  const ordered = events.map(event => ({ month: monthIndex(event.month), games: event.games.filter(isGame) }))
    .sort((a, b) => a.month - b.month);
  for (const event of ordered) {
    if (!Number.isFinite(end) || !Number.isFinite(event.month) || event.month > end) {
      outside += event.games.length;
      continue;
    }
    if (event.games.some(game => game.score > 0)) started = true;
    if (end - event.month >= 26) outside += event.games.length;
    else if (!started) zeroGames += event.games.length;
    else included.push(...event.games);
  }
  const count = included.length;
  const score = included.reduce((sum, game) => sum + game.score, 0);
  const total = count + 2;
  const average = (included.reduce((sum, game) => sum + Number(game.opponent), 3600)) / total;
  const percent = Math.round(100 * (score + 1) / total);
  const dp = Math.sign(percent - 50) * dpFromHalf[Math.abs(percent - 50)];
  const value = count ? Math.min(2200, Math.round(average + dp)) : null;
  const eligible = count >= 5 && score > 0 && value >= 1400;
  return { count, score, value, average, percent, dp, eligible, zeroGames, outside };
}
