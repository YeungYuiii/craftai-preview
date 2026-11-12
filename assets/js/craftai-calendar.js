(function () {
  'use strict';
  var app, view, status, courses = [], schedule = { courses: [], events: [] };
  var state = { lang: 'en', group: 0, course: -1 };
  var groups = [
    { en: 'Jan–May 2027', zh: '2027 年 1–5 月', year: 2027, first: 1, last: 5 },
    { en: 'Jun–Dec 2027', zh: '2027 年 6–12 月', year: 2027, first: 6, last: 12 },
    { en: 'Jan–May 2028', zh: '2028 年 1–5 月', year: 2028, first: 1, last: 5 }
  ];
  var copy = {
    en: {
      course: 'Course', allCourses: 'All courses', jump: 'Jump to month', date: 'Dates', events: 'Events',
      noEvents: 'No scheduled events this month.', noGroupEvents: 'No scheduled events for this course in this period.',
      noGroupHint: 'Choose another period or select all courses.', noMonths: 'No matching months',
      level: 'Shared Level ',
      class: 'Class', practical: 'Compulsory practical', project: 'Project Day', exam: 'Exam', resit: 'Resit',
      report: 'Midterm report', reserve: 'Reserve day', briefing: 'External applicant briefing / make-up',
      classLegend: 'Classes / practical', assessmentLegend: 'Assessments', supportLegend: 'Reserve / briefing',
      event: 'event', eventPlural: 'events', tabLabel: 'Academic calendar periods',
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    },
    zh: {
      course: '課程', allCourses: '所有課程', jump: '跳至月份', date: '日期', events: '活動',
      noEvents: '本月未有已排定的活動。', noGroupEvents: '此課程在這段期間未有已排定的活動。',
      noGroupHint: '請選擇其他期間，或選擇所有課程。', noMonths: '未有相關月份',
      level: '共用：第 ',
      class: '課堂', practical: '必修實習課', project: 'Project Day', exam: '考試', resit: '補考',
      report: '中期報告', reserve: '後備日', briefing: '外部申請者回校簡報／補做',
      classLegend: '課堂／實習', assessmentLegend: '評核', supportLegend: '後備／簡報',
      event: '項活動', eventPlural: '項活動', tabLabel: '學術日曆期間',
      weekdays: ['日', '一', '二', '三', '四', '五', '六']
    }
  };
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function dateObject(iso) { return new Date(iso + 'T12:00:00Z'); }
  function formatDate(iso, options) {
    return new Intl.DateTimeFormat(state.lang === 'zh' ? 'zh-HK' : 'en-GB', Object.assign({ timeZone: 'UTC' }, options)).format(dateObject(iso));
  }
  function monthTitle(month) { return formatDate(month + '-01', { month: 'long', year: 'numeric' }); }
  function courseData(index) { return schedule.courses.find(function (item) { return item.courseIndex === index; }); }
  function matchingEvents(month) {
    return schedule.events.filter(function (event) {
      if (event.date.slice(0, 7) !== month) return false;
      if (state.course === -1) return true;
      return event.courseIndex === state.course || (event.courseIndex == null && event.level === courses[state.course].lv);
    }).slice().sort(function (a, b) {
      return a.date.localeCompare(b.date) || (a.startTime || '99:99').localeCompare(b.startTime || '99:99') || String(a.kind).localeCompare(String(b.kind));
    });
  }
  function visibleMonths() {
    var group = groups[state.group], result = [];
    for (var number = group.first; number <= group.last; number++) {
      var month = group.year + '-' + String(number).padStart(2, '0');
      if (state.course === -1 || matchingEvents(month).length) result.push(month);
    }
    return result;
  }
  function kindGroup(event) {
    return /^(class|practical)$/.test(event.kind) ? 'class' : /^(reserve|briefing)$/.test(event.kind) ? 'support' : 'assessment';
  }
  function countLabel(count) { return count + ' ' + (count === 1 ? copy[state.lang].event : copy[state.lang].eventPlural); }
  function renderMonthGrid(month, events) {
    var first = dateObject(month + '-01'), offset = first.getUTCDay();
    var total = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    var slots = Math.ceil((offset + total) / 7) * 7, rows = '';
    for (var slot = 0; slot < slots; slot++) {
      if (slot % 7 === 0) rows += '<tr>';
      var day = slot - offset + 1, sunday = slot % 7 === 0 ? ' cityu-sunday' : '';
      if (day < 1 || day > total) rows += '<td class="cityu-outside" aria-hidden="true"></td>';
      else {
        var iso = month + '-' + String(day).padStart(2, '0');
        var daily = events.filter(function (event) { return event.date === iso; });
        var kinds = [];
        daily.forEach(function (event) { var kind = kindGroup(event); if (kinds.indexOf(kind) < 0) kinds.push(kind); });
        if (daily.length) {
          var highlight = kinds.length > 1 ? 'mixed' : kinds[0];
          rows += '<td class="cityu-date-event cityu-event-' + highlight + sunday + '"><span class="cityu-date-number">' + day + '</span></td>';
        } else rows += '<td class="cityu-date' + sunday + '">' + day + '</td>';
      }
      if (slot % 7 === 6) rows += '</tr>';
    }
    return '<div class="cityu-month-frame"><h2 class="cityu-month-heading" id="cityu-month-heading-' + month + '">' + esc(monthTitle(month)) + '</h2><table class="cityu-month-grid" aria-labelledby="cityu-month-heading-' + month + '"><thead><tr>' + copy[state.lang].weekdays.map(function (day, i) { return '<th scope="col"' + (i === 0 ? ' class="cityu-sunday"' : '') + '>' + day + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function renderEventTable(month, events) {
    var t = copy[state.lang], shown = events;
    var courseGroups = [];
    shown.forEach(function (event) {
      var key = event.courseIndex == null ? 'level-' + event.level : 'course-' + event.courseIndex;
      var group = courseGroups.find(function (item) { return item.key === key; });
      if (!group) { group = { key: key, courseIndex: event.courseIndex, level: event.level, events: [] }; courseGroups.push(group); }
      group.events.push(event);
    });
    var rows = courseGroups.map(function (group) {
      var course = group.courseIndex == null ? null : courses[group.courseIndex];
      var dateLines = '<ul class="cityu-date-list">' + group.events.map(function (event) {
        return '<li><time datetime="' + event.date + '">' + esc(formatDate(event.date, { day: 'numeric', month: 'long', year: 'numeric' })) + '</time>' +
          (event.kind === 'class' ? '' : ' <span class="cityu-date-kind">— ' + esc(t[event.kind]) + '</span>') + '</li>';
      }).join('') + '</ul>';
      return '<tr><td>' + (course ? '<span class="cityu-course-code">' + esc(course.code) + '</span>' : '<span class="cityu-shared-level">' + esc(t.level + group.level + (state.lang === 'zh' ? ' 級' : '')) + '</span>') + '</td><td>' + dateLines + '</td></tr>';
    }).join('');
    if (!rows) rows = '<tr><td colspan="2" class="cityu-empty-month">' + t.noEvents + '</td></tr>';
    return '<div class="cityu-events-wrap" id="cityu-events-' + month + '">' + '<table class="cityu-events-table"><caption class="cityu-sr-only">' + esc(monthTitle(month) + ' · ' + t.date) + '</caption><thead><tr><th scope="col">' + t.course + '</th><th scope="col">' + t.date + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }
  function rememberFocus() {
    var active = document.activeElement;
    if (!active || !app.contains(active)) return null;
    if (active.id) return '#' + active.id;
    return null;
  }
  function render(announce) {
    if (!app || !view) return;
    var t = copy[state.lang], months = visibleMonths(), focus = rememberFocus();
    var eventsCount = months.reduce(function (sum, month) { return sum + matchingEvents(month).length; }, 0);
    view.innerHTML = '<div class="cityu-period-tabs" role="tablist" aria-label="' + t.tabLabel + '">' + groups.map(function (group, index) { return '<button type="button" role="tab" id="cityu-period-' + index + '" aria-selected="' + (state.group === index ? 'true' : 'false') + '" aria-controls="cityu-period-panel" tabindex="' + (state.group === index ? '0' : '-1') + '" data-cityu-group="' + index + '">' + group[state.lang] + '</button>'; }).join('') + '</div><div class="cityu-calendar-tools"><label><span>' + t.course + '</span><select id="cityu-course-filter"><option value="-1">' + t.allCourses + '</option>' + courses.map(function (course, index) { return '<option value="' + index + '"' + (state.course === index ? ' selected' : '') + '>' + esc(course.code + ' · ' + course[state.lang].title) + '</option>'; }).join('') + '</select></label><label class="cityu-jump-label"><span>' + t.jump + '</span><select id="cityu-jump-month"' + (months.length ? '' : ' disabled') + '>' + (months.length ? months.map(function (month) { return '<option value="' + month + '">' + esc(monthTitle(month)) + '</option>'; }).join('') : '<option>' + t.noMonths + '</option>') + '</select></label></div><div class="cityu-calendar-key"><span><i class="cityu-key-class" aria-hidden="true"></i>' + t.classLegend + '</span><span><i class="cityu-key-assessment" aria-hidden="true"></i>' + t.assessmentLegend + '</span><span><i class="cityu-key-support" aria-hidden="true"></i>' + t.supportLegend + '</span></div><div class="cityu-period-panel" id="cityu-period-panel" role="tabpanel" aria-labelledby="cityu-period-' + state.group + '" tabindex="0">' + (months.length ? months.map(function (month) { var events = matchingEvents(month); return '<section class="cityu-month-row" id="cityu-row-' + month + '" aria-labelledby="cityu-month-heading-' + month + '">' + renderMonthGrid(month, events) + renderEventTable(month, events) + '</section>'; }).join('') : '<div class="cityu-empty-period"><strong>' + t.noGroupEvents + '</strong><p>' + t.noGroupHint + '</p></div>') + '</div>';
    if (announce) status.textContent = groups[state.group][state.lang] + ', ' + countLabel(eventsCount);
    if (focus) {
      var target = view.querySelector(focus);
      if (target && !target.disabled) target.focus({ preventScroll: true });
    }
  }
  function groupForMonth(month) {
    for (var i = 0; i < groups.length; i++) {
      var group = groups[i], year = Number(month.slice(0, 4)), number = Number(month.slice(5, 7));
      if (year === group.year && number >= group.first && number <= group.last) return i;
    }
    return 0;
  }
  function scrollToMonth(month) {
    var row = document.getElementById('cityu-row-' + month);
    if (row) {
      var jump = document.getElementById('cityu-jump-month');
      if (jump) jump.value = month;
      row.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }
  function selectCourse(index, scroll) {
    index = Number(index);
    if (index !== -1 && !courses[index]) return;
    state.course = index;
    var details = courseData(index), first = details && details.classes && details.classes[0] || details && details.periodStart;
    if (first) state.group = groupForMonth(first.slice(0, 7));
    render(true);
    if (scroll && first) scrollToMonth(first.slice(0, 7));
  }
  function init(courseList, scheduleData) {
    app = document.getElementById('calendarApp');
    if (!app) return;
    courses = courseList; schedule = scheduleData;
    app.setAttribute('data-no-translate', '');
    app.innerHTML = '<div class="cityu-calendar-view"></div><p class="cityu-sr-only" role="status" aria-live="polite" aria-atomic="true"></p>';
    view = app.querySelector('.cityu-calendar-view'); status = app.querySelector('[role="status"]');
    app.addEventListener('change', function (event) {
      if (event.target.id === 'cityu-course-filter') selectCourse(event.target.value, false);
      else if (event.target.id === 'cityu-jump-month') scrollToMonth(event.target.value);
    });
    app.addEventListener('click', function (event) {
      var group = event.target.closest('[data-cityu-group]');
      if (group) {
        state.group = Number(group.getAttribute('data-cityu-group')); render(true);
        var selected = document.getElementById('cityu-period-' + state.group);
        if (selected) selected.focus({ preventScroll: true });
      }
    });
    app.addEventListener('keydown', function (event) {
      var tab = event.target.closest('[data-cityu-group]');
      if (!tab || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) < 0) return;
      event.preventDefault();
      var next = event.key === 'Home' ? 0 : event.key === 'End' ? groups.length - 1 : (Number(tab.getAttribute('data-cityu-group')) + (event.key === 'ArrowRight' ? 1 : -1) + groups.length) % groups.length;
      state.group = next; render(true);
      document.getElementById('cityu-period-' + next).focus({ preventScroll: true });
    });
    render(false);
  }
  window.CraftAICalendar = {
    init: init,
    setLang: function (lang) { state.lang = lang === 'zh' ? 'zh' : 'en'; render(false); },
    showCourse: function (index) { selectCourse(index, true); }
  };
})();
