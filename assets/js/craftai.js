(function () {
  var nav = document.getElementById('nav');
  var btn = document.getElementById('menuBtn');
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.querySelectorAll('#menu a').forEach(function (a) {
    a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
  });
  document.querySelectorAll('.shine').forEach(function (el) {
    var im = el.querySelector('img');
    if (im) el.style.setProperty('--mask', 'url("' + im.src + '")');
  });
  var rail = document.getElementById('steps'), prev = document.getElementById('stepPrev'), next = document.getElementById('stepNext');
  /* endless loop: three copies of the eight cards; when scrolling goes past a copy we silently jump back by exactly one copy */
  var originals = Array.prototype.slice.call(rail.children);
  function cloneSet() {
    return originals.map(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(c.querySelectorAll('button'), function (x) { x.setAttribute('tabindex', '-1'); });
      return c;
    });
  }
  var firstOrig = originals[0];
  cloneSet().forEach(function (c) { rail.insertBefore(c, firstOrig); });
  cloneSet().forEach(function (c) { rail.appendChild(c); });
  var padL = function () { return parseFloat(getComputedStyle(rail).paddingLeft) || 0; };
  function setW() {
    return firstOrig.getBoundingClientRect().left - rail.children[0].getBoundingClientRect().left;
  }
  function baseLeft() {
    return firstOrig.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft - padL();
  }
  function jump(to) {
    var sb = rail.style.scrollBehavior;
    rail.style.scrollBehavior = 'auto'; rail.style.scrollSnapType = 'none';
    rail.scrollLeft = to;
    void rail.offsetWidth;
    rail.style.scrollSnapType = ''; rail.style.scrollBehavior = sb;
  }
  var homeLeft = 0, idle = null;
  function place() { homeLeft = baseLeft(); jump(homeLeft); }
  function wrapIfNeeded() {
    var w = setW(), sl = rail.scrollLeft;
    if (!w) return;
    if (sl < homeLeft - w / 2) jump(sl + w);
    else if (sl > homeLeft + w / 2) jump(sl - w);
  }
  rail.addEventListener('scroll', function () { clearTimeout(idle); idle = setTimeout(wrapIfNeeded, 140); }, { passive: true });
  window.addEventListener('resize', function () { var w = setW(); var off = rail.scrollLeft - homeLeft; homeLeft = baseLeft() - 0; jump(homeLeft + (off % (w || 1))); });
  function railBy(dir) {
    var card = firstOrig;
    var step = card ? card.getBoundingClientRect().width + 16 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: dir * step * (rail.clientWidth > 700 ? 2 : 1), behavior: 'smooth' });
  }
  prev.disabled = false; next.disabled = false;
  prev.addEventListener('click', function () { railBy(-1); });
  next.addEventListener('click', function () { railBy(1); });
  place();
  window.addEventListener('load', place);
  var COURSES = window.CRAFTAI_COURSES;
  var SCHEDULE = window.CRAFTAI_SCHEDULE;
  var lang = 'en', cur = 0;
  var T = {
    en: { level: 'Level ', lvl: function (n) { return 'Level ' + n; }, target: 'Target', dur: 'Duration', period: 'Dates', venue: 'Venue', size: 'Class size', path: ' pathway', note: 'Your path!',
          proj: 'Project + presentation', projP: 'Show what you built across the courses.', projT: '2 wks', exam: 'Exam', examP: 'A one-week exam covering the courses.', examT: '1 wk', res: 'Supervised research', resP: 'Work with an academic supervisor on real robotics research.', resT: 'Lab', see: 'See course details ↑', full: 'See full details ↑' },
    zh: { level: '第 ', lvl: function (n) { return '第 ' + n + ' 級'; }, target: '對象', dur: '課堂', period: '日期', venue: '地點', size: '班別人數', path: ' 學習路徑', note: 'Your path!',
          proj: '專題 + 匯報', projP: '展示你在課程中的創作成果。', projT: '2 wks', exam: '考試', examP: '為期一星期的考試，涵蓋課程內容。', examT: '1 wk', res: '導師指導研究', resP: '在學術導師指導下，進行真實的機械人研究。', resT: 'Lab', see: '查看課程詳情 ↑', full: 'See full details ↑' }
  };
  var ICON = {
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>',
    dur: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    period: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>',
    venue: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    size: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>'
  };
  function ptsHtml(d, cls) { return '<ul class="points ' + cls + '">' + d.points.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
  function lvLabel(n) { return 'Level ' + n; }
  function emTitle(s) {
    var i = s.lastIndexOf(' '); return i < 0 ? (lang === 'zh' ? s : '<em>' + s + '</em>') : s.slice(0, i + 1) + '<em>' + s.slice(i + 1) + '</em>';
  }
  function scheduleDate(iso) {
    return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-HK' : 'en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    }).format(new Date(iso + 'T12:00:00Z'));
  }
  function courseDatePoints(index) {
    var labels = lang === 'zh' ? { practical: '必修實習課', project: '專題匯報日', exam: '考試', report: '中期報告' } :
      { practical: 'Required practical', project: 'Project Day', exam: 'Exam', report: 'Midterm report' };
    var dates = SCHEDULE.events.filter(function (event) {
      return event.courseIndex === index && /^(class|practical|project|exam|report)$/.test(event.kind);
    }).slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    var formatter = new Intl.DateTimeFormat(lang === 'zh' ? 'zh-HK' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
    });
    var html = '<ul class="course-fact-dates">' + dates.map(function (event) {
      return '<li><time datetime="' + event.date + '">' + formatter.format(new Date(event.date + 'T12:00:00Z')) + '</time>' +
        (event.kind === 'class' ? '' : ' <span class="course-fact-date-kind">— ' + labels[event.kind] + '</span>') + '</li>';
    }).join('') + '</ul>';
    if (SCHEDULE.courses[index].researchOpenEnded) {
      html += '<p class="course-fact-research">' + (lang === 'zh' ? '研究期延至 2028 年夏季，不設固定完結日。' : 'Research continues into summer 2028 with no fixed end date.') + '</p>';
    }
    return html;
  }
  function renderDetail(animate) {
    var c = COURSES[cur], d = c[lang], t = T[lang];
    var sec = document.getElementById('course');
    sec.setAttribute('data-level', c.lv);
    var rows = [['target', t.target, d.target], ['dur', t.dur, d.dur], ['period', t.period, courseDatePoints(cur) + '<strong class="provisional-badge date-status">' + (lang === 'zh' ? '暫定' : 'Provisional') + '</strong>']];
    document.getElementById('dLeft').innerHTML =
      '<span class="lvpill">' + lvLabel(c.lv) + ' · ' + c.code + '</span>' +
      '<h2 class="title">' + emTitle(d.title) + '</h2>' +
      (d.points ? ptsHtml(d, 'lede') : '<p class="lede">' + d.desc + '</p>') +
      '<dl class="facts" style="margin-bottom:0">' + rows.map(function (r) {
        return '<div class="fact' + (r[0] === 'period' ? ' fact-dates' : '') + '">' + ICON[r[0]] + '<dt>' + r[1] + '</dt><dd>' + r[2] + '</dd></div>';
      }).join('') + '</dl>';
    var first = (c.lv - 1) * 2, items = '';
    (c.lv === 5 ? [8] : [first, first + 1]).forEach(function (k) {
      var o = COURSES[k], od = o[lang];
      items += '<li class="' + (k === cur ? 'cur' : '') + '"><time>' + od.dur + '</time><div>' +
        '<button type="button" class="path-link" data-i="' + k + '"><h4>' + o.code + ' · ' + od.title + '' + '</h4></button>' +
        (od.points ? ptsHtml(od, 'p') : '<p>' + od.desc + '</p>') + '<p class="path-assessment">' + (SCHEDULE.courses[k].primaryAssessment.kind === 'project' ? 'Project Day' : SCHEDULE.courses[k].primaryAssessment.kind === 'exam' ? (lang === 'zh' ? '考試' : 'Exam') : (lang === 'zh' ? '中期報告' : 'Midterm report')) + ' · ' + scheduleDate(SCHEDULE.courses[k].primaryAssessment.date) + '</p></div></li>';
    });
    if (c.lv === 5) {
      items += '<li><time>' + t.resT + '</time><div><h4>' + t.res + '</h4><p>' + t.resP + '</p></div></li>';
    }
    document.getElementById('dShow').innerHTML =
      '<header><h3>' + (t.lvl(c.lv) + t.path) + '</h3><span>' + t.note + '</span></header><ol>' + items + '</ol>';
    document.querySelectorAll('.step-btn').forEach(function (b) {
      var on = Number(b.getAttribute('data-i')) === cur;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.parentNode.classList.toggle('on', on);
    });
    document.querySelectorAll('.bp, .bl, .lg').forEach(function (b) { b.classList.toggle('on', Number(b.getAttribute('data-i')) === cur); });
    var cap = document.getElementById('bCap');
    if (cap) {
      cap.innerHTML = '<span class="pin" style="--pc:' + ['#a8e2fb','#46c98a','#ffc933','#b79cff','#1b34d8'][c.lv - 1] + ';--pf:' + (c.lv === 5 ? '#fff' : '#0a1360') + '">' + (cur + 1) + '</span>' +
        '<div><h3><small>' + lvLabel(c.lv) + ' · ' + c.code + '</small>' + d.title + '</h3><p>' + d.desc + '</p></div>' +
        '<button type="button" class="btn btn-navy" data-go="1">' + t.see + '</button>';
    }
    if (animate) {
      ['dLeft', 'dShow'].forEach(function (id) {
        var el = document.getElementById(id); el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
      });
    }
  }
  function selectCourse(i, scroll) {
    cur = i; renderDetail(true);
    if (scroll) {
      var r = document.getElementById('course').getBoundingClientRect();
      if (r.top < 76 || r.top > window.innerHeight - 220) document.getElementById('course').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-go]')) { document.getElementById('course').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    var b = e.target.closest ? e.target.closest('[data-i]') : null;
    if (b) {
      var i = Number(b.getAttribute('data-i')), onMap = b.classList.contains('bl') || b.classList.contains('bp');
      openI = onMap ? (openI === i ? -1 : i) : -1;
      syncOpen();
      selectCourse(i, !onMap && !b.classList.contains('path-link'));
    }
  });
  /* iceberg labels: click to extend the block with more information */
  var openI = -1;
  function buildMore(b) {
    var old = b.querySelector('.more'); if (old) old.parentNode.removeChild(old);
    var c = COURSES[Number(b.getAttribute('data-i'))], d = c[lang];
    var meta = [d.target, d.dur, d.period].filter(function (x) { return !/announced|待公佈/i.test(x); }).join(' · ');
    b.setAttribute('aria-expanded', 'false');
    b.insertAdjacentHTML('beforeend', '<span class="more"><span>' + (d.points ? '<span class="mdesc mpts">' + (d.lpoints || d.points).map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</span>' : '<span class="mdesc">' + d.desc + '</span>') + (meta ? '<span class="mmeta">' + meta + '</span>' : '') + '<span class="go" data-go="1">' + T[lang].full + '</span></span></span>');
  }
  document.querySelectorAll('.bl').forEach(buildMore);
  function syncOpen() {
    document.querySelectorAll('.bl').forEach(function (b) {
      var o = Number(b.getAttribute('data-i')) === openI;
      b.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false');
    });
  }
  renderDetail(false);
  var ZH_TXT = {"About": "關於計劃", "Programme": "課程", "Course details": "課程詳情", "FAQ": "常見問題", "Contact": "聯絡我們", "Register now": "立即報名", "Join the ceremony": "參加啟動典禮", "Explore the programme": "探索課程", "About the programme": "關於計劃", "CraftAI is part of CityUHK's Bright Future initiative. Students go beyond using AI tools. They explore the ideas behind them and build projects of their own, guided by the university community.": "CraftAI 是香港城市大學 Bright Future 計劃的一部分。學生不止於使用 AI 工具，更會探索其背後的原理，並在大學團隊的指導下創作屬於自己的專題項目。", "Learn": "學習", "Create": "創造", "Grow": "成長", "Understand how AI sees, speaks and decides, through hands-on workshops that make big ideas feel approachable.": "透過動手工作坊，了解 AI 如何觀察、表達和作出決定，讓深奧概念變得親切易懂。", "Design, prototype and code AI-powered projects that solve problems you care about, at school, at home, in the city.": "設計、製作原型及編寫由 AI 驅動的專題，解決你在學校、家中及城市裏關心的問題。", "Build confidence, teamwork and a responsible mindset for using AI. These skills carry into whatever comes next.": "建立自信、團隊合作能力，以及負責任地運用 AI 的思維。這些能力將伴隨你走向未來。", "The programme · 5 levels · 9 courses": "課程 · 5 個級別 · 9 個課程", "Level 1": "第 1 級", "Level 2": "第 2 級", "Level 3": "第 3 級", "Level 4": "第 4 級", "Level 5": "第 5 級", "Dates": "日期", "To be announced": "待公佈", "Above the surface · using AI": "水面之上 · 使用 AI", "Below the surface · how AI works": "水面之下 · AI 如何運作", "Learning AI with AI": "以 AI 學習 AI", "Ready to craft the future with AI?": "準備好用 AI 創造未來了嗎？", "Register for the Inauguration Ceremony and be the first to hear when programme applications open. Seats are limited.": "登記參加啟動典禮，率先獲悉課程申請開放的消息。名額有限。", "For schools & teachers": "學校及教師專區", "Learn · Create · Grow": "學習 · 創造 · 成長", "About CraftAI": "關於 CraftAI", "Programme journey": "課程歷程", "City University of Hong Kong": "香港城市大學", "© 2026 City University of Hong Kong. All rights reserved.": "© 2026 香港城市大學。版權所有。", "Privacy": "私隱", "Accessibility": "無障礙", "Introduction to Generative AI and Prompt Engineering": "生成式 AI 與提示工程入門", "Learn how generative AI works and how to write clear prompts that get useful results.": "了解生成式 AI 的運作原理，學習撰寫清晰的提示，得到更有用的結果。", "Creative Media Production with Generative AI": "生成式 AI 創意媒體製作", "Create images, audio and short videos with generative AI tools, from first idea to finished clip.": "運用生成式 AI 工具創作圖像、聲音及短片，由最初構思到完成作品。", "Programming Fundamentals and Vibe Coding": "編程基礎與 Vibe Coding", "Write your first programs in Python and learn to build with AI-assisted coding.": "以 Python 編寫第一個程式，並學習運用 AI 輔助編程進行創作。", "Design and Development of AI Assistants": "AI 助手設計與開發", "Design and build your own AI assistant by linking prompts, tools and logic together.": "把提示、工具與邏輯連結起來，設計並打造屬於自己的 AI 助手。", "Introduction to Reinforcement Learning for Game Playing": "遊戲強化學習入門", "Train an AI agent to play games and see how it learns by trial and error.": "訓練 AI 代理玩遊戲，看它如何從嘗試與錯誤中學習。", "Introduction to Machine Learning": "機器學習入門", "Find out how computers learn patterns from data, and train your first machine learning models.": "了解電腦如何從數據中找出規律，並訓練你的第一個機器學習模型。", "Introduction to Deep Learning": "深度學習入門", "Explore neural networks and how deep learning powers image, language and speech AI.": "探索神經網絡，了解深度學習如何推動圖像、語言及語音 AI。", "Foundations of Computational Decision Making": "計算決策基礎", "Understand the maths behind how AI weighs up options and makes decisions.": "了解 AI 背後的數學，看它如何權衡選項並作出決定。", "Research Project in Embodied AI and Robotics": "具身智能與機械人研究專題", "Become an independent problem solver on frontier research, helping solve real challenges in robotics and embodied AI.": "面對前沿研究難題，培養獨立自主解難能力，協助解決機械人及具身智能領域的真實挑戰。", "Become an independent problem solver on frontier research.": "面對前沿研究難題，培養獨立自主解難能力。"};

  function syncPageLinks(lang) {
    document.querySelectorAll('a[data-site-link]').forEach(function (link) {
      if (link.__siteHref === undefined) link.__siteHref = link.getAttribute('href');
      var parts = link.__siteHref.split('#'), page = parts[0].split('?')[0];
      link.setAttribute('href', page + '?lang=' + lang + (parts[1] ? '#' + parts[1] : ''));
    });
  }
  function translateDom(l) {
    document.querySelectorAll('[data-zh]').forEach(function (el) {
      if (el.__en === undefined) el.__en = el.innerHTML;
      el.innerHTML = l === 'zh' ? el.getAttribute('data-zh') : el.__en;
    });
    document.querySelectorAll('body *').forEach(function (el) {
      if (el.children.length || el.closest('.eyebrow,.hand,.tag,.lvl,.step .meta,.legal,.foot h4,.fq,.lsw,[data-zh],#dLeft,#dShow,#bCap,[data-no-translate],.more,script,style,svg')) return;
      if (el.__k === undefined) {
        var k = el.textContent.replace(/\s+/g, ' ').trim();
        if (!Object.prototype.hasOwnProperty.call(ZH_TXT, k)) return;
        el.__k = k; el.__en = el.textContent;
      }
      el.textContent = l === 'zh' ? ZH_TXT[el.__k] : el.__en;
    });
  }
  var TITLES = { en: document.title, zh: 'CraftAI 啟動典禮 | 城大 Bright Future' };
  function setLang(l) {
    lang = l === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
    translateDom(lang);
    document.title = TITLES[lang];
    document.querySelectorAll('[data-l]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-l') === lang ? 'true' : 'false'); });
    renderDetail(false);
    document.querySelectorAll('.bl').forEach(buildMore); syncOpen();
    syncPageLinks(lang);
  }
  document.querySelectorAll('[data-l]').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-l')); }); });
  var languageMatch = location.search.match(/[?&]lang=(en|zh)(?:&|$)/);
  var want = languageMatch ? languageMatch[1] : window.CRAFTAI_LANG || 'en';
  setLang(want);
  if (location.hash === '#academic-calendar') location.replace('calendar.html?lang=' + want);
})();
