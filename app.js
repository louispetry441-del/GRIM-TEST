// =====================================================
// app.js  -  cards, mensagem Telegram, PREVIEW e LINGUAS
// Depende de: videos.js, prices.js e i18n.js (carregados antes)
// A mensagem do Telegram esta em i18n.js (chave "message")
// =====================================================
var CONFIG = {
  telegram: 'GRIM_011',
  channelUrl: 'https://t.me/+HHcNHl1ezKBmMTVk',   // <- link do teu canal
  addFolderName: true,                             // false = so a frase
  defaultLang: 'en'                                // lingua principal
};

(function () {
  'use strict';
  var D = window.GRIM_DATA;
  var I = window.GRIM_I18N;
  var current = CONFIG.defaultLang;
  var openN = 0;   // preview aberto (0 = nenhum)

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // texto traduzido da interface
  function T(key) {
    return (I.dict[current] && I.dict[current][key]) || I.dict.en[key] || '';
  }

  // aceita texto simples OU objeto { en:'..', es:'..', ... } (title / desc)
  function pick(v, lang, fallback) {
    if (v && typeof v === 'object') {
      return v[lang] || v.en || v[Object.keys(v)[0]] || fallback || '';
    }
    return v || fallback || '';
  }

  // link do Telegram na lingua escolhida
  function dmUrl(extra) {
    var t = T('message') + (extra ? '\n\n\uD83D\uDCC2 ' + T('folderLabel') + extra : '');
    return 'https://t.me/' + CONFIG.telegram + '?text=' + encodeURIComponent(t);
  }

  // converte link normal do Mega (/file/ ou /folder/) para embed
  function toEmbed(u) {
    u = (u || '').trim();
    if (!u) return '';
    return u.replace('mega.nz/file/', 'mega.nz/embed/').replace('mega.nz/folder/', 'mega.nz/embed/');
  }

  // dados fixos de cada produto (nao dependem da lingua)
  var base = D.items.map(function (it, idx) {
    var n = idx + 1;
    return {
      n: n, it: it,
      price: window.GRIM_PRICE(n),
      img: (it.image || '').trim() || 'img/' + pad(n) + '.jpg',
      preview: toEmbed(it.video),
      // nome usado na mensagem para ti (sempre o mesmo, em ingles)
      refTitle: pick(it.title, 'en', 'Folder ' + pad(n))
    };
  });

  // dados que mudam com a lingua
  var products = [];
  function buildProducts() {
    products = base.map(function (b) {
      var title = pick(b.it.title, current, T('folder') + ' ' + pad(b.n));
      return {
        n: b.n, price: b.price, img: b.img, preview: b.preview, title: title,
        letter: b.it.title ? String(title).trim().charAt(0).toUpperCase() : pad(b.n),
        desc: pick(b.it.desc, current, '') || pick(D.defaultDescription, current, ''),
        buy: dmUrl(CONFIG.addFolderName ? b.refTitle + ' ($' + b.price + ')' : '')
      };
    });
  }

  var grid = document.getElementById('grid');

  function renderCards() {
    grid.innerHTML = products.map(function (p) {
      return '<article class="card">' +
        '<div class="thumb"><div class="num"><span>' + esc(p.letter) + '</span></div>' +
        '<img src="' + esc(p.img) + '" alt="' + esc(p.title) + '" loading="lazy" onload="this.parentNode.classList.add(\'has-img\')" onerror="this.remove()">' +
        '<div class="price">$' + p.price + '</div></div>' +
        '<div class="body"><div><h3>' + esc(p.title) + '</h3><div class="meta">' + esc(p.desc) + '</div></div>' +
        '<div class="actions">' +
        '<button class="btn btn-ghost" data-prev="' + p.n + '"' + (p.preview ? '' : ' disabled title="' + esc(T('previewSoon')) + '"') + '>' + esc(T('preview')) + '</button>' +
        '<a class="btn btn-hot" target="_blank" rel="noopener" href="' + p.buy + '">' + esc(T('buyNow')) + '</a>' +
        '</div></div></article>';
    }).join('');

    // imagens ja em cache: esconde a letra sem esperar o evento onload
    grid.querySelectorAll('.thumb img').forEach(function (im) {
      if (im.complete && im.naturalWidth > 0) im.parentNode.classList.add('has-img');
    });
  }

  // ---------- LINGUA ----------
  function detectLang() {
    var saved = null;
    try { saved = localStorage.getItem('grim_lang'); } catch (e) {}
    if (saved && I.dict[saved]) return saved;
    var nav = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase().slice(0, 2);
    return I.dict[nav] ? nav : CONFIG.defaultLang;
  }

  function setLang(lang) {
    if (!I.dict[lang]) lang = CONFIG.defaultLang;
    current = lang;
    try { localStorage.setItem('grim_lang', lang); } catch (e) {}

    var html = document.documentElement;
    html.lang = lang;
    html.dir = I.rtl.indexOf(lang) > -1 ? 'rtl' : 'ltr';
    document.title = T('title');

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = T(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', T(el.getAttribute('data-i18n-aria')));
    });

    var sel = document.getElementById('lang');
    if (sel) sel.value = lang;

    buildProducts();
    renderCards();

    document.getElementById('statN').textContent = products.length;
    ['dmTop', 'fab'].forEach(function (id) { document.getElementById(id).href = dmUrl(''); });
    ['chanBtn', 'chanTop'].forEach(function (id) { document.getElementById(id).href = CONFIG.channelUrl; });

    // se o preview estiver aberto, atualiza titulo e botao
    if (openN && products[openN - 1]) {
      document.getElementById('mTitle').textContent = products[openN - 1].title;
      document.getElementById('mBuy').href = products[openN - 1].buy;
    }
    document.dispatchEvent(new CustomEvent('grim:lang', { detail: lang }));
  }

  // monta o seletor de lingua
  var sel = document.getElementById('lang');
  sel.innerHTML = I.order.map(function (l) {
    return '<option value="' + l + '">' + esc(I.names[l]) + '</option>';
  }).join('');
  sel.addEventListener('change', function () { setLang(sel.value); });

  // ---------- PREVIEW: iframe so carrega ao abrir ----------
  var modal = document.getElementById('modal'), frame = document.getElementById('frame');
  function openPrev(n) {
    var p = products[n - 1];
    if (!p || !p.preview) return;
    openN = n;
    document.getElementById('mTitle').textContent = p.title;
    document.getElementById('mBuy').href = p.buy;
    frame.innerHTML = '<iframe src="' + esc(p.preview) + '" allowfullscreen allow="autoplay; fullscreen" title="' + esc(p.title) + '"></iframe>';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closePrev() {
    openN = 0;
    modal.classList.remove('open');
    frame.innerHTML = '';
    document.body.style.overflow = '';
  }
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-prev]');
    if (b) openPrev(+b.getAttribute('data-prev'));
  });
  document.getElementById('mClose').onclick = closePrev;
  modal.addEventListener('click', function (e) { if (e.target === modal) closePrev(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePrev(); });

  // arranque
  setLang(detectLang());
})();
