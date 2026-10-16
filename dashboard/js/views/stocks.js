// Favorite stock quotes from the Worker-backed Finnhub integration.
(function () {
  'use strict';
  var V = {
    el: null,
    symbols: [],
    quotes: {},
    errors: {},
    configured: false,
    statusChecked: false,
    loading: false,
    statusError: '',
    refreshError: '',
    refreshedAt: 0
  };
  var STORAGE_KEY = 'home-hq-favorite-stocks-v1';
  var SYMBOL_RE = /^[A-Z][A-Z0-9.-]{0,9}$/;
  var MAX_SYMBOLS = 12;

  function loadSymbols() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      var symbols = JSON.parse(saved);
      if (!Array.isArray(symbols) || symbols.length > MAX_SYMBOLS ||
          symbols.some(function (symbol) { return typeof symbol !== 'string' || !SYMBOL_RE.test(symbol); })) {
        throw new Error('Saved stock list is invalid');
      }
      V.symbols = Array.from(new Set(symbols));
    } catch (error) {
      V.statusError = 'Saved favorites could not be loaded. Your stock list has not been changed.';
    }
  }

  function saveSymbols(symbols) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
      V.symbols = symbols;
      return true;
    } catch (error) {
      App.toast('Couldn’t save stock favorites on this device.', { tone: 'error', icon: 'check' });
      return false;
    }
  }

  function money(value) {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
  }

  function quoteCard(symbol) {
    var quote = V.quotes[symbol], error = V.errors[symbol];
    var change = quote && Number.isFinite(quote.change) ? quote.change : null;
    var percentChange = quote && Number.isFinite(quote.percentChange) ? quote.percentChange : null;
    var changeClass = change == null ? '' : change >= 0 ? ' is-up' : ' is-down';
    var quoteTime = quote && quote.timestamp ? new Date(quote.timestamp * 1000) : null;
    var meta = quoteTime && Number.isFinite(+quoteTime)
      ? 'Provider quote · ' + App.fmt.time(quoteTime)
      : error || (V.loading ? 'Loading latest quote…' : 'Quote unavailable');
    return '<article class="stock-card' + changeClass + '">' +
      '<div class="stock-card-head"><div><span class="stock-symbol">' + App.esc(symbol) + '</span><span class="stock-name">US-listed quote</span></div>' +
      '<button class="stock-remove" data-stock-remove="' + App.esc(symbol) + '" aria-label="Remove ' + App.esc(symbol) + '">×</button></div>' +
      '<div class="stock-price">' + (quote ? money(quote.price) : '<span class="stock-placeholder">' + (V.loading ? '…' : '—') + '</span>') + '</div>' +
      '<div class="stock-change' + changeClass + '">' +
      (change == null ? 'Waiting for quote' : (change >= 0 ? '+' : '') + money(change) +
        (percentChange == null ? '' : ' · ' + (percentChange >= 0 ? '+' : '') + percentChange.toFixed(2) + '%')) +
      '</div><div class="stock-range"><span>Day low <b>' + money(quote && quote.low) + '</b></span><span>Day high <b>' + money(quote && quote.high) + '</b></span></div>' +
      '<div class="stock-meta">' + App.esc(meta) + '</div></article>';
  }

  function render() {
    var configuredText = V.configured ? 'Finnhub connected' : 'Finnhub API key required';
    V.el.innerHTML = '<div class="stocks">' +
      '<header class="stock-header"><div><div class="label">Market watch · personal favorites</div><h1>Stocks</h1></div>' +
      '<div class="stock-actions"><span class="stock-provider ' + (V.configured ? 'is-ready' : '') + '">' + App.esc(configuredText) + '</span>' +
      '<button class="icon-btn" data-stock-refresh aria-label="Refresh quotes" ' + (!V.configured || V.loading ? 'disabled' : '') + '>' + App.icon('undo', 22) + '</button></div></header>' +
      '<form class="stock-add" data-stock-form><label for="stock-symbol">Add a ticker</label><input id="stock-symbol" maxlength="10" autocapitalize="characters" autocomplete="off" placeholder="e.g. AAPL" aria-label="Stock ticker symbol">' +
      '<button class="btn btn--solid" type="submit" ' + (V.symbols.length >= MAX_SYMBOLS ? 'disabled' : '') + '>Add favorite</button>' +
      '<span class="stock-count">' + V.symbols.length + ' / ' + MAX_SYMBOLS + '</span></form>' +
      (V.statusError ? '<p class="stock-notice is-error">' + App.esc(V.statusError) + '</p>' : '') +
      (V.refreshError ? '<p class="stock-notice is-error">' + App.esc(V.refreshError) + '</p>' : '') +
      (!V.configured ? '<p class="stock-notice">Add a Finnhub API key to the Worker to load quotes. Prices are supplied by Finnhub and may be delayed; this dashboard is not investment advice.</p>' : '') +
      '<div class="stock-list">' + (V.symbols.length ? V.symbols.map(quoteCard).join('') :
        '<section class="stock-empty"><span class="stock-empty-icon">' + App.icon('chart', 38) + '</span><h2>Your watchlist</h2><p>Add US-listed ticker symbols such as AAPL, MSFT, NVDA, or BRK.B.</p></section>') +
      '</div><footer class="stock-footer">' + (V.refreshedAt ? 'Last checked ' + App.esc(App.fmt.time(new Date(V.refreshedAt))) : 'Quotes refresh when this screen opens and every 5 minutes') +
      ' · Provider data can be delayed</footer></div>';
  }

  function fetchQuotes() {
    if (!V.configured || !V.symbols.length || V.loading) return Promise.resolve();
    V.loading = true;
    V.refreshError = '';
    render();
    return Promise.all(V.symbols.map(function (symbol) {
      return window.DASHBOARD_INTEGRATIONS.stockQuote(symbol).then(function (quote) {
        V.quotes[symbol] = quote;
        delete V.errors[symbol];
      }).catch(function (error) {
        V.errors[symbol] = error.message || 'Quote request failed';
      });
    })).then(function () {
      V.loading = false;
      V.refreshedAt = Date.now();
      render();
    });
  }

  function checkStatus() {
    if (V.statusChecked) return Promise.resolve();
    V.statusChecked = true;
    return window.DASHBOARD_INTEGRATIONS.stockStatus().then(function (result) {
      V.configured = !!result.configured;
      V.statusError = V.statusError && V.statusError.indexOf('Saved favorites') === 0 ? V.statusError : '';
      render();
      return fetchQuotes();
    }).catch(function (error) {
      V.configured = false;
      V.statusError = error.message || 'Could not check quote service status';
      render();
    });
  }

  function addStock(event) {
    event.preventDefault();
    var input = V.el.querySelector('#stock-symbol');
    var symbol = input.value.trim().toUpperCase();
    if (!SYMBOL_RE.test(symbol)) {
      App.toast('Enter a valid ticker symbol, such as AAPL.', { tone: 'error', icon: 'check' });
      input.focus();
      return;
    }
    if (V.symbols.indexOf(symbol) !== -1) {
      App.toast(symbol + ' is already on your watchlist.', { tone: 'error', icon: 'check' });
      input.focus();
      return;
    }
    if (V.symbols.length >= MAX_SYMBOLS) {
      App.toast('You can save up to ' + MAX_SYMBOLS + ' favorite tickers.', { tone: 'error', icon: 'check' });
      return;
    }
    var next = V.symbols.concat([symbol]);
    if (!saveSymbols(next)) return;
    V.refreshError = '';
    render();
    if (V.configured) fetchQuotes();
  }

  App.register('stocks', {
    show: function (el) {
      if (!V.el) {
        V.el = el;
        loadSymbols();
        el.addEventListener('submit', function (event) {
          if (event.target.matches('[data-stock-form]')) addStock(event);
        });
        el.addEventListener('click', function (event) {
          var remove = event.target.closest('[data-stock-remove]');
          if (remove) {
            var next = V.symbols.filter(function (symbol) { return symbol !== remove.dataset.stockRemove; });
            if (!saveSymbols(next)) return;
            delete V.quotes[remove.dataset.stockRemove];
            delete V.errors[remove.dataset.stockRemove];
            render();
            return;
          }
          if (event.target.closest('[data-stock-refresh]')) {
            V.statusChecked = false;
            checkStatus();
          }
        });
      }
      render();
      checkStatus();
    }
  });
  setInterval(function () {
    if (App.current === 'stocks') fetchQuotes();
  }, 5 * 60 * 1000);
})();
