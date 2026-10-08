/* ============================================================
   EPIC JUNDIAÍ — interações
   ============================================================ */

/* >>> CONFIGURE AQUI <<< WhatsApp da Lotus Brokers */
const WPP_NUMBER = '5511900000000';

function wppLink(msg){
  return 'https://wa.me/' + WPP_NUMBER + '?text=' + encodeURIComponent(msg || 'Olá! Quero informações sobre o Epic Jundiaí.');
}
document.querySelectorAll('.js-wpp').forEach(function(el){
  el.setAttribute('href', wppLink(el.dataset.msg));
  el.setAttribute('target', '_blank');
  el.setAttribute('rel', 'noopener');
});

/* ---------- Formulários → WhatsApp ---------- */
document.querySelectorAll('.js-lead').forEach(function(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var d = new FormData(form);
    var nome = (d.get('nome')||'').toString().trim();
    var tel = (d.get('tel')||'').toString().trim();
    var email = (d.get('email')||'').toString().trim();
    var tipo = (d.get('tipo')||'').toString().trim();
    var msg = 'Olá! Tenho interesse no Epic Jundiaí.';
    if (nome) msg += ' Meu nome é ' + nome + '.';
    if (tipo) msg += ' Interesse: ' + tipo + '.';
    if (tel) msg += ' Meu WhatsApp: ' + tel + '.';
    if (email) msg += ' Meu e-mail: ' + email + '.';
    msg += ' Podem me enviar o material e as condições?';
    window.open(wppLink(msg), '_blank', 'noopener');
  });
});

/* ---------- Header scroll ---------- */
var header = document.getElementById('header');
function onScroll(){
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Reveal ---------- */
var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
function checkReveal(instant){
  var vh = window.innerHeight || document.documentElement.clientHeight;
  for (var i = revealEls.length - 1; i >= 0; i--){
    var el = revealEls[i];
    var r = el.getBoundingClientRect();
    if (r.top < vh * 0.92 && r.bottom > -40){
      if (instant){
        el.style.transition = 'none';
        el.classList.add('in');
        (function(e){ requestAnimationFrame(function(){ e.style.transition = ''; }); })(el);
      } else {
        el.classList.add('in');
      }
      revealEls.splice(i, 1);
    }
  }
}
window.addEventListener('scroll', function(){ checkReveal(false); }, { passive: true });
window.addEventListener('resize', function(){ checkReveal(false); }, { passive: true });
checkReveal(true);
requestAnimationFrame(function(){ checkReveal(true); });
window.addEventListener('load', function(){ checkReveal(false); });

/* ---------- Lightbox com navegação ---------- */
var lightbox = document.getElementById('lightbox');
var lightboxImg = document.getElementById('lightbox-img');
var lightboxCap = document.getElementById('lightbox-cap');
var lightboxCount = document.getElementById('lightbox-count');
var lbPrev = document.getElementById('lightbox-prev');
var lbNext = document.getElementById('lightbox-next');
var lbItems = [];
var lbIndex = 0;

function renderLb(){
  var it = lbItems[lbIndex];
  if (!it) return;
  lightboxImg.src = it.src;
  lightboxImg.alt = it.alt || 'Imagem ampliada do Epic Jundiaí';
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
function closeLightbox(){
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', function(e){ e.stopPropagation(); lbStep(-1); });
lbNext.addEventListener('click', function(e){ e.stopPropagation(); lbStep(1); });
lightbox.addEventListener('click', function(e){
  if (e.target === lightbox || e.target.classList.contains('lightbox-inner')) closeLightbox();
});
document.addEventListener('keydown', function(e){
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowRight') lbStep(1);
  else if (e.key === 'ArrowLeft') lbStep(-1);
});

/* ---------- Galerias clicáveis ---------- */
function capFromFigure(fig){
  if (!fig) return '';
  var t = fig.querySelector('.cap .t');
  var s = fig.querySelector('.cap .s');
  var tt = t ? t.textContent.trim() : '';
  var ss = s ? s.textContent.trim() : '';
  return tt + (ss ? ' · ' + ss : '');
}
function buildGroup(sel){
  return Array.prototype.map.call(document.querySelectorAll(sel), function(box){
    var img = box.querySelector('img');
    return { src: (img.currentSrc || img.src), alt: img.alt, cap: capFromFigure(box) || img.alt };
  });
}
['.gal .lz', '.int-grid .int'].forEach(function(sel){
  document.querySelectorAll(sel).forEach(function(box, i){
    box.addEventListener('click', function(){ openLightboxGroup(buildGroup(sel), i); });
  });
});

/* planta */
var plantaZoom = document.querySelector('.js-planta-zoom');
if (plantaZoom){
  plantaZoom.addEventListener('click', function(){
    var img = document.querySelector('.js-planta');
    openLightboxSrc(img.currentSrc || img.src, img.alt, 'Planta ilustrativa · 207 m², incluindo hall privativo e depósito');
  });
}

/* portaria (sobre) */
var aboutImg = document.querySelector('.about-img img');
if (aboutImg){
  aboutImg.addEventListener('click', function(){
    openLightboxSrc(aboutImg.currentSrc || aboutImg.src, aboutImg.alt, aboutImg.dataset.cap || aboutImg.alt);
  });
}
