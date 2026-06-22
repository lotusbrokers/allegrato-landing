/* ============================================================
   FOREST HOUSES — interações & animações
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year ---------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  var reveals = [].slice.call(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Nav scroll state ---------- */
  var nav = document.getElementById('nav');
  var onScroll = function () {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');

    // floating whatsapp appears after hero
    var wa = document.getElementById('waFloat');
    if (wa) {
      if (window.scrollY > window.innerHeight * 0.7) wa.classList.add('show');
      else wa.classList.remove('show');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Parallax ---------- */
  var parallaxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;
  function applyParallax() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      var center = rect.top + rect.height / 2 - vh / 2;
      el.style.transform = 'translate3d(0,' + (-center * speed) + 'px,0)';
    });
    ticking = false;
  }
  if (!reduce && parallaxEls.length) {
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(applyParallax); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', applyParallax);
    applyParallax();
  }

  /* ---------- Counters ---------- */
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  function fmt(n, sep) {
    if (!sep) return String(n);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var sep = el.hasAttribute('data-sep');
    if (reduce) { el.textContent = fmt(target, sep); return; }
    var dur = 1700, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased), sep);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { runCounter(el); });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- Plantas tabs ---------- */
  var tabs = [].slice.call(document.querySelectorAll('.plans__tabs button'));
  var panels = [].slice.call(document.querySelectorAll('.plans__panel'));
  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-tab');
      tabs.forEach(function (b) { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn ? 'true' : 'false'); });
      panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === key); });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById('lightbox');
  var tiles = [].slice.call(document.querySelectorAll('[data-img]'));
  function openLB(src, cap) {
    lb.innerHTML = '<button class="lb__close" aria-label="Fechar">&times;</button>' +
      '<figure class="lb__fig"><img src="' + src + '" alt="' + (cap || '') + '" /><figcaption>' + (cap || '') + '</figcaption></figure>';
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLB() {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(function () { lb.innerHTML = ''; }, 350);
  }
  tiles.forEach(function (t) {
    t.addEventListener('click', function () {
      openLB(t.getAttribute('data-img'), t.getAttribute('data-cap') || '');
    });
  });
  if (lb) {
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb__close')) closeLB();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('open')) closeLB();
    });
  }

  /* ---------- Lead form -> WhatsApp ---------- */
  var form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = form.nome, tel = form.tel;
      var valid = true;
      [nome, tel].forEach(function (f) {
        var wrap = f.closest('.field');
        if (!f.value.trim()) { wrap.classList.add('invalid'); valid = false; }
        else wrap.classList.remove('invalid');
      });
      if (!valid) return;
      var msg = 'Olá! Sou ' + nome.value.trim() + '.';
      msg += ' Tenho interesse no Forest Houses (' + form.interesse.value + ').';
      if (form.email.value.trim()) msg += ' Meu e-mail: ' + form.email.value.trim() + '.';
      msg += ' Meu telefone: ' + tel.value.trim() + '. Podem me enviar mais informações?';
      var url = 'https://wa.me/5511926143393?text=' + encodeURIComponent(msg);
      document.getElementById('formOk').classList.add('show');
      form.style.display = 'none';
      window.open(url, '_blank');
    });
    ['nome', 'tel'].forEach(function (id) {
      var el = form[id];
      el.addEventListener('input', function () {
        if (el.value.trim()) el.closest('.field').classList.remove('invalid');
      });
    });
  }
})();
