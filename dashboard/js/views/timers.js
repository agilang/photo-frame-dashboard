// Multiple local countdown timers with optional browser speech recognition.
(function () {
  'use strict';
  var STORAGE_KEY = 'home-hq-timers-v1';
  var timers = [];
  var viewEl = null;
  var recognition = null;
  var recognitionMode = null;
  var listening = false;
  var wakeEnabled = false;
  var waitingForCommandUntil = 0;
  var wakeRestartTimer = null;
  var alarmInterval = null;
  var audioContext = null;
  var alertBanners = {};
  var nextId = Date.now();
  var statusText = '';
  var errorText = '';

  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new Error('Saved timers are invalid');
      timers = parsed.filter(function (timer) {
        return timer && typeof timer.id === 'string' && typeof timer.name === 'string' &&
          Number.isFinite(timer.endAt) && Number.isFinite(timer.duration) &&
          typeof timer.finished === 'boolean' && typeof timer.acknowledged === 'boolean';
      });
    }
  } catch (error) {
    errorText = 'Saved timers could not be loaded. New timers can still be created.';
  }
  try {
    wakeEnabled = localStorage.getItem('home-hq-timer-wake-v1') === 'true';
  } catch (error) {
    errorText = 'Wake phrase preference could not be loaded.';
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
      return true;
    } catch (error) {
      errorText = 'Timers could not be saved on this device.';
      return false;
    }
  }

  function speechApi() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  function numberValue(value) {
    if (/^\d+$/.test(value)) return Number(value);
    var words = {
      zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
      eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
      fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
      nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60
    };
    var parts = value.toLowerCase().replace(/-/g, ' ').split(/\s+/);
    if (parts.length === 2 && words[parts[0]] >= 20 && words[parts[1]] > 0 && words[parts[1]] < 10) {
      return words[parts[0]] + words[parts[1]];
    }
    return words[value.toLowerCase()];
  }

  var NUM = '(?:\\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?|thirty(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?|forty(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?|fifty(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?|sixty)';
  var DURATION_RE = new RegExp(
    '\\b(' + NUM + ')\\s*(hours?|hrs?|h)(?:\\s*(?:and\\s*)?(' + NUM + ')\\s*(minutes?|mins?|m))?\\b' +
    '|\\b(' + NUM + ')\\s*(minutes?|mins?|m)\\b' +
    '|\\b(' + NUM + ')\\s*(seconds?|secs?|s)\\b', 'gi');

  function durationsFrom(text) {
    var listPattern = new RegExp(
      '\\b(' + NUM + ')\\s+and\\s+(' + NUM + ')\\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\\b', 'gi');
    text = text.replace(listPattern, '$1 $3 and $2 $3');
    var durations = [], match, regex = new RegExp(DURATION_RE.source, 'gi');
    while ((match = regex.exec(text)) && durations.length < 5) {
      var milliseconds;
      if (match[1]) {
        milliseconds = numberValue(match[1]) * 3600000 + (match[3] ? numberValue(match[3]) * 60000 : 0);
      } else if (match[5]) {
        milliseconds = numberValue(match[5]) * 60000;
      } else {
        milliseconds = numberValue(match[7]) * 1000;
      }
      if (Number.isFinite(milliseconds) && milliseconds >= 1000 && milliseconds <= 86400000) durations.push(milliseconds);
    }
    return durations;
  }

  function formatDuration(milliseconds) {
    var seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor(seconds % 3600 / 60);
    var remainder = seconds % 60;
    if (hours) return hours + ':' + String(minutes).padStart(2, '0') + ':' + String(remainder).padStart(2, '0');
    return minutes + ':' + String(remainder).padStart(2, '0');
  }

  function ensureAudio() {
    var AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) {
      statusText = 'This browser cannot play the timer alarm sound.';
      return;
    }
    if (!audioContext) audioContext = new AudioContextType();
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(function () {
        statusText = 'Allow sound in the browser to hear timer alarms.';
        paintStatus();
      });
    }
  }

  function beep() {
    if (!audioContext || audioContext.state !== 'running') return;
    var oscillator = audioContext.createOscillator();
    var gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.45);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.46);
  }

  function syncAlarm() {
    var hasUnacknowledged = timers.some(function (timer) { return timer.finished && !timer.acknowledged; });
    if (hasUnacknowledged && !alarmInterval) {
      beep();
      alarmInterval = setInterval(beep, 1400);
    } else if (!hasUnacknowledged && alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  }

  function findTimer(id) {
    return timers.filter(function (timer) { return timer.id === id; })[0];
  }

  function acknowledge(id) {
    var timer = findTimer(id);
    if (!timer) return;
    timer.acknowledged = true;
    delete alertBanners[id];
    persist();
    syncAlarm();
    paint();
  }

  function showAlert(timer) {
    if (alertBanners[timer.id]) return;
    if (App.banner) {
      alertBanners[timer.id] = App.banner({
        tone: 'amber',
        icon: 'clock',
        title: timer.name + ' finished',
        sub: 'Your countdown is complete.',
        action: 'View timers',
        dismiss: 'Stop alarm',
        onDismiss: function () { acknowledge(timer.id); },
        onAction: function () { App.go('timers'); }
      });
    }
  }

  function alertTimer(timer) {
    timer.finished = true;
    persist();
    syncAlarm();
    showAlert(timer);
  }

  function addTimer(name, duration) {
    if (!Number.isFinite(duration) || duration < 1000 || duration > 86400000) {
      errorText = 'Choose a timer from 1 second to 24 hours.';
      paint();
      return false;
    }
    var timer = {
      id: String(nextId++),
      name: (name || 'Timer ' + (timers.length + 1)).trim().slice(0, 48),
      duration: duration,
      endAt: Date.now() + duration,
      finished: false,
      acknowledged: false
    };
    timers.push(timer);
    if (!persist()) {
      timers.pop();
      paint();
      return false;
    }
    errorText = '';
    ensureAudio();
    paint();
    return true;
  }

  function handleCommand(text) {
    var durations = durationsFrom(text);
    if (!/\btimers?\b/i.test(text) || !durations.length) {
      errorText = 'Try “Set a timer for 5 minutes” or “Set timers for 5 and 10 minutes”.';
      statusText = '';
      paint();
      return false;
    }
    durations.forEach(function (duration) {
      addTimer('Timer ' + (timers.length + 1), duration);
    });
    statusText = durations.length === 1 ? 'Timer started.' : durations.length + ' timers started.';
    errorText = '';
    paint();
    return true;
  }

  function scheduleWakeRestart() {
    if (!wakeEnabled || document.visibilityState === 'hidden' || wakeRestartTimer) return;
    wakeRestartTimer = setTimeout(function () {
      wakeRestartTimer = null;
      startWakeListening();
    }, 1200);
  }

  function handleWakePhrase(text) {
    var phrase = /\b(?:hey\s+home|home\s*h\s*q|home\s+hq)\b/i;
    var match = phrase.exec(text);
    if (match) {
      var command = text.slice(match.index + match[0].length).replace(/^[\s,.:;-]+/, '');
      if (command && durationsFrom(command).length) {
        waitingForCommandUntil = 0;
        handleCommand(command);
      } else {
        waitingForCommandUntil = Date.now() + 10000;
        statusText = 'Ready—say “set a timer for 5 minutes.”';
        errorText = '';
        paintStatus();
      }
      return;
    }
    if (waitingForCommandUntil && Date.now() <= waitingForCommandUntil) {
      waitingForCommandUntil = 0;
      handleCommand(text);
    }
  }

  function clearWakePreference() {
    wakeEnabled = false;
    waitingForCommandUntil = 0;
    try {
      localStorage.removeItem('home-hq-timer-wake-v1');
      return true;
    } catch (error) {
      return false;
    }
  }

  function startRecognition(mode) {
    var Recognition = speechApi();
    if (!Recognition) {
      if (mode === 'wake' && !clearWakePreference()) {
        errorText = 'Voice timers are not supported, and the wake preference could not be cleared.';
        paintStatus();
        return;
      }
      errorText = 'Voice timers are not supported in this browser. Use the command field or timer form.';
      paintStatus();
      return;
    }
    if (recognition || document.visibilityState === 'hidden') return;
    try {
      var instance = new Recognition();
      recognition = instance;
      recognitionMode = mode;
      instance.lang = 'en-US';
      instance.continuous = mode === 'wake';
      instance.interimResults = false;
      instance.onstart = function () {
        if (recognition !== instance) return;
        listening = true;
        statusText = mode === 'wake'
          ? 'Wake phrase on—say “Hey Home,” then your timer.'
          : 'Listening… say one or more timer durations.';
        errorText = '';
        paintStatus();
      };
      instance.onresult = function (event) {
        for (var i = event.resultIndex || 0; i < event.results.length; i++) {
          var result = event.results[i] && event.results[i][0];
          if (!result || !result.transcript || event.results[i].isFinal === false) continue;
          if (mode === 'wake') handleWakePhrase(result.transcript.trim());
          else handleCommand(result.transcript.trim());
        }
      };
      instance.onerror = function (event) {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          errorText = 'Microphone access was denied. Allow it in the browser or use the command field.';
          if (mode === 'wake') {
            if (!clearWakePreference()) {
              errorText += ' The wake preference could not be cleared.';
            }
          }
        } else {
          errorText = 'Voice input failed (' + event.error + '). Try again or use the command field.';
        }
        paintStatus();
      };
      instance.onend = function () {
        if (recognition !== instance) return;
        recognition = null;
        recognitionMode = null;
        listening = false;
        if (!wakeEnabled || mode !== 'wake') {
          if (!statusText || statusText.indexOf('Listening') === 0) statusText = 'Voice listening ended.';
        }
        paintStatus();
        if (mode === 'wake') scheduleWakeRestart();
      };
      instance.start();
    } catch (error) {
      recognition = null;
      recognitionMode = null;
      listening = false;
      if (mode === 'wake' && !clearWakePreference()) {
        errorText = 'Could not start voice input, and the wake preference could not be cleared.';
        paintStatus();
        return;
      }
      errorText = 'Could not start voice input. Check microphone permission and try again.';
      paintStatus();
    }
  }

  function startWakeListening() {
    if (!wakeEnabled) return;
    ensureAudio();
    startRecognition('wake');
  }

  function setWakeEnabled(enabled) {
    wakeEnabled = enabled;
    waitingForCommandUntil = 0;
    try {
      if (enabled) localStorage.setItem('home-hq-timer-wake-v1', 'true');
      else localStorage.removeItem('home-hq-timer-wake-v1');
    } catch (error) {
      wakeEnabled = false;
      errorText = 'Wake phrase preference could not be saved on this device.';
      paintStatus();
      return;
    }
    if (wakeRestartTimer) {
      clearTimeout(wakeRestartTimer);
      wakeRestartTimer = null;
    }
    if (enabled) {
      ensureAudio();
      if (recognition && recognitionMode === 'manual') {
        recognition.stop();
        setTimeout(startWakeListening, 400);
      } else {
        startWakeListening();
      }
    } else if (recognition && recognitionMode === 'wake') {
      recognition.stop();
    }
    paint();
  }

  function startListening() {
    if (wakeEnabled) return;
    ensureAudio();
    startRecognition('manual');
  }

  function paintStatus() {
    if (!viewEl || !viewEl.firstChild) return;
    var status = viewEl.querySelector('[data-timer-status]');
    var error = viewEl.querySelector('[data-timer-error]');
    if (status) status.textContent = statusText;
    if (error) {
      error.textContent = errorText;
      error.hidden = !errorText;
    }
    var voice = viewEl.querySelector('[data-timer-voice]');
    if (voice) {
      voice.textContent = wakeEnabled ? 'Wake phrase is on' : (listening ? 'Stop listening' : 'Speak timers');
      voice.classList.toggle('is-listening', listening);
      voice.disabled = wakeEnabled || (!speechApi() && !listening);
    }
    var wake = viewEl.querySelector('[data-timer-wake]');
    if (wake) {
      wake.setAttribute('aria-pressed', wakeEnabled ? 'true' : 'false');
      wake.textContent = wakeEnabled ? 'Wake phrase on' : 'Enable wake phrase';
      wake.classList.toggle('is-enabled', wakeEnabled);
    }
  }

  function paintList() {
    if (!viewEl || !viewEl.firstChild) return;
    var list = viewEl.querySelector('[data-timer-list]');
    if (!list) return;
    var active = timers.filter(function (timer) { return !timer.finished; });
    var finished = timers.filter(function (timer) { return timer.finished; });
    var entries = active.concat(finished).sort(function (a, b) {
      if (a.finished !== b.finished) return a.finished ? 1 : -1;
      return a.endAt - b.endAt;
    });
    list.innerHTML = entries.length ? entries.map(function (timer) {
      return '<article class="timer-card' + (timer.finished ? ' is-finished' : '') + '" data-timer-id="' + App.esc(timer.id) + '">' +
        '<div class="timer-card-icon">' + App.icon(timer.finished ? 'check' : 'clock', 26) + '</div>' +
        '<div class="timer-card-main"><b>' + App.esc(timer.name) + '</b><span>' +
        (timer.finished ? 'Time is up' : 'Started ' + App.fmt.time(new Date(timer.endAt - timer.duration))) +
        '</span></div><strong class="timer-countdown num" data-timer-countdown>' +
        (timer.finished ? 'DONE' : formatDuration(timer.endAt - Date.now())) + '</strong>' +
        '<button type="button" class="timer-remove" data-timer-remove="' + App.esc(timer.id) + '" aria-label="Dismiss ' +
        App.esc(timer.name) + '">' + App.icon('x', 21) + '</button></article>';
    }).join('') : '<div class="timer-empty"><span class="timer-empty-icon">' + App.icon('clock', 36) +
      '</span><h2>No timers yet</h2><p>Tap the microphone and say “Set a timer for 5 minutes.” You can start multiple timers in one command.</p></div>';
  }

  function paint() {
    if (!viewEl) return;
    viewEl.innerHTML = '<div class="timers-view"><header class="timers-head"><div><div class="label">Hands-free countdowns</div>' +
      '<h1>Timers</h1><p>Run several countdowns at once. They keep going while you use other screens.</p></div>' +
      '<div class="timers-active-count"><b class="num">' + timers.filter(function (timer) { return !timer.finished; }).length +
      '</b><span>active</span></div></header>' +
      '<div class="timers-layout"><section class="timer-setup"><div class="timer-voice-panel">' +
      '<div class="timer-section-label">' + App.icon('mic', 21) + 'VOICE COMMAND</div>' +
      '<button type="button" class="timer-voice-button' + (listening ? ' is-listening' : '') + '" data-timer-voice' +
      ((!speechApi() || wakeEnabled) ? ' disabled' : '') + '>' +
      (wakeEnabled ? 'Wake phrase is on' : (listening ? 'Stop listening' : 'Speak timers')) + '</button>' +
      '<button type="button" class="timer-wake-button' + (wakeEnabled ? ' is-enabled' : '') +
      '" data-timer-wake aria-pressed="' + (wakeEnabled ? 'true' : 'false') + '"' +
      (!speechApi() ? ' disabled' : '') + '>' + (wakeEnabled ? 'Wake phrase on' : 'Enable wake phrase') + '</button>' +
      '<p class="timer-example">Say “Hey Home,” then “set a timer for 5 minutes.”<br>' +
      'Or say “Hey Home, set timers for 5 and 10 minutes.”</p>' +
      '<div class="timer-status" data-timer-status>' + App.esc(statusText) + '</div>' +
      '<p class="timer-error" data-timer-error' + (!errorText ? ' hidden' : '') + '>' + App.esc(errorText) + '</p></div>' +
      '<form class="timer-command-form" data-timer-command-form><label for="timer-command">Type a timer command</label>' +
      '<div class="timer-command-row"><input id="timer-command" name="timerCommand" type="text" autocomplete="off" placeholder="Set a timer for 5 minutes">' +
      '<button type="submit">Start</button></div></form>' +
      '<form class="timer-manual-form" data-timer-manual-form><div class="timer-section-label">QUICK TIMER</div>' +
      '<label for="timer-name">Name</label><input id="timer-name" name="timerName" maxlength="48" placeholder="Tea, pasta, laundry">' +
      '<label for="timer-minutes">Duration in minutes</label><div class="timer-command-row">' +
      '<input id="timer-minutes" name="timerMinutes" type="number" min="1" max="1440" step="1" value="5" required>' +
      '<button type="submit">Start timer</button></div></form></section>' +
      '<section class="timer-list-panel"><div class="timer-list-head"><div><div class="label">YOUR COUNTDOWNS</div><h2>Active timers</h2></div>' +
      '<button type="button" data-timer-clear-finished' + (!timers.some(function (timer) { return timer.finished; }) ? ' hidden' : '') +
      '>Clear finished</button></div><div class="timer-list" data-timer-list></div></section></div>' +
      '<p class="timers-footnote">Timers run while Home HQ is open. Enable the wake phrase to listen for “Hey Home” while the screen is on; this keeps the microphone active and may use an online speech service. Screen-off wake listening is not supported.</p>' +
      '</div>';
    paintList();
  }

  function tick() {
    var due = timers.filter(function (timer) { return !timer.finished && timer.endAt <= Date.now(); });
    due.forEach(alertTimer);
    if (due.length) paint();
    if (viewEl && viewEl.firstChild) {
      Array.prototype.forEach.call(viewEl.querySelectorAll('[data-timer-countdown]'), function (element) {
        var timer = findTimer(element.closest('[data-timer-id]').dataset.timerId);
        if (timer && !timer.finished) element.textContent = formatDuration(timer.endAt - Date.now());
      });
      var count = viewEl.querySelector('.timers-active-count b');
      if (count) count.textContent = timers.filter(function (timer) { return !timer.finished; }).length;
      var clear = viewEl.querySelector('[data-timer-clear-finished]');
      if (clear) clear.hidden = !timers.some(function (timer) { return timer.finished; });
    }
  }

  App.register('timers', {
    show: function (el) {
      viewEl = el;
      if (!el.dataset.timersBound) {
        el.dataset.timersBound = 'true';
        el.addEventListener('click', function (event) {
          var wake = event.target.closest('[data-timer-wake]');
          if (wake) {
            setWakeEnabled(!wakeEnabled);
            return;
          }
          var voice = event.target.closest('[data-timer-voice]');
          if (voice) {
            if (listening && recognition) recognition.stop();
            else startListening();
            return;
          }
          var remove = event.target.closest('[data-timer-remove]');
          if (remove) {
            timers = timers.filter(function (timer) { return timer.id !== remove.dataset.timerRemove; });
            persist();
            syncAlarm();
            paint();
            return;
          }
          if (event.target.closest('[data-timer-clear-finished]')) {
            timers = timers.filter(function (timer) { return !timer.finished; });
            persist();
            syncAlarm();
            paint();
          }
        });
        el.addEventListener('submit', function (event) {
          if (event.target.matches('[data-timer-command-form]')) {
            event.preventDefault();
            var command = event.target.elements.timerCommand.value.trim();
            handleCommand(command);
            event.target.reset();
            return;
          }
          if (event.target.matches('[data-timer-manual-form]')) {
            event.preventDefault();
            var minutes = Number(event.target.elements.timerMinutes.value);
            if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
              errorText = 'Choose a duration from 1 to 1440 minutes.';
              paint();
              return;
            }
            var name = event.target.elements.timerName.value.trim();
            if (addTimer(name || 'Timer ' + (timers.length + 1), minutes * 60000)) {
              event.target.reset();
              event.target.elements.timerMinutes.value = '5';
              statusText = 'Timer started.';
              paint();
            }
          }
        });
      }
      paint();
      if (timers.length) ensureAudio();
      dueOnLoad();
    },
    hide: function () {
      if (recognition && listening && recognitionMode === 'manual') recognition.stop();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      if (wakeRestartTimer) {
        clearTimeout(wakeRestartTimer);
        wakeRestartTimer = null;
      }
      if (recognition && recognitionMode === 'wake') recognition.stop();
    } else if (wakeEnabled) {
      scheduleWakeRestart();
    }
  });

  function dueOnLoad() {
    var wasFinished = timers.filter(function (timer) { return timer.finished; }).map(function (timer) { return timer.id; });
    var due = timers.filter(function (timer) { return !timer.finished && timer.endAt <= Date.now(); });
    due.forEach(alertTimer);
    syncAlarm();
    if (wasFinished.length) {
      timers.filter(function (timer) {
        return wasFinished.indexOf(timer.id) !== -1 && timer.finished && !timer.acknowledged;
      }).forEach(showAlert);
    }
  }

  App.on('second', tick);
  App.on('ready', function () {
    dueOnLoad();
    if (wakeEnabled) startWakeListening();
  });
})();
