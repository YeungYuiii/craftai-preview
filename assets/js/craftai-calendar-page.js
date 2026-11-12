(function () {
  'use strict';
  var nav = document.getElementById('nav'), menuButton = document.getElementById('menuBtn');
  menuButton.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.querySelectorAll('#menu a').forEach(function (link) {
    link.addEventListener('click', function () {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
  });
  function setLang(value) {
    var lang = value === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = lang === 'zh' ? 'zh-HK' : 'en';
    document.title = lang === 'zh' ? '課程學年日曆 | CityUHK Bright Future CraftAI' : 'Academic calendar | CityUHK Bright Future CraftAI';
    document.querySelectorAll('[data-zh]').forEach(function (element) {
      if (element.__en === undefined) element.__en = element.innerHTML;
      element.innerHTML = lang === 'zh' ? element.getAttribute('data-zh') : element.__en;
    });
    document.querySelectorAll('[data-l]').forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-l') === lang ? 'true' : 'false');
    });
    document.querySelectorAll('a[data-site-link]').forEach(function (link) {
      if (link.__siteHref === undefined) link.__siteHref = link.getAttribute('href');
      var parts = link.__siteHref.split('#'), page = parts[0].split('?')[0];
      link.setAttribute('href', page + '?lang=' + lang + (parts[1] ? '#' + parts[1] : ''));
    });
    window.CraftAICalendar.setLang(lang);
  }
  window.CraftAICalendar.init(window.CRAFTAI_COURSES, window.CRAFTAI_SCHEDULE);
  document.querySelectorAll('[data-l]').forEach(function (button) {
    button.addEventListener('click', function () { setLang(button.getAttribute('data-l')); });
  });
  var match = location.search.match(/[?&]lang=(en|zh)(?:&|$)/);
  setLang(match ? match[1] : window.CRAFTAI_LANG || 'en');
})();
