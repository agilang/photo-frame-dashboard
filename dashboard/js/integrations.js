(function () {
  'use strict';
  var D = window.DATA;
  var state = { calendar: false, tasks: false, homeAssistant: false, eufy: false, weather: false, photos: false, workersAi: false };
  var api = window.DASHBOARD_INTEGRATIONS = {
    status: state,
    tasks: [],
    aiModel: '@cf/meta/llama-3.1-8b-instruct-fp8-fast',
    url: function (path) {
      var url = new URL(path, window.location.href);
      return url.pathname + url.search;
    },
    setSwitch: function (entityId, on) {
      return request('/api/home-assistant/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: entityId, state: on ? 'on' : 'off' })
      });
    },
    createEvent: function (event) {
      return request('/api/google/calendar/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event)
      });
    },
    createTask: function (task) {
      return request('/api/google/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(task)
      }).then(function () { return syncTasks(); });
    },
    updateTask: function (task, completed) {
      return request('/api/google/tasks/' + encodeURIComponent(task.listId) + '/' + encodeURIComponent(task.id), {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: completed })
      }).then(function () {
        task.completed = completed;
        if (task.choreId) {
          var chore = D.chores.filter(function (item) { return item.id === task.choreId; })[0];
          if (chore) chore.done = completed;
        }
        changed();
      });
    },
    updateChore: function (chore, completed) {
      var task = api.tasks.filter(function (item) { return item.choreId === chore.id; })[0];
      return task ? api.updateTask(task, completed) : Promise.resolve(false);
    },
    syncChores: function () {
      return request('/api/google/tasks/sync-chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chores: D.chores.map(function (chore) {
          return { id: chore.id, title: chore.title, done: chore.done };
        }) })
      }).then(function (result) {
        api.tasks = result.tasks || [];
        applyLinkedChores();
        state.tasks = true;
        changed();
        return result;
      });
    },
    chatWithAI: function (messages) {
      return request('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages })
      });
    }
  };

  function request(path, options) {
    return fetch(api.url(path), options).then(function (response) {
      if (!response.ok) throw new Error('Integration request failed');
      return response;
    }).then(function (response) { return response.json(); });
  }

  function changed() {
    App.emit('data');
    App.rerender();
  }

  function applyLinkedChores() {
    api.tasks.forEach(function (task) {
      if (!task.choreId) return;
      var chore = D.chores.filter(function (item) { return item.id === task.choreId; })[0];
      if (chore) chore.done = task.completed;
    });
  }

  function syncCalendar() {
    var from = new Date(App.now().getTime() - 30 * 86400000);
    var to = new Date(App.now().getTime() + 90 * 86400000);
    var query = new URLSearchParams({ timeMin: from.toISOString(), timeMax: to.toISOString() });
    return request('/api/google/calendar?' + query).then(function (result) {
      D.events = (result.events || []).map(function (event) {
        return Object.assign({}, event, { start: new Date(event.start), end: new Date(event.end) });
      });
      state.calendar = true;
      changed();
    }).catch(function () { state.calendar = false; });
  }

  function syncTasks() {
    return request('/api/google/tasks').then(function (result) {
      api.tasks = result.tasks || [];
      applyLinkedChores();
      state.tasks = true;
      changed();
    }).catch(function () { state.tasks = false; });
  }

  function syncHomeAssistant() {
    return request('/api/home-assistant/states').then(function (result) {
      var entities = result.entities || [];
      D.homeAssistantDevices = entities.filter(function (entity) {
        return entity.domain === 'switch' || entity.domain === 'light';
      }).map(function (entity) {
        return {
          id: entity.entityId,
          entityId: entity.entityId,
          name: entity.name,
          room: 'connected',
          type: 'switch',
          on: entity.state === 'on',
          level: 100
        };
      });
      D.homeAssistantCameras = entities.filter(function (entity) {
        return entity.domain === 'camera';
      }).map(function (entity) {
        return { id: entity.entityId, entityId: entity.entityId, name: entity.name, source: 'homeAssistant' };
      });
      state.homeAssistant = true;
      changed();
    }).catch(function () { state.homeAssistant = false; });
  }

  function syncEufyCameras() {
    return request('/api/eufy/cameras').then(function (result) {
      D.eufyCameras = (result.cameras || []).map(function (camera) {
        return { id: camera.id, name: camera.name, source: 'eufy' };
      });
      state.eufy = true;
      changed();
    }).catch(function () { state.eufy = false; });
  }

  function syncWorkersAiStatus() {
    return request('/api/ai/status').then(function (result) {
      state.workersAi = !!result.configured;
      api.aiModel = result.model || api.aiModel;
      App.emit('workers-ai-status');
    }).catch(function () { state.workersAi = false; });
  }

  function weatherIcon(code) {
    if (code === 0) return 'sun';
    if (code <= 2) return 'partly';
    if (code === 45 || code === 48 || code >= 71 && code <= 77) return 'cloud';
    if (code >= 51) return 'rain';
    return 'cloud';
  }

  function syncWeather() {
    function fetchForecast() {
      return request('/api/weather').catch(function () {
        var query = new URLSearchParams({
          latitude: '33.16262',
          longitude: '-96.93751',
          current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
          hourly: 'temperature_2m,precipitation_probability,weather_code',
          daily: 'temperature_2m_max,temperature_2m_min',
          forecast_days: '2',
          timezone: 'auto'
        });
        return fetch('https://api.open-meteo.com/v1/forecast?' + query).then(function (response) {
          if (!response.ok) throw new Error('Weather request failed');
          return response.json();
        }).then(function (forecast) {
          forecast.location = 'Little Elm, TX 75068';
          return forecast;
        });
      });
    }

    return fetchForecast().then(function (forecast) {
      var current = forecast.current, hourly = forecast.hourly, daily = forecast.daily;
      if (!current || !hourly || !daily) throw new Error('Weather data unavailable');
      var next = { t: Array(24), c: Array(24), p: Array(24) };
      hourly.time.forEach(function (time, index) {
        if (time.slice(0, 10) !== current.time.slice(0, 10)) return;
        var hour = Number(time.slice(11, 13));
        next.t[hour] = hourly.temperature_2m[index];
        next.c[hour] = weatherIcon(hourly.weather_code[index]);
        next.p[hour] = hourly.precipitation_probability[index] || 0;
      });
      var hour = Number(current.time.slice(11, 13));
      next.t[hour] = current.temperature_2m;
      next.c[hour] = weatherIcon(current.weather_code);
      next.p[hour] = next.p[hour] || 0;
      for (var i = 0; i < 24; i++) {
        if (next.t[i] == null) next.t[i] = current.temperature_2m;
        if (!next.c[i]) next.c[i] = 'cloud';
        if (next.p[i] == null) next.p[i] = 0;
      }
      D.weather = Object.assign({}, D.weather, next, {
        location: forecast.location || D.weather.location,
        hi: daily.temperature_2m_max[0],
        lo: daily.temperature_2m_min[0],
        feels: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        wind: current.wind_speed_10m
      });
      state.weather = true;
      changed();
    }).catch(function () { state.weather = false; });
  }

  function syncPhotos() {
    return fetch(api.url('/photos/manifest.json'), { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('Photo manifest unavailable');
      return response.json();
    }).then(function (manifest) {
      var photos = (manifest.photos || []).filter(function (photo) {
        return typeof photo.src === 'string' && /^\/photos\/[A-Za-z0-9._/-]+$/.test(photo.src) && photo.src.indexOf('..') < 0 &&
          typeof photo.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(photo.date);
      }).map(function (photo, index) {
        return {
          id: 'local-photo-' + index,
          src: photo.src,
          o: photo.o === 'p' ? 'p' : 'l',
          date: photo.date,
          place: photo.place || '',
          from: photo.from || 'family',
          tag: photo.tag || photo.date,
          fav: !!photo.fav
        };
      });
      if (!photos.length) throw new Error('No local photos configured');
      D.photos = photos;
      state.photos = true;
      App.emit('photos');
    }).catch(function () { state.photos = false; });
  }

  function refreshAll() {
    syncCalendar();
    syncTasks();
    syncHomeAssistant();
    syncEufyCameras();
    syncWorkersAiStatus();
    syncWeather();
    syncPhotos();
  }

  App.on('ready', function () {
    refreshAll();
    setInterval(function () { syncCalendar(); syncTasks(); }, 5 * 60 * 1000);
    setInterval(syncHomeAssistant, 30 * 1000);
    setInterval(syncEufyCameras, 5 * 60 * 1000);
    setInterval(syncWeather, 15 * 60 * 1000);
  });
})();