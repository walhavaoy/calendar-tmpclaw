(function () {
  'use strict';

  /* ========== Constants ========== */
  var API_BASE = '/api';
  var SWATCH_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#F39C12', '#1ABC9C'];
  var MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  var MAX_VISIBLE_EVENTS = 3;
  var STORAGE_KEY_CALENDARS = 'calendar_calendars';
  var STORAGE_KEY_HIDDEN = 'calendar_hidden_ids';

  /* ========== Utilities ========== */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function padDate(y, m, d) {
    return y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }

  function todayStr() {
    var d = new Date();
    return padDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function ref(name) {
    return document.querySelector('[data-ref="' + name + '"]');
  }

  function generateId() {
    return 'loc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  /* ========== API client ========== */
  var requestCounter = 0;

  function apiGet(path) {
    return fetch(API_BASE + path).then(function (res) {
      if (!res.ok) throw new Error('API GET ' + path + ' returned ' + res.status);
      return res.json();
    });
  }

  function apiPost(path, body) {
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (res) {
      if (!res.ok) throw new Error('API POST ' + path + ' returned ' + res.status);
      return res.json();
    });
  }

  function apiPut(path, body) {
    return fetch(API_BASE + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (res) {
      if (!res.ok) throw new Error('API PUT ' + path + ' returned ' + res.status);
      return res.json();
    });
  }

  function apiDelete(path) {
    return fetch(API_BASE + path, { method: 'DELETE' }).then(function (res) {
      if (!res.ok) throw new Error('API DELETE ' + path + ' returned ' + res.status);
      return res;
    });
  }

  /* ========== State ========== */
  var state = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(), // 0-based
    calendars: [],
    events: [],
    hiddenCalendarIds: new Set(),
    editingEvent: null, // null = create, object = edit
    newCalFormOpen: false,
    selectedSwatch: SWATCH_COLORS[0],
    deleteConfirm: false,
  };

  /* ========== Persistence (calendars in localStorage) ========== */
  function loadCalendars() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_CALENDARS);
      if (raw) {
        state.calendars = JSON.parse(raw);
      }
    } catch (_e) { /* ignore */ }
    if (!state.calendars.length) {
      state.calendars = [
        { id: 'cal-family', name: 'Family', color: '#E74C3C' },
        { id: 'cal-work', name: 'Work', color: '#3498DB' },
        { id: 'cal-school', name: 'School', color: '#2ECC71' },
        { id: 'cal-personal', name: 'Personal', color: '#9B59B6' },
      ];
      saveCalendars();
    }
  }

  function saveCalendars() {
    try {
      localStorage.setItem(STORAGE_KEY_CALENDARS, JSON.stringify(state.calendars));
    } catch (_e) { /* ignore */ }
  }

  function loadHidden() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_HIDDEN);
      if (raw) {
        state.hiddenCalendarIds = new Set(JSON.parse(raw));
      }
    } catch (_e) { /* ignore */ }
  }

  function saveHidden() {
    try {
      localStorage.setItem(STORAGE_KEY_HIDDEN, JSON.stringify(Array.from(state.hiddenCalendarIds)));
    } catch (_e) { /* ignore */ }
  }

  /* ========== Event data helpers ========== */

  /** Map API event to internal shape with calendar_id, date, etc. */
  function normalizeEvent(apiEvt) {
    var st = new Date(apiEvt.start_time);
    var et = new Date(apiEvt.end_time);
    var dateStr = padDate(st.getFullYear(), st.getMonth() + 1, st.getDate());
    var startTime = String(st.getHours()).padStart(2, '0') + ':' + String(st.getMinutes()).padStart(2, '0');
    var endTime = String(et.getHours()).padStart(2, '0') + ':' + String(et.getMinutes()).padStart(2, '0');
    var allDay = (startTime === '00:00' && endTime === '23:59');
    // calendar_id stored in created_by field (re-purpose for frontend grouping)
    var calId = apiEvt.calendar_id || apiEvt.created_by || state.calendars[0].id;
    return {
      id: apiEvt.id,
      title: apiEvt.title,
      calendarId: calId,
      date: dateStr,
      startTime: startTime,
      endTime: endTime,
      allDay: allDay,
      description: apiEvt.description || '',
      location: apiEvt.location || '',
    };
  }

  function getCalendarColor(calId) {
    for (var i = 0; i < state.calendars.length; i++) {
      if (state.calendars[i].id === calId) return state.calendars[i].color;
    }
    return SWATCH_COLORS[0];
  }

  /* ========== Fetch events from API ========== */
  function fetchEvents() {
    var reqId = ++requestCounter;
    var y = state.currentYear;
    var m = state.currentMonth + 1;
    var from = padDate(y, m, 1) + 'T00:00:00';
    // compute last day of month
    var lastDay = new Date(y, m, 0).getDate();
    var to = padDate(y, m, lastDay) + 'T23:59:59';
    return apiGet('/events?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to))
      .then(function (data) {
        if (reqId !== requestCounter) return; // stale response
        state.events = (data.events || []).map(normalizeEvent);
        renderMonth();
      })
      .catch(function () {
        if (reqId !== requestCounter) return;
        state.events = [];
        renderMonth();
      });
  }

  /* ========== Rendering ========== */
  function renderMonth() {
    var year = state.currentYear;
    var month = state.currentMonth;

    // Update label
    ref('month-label').textContent = MONTH_NAMES[month] + ' ' + year;

    // First day of month (0=Sun, convert to Mon=0)
    var firstDow = new Date(year, month, 1).getDay();
    var leadingDays = (firstDow + 6) % 7; // Mon-based offset
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var totalCells = leadingDays + daysInMonth;
    var trailingDays = (7 - (totalCells % 7)) % 7;
    totalCells += trailingDays;

    // Previous month info
    var prevDays = new Date(year, month, 0).getDate();

    var today = todayStr();
    var html = '';

    for (var i = 0; i < totalCells; i++) {
      var dayNum, dateStr, cls;

      if (i < leadingDays) {
        dayNum = prevDays - leadingDays + 1 + i;
        // month is 0-based, so when month > 0, its value equals the 1-based previous month number
        var pm = month === 0 ? 12 : month;
        var py = month === 0 ? year - 1 : year;
        dateStr = padDate(py, pm, dayNum);
        cls = 'day out';
      } else if (i >= leadingDays + daysInMonth) {
        dayNum = i - leadingDays - daysInMonth + 1;
        var nm = month + 2 > 12 ? 1 : month + 2;
        var ny = month + 2 > 12 ? year + 1 : year;
        dateStr = padDate(ny, nm, dayNum);
        cls = 'day out';
      } else {
        dayNum = i - leadingDays + 1;
        dateStr = padDate(year, month + 1, dayNum);
        cls = 'day';
        if (dateStr === today) cls += ' today';
      }

      // Events for this date
      var dayEvents = [];
      for (var e = 0; e < state.events.length; e++) {
        var ev = state.events[e];
        if (ev.date === dateStr && !state.hiddenCalendarIds.has(ev.calendarId)) {
          dayEvents.push(ev);
        }
      }

      html += '<div class="' + cls + '" data-testid="calendar-grid-day" data-date="' + dateStr + '">';
      html += '<div class="day-hdr"><span class="dn">' + dayNum + '</span></div>';

      var visible = Math.min(dayEvents.length, MAX_VISIBLE_EVENTS);
      for (var j = 0; j < visible; j++) {
        var de = dayEvents[j];
        var color = escapeHtml(getCalendarColor(de.calendarId));
        html += '<div class="evt" data-event-id="' + escapeHtml(de.id) + '">';
        html += '<span class="bar" style="background:' + color + '"></span>';
        html += '<span>' + escapeHtml(de.title) + '</span>';
        html += '</div>';
      }
      if (dayEvents.length > MAX_VISIBLE_EVENTS) {
        html += '<span class="more-link" data-date="' + dateStr + '">+' + (dayEvents.length - MAX_VISIBLE_EVENTS) + ' more</span>';
      }

      html += '</div>';
    }

    ref('grid').innerHTML = html;
  }

  function renderSidebar() {
    var html = '';
    for (var i = 0; i < state.calendars.length; i++) {
      var cal = state.calendars[i];
      var checked = state.hiddenCalendarIds.has(cal.id) ? '' : ' checked';
      html += '<div class="cal-row" data-testid="calendar-sidebar-item" data-cal-id="' + escapeHtml(cal.id) + '">';
      html += '<span class="dot" style="background:' + escapeHtml(cal.color) + '"></span>';
      html += '<span class="name">' + escapeHtml(cal.name) + '</span>';
      html += '<input type="checkbox" data-testid="calendar-sidebar-toggle" data-action="toggle-calendar" data-cal-id="' + escapeHtml(cal.id) + '"' + checked + '>';
      html += '</div>';
    }
    ref('calendar-list').innerHTML = html;

    // Swatches
    var swHtml = '';
    for (var s = 0; s < SWATCH_COLORS.length; s++) {
      var sel = SWATCH_COLORS[s] === state.selectedSwatch ? ' sel' : '';
      swHtml += '<div class="sw' + sel + '" data-action="select-swatch" data-color="' + SWATCH_COLORS[s] + '" style="background:' + SWATCH_COLORS[s] + '" tabindex="0" role="button" aria-label="Color ' + SWATCH_COLORS[s] + '"></div>';
    }
    ref('swatches').innerHTML = swHtml;
  }

  function renderAll() {
    renderMonth();
    renderSidebar();
  }

  /* ========== Modal ========== */
  function openModal(evt) {
    state.editingEvent = evt || null;
    state.deleteConfirm = false;
    var overlay = ref('modal-overlay');
    var titleEl = ref('modal-evt-title');
    var calSelect = ref('modal-evt-calendar');
    var dateEl = ref('modal-evt-date');
    var startEl = ref('modal-evt-start');
    var endEl = ref('modal-evt-end');
    var allDayEl = ref('modal-evt-allday');
    var locationEl = ref('modal-evt-location');
    var notesEl = ref('modal-evt-notes');
    var delBtn = overlay.querySelector('[data-action="delete-event"]');
    var modalTitle = ref('modal-title');

    // Populate calendar dropdown
    var optHtml = '';
    for (var i = 0; i < state.calendars.length; i++) {
      var c = state.calendars[i];
      optHtml += '<option value="' + escapeHtml(c.id) + '">' + escapeHtml(c.name) + '</option>';
    }
    calSelect.innerHTML = optHtml;

    if (evt) {
      modalTitle.textContent = 'Edit Event';
      titleEl.value = evt.title;
      calSelect.value = evt.calendarId;
      dateEl.value = evt.date;
      startEl.value = evt.startTime;
      endEl.value = evt.endTime;
      allDayEl.checked = evt.allDay;
      locationEl.value = evt.location;
      notesEl.value = evt.description;
      delBtn.classList.remove('hidden');
      delBtn.textContent = 'Delete';
    } else {
      modalTitle.textContent = 'New Event';
      titleEl.value = '';
      calSelect.value = state.calendars[0] ? state.calendars[0].id : '';
      dateEl.value = todayStr();
      startEl.value = '09:00';
      endEl.value = '10:00';
      allDayEl.checked = false;
      locationEl.value = '';
      notesEl.value = '';
      delBtn.classList.add('hidden');
    }

    updateTimeRowVisibility();
    overlay.classList.remove('hidden');
    titleEl.focus();
  }

  function closeModal() {
    ref('modal-overlay').classList.add('hidden');
    state.editingEvent = null;
    state.deleteConfirm = false;
  }

  function updateTimeRowVisibility() {
    var allDay = ref('modal-evt-allday').checked;
    var timeRow = ref('time-row');
    if (allDay) {
      timeRow.classList.add('hidden');
    } else {
      timeRow.classList.remove('hidden');
    }
  }

  /* ========== Save / Delete events ========== */
  function saveEvent() {
    var titleVal = ref('modal-evt-title').value.trim();
    if (!titleVal) {
      ref('modal-evt-title').style.borderColor = '#c0392b';
      return;
    }
    ref('modal-evt-title').style.borderColor = '';

    var calId = ref('modal-evt-calendar').value;
    var dateVal = ref('modal-evt-date').value;
    var allDay = ref('modal-evt-allday').checked;
    var startTime = allDay ? '00:00' : ref('modal-evt-start').value;
    var endTime = allDay ? '23:59' : ref('modal-evt-end').value;

    if (!dateVal) return;

    // Validate start < end for non-allday
    // Lexicographic comparison works for HH:MM format
    if (!allDay && startTime >= endTime) {
      ref('modal-evt-end').style.borderColor = '#c0392b';
      return;
    }
    ref('modal-evt-end').style.borderColor = '';

    var startISO = dateVal + 'T' + startTime + ':00';
    var endISO = dateVal + 'T' + endTime + ':00';

    var payload = {
      title: titleVal,
      start_time: startISO,
      end_time: endISO,
      calendar_id: calId,
      description: ref('modal-evt-notes').value.trim(),
      location: ref('modal-evt-location').value.trim(),
    };

    var evt = state.editingEvent;
    var promise;
    if (evt) {
      promise = apiPut('/events/' + evt.id, payload);
    } else {
      promise = apiPost('/events', payload);
    }

    promise
      .then(function () {
        closeModal();
        return fetchEvents();
      })
      .catch(function () {
        // Fallback: save locally
        if (evt) {
          evt.title = titleVal;
          evt.calendarId = calId;
          evt.date = dateVal;
          evt.startTime = startTime;
          evt.endTime = endTime;
          evt.allDay = allDay;
          evt.description = payload.description;
          evt.location = payload.location;
        } else {
          state.events.push({
            id: generateId(),
            title: titleVal,
            calendarId: calId,
            date: dateVal,
            startTime: startTime,
            endTime: endTime,
            allDay: allDay,
            description: payload.description,
            location: payload.location,
          });
        }
        closeModal();
        renderMonth();
      });
  }

  function deleteEvent() {
    var evt = state.editingEvent;
    if (!evt) return;

    if (!state.deleteConfirm) {
      state.deleteConfirm = true;
      ref('modal-overlay').querySelector('[data-action="delete-event"]').textContent = 'Confirm?';
      return;
    }

    apiDelete('/events/' + evt.id)
      .then(function () {
        closeModal();
        return fetchEvents();
      })
      .catch(function () {
        // Fallback: remove locally
        state.events = state.events.filter(function (e) { return e.id !== evt.id; });
        closeModal();
        renderMonth();
      });
  }

  /* ========== Calendar CRUD ========== */
  function saveNewCalendar() {
    var nameInput = ref('new-cal-name');
    var name = nameInput.value.trim();
    if (!name) {
      nameInput.style.borderColor = '#c0392b';
      return;
    }
    nameInput.style.borderColor = '';

    state.calendars.push({
      id: generateId(),
      name: name,
      color: state.selectedSwatch,
    });
    saveCalendars();
    nameInput.value = '';
    state.newCalFormOpen = false;
    ref('new-calendar-form').classList.add('hidden');
    renderSidebar();
  }

  /* ========== Navigation ========== */
  function prevMonth() {
    if (state.currentMonth === 0) {
      state.currentMonth = 11;
      state.currentYear--;
    } else {
      state.currentMonth--;
    }
    fetchEvents();
  }

  function nextMonth() {
    if (state.currentMonth === 11) {
      state.currentMonth = 0;
      state.currentYear++;
    } else {
      state.currentMonth++;
    }
    fetchEvents();
  }

  /* ========== Event delegation ========== */
  function findAction(target) {
    var el = target;
    while (el && el !== document.body) {
      if (el.dataset && el.dataset.action) return { action: el.dataset.action, el: el };
      el = el.parentElement;
    }
    return null;
  }

  function findEventId(target) {
    var el = target;
    while (el && el !== document.body) {
      if (el.dataset && el.dataset.eventId) return el.dataset.eventId;
      el = el.parentElement;
    }
    return null;
  }

  function findDateFromCell(target) {
    var el = target;
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains('day') && el.dataset.date) return el.dataset.date;
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener('click', function (e) {
    var hit = findAction(e.target);
    if (hit) {
      switch (hit.action) {
        case 'prev-month':
          prevMonth();
          return;
        case 'next-month':
          nextMonth();
          return;
        case 'toggle-sidebar':
          document.body.classList.toggle('sidebar-open');
          return;
        case 'close-sidebar':
          document.body.classList.remove('sidebar-open');
          return;
        case 'logout':
          window.location.href = '/logout';
          return;
        case 'show-new-calendar':
          state.newCalFormOpen = !state.newCalFormOpen;
          ref('new-calendar-form').classList.toggle('hidden', !state.newCalFormOpen);
          if (state.newCalFormOpen) ref('new-cal-name').focus();
          return;
        case 'save-calendar':
          saveNewCalendar();
          return;
        case 'select-swatch':
          state.selectedSwatch = hit.el.dataset.color;
          renderSidebar();
          return;
        case 'new-event':
          openModal(null);
          return;
        case 'close-modal':
          closeModal();
          return;
        case 'save-event':
          saveEvent();
          return;
        case 'delete-event':
          deleteEvent();
          return;
        default:
          break;
      }
    }

    // Click on event pill
    var evtId = findEventId(e.target);
    if (evtId) {
      for (var i = 0; i < state.events.length; i++) {
        if (state.events[i].id === evtId) {
          openModal(state.events[i]);
          return;
        }
      }
    }

    // Click on modal overlay background
    if (e.target === ref('modal-overlay')) {
      closeModal();
      return;
    }

    // Click on day cell to create event for that date
    var dayDate = findDateFromCell(e.target);
    if (dayDate && e.target.classList && !e.target.classList.contains('evt') && !e.target.classList.contains('more-link') && !findEventId(e.target)) {
      var fakeEvt = null; // create mode
      openModal(fakeEvt);
      ref('modal-evt-date').value = dayDate;
    }
  });

  document.addEventListener('change', function (e) {
    var hit = findAction(e.target);
    if (hit && hit.action === 'toggle-calendar') {
      var calId = hit.el.dataset.calId;
      if (hit.el.checked) {
        state.hiddenCalendarIds.delete(calId);
      } else {
        state.hiddenCalendarIds.add(calId);
      }
      saveHidden();
      renderMonth();
      return;
    }

    // All-day toggle
    if (e.target === ref('modal-evt-allday')) {
      updateTimeRowVisibility();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !ref('modal-overlay').classList.contains('hidden')) {
      closeModal();
    }
    // Enter on swatch
    if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset && e.target.dataset.action === 'select-swatch') {
      e.preventDefault();
      state.selectedSwatch = e.target.dataset.color;
      renderSidebar();
    }
  });

  /* ========== Init ========== */
  function init() {
    loadCalendars();
    loadHidden();
    renderAll();
    fetchEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
