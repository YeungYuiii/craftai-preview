(function () {
  'use strict';
  var app, view, status, courses = [], schedule = { courses: [], events: [] };
  var state = { lang: 'en', month: '2027-01', course: -1, day: null };
  var months = [];
  for (var year = 2027; year <= 2028; year++) {
    for (var month = 1; month <= (year === 2028 ? 5 : 12); month++) {
      months.push(year + '-' + String(month).padStart(2, '0'));
    }
  }
  var copy = {
    en: {
      month: 'Month', course: 'Course', allCourses: 'All courses', previous: 'Previous month', next: 'Next month',
      monthAgenda: 'This month', dayAgenda: 'Selected date', allDates: 'Show all dates this month',
      noEvents: 'No scheduled sessions this month.', noEventsHint: 'Choose another month or course to see its dates.',
      viewCourse: 'View course', timeUnknown: 'Time to be confirmed', level: 'Level ',
      class: 'Class', practical: 'Compulsory practical', project: 'Project Day', exam: 'Exam',
      resit: 'Resit', report: 'Midterm report', reserve: 'Reserve day', briefing: 'External applicant briefing / make-up',
      shared: 'Shared Level ', legendClasses: 'Class / practical', legendAssessment: 'Assessment', legendOther: 'Reserve / briefing',
      event: 'event', events: 'events', weekdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    zh: {
      month: '月份', course: '課程', allCourses: '所有課程', previous: '上一個月', next: '下一個月',
      monthAgenda: '本月日程', dayAgenda: '所選日期', allDates: '顯示本月所有日期',
      noEvents: '本月未有已排定的課程活動。', noEventsHint: '請選擇其他月份或課程，查看相關日期。',
      viewCourse: '查看課程', timeUnknown: '時間待定', level: '第 ',
      class: '課堂', practical: '必修實習課', project: 'Project Day', exam: '考試',
      resit: '補考', report: '中期報告', reserve: '後備日', briefing: '外部申請者回校簡報／補做',
      shared: '共用：第 ', legendClasses: '課堂／實習', legendAssessment: '評核', legendOther: '後備／簡報',
      event: '項活動', events: '項活動', weekdays: ['一', '二', '三', '四', '五', '六', '日']
    }
  };
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function utcDate(iso) { return new Date(iso + 'T12:00:00Z'); }
  function formatDate(iso, options) {
    return new Intl.DateTimeFormat(state.lang === 'zh' ? 'zh-HK' : 'en-GB', Object.assign({ timeZone: 'UTC' }, options)).format(utcDate(iso));
  }
  function monthTitle(value) { return formatDate(value + '-01', { month: 'long', year: 'numeric' }); }
  function dateTitle(value) { return formatDate(value, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  function levelTitle(level, shared) {
    return (shared ? copy[state.lang].shared : copy[state.lang].level) + level + (state.lang === 'zh' ? ' 級' : '');
  }
  function eventLevel(event) { return event.courseIndex == null ? event.level : courses[event.courseIndex].lv; }
  function eventGroup(event) {
    return /^(class|practical)$/.test(event.kind) ? 'class' : /^(reserve|briefing)$/.test(event.kind) ? 'other' : 'assessment';
  }
  function courseData(index) {
    return schedule.courses.find(function (item) { return item.courseIndex === index; });
  }
  function eventLabel(event) {
    var label = copy[state.lang][event.kind] || event.kind;
    var item = courseData(event.courseIndex);
    if (event.kind === 'class' && item && item.classes) {
      var number = item.classes.indexOf(event.date) + 1;
      if (number) label += state.lang === 'zh' ? ' ' + number : ' ' + number;
    }
    return label;
  }
  function filteredEvents() {
    return schedule.events.filter(function (event) {
      if (event.date.slice(0, 7) !== state.month) return false;
      if (state.course === -1) return true;
      return event.courseIndex === state.course || (event.courseIndex == null && event.level === courses[state.course].lv);
    }).slice().sort(function (a, b) {
      return a.date.localeCompare(b.date) || (a.startTime || '99:99').localeCompare(b.startTime || '99:99') || String(a.kind).localeCompare(String(b.kind));
    });
  }
  function countLabel(count) {
    var t = copy[state.lang];
    return count + ' ' + (count === 1 ? t.event : t.events);
  }
  function timeLabel(event) {
    if (!event.startTime) return copy[state.lang].timeUnknown;
    return event.startTime + (event.endTime ? '–' + event.endTime : '');
  }
  function renderGrid(events) {
    var t = copy[state.lang], first = utcDate(state.month + '-01');
    var offset = (first.getUTCDay() + 6) % 7;
    var total = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    var rows = '', slots = Math.ceil((offset + total) / 7) * 7;
    for (var slot = 0; slot < slots; slot++) {
      if (slot % 7 === 0) rows += '<tr>';
      var day = slot - offset + 1;
      if (day < 1 || day > total) rows += '<td class="cal-empty" aria-hidden="true"></td>';
      else {
        var iso = state.month + '-' + String(day).padStart(2, '0');
        var daily = events.filter(function (event) { return event.date === iso; });
        var weekend = slot % 7 >= 5 ? ' cal-weekend' : '';
        if (daily.length) {
          var markers = daily.map(function (event) {
            var shortCode = event.courseIndex == null ? 'L' + event.level : courses[event.courseIndex].code.replace('BFAI ', '');
            return '<span class="cal-mini-event cal-level-' + eventLevel(event) + '"><i class="cal-mark cal-mark--' + eventGroup(event) + '" aria-hidden="true"></i><span class="cal-short-code" aria-hidden="true">' + esc(shortCode) + '</span></span>';
          }).join('');
          rows += '<td class="cal-has-events' + weekend + '"><button type="button" class="cal-day' + (state.day === iso ? ' cal-day-selected' : '') + '" data-cal-date="' + iso + '" aria-pressed="' + (state.day === iso ? 'true' : 'false') + '" aria-label="' + esc(dateTitle(iso) + ': ' + countLabel(daily.length)) + '" aria-controls="cal-agenda"><span class="cal-day-number">' + day + '</span><span class="cal-day-events">' + markers + '</span></button></td>';
        } else rows += '<td class="cal-no-events' + weekend + '"><span class="cal-day-number">' + day + '</span></td>';
      }
      if (slot % 7 === 6) rows += '</tr>';
    }
    return '<table class="cal-table"><caption class="cal-sr-only">' + esc(monthTitle(state.month)) + '</caption><thead><tr>' + t.weekdays.map(function (day) { return '<th scope="col">' + day + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }
  function renderAgenda(events) {
    var t = copy[state.lang];
    var shown = state.day ? events.filter(function (event) { return event.date === state.day; }) : events;
    var heading = '<div class="cal-agenda-heading"><h3>' + (state.day ? t.dayAgenda : t.monthAgenda) + '</h3><span>' + esc(countLabel(shown.length)) + '</span></div>';
    if (state.day) heading += '<button type="button" class="cal-clear-day" data-cal-clear="true">' + t.allDates + ' ↗</button>';
    if (!shown.length) return heading + '<div class="cal-empty-state"><strong>' + t.noEvents + '</strong><p>' + t.noEventsHint + '</p></div>';
    var dates = [];
    shown.forEach(function (event) { if (dates.indexOf(event.date) < 0) dates.push(event.date); });
    return heading + '<ol class="cal-agenda-days">' + dates.map(function (date) {
      return '<li class="cal-agenda-day"><h4><time datetime="' + date + '">' + esc(dateTitle(date)) + '</time></h4><ul class="cal-event-list">' + shown.filter(function (event) { return event.date === date; }).map(function (event) {
        var course = event.courseIndex == null ? null : courses[event.courseIndex];
        return '<li class="cal-event cal-level-' + eventLevel(event) + '"><div class="cal-event-meta"><span class="cal-event-type"><i class="cal-mark cal-mark--' + eventGroup(event) + '" aria-hidden="true"></i>' + esc(eventLabel(event)) + '</span><span class="cal-event-time">' + esc(timeLabel(event)) + '</span></div><strong class="cal-event-code">' + esc(course ? course.code : levelTitle(event.level, true)) + '</strong>' + (course ? '<p>' + esc(course[state.lang].title) + '</p><button type="button" class="cal-course-link" data-i="' + event.courseIndex + '">' + t.viewCourse + ' ↑</button>' : '') + '</li>';
      }).join('') + '</ul></li>';
    }).join('') + '</ol>';
  }
  function rememberFocus() {
    var active = document.activeElement;
    if (!active || !app.contains(active)) return null;
    if (active.id) return '#' + active.id;
    if (active.hasAttribute('data-cal-date')) return '[data-cal-date="' + active.getAttribute('data-cal-date') + '"]';
    if (active.hasAttribute('data-cal-move')) return '[data-cal-move="' + active.getAttribute('data-cal-move') + '"]';
    if (active.hasAttribute('data-cal-clear')) return '#cal-month';
    return null;
  }
  function render(announce) {
    if (!app || !view) return;
    var t = copy[state.lang], events = filteredEvents(), monthIndex = months.indexOf(state.month), focus = rememberFocus();
    view.innerHTML = '<div class="cal-toolbar"><div class="cal-month-controls"><button type="button" class="cal-arrow" data-cal-move="-1" aria-label="' + t.previous + '"' + (monthIndex === 0 ? ' disabled' : '') + '>←</button><label class="cal-select-wrap"><span>' + t.month + '</span><select id="cal-month">' + months.map(function (month) { return '<option value="' + month + '"' + (month === state.month ? ' selected' : '') + '>' + esc(monthTitle(month)) + '</option>'; }).join('') + '</select></label><button type="button" class="cal-arrow" data-cal-move="1" aria-label="' + t.next + '"' + (monthIndex === months.length - 1 ? ' disabled' : '') + '>→</button></div><label class="cal-select-wrap cal-course-filter"><span>' + t.course + '</span><select id="cal-course"><option value="-1">' + t.allCourses + '</option>' + courses.map(function (course, index) { return '<option value="' + index + '"' + (state.course === index ? ' selected' : '') + '>' + esc(course.code + ' · ' + course[state.lang].title) + '</option>'; }).join('') + '</select></label></div><div class="cal-layout"><div class="cal-month-panel"><h3 class="cal-month-title">' + esc(monthTitle(state.month)) + '</h3>' + renderGrid(events) + '<div class="cal-kind-legend"><span><i class="cal-mark cal-mark--class" aria-hidden="true"></i>' + t.legendClasses + '</span><span><i class="cal-mark cal-mark--assessment" aria-hidden="true"></i>' + t.legendAssessment + '</span><span><i class="cal-mark cal-mark--other" aria-hidden="true"></i>' + t.legendOther + '</span></div><div class="cal-level-legend">' + [1, 2, 3, 4, 5].map(function (level) { return '<span class="cal-level-' + level + '"><i aria-hidden="true"></i>' + esc(levelTitle(level, false)) + '</span>'; }).join('') + '</div></div><div class="cal-agenda" id="cal-agenda">' + renderAgenda(events) + '</div></div>';
    if (announce) status.textContent = monthTitle(state.month) + ', ' + countLabel(events.length) + (state.day ? ', ' + dateTitle(state.day) : '');
    if (focus) {
      var target = view.querySelector(focus);
      if (!target || target.disabled) target = view.querySelector('#cal-month');
      if (target) target.focus({ preventScroll: true });
    }
  }
  function showCourse(index) {
    index = Number(index);
    if (!app || !courses[index]) return;
    var details = courseData(index);
    state.course = index;
    state.month = (details && details.classes && details.classes[0] ? details.classes[0] : details && details.periodStart ? details.periodStart : '2027-01-01').slice(0, 7);
    state.day = null;
    render(true);
    var section = document.getElementById('academic-calendar');
    if (section) section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  function init(courseList, scheduleData) {
    app = document.getElementById('calendarApp');
    if (!app) return;
    courses = courseList;
    schedule = scheduleData;
    app.setAttribute('data-no-translate', '');
    app.innerHTML = '<div class="cal-view"></div><p class="cal-sr-only" role="status" aria-live="polite" aria-atomic="true"></p>';
    view = app.querySelector('.cal-view');
    status = app.querySelector('[role="status"]');
    app.addEventListener('change', function (event) {
      if (event.target.id === 'cal-month') {
        state.month = event.target.value;
        state.day = null;
        render(true);
      } else if (event.target.id === 'cal-course') {
        state.course = Number(event.target.value);
        state.day = null;
        var details = courseData(state.course);
        if (details && details.classes && details.classes[0]) state.month = details.classes[0].slice(0, 7);
        render(true);
      }
    });
    app.addEventListener('click', function (event) {
      var move = event.target.closest('[data-cal-move]');
      var day = event.target.closest('[data-cal-date]');
      if (move) {
        var next = months.indexOf(state.month) + Number(move.getAttribute('data-cal-move'));
        if (next < 0 || next >= months.length) return;
        state.month = months[next]; state.day = null; render(true);
      } else if (day) {
        var chosen = day.getAttribute('data-cal-date');
        state.day = state.day === chosen ? null : chosen; render(true);
      } else if (event.target.closest('[data-cal-clear]')) {
        state.day = null; render(true);
      }
    });
    render(false);
  }
  window.CraftAICalendar = {
    init: init,
    setLang: function (lang) { state.lang = lang === 'zh' ? 'zh' : 'en'; render(false); },
    showCourse: showCourse
  };
})();
