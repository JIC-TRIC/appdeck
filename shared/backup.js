/* ==========================================================================
   backup.js – Sichern & Wiederherstellen aller lokal gespeicherten Daten

   Im Launcher (Einstellungen) bereits eingebaut.

   Für den Umzug einer ALTEN App: diese eine Zeile in deren index.html einfügen,
   dann erscheint dort oben rechts ein "Backup"-Button:
     <script src="https://jic-tric.github.io/appdeck/shared/backup.js" data-ui="button"></script>

   API: Backup.json()  Backup.save()  Backup.copy()
        Backup.restore(text)  Backup.pickFile()  Backup.readClipboard()  Backup.stats()
   ========================================================================== */
(function () {
  'use strict';

  var FORMAT = 'appdeck-backup';
  var script = document.currentScript;

  // Zugangsdaten bleiben auf dem Gerät: Schlüssel auf ":geheim" (z. B. der
  // GitHub-Token von Stash) kommen nicht ins Backup, und Ersetzen beim
  // Wiederherstellen lässt sie stehen.
  var GEHEIM = /:geheim$/;

  function allData() {
    var data = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!GEHEIM.test(k)) data[k] = localStorage.getItem(k);
    }
    return data;
  }

  function json() {
    var data = allData();
    return JSON.stringify({
      format: FORMAT,
      version: 1,
      source: location.origin + location.pathname,
      exportedAt: new Date().toISOString(),
      count: Object.keys(data).length,
      data: data
    }, null, 2);
  }

  function fileName() {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return 'appdeck-backup-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.json';
  }

  // Öffnet auf dem iPhone das Teilen-Menü ("In Dateien sichern", AirDrop, …),
  // sonst normaler Download.
  async function save() {
    var file = new File([json()], fileName(), { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return 'shared';
      } catch (e) {
        if (e && e.name === 'AbortError') return 'aborted';
      }
    }
    var url = URL.createObjectURL(file);
    var a = document.createElement('a');
    a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
    return 'downloaded';
  }

  async function copy() {
    await navigator.clipboard.writeText(json());
  }

  function appName(id) {
    var app = (self.APPS || []).find(function (a) { return a.id === id; });
    return app ? app.name : id;
  }

  function parse(text) {
    var obj;
    try { obj = JSON.parse(text); } catch (e) { throw new Error('Das ist kein gültiges Backup (kein JSON).'); }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('Das ist kein gültiges Backup.');
    }
    if (obj.format === FORMAT) {
      if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) {
        throw new Error('Das Backup ist beschädigt.');
      }
      return obj.data;
    }
    // Exportdatei einer einzelnen App (z. B. Kontor: { app: 'kontor', accounts: [...] }).
    // Die gehört in den Import der App – hier eingespielt landeten ihre Listen
    // ohne App-Präfix im Speicher, und die App sähe davon nichts.
    if (typeof obj.app === 'string') {
      throw new Error('Das ist eine Exportdatei von „' + appName(obj.app) + '“, kein appdeck-Backup. ' +
        'Bitte direkt in der App importieren (dort unter Einstellungen).');
    }
    // Sonst nur ein einfaches {schlüssel: text}, also ein Abbild des Speichers.
    var keys = Object.keys(obj);
    if (!keys.length || !keys.every(function (k) { return typeof obj[k] === 'string'; })) {
      throw new Error('Das ist kein gültiges Backup.');
    }
    return obj;
  }

  // Führt ein Backup mit den vorhandenen Daten zusammen (gleiche Schlüssel werden überschrieben).
  function restore(text, options) {
    var data = parse(text);
    var keys = Object.keys(data);
    if (options && options.replace) {
      Object.keys(localStorage).forEach(function (k) { if (!GEHEIM.test(k)) localStorage.removeItem(k); });
    }
    keys.forEach(function (k) {
      var v = data[k];
      localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    });
    return keys.length;
  }

  function preview(text) {
    var data = parse(text);
    var keys = Object.keys(data);
    var existing = keys.filter(function (k) { return localStorage.getItem(k) !== null; });
    return { count: keys.length, overwrites: existing.length };
  }

  function pickFile() {
    return new Promise(function (resolve, reject) {
      var input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      input.addEventListener('change', function () {
        var f = input.files && input.files[0];
        input.remove();
        if (!f) return reject(new Error('Keine Datei gewählt.'));
        f.text().then(resolve, reject);
      });
      document.body.appendChild(input);
      input.click();
    });
  }

  async function readClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      try { return await navigator.clipboard.readText(); } catch (e) { /* weiter zum Fallback */ }
    }
    var t = window.prompt('Backup-Text hier einfügen:');
    if (!t) throw new Error('Nichts eingefügt.');
    return t;
  }

  function stats() {
    var data = allData();
    var bytes = 0;
    Object.keys(data).forEach(function (k) { bytes += (k.length + data[k].length) * 2; });  // UTF-16
    return { count: Object.keys(data).length, bytes: bytes };
  }

  window.Backup = {
    json: json, save: save, copy: copy, restore: restore, preview: preview,
    pickFile: pickFile, readClipboard: readClipboard, stats: stats
  };

  /* ---------- Optionaler Button für alte Apps (data-ui="button") ---------- */

  if (script && script.getAttribute('data-ui') === 'button') {
    var addButton = function () {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:fixed;z-index:2147483647;right:calc(env(safe-area-inset-right,0px) + 12px);' +
        'top:calc(env(safe-area-inset-top,0px) + 10px);display:flex;flex-direction:column;align-items:flex-end;gap:8px;' +
        'font:600 15px -apple-system,system-ui,sans-serif;';
      var btnCss = 'appearance:none;border:0;border-radius:999px;padding:10px 16px;background:#007AFF;color:#fff;' +
        'font:inherit;box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer;';
      var main = document.createElement('button');
      main.textContent = 'Backup';
      main.style.cssText = btnCss;
      var menu = document.createElement('div');
      menu.style.cssText = 'display:none;flex-direction:column;gap:8px;align-items:flex-end;';
      var asFile = document.createElement('button');
      asFile.textContent = 'Als Datei sichern';
      asFile.style.cssText = btnCss + 'background:#fff;color:#007AFF;';
      var asText = document.createElement('button');
      asText.textContent = 'In Zwischenablage kopieren';
      asText.style.cssText = btnCss + 'background:#fff;color:#007AFF;';
      menu.append(asFile, asText);
      wrap.append(main, menu);
      document.body.appendChild(wrap);

      main.addEventListener('click', function () {
        menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
      });
      asFile.addEventListener('click', function () { save(); menu.style.display = 'none'; });
      asText.addEventListener('click', function () {
        copy().then(function () {
          alert('Backup kopiert (' + stats().count + ' Einträge). Jetzt in der neuen App unter Einstellungen → "Aus Zwischenablage einfügen".');
        }, function () { alert('Kopieren nicht möglich – bitte "Als Datei sichern" verwenden.'); });
        menu.style.display = 'none';
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton);
    else addButton();
  }
})();
