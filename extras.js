// extras.js - barra de progresso do scroll + voltar ao topo
(function () {
  'use strict';
  var bar = document.createElement('div'); bar.id = 'xt-progress';
  var top = document.createElement('button');
  top.id = 'xt-top'; top.type = 'button'; top.textContent = '\u2191';
  top.setAttribute('aria-label', 'Back to top');
  top.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
  document.body.appendChild(bar); document.body.appendChild(top);
  var busy = false;
  window.addEventListener('scroll', function () {
    if (busy) return; busy = true;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - innerHeight, y = scrollY;
      bar.style.width = (h > 0 ? Math.min(100, y / h * 100) : 0) + '%';
      top.classList.toggle('show', y > 600);
      busy = false;
    });
  }, { passive: true });
})();
