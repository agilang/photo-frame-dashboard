// Home / Today: the glanceable overview. Never scrolls.
(function () {
  'use strict';
  var D = window.DATA, V = {};
  var weatherForecastMode = 'hourly';

  function weatherForecastLabel() {
    return weatherForecastMode === 'daily' ? 'Daily forecast' : 'Hourly forecast';
  }

  function clock() {
    var n = App.now();
    var hour = n.getHours();
    var greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return '<div class="h-greeting"><span>HOME HQ</span><b>' + greeting + '</b></div>' +
      '<div class="h-time num">' + App.fmt.time(n, false) + '<span class="h-ampm">' + App.fmt.ampm(n) + '</span></div>' +
      '<div class="h-date"><b>' + App.fmt.day(n) + '</b> ' + App.fmt.month(n) + ' ' + n.getDate() + '</div>' +
      '<div class="h-timer-summary" data-home-timer-summary hidden></div>';
  }

  function weather() {
    var w = App.weatherNow();
    var weatherPrefs = window.DASHBOARD_INTEGRATIONS.weatherSettings;
    var hours = App.hourly(7);
    var tmin = Math.min.apply(null, hours.map(function (h) { return h.t; }));
    var tmax = Math.max.apply(null, hours.map(function (h) { return h.t; }));
    return '<span class="h-wx-action">' + weatherForecastLabel() + ' ' + App.icon('right', 16) + '</span>' +
      '<div class="h-wx-top">' +
      '<span class="h-wx-icon" data-weather-cond="' + App.esc(w.cond) + '">' + App.icon(w.cond, 60) + '</span>' +
      '<span class="h-wx-temp num">' + window.DASHBOARD_INTEGRATIONS.temperature(w.temp) + '°</span>' +
      '<span class="h-wx-meta"><b>' + w.label + '</b><span>H ' + window.DASHBOARD_INTEGRATIONS.temperature(w.hi) + '°  L ' + window.DASHBOARD_INTEGRATIONS.temperature(w.lo) + '° · ' + weatherPrefs.unit + '</span><span class="h-wx-location">' + App.esc(w.location || 'Austin, TX 78701') + '</span></span>' +
      '</div>' +
      '<div class="h-wx-say"><b>' + w.summary + '.</b> ' + w.advice + '.</div>' +
      '<div class="h-wx-hours">' + hours.map(function (h) {
        var lift = tmax === tmin ? 0 : Math.round((h.t - tmin) / (tmax - tmin) * 8);
        return '<div class="h-hr' + (h.p >= 50 ? ' is-wet' : '') + '" data-weather-cond="' + App.esc(h.c) + '"><span class="h-hr-l">' + h.label + '</span>' +
          '<span class="h-hr-i" style="--wx-lift:' + -lift + 'px">' + App.icon(h.c, 22) + '</span><b>' + window.DASHBOARD_INTEGRATIONS.temperature(h.t) + '°</b></div>';
      }).join('') + '</div>';
  }

  function paintWeatherCard() {
    if (!V.el) return;
    var card = V.el.querySelector('.h-weather');
    card.innerHTML = weather();
    card.setAttribute('aria-label', 'Open ' + weatherForecastLabel().toLowerCase());
  }

  function forecastDayLabel(day, index) {
    if (index === 0) return 'Today';
    var date = day.date
      ? new Date(day.date + 'T12:00:00')
      : App.addDays(App.now(), day.offset == null ? index : day.offset);
    return App.fmt.dayShort(date) + ' ' + date.getDate();
  }

  function weatherSheet() {
    var w = App.weatherNow();
    var hours = App.hourly(12);
    var api = window.DASHBOARD_INTEGRATIONS;
    var prefs = api.weatherSettings;
    var dailyForecast = D.weather.days || [];
    var isDaily = weatherForecastMode === 'daily';
    var cities = prefs.cities.map(function (city, index) {
      return '<div class="weather-city' + (index === prefs.activeCity ? ' is-active' : '') + '">' +
        '<button class="weather-city-name" data-weather-city="' + index + '">' +
        '<b>' + App.esc(city.name) + '</b><small>' + (index === prefs.activeCity ? 'Current forecast' : 'Show forecast') + '</small></button>' +
        '<button class="weather-city-remove" data-weather-remove="' + index + '" aria-label="Remove ' + App.esc(city.name) + '"' + (prefs.cities.length === 1 ? ' disabled' : '') + '>×</button></div>';
    }).join('');
    var forecastDetails = isDaily
      ? (dailyForecast.length ? dailyForecast.map(function (day, index) {
        return '<div class="h-wx-day" data-weather-cond="' + App.esc(day.c) + '"><b>' + App.esc(forecastDayLabel(day, index)) + '</b>' +
          App.icon(day.c, 26) + '<div class="h-wx-day-temps"><span>L ' + api.temperature(day.lo) + '°</span><strong>H ' +
          api.temperature(day.hi) + '°</strong></div><small>' +
          (day.p == null ? 'Rain chance unavailable' : day.p + '% rain') + '</small></div>';
      }).join('') : '<p class="weather-error">Daily forecast is unavailable.</p>')
      : hours.map(function (h) {
        return '<div class="h-wx-hour" data-weather-cond="' + App.esc(h.c) + '"><b>' + App.esc(h.label) + '</b>' + App.icon(h.c, 24) +
          '<span>' + api.temperature(h.t) + '°</span><small>' + h.p + '% rain</small></div>';
      }).join('');
    App.sheet('<div class="sheet-pad h-wx-sheet"><div class="label">' + App.icon(w.cond, 18) + App.esc(w.location || 'Local forecast') + '</div>' +
      '<h2 class="serif sheet-h">' + (isDaily ? '7-day forecast' : 'Hourly forecast') + '</h2><p class="sheet-p h-wx-summary">' +
      '<b>' + api.temperature(w.temp) + '°' + prefs.unit + ' · ' + App.esc(w.label) + '</b> · High ' + api.temperature(w.hi) + '° / Low ' + api.temperature(w.lo) + '° · ' + App.esc(w.summary) + '. ' + App.esc(w.advice) + '.</p>' +
      '<div class="weather-settings"><div class="weather-setting-head"><b>Temperature</b><div class="seg"><button type="button" data-weather-unit="C"' + (prefs.unit === 'C' ? ' class="is-on"' : '') + '>°C</button><button type="button" data-weather-unit="F"' + (prefs.unit === 'F' ? ' class="is-on"' : '') + '>°F</button></div></div>' +
      '<div class="weather-setting-head"><b>Saved cities</b><span>' + prefs.cities.length + ' / 8</span></div>' +
      '<div class="weather-city-list">' + cities + '</div>' +
      '<form class="weather-search" data-weather-search-form><input type="search" maxlength="100" placeholder="Add a city, e.g. Toronto" aria-label="Search for a city"><button class="btn btn--solid" type="submit">Search</button></form>' +
      '<div class="weather-search-results" data-weather-results></div>' +
      (api.weatherSettingsError ? '<p class="weather-error">' + App.esc(api.weatherSettingsError) + '</p>' : '') +
      '</div><div class="weather-view-head"><div class="seg" role="group" aria-label="Forecast view">' +
      '<button type="button" data-weather-mode="hourly" aria-pressed="' + (!isDaily) + '"' + (!isDaily ? ' class="is-on"' : '') + '>Hourly</button>' +
      '<button type="button" data-weather-mode="daily" aria-pressed="' + isDaily + '"' + (isDaily ? ' class="is-on"' : '') + '>Daily</button>' +
      '</div><span>' + (isDaily ? 'Next 7 days' : 'Next 12 hours') + '</span></div>' +
      '<div class="h-wx-detail' + (isDaily ? ' is-daily' : '') + '">' + forecastDetails + '</div><div class="h-wx-source">' +
      (api.status.weather ? 'Live forecast · refreshes automatically' : 'Sample forecast · connect a weather provider for live conditions') +
      (api.weatherError ? ' · ' + App.esc(api.weatherError) : '') +
      '</div></div>', {
      cls: 'sheet--wide',
      onMount: function (sheet) {
        var results = [];
        sheet.addEventListener('click', function (event) {
          var modeButton = event.target.closest('[data-weather-mode]');
          if (modeButton) {
            weatherForecastMode = modeButton.dataset.weatherMode;
            paintWeatherCard();
            weatherSheet();
            return;
          }
          var button = event.target.closest('[data-weather-unit]');
          if (button) {
            api.setWeatherUnit(button.dataset.weatherUnit).then(weatherSheet).catch(function (error) {
              App.toast(App.esc(error.message), { tone: 'error', icon: 'check' });
            });
            return;
          }
          button = event.target.closest('[data-weather-city]');
          if (button) {
            api.selectWeatherCity(Number(button.dataset.weatherCity)).then(weatherSheet).catch(function (error) {
              App.toast(App.esc(error.message), { tone: 'error', icon: 'check' });
            });
            return;
          }
          button = event.target.closest('[data-weather-remove]');
          if (button) {
            api.removeWeatherCity(Number(button.dataset.weatherRemove)).then(weatherSheet).catch(function (error) {
              App.toast(App.esc(error.message), { tone: 'error', icon: 'check' });
            });
            return;
          }
          button = event.target.closest('[data-weather-add-result]');
          if (button) {
            api.addWeatherCity(results[Number(button.dataset.weatherAddResult)]).then(weatherSheet).catch(function (error) {
              App.toast(App.esc(error.message), { tone: 'error', icon: 'check' });
            });
          }
        });
        sheet.addEventListener('submit', function (event) {
          if (!event.target.matches('[data-weather-search-form]')) return;
          event.preventDefault();
          var form = event.target;
          var button = form.querySelector('button[type="submit"]');
          var query = form.querySelector('input').value.trim();
          if (!query) { form.querySelector('input').focus(); return; }
          button.disabled = true;
          api.searchWeatherCities(query).then(function (found) {
            results = found;
            sheet.querySelector('[data-weather-results]').innerHTML = found.length
              ? found.map(function (place, index) {
                return '<button class="weather-result" type="button" data-weather-add-result="' + index + '"><span><b>' +
                  App.esc(place.name) + '</b><small>Add to saved cities</small></span><span class="weather-result-add">+</span></button>';
              }).join('')
              : '<p class="weather-error">No matching cities found.</p>';
          }).catch(function (error) {
            sheet.querySelector('[data-weather-results]').innerHTML = '<p class="weather-error">' + App.esc(error.message) + '</p>';
          }).then(function () { button.disabled = false; });
        });
      }
    });
  }

  function presence() {
    var homeCount = D.people.filter(function (person) { return person.home; }).length;
    return '<div class="h-presence-label"><span>FAMILY</span><b>' + homeCount + ' home</b></div>' + D.people.map(function (p) {
      var sub = p.home ? 'Home' : (p.eta ? '<b>ETA ' + p.eta + ' min</b>' : p.status);
      return '<div class="h-who' + (p.home ? ' is-home' : '') + '" style="' + App.pstyle(p) + '">' +
        App.avatar(p, 36, p.home ? '' : 'avatar--away') +
        '<span><b>' + p.name + '</b><small>' + sub + '</small></span></div>';
    }).join('');
  }

  // Events after today, soonest first, so empty days still show what's ahead.
  function upcoming(limit) {
    var now = App.now(), out = [];
    for (var d = 1; d <= 14 && out.length < limit; d++) {
      var day = App.addDays(now, d);
      App.allDayOn(day).concat(App.timedOn(day)).forEach(function (event) {
        if (out.length < limit) out.push({ event: event, day: day });
      });
    }
    return out;
  }

  function quickFacts() {
    var r = App.currentRoutine();
    var choresLeft = D.chores.filter(function (c) { return !c.done; }).length;
    var items = D.groceries.filter(function (g) { return !g.done; }).length;
    var home = D.people.filter(function (person) { return person.home; }).length;
    return '<div class="h-facts">' +
      '<span><b class="num">' + choresLeft + '</b>chores left</span>' +
      '<span><b class="num">' + items + '</b>to buy</span>' +
      '<span><b class="num">' + home + '/' + D.people.length + '</b>home</span></div>';
  }

  function hero() {
    var e = App.nextEvent(), now = App.now();
    if (!e) {
      var next = upcoming(1)[0];
      var meta = next
        ? 'Next: <b>' + App.esc(next.event.title) + '</b> · ' + App.fmt.rel(next.day) + (next.event.allDay ? '' : ' at ' + App.fmt.time(next.event.start))
        : 'Nothing planned for the next two weeks.';
      return '<div class="h-hero h-hero--empty" data-go="calendar">' +
        '<div class="label label--light">Rest of today</div>' +
        '<div class="h-hero-title serif">Nothing else scheduled. <i>Enjoy the quiet.</i></div>' +
        '<div class="h-hero-meta">' + meta + '</div>' + quickFacts() +
        '</div>';
    }
    var p = App.evColor(e);
    var mins = (e.start - now) / 60000;
    var leave = (App.leaveBy(e) - now) / 60000;
    var who = e.people.map(function (id) { return App.person(id).name; });
    var whoText = App.isFamily(e) ? 'Everyone' : who.join(' + ');
    var big = mins < 100
      ? '<div class="h-hero-count num">' + Math.round(mins) + '<small>min</small></div>'
      : '<div class="h-hero-count num">' + App.fmt.time(e.start, false) + '<small>' + App.fmt.ampm(e.start) + '</small></div>';
    var leavePill = '';
    if (e.travel) {
      leavePill = leave <= 0
        ? '<span class="pill pill--alert"><i class="pulse"></i>Leave now</span>'
        : '<span class="pill' + (leave <= 15 ? ' pill--soon' : '') + '">' + App.icon('car', 20) + 'Leave in ' + App.fmt.mins(leave) + '</span>';
    }
    return '<button class="h-hero" style="' + App.pstyle(p) + '" data-ev="' + e.id + '">' +
      '<div class="h-hero-main">' +
      '  <div class="label label--on">Next up · ' + App.esc(whoText) + '</div>' +
      '  <div class="h-hero-title serif">' + App.esc(e.title) + '</div>' +
      '  <div class="h-hero-meta">' + App.fmt.range(e.start, e.end) + (e.loc ? ' · ' + App.esc(e.loc) : '') + '</div>' +
      '  <div class="h-hero-foot">' + (e.people.length > 1 ? App.dots(e.people, 22) : '') + leavePill + '</div>' +
      '</div>' + big + '</button>';
  }

  function agenda() {
    var now = App.now();
    var today = App.allDayOn(now).concat(App.timedOn(now)).filter(function (event) {
      return event.allDay || event.end > now;
    }).sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var items = today.map(function (event) { return { event: event, day: now }; });
    var later = upcoming(14);
    var all = items.concat(later);
    var shown = all.length > 5 ? all.slice(0, 4) : all;
    var rows = shown.map(function (item) {
      var event = item.event, isToday = item.day === now;
      var current = isToday && !event.allDay && event.start <= now && event.end > now;
      var people = App.isFamily(event)
        ? 'Everyone'
        : event.people.map(function (id) { return App.person(id).name; }).join(' · ');
      var color = App.evColor(event);
      var when = event.allDay ? 'ALL DAY' : current ? 'NOW' : App.fmt.time(event.start, !isToday);
      var timeHtml = isToday ? when : '<em>' + App.fmt.rel(item.day).toUpperCase() + '</em>' + when;
      return '<button class="h-agenda-row' + (current ? ' is-now' : '') + (isToday ? '' : ' is-later') + '" data-ev="' + event.id + '">' +
        '<span class="h-agenda-time">' + timeHtml + '</span>' +
        '<span class="h-agenda-marker" style="' + App.pstyle(color) + '"></span>' +
        '<span class="h-agenda-copy"><b>' + App.esc(event.title) + '</b><small>' + App.esc(people) +
        (event.loc ? ' · ' + App.esc(event.loc) : '') +
        (!event.allDay ? ' · ' + App.fmt.range(event.start, event.end) : '') + '</small></span>' +
        '<span class="h-agenda-arrow">' + App.icon('right', 20) + '</span></button>';
    }).join('');
    if (!rows) {
      rows = '<div class="h-agenda-empty"><span class="h-agenda-empty-icon">' + App.icon('check', 26) +
        '</span><span><b>Your calendar is clear</b><small>Nothing planned for the next two weeks.</small></span></div>';
    } else if (all.length > shown.length) {
      rows += '<button class="h-agenda-more" data-go="calendar">See ' + (all.length - shown.length) + '+ more ' + App.icon('right', 18) + '</button>';
    }
    var sub = today.length ? today.length + (today.length === 1 ? ' event' : ' events') + ' left today' : 'Today is clear · showing what\u2019s next';
    return '<div class="h-agenda-head"><div><div class="label">' + sub.toUpperCase() + '</div><h2>Coming up</h2></div>' +
      '<button class="h-agenda-link" data-go="calendar">Full calendar ' + App.icon('right', 18) + '</button></div>' +
      '<div class="h-agenda-list">' + rows + '</div>';
  }

  function ring(done, total, size) {
    var r = size / 2 - 5, c = 2 * Math.PI * r, f = total ? done / total : 0;
    return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="ring-bg"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="ring-fg" stroke-dasharray="' + (c * f) + ' ' + c + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg>';
  }
  App.ring = ring;

  function chores() {
    var r = App.currentRoutine();
    var who = D.people.map(function (p) { return p.id; }).concat(['any']);
    return '<div class="label">Chores · ' + r.name + '</div><div class="h-rings">' + who.map(function (id) {
      var list = D.chores.filter(function (c) { return c.r === r.id && c.who === id; });
      if (!list.length) return '';
      var done = list.filter(function (c) { return c.done; }).length;
      var p = App.person(id);
      return '<div class="h-ring' + (done === list.length ? ' is-done' : '') + '" style="' + App.pstyle(p) + '">' + ring(done, list.length, 64) +
        '<b class="num">' + (done === list.length ? '✓' : done + '/' + list.length) + '</b><span>' + (id === 'any' ? 'Anyone' : p.name) + '</span></div>';
    }).join('') + '</div>';
  }

  function shopping() {
    var open = D.groceries.filter(function (g) { return !g.done; });
    var recent = open.slice(-3).reverse();
    return '<div class="label">Shopping</div>' +
      '<div class="h-stat"><span class="num">' + open.length + '</span><small>items to get</small></div>' +
      '<ul class="h-recent">' + recent.map(function (g) {
        return '<li><i></i>' + App.esc(g.name) + '</li>';
      }).join('') + '</ul>';
  }

  function status() {
    var integrations = window.DASHBOARD_INTEGRATIONS;
    var cameras = [];
    if (integrations.status.homeAssistant) cameras = cameras.concat(D.homeAssistantCameras || []);
    if (integrations.status.eufy) cameras = cameras.concat(D.eufyCameras || []);
    var detail = cameras.length
      ? cameras.length + (cameras.length === 1 ? ' camera connected' : ' cameras connected')
      : integrations.eufyError
        ? 'Camera bridge unavailable'
        : integrations.status.eufy || integrations.status.homeAssistant
          ? 'No cameras found'
          : 'Connecting to camera bridge…';
    return '<div class="label">Cameras</div>' +
      '<div class="h-st-row h-st-row--state' + (cameras.length ? ' is-connected' : integrations.eufyError ? ' is-offline' : '') + '">' +
      '<span class="h-camera-dot"></span>' + App.icon('camera', 22) + (cameras.length ? '<b class="num">' + cameras.length + '</b>' : '') + '<span>' + detail + '</span></div>' +
      '<div class="h-st-row"><span>Tap to view camera status</span></div>';
  }

  function paint() {
    var el = V.el;
    el.querySelector('.h-clock').innerHTML = clock();
    paintWeatherCard();
    el.querySelector('.h-presence').innerHTML = presence();
    el.querySelector('.h-hero-slot').innerHTML = hero();
    el.querySelector('.h-agenda').innerHTML = agenda();
    el.querySelector('.h-chores').innerHTML = chores();
    el.querySelector('.h-shop').innerHTML = shopping();
    el.querySelector('.h-status').innerHTML = status();
  }

  function paintTime() {
    if (!V.el || !V.el.firstChild) return;
    V.el.querySelector('.h-clock').innerHTML = clock();
    V.el.querySelector('.h-hero-slot').innerHTML = hero();
    V.el.querySelector('.h-agenda').innerHTML = agenda();
  }

  function photoCaption(s) {
    var m = App.photoMeta(s.photos[0]);
    V.el.querySelector('.h-photo-cap').innerHTML = '<b>' + (m.onThisDay ? 'On this day · ' : '') + m.kicker + '</b><span>' + App.esc(m.place) + '</span>';
  }

  App.register('home', {
    show: function (el) {
      V.el = el;
      if (!el.firstChild) {
        el.innerHTML = '<div class="home">' +
          '<div class="h-clock" data-go="calendar"></div>' +
          '<button class="h-weather" data-weather aria-label="Open hourly forecast"></button>' +
          '<div class="h-presence"></div>' +
          '<div class="h-main"><div class="h-hero-slot"></div><section class="h-agenda"></section></div>' +
          '<div class="h-side">' +
          '  <button class="h-photo" data-go="photos"><div class="h-photo-stage"></div><div class="h-photo-cap"></div></button>' +
          '  <button class="h-chores card" data-go="tasks"></button>' +
          '  <div class="h-duo"><button class="h-shop card" data-go="shopping"></button><button class="h-status card" data-go="control"></button></div>' +
          '</div></div>';
        el.addEventListener('click', function (e) {
          var ev = e.target.closest('[data-ev]');
          if (ev) { App.eventSheet(App.findEvent(ev.dataset.ev)); return; }
          if (e.target.closest('[data-weather]')) { weatherSheet(); return; }
          var g = e.target.closest('[data-go]');
          if (g) App.go(g.dataset.go);
        });
        V.slides = new App.Slideshow(el.querySelector('.h-photo-stage'), { layout: 'cover', captions: false, interval: 12000, onChange: photoCaption });
      }
      paint();
      V.slides.start();
    },
    resume: function () { paintTime(); V.slides.start(); },
    hide: function () { if (V.slides) V.slides.stop(); }
  });
  // Every minute: just the clock and next-up countdown (cheap, even while hidden). Weather on the hour.
  App.on('minute', function (n) {
    if (App.current !== 'home' || !V.el || !V.el.firstChild) return;
    paintTime();
    if (n.getMinutes() === 0) paintWeatherCard();
  });
  App.on('data', function () { if (App.current === 'home') paint(); });
})();
