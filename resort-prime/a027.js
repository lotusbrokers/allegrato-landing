/* ===========================================================
   Resort Prime — interações
   =========================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '5511926143393'; // +55 11 92614-3393

  /* ---------- Sticky header ---------- */
  var header = document.querySelector('.header');
  function onScroll() {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var mmenu = document.querySelector('.mobile-menu');
  var mclose = document.querySelector('.mobile-menu__close');
  function openM() { mmenu.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeM() { mmenu.classList.remove('open'); document.body.style.overflow = ''; }
  if (burger) burger.addEventListener('click', openM);
  if (mclose) mclose.addEventListener('click', closeM);
  document.querySelectorAll('.mobile-menu a').forEach(function (a) {
    a.addEventListener('click', closeM);
  });

  /* ---------- Reveal on scroll (robusto, sem depender de IO) ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function checkReveal() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = 0; i < reveals.length; i++) {
      var el = reveals[i];
      if (el.classList.contains('in')) continue;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('in');
    }
  }
  window.addEventListener('scroll', checkReveal, { passive: true });
  window.addEventListener('resize', checkReveal);
  checkReveal();
  // failsafe: garante layout final correto mesmo em iframes com transição congelada
  setTimeout(checkReveal, 300);
  setTimeout(function () {
    reveals.forEach(function (el) {
      el.classList.add('in');
      el.style.transition = 'none';
      el.style.transform = 'none';
    });
  }, 1800);

  /* ---------- Phone mask (BR) ---------- */
  function maskPhone(v) {
    v = v.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 2) return v.length ? '(' + v : v;
    if (v.length <= 6) return '(' + v.slice(0, 2) + ') ' + v.slice(2);
    if (v.length <= 10) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
    return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
  }
  document.querySelectorAll('input[data-phone]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var pos = inp.selectionStart;
      inp.value = maskPhone(inp.value);
    });
  });

  /* ---------- Forms: validação + WhatsApp ---------- */
  document.querySelectorAll('form[data-ok]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      form.querySelectorAll('[data-required]').forEach(function (inp) {
        var fieldEl = inp.closest('.field');
        var val = inp.value.trim();
        var valid = true;
        if (!val) valid = false;
        if (inp.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) valid = false;
        if (inp.hasAttribute('data-phone') && val.replace(/\D/g, '').length < 10) valid = false;
        if (!valid) { fieldEl.classList.add('invalid'); ok = false; }
        else fieldEl.classList.remove('invalid');
      });
      if (!ok) return;

      var nome = (form.querySelector('[name=nome]') || {}).value || '';
      var email = (form.querySelector('[name=email]') || {}).value || '';
      var tel = (form.querySelector('[name=telefone]') || {}).value || '';
      var unidadeEl = form.querySelector('[name=unidade]');
      var unidade = unidadeEl ? unidadeEl.value : '';

      var msg = 'Olá! Tenho interesse no Resort Prime Santa Angela e gostaria de agendar uma visita.%0A%0A' +
        '*Nome:* ' + encodeURIComponent(nome) + '%0A' +
        '*E-mail:* ' + encodeURIComponent(email) + '%0A' +
        '*Telefone:* ' + encodeURIComponent(tel);
      if (unidade) msg += '%0A*Tipo de unidade:* ' + encodeURIComponent(unidade);

      var okBox = document.getElementById(form.getAttribute('data-ok'));
      if (okBox) { form.style.display = 'none'; okBox.style.display = 'block'; }
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + msg, '_blank');
    });

    form.querySelectorAll('input, select').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var f = inp.closest('.field'); if (f) f.classList.remove('invalid');
      });
    });
  });

  /* ---------- Lightbox galeria ---------- */
  var lb = document.getElementById('lightbox');
  var lbImg = lb ? lb.querySelector('img') : null;
  var lbCap = lb ? lb.querySelector('.lightbox__cap') : null;
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-lb]'));
  var idx = 0;
  function showLb(i) {
    if (i < 0) i = items.length - 1;
    if (i >= items.length) i = 0;
    idx = i;
    var el = items[idx];
    lbImg.src = el.getAttribute('data-lb');
    lbCap.textContent = el.getAttribute('data-cap') || '';
  }
  items.forEach(function (el, i) {
    el.addEventListener('click', function () {
      showLb(i); lb.classList.add('open'); document.body.style.overflow = 'hidden';
    });
  });
  if (lb) {
    lb.querySelector('.lightbox__close').addEventListener('click', function () {
      lb.classList.remove('open'); document.body.style.overflow = '';
    });
    lb.querySelector('.next').addEventListener('click', function (e) { e.stopPropagation(); showLb(idx + 1); });
    lb.querySelector('.prev').addEventListener('click', function (e) { e.stopPropagation(); showLb(idx - 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) { lb.classList.remove('open'); document.body.style.overflow = ''; } });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') { lb.classList.remove('open'); document.body.style.overflow = ''; }
      if (e.key === 'ArrowRight') showLb(idx + 1);
      if (e.key === 'ArrowLeft') showLb(idx - 1);
    });
  }
})();
