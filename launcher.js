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
      a.dataset.i = i;
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

  /* ---------- Übergang in eine App und zurück ----------
     Wie auf dem iPhone: die Kachel wächst zum Bildschirm und geht dabei in den
     Hintergrund der App über, der Launcher zoomt nach hinten weg. Geladen wird
     erst gegen Ende – die App blendet sich dann auf genau diesem Hintergrund
     ein (shared/shell.js). Zurück läuft alles umgekehrt. So gibt es keinen
     Moment, in dem nach dem Antippen einfach nichts passiert. */

  var html = document.documentElement;
  var launcherEl = document.querySelector('.launcher');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var OPEN_MS = 420, CLOSE_MS = 480;
  var EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';   // schneller Start, weiches Ende
  var LAUNCHER_BACK = 'scale(1.12)';
  var busy = false;

  // Die Überblendung: eine Fläche im Hintergrund der App, darin die
  // Kachelfarbe, darüber eine Kopie des Icons. Bewegt wird nur mit transform
  // und opacity – das rechnet die Grafikkarte, alle Teile bleiben im Takt,
  // auch wenn die Seite gerade mit Laden beschäftigt ist.
  function makeLaunch(app, iconEl, bg) {
    var r = iconEl.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;

    var el = document.createElement('div');
    el.className = 'launch';
    var card = document.createElement('div');
    card.className = 'launch-card';
    card.style.background = bg;
    var color = document.createElement('div');
    color.className = 'launch-color';
    color.style.background = app.color || '#8E8E93';
    card.appendChild(color);
    var icon = iconEl.cloneNode(true);
    icon.classList.add('launch-icon');
    icon.style.setProperty('--tile-color', app.color || '#8E8E93');
    icon.style.left = r.left + 'px';
    icon.style.top = r.top + 'px';
    icon.style.width = r.width + 'px';
    icon.style.height = r.height + 'px';
    el.append(card, icon);

    // Das Icon wächst auf Bildschirmbreite und wandert zur Mitte.
    var dx = vw / 2 - (r.left + r.width / 2);
    var dy = vh / 2 - (r.top + r.height / 2);
    var l = launcherEl.getBoundingClientRect();
    return {
      el: el, card: card, color: color, icon: icon,
      // Die Fläche ist bildschirmgroß und wird auf die Kachel gestaucht. Die
      // Ecken rechnen sich dabei mit: 22,5 % der Fläche sind gestaucht 22,5 %
      // der Kachel, genau die Rundung des Icons.
      small: 'translate(' + r.left + 'px, ' + r.top + 'px) scale(' + r.width / vw + ', ' + r.height / vh + ')',
      big: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + vw / r.width + ')',
      // Der Launcher zoomt um die Kachel herum, nicht um seine Mitte.
      origin: (r.left + r.width / 2 - l.left) + 'px ' + (r.top + r.height / 2 - l.top) + 'px'
    };
  }

  // Fläche von der Kachel auf den Bildschirm (vorwärts) oder zurück. Die Ecken
  // laufen als eigene Animation – gemischt mit ihnen liefe transform nicht mehr
  // auf der Grafikkarte.
  function animateCard(p, forward, opts) {
    var small = { transform: p.small }, full = { transform: 'none' };
    var round = { borderRadius: '22.5%' }, square = { borderRadius: '0%' };
    p.card.animate(forward ? [round, square] : [square, round], opts);
    return p.card.animate(forward ? [small, full] : [full, small], opts);
  }

  function appBg(app) {
    return app.bg || getComputedStyle(html).getPropertyValue('--bg').trim() || '#000';
  }

  function launch(app, tile) {
    if (busy) return;
    busy = true;
    try { sessionStorage.removeItem('appdeck:return'); } catch (e) { /* egal */ }
    var go = function () { window.location.href = tile.href; };
    if (reduceMotion) { go(); return; }

    var iconEl = tile.querySelector('.tile-icon');
    var p = makeLaunch(app, iconEl, appBg(app));
    document.body.appendChild(p.el);
    iconEl.style.visibility = 'hidden';

    var opts = { duration: OPEN_MS, easing: EASE, fill: 'both' };
    animateCard(p, true, opts);
    p.icon.animate([
      { transform: 'none', opacity: 1 },
      { opacity: 0, offset: 0.5 },
      { transform: p.big, opacity: 0 }
    ], opts);
    p.color.animate([{ opacity: 1 }, { opacity: 1, offset: 0.15 }, { opacity: 0 }], opts);
    launcherEl.style.transformOrigin = p.origin;
    launcherEl.animate([{ transform: 'none', opacity: 1 }, { transform: LAUNCHER_BACK, opacity: 0.3 }], opts);

    // Schon vor dem Ende losladen: die Fläche ist dann fast ganz aufgezogen,
    // und der Rest der Animation kostet keine Wartezeit.
    setTimeout(go, OPEN_MS * 0.6);
  }

  grid.addEventListener('click', function (e) {
    var tile = e.target.closest && e.target.closest('a.tile');
    if (!tile || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    launch(apps[Number(tile.dataset.i)], tile);
  });

  // Zurück aus einer App: der Hintergrund der App steht schon da (Skript in
  // index.html) und schrumpft jetzt in ihre Kachel, der Launcher zoomt heran.
  function arrive() {
    var from = null;
    try {
      from = JSON.parse(sessionStorage.getItem('appdeck:return') || 'null');
      sessionStorage.removeItem('appdeck:return');
    } catch (e) { /* dann ohne Übergang */ }
    if (!html.classList.contains('from-app')) return;

    var i = -1;
    for (var k = 0; k < apps.length; k++) if (from && apps[k].path === from.path) i = k;
    var tile = i >= 0 ? grid.querySelector('.tile[data-i="' + i + '"]') : null;
    var opts = { duration: CLOSE_MS, easing: EASE, fill: 'both' };

    if (!tile) {
      // App steht nicht mehr in apps.js: einfach einblenden.
      html.classList.remove('from-app');
      html.style.background = '';
      launcherEl.animate([{ opacity: 0 }, { opacity: 1 }], opts);
      return;
    }

    var iconEl = tile.querySelector('.tile-icon');
    var p = makeLaunch(apps[i], iconEl, from.bg);
    document.body.appendChild(p.el);
    iconEl.style.visibility = 'hidden';
    html.classList.remove('from-app');
    html.style.background = '';

    var shrink = animateCard(p, false, opts);
    p.icon.animate([
      { transform: p.big, opacity: 0 },
      { opacity: 0, offset: 0.5 },
      { transform: 'none', opacity: 1 }
    ], opts);
    p.color.animate([{ opacity: 0 }, { opacity: 1, offset: 0.85 }, { opacity: 1 }], opts);
    launcherEl.style.transformOrigin = p.origin;
    var zoom = launcherEl.animate([{ transform: LAUNCHER_BACK, opacity: 0 }, { transform: 'none', opacity: 1 }], opts);

    shrink.onfinish = function () {
      iconEl.style.visibility = '';
      p.el.remove();
      zoom.cancel();
    };
  }
  arrive();

  // Aus dem Zurück-Cache wiederhergestellt (Safari-Zurück beim Testen): nach
  // dem Öffnen steht sonst noch die aufgezogene Fläche über allem.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    busy = false;
    document.querySelectorAll('.launch').forEach(function (el) { el.remove(); });
    grid.querySelectorAll('.tile-icon').forEach(function (el) { el.style.visibility = ''; });
    launcherEl.getAnimations().forEach(function (a) { a.cancel(); });
  });

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
    // showModal() setzt den Fokus auf den ersten Knopf ("Fertig") - Safari
    // zeichnet darum einen Rahmen. Das Blatt selbst nimmt den Fokus (tabindex=-1).
    sheet.focus({ preventScroll: true });
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
