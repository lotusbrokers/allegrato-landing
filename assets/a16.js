/* ============================================================
   ALLEGRATO — interactions
   ============================================================ */
(function () {
  'use strict';

  // ---- WhatsApp config (PLACEHOLDER — troque pelo número real de vendas) ----
  var WA_NUMBER = '5511926143393';
  var WA_MSG = 'Olá! Tenho interesse no Allegrato Residencial (Medeiros, Jundiaí). Gostaria de saber mais sobre valores e condições.';
  function waUrl(extra) {
    var msg = extra ? (WA_MSG + ' ' + extra) : WA_MSG;
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }
  function wireWa() {
    document.querySelectorAll('.wa-link').forEach(function (a) {
      a.setAttribute('href', waUrl());
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });
  }
  wireWa();

  // ---- header: solid on scroll + on-dark over hero/dark sections ----
  var header = document.getElementById('header');
  var hero = document.getElementById('hero');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('solid', y > 40);
    // keep light logo/text while hero is in view (under transparent header)
    var heroBottom = hero.offsetHeight - 80;
    header.classList.toggle('on-dark', y < heroBottom);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- mobile nav (simple jump menu) ----
  var navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      document.getElementById('contato').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ---- scroll reveal ----
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // ---- lightbox gallery (supports multiple groups) ----
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var lbList = [];
  var current = 0;
  function showLb(i) {
    current = (i + lbList.length) % lbList.length;
    var t = lbList[current];
    lbImg.src = t.getAttribute('data-img');
    lbCap.textContent = t.getAttribute('data-cap') || '';
  }
  function openLb(list, i) {
    lbList = list;
    showLb(i);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }

  var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
  tiles.forEach(function (t, i) { t.addEventListener('click', function () { openLb(tiles, i); }); });

  var plans = Array.prototype.slice.call(document.querySelectorAll('.plan-open'));
  plans.forEach(function (p, i) { p.addEventListener('click', function () { openLb(plans, i); }); });

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

  // ---- parcela simulator ----
  var range = document.getElementById('simRange');
  var elValor = document.getElementById('simValor');
  var elParcela = document.getElementById('simParcela');
  var elFin = document.getElementById('simFin');
  function brl(n) { return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 }); }
  function calcSim() {
    var price = +range.value;
    var financed = Math.round(price * 0.80);
    var i = 0.0816 / 12;
    var n = 360;
    var pmt = financed * (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
    elValor.textContent = 'R$ ' + brl(price);
    elFin.textContent = 'R$ ' + brl(financed);
    elParcela.textContent = brl(Math.round(pmt));
    // tint slider fill
    var pct = (price - range.min) / (range.max - range.min) * 100;
    range.style.background = 'linear-gradient(90deg, var(--teal) ' + pct + '%, rgba(255,255,255,.18) ' + pct + '%)';
  }
  if (range) { range.addEventListener('input', calcSim); calcSim(); }

  // ---- lead form ----
  var form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = document.getElementById('nome').value.trim();
      var fone = document.getElementById('fone').value.trim();
      var interesse = document.getElementById('interesse').value;
      if (!nome || fone.replace(/\D/g, '').length < 10) {
        if (!nome) document.getElementById('nome').focus();
        else document.getElementById('fone').focus();
        return;
      }
      var extra = 'Meu nome é ' + nome + '.' + (interesse ? (' Tenho interesse em: ' + interesse + '.') : '');
      var url = waUrl(extra);
      document.getElementById('formView').style.display = 'none';
      var ok = document.getElementById('successView');
      ok.style.display = 'block';
      ok.querySelectorAll('.wa-link').forEach(function (a) { a.setAttribute('href', url); });
      // persist (lightweight)
      try { localStorage.setItem('allegrato_lead', JSON.stringify({ nome: nome, fone: fone, interesse: interesse, ts: Date.now() })); } catch (err) {}
      window.open(url, '_blank', 'noopener');
    });
    // phone mask (BR)
    var fone = document.getElementById('fone');
    fone.addEventListener('input', function () {
      var v = fone.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) fone.value = '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
      else if (v.length > 2) fone.value = '(' + v.slice(0, 2) + ') ' + v.slice(2);
      else if (v.length > 0) fone.value = '(' + v;
    });
  }

  // Resolve the hero background via a preloaded copy looked up by ID. The bundler
  // rewrites each <img src> to a blob: URL (dropping the filename) but keeps the id,
  // and it does so asynchronously — so we poll until the inlined blob appears, and
  // only fall back to the relative path in dev (after load).
  function heroSourceEl() {
    if (!window.__heroWant) return null;
    var key = window.__heroWant.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
    return document.getElementById('src-' + key);
  }
  function applyHero() {
    var img = document.getElementById('heroImg');
    if (!img) return false;
    var el = heroSourceEl();
    var s = el && el.src ? el.src : '';
    if (s && /^(blob:|data:)/.test(s)) { if (img.src !== s) img.src = s; return true; }
    return false;
  }
  window.__heroWant = 'assets/piscina-hero.jpg';
  // expose hero image setter for tweaks
  window.__setHeroImage = function (src) {
    window.__heroWant = src || window.__heroWant;
    applyHero();
  };
  // keep upgrading to an inlined copy (covers async blob creation in the bundle)
  var heroTries = 0;
  var heroIv = setInterval(function () { if (applyHero() || heroTries++ > 80) clearInterval(heroIv); }, 100);
  // dev fallback: no inlined copy → use the relative path after load
  window.addEventListener('load', function () {
    setTimeout(function () {
      var img = document.getElementById('heroImg');
      if (img && !/^(blob:|data:)/.test(img.src || '')) {
        var el = heroSourceEl();
        img.src = (el && el.src) ? el.src : window.__heroWant;
      }
    }, 250);
  });
  window.__setHeroHeadline = function (txt) {
    var h = document.getElementById('heroHeadline');
    if (h) h.textContent = txt;
  };
  // resolve the hero to its inlined copy immediately (avoids a flash in the standalone bundle)
  window.__setHeroImage('assets/piscina-hero.jpg');
})();
