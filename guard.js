// =====================================================
// guard.js  -  anti-copia com ASSINATURA DIGITAL
// (c) 2026 GRIM - todos os direitos reservados - ID GS-A2C12364D562
// Quem manda no site e quem tem a chave privada (owner.key, so tua).
// O site so funciona se o site.sig.json estiver assinado por ti.
// Carregar ANTES de videos.js. Nao precisas de editar este ficheiro.
// =====================================================
(function () {
  'use strict';
  var PUB = /*PUB*/'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEihDwsuMZoILGlzFQSXCp2zsMAyAGjfXTifW+dYPA8Lry6HpAFdAhZAe8WXKkwZG86Q6s1XxpAa05VG8FhDGd+Q=='/*END*/;                 // chave publica (escrita pelo sign.js)
  var DEV = ['localhost', '127.0.0.1', ''];   // so para testares em casa
  var host = String(location.hostname).toLowerCase();
  var M = null, dead = false;

  function dev() { return DEV.indexOf(host) > -1; }

  function corrupt() {                          // apaga a pagina
    if (dead) return; dead = true;
    try { window.GRIM_DATA = null; } catch (e) {}
    try { document.documentElement.innerHTML = ''; } catch (e) {}
    if (M && M.dm) location.replace('https://t.me/' + M.dm);
  }
  function soft() {                             // 1a vez recarrega (cache velha), 2a apaga
    try {
      if (!sessionStorage.getItem('grim_r')) { sessionStorage.setItem('grim_r', '1'); location.reload(); return; }
    } catch (e) {}
    corrupt();
  }

  function b64(s) {
    var b = atob(s), u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  function sha(t) {
    t = t.replace(/^\uFEFF/, '').replace(/\r/g, '');
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(function (d) {
      return Array.prototype.map.call(new Uint8Array(d), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }

  function good(h) {
    return ['https://t.me/' + M.dm, M.channelUrl].some(function (p) {
      return h === p || h.indexOf(p + '?') === 0 || h.indexOf(p + '/') === 0;
    });
  }
  function linksOk() {
    var a = document.querySelectorAll('a[href*="t.me"]');
    for (var i = 0; i < a.length; i++) if (!good(a[i].getAttribute('href') || '')) return false;
    var h = document.querySelector('.handle');
    return !h || h.textContent.trim() === '@' + M.dm;
  }
  function run() { if (M && (M.hosts.indexOf(host) < 0 || !linksOk())) corrupt(); }

  function verify() {
    if (!PUB || !window.fetch || !window.crypto || !crypto.subtle) return corrupt();
    fetch('site.sig.json', { cache: 'no-store' }).then(function (r) {
      if (r.status === 404) throw 'gone';
      if (!r.ok) throw 'net';
      return r.json();
    }).then(function (j) {
      return crypto.subtle.importKey('spki', b64(PUB), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
        .then(function (k) {
          return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, b64(j.sig), new TextEncoder().encode(j.payload));
        })
        .then(function (ok) { if (!ok) throw 'bad'; return JSON.parse(j.payload); });
    }).then(function (m) {
      M = m;
      var c = window.CONFIG || {};
      if (m.hosts.indexOf(host) < 0) return corrupt();
      if (c.telegram !== m.dm || c.channelUrl !== m.channelUrl) return soft();
      run();
      return Promise.all(Object.keys(m.files).map(function (f) {
        return fetch(f, { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.text() : null; })
          .then(function (t) { return t === null ? false : sha(t).then(function (h) { return h !== m.files[f]; }); })
          .catch(function () { return false; });
      })).then(function (bad) {
        if (bad.some(Boolean)) soft();
        else { try { sessionStorage.removeItem('grim_r'); } catch (e) {} }
      });
    }).catch(function (e) {
      if (e === 'gone' || e === 'bad' || e instanceof SyntaxError) corrupt();
    });
  }

  window.GRIM_GUARD = function () {
    if (dev()) return true;
    verify();
    return !!PUB;
  };
  window.GRIM_WATCH = function () {
    if (dev()) return;
    setInterval(run, 2000);
    if (window.MutationObserver && document.body) {
      new MutationObserver(run).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['href'] });
    }
  };
})();
