// Lightweight embedded music player for YouTube and Spotify links.
(function () {
  'use strict';
  var STORAGE_KEY = 'home-hq-music-url-v1';
  var viewEl = null;
  var savedUrl = '';
  var errorText = '';
  var searchQuery = '';
  var searchResults = [];
  var searchError = '';
  var searching = false;

  try {
    savedUrl = localStorage.getItem(STORAGE_KEY) || '';
  } catch (error) {
    errorText = 'Music preferences could not be read from this device.';
  }
  if (savedUrl && !getEmbed(savedUrl)) {
    errorText = 'The saved music link is invalid. Enter a YouTube video or playlist, or a Spotify link.';
  }

  function getEmbed(source) {
    var url;
    try {
      url = new URL(source);
    } catch (error) {
      return null;
    }
    if (url.protocol !== 'https:') return null;

    var host = url.hostname.toLowerCase();
    if (host === 'youtu.be' || host === 'youtube.com' || host === 'www.youtube.com' ||
        host === 'm.youtube.com' || host === 'music.youtube.com') {
      var videoId = host === 'youtu.be'
        ? url.pathname.split('/').filter(Boolean)[0]
        : url.searchParams.get('v');
      var playlistId = url.searchParams.get('list');
      if (!videoId && url.pathname.indexOf('/embed/') === 0) {
        videoId = url.pathname.split('/')[2];
      }
      if (!videoId && !playlistId && url.pathname === '/playlist') return null;

      if (playlistId && /^[A-Za-z0-9_-]{5,}$/.test(playlistId)) {
        var playlist = videoId && /^[A-Za-z0-9_-]{6,}$/.test(videoId)
          ? 'embed/' + encodeURIComponent(videoId) + '?list=' + encodeURIComponent(playlistId)
          : 'embed/videoseries?list=' + encodeURIComponent(playlistId);
        return { provider: 'YouTube', url: 'https://www.youtube-nocookie.com/' + playlist };
      }
      if (videoId && /^[A-Za-z0-9_-]{6,}$/.test(videoId)) {
        return { provider: 'YouTube', url: 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(videoId) };
      }
      return null;
    }

    if (host === 'open.spotify.com') {
      var parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed') parts.shift();
      if (parts[0] && /^intl-[a-z-]+$/i.test(parts[0])) parts.shift();
      var kind = parts[0], id = parts[1];
      if (!['track', 'album', 'playlist', 'artist', 'show', 'episode'].includes(kind) ||
          !id || !/^[A-Za-z0-9]{10,40}$/.test(id)) return null;
      return { provider: 'Spotify', url: 'https://open.spotify.com/embed/' + kind + '/' + encodeURIComponent(id) };
    }
    return null;
  }

  function save(source) {
    try {
      localStorage.setItem(STORAGE_KEY, source);
      savedUrl = source;
      errorText = '';
      return true;
    } catch (error) {
      errorText = 'Music link could not be saved on this device.';
      return false;
    }
  }

  function renderPlayer() {
    var player = viewEl.querySelector('[data-music-player]');
    var empty = viewEl.querySelector('[data-music-empty]');
    var frame = player.querySelector('iframe');
    if (!savedUrl) {
      player.hidden = true;
      empty.hidden = false;
      return;
    }
    var embed = getEmbed(savedUrl);
    if (!embed) {
      player.hidden = true;
      empty.hidden = false;
      errorText = 'The saved music link is invalid. Enter a YouTube video or playlist, or a Spotify track, album, playlist, artist, or show link.';
      return;
    }
    player.hidden = false;
    empty.hidden = true;
    player.querySelector('[data-music-provider]').textContent = embed.provider + ' player';
    frame.allow = 'encrypted-media; fullscreen; picture-in-picture';
    if (frame.src !== embed.url) frame.src = embed.url;
  }

  function renderSearchResults() {
    var resultsEl = viewEl.querySelector('[data-music-results]');
    if (!resultsEl) return;
    resultsEl.innerHTML = searching
      ? '<p class="music-search-message">Searching YouTube…</p>'
      : searchError
        ? '<p class="music-search-message is-error" role="alert">' + App.esc(searchError) + '</p>'
        : searchResults.length
          ? searchResults.map(function (result) {
            return '<button class="music-search-result" type="button" data-video-id="' + encodeURIComponent(result.id) + '">' +
              '<span class="music-search-result-copy"><b>' + App.esc(result.title) + '</b><small>' + App.esc(result.channel || 'YouTube') + '</small></span>' +
              '<span class="music-search-result-action">Play</span></button>';
          }).join('')
          : searchQuery ? '<p class="music-search-message">No videos found. Try another search.</p>' : '';
  }

  function searchYouTube(query, button) {
    searchQuery = query.trim();
    searchError = '';
    searchResults = [];
    searching = true;
    if (button) button.disabled = true;
    renderSearchResults();
    window.DASHBOARD_INTEGRATIONS.searchYouTube(searchQuery).then(function (result) {
      searchResults = (result.results || []).filter(function (item) {
        return item && typeof item.id === 'string' && /^[A-Za-z0-9_-]{6,}$/.test(item.id) &&
          typeof item.title === 'string';
      });
    }).catch(function (error) {
      searchError = error.message || 'YouTube search failed. Try again.';
    }).then(function () {
      searching = false;
      var searchButton = viewEl.querySelector('[data-music-search-submit]');
      if (searchButton) searchButton.disabled = false;
      renderSearchResults();
    });
  }

  function render() {
    viewEl.innerHTML = '<div class="music-view">' +
      '<header class="music-head"><div><div class="label">Listen together</div><h1>Music</h1></div>' +
      '<span class="music-free-badge">YouTube search + Spotify links</span></header>' +
      '<section class="music-search"><form class="music-search-form" data-music-search-form>' +
      '<label for="music-search-query">Search by song or artist</label><div class="music-form-row">' +
      '<input id="music-search-query" name="musicSearch" type="search" maxlength="100" autocomplete="off" placeholder="Try an artist, song, or playlist">' +
      '<button class="btn btn--solid" type="submit" data-music-search-submit>Search</button></div></form>' +
      '<div class="music-search-results" data-music-results aria-live="polite"></div>' +
      '<p class="music-search-note">Search needs a YouTube Data API key configured on the dashboard Worker. Or paste a link below.</p></section>' +
      '<form class="music-form" data-music-form><label for="music-url">Or paste a YouTube or Spotify link</label>' +
      '<div class="music-form-row"><input id="music-url" name="musicUrl" type="url" inputmode="url" autocomplete="url" placeholder="Paste a video, playlist, track, or album link" aria-label="YouTube or Spotify URL" value="' +
      App.esc(savedUrl) + '"><button class="btn btn--solid" type="submit">' + (savedUrl ? 'Load player' : 'Add player') + '</button>' +
      (savedUrl ? '<button class="btn btn--ghost" type="button" data-music-clear>Clear</button>' : '') + '</div></form>' +
      (errorText ? '<p class="music-error" role="status">' + App.esc(errorText) + '</p>' : '') +
      '<section class="music-player" data-music-player hidden><div class="music-player-head"><span data-music-provider></span><span>Playback starts when you press play</span></div>' +
      '<iframe title="Embedded music player" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></section>' +
      '<section class="music-empty" data-music-empty><div class="music-empty-icon">' + App.icon('music', 42) + '</div>' +
      '<h2>Your music, on the frame</h2><p>Search for a YouTube song or artist above and tap a result. For Spotify, paste a track, album, playlist, artist, or show link. Your selection is saved only in this browser.</p></section>' +
      '<p class="music-note">Free playback depends on the provider, account, and content. YouTube may show ads; Spotify may require sign-in and may limit playback. Use the embedded controls to start playback—autoplay is disabled.</p>' +
      '</div>';
    renderPlayer();
    var searchInput = viewEl.querySelector('[name="musicSearch"]');
    searchInput.value = searchQuery;
    renderSearchResults();
  }

  App.register('music', {
    show: function (el) {
      viewEl = el;
      if (!el.dataset.musicBound) {
        el.dataset.musicBound = 'true';
        el.addEventListener('submit', function (event) {
          if (event.target.matches('[data-music-search-form]')) {
            event.preventDefault();
            var searchInput = event.target.querySelector('[name="musicSearch"]');
            var query = searchInput.value.trim();
            if (query.length < 2 || query.length > 100) {
              searchError = 'Enter at least 2 characters to search.';
              searchQuery = query;
              searchResults = [];
              renderSearchResults();
              searchInput.focus();
              return;
            }
            searchYouTube(query, event.target.querySelector('[data-music-search-submit]'));
            return;
          }
          if (!event.target.matches('[data-music-form]')) return;
          event.preventDefault();
          var input = event.target.querySelector('input[name="musicUrl"]');
          var source = input.value.trim();
          if (!getEmbed(source)) {
            errorText = 'Enter an HTTPS YouTube video or playlist, or a Spotify track, album, playlist, artist, or show link.';
            render();
            var nextInput = el.querySelector('input[name="musicUrl"]');
            nextInput.focus();
            return;
          }
          if (save(source)) render();
          else render();
        });
        el.addEventListener('click', function (event) {
          var result = event.target.closest('[data-video-id]');
          if (result) {
            var videoId = decodeURIComponent(result.dataset.videoId);
            if (!/^[A-Za-z0-9_-]{6,}$/.test(videoId)) return;
            var source = 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId);
            if (save(source)) {
              searchQuery = '';
              searchResults = [];
              searchError = '';
              render();
            } else render();
            return;
          }
          if (!event.target.closest('[data-music-clear]')) return;
          try {
            localStorage.removeItem(STORAGE_KEY);
            savedUrl = '';
            errorText = '';
          } catch (error) {
            errorText = 'Music link could not be removed from this device.';
          }
          render();
        });
      }
      render();
    },
    hide: function () {
      if (!viewEl) return;
      var frame = viewEl.querySelector('.music-player iframe');
      if (frame) frame.src = 'about:blank';
    }
  });
})();
