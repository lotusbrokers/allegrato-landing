/* ============================================================
   AUTEN JUNDIAÍ — interações
   ============================================================ */

/* >>> CONFIGURE AQUI <<< — troque pelo WhatsApp da sua imobiliária */
const WPP_NUMBER = '5511900000000'; // formato internacional, somente dígitos

/* ---------- WhatsApp deep-links ---------- */
function wppLink(msg){
  return 'https://wa.me/' + WPP_NUMBER + '?text=' + encodeURIComponent(msg || 'Olá! Quero informações sobre o Auten Jundiaí.');
}
document.querySelectorAll('.js-wpp').forEach(function(el){
  el.setAttribute('href', wppLink(el.dataset.msg));
  el.setAttribute('target', '_blank');
  el.setAttribute('rel', 'noopener');
});

/* ---------- Lead forms → abrem WhatsApp com os dados ---------- */
document.querySelectorAll('.js-lead').forEach(function(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const data = new FormData(form);
    const nome = (data.get('nome') || '').toString().trim();
    const tel  = (data.get('tel')  || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const tipo = (data.get('tipo') || '').toString().trim();
    let msg = 'Olá! Tenho interesse no Auten Jundiaí.';
    if (nome) msg += ' Meu nome é ' + nome + '.';
    if (tipo) msg += ' Interesse: ' + tipo + '.';
    if (tel)  msg += ' Meu WhatsApp: ' + tel + '.';
    if (email) msg += ' Meu e-mail: ' + email + '.';
    msg += ' Podem me enviar o material e as condições?';
    window.open(wppLink(msg), '_blank', 'noopener');
  });
});

/* ---------- Header scroll state ---------- */
const header = document.getElementById('header');
function onScroll(){
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Reveal on scroll (rect-based, robust) ---------- */
const revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
function checkReveal(instant){
  const vh = window.innerHeight || document.documentElement.clientHeight;
  for (let i = revealEls.length - 1; i >= 0; i--){
    const el = revealEls[i];
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.92 && r.bottom > -40){
      if (instant){
        el.style.transition = 'none';
        el.classList.add('in');
        requestAnimationFrame(function(){ el.style.transition = ''; });
      } else {
        el.classList.add('in');
      }
      revealEls.splice(i, 1);
    }
  }
}
window.addEventListener('scroll', function(){ checkReveal(false); }, { passive: true });
window.addEventListener('resize', function(){ checkReveal(false); }, { passive: true });
checkReveal(true);                                   // initial: above-the-fold appears instantly
requestAnimationFrame(function(){ checkReveal(true); });
window.addEventListener('load', function(){ checkReveal(false); });
/* failsafe: reveal everything still hidden (e.g. inside fixed-height iframe embeds) */
setTimeout(function(){ document.querySelectorAll('[data-reveal]:not(.in)').forEach(function(el){ el.classList.add('in'); }); }, 1000);

/* ---------- Lazy YouTube embed ---------- */
document.querySelectorAll('.js-video').forEach(function(box){
  box.addEventListener('click', function(){
    if (box.classList.contains('playing')) return;
    var id = box.dataset.yt;
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('title', 'Vídeo Auten Jundiaí');
    box.appendChild(iframe);
    box.classList.add('playing');
  });
});

/* ---------- Tipologias (dados reais do manual) ---------- */
const TIPOS = [
  {
    kicker: 'Torre 02 · final 3 e 4',
    area: '128,51 m²',
    torre: '24 unidades · 2 opções de planta',
    specs: [
      { l: 'Suítes', v: '3' },
      { l: 'Vagas', v: '3' },
      { l: 'Sala estar/jantar', v: '22 m²' },
      { l: 'Varanda gourmet', v: '12 m²' }
    ],
    feats: [
      'Opção inicial do empreendimento',
      'Suíte master com closet e banheiro com duas cubas',
      'Opção 2: 2 suítes, suíte master com closet amplo e banheiros Sr. e Sra., sala ampliada',
      'Bike box exclusivo por unidade'
    ]
  },
  {
    kicker: 'Torre 02 · final 1 e 2',
    area: '131,14 m²',
    torre: '24 unidades · 2 opções de planta',
    specs: [
      { l: 'Suítes', v: '3' },
      { l: 'Vagas', v: '3' },
      { l: 'Sala estar/jantar', v: '22 m²' },
      { l: 'Varanda gourmet', v: '12 m²' }
    ],
    feats: [
      'Opção com maior espaço interno',
      'Suíte master com closet e banheiro com duas cubas',
      'Opção 2: 2 suítes, suíte master ampliada com banheiros Sr. e Sra. e sala ampliada com varanda integrada',
      'Bike box exclusivo por unidade'
    ]
  },
  {
    kicker: 'Torre 01 · elevador privativo',
    area: '188,62 m²',
    torre: '24 unidades · 2 opções de planta',
    specs: [
      { l: 'Suítes', v: '4' },
      { l: 'Vagas', v: '4' },
      { l: 'Sala estar/jantar', v: '28 m²' },
      { l: 'Varanda gourmet', v: '20 m²' }
    ],
    feats: [
      'Elevador privativo',
      'Sala multiuso na cozinha (despensa ou adega) de 4,20 m²',
      'Suíte master com closet mais amplo e banheiro com duas cubas',
      'Opção 2: 3 suítes, suíte master com banheiro ampliado, sala ampliada e sugestão de adega'
    ]
  },
  {
    kicker: 'Torre 02 · cobertura',
    area: '264,54 m²',
    torre: 'Apenas 02 unidades · penthouse',
    specs: [
      { l: 'Suítes', v: '3' },
      { l: 'Vagas', v: '3' },
      { l: 'Terraço', v: '116 m²' },
      { l: 'Elevador', v: 'privativo' }
    ],
    feats: [
      'Cobertura com terraço de 116 m²',
      'Piscina privativa (2,90 × 4,00 × 0,85 m), churrasqueira e lavabo externo',
      'Suíte master com closet e banheiro com duas cubas',
      'Apenas 02 unidades em todo o empreendimento'
    ]
  }
];

const infoEl = document.querySelector('.js-tipo-info');
const plantaEl = document.querySelector('.js-planta');
const plantaCapEl = document.querySelector('.js-planta-cap');
const plantaZoomEl = document.querySelector('.js-planta-zoom');
let currentTipo = 0;
const plantaImgs = (function(){
  var els = document.querySelectorAll('#planta-sources img');
  if (els && els.length === 4){ return Array.prototype.map.call(els, function(im){ return im.src; }); }
  return ['assets/opt/planta-128.jpg','assets/opt/planta-131.jpg','assets/opt/planta-188.jpg','assets/opt/planta-264.jpg'];
})();
const plantaCaps = [
  'Planta ilustrativa · 128,51 m² · Opção 1',
  'Planta ilustrativa · 131,14 m² · sala ampliada com varanda integrada',
  'Planta ilustrativa · 188,62 m² · 4 suítes com elevador privativo',
  'Planta ilustrativa · 264,54 m² · penthouse com terraço e piscina privativa'
];
const plantaAlts = [
  'Planta da residência suspensa de 128,51 m² com 3 suítes',
  'Planta da residência suspensa de 131,14 m² com 3 suítes e varanda integrada',
  'Planta da residência suspensa de 188,62 m² com 4 suítes e elevador privativo',
  'Planta da penthouse de 264,54 m² com terraço e piscina privativa'
];

function renderTipo(i){
  const t = TIPOS[i];
  infoEl.innerHTML =
    '<div class="kicker">' + t.kicker + '</div>' +
    '<h3>' + t.area + '</h3>' +
    '<div class="torre">' + t.torre + '</div>' +
    '<div class="spec">' +
      t.specs.map(function(s){ return '<div><div class="sl">'+s.l+'</div><div class="sv">'+s.v+'</div></div>'; }).join('') +
    '</div>' +
    '<ul class="tipo-feats">' +
      t.feats.map(function(f){ return '<li>'+f+'</li>'; }).join('') +
    '</ul>';
  if (plantaEl){
    plantaEl.style.opacity = '0';
    var src = plantaImgs[i];
    var pre = new Image();
    pre.onload = function(){ plantaEl.src = src; plantaEl.alt = plantaAlts[i]; plantaEl.style.opacity = '1'; };
    pre.src = src;
  }
  if (plantaCapEl){ plantaCapEl.textContent = plantaCaps[i]; }
  currentTipo = i;
}

/* ---------- Lightbox: galeria ampliaível com navegação ---------- */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCap = document.getElementById('lightbox-cap');
const lightboxCount = document.getElementById('lightbox-count');
const lbPrev = document.getElementById('lightbox-prev');
const lbNext = document.getElementById('lightbox-next');
let lbItems = [];
let lbIndex = 0;

function renderLb(){
  var it = lbItems[lbIndex];
  if (!it) return;
  lightboxImg.src = it.src;
  lightboxImg.alt = it.alt || 'Imagem ampliada do Auten Jundiaí';
  lightboxCap.textContent = it.cap || '';
  var multi = lbItems.length > 1;
  lbPrev.hidden = !multi;
  lbNext.hidden = !multi;
  lightboxCount.textContent = multi ? (lbIndex + 1) + ' / ' + lbItems.length : '';
}
function openLightboxGroup(items, idx){
  lbItems = items;
  lbIndex = idx || 0;
  renderLb();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function openLightboxSrc(src, alt, cap){
  openLightboxGroup([{ src: src, alt: alt, cap: cap }], 0);
}
function lbStep(dir){
  if (lbItems.length < 2) return;
  lbIndex = (lbIndex + dir + lbItems.length) % lbItems.length;
  renderLb();
}
function openLightbox(){
  openLightboxSrc(plantaImgs[currentTipo], plantaAlts[currentTipo], plantaCaps[currentTipo]);
}
function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
if (plantaZoomEl){ plantaZoomEl.addEventListener('click', openLightbox); }
var lbClose = document.getElementById('lightbox-close');
if (lbClose){ lbClose.addEventListener('click', closeLightbox); }
if (lbPrev){ lbPrev.addEventListener('click', function(e){ e.stopPropagation(); lbStep(-1); }); }
if (lbNext){ lbNext.addEventListener('click', function(e){ e.stopPropagation(); lbStep(1); }); }
if (lightbox){
  lightbox.addEventListener('click', function(e){ if (e.target === lightbox || e.target.classList.contains('lightbox-inner')) closeLightbox(); });
}
document.addEventListener('keydown', function(e){
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowRight') lbStep(1);
  else if (e.key === 'ArrowLeft') lbStep(-1);
});

/* ---------- Tornar imagens da galeria clicáveis ---------- */
function capFromFigure(fig){
  if (!fig) return '';
  var t = fig.querySelector('.cap .t, .video-cap .t');
  var s = fig.querySelector('.cap .s, .video-cap .s');
  var tt = t ? t.textContent.trim() : '';
  var ss = s ? s.textContent.trim() : '';
  return tt + (ss ? ' · ' + ss : '');
}
function buildGroup(selector){
  return Array.prototype.map.call(document.querySelectorAll(selector), function(box){
    var img = box.querySelector('img');
    return { src: (img.currentSrc || img.src), alt: img.alt, cap: capFromFigure(box) || img.alt, el: box };
  });
}
// Lazer e Interiores: cada grupo navega entre seus itens
['.lazer-gallery .lz', '.int-grid .int'].forEach(function(sel){
  var boxes = document.querySelectorAll(sel);
  boxes.forEach(function(box, i){
    box.addEventListener('click', function(){
      var group = buildGroup(sel);
      openLightboxGroup(group, i);
    });
  });
});
var implantFrame = document.querySelector('.implant-frame');
if (implantFrame){
  implantFrame.addEventListener('click', function(){
    var img = implantFrame.querySelector('img');
    var cap = document.querySelector('.implant-cap');
    openLightboxSrc(img.currentSrc || img.src, img.alt, cap ? cap.textContent.trim() : img.alt);
  });
}

/* ---------- Façade dia ↔ noite ---------- */
(function(){
  var fa = document.querySelector('.js-facade');
  if (!fa) return;
  var btnDay = fa.querySelector('.js-fa-day');
  var btnNight = fa.querySelector('.js-fa-night');
  var dayImg = fa.querySelector('.fa-day');
  var nightImg = fa.querySelector('.fa-night');
  var auto = true;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setMode(night){
    fa.classList.toggle('is-night', night);
    btnNight.classList.toggle('active', night);
    btnDay.classList.toggle('active', !night);
    btnNight.setAttribute('aria-pressed', night ? 'true' : 'false');
    btnDay.setAttribute('aria-pressed', night ? 'false' : 'true');
  }
  btnDay.addEventListener('click', function(){ auto = false; setMode(false); });
  btnNight.addEventListener('click', function(){ auto = false; setMode(true); });
  // abrir no lightbox ao clicar na imagem (não nos botões) — mostra as duas vistas
  [dayImg, nightImg].forEach(function(img){
    img.addEventListener('click', function(){
      var items = [
        { src: dayImg.currentSrc || dayImg.src, alt: dayImg.alt, cap: 'Perspectiva ilustrada da fachada — Vista 1' },
        { src: nightImg.currentSrc || nightImg.src, alt: nightImg.alt, cap: 'Perspectiva ilustrada da fachada — Vista 2' }
      ];
      var isNight = fa.classList.contains('is-night');
      openLightboxGroup(items, isNight ? 1 : 0);
    });
  });
  // crossfade autom\u00e1tico dia -> noite (fade suave, roda para todos)
  var loop = setInterval(function(){
    if (!auto) return;
    setMode(!fa.classList.contains('is-night'));
  }, 4500);
})();

document.querySelectorAll('.js-tabs .tipo-tab').forEach(function(tab){
  tab.addEventListener('click', function(){
    document.querySelectorAll('.js-tabs .tipo-tab').forEach(function(t){ t.classList.remove('active'); });
    tab.classList.add('active');
    renderTipo(parseInt(tab.dataset.tipo, 10));
  });
});
renderTipo(0);
