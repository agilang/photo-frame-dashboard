// Tasks / chores: one lane per person + "Anyone", scoped to the current time-of-day routine.
(function () {
  'use strict';
  var D = window.DATA;
  var V = { el: null, routine: null, pending: {}, source: 'chores', customChores: [] };
  var LANES = D.people.map(function (person) { return person.id; }).concat(['any']);
  var STORAGE_KEY = 'home-hq-custom-chores-v1';

  function loadCustomChores() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      var chores = JSON.parse(saved);
      if (!Array.isArray(chores) || chores.some(function (chore) {
        return !chore || typeof chore.id !== 'string' || typeof chore.title !== 'string' ||
          !D.routines.some(function (r) { return r.id === chore.r; }) ||
          LANES.indexOf(chore.who) === -1 || typeof chore.done !== 'boolean';
      })) throw new Error('Saved chores are invalid');
      V.customChores = chores;
      Array.prototype.push.apply(D.chores, chores);
    } catch (error) {
      App.toast('Saved custom chores could not be loaded. Existing chores are unchanged.', { tone: 'error', icon: 'check' });
    }
  }

  function saveCustomChores() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(V.customChores));
      return true;
    } catch (error) {
      App.toast('Couldn’t save custom chore changes on this device.', { tone: 'error', icon: 'check' });
      return false;
    }
  }

  function addChore(defaultWho) {
    defaultWho = defaultWho || 'any';
    var routineId = routine().id;
    var assigneeOptions = D.people.map(function (person) {
      return '<option value="' + person.id + '"' + (defaultWho === person.id ? ' selected' : '') + '>' + App.esc(person.name) + '</option>';
    }).join('') + '<option value="any"' + (defaultWho === 'any' ? ' selected' : '') + '>Anyone</option>';
    var routineOptions = D.routines.map(function (item) {
      return '<option value="' + item.id + '"' + (item.id === routineId ? ' selected' : '') + '>' + App.esc(item.name) + '</option>';
    }).join('');
    App.sheet('<div class="sheet-pad"><div class="label">Family chores</div><h2 class="serif sheet-h">Add a chore</h2>' +
      '<label class="chore-field">What needs doing?<input class="big-input" maxlength="80" placeholder="e.g. Set the table" data-new-chore-title></label>' +
      '<div class="chore-form-row"><label class="chore-field">Assign to<select class="big-input" data-new-chore-who>' + assigneeOptions + '</select></label>' +
      '<label class="chore-field">Routine<select class="big-input" data-new-chore-routine>' + routineOptions + '</select></label></div>' +
      '<label class="chore-field chore-stars-field">Reward stars<input class="big-input" type="number" min="0" max="10" value="0" data-new-chore-stars></label>' +
      '<div class="sheet-actions"><button class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--solid" data-save-chore>Add chore</button></div></div>', {
      onMount: function (sheet, close) {
        var title = sheet.querySelector('[data-new-chore-title]');
        title.focus();
        sheet.addEventListener('click', function (event) {
          var button = event.target.closest('[data-save-chore]');
          if (!button) return;
          var cleanTitle = title.value.trim();
          var starsInput = sheet.querySelector('[data-new-chore-stars]');
          var stars = Number(starsInput.value);
          if (!cleanTitle) { title.focus(); return; }
          if (!Number.isInteger(stars) || stars < 0 || stars > 10) { starsInput.focus(); return; }
          var chore = {
            id: 'custom-' + Date.now() + '-' + (V.customChores.length + 1),
            r: sheet.querySelector('[data-new-chore-routine]').value,
            who: sheet.querySelector('[data-new-chore-who]').value,
            title: cleanTitle,
            emoji: '✓',
            stars: stars,
            done: false
          };
          if (!D.routines.some(function (item) { return item.id === chore.r; }) || LANES.indexOf(chore.who) === -1) {
            App.toast('Choose a valid assignee and routine.', { tone: 'error', icon: 'check' });
            return;
          }
          var next = V.customChores.concat([chore]);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch (error) {
            App.toast('Couldn’t save this chore on this device.', { tone: 'error', icon: 'check' });
            return;
          }
          V.customChores = next;
          D.chores.push(chore);
          V.routine = chore.r;
          close();
          render();
          App.emit('data');
          App.toast('Added <b>' + App.esc(chore.title) + '</b> for ' + App.esc(chore.who === 'any' ? 'Anyone' : App.person(chore.who).name), { icon: 'check' });
        });
      }
    });
  }

  function routine() { return V.routine ? D.routines.filter(function (r) { return r.id === V.routine; })[0] : App.currentRoutine(); }
  function listFor(who, r) {
    return D.chores.filter(function (c) { return c.r === r.id && c.who === who; })
      .sort(function (a, b) { return (a.done - b.done) || ((b.overdue ? 1 : 0) - (a.overdue ? 1 : 0)); });
  }

  function row(c, p) {
    var pend = V.pending[c.id];
    return '<button class="ch' + (c.done ? ' is-done' : '') + (pend ? ' is-checking' : '') + (c.overdue && !c.done ? ' is-overdue' : '') + '" data-ch="' + c.id + '">' +
      '<span class="ch-emoji">' + c.emoji + '<span class="ch-check"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 12.5l4.5 4.5L19 7"/></svg></span></span>' +
      '<span class="ch-text"><b>' + App.esc(c.title) + '</b>' +
      (c.overdue && !c.done ? '<small class="ch-late">Overdue</small>' : c.stars ? '<small>' + App.icon('star', 14, 'i--fill') + c.stars + (c.doneBy ? ' · ' + App.person(c.doneBy).name : '') + '</small>' : (c.doneBy ? '<small>by ' + App.person(c.doneBy).name + '</small>' : '')) +
      '</span>' +
      '</button>';
  }

  function weekGrid(id) {
    var w = D.week[id];
    if (!w) return '';
    var today = (App.now().getDay() + 6) % 7;
    return '<div class="ch-week"><div class="label">This week</div><div class="ch-week-row">' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (d, i) {
      var cls = i > today ? 'is-future' : i === today ? 'is-today' : (w[i] ? 'is-hit' : 'is-miss');
      return '<span class="' + cls + '"><i></i>' + d + '</span>';
    }).join('') + '</div></div>';
  }

  function lane(who, r) {
    var p = App.person(who), list = listFor(who, r);
    var done = list.filter(function (c) { return c.done; }).length;
    var all = list.length && done === list.length;
    var kid = D.stars[who] != null;
    return '<section class="ch-lane' + (all ? ' is-complete' : '') + '" data-lane="' + who + '" style="' + App.pstyle(p) + '">' +
      '<header class="ch-head">' + App.avatar(p, 42) +
      '<div><b>' + (who === 'any' ? 'Anyone' : p.name) + '</b>' +
      (kid ? '<span class="ch-stars">' + App.icon('star', 18, 'i--fill') + '<span class="num">' + D.stars[who] + '</span></span>' : '<span class="ch-sub">' + (who === 'any' ? 'Up for grabs' : (list.length ? done + ' of ' + list.length : 'Nothing')) + '</span>') + '</div>' +
      '<div class="ch-ring">' + App.ring(done, list.length || 1, 46) + '<span class="num">' + (all ? '✓' : list.length ? done + '/' + list.length : '–') + '</span></div>' +
      '<button class="ch-add" data-add-chore="' + who + '" aria-label="Add chore for ' + App.esc(who === 'any' ? 'Anyone' : p.name) + '">+</button>' +
      '</header>' +
      '<div class="ch-list">' + (list.length ? list.map(function (c) { return row(c, p); }).join('') : '<div class="ch-none serif"><i>Nothing this ' + (r.id === 'evening' ? 'evening' : r.id === 'morning' ? 'morning' : 'afternoon') + '</i></div>') +
      (all ? '<div class="ch-alldone serif">All done<i>!</i></div>' : '') + '</div>' +
      weekGrid(who) +
      '</section>';
  }

  function googleTasks() {
    var tasks = window.DASHBOARD_INTEGRATIONS.tasks;
    return '<div class="ch-lanes ch-lanes--google"><section class="ch-lane">' +
      '<header class="ch-head"><div><b>Google Tasks</b><span class="ch-sub">Synced online</span></div></header>' +
      '<div class="ch-list">' + (tasks.length ? tasks.map(function (task) {
        var due = task.due ? new Date(task.due) : null;
        var dueText = due && Number.isFinite(+due) ? 'Due ' + App.fmt.monthShort(due) + ' ' + due.getDate() : task.list;
        return '<button class="ch' + (task.completed ? ' is-done' : '') + '" data-google-task="' + App.esc(task.id) + '" data-google-list="' + App.esc(task.listId) + '"' + (task.choreId ? ' disabled' : '') + '><span class="ch-emoji">' + (task.completed ? '✓' : '□') + '</span>' +
          '<span class="ch-text"><b>' + App.esc(task.title) + '</b><small>' + (task.choreId ? 'Linked chore · complete from Chores' : App.esc(dueText)) + '</small></span></button>';
      }).join('') : '<div class="ch-none serif"><i>No Google Tasks found.</i></div>') + '</div></section></div>';
  }

  function addGoogleTask() {
    App.sheet('<div class="sheet-pad"><div class="label">Google Tasks</div><h2 class="serif sheet-h">New task</h2>' +
      '<input class="big-input serif" placeholder="What needs doing?" data-google-task-title>' +
      '<div class="sheet-actions"><button class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--solid" data-save-google-task>Add task</button></div></div>', {
      onMount: function (sheet, close) {
        var input = sheet.querySelector('[data-google-task-title]');
        sheet.addEventListener('click', function (event) {
          var button = event.target.closest('[data-save-google-task]');
          if (!button) return;
          var title = input.value.trim();
          if (!title) { input.focus(); return; }
          button.disabled = true;
          window.DASHBOARD_INTEGRATIONS.createTask({ title: title }).then(function () {
            close();
            App.toast('Added <b>' + App.esc(title) + '</b> to Google Tasks', { icon: 'check' });
          }).catch(function () {
            button.disabled = false;
            App.toast('Couldn’t add this task to Google Tasks', { tone: 'error', icon: 'check' });
          });
        });
      }
    });
  }

  function confirmChoreSync() {
    var unlinked = D.chores.filter(function (chore) {
      return !window.DASHBOARD_INTEGRATIONS.tasks.some(function (task) { return task.choreId === chore.id; });
    }).length;
    App.sheet('<div class="sheet-pad"><div class="label">Google Tasks</div><h2 class="serif sheet-h">Sync family chores?</h2>' +
      '<p class="sheet-p">Create up to ' + unlinked + ' Google Tasks for chores that are not linked yet. Existing linked tasks will not be duplicated.</p>' +
      '<div class="sheet-actions"><button class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--solid" data-confirm-chore-sync>Sync chores</button></div></div>', {
      onMount: function (sheet, close) {
        sheet.addEventListener('click', function (event) {
          var button = event.target.closest('[data-confirm-chore-sync]');
          if (!button) return;
          button.disabled = true;
          window.DASHBOARD_INTEGRATIONS.syncChores().then(function (result) {
            close();
            App.toast('Synced ' + result.created + ' chores to Google Tasks', { icon: 'check' });
          }).catch(function () {
            button.disabled = false;
            App.toast('Couldn’t sync chores to Google Tasks', { tone: 'error', icon: 'check' });
          });
        });
      }
    });
  }

  function render() {
    var google = V.source === 'google' && window.DASHBOARD_INTEGRATIONS.status.tasks;
    var r = routine(), auto = App.currentRoutine();
    var inR = D.chores.filter(function (c) { return c.r === r.id; });
    var done = inR.filter(function (c) { return c.done; }).length;
    V.el.innerHTML = '<div class="tasks">' +
      '<header class="t-head">' +
      '<div class="t-title"><div class="label">' + (google ? 'Google Tasks · online' : window.DASHBOARD_INTEGRATIONS.status.tasks ? 'Chores · Google connected' : 'Local · saved on this device') + '</div><h1 class="serif">' + (google ? 'Tasks' : r.name) + '</h1></div>' +
      (!google ? '<button class="btn btn--solid t-add" data-add-chore aria-label="Add a chore">' + App.icon('plus', 20) + 'Add chore</button>' : '') +
      (window.DASHBOARD_INTEGRATIONS.status.tasks ? '<div class="seg"><button class="' + (!google ? 'is-on' : '') + '" data-source="chores">Chores</button><button class="' + (google ? 'is-on' : '') + '" data-source="google">Google Tasks</button></div>' : '') +
      (google ? '<div class="seg"><button data-add-google-task>Add task</button><button data-sync-chores>Sync chores</button></div>' : '') +
      (!google ? '<div class="seg">' + D.routines.map(function (x) { return '<button class="' + (x.id === r.id ? 'is-on' : '') + '" data-r="' + x.id + '">' + x.name + '</button>'; }).join('') + '</div>' +
      '<div class="t-progress"><span class="num">' + done + '<small>/' + inR.length + '</small></span><div class="t-bar"><i style="width:' + (inR.length ? done / inR.length * 100 : 0) + '%"></i></div><span class="label">done</span></div>' : '') +
      '</header>' +
      (google ? googleTasks() : '<div class="ch-lanes">' + LANES.map(function (w) { return lane(w, r); }).join('') + '</div>') +
      '</div>';
  }

  function complete(c, btn, by) {
    var r = routine();
    var linked = window.DASHBOARD_INTEGRATIONS.tasks.filter(function (task) { return task.choreId === c.id; })[0];
    V.pending[c.id] = true;
    btn.classList.add('is-checking');
    function finish() {
      delete V.pending[c.id];
      c.done = true;
      if (by) c.doneBy = by;
      if (c.id.indexOf('custom-') === 0) saveCustomChores();
      var earner = D.stars[c.who] != null ? c.who : (by && D.stars[by] != null ? by : null);
      if (earner && c.stars) D.stars[earner] += c.stars;
      render();
      App.emit('data');
      var laneList = listFor(c.who, r);
      var laneDone = laneList.every(function (x) { return x.done; });
      var allDone = D.chores.filter(function (x) { return x.r === r.id; }).every(function (x) { return x.done; });
      if (allDone) {
        App.toast('<b>' + r.name + ' routine complete!</b> Everyone crushed it.', { icon: 'star', ms: 5000 });
        return;
      }
      App.toast('<b>' + App.esc(c.title) + '</b> done' + (earner && c.stars ? ' · +' + c.stars + '★ ' + App.person(earner).name : ''), {
        icon: 'check',
        undo: function () {
          function undoLocal() {
            c.done = false;
            delete c.doneBy;
            if (c.id.indexOf('custom-') === 0) saveCustomChores();
            if (earner && c.stars) D.stars[earner] -= c.stars;
            render();
            App.emit('data');
          }
          if (linked) {
            window.DASHBOARD_INTEGRATIONS.updateTask(linked, false).then(undoLocal).catch(function () {
              App.toast('Couldn’t undo this Google Task update', { tone: 'error', icon: 'check' });
            });
          } else undoLocal();
        }
      });
    }
    function failed() {
      delete V.pending[c.id];
      render();
      App.toast('Couldn’t update the linked Google Task', { tone: 'error', icon: 'check' });
    }
    if (linked) window.DASHBOARD_INTEGRATIONS.updateTask(linked, true).then(finish).catch(failed);
    else setTimeout(finish, 350);
  }

  // "Anyone" chores ask who did it, so stars go to the right kid
  function whoDidIt(c, btn) {
    App.sheet('<div class="sheet-pad"><div class="label">' + c.emoji + ' ' + App.esc(c.title) + '</div><h2 class="serif sheet-h">Who did it?</h2>' +
      '<div class="add-who add-who--big">' + D.people.map(function (p) {
        return '<button class="who-btn" data-by="' + p.id + '" style="' + App.pstyle(p) + '">' + App.avatar(p, 88) + '<span>' + p.name + '</span></button>';
      }).join('') + '</div></div>', {
      onMount: function (s, close) {
        s.addEventListener('click', function (e) {
          var b = e.target.closest('[data-by]');
          if (!b) return;
          close();
          var fresh = V.el.querySelector('[data-ch="' + c.id + '"]');
          complete(c, fresh || btn, b.dataset.by);
        });
      }
    });
  }

  function onClick(e) {
    var t;
    if ((t = e.target.closest('[data-add-google-task]'))) return addGoogleTask();
    if ((t = e.target.closest('[data-add-chore]'))) return addChore(t.dataset.addChore);
    if ((t = e.target.closest('[data-sync-chores]'))) return confirmChoreSync();
    if ((t = e.target.closest('[data-google-task]'))) {
      var task = window.DASHBOARD_INTEGRATIONS.tasks.filter(function (item) {
        return item.id === t.dataset.googleTask && item.listId === t.dataset.googleList;
      })[0];
      if (!task || task.choreId) return;
      t.disabled = true;
      window.DASHBOARD_INTEGRATIONS.updateTask(task, !task.completed).catch(function () {
        t.disabled = false;
        App.toast('Couldn’t update this Google Task', { tone: 'error', icon: 'check' });
      });
      return;
    }
    if ((t = e.target.closest('[data-source]'))) { V.source = t.dataset.source; return render(); }
    if ((t = e.target.closest('[data-r]'))) { V.routine = t.dataset.r === App.currentRoutine().id ? null : t.dataset.r; return render(); }
    if ((t = e.target.closest('[data-ch]'))) {
      var c = D.chores.filter(function (x) { return x.id === t.dataset.ch; })[0];
      if (!c || V.pending[c.id]) return;
      if (c.done) {
        var linked = window.DASHBOARD_INTEGRATIONS.tasks.filter(function (task) { return task.choreId === c.id; })[0];
        if (linked) {
          V.pending[c.id] = true;
          render();
          window.DASHBOARD_INTEGRATIONS.updateTask(linked, false).then(function () {
            var earner = D.stars[c.who] != null ? c.who : (c.doneBy && D.stars[c.doneBy] != null ? c.doneBy : null);
            if (earner && c.stars) D.stars[earner] -= c.stars;
            delete c.doneBy;
            if (c.id.indexOf('custom-') === 0) saveCustomChores();
            delete V.pending[c.id];
            render();
            App.emit('data');
          }).catch(function () {
            delete V.pending[c.id];
            render();
            App.toast('Couldn’t update the linked Google Task', { tone: 'error', icon: 'check' });
          });
          return;
        }
        c.done = false;
        var earner = D.stars[c.who] != null ? c.who : (c.doneBy && D.stars[c.doneBy] != null ? c.doneBy : null);
        if (earner && c.stars) D.stars[earner] -= c.stars;
        delete c.doneBy;
        if (c.id.indexOf('custom-') === 0) saveCustomChores();
        render();
        App.emit('data');
        return;
      }
      if (c.who === 'any') return whoDidIt(c, t);
      complete(c, t);
    }
  }

  App.register('tasks', {
    show: function (el) {
      if (!V.el) { V.el = el; loadCustomChores(); el.addEventListener('click', onClick); }
      render();
    }
  });
  App.on('time', function () { V.routine = null; });
})();
