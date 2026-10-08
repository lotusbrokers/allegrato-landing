/* ============================================================
   GIOVIALE — interactions
   ============================================================ */
(function () {
  'use strict';

  // ---- WhatsApp (PLACEHOLDER — troque pelo número real de vendas) ----
  var WA_NUMBER = '5511926143393';
  var WA_MSG = 'Olá! Tenho interesse no Gioviale Residencial (Medeiros, Jundiaí). Gostaria de saber mais sobre valores e condições.';
  function waUrl(extra) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(extra ? (WA_MSG + ' ' + extra) : WA_MSG);
  }
  document.querySelectorAll('.wa-link').forEach(function (a) {
    a.setAttribute('href', waUrl());
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });

  // ---- header state ----
  var header = document.getElementById('header');
  var hero = document.getElementById('hero');
  function onScroll() {
    header.classList.toggle('solid', window.scrollY > (hero.offsetHeight - 90));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navToggle = document.getElementById('navToggle');
  if (navToggle) navToggle.addEventListener('click', function () {
    var el = document.getElementById('contato');
    window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  });

  // ---- scroll reveal ----
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // ---- lightbox ----
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbList = [], current = 0;
  function showLb(i) {
    current = (i + lbList.length) % lbList.length;
    var t = lbList[current];
    var inner = t.querySelector('img');
    lbImg.src = (inner && inner.currentSrc) || (inner && inner.src) || t.getAttribute('data-img');
    lbCap.textContent = t.getAttribute('data-cap') || '';
  }
  function openLb(list, i) {
    lbList = list; showLb(i);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }

  [['.tile'], ['.plan-open'], ['.impl-fig']].forEach(function (sel) {
    var list = Array.prototype.slice.call(document.querySelectorAll(sel[0]));
    list.forEach(function (el, i) { el.addEventListener('click', function () { openLb(list, i); }); });
  });

  document.getElementById('lbClose').addEventListener('click', closeLb);
  document.getElementById('lbNext').addEventListener('click', function (e) { e.stopPropagation(); showLb(current + 1); });
  document.getElementById('lbPrev').addEventListener('click', function (e) { e.stopPropagation(); showLb(current - 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') showLb(current + 1);
    if (e.key === 'ArrowLeft') showLb(current - 1);
  });

  // ---- lead form ----
  var form = document.getElementById('leadForm');
  if (form) {
    var fone = document.getElementById('fone');
    fone.addEventListener('input', function () {
      var v = fone.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) fone.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
      else if (v.length > 2) fone.value = '(' + v.slice(0, 2) + ') ' + v.slice(2);
      else if (v.length > 0) fone.value = '(' + v;
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = document.getElementById('nome').value.trim();
      var tel = fone.value.trim();
      var interesse = document.getElementById('interesse').value;
      if (!nome) { document.getElementById('nome').focus(); return; }
      if (tel.replace(/\D/g, '').length < 10) { fone.focus(); return; }
      var url = waUrl('Meu nome é ' + nome + '.' + (interesse ? (' Tenho interesse em: ' + interesse + '.') : ''));
      document.getElementById('formView').style.display = 'none';
      var ok = document.getElementById('successView');
      ok.style.display = 'block';
      ok.querySelectorAll('.wa-link').forEach(function (a) { a.setAttribute('href', url); });
      try { localStorage.setItem('gioviale_lead', JSON.stringify({ nome: nome, fone: tel, interesse: interesse, ts: Date.now() })); } catch (err) {}
      window.open(url, '_blank', 'noopener');
    });
  }
})();
