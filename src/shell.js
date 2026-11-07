const icons = {
  home:'<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3z"/>',
  books:'<path d="M3 5c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2zM12 7v14"/>',
  videos:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="m10 8 6 4-6 4z"/>',
  calculator:'<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M8 7h8M8.5 12h1m5 0h1m-7 5h1m5 0h1"/>',
  analysis:'<path d="m6 15 1-4 3-3-1-4 4 2 3-1 2 4 1 7H8l-2 3h14M5 21h15M13 9h.1"/>',
  flag:'<path d="M5 21V4c5-3 9 4 14 0v10c-5 4-9-3-14 0"/>',
  trend:'<path d="m3 17 6-6 4 4 8-10m-6 0h6v6"/>', next:'<path d="m9 5 7 7-7 7"/>',
  previous:'<path d="m15 5-7 7 7 7"/>', first:'<path d="m12 6-6 6 6 6m7-12-6 6 6 6"/>',
  last:'<path d="m5 6 6 6-6 6m7-12 6 6-6 6"/>', flip:'<path d="m3 8 4-4 4 4M7 4v13m14-1-4 4-4-4m4 4V7"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>', plus:'<path d="M12 5v14M5 12h14"/>',
  trash:'<path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7"/>',
  reset:'<path d="M4 11a8 8 0 1 1 1 7M4 4v7h7"/>', logout:'<path d="M10 4H4v16h6m3-13 5 5-5 5m-5-5h12"/>',
  upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5"/>', download:'<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 7V3H3v13h4"/>',
  eraser:'<path d="m3 14 10-11 8 8-10 10H8zM7 10l8 7m-4 4h10"/>',
  more:'<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>',
  close:'<path d="m5 5 14 14M19 5 5 19"/>', pencil:'<path d="m4 16 12-12 4 4L8 20l-5 1z"/>',
  branch:'<path d="M6 3v18m0-8c0-4 11-1 11-7V3m-3 3 3-3 3 3"/>'
};
function icon(name) { return '<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + icons[name] + '</svg>'; }

function sections() {
  const items=[['home','home','home'],['library','booksNav','books'],['videos','videos','videos'],['calculator','calculator','calculator']];
  if(Auth.current()?.isAdmin)items.push(['analysis','analysis','analysis']);
  return items;
}
function routeName() {
  return location.hash.replace(/^#\/?/,'').split('/')[0] || 'home';
}
function shell(inner) {
  const user=Auth.current();
  const current = ({book:'library',play:'library',books:'library',courses:'videos'})[routeName()] || routeName();
  const nav=sections().map(([path,key,glyph])=>'<a href="#/' + path + '"' + (path===current?' aria-current="page"':'') + '>' + icon(glyph) + '<span>' + tr(key) + '</span></a>').join('');
  return '<div class="platform-shell"><aside class="platform-rail"><a class="platform-brand" href="#/home" aria-label="The Chess Academy"><img src="' + LOGO + '" alt="The Chess Academy"></a>' +
    '<nav class="platform-nav" aria-label="TCA">' + nav + '</nav></aside><div class="platform-body">' +
    '<header class="platform-bar"><a class="mobile-brand" href="#/home"><img src="' + LOGO + '" alt="The Chess Academy"></a><div class="bar-tools">' + langSelect() +
    (user?'<span class="account-name">' + esc(user.name) + '</span><button class="icon-button" id="logout" aria-label="' + esc(t('logout')) + '" title="' + esc(t('logout')) + '">' + icon('logout') + '</button>':
      '<a class="soft-button" href="#/login">' + esc(t('login')) + '</a>') + '</div></header>' +
    '<main class="platform-main" id="platformMain">' + inner + '</main></div></div>';
}
let studyModule, ratingModule, unmountStudy, renderVersion=0;
function bindShell() {
  bindLang();
  const logout=$('#logout');
  if(logout)logout.onclick=async()=>{
    studyModule?.forgetStudy(); ratingModule?.resetCalculator(); await Auth.logout(); go('#/login');
  };
}
function renderHome() {
  const stats=stat(ALL), upcoming=ALL.find(ex=>rec(keyOf(ex.id))?.s!=='c') || ALL[0];
  const tools=sections().slice(1);
  const desc={library:bookDescription(),videos:tr('videosEmpty'),calculator:tr('eloDesc'),analysis:tr('coachDesc')};
  root.innerHTML=shell('<section class="home-heading"><h1>' + tr('workspace') + '</h1></section>' +
    '<section class="training-feature"><div><p>' + tr('workbook') + '</p><h2>White Pawn</h2><span>' + tr('solvedCount',stats.c) + '</span><a class="feature-action" href="#/play/' + upcoming.id + '">' + tr('continueBook') + icon('arrow') + '</a></div>' +
    '<img src="' + BOOK_COVER + '" alt="White Pawn"></section><div class="section-grid">' +
    tools.map(([path,key,glyph])=>'<a class="section-tile tile-' + path + '" href="#/' + path + '"><div class="tile-head"><span>' + icon(glyph) + '</span>' + icon('arrow') + '</div><h2>' + tr(key) + '</h2><p>' + esc(desc[path]) + '</p></a>').join('') + '</div>' +
    (Auth.current()?.isSuperadmin?superadminUsersMarkup():''));
  bindShell(); if(Auth.current()?.isSuperadmin)bindSuperadminUsers();
}
function renderCourses() {
  root.innerHTML=shell('<section class="tool-title"><div class="title-icon">' + icon('videos') + '</div><h1>' + tr('videos') + '</h1></section><section class="tool-panel video-empty">' +
    icon('videos') + '<p>' + tr('videosEmpty') + '</p></section>');
  bindShell();
}
async function renderTool(analysis) {
  const version=renderVersion;
  root.innerHTML=shell('<div id="toolRoot" aria-busy="true">' + tr('busy') + '</div>');
  bindShell();
  const area=$('#toolRoot');
  async function denied() {
    if(version!==renderVersion)return;
    studyModule?.forgetStudy();await Auth.restore();
    if(version===renderVersion)go(Auth.current()?'#/home':'#/login');
  }
  try {
    if(analysis) {
      const access=await fetch('/api/analysis/access',{cache:'no-store',credentials:'same-origin'});
      if(version!==renderVersion)return;
      if(access.status===401||access.status===403){await denied();return;}
      if(!access.ok)throw Error();
      studyModule=await import('/api/analysis/board.mjs');
      if(version!==renderVersion)return;
      unmountStudy=studyModule.mountAnalysis(area,{tr,esc,icon,pieceSVG,user:Auth.current().username,denied});
    } else {
      ratingModule=await import('/assets/calculator.mjs');
      if(version!==renderVersion)return;
      ratingModule.mountCalculator(area,{tr,icon,locale:document.documentElement.lang});
    }
  } catch { if(version===renderVersion)area.textContent=tr('unavailable'); }
  finally {area.removeAttribute('aria-busy');}
}
