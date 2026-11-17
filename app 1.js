// =====================================================
// app.js  -  cards, mensagem Telegram e PREVIEW (iframe)
// Depende de: videos.js e prices.js (carregados antes)
// =====================================================
var CONFIG = {
  telegram: 'GRIM_011',
  channelUrl: 'https://t.me/+HHcNHl1ezKBmMTVk',   // <- link do teu canal
  message: 'I select this file, how can i pay?',
  addFolderName: true                              // false = so a frase
};

(function () {
  'use strict';
  var D = window.GRIM_DATA;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function dmUrl(extra) {
    var t = CONFIG.message + (extra ? '\n\n\uD83D\uDCC2 Folder: ' + extra : '');
    return 'https://t.me/' + CONFIG.telegram + '?text=' + encodeURIComponent(t);
  }

  // converte link normal do Mega (/file/ ou /folder/) para embed
  function toEmbed(u) {
    u = (u || '').trim();
    if (!u) return '';
    return u.replace('mega.nz/file/', 'mega.nz/embed/').replace('mega.nz/folder/', 'mega.nz/embed/');
  }

  // le o tamanho real da imagem e ajusta para PREENCHER o card (4:5)
  window.GRIM_fit = function (im) {
    var r = im.naturalWidth / im.naturalHeight;      // largura / altura
    // imagem alta (celular): mantem o TOPO | larga ou quadrada: centro
    im.style.objectPosition = r < 0.8 ? 'center top' : 'center center';
    im.parentNode.classList.add('has-img');
  };

  var products = D.items.map(function (it, idx) {
    var n = idx + 1, title = it.title || 'Folder ' + pad(n), price = window.GRIM_PRICE(n);
    return {
      n: n, title: title, price: price,
      letter: it.title ? it.title.trim().charAt(0).toUpperCase() : pad(n),
      desc: it.desc || D.defaultDescription || '',
      img: (it.image || '').trim() || 'img/' + pad(n) + '.jpg',
      preview: toEmbed(it.video),
      buy: dmUrl(CONFIG.addFolderName ? title + ' ($' + price + ')' : '')
    };
  });

  var grid = document.getElementById('grid');
  grid.innerHTML = products.map(function (p) {
    return '<article class="card">' +
      '<div class="thumb"><div class="num"><span>' + esc(p.letter) + '</span></div>' +
      '<img src="' + esc(p.img) + '" alt="' + esc(p.title) + '" loading="lazy" onload="GRIM_fit(this)" onerror="this.remove()">' +
      '<div class="price">$' + p.price + '</div></div>' +
      '<div class="body"><div><h3>' + esc(p.title) + '</h3><div class="meta">' + esc(p.desc) + '</div></div>' +
      '<div class="actions">' +
      '<button class="btn btn-ghost" data-prev="' + p.n + '"' + (p.preview ? '' : ' disabled title="Preview coming soon"') + '>PREVIEW</button>' +
      '<a class="btn btn-hot" target="_blank" rel="noopener" href="' + p.buy + '">Buy Now</a>' +
      '</div></div></article>';
  }).join('');

  // imagens ja em cache: esconde a letra sem esperar o evento onload
  grid.querySelectorAll('.thumb img').forEach(function (im) {
    if (im.complete && im.naturalWidth > 0) window.GRIM_fit(im);
  });

  document.getElementById('statN').textContent = products.length;
  ['dmTop', 'fab'].forEach(function (id) { document.getElementById(id).href = dmUrl(''); });
  ['chanBtn', 'chanTop'].forEach(function (id) { document.getElementById(id).href = CONFIG.channelUrl; });

  // ---------- PREVIEW: iframe so carrega ao abrir ----------
  var modal = document.getElementById('modal'), frame = document.getElementById('frame');
  function openPrev(n) {
    var p = products[n - 1];
    if (!p || !p.preview) return;
    document.getElementById('mTitle').textContent = p.title;
    document.getElementById('mBuy').href = p.buy;
    frame.innerHTML = '<iframe src="' + esc(p.preview) + '" allowfullscreen allow="autoplay; fullscreen" title="' + esc(p.title) + '"></iframe>';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closePrev() {
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
})();
