/* Launcher-Logik: Kacheln aus apps.js zeichnen + Einstellungen/Backup */
(function () {
  'use strict';

  var apps = self.APPS || [];
  var prefs = Shell.store('launcher');

  /* ---------- Datum über dem Titel ---------- */
  document.getElementById('date').textContent =
    new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  /* ---------- App-Raster ---------- */
  var grid = document.getElementById('grid');

  function isImage(icon) { return /\.(png|jpe?g|webp|gif|svg)$/i.test(icon || ''); }

  function render() {
    grid.innerHTML = '';
    if (!apps.length) {
      grid.outerHTML = '<div class="empty"><div class="empty-icon">📦</div>Noch keine Apps. Trag deine erste in <code>apps.js</code> ein.</div>';
      return;
    }
    apps.forEach(function (app, i) {
      var a = document.createElement('a');
      a.className = 'tile';
      a.href = app.path;
      a.style.setProperty('--i', i);
      a.style.setProperty('--tile-color', app.color || '#8E8E93');

      var icon = document.createElement('span');
      icon.className = 'tile-icon';
      if (isImage(app.icon)) {
        var img = document.createElement('img');
        img.src = app.icon; img.alt = '';
        icon.appendChild(img);
      } else if (app.icon) {
        icon.textContent = app.icon;
      } else {
        var letter = document.createElement('span');
        letter.className = 'letter';
        letter.textContent = (app.name || '?').charAt(0).toUpperCase();
        icon.appendChild(letter);
      }

      var name = document.createElement('span');
      name.className = 'tile-name';
      name.textContent = app.name;

      a.append(icon, name);
      grid.appendChild(a);
    });
  }
  render();

  /* ---------- Hinweis "Zum Home-Bildschirm" (nur iOS-Safari) ---------- */
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var hint = document.getElementById('install-hint');
  if (isIOS && !Shell.isStandalone && !prefs.get('hintDismissed', false)) hint.hidden = false;
  document.getElementById('dismiss-hint').addEventListener('click', function () {
    hint.hidden = true;
    prefs.set('hintDismissed', true);
  });

  /* ---------- Einstellungen ---------- */
  var sheet = document.getElementById('settings');

  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1).replace('.', ',') + ' KB';
    return (b / 1024 / 1024).toFixed(2).replace('.', ',') + ' MB';
  }

  function refreshStats() {
    var s = Backup.stats();
    document.getElementById('st-count').textContent = s.count;
    document.getElementById('st-size').textContent = formatBytes(s.bytes);
    var persistEl = document.getElementById('st-persist');
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(function (p) { persistEl.textContent = p ? 'Ja' : 'Nein'; });
    } else {
      persistEl.textContent = 'unbekannt';
    }
  }

  document.getElementById('open-settings').addEventListener('click', function () {
    refreshStats();
    sheet.showModal();
  });

  document.getElementById('bk-save').addEventListener('click', function () {
    Backup.save().then(function (result) {
      if (result === 'downloaded') Shell.toast('Backup heruntergeladen');
    });
  });

  document.getElementById('bk-copy').addEventListener('click', function () {
    Backup.copy().then(
      function () { Shell.toast('Backup kopiert'); },
      function () { Shell.toast('Kopieren nicht möglich'); }
    );
  });

  function importText(text) {
    var info;
    try { info = Backup.preview(text); } catch (e) { alert(e.message); return; }
    var msg = info.count + ' Einträge importieren?';
    if (info.overwrites) msg += '\n\n' + info.overwrites + ' davon gibt es schon – sie werden überschrieben.';
    if (!confirm(msg)) return;
    var n = Backup.restore(text);
    refreshStats();
    Shell.toast(n + ' Einträge wiederhergestellt');
  }

  document.getElementById('bk-file').addEventListener('click', function () {
    Backup.pickFile().then(importText, function () {});
  });

  document.getElementById('bk-paste').addEventListener('click', function () {
    Backup.readClipboard().then(importText, function (e) { if (e && e.message) Shell.toast(e.message); });
  });

  document.getElementById('reload').addEventListener('click', function () {
    var done = function () { location.reload(); };
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration()
        .then(function (reg) { return reg && reg.update(); })
        .then(done, done);
    } else {
      done();
    }
  });
})();
