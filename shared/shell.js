/* ==========================================================================
   shell.js – gemeinsame Helfer für alle Apps
   Einbinden (am Ende von <body>):
     <script src="../../shared/shell.js"></script>

   Optionen am <script>-Tag:
     data-home="bottom-left"   Position des schwebenden Home-Buttons
                               (bottom-left | bottom-right | top-left | top-right | none)

   Stellt window.Shell bereit:
     Shell.store('meine-app')  Speicher mit automatischem Präfix  → get/set/remove/keys/clear
     Shell.home()              zurück zum Launcher (mit Übergang)
     Shell.ready()             App ist gezeichnet → einblenden (ruft lib/mount.tsx auf)
     Shell.toast('Gespeichert')
     Shell.isStandalone        true, wenn als App vom Home-Bildschirm gestartet
   Jedes Element mit data-shell-home führt beim Antippen zum Launcher.
   ========================================================================== */
(function () {
  'use strict';

  var script = document.currentScript;
  var ROOT = new URL('../', script.src).href;           // .../shared/shell.js  →  Repo-Wurzel
  var homePosition = script.getAttribute('data-home') || 'bottom-left';
  var html = document.documentElement;

  var isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  html.classList.toggle('is-standalone', isStandalone);

  /* ---------- Übergang vom und zum Launcher (Gegenstück in launcher.js) ----------
     Der Launcher zoomt die Kachel auf den ganzen Bildschirm, bis nur noch der
     Hintergrund der App zu sehen ist. Die App blendet sich auf genau diesem
     Hintergrund ein, sobald sie gezeichnet ist – und beim Verlassen wieder aus,
     bevor der Launcher die Fläche zurück in die Kachel schrumpft. Die Farbe
     kommt aus <meta name="theme-color"> der App. */

  var appPath = (location.href.slice(ROOT.length).match(/^apps\/[^/?#]+\//) || [''])[0];
  var motion = !!appPath && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Einblenden nur, wenn shell.js im <head> steht (Ionic-Apps): steht es am Ende
  // von <body>, ist die Seite vielleicht schon gezeichnet und würde aufblitzen.
  var enter = motion && !document.body;
  var ENTER_MS = 380, LEAVE_MS = 240;

  function themeColor() {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      var media = metas[i].getAttribute('media');
      if (!media || window.matchMedia(media).matches) return metas[i].content;
    }
    return '';
  }

  if (motion) {
    var style = document.createElement('style');
    style.textContent =
      'html.shell-enter body { opacity: 0; }' +
      'html.shell-enter.shell-shown body { animation: shell-in ' + ENTER_MS + 'ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }' +
      'html.shell-leave body { animation: shell-out ' + LEAVE_MS + 'ms cubic-bezier(0.3, 0.7, 0.3, 1) both; pointer-events: none; }' +
      '@keyframes shell-in { from { opacity: 0; scale: 0.97; } to { opacity: 1; scale: 1; } }' +
      '@keyframes shell-out { from { opacity: 1; scale: 1; } to { opacity: 0; scale: 0.94; } }';
    document.head.appendChild(style);
  }

  // Bis die App steht, zeigt die Seite nur ihren Hintergrund – dieselbe Fläche,
  // mit der der Launcher aufgehört hat. Im Entwicklungsserver kommt das CSS der
  // App erst mit dem JavaScript, darum die Farbe hier schon einmal direkt.
  if (enter) {
    html.classList.add('shell-enter');
    html.style.backgroundColor = themeColor();
  }

  var shown = false;
  function ready() {
    if (shown || !html.classList.contains('shell-enter')) return;
    shown = true;
    requestAnimationFrame(function () {
      html.classList.add('shell-shown');
      setTimeout(function () {
        html.classList.remove('shell-enter', 'shell-shown');
        html.style.backgroundColor = '';
      }, ENTER_MS + 50);
    });
  }

  if (enter) {
    // Ionic-Apps melden sich selbst (lib/mount.tsx). Alles andere steht beim
    // load-Event; und falls eine App sich nie meldet, erscheint sie trotzdem.
    window.addEventListener('load', function () {
      if (!document.querySelector('script[type="module"]')) ready();
      else setTimeout(ready, 3000);
    });
  }

  /* ---------- Navigation ---------- */

  var leaving = false;

  function home() {
    if (leaving) return;
    leaving = true;
    // Sagt dem Launcher, in welche Kachel er die Fläche zurückschrumpfen soll.
    if (appPath) {
      try {
        sessionStorage.setItem('appdeck:return', JSON.stringify({ path: appPath, bg: themeColor() }));
      } catch (e) { /* ohne Übergang weiter */ }
    }
    if (!motion) { window.location.href = ROOT; return; }
    html.style.backgroundColor = themeColor();
    html.classList.remove('shell-enter', 'shell-shown');
    html.classList.add('shell-leave');
    // Schon vor dem Ende losladen: bis der Launcher da ist, ist die App fast
    // ganz ausgeblendet, und der Rest der Animation kostet keine Wartezeit.
    setTimeout(function () { window.location.href = ROOT; }, LEAVE_MS * 0.6);
  }

  // Aus dem Zurück-Cache wiederhergestellt: die App steht wieder normal da.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false;
    html.classList.remove('shell-leave', 'shell-enter', 'shell-shown');
    html.style.backgroundColor = '';
  });

  /* ---------- Speicher mit Präfix (verhindert Kollisionen zwischen Apps) ---------- */

  function store(appId) {
    if (!appId) throw new Error('Shell.store(appId): Bitte eine App-ID angeben.');
    var prefix = appId + ':';
    return {
      get: function (key, fallback) {
        var raw = localStorage.getItem(prefix + key);
        if (raw === null) return fallback;
        try { return JSON.parse(raw); } catch (e) { return raw; }
      },
      set: function (key, value) {
        try {
          localStorage.setItem(prefix + key, JSON.stringify(value));
          return true;
        } catch (e) {
          toast('Speichern fehlgeschlagen – Speicher voll?');
          return false;
        }
      },
      remove: function (key) { localStorage.removeItem(prefix + key); },
      keys: function () {
        return Object.keys(localStorage)
          .filter(function (k) { return k.indexOf(prefix) === 0; })
          .map(function (k) { return k.slice(prefix.length); });
      },
      clear: function () {
        this.keys().forEach(function (k) { localStorage.removeItem(prefix + k); });
      }
    };
  }

  /* ---------- Toast ---------- */

  var toastEl, toastTimer;
  function toast(message, ms) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'shell-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    // Reflow erzwingen, damit die Animation auch bei schnellen Folge-Toasts läuft
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2200);
  }

  /* ---------- UI-Verhalten, sobald das DOM steht ---------- */

  var HOME_ICON =
    '<svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">' +
    '<rect x="2" y="2" width="7" height="7" rx="2"/><rect x="11" y="2" width="7" height="7" rx="2"/>' +
    '<rect x="2" y="11" width="7" height="7" rx="2"/><rect x="11" y="11" width="7" height="7" rx="2"/></svg>';

  function addHomeButton() {
    if (homePosition === 'none') return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'shell-home shell-home--' + homePosition;
    b.setAttribute('aria-label', 'Alle Apps');
    b.innerHTML = HOME_ICON;
    b.addEventListener('click', home);
    document.body.appendChild(b);
  }

  function wireHomeLinks() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-shell-home]');
      if (!el) return;
      e.preventDefault();
      home();
    });
  }

  // Navbar bekommt beim Scrollen eine Trennlinie + kleinen Titel (wie in iOS)
  function wireNavbar() {
    var nav = document.querySelector('.navbar');
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 30); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Bottom-Sheets: Tippen auf den abgedunkelten Hintergrund, [data-close], Escape
  // oder Herunterziehen schließt - jedes Mal mit Rausgleiten nach unten.
  var SHEET_ZU_MS = 240;

  function closeSheet(d) {
    if (!d.open || d.dataset.schliesst) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { d.close(); return; }
    d.dataset.schliesst = '1';
    d.style.transition = 'transform ' + SHEET_ZU_MS + 'ms cubic-bezier(0.4, 0, 1, 1)';
    d.style.transform = 'translateY(100%)';
    d.style.setProperty('--zug', '1');
    setTimeout(function () {
      d.close();
      d.style.transition = '';
      d.style.transform = '';
      d.style.removeProperty('--zug');
      delete d.dataset.schliesst;
    }, SHEET_ZU_MS);
  }

  function wireSheets() {
    document.addEventListener('click', function (e) {
      var closeBtn = e.target.closest && e.target.closest('dialog [data-close]');
      if (closeBtn) { closeSheet(closeBtn.closest('dialog')); return; }
      var d = e.target;
      if (d.tagName === 'DIALOG' && d.classList.contains('sheet')) {
        var r = d.getBoundingClientRect();
        var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inside) closeSheet(d);
      }
    });
    // Escape: "cancel" blubbert nicht, deshalb in der Capture-Phase
    document.addEventListener('cancel', function (e) {
      var d = e.target;
      if (d.tagName === 'DIALOG' && d.classList.contains('sheet')) {
        e.preventDefault();
        closeSheet(d);
      }
    }, true);
    wireSheetDrag();
  }

  // Herunterziehen wie bei iOS: am Griff und an der Kopfzeile immer, im Inhalt
  // nur, solange er ganz oben steht - sonst scrollt er. Weit genug (ein knappes
  // Drittel) oder mit Schwung: zu. Sonst federt das Blatt zurück.
  function wireSheetDrag() {
    var zug = null;

    document.addEventListener('touchstart', function (e) {
      zug = null;
      var d = e.target.closest && e.target.closest('dialog.sheet[open]');
      if (!d || e.touches.length !== 1 || d.dataset.schliesst) return;
      var t = e.touches[0];
      // Auf dem abgedunkelten Grund (Ziel ist dann der dialog selbst) zieht nichts
      if (t.clientY < d.getBoundingClientRect().top) return;
      var amGriff = !!e.target.closest('.sheet-grabber, .sheet-header');
      if (!amGriff && d.scrollTop > 0) return;
      zug = { d: d, griff: amGriff, x0: t.clientX, y0: t.clientY, lastY: t.clientY, lastT: e.timeStamp, v: 0, aktiv: false };
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!zug) return;
      var t = e.touches[0];
      var dy = t.clientY - zug.y0;
      if (!zug.aktiv) {
        // nach oben oder zur Seite: gehört dem Inhalt
        if (dy < -4 || Math.abs(t.clientX - zug.x0) > Math.abs(dy)) { zug = null; return; }
        if (dy < 8) return;
        if (!zug.griff && zug.d.scrollTop > 0) { zug = null; return; }
        zug.aktiv = true;
        zug.y0 += 8;
        zug.d.style.transition = 'none';
      }
      // Solange das Blatt zieht, scrollt und federt nichts darunter
      e.preventDefault();
      var dt = Math.max(1, e.timeStamp - zug.lastT);
      zug.v = 0.7 * ((t.clientY - zug.lastY) / dt) + 0.3 * zug.v;
      zug.lastY = t.clientY;
      zug.lastT = e.timeStamp;
      var weg = Math.max(0, t.clientY - zug.y0);
      zug.d.style.transform = 'translateY(' + weg + 'px)';
      zug.d.style.setProperty('--zug', String(Math.min(1, weg / zug.d.offsetHeight)));
    }, { passive: false });

    function ende(e) {
      var z = zug;
      zug = null;
      if (!z || !z.aktiv) return;
      var weg = z.lastY - z.y0;
      var schnell = z.v > 0.5 && e.timeStamp - z.lastT < 100;
      if (weg > z.d.offsetHeight * 0.3 || schnell) {
        closeSheet(z.d);
        return;
      }
      z.d.style.transition = 'transform 0.25s cubic-bezier(0.2, 0.9, 0.25, 1)';
      z.d.style.transform = '';
      z.d.style.removeProperty('--zug');
      setTimeout(function () { if (!z.d.dataset.schliesst) z.d.style.transition = ''; }, 260);
    }
    document.addEventListener('touchend', ende);
    document.addEventListener('touchcancel', ende);
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(function () {
    addHomeButton();
    wireHomeLinks();
    wireNavbar();
    wireSheets();
  });

  /* ---------- Offline-Fähigkeit & dauerhafter Speicher ---------- */

  var secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  // Im Vite-Entwicklungsserver (npm run dev) keinen Service Worker – der würde Hot-Reload stören
  var isViteDev = !!document.querySelector('script[src*="/@vite/client"]');
  if ('serviceWorker' in navigator && secure && isViteDev) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.unregister(); });
    }).catch(function () {});
  } else if ('serviceWorker' in navigator && secure) {
    navigator.serviceWorker.register(ROOT + 'sw.js', { scope: ROOT }).catch(function () {});
  }
  // Bittet den Browser, die Daten nicht automatisch zu löschen (bei Home-Bildschirm-Apps meist gewährt)
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted()
      .then(function (p) { return p || navigator.storage.persist(); })
      .catch(function () {});
  }

  window.Shell = {
    root: ROOT,
    isStandalone: isStandalone,
    home: home,
    ready: ready,
    store: store,
    toast: toast,
    closeSheet: closeSheet
  };
})();
