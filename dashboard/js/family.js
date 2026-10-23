// Editable family names, saved on this device (localStorage) so the frame keeps them across reloads.
(function () {
  'use strict';
  var D = window.DATA, KEY = 'homehq.family.v1';
  var defaults = {};
  D.people.forEach(function (p) { defaults[p.id] = p.name; });

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function apply(names) {
    D.people.forEach(function (p) { p.name = (names[p.id] || defaults[p.id]).slice(0, 14); });
  }
  apply(load());

  function field(p) {
    return '<label class="fam-row" style="' + App.pstyle(p) + '">' + App.avatar(p, 44) +
      '<input type="text" maxlength="14" data-fam="' + p.id + '" value="' + App.esc(p.name) + '" placeholder="' + App.esc(defaults[p.id]) + '" autocomplete="off"></label>';
  }

  App.editFamily = function () {
    App.sheet('<div class="fam-sheet"><div class="label">Family</div><h2 class="serif">Family names</h2>' +
      '<p class="fam-note">Shown on the calendar, chores and Today screen. Saved on this frame only.</p>' +
      D.people.map(field).join('') +
      '<div class="fam-actions"><button class="btn btn--ghost" data-fam-reset>Reset</button>' +
      '<button class="btn btn--solid" data-fam-save>Save</button></div></div>', {
      cls: 'sheet--fam',
      onMount: function (el, close) {
        el.querySelector('[data-fam-reset]').addEventListener('click', function () {
          localStorage.removeItem(KEY);
          apply({});
          done(close);
        });
        el.querySelector('[data-fam-save]').addEventListener('click', function () {
          var names = {};
          el.querySelectorAll('[data-fam]').forEach(function (input) {
            var v = input.value.trim();
            if (v) names[input.dataset.fam] = v;
          });
          localStorage.setItem(KEY, JSON.stringify(names));
          apply(names);
          done(close);
        });
      }
    });
  };

  function done(close) {
    close();
    App.emit('data');
    App.rerender();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-edit-family]')) App.editFamily();
  });
})();
