(function () {
  'use strict';
  var D = window.DATA;
  var state = { calendar: false, tasks: false, homeAssistant: false, eufy: false, weather: false, photos: false, workersAi: false, stocks: false };
  var WEATHER_SETTINGS_KEY = 'home-hq-weather-settings-v1';
  var weatherSettings = { unit: 'F', cities: [], activeCity: 0 };
  var weatherSettingsError = '';
  try {
    var savedWeatherSettings = localStorage.getItem(WEATHER_SETTINGS_KEY);
    if (savedWeatherSettings) {
      var parsedWeatherSettings = JSON.parse(savedWeatherSettings);
      if (!parsedWeatherSettings || !['C', 'F'].includes(parsedWeatherSettings.unit) ||
          !Array.isArray(parsedWeatherSettings.cities) ||
          !Number.isInteger(parsedWeatherSettings.activeCity) ||
          parsedWeatherSettings.activeCity < 0 ||
          parsedWeatherSettings.activeCity >= Math.max(1, parsedWeatherSettings.cities.length) ||
          parsedWeatherSettings.cities.some(function (city) {
            return !city || typeof city.name !== 'string' ||
              !Number.isFinite(city.latitude) || city.latitude < -90 || city.latitude > 90 ||
              !Number.isFinite(city.longitude) || city.longitude < -180 || city.longitude > 180;
          })) throw new Error('Saved weather settings are invalid');
      weatherSettings = parsedWeatherSettings;
    }
  } catch (error) {
    weatherSettingsError = 'Saved weather settings could not be loaded. Changes have not been applied.';
  }

  function saveWeatherSettings(next) {
    try {
      localStorage.setItem(WEATHER_SETTINGS_KEY, JSON.stringify(next));
      weatherSettings = next;
      weatherSettingsError = '';
      return true;
    } catch (error) {
      weatherSettingsError = 'Weather preferences could not be saved on this device.';
      return false;
    }
  }

  var api = window.DASHBOARD_INTEGRATIONS = {
    status: state,
    tasks: [],
    calendarError: '',
    calendarSyncing: false,
    calendarSyncedAt: null,
    weatherSettings: weatherSettings,
    weatherSettingsError: weatherSettingsError,
    weatherError: '',
    eufyConfig: null,
    eufyError: '',
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
    },
    searchYouTube: function (query) {
      var search = (query || '').trim();
      if (search.length < 2 || search.length > 100) {
        return Promise.reject(new Error('Enter a song or artist between 2 and 100 characters.'));
      }
      return request('/api/music/search?q=' + encodeURIComponent(search));
    },
    temperature: function (celsius) {
      return weatherSettings.unit === 'F' ? Math.round(celsius * 9 / 5 + 32) : Math.round(celsius);
    },
    setWeatherUnit: function (unit) {
      if (!['C', 'F'].includes(unit)) return Promise.reject(new Error('Choose Celsius or Fahrenheit'));
      var next = Object.assign({}, weatherSettings, { unit: unit });
      if (!saveWeatherSettings(next)) return Promise.reject(new Error(weatherSettingsError));
      api.weatherSettings = weatherSettings;
      api.weatherSettingsError = '';
      changed();
      return Promise.resolve();
    },
    searchWeatherCities: function (name) {
      var query = (name || '').trim();
      if (query.length < 2 || query.length > 100) return Promise.reject(new Error('Enter a city name between 2 and 100 characters'));
      return request('/api/weather/geocode?q=' + encodeURIComponent(query)).then(function (result) {
        return (result.results || []).filter(function (place) {
          return typeof place.name === 'string' && Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
        }).map(function (place) {
          return {
            name: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
            latitude: place.latitude,
            longitude: place.longitude
          };
        });
      });
    },
    addWeatherCity: function (place) {
      if (!place || typeof place.name !== 'string' || !Number.isFinite(place.latitude) ||
          place.latitude < -90 || place.latitude > 90 ||
          !Number.isFinite(place.longitude) || place.longitude < -180 || place.longitude > 180) {
        return Promise.reject(new Error('Choose a valid city from the search results'));
      }
      var city = { name: place.name.slice(0, 100), latitude: place.latitude, longitude: place.longitude };
      if (weatherSettings.cities.some(function (item) {
        return Math.abs(item.latitude - city.latitude) < .01 && Math.abs(item.longitude - city.longitude) < .01;
      })) return Promise.reject(new Error('That city is already in your list'));
      if (weatherSettings.cities.length >= 8) return Promise.reject(new Error('You can save up to 8 cities'));
      var next = Object.assign({}, weatherSettings, { cities: weatherSettings.cities.concat([city]) });
      if (!saveWeatherSettings(next)) return Promise.reject(new Error(weatherSettingsError));
      api.weatherSettings = weatherSettings;
      api.weatherSettingsError = '';
      if (next.cities.length === 1) return api.selectWeatherCity(0).then(function () { return city; });
      changed();
      return Promise.resolve(city);
    },
    selectWeatherCity: function (index) {
      if (!Number.isInteger(index) || index < 0 || index >= weatherSettings.cities.length) {
        return Promise.reject(new Error('Choose a city from your saved list'));
      }
      var next = Object.assign({}, weatherSettings, { activeCity: index });
      if (!saveWeatherSettings(next)) return Promise.reject(new Error(weatherSettingsError));
      api.weatherSettings = weatherSettings;
      api.weatherSettingsError = '';
      return syncWeather(weatherSettings.cities[index]);
    },
    removeWeatherCity: function (index) {
      if (!Number.isInteger(index) || index < 0 || index >= weatherSettings.cities.length) {
        return Promise.reject(new Error('Choose a city from your saved list'));
      }
      if (weatherSettings.cities.length === 1) return Promise.reject(new Error('Keep at least one saved city'));
      var cities = weatherSettings.cities.filter(function (_, cityIndex) { return cityIndex !== index; });
      var activeCity = weatherSettings.activeCity;
      if (!cities.length) activeCity = 0;
      else if (index < activeCity) activeCity--;
      else if (index === activeCity) activeCity = Math.min(index, cities.length - 1);
      var next = Object.assign({}, weatherSettings, { cities: cities, activeCity: activeCity });
      if (!saveWeatherSettings(next)) return Promise.reject(new Error(weatherSettingsError));
      api.weatherSettings = weatherSettings;
      api.weatherSettingsError = '';
      return cities.length ? syncWeather(cities[activeCity]) : syncWeather();
    },
    stockStatus: function () { return request('/api/stocks/status'); },
    stockQuote: function (symbol) {
      return request('/api/stocks/quote?symbol=' + encodeURIComponent(symbol));
    },
    eufyVideoUrl: function (cameraId) {
      if (!api.eufyConfig) return '';
      var url = new URL('/stream.html', api.eufyConfig.go2rtcUrl);
      url.searchParams.set('src', cameraId);
      url.searchParams.set('mode', 'webrtc');
      return url.href;
    }
  };

  function request(path, options) {
    return fetch(api.url(path), options).then(function (response) {
      if (!response.ok) {
        return response.json().then(function (body) {
          throw new Error(body && typeof body.error === 'string' ? body.error : 'Integration request failed');
        }).catch(function (error) {
          if (error instanceof Error && error.message !== 'Unexpected end of JSON input') throw error;
          throw new Error('Integration request failed');
        });
      }
      var contentType = response.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        throw new Error('Dashboard API is unavailable. Start the Worker with `npx wrangler dev` from dashboard/.');
      }
      return response;
    }).then(function (response) {
      return response.json().catch(function () {
        throw new Error('Dashboard API returned invalid JSON');
      });
    });
  }

  var changeQueued = false;
  function changed() {
    if (changeQueued) return;
    changeQueued = true;
    requestAnimationFrame(function () {
      changeQueued = false;
      App.emit('data');
      if (App.current !== 'home' && App.current !== 'control' && App.current !== 'music') App.rerender();
    });
  }

  function applyLinkedChores() {
    api.tasks.forEach(function (task) {
      if (!task.choreId) return;
      var chore = D.chores.filter(function (item) { return item.id === task.choreId; })[0];
      if (chore) chore.done = task.completed;
    });
  }

  var calendarSyncPromise = null;
  function syncCalendar() {
    if (calendarSyncPromise) return calendarSyncPromise;
    api.calendarSyncing = true;
    api.calendarError = '';
    changed();
    var from = new Date(App.now().getTime() - 30 * 86400000);
    var to = new Date(App.now().getTime() + 90 * 86400000);
    var query = new URLSearchParams({ timeMin: from.toISOString(), timeMax: to.toISOString() });
    calendarSyncPromise = request('/api/google/calendar?' + query).then(function (result) {
      D.events = (result.events || []).map(function (event) {
        return Object.assign({}, event, { start: new Date(event.start), end: new Date(event.end) });
      });
      state.calendar = true;
      api.calendarSyncedAt = new Date();
      return true;
    }).catch(function (error) {
      state.calendar = false;
      api.calendarError = error.message || 'Calendar sync failed';
      return false;
    }).then(function (success) {
      api.calendarSyncing = false;
      calendarSyncPromise = null;
      changed();
      return success;
    });
    return calendarSyncPromise;
  }
  api.refreshCalendar = syncCalendar;

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
    return request('/api/eufy/config').then(function (config) {
      api.eufyConfig = config;
      return new Promise(function (resolve, reject) {
        var socketUrl = new URL('/ws', config.bridgeUrl);
        socketUrl.protocol = socketUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        var socket = new WebSocket(socketUrl.href);
        var timeout = setTimeout(function () {
          socket.close();
          reject(new Error('Timed out connecting to the Eufy video bridge'));
        }, 10000);
        socket.onmessage = function (event) {
          var message;
          try {
            message = JSON.parse(event.data);
          } catch {
            clearTimeout(timeout);
            socket.close();
            reject(new Error('The Eufy bridge sent invalid JSON'));
            return;
          }
          if (message.event === 'hello') {
            if (!message.auth || message.auth.state !== 'ok') {
              clearTimeout(timeout);
              socket.close();
              reject(new Error('The Eufy video bridge is not authenticated'));
              return;
            }
            socket.send(JSON.stringify({ id: 1, cmd: 'devices.list' }));
            return;
          }
          if (message.id !== 1) return;
          clearTimeout(timeout);
          socket.close();
          if (!message.ok) {
            reject(new Error(message.error || 'Could not list Eufy cameras'));
            return;
          }
          resolve((message.devices || []).filter(function (device) {
            return device && typeof device.sn === 'string' && device.stream &&
              Array.isArray(device.capabilities) && device.capabilities.indexOf('video') !== -1;
          }).map(function (device) {
            return { id: device.sn, name: device.name || device.modelName || 'Eufy camera', source: 'eufy' };
          }));
        };
        socket.onerror = function () {
          clearTimeout(timeout);
          socket.close();
          reject(new Error('Could not connect to the Eufy video bridge from this device'));
        };
      });
    }).then(function (cameras) {
      D.eufyCameras = cameras;
      api.eufyError = '';
      state.eufy = true;
      changed();
    }).catch(function (error) {
      api.eufyConfig = null;
      api.eufyError = error.message || 'Eufy live bridge unavailable';
      state.eufy = false;
      changed();
    });
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

  function syncWeather(city) {
    var path = '/api/weather';
    if (city) {
      var query = new URLSearchParams({
        latitude: String(city.latitude),
        longitude: String(city.longitude),
        location: city.name
      });
      path += '?' + query;
    }
    function fetchForecast() {
      return request(path).catch(function () {
        var coords = city || { latitude: D.weather.latitude, longitude: D.weather.longitude, name: D.weather.location };
        var query = new URLSearchParams({
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
          current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
          hourly: 'temperature_2m,precipitation_probability,weather_code',
          daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max',
          forecast_days: '7',
          timezone: 'auto'
        });
        return fetch('https://api.open-meteo.com/v1/forecast?' + query).then(function (response) {
          if (!response.ok) throw new Error('Weather request failed');
          return response.json();
        }).then(function (forecast) {
          forecast.location = coords.name;
          return forecast;
        });
      });
    }

    return fetchForecast().then(function (forecast) {
      var current = forecast.current, hourly = forecast.hourly, daily = forecast.daily;
      if (!current || !hourly || !daily || !Array.isArray(daily.time) ||
          !Array.isArray(daily.temperature_2m_max) || !Array.isArray(daily.temperature_2m_min)) {
        throw new Error('Weather data unavailable');
      }
      var days = [];
      daily.time.forEach(function (date, index) {
        var high = daily.temperature_2m_max[index], low = daily.temperature_2m_min[index];
        if (!Number.isFinite(high) || !Number.isFinite(low)) return;
        days.push({
          date: date,
          hi: high,
          lo: low,
          c: weatherIcon(daily.weather_code && daily.weather_code[index]),
          p: daily.precipitation_probability_max && Number.isFinite(daily.precipitation_probability_max[index])
            ? daily.precipitation_probability_max[index]
            : null
        });
      });
      if (!days.length) throw new Error('Daily weather forecast unavailable');
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
        latitude: Number.isFinite(forecast.latitude) ? forecast.latitude : (city ? city.latitude : D.weather.latitude),
        longitude: Number.isFinite(forecast.longitude) ? forecast.longitude : (city ? city.longitude : D.weather.longitude),
        timezone: forecast.timezone || D.weather.timezone,
        days: days,
        hi: days[0].hi,
        lo: days[0].lo,
        feels: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        wind: current.wind_speed_10m
      });
      state.weather = true;
      api.weatherError = '';
      if (!city && !weatherSettings.cities.length &&
          Number.isFinite(D.weather.latitude) && Number.isFinite(D.weather.longitude)) {
        var initialCity = { name: D.weather.location, latitude: D.weather.latitude, longitude: D.weather.longitude };
        var initial = Object.assign({}, weatherSettings, { cities: [initialCity], activeCity: 0 });
        if (saveWeatherSettings(initial)) api.weatherSettings = weatherSettings;
        else api.weatherSettingsError = weatherSettingsError;
      }
      changed();
    }).catch(function (error) {
      state.weather = false;
      api.weatherError = error.message || 'Weather forecast unavailable';
      changed();
    });
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
    syncEufyCameras();
    syncWorkersAiStatus();
    syncWeather();
    syncPhotos();
  }

  App.on('ready', function () {
    refreshAll();
    setInterval(function () { syncCalendar(); syncTasks(); }, 5 * 60 * 1000);
    setInterval(syncEufyCameras, 5 * 60 * 1000);
    setInterval(syncWeather, 15 * 60 * 1000);
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && App.current === 'calendar') syncCalendar();
  });
})();