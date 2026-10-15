// Agents: AI plan usage at a glance (inspired by CodexBar). Display only.
(function () {
  'use strict';
  var D = window.DATA;
  var V = { el: null, loaded: Date.now(), synced: Date.now() - 2 * 60000, view: 'usage', chat: [], sending: false };

  function pstyle(a) { return '--c:' + a.color + ';--c-rgb:' + a.rgb; }
  function minsLeft(m) { return Math.max(0, m.left - (Date.now() - V.loaded) / 60000); }
  function fmtLeft(min) {
    min = Math.round(min);
    if (min < 60) return min + 'm';
    if (min < 1440) return Math.floor(min / 60) + 'h ' + (min % 60) + 'm';
    return Math.floor(min / 1440) + 'd ' + Math.floor((min % 1440) / 60) + 'h';
  }
  function fmtTokens(m) { return m >= 10 ? Math.round(m) + 'M' : m.toFixed(1) + 'M'; }

  function meter(m, ai, mi) {
    var left = minsLeft(m);
    var pace = Math.round((1 - left / m.win) * 100); // where even usage would be right now
    var diff = m.used - pace;
    var hot = m.used >= 85;
    var paceText = Math.abs(diff) < 3 ? 'On pace' : diff > 0 ? diff + '% over pace' : -diff + '% under pace';
    return '<div class="ag-meter' + (hot ? ' is-hot' : '') + '">' +
      '<div class="ag-meter-top"><span class="ag-label">' + m.label + '</span>' +
      '<span class="ag-pct num">' + m.used + '<small>%</small></span></div>' +
      '<div class="ag-bar"><i style="width:' + m.used + '%"></i><em data-pace-mark style="left:' + pace + '%" title="Even pace"></em></div>' +
      '<div class="ag-meter-foot" data-meter="' + ai + ',' + mi + '"><span>' + (m.detail ? m.detail + ' · ' : '') + 'Resets in <b data-reset>' + fmtLeft(left) + '</b></span>' +
      '<span class="ag-pace' + (diff >= 3 ? ' is-over' : '') + '" data-pace>' + paceText + '</span></div>' +
      '</div>';
  }

  function spark(vals) {
    var w = 112, h = 34, max = Math.max.apply(null, vals);
    var pts = vals.map(function (v, i) { return (i / (vals.length - 1) * w).toFixed(1) + ',' + (h - 3 - v / max * (h - 6)).toFixed(1); });
    var last = pts[pts.length - 1].split(',');
    return '<svg class="ag-spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<polyline points="' + pts.join(' ') + '"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="3.5"/></svg>';
  }

  function card(a) {
    var hot = a.meters.some(function (m) { return m.used >= 85; });
    var status = a.status === 'ok'
      ? '<span class="ag-status"><i></i>Operational</span>'
      : '<span class="ag-status is-warn"><i></i>Degraded</span>';
    return '<section class="ag-card" style="' + pstyle(a) + '">' +
      '<header class="ag-head"><div class="ag-id"><i class="ag-swatch"></i><b>' + a.name + '</b><span class="ag-plan">' + a.plan + '</span></div>' + status + '</header>' +
      (a.incident ? '<div class="ag-incident">' + App.icon('bolt', 16) + a.incident + '</div>' : hot ? '<div class="ag-incident ag-incident--hot">' + App.icon('clock', 16) + 'Near the session limit</div>' : '') +
      a.meters.map(function (m, mi) { return meter(m, D.agents.indexOf(a), mi); }).join('') +
      '<footer class="ag-foot"><div><span class="num">' + fmtTokens(a.tokens) + '</span><small>tokens today</small></div>' +
      '<div><span class="num">' + (a.cost ? '$' + a.cost.toFixed(2) : 'Incl.') + '</span><small>' + (a.cost ? 'API cost' : 'in plan') + '</small></div>' +
      spark(a.week) + '</footer>' +
      '</section>';
  }

  function summary() {
    var now = App.now();
    var totals = [0, 1, 2, 3, 4, 5, 6].map(function (i) {
      return D.agents.reduce(function (s, a) { return s + a.week[i]; }, 0);
    });
    var max = Math.max.apply(null, totals);
    var week = totals.reduce(function (s, v) { return s + v; }, 0);
    var cost = D.agents.reduce(function (s, a) { return s + a.cost; }, 0);
    var bars = totals.map(function (t, i) {
      var d = App.addDays(now, i - 6);
      return '<div class="ag-col' + (i === 6 ? ' is-today' : '') + '"><div class="ag-stack" style="height:' + (t / max * 100) + '%">' +
        D.agents.map(function (a) { return '<i style="' + pstyle(a) + ';flex-grow:' + a.week[i] + '"></i>'; }).join('') +
        '</div><span>' + (i === 6 ? 'Today' : App.fmt.dayShort(d)) + '</span></div>';
    }).join('');
    return '<section class="ag-card ag-sum">' +
      '<header class="ag-head"><div class="ag-id"><b>All agents</b><span class="ag-plan">Last 7 days</span></div></header>' +
      '<div class="ag-sum-stats"><div><span class="num">' + fmtTokens(week) + '</span><small>tokens</small></div>' +
      '<div><span class="num">$' + cost.toFixed(0) + '</span><small>API cost today</small></div></div>' +
      '<div class="ag-chart">' + bars + '</div>' +
      '<div class="ag-legend">' + D.agents.map(function (a) { return '<span style="' + pstyle(a) + '"><i></i>' + a.name + '</span>'; }).join('') + '</div>' +
      '</section>';
  }

  function paceOf(m) {
    var left = minsLeft(m), pace = Math.round((1 - left / m.win) * 100), diff = m.used - pace;
    return { left: left, pace: pace, diff: diff, text: Math.abs(diff) < 3 ? 'On pace' : diff > 0 ? diff + '% over pace' : -diff + '% under pace' };
  }
  // Minute tick: update countdown + pace text in place (no rebuild, so switching here stays instant).
  function tick() {
    if (!V.el || !V.el.firstChild) return;
    App.$$('[data-meter]', V.el).forEach(function (foot) {
      var ix = foot.dataset.meter.split(','), m = D.agents[+ix[0]].meters[+ix[1]], p = paceOf(m);
      foot.querySelector('[data-reset]').textContent = fmtLeft(p.left);
      var pe = foot.querySelector('[data-pace]');
      pe.textContent = p.text;
      pe.classList.toggle('is-over', p.diff >= 3);
      foot.parentNode.querySelector('[data-pace-mark]').style.left = p.pace + '%';
    });
    var sync = V.el.querySelector('.ag-sync .label');
    if (sync) sync.textContent = synced();
  }

  function synced() {
    var m = Math.round((Date.now() - V.synced) / 60000);
    return m < 1 ? 'Updated just now' : 'Updated ' + m + ' min ago';
  }

  function aiChat() {
    var configured = window.DASHBOARD_INTEGRATIONS.status.workersAi;
    var messages = V.chat.map(function (message) {
      return '<article class="ag-chat-message ag-chat-message--' + message.role + '"><span class="label">' + (message.role === 'user' ? 'You' : 'Assistant') + '</span><p>' + App.esc(message.content) + '</p></article>';
    }).join('');
    var empty = V.chat.length ? '' : '<div class="ag-chat-empty"><span class="label">Cloudflare Workers AI</span><h2 class="serif">What can I help with?</h2><p>Ask a question. This conversation stays in this browser tab.</p></div>';
    var notice = configured ? '' : '<p class="ag-chat-notice">Workers AI requires an AI binding and a Wrangler session authenticated with Cloudflare.</p>';
    return '<section class="ag-chat"><div class="ag-chat-log" role="log" aria-live="polite">' + empty + messages +
      (V.sending ? '<article class="ag-chat-message ag-chat-message--assistant"><span class="label">Assistant</span><p>Thinking…</p></article>' : '') + '</div>' + notice +
      '<form class="ag-chat-form" data-ai-form><textarea data-ai-input maxlength="4000" rows="2" placeholder="Message the assistant" aria-label="Message the assistant"' + (!configured || V.sending ? ' disabled' : '') + '></textarea>' +
      '<div class="ag-chat-actions"><span class="label">' + App.esc(window.DASHBOARD_INTEGRATIONS.aiModel) + ' · Cloudflare Workers AI free daily allocation</span>' +
      '<div><button class="btn btn--ghost" type="button" data-clear-chat' + (!V.chat.length || V.sending ? ' disabled' : '') + '>New chat</button>' +
      '<button class="btn btn--solid" type="submit"' + (!configured || V.sending ? ' disabled' : '') + '>Send</button></div></div></form></section>';
  }

  function render() {
    V.el.innerHTML = '<div class="agents">' +
      '<header class="ag-top"><div><div class="label">AI plans · usage limits</div><h1 class="serif">Agents</h1></div>' +
      '<div class="ag-sync"><div class="seg"><button class="' + (V.view === 'usage' ? 'is-on' : '') + '" data-agent-view="usage">Usage</button><button class="' + (V.view === 'ai' ? 'is-on' : '') + '" data-agent-view="ai">AI Chat</button></div>' +
      (V.view === 'usage' ? '<span class="label">' + synced() + '</span><button class="icon-btn" data-refresh aria-label="Refresh">' + App.icon('undo', 26) + '</button>' : '') + '</div></header>' +
      (V.view === 'ai' ? aiChat() : '<div class="ag-grid">' + D.agents.map(card).join('') + summary() + '</div>') +
      '</div>';
    if (V.view === 'ai') {
      var log = V.el.querySelector('.ag-chat-log');
      log.scrollTop = log.scrollHeight;
    }
  }

  function sendChat(event) {
    event.preventDefault();
    if (V.sending || !window.DASHBOARD_INTEGRATIONS.status.workersAi) return;
    var input = V.el.querySelector('[data-ai-input]');
    var text = input.value.trim();
    if (!text) return;
    V.chat.push({ role: 'user', content: text });
    V.sending = true;
    render();
    window.DASHBOARD_INTEGRATIONS.chatWithAI(V.chat.slice(-12)).then(function (result) {
      V.chat.push({ role: 'assistant', content: result.text });
      V.chat = V.chat.slice(-40);
      V.sending = false;
      render();
    }).catch(function () {
      V.chat.push({ role: 'assistant', content: 'The assistant could not respond. Check the Wrangler session and Workers AI quota.' });
      V.chat = V.chat.slice(-40);
      V.sending = false;
      render();
    });
  }

  App.register('agents', {
    show: function (el) {
      if (!V.el) {
        V.el = el;
        el.addEventListener('click', function (e) {
          var view = e.target.closest('[data-agent-view]');
          if (view) { V.view = view.dataset.agentView; return render(); }
          if (e.target.closest('[data-clear-chat]')) { V.chat = []; return render(); }
          var b = e.target.closest('[data-refresh]');
          if (!b) return;
          V.synced = Date.now();
          render();
        });
        el.addEventListener('submit', function (e) {
          if (e.target.matches('[data-ai-form]')) sendChat(e);
        });
      }
      render();
    }
  });
  App.on('workers-ai-status', function () { if (V.el && V.view === 'ai') render(); });
  App.on('minute', tick);
})();
