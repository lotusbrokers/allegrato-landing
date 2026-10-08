/* ============================================================
   MISTRAL JUNDIAÍ — interações
   ============================================================ */

/* >>> CONFIGURE AQUI <<< WhatsApp da Lotus Brokers */
const WPP_NUMBER = '5511900000000';

function wppLink(msg){
  return 'https://wa.me/' + WPP_NUMBER + '?text=' + encodeURIComponent(msg || 'Olá! Quero informações sobre o Mistral Jundiaí.');
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
    var msg = 'Olá! Tenho interesse no Mistral Jundiaí.';
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
  lightboxImg.alt = it.alt || 'Imagem ampliada do Mistral Jundiaí';
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

/* portaria (sobre) */
var aboutImg = document.querySelector('.about-img img');
if (aboutImg){
  aboutImg.addEventListener('click', function(){
    openLightboxSrc(aboutImg.currentSrc || aboutImg.src, aboutImg.alt, aboutImg.dataset.cap || aboutImg.alt);
  });
}

/* resolve caminhos de imagem (compatível com bundle standalone) */
function res(id, path){
  return (window.__resources && window.__resources[id]) || path;
}

/* ---------- Tipologias (dados reais do book) ---------- */
var TIPOS = [
  {
    kicker: 'Opção de 2 ou 3 suítes',
    area: '131 m²',
    sub: 'Com ventilação cruzada e depósito privativo',
    img: res('livingGourmet', 'assets/mistral/living-gourmet.jpg'),
    imgAlt: 'Varanda gourmet integrada à sala de jantar do Mistral Jundiaí',
    vcap: 'Varanda gourmet integrada ao living · Imagem meramente ilustrativa',
    specs: [
      { l: 'Suítes', v: '2 e 3' },
      { l: 'Vagas', v: '2 e 3' },
      { l: 'Varandas', v: '2' },
      { l: 'Lavabo', v: '1' }
    ],
    rooms: ['Sala de estar','Sala de jantar','Varanda social','Varanda gourmet','Cozinha','Área de serviço','Quintal aberto','Lavabo','Suíte master','Closet','Depósito privativo'],
    note: 'Vagas que acomodam caminhonete grande, tipo RAM 1500. A área da unidade informada inclui todas as paredes internas, que dividem os ambientes, as paredes externas de fechamento da unidade, mais depósito privativo.'
  },
  {
    kicker: 'Planta com 3 suítes',
    area: '164 m²',
    sub: 'Dupla vista, ventilação cruzada e depósito privativo',
    img: res('livingEstar', 'assets/mistral/living-estar.jpg'),
    imgAlt: 'Varanda social com vista aberta do apartamento de 164 m² do Mistral Jundiaí',
    vcap: 'Varanda social do apartamento de 164 m² · Imagem meramente ilustrativa',
    specs: [
      { l: 'Suítes', v: '3' },
      { l: 'Vagas', v: '3' },
      { l: 'Varandas', v: '2' },
      { l: 'Lavabo', v: '1' }
    ],
    rooms: ['Entrada social','Hall privativo','Sala de estar','Sala de jantar','Varanda social','Varanda gourmet','Cozinha','Área de serviço','Quintal aberto','Lavabo','Suíte master','Banho master','Closet','Suíte 2','Banho 2','Suíte 3','Banho 3','Entrada de serviço','Depósito privativo'],
    note: 'Planta ilustrativa. Material preliminar sujeito à alteração. Os móveis, objetos e revestimentos de piso são sugestões decorativas e não fazem parte do Memorial Descritivo. As medidas internas dos ambientes são calculadas de face a face das paredes, podendo variar devido à execução e aos acabamentos utilizados.'
  }
];

var infoEl = document.querySelector('.js-tipo-info');
var tipoImg = document.querySelector('.js-tipo-img');
var tipoVcap = document.querySelector('.js-tipo-vcap');
var currentTipo = 0;

function renderTipo(i){
  var t = TIPOS[i];
  currentTipo = i;
  infoEl.innerHTML =
    '<div class="kicker">' + t.kicker + '</div>' +
    '<h3>' + t.area + '</h3>' +
    '<div class="sub">' + t.sub + '</div>' +
    '<div class="spec">' +
      t.specs.map(function(s){ return '<div><div class="sl">'+s.l+'</div><div class="sv">'+s.v+'</div></div>'; }).join('') +
    '</div>' +
    '<div class="rooms">' + t.rooms.map(function(r){ return '<span>'+r+'</span>'; }).join('') + '</div>' +
    '<p class="tipo-note">' + t.note + '</p>';
  if (tipoImg){
    tipoImg.src = t.img;
    tipoImg.alt = t.imgAlt;
  }
  if (tipoVcap){ tipoVcap.textContent = t.vcap; }
}

document.querySelectorAll('.js-tabs .tipo-tab').forEach(function(tab){
  tab.addEventListener('click', function(){
    document.querySelectorAll('.js-tabs .tipo-tab').forEach(function(t){ t.classList.remove('active'); });
    tab.classList.add('active');
    renderTipo(parseInt(tab.dataset.tipo, 10));
  });
});
renderTipo(0);

var tipoVisual = document.querySelector('.js-tipo-visual');
if (tipoVisual){
  tipoVisual.addEventListener('click', function(){
    var t = TIPOS[currentTipo];
    openLightboxSrc(tipoImg.currentSrc || tipoImg.src, t.imgAlt, t.vcap);
  });
}
