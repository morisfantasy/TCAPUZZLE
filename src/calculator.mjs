import { mountNorms, resetNormView } from './norm-ui.mjs';
import { normLanguage } from './norm-text.mjs';
import { initialRating, ratingPeriod, isRating } from './rating.mjs';

const currentMonth = () => {
  const now = new Date();
  return String(now.getFullYear()) + '-' + String(now.getMonth() + 1).padStart(2, '0');
};
const game = () => ({ opponent: '', score: null });
const event = month => ({ month, games: [game()] });
const fresh = () => ({
  change: { rating: '', k: null, games: [game()] },
  initial: { asOf: currentMonth(), events: [event(currentMonth())] }
});
let state = fresh(), mode = 'change';
export function resetCalculator() { state = fresh(); mode = 'change'; resetNormView(); }

export function mountCalculator(root, { tr, icon, locale, user }) {
  const f = number => new Intl.NumberFormat(locale, {maximumFractionDigits: 2, useGrouping:false}).format(number);
  const signed = number => (number > 0 ? '+' : '') + f(number);
  const tone = number => number > 0 ? 'gain' : number < 0 ? 'loss' : '';
  const label = (key, body) => '<label class="calc-field"><span>' + tr(key) + '</span>' + body + '</label>';
  const numberInput = (name, value, hint, index = '') => '<input type="number" inputmode="numeric" step="1" min="1400" data-field="' + name + '" ' + index + ' aria-label="' + hint + '" placeholder="1800" value="' + value + '">';
  function rows(games, ei) {
    return games.map((g, i) => {
      const pos = 'data-event="' + ei + '" data-index="' + i + '"';
      const buttons = [[1,'win'],[0.5,'draw'],[0,'loss']].map(([score,key]) =>
        '<button type="button" data-score="' + score + '" ' + pos + ' aria-pressed="' + (g.score === score) + '" title="' + tr(key) + '">' + tr(key) + '</button>').join('');
      return '<div class="calc-row" ' + pos + '><span class="row-no">' + (i + 1) + '</span>' +
        label('opponent', numberInput('opponent', g.opponent, tr('opponent') + ' ' + (i + 1), pos)) +
        '<div class="score-picker" role="group" aria-label="' + tr('result') + '">' + buttons + '</div>' +
        (mode === 'change' ? '<div class="row-stat"><small>' + tr('expected') + '</small><output data-stat="expected">—</output></div><div class="row-stat"><small>' + tr('contribution') + '</small><output data-stat="delta">—</output></div><div class="row-stat"><small>' + tr('running') + '</small><output data-stat="running">—</output></div>' : '') +
        '<button class="delete-game icon-button" data-remove ' + pos + ' aria-label="' + tr('remove') + ' ' + (i+1) + '">' + icon('trash') + '</button></div>';
    }).join('');
  }
  function gameList(games, ei) {
    return rows(games, ei) + '<button class="soft-button add-game" data-add="' + ei + '">' + icon('plus') + tr('addGame') + '</button>';
  }
  function render() {
    const r = state.change, u = state.initial;
    const header = '<section class="tool-title"><div class="title-icon">' + icon('calculator') + '</div><div><p>' + tr('standard') + '</p><h1>' + tr('fideCalc') + '</h1></div></section>' +
      '<div class="mode-tabs" aria-label="' + tr('fideCalc') + '">' + ['initial','change','norms'].map(key => '<button data-mode="' + key + '" aria-pressed="' + (mode===key) + '">' + icon(key==='initial'?'flag':key==='norms'?'award':'trend') + (key==='norms'?normLanguage(locale)('norms'):tr(key)) + '</button>').join('') + '</div>';
    if(mode==='norms') {
      root.innerHTML=header+'<div class="norm-workspace"></div>';
      mountNorms(root.querySelector('.norm-workspace'),{locale,icon,user});
      return;
    }
    root.innerHTML=header +
      '<div class="calc-layout"><div class="calc-editor"><section class="tool-panel calc-settings">' +
      (mode === 'change' ? label('own',numberInput('rating',r.rating,tr('own'))) +
        label('kFactor','<select data-field="k" required><option value="" disabled ' + (r.k===null?'selected':'') + '>' + tr('chooseK') + '</option>' + [10,20,40].map(k=>'<option ' + (r.k===k?'selected':'') + '>' + k + '</option>').join('') + '</select>') :
        label('asOf','<input type="month" data-field="asOf" required value="' + u.asOf + '">')) +
      '<p class="field-help">' + tr(mode==='change'?'periodNote':'initialNote') + '</p></section>' +
      (mode==='change' ? '<section class="tool-panel game-group"><h2>' + tr('games') + '</h2>' + gameList(r.games,0) + '</section>' :
        u.events.map((ev, i) => '<section class="tool-panel game-group"><div class="event-head"><h2>' + tr('event',i+1) + '</h2>' +
          label('eventMonth','<input type="month" required data-field="month" data-event="' + i + '" value="' + ev.month + '">') +
          (u.events.length>1?'<button class="icon-button" data-drop-event="' + i + '" aria-label="' + tr('remove') + ' ' + tr('event',i+1) + '">' + icon('trash') + '</button>':'') +
          '</div>' + gameList(ev.games,i) + '</section>').join('') + '<button class="soft-button" data-new-event>' + icon('plus') + tr('addEvent') + '</button>') +
      '</div><aside class="calc-aside"><div class="calc-summary" aria-live="polite"></div>' +
      '<details class="rules-note"><summary>' + tr('calcSources') + '</summary><p>' + tr(mode==='initial'?'virtual':'kHelp') + '</p><a href="https://handbook.fide.com/chapter/B022024" target="_blank" rel="noopener">' + tr('rulebook') + ' ↗</a></details>' +
      '<button class="reset-button" data-reset>' + icon('reset') + tr('reset') + '</button></aside></div>';
    update();
  }
  function update() {
    const stat = (key, value) => '<div><dt>' + tr(key) + '</dt><dd>' + value + '</dd></div>';
    let heading = 'finalRating', result = '—', detail = '', metrics = '', notes = [];
    if (mode === 'change') {
      const r = state.change, calc = ratingPeriod(r.rating, r.k, r.games);
      const valid = isRating(r.rating) && calc.count > 0 && calc.k !== null;
      if (valid) {
        result = f(calc.final);
        detail = '<b class="change-chip ' + tone(calc.rounded) + '">' + signed(calc.rounded) + '</b>';
        if (calc.final < 1400) notes.push(tr('fellBelow'));
      } else notes.push(tr(isRating(r.rating) && calc.count && calc.k===null ? 'chooseK' : 'calcPrompt'));
      metrics = stat('validGames',calc.count) + stat('period',valid ? signed(calc.raw) : '—');
      if (calc.k !== r.k) notes.push(tr('kReduced',calc.k));
      root.querySelectorAll('.calc-row').forEach((row,i) => {
        const data = calc.rows[i];
        for (const key of ['expected','delta','running']) {
          const out = row.querySelector('[data-stat="' + key + '"]');
          out.textContent = data && data[key]!=null ? key==='expected' ? f(data.expected/100) : signed(data[key]) : '—';
          out.className = data && key!=='expected' ? tone(data[key]) : '';
        }
      });
    } else {
      const u = state.initial, calc = initialRating(u.events,u.asOf);
      heading = calc.eligible ? 'finalRating' : 'preliminary';
      if (calc.value !== null) result = f(calc.value);
      metrics = stat('validGames',calc.count) + stat('points',f(calc.score));
      if (calc.eligible) notes.push(tr('publishable'));
      if (calc.count < 5) notes.push(tr('missingGames',5-calc.count));
      if (!calc.score) notes.push(tr('firstScore'));
      if (calc.value !== null && calc.value < 1400) notes.push(tr('floor'));
      if (calc.zeroGames) notes.push(tr('zeroEvents',calc.zeroGames));
      if (calc.outside) notes.push(tr('outside',calc.outside));
    }
    root.querySelectorAll('input[type=number]').forEach(input => {
      const bad = !!input.value && !isRating(input.value);
      input.setAttribute('aria-invalid',String(bad));
      let error = input.parentNode.querySelector('.input-error');
      if (bad && !error) { error=document.createElement('small'); error.className='input-error'; input.after(error); }
      if (bad) error.textContent=tr('invalidRating'); else error?.remove();
    });
    root.querySelector('.calc-summary').innerHTML = '<span class="summary-label">' + tr(heading) + '</span><div class="rating-number"><output data-total>' + result + '</output>' + detail + '</div><dl>' + metrics + '</dl><ul>' + notes.map(n=>'<li>' + n + '</li>').join('') + '</ul>';
  }
  const list = ei => mode === 'change' ? state.change.games : state.initial.events[ei].games;
  root.oninput = e => {
    if(mode==='norms')return;
    const el = e.target, {field,event:ei,index} = el.dataset;
    if (field === 'opponent') list(+ei)[+index].opponent = el.value;
    else if (field === 'rating') state.change.rating = el.value;
    else if (field === 'k') state.change.k = +el.value;
    else if (field === 'month') state.initial.events[+ei].month = el.value;
    else if (field === 'asOf') state.initial.asOf = el.value;
    else return;
    update();
  };
  root.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.mode) { mode = d.mode; render(); }
    else if (mode==='norms') return;
    else if ('score' in d) {
      list(+d.event)[+d.index].score = +d.score;
      b.parentElement.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));
      update();
    } else if ('add' in d) {
      list(+d.add).push(game()); render();
      root.querySelector('.calc-row[data-event="' + d.add + '"][data-index="' + (list(+d.add).length-1) + '"] input').focus();
    } else if ('remove' in d) { list(+d.event).splice(+d.index,1); render(); }
    else if ('dropEvent' in d) { state.initial.events.splice(+d.dropEvent,1); render(); }
    else if ('newEvent' in d) { state.initial.events.push(event(state.initial.asOf)); render(); }
    else if ('reset' in d) { state[mode] = fresh()[mode]; render(); }
  };
  render();
}
