(function () {
  'use strict';
  var D = window.DATA;
  var V = { el: null };

  function allCameras() {
    var integrations = window.DASHBOARD_INTEGRATIONS;
    var cameras = [];
    if (integrations.status.homeAssistant) cameras = cameras.concat(D.homeAssistantCameras || []);
    if (integrations.status.eufy) cameras = cameras.concat(D.eufyCameras || []);
    return cameras;
  }

  function cameraImage(camera) {
    if (camera.source === 'eufy') {
      return window.DASHBOARD_INTEGRATIONS.url(
        '/api/eufy/cameras/' + encodeURIComponent(camera.id) + '/snapshot?mode=auto&v=' + Date.now()
      );
    }
    return window.DASHBOARD_INTEGRATIONS.url(
      '/api/home-assistant/camera?entity_id=' + encodeURIComponent(camera.entityId) + '&v=' + Date.now()
    );
  }

  function cameraCard(camera) {
    var status = camera.source === 'eufy' ? 'Eufy · live video' : 'Home Assistant · snapshot';
    return '<button class="cam" data-cam="' + App.esc(camera.id) + '">' +
      '<img src="' + App.esc(cameraImage(camera)) + '" alt="Snapshot from ' + App.esc(camera.name) + '">' +
      '<span class="cam-name">' + App.esc(camera.name) + '</span>' +
      '<span class="cam-age">' + status + '</span></button>';
  }

  function cameraStatus(cameras) {
    var integrations = window.DASHBOARD_INTEGRATIONS;
    if (cameras.length) return cameras.length + (cameras.length === 1 ? ' camera connected' : ' cameras connected');
    if (integrations.eufyError) return 'Camera bridge unavailable';
    if (integrations.status.eufy || integrations.status.homeAssistant) return 'No cameras found';
    return 'Connecting to camera bridge…';
  }

  function render() {
    var cameras = allCameras();
    var error = window.DASHBOARD_INTEGRATIONS.eufyError;
    var emptyMessage = error
      ? 'No camera feeds are available right now.'
      : 'Connect the Eufy live-video bridge to view cameras here.';
    V.el.innerHTML = '<div class="camera-view">' +
      '<header class="camera-view-head"><div class="label">Camera system</div>' +
      '<h1 class="serif">Cameras</h1><p>' + App.esc(cameraStatus(cameras)) + '</p></header>' +
      (error ? '<p class="cam-error" role="status">Bridge error: ' + App.esc(error) + '</p>' : '') +
      (cameras.length
        ? '<div class="cams">' + cameras.map(cameraCard).join('') + '</div>'
        : '<div class="camera-empty">' + emptyMessage + '</div>') +
      '</div>';
  }

  App.cameraSheet = function (camera) {
    if (!camera) return;
    if (camera.source === 'eufy') {
      var videoUrl = window.DASHBOARD_INTEGRATIONS.eufyVideoUrl(camera.id);
      var image = cameraImage(camera);
      App.sheet('<div class="cam-big"><div class="cam-live"><iframe src="' + App.esc(videoUrl) +
        '" title="Live video from ' + App.esc(camera.name) +
        '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>' +
        '<div class="cam-big-bar"><span class="tk-live"><i></i>' + App.esc(camera.name) +
        '</span><span class="label label--light">Live video · go2rtc</span></div></div>' +
        '<div class="cam-still"><img data-camera-image src="' + App.esc(image) + '" alt="' +
        App.esc(camera.name) + ' snapshot"></div>' +
        '<div class="cam-refresh"><span data-camera-status role="status">Loading snapshot…</span>' +
        '<button class="btn btn--solid" data-camera-refresh>Refresh snapshot</button></div>', {
        cls: 'sheet--cam',
        onMount: function (sheet) {
          var img = sheet.querySelector('[data-camera-image]');
          var status = sheet.querySelector('[data-camera-status]');
          var refresh = sheet.querySelector('[data-camera-refresh]');
          if (!img || !status || !refresh) return;
          img.onload = function () { status.textContent = 'Snapshot loaded'; refresh.disabled = false; };
          img.onerror = function () { status.textContent = 'Snapshot unavailable'; refresh.disabled = false; };
          refresh.onclick = function () {
            status.textContent = 'Requesting fresh snapshot…';
            refresh.disabled = true;
            img.src = window.DASHBOARD_INTEGRATIONS.url(
              '/api/eufy/cameras/' + encodeURIComponent(camera.id) + '/snapshot?mode=live&v=' + Date.now()
            );
          };
        }
      });
      return;
    }
    App.sheet('<div class="cam-big"><img src="' + App.esc(cameraImage(camera)) +
      '" alt="' + App.esc(camera.name) + '"><div class="cam-big-bar">' +
      '<span class="tk-live"><i></i>' + App.esc(camera.name) +
      '</span><span class="label label--light">Home Assistant snapshot</span></div></div>', {
      cls: 'sheet--cam'
    });
  };

  App.register('control', {
    show: function (el) {
      V.el = el;
      render();
    }
  });

  App.on('data', function () {
    if (App.current === 'control' && V.el) render();
  });

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-cam]');
    if (!button || !V.el || !V.el.contains(button)) return;
    App.cameraSheet(allCameras().filter(function (camera) {
      return camera.id === button.dataset.cam;
    })[0]);
  });
})();
