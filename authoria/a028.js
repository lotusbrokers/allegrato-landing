/* ============================================================
   AUTHORIA by tebas — interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---------- CONFIG (edite o telefone aqui) ---------- */
  var CONFIG = {
    // WhatsApp da imobiliária (somente números, com DDI 55)
    whatsapp: '5511926143393',
    waMsg: 'Olá! Tenho interesse no Authoria by Tebas e gostaria de agendar uma visita.'
  };
  var waLink = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(CONFIG.waMsg);
  var waEl = document.getElementById('wa');
  if (waEl) waEl.href = waLink;
  var waFooter = document.getElementById('waFooter');
  if (waFooter) waFooter.href = waLink;

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     STARFIELD
     ============================================================ */
  function Starfield(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var stars = [], shooters = [], w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var density = opts.density || 0.00018;
    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.floor(w * h * density);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 1.3 + 0.2,
          a: Math.random() * 0.6 + 0.2,
          tw: Math.random() * 0.02 + 0.004,
          ph: Math.random() * Math.PI * 2,
          hue: Math.random() < 0.12 ? 'gold' : (Math.random() < 0.2 ? 'blue' : 'white')
        });
      }
    }
    function spawnShooter() {
      if (prefersReduced) return;
      var fromLeft = Math.random() < 0.5;
      shooters.push({
        x: fromLeft ? -20 : w + 20,
        y: Math.random() * h * 0.5,
        vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 3),
        vy: 1.4 + Math.random() * 1.2,
        life: 0, max: 60 + Math.random() * 30
      });
    }
    var last = 0;
    function frame(t) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.ph += s.tw;
        var alpha = s.a * (0.55 + 0.45 * Math.sin(s.ph));
        ctx.beginPath();
        ctx.globalAlpha = alpha;
        if (s.hue === 'gold') ctx.fillStyle = '#e7cd8f';
        else if (s.hue === 'blue') ctx.fillStyle = '#9fbce8';
        else ctx.fillStyle = '#ffffff';
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // shooters
      for (var j = shooters.length - 1; j >= 0; j--) {
        var sh = shooters[j];
        sh.x += sh.vx; sh.y += sh.vy; sh.life++;
        var op = Math.sin((sh.life / sh.max) * Math.PI);
        var grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 6, sh.y - sh.vy * 6);
        grad.addColorStop(0, 'rgba(231,205,143,' + (op * 0.9) + ')');
        grad.addColorStop(1, 'rgba(231,205,143,0)');
        ctx.strokeStyle = grad; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(sh.x - sh.vx * 6, sh.y - sh.vy * 6); ctx.stroke();
        if (sh.life > sh.max) shooters.splice(j, 1);
      }
      if (t - last > 4200 && Math.random() < 0.4) { spawnShooter(); last = t; }
      raf = requestAnimationFrame(frame);
    }
    var raf;
    resize();
    window.addEventListener('resize', debounce(resize, 200));
    raf = requestAnimationFrame(frame);
    return { resize: resize };
  }

  var sky = document.getElementById('sky');
  if (sky) Starfield(sky, { density: 0.00020 });
  var sky2 = document.getElementById('sky2');
  if (sky2) Starfield(sky2, { density: 0.00012 });

  /* ============================================================
     HEADER + MOBILE MENU
     ============================================================ */
  var hdr = document.getElementById('hdr');
  function onScroll() {
    if (window.scrollY > 40) hdr.classList.add('scrolled');
    else hdr.classList.remove('scrolled');
    // parallax
    var y = window.scrollY;
    var px = document.querySelectorAll('[data-parallax]');
    for (var i = 0; i < px.length; i++) {
      var f = parseFloat(px[i].getAttribute('data-parallax'));
      px[i].style.transform = 'translateY(' + (y * f) + 'px)';
    }
    // whatsapp reveal
    if (waEl) { if (y > 600) waEl.classList.add('show'); else waEl.classList.remove('show'); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  if (burger) {
    burger.addEventListener('click', function () { document.body.classList.toggle('menu-open'); });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
    });
  }

  /* ============================================================
     REVEAL + COUNTERS  (scan-based: robust when the iframe loads
     offscreen, where IntersectionObserver never fires)
     ============================================================ */
  function inView(el, pad) {
    var r = el.getBoundingClientRect();
    return r.top < (window.innerHeight - (pad || 0)) && r.bottom > -60;
  }
  function animateCounter(el) {
    var to = parseFloat(el.getAttribute('data-to'));
    var dur = 1500, t0 = performance.now();
    function step(now) {
      var p = Math.min((now - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * to).toLocaleString('pt-BR');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = to.toLocaleString('pt-BR');
    }
    requestAnimationFrame(step);
  }
  function scanReveal() {
    var pad = window.innerHeight * 0.06;
    // When the page isn't actively rendered (background tab / offscreen iframe),
    // CSS transitions are paused — snap to the end-state so content never traps.
    var instant = (document.visibilityState !== 'visible');
    document.querySelectorAll('[data-reveal]:not(.in)').forEach(function (el) {
      if (inView(el, pad)) { if (instant) el.style.transition = 'none'; el.classList.add('in'); }
    });
    document.querySelectorAll('.num:not([data-done])').forEach(function (el) {
      if (inView(el, pad)) {
        el.setAttribute('data-done', '1');
        if (instant) el.textContent = parseFloat(el.getAttribute('data-to')).toLocaleString('pt-BR');
        else animateCounter(el);
      }
    });
    var shown = 0;
    document.querySelectorAll('.tile:not(.tin)').forEach(function (el) {
      if (inView(el, pad)) {
        var d = (shown % 6) * 70; shown++;
        el.style.transition = instant ? 'none' : ('opacity .8s var(--ease) ' + d + 'ms, transform .9s var(--ease) ' + d + 'ms');
        el.classList.add('tin'); el.style.opacity = 1; el.style.transform = 'none';
      }
    });
  }
  var scanQueued = false;
  function scanThrottled() {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(function () { scanQueued = false; scanReveal(); });
  }
  window.addEventListener('scroll', scanThrottled, { passive: true });
  window.addEventListener('resize', scanReveal);
  window.addEventListener('load', scanReveal);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) scanReveal(); });
  [120, 500, 1200].forEach(function (ms) { setTimeout(scanReveal, ms); });
  scanReveal();

  /* ============================================================
     PLANTAS TABS
     ============================================================ */
  document.querySelectorAll('.plan-tabs button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.plan-tabs button').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var id = btn.getAttribute('data-tab');
      document.querySelectorAll('.plan-panel').forEach(function (p) { p.classList.remove('active'); });
      document.getElementById(id).classList.add('active');
    });
  });

  /* ============================================================
     LAZER GALLERY
     ============================================================ */
  // Images are static <img src="assets/img/…"> in the HTML so the offline
  // bundler rewrites every src to a blob URL. The JS never builds image paths —
  // it reads the (already-resolved) src straight from the DOM.
  var grid = document.getElementById('lazerGrid');
  if (grid) {
    grid.style.gridAutoFlow = 'dense';

    // initial hidden state — revealed by the scan-based observer above
    if (!prefersReduced) {
      grid.querySelectorAll('.tile').forEach(function (el) {
        el.style.opacity = 0; el.style.transform = 'translateY(24px)';
      });
    }
    if (typeof scanReveal === 'function') scanReveal();

    // filters
    document.querySelectorAll('#lazerFilters button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#lazerFilters button').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.getAttribute('data-f');
        grid.querySelectorAll('.tile').forEach(function (tile) {
          var show = (f === 'all' || tile.getAttribute('data-cat') === f);
          tile.classList.toggle('hide', !show);
        });
      });
    });

    // lightbox — group is the gallery tiles, read from the DOM
    var tileEls = [].slice.call(grid.querySelectorAll('.tile'));
    tileEls.forEach(function (tile, i) {
      tile.addEventListener('click', function () { openLbFromEls(tileEls, i); });
    });
  }

  /* ============================================================
     LIGHTBOX  (DOM-driven — reads the resolved <img> src directly)
     ============================================================ */
  var lbEls = [], lbIndex = 0;
  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.innerHTML = '<button class="lb-close" aria-label="Fechar">&times;</button>'
    + '<button class="lb-nav lb-prev" aria-label="Anterior">&#8249;</button>'
    + '<button class="lb-nav lb-next" aria-label="Próximo">&#8250;</button>'
    + '<div class="lb-stage"><img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" /><div class="lb-meta"><div class="c"></div><div class="n"></div></div></div>';
  document.body.appendChild(lb);
  function elData(el) {
    var im = el.querySelector('img');
    return { src: im ? im.src : '', n: el.getAttribute('data-n') || '', cl: el.getAttribute('data-c') || '' };
  }
  function openLbFromEls(els, i) {
    lbEls = els; lbIndex = i; renderLb(); lb.classList.add('open'); document.body.style.overflow = 'hidden';
  }
  function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  function renderLb() {
    var d = elData(lbEls[lbIndex]);
    lb.querySelector('img').src = d.src;
    lb.querySelector('.lb-meta .c').textContent = d.cl;
    lb.querySelector('.lb-meta .n').textContent = d.n;
  }
  function navLb(d) { lbIndex = (lbIndex + d + lbEls.length) % lbEls.length; renderLb(); }
  lb.querySelector('.lb-close').addEventListener('click', closeLb);
  lb.querySelector('.lb-prev').addEventListener('click', function () { navLb(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { navLb(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') navLb(-1);
    else if (e.key === 'ArrowRight') navLb(1);
  });

  /* ============================================================
     PLAN ZOOM + INTERIORS CAROUSEL (“roleta”)
     ============================================================ */
  var planFigs = [].slice.call(document.querySelectorAll('.plan-img[data-plan]'));
  planFigs.forEach(function (fig, i) {
    fig.addEventListener('click', function () { openLbFromEls(planFigs, i); });
  });

  var carTrack = document.getElementById('carTrack');
  if (carTrack) {
    var slideEls = [].slice.call(carTrack.querySelectorAll('.car-slide'));
    slideEls.forEach(function (s, i) {
      s.addEventListener('click', function () { openLbFromEls(slideEls, i); });
    });
    var carPrev = document.getElementById('carPrev'), carNext = document.getElementById('carNext');
    function carStep() {
      var first = carTrack.querySelector('.car-slide');
      return first ? first.getBoundingClientRect().width + 16 : 360;
    }
    function carUpdate() {
      if (carPrev) carPrev.disabled = carTrack.scrollLeft < 8;
      if (carNext) carNext.disabled = carTrack.scrollLeft > carTrack.scrollWidth - carTrack.clientWidth - 8;
    }
    if (carPrev) carPrev.addEventListener('click', function () { carTrack.scrollBy({ left: -carStep(), behavior: 'smooth' }); });
    if (carNext) carNext.addEventListener('click', function () { carTrack.scrollBy({ left: carStep(), behavior: 'smooth' }); });
    carTrack.addEventListener('scroll', function () { requestAnimationFrame(carUpdate); }, { passive: true });
    setTimeout(carUpdate, 250);
  }

  /* ============================================================
     FAQ
     ============================================================ */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (it) {
        it.classList.remove('open'); it.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* ============================================================
     LEAD FORM
     ============================================================ */
  var form = document.getElementById('leadForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = {
        nome: form.nome.value, telefone: form.telefone.value,
        email: form.email.value, tipologia: form.tipologia.value
      };
      // Encaminha para o WhatsApp da imobiliária com os dados preenchidos
      var msg = 'Olá! Quero agendar uma visita ao Authoria by Tebas.%0A'
        + '%0ANome: ' + encodeURIComponent(data.nome)
        + '%0ATelefone: ' + encodeURIComponent(data.telefone)
        + (data.email ? '%0AE-mail: ' + encodeURIComponent(data.email) : '')
        + (data.tipologia ? '%0AInteresse: ' + encodeURIComponent(data.tipologia) : '');
      var sendUrl = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + msg;
      document.getElementById('formOk').classList.add('show');
      form.style.display = 'none';
      setTimeout(function () { window.open(sendUrl, '_blank'); }, 600);
    });
  }

  /* ============================================================
     SMOOTH ANCHORS (with header offset)
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id === '#top') { return; }
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ============================================================
     HELPERS
     ============================================================ */
  function debounce(fn, ms) {
    var t; return function () { clearTimeout(t); var a = arguments, c = this; t = setTimeout(function () { fn.apply(c, a); }, ms); };
  }

  /* ============================================================
     TWEAKS (host edit-mode protocol, vanilla)
     ============================================================ */
  var TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "#c2a35f",
    "headingFont": "Cormorant Garamond",
    "animIntensity": 1,
    "ctaText": "Agende sua visita"
  }/*EDITMODE-END*/;

  var tweaks = Object.assign({}, TWEAK_DEFAULTS);

  function applyTweaks() {
    var root = document.documentElement;
    root.style.setProperty('--accent', tweaks.accent);
    // contrast ink for accent
    var ink = (tweaks.accent.toLowerCase() === '#d4866a') ? '#2a1810' : '#1a1407';
    root.style.setProperty('--accent-ink', ink);
    root.style.setProperty('--serif', "'" + tweaks.headingFont + "', 'Times New Roman', serif");
    root.style.setProperty('--anim', tweaks.animIntensity);
    document.querySelectorAll('[data-cta]').forEach(function (el) {
      // keep icon-less text buttons in sync
      if (el.children.length === 0) el.textContent = tweaks.ctaText;
    });
  }
  applyTweaks();

  function setTweak(key, val) {
    tweaks[key] = val;
    applyTweaks();
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*'); } catch (e) {}
  }

  // Build panel
  var panel = document.createElement('div');
  panel.id = 'tweaksPanel';
  panel.style.cssText = 'position:fixed;top:80px;right:20px;z-index:200;width:288px;background:rgba(10,17,32,.96);backdrop-filter:blur(14px);border:1px solid rgba(244,238,227,.16);border-radius:10px;padding:18px 18px 20px;color:#f4eee3;font-family:var(--sans);box-shadow:0 30px 80px -20px rgba(0,0,0,.7);display:none';
  panel.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
    + '<span style="font-family:var(--serif);font-size:19px;letter-spacing:.04em">Tweaks</span>'
    + '<button id="twClose" style="color:#b9c1d2;font-size:20px;line-height:1;width:26px;height:26px;border-radius:50%;border:1px solid rgba(244,238,227,.16)">&times;</button></div>'
    + twSection('Cor de destaque')
    + '<div id="twAccent" style="display:flex;gap:10px;margin-bottom:18px">'
      + twSwatch('#c2a35f', 'Ouro') + twSwatch('#d4866a', 'Coral') + '</div>'
    + twSection('Fonte dos títulos')
    + '<div id="twFont" style="display:flex;gap:6px;margin-bottom:18px">'
      + twSeg('Cormorant Garamond', 'Cormorant') + twSeg('Marcellus', 'Marcellus') + '</div>'
    + twSection('Intensidade das animações')
    + '<div id="twAnim" style="display:flex;gap:6px;margin-bottom:18px">'
      + twSeg2('0.6', 'Sutil') + twSeg2('1', 'Padrão') + twSeg2('1.4', 'Amplo') + '</div>'
    + twSection('Texto do botão (CTA)')
    + '<input id="twCta" type="text" value="' + TWEAK_DEFAULTS.ctaText + '" style="width:100%;height:42px;background:rgba(6,9,15,.5);border:1px solid rgba(244,238,227,.16);border-radius:6px;padding:0 12px;color:#f4eee3;font-family:var(--sans);font-size:14px" />';
  document.getElementById('tweaks-root').appendChild(panel);

  function twSection(label) {
    return '<div style="font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:#79808f;margin-bottom:9px">' + label + '</div>';
  }
  function twSwatch(color, label) {
    return '<button class="tw-sw" data-v="' + color + '" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;padding:10px 4px;border-radius:7px;border:1px solid rgba(244,238,227,.12);background:transparent">'
      + '<span style="width:26px;height:26px;border-radius:50%;background:' + color + '"></span>'
      + '<span style="font-size:11px;color:#b9c1d2">' + label + '</span></button>';
  }
  function twSeg(v, label) {
    return '<button class="tw-font" data-v="' + v + '" style="flex:1;height:38px;border-radius:6px;border:1px solid rgba(244,238,227,.12);background:transparent;color:#b9c1d2;font-size:12.5px;font-family:\'' + v + '\',serif">' + label + '</button>';
  }
  function twSeg2(v, label) {
    return '<button class="tw-anim" data-v="' + v + '" style="flex:1;height:36px;border-radius:6px;border:1px solid rgba(244,238,227,.12);background:transparent;color:#b9c1d2;font-size:12px">' + label + '</button>';
  }

  function markActive(sel, attr, val) {
    panel.querySelectorAll(sel).forEach(function (b) {
      var on = b.getAttribute('data-v') === String(val);
      b.style.borderColor = on ? tweaks.accent : 'rgba(244,238,227,.12)';
      b.style.color = on && b.classList.contains('tw-font') ? '#f4eee3' : (on && b.classList.contains('tw-anim') ? '#f4eee3' : b.style.color);
      if (on && (b.classList.contains('tw-anim') || b.classList.contains('tw-font'))) b.style.background = 'rgba(244,238,227,.06)';
      else if (b.classList.contains('tw-anim') || b.classList.contains('tw-font')) b.style.background = 'transparent';
    });
  }
  function refreshActives() {
    markActive('.tw-sw', 'accent', tweaks.accent);
    markActive('.tw-font', 'headingFont', tweaks.headingFont);
    markActive('.tw-anim', 'animIntensity', tweaks.animIntensity);
  }

  panel.querySelectorAll('.tw-sw').forEach(function (b) {
    b.addEventListener('click', function () { setTweak('accent', b.getAttribute('data-v')); refreshActives(); });
  });
  panel.querySelectorAll('.tw-font').forEach(function (b) {
    b.addEventListener('click', function () { setTweak('headingFont', b.getAttribute('data-v')); refreshActives(); });
  });
  panel.querySelectorAll('.tw-anim').forEach(function (b) {
    b.addEventListener('click', function () { setTweak('animIntensity', parseFloat(b.getAttribute('data-v'))); refreshActives(); });
  });
  panel.querySelector('#twCta').addEventListener('input', function (e) { setTweak('ctaText', e.target.value); });
  panel.querySelector('#twClose').addEventListener('click', function () {
    panel.style.display = 'none';
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
  });
  refreshActives();

  // host protocol
  window.addEventListener('message', function (e) {
    var t = e && e.data && e.data.type;
    if (t === '__activate_edit_mode') { panel.style.display = 'block'; refreshActives(); }
    else if (t === '__deactivate_edit_mode') { panel.style.display = 'none'; }
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}

})();
