/* ============================================================
   AUTEN SERRAH — interações · Lotus Brokers
   ============================================================ */

/* ============================================================
   >>> CONFIGURAÇÃO CENTRAL — edite apenas este bloco <<<
   ============================================================ */
const CONFIG = {
  // WhatsApp da LIA (atendimento Lotus Brokers).
  // Formato internacional, somente dígitos: 55 + DDD + número.
  WPP: '5511926143393',

  empreendimento: 'Auten Serrah',
  imobiliaria: 'Lotus Brokers',

  // Integração futura (CRM / API / Webhook).
  // Preencha ENDPOINT para enviar os leads por POST em JSON.
  // Deixe vazio ('') para o site seguir apenas com o fluxo de WhatsApp.
  ENDPOINT: '',
  METHOD: 'POST',

  // Link da política de privacidade (quando houver).
  PRIVACIDADE: ''
};

/* ---------- WhatsApp ---------- */
function wppLink(msg){
  return 'https://wa.me/' + CONFIG.WPP + '?text=' + encodeURIComponent(msg || ('Olá! Quero informações sobre o ' + CONFIG.empreendimento + '.'));
}
document.querySelectorAll('.js-wpp').forEach(function(el){
  el.setAttribute('href', wppLink(el.dataset.msg));
  el.setAttribute('target', '_blank');
  el.setAttribute('rel', 'noopener');
});

/* ---------- Política de privacidade ---------- */
document.querySelectorAll('.js-privacy').forEach(function(el){
  if (CONFIG.PRIVACIDADE){ el.href = CONFIG.PRIVACIDADE; el.target = '_blank'; el.rel = 'noopener'; }
  else el.addEventListener('click', function(e){ e.preventDefault(); });
});

/* ---------- Header ---------- */
const header = document.getElementById('header');
function onScroll(){ header.classList.toggle('scrolled', window.scrollY > 40); }
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Menu mobile ---------- */
const mm = document.getElementById('mobile-menu');
function setMenu(open){
  mm.classList.toggle('open', open);
  mm.setAttribute('aria-hidden', open ? 'false' : 'true');
  document.body.style.overflow = open ? 'hidden' : '';
  var t = document.querySelector('.js-menu-open');
  if (t) t.setAttribute('aria-expanded', open ? 'true' : 'false');
}
document.querySelectorAll('.js-menu-open').forEach(function(b){ b.addEventListener('click', function(){ setMenu(true); }); });
document.querySelectorAll('.js-menu-close').forEach(function(b){ b.addEventListener('click', function(){ setMenu(false); }); });
mm.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });

/* ---------- Hero ---------- */
requestAnimationFrame(function(){ var h = document.getElementById('hero'); if (h) h.classList.add('ready'); });

/* ---------- Máscara de telefone ---------- */
document.querySelectorAll('input[name="tel"]').forEach(function(inp){
  inp.addEventListener('input', function(){
    var v = inp.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) inp.value = '(' + v.slice(0,2) + ') ' + v.slice(2, v.length > 10 ? 7 : 6) + '-' + v.slice(v.length > 10 ? 7 : 6);
    else if (v.length > 2) inp.value = '(' + v.slice(0,2) + ') ' + v.slice(2);
    else if (v.length > 0) inp.value = '(' + v;
    else inp.value = '';
  });
});

/* ---------- Formulários de lead ---------- */
function fieldOf(el){ return el.closest('.field') || el.closest('.consent'); }
function validate(form){
  var ok = true;
  form.querySelectorAll('[required]').forEach(function(el){
    var good;
    if (el.type === 'checkbox') good = el.checked;
    else if (el.type === 'email') good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
    else if (el.name === 'tel') good = el.value.replace(/\D/g,'').length >= 10;
    else good = el.value.trim().length > 1;
    var box = fieldOf(el);
    if (box) box.classList.toggle('invalid', !good);
    el.classList.toggle('err', !good);
    if (!good && ok){ ok = false; try { el.focus(); } catch(e){} }
  });
  return ok;
}
function leadMessage(d){
  var msg = 'Olá! Tenho interesse no ' + CONFIG.empreendimento + '.';
  if (d.nome) msg += ' Meu nome é ' + d.nome + '.';
  if (d.tipo) msg += ' Interesse: ' + d.tipo + '.';
  if (d.tel) msg += ' Telefone: ' + d.tel + '.';
  if (d.email) msg += ' E-mail: ' + d.email + '.';
  if (d.msg) msg += ' ' + d.msg;
  msg += ' Podem me enviar o material e as condições?';
  return msg;
}
document.querySelectorAll('.js-lead').forEach(function(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (!validate(form)) return;

    var fd = new FormData(form);
    var data = {
      nome:  (fd.get('nome')  || '').toString().trim(),
      email: (fd.get('email') || '').toString().trim(),
      tel:   (fd.get('tel')   || '').toString().trim(),
      tipo:  (fd.get('tipo')  || '').toString().trim(),
      msg:   (fd.get('msg')   || '').toString().trim(),
      consent: !!fd.get('consent'),
      empreendimento: CONFIG.empreendimento,
      imobiliaria: CONFIG.imobiliaria,
      origem: location.href,
      enviadoEm: new Date().toISOString()
    };

    // Integração CRM / API / Webhook
    if (CONFIG.ENDPOINT){
      try {
        fetch(CONFIG.ENDPOINT, {
          method: CONFIG.METHOD,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }).catch(function(){});
      } catch(err){}
    }
    // Camada de analytics (Pixel / GTM), se presente
    try { if (window.dataLayer) window.dataLayer.push({ event: 'lead_serrah', lead: data }); } catch(err){}
    try { if (window.fbq) window.fbq('track', 'Lead'); } catch(err){}

    // Sucesso + WhatsApp já preenchido
    var card = form.closest('.lead-card') || form.closest('.final-form');
    var ok = card ? card.querySelector('.js-ok') : null;
    var wpp = ok ? ok.querySelector('.js-wpp') : null;
    if (wpp) wpp.setAttribute('href', wppLink(leadMessage(data)));
    form.style.display = 'none';
    if (ok) ok.classList.add('show');
    var or = card ? card.querySelector('.or') : null;
    if (or) or.style.display = 'none';
  });
  form.querySelectorAll('[required]').forEach(function(el){
    el.addEventListener('input', function(){
      var box = fieldOf(el); if (box) box.classList.remove('invalid'); el.classList.remove('err');
    });
    el.addEventListener('change', function(){
      var box = fieldOf(el); if (box) box.classList.remove('invalid'); el.classList.remove('err');
    });
  });
});

/* ---------- Reveal ---------- */
const revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
function checkReveal(instant){
  var vh = window.innerHeight || document.documentElement.clientHeight;
  for (var i = revealEls.length - 1; i >= 0; i--){
    var el = revealEls[i], r = el.getBoundingClientRect();
    if (r.top < vh * 0.92 && r.bottom > -40){
      if (instant){
        el.style.transition = 'none'; el.classList.add('in');
        (function(x){ requestAnimationFrame(function(){ x.style.transition = ''; }); })(el);
      } else el.classList.add('in');
      revealEls.splice(i, 1);
    }
  }
}
window.addEventListener('scroll', function(){ checkReveal(false); }, { passive: true });
window.addEventListener('resize', function(){ checkReveal(false); }, { passive: true });
checkReveal(true);
requestAnimationFrame(function(){ checkReveal(true); });
window.addEventListener('load', function(){ checkReveal(false); });

/* ============================================================
   TIPOLOGIAS — dados da ficha técnica preliminar
   ============================================================ */
const TIPOS = [
  { n:'Tipo 01', area:'85,36 m²', kicker:'3 dormitórios · 1 suíte',
    specs:[{l:'Dormitórios',v:'3'},{l:'Suítes',v:'1'},{l:'Vagas',v:'2'}],
    feats:['Sala e cozinha integradas','Varanda gourmet com churrasqueira a gás','Área de serviço','Banheiro social'] },
  { n:'Tipo 02', area:'73,25 m²', kicker:'2 dormitórios · 1 suíte',
    specs:[{l:'Dormitórios',v:'2'},{l:'Suítes',v:'1'},{l:'Vagas',v:'2'}],
    feats:['Sala e cozinha integradas','Varanda gourmet com churrasqueira a gás','Área de serviço','Banheiro social'] },
  { n:'Tipo 03', area:'85,52 m²', kicker:'3 dormitórios · 1 suíte',
    specs:[{l:'Dormitórios',v:'3'},{l:'Suítes',v:'1'},{l:'Vagas',v:'2'}],
    feats:['Sala e cozinha integradas','Varanda gourmet com churrasqueira a gás','Área de serviço','Banheiro social'] },
  { n:'Tipo 04', area:'69,79 m²', kicker:'2 dormitórios · 1 suíte',
    specs:[{l:'Dormitórios',v:'2'},{l:'Suítes',v:'1'},{l:'Vagas',v:'2'}],
    feats:['Opção inicial do empreendimento','Sala e cozinha integradas','Varanda gourmet com churrasqueira a gás','Área de serviço e banheiro social'] },
  { n:'Tipo 05', area:'85,56 m²', kicker:'3 dormitórios · 1 suíte',
    specs:[{l:'Dormitórios',v:'3'},{l:'Suítes',v:'1'},{l:'Vagas',v:'2'}],
    feats:['Sala e cozinha integradas','Varanda gourmet com churrasqueira a gás','Área de serviço','Banheiro social'] },
  { n:'Tipo 06', area:'113,95 m²', kicker:'3 suítes · maior tipologia',
    specs:[{l:'Suítes',v:'3'},{l:'Lavabo',v:'1'},{l:'Vagas',v:'2'}],
    feats:['Três suítes','Lavabo','Área técnica','Varanda gourmet com churrasqueira a gás','Sala e cozinha integradas'] }
];

const infoEl = document.querySelector('.js-info');
const plantaEl = document.querySelector('.js-planta');
const plantaCapEl = document.querySelector('.js-planta-cap');
const plantaZoomEl = document.querySelector('.js-planta-zoom');
let currentTipo = 0;

const plantaImgs = (function(){
  var els = document.querySelectorAll('#planta-src img');
  if (els && els.length === 6) return Array.prototype.map.call(els, function(i){ return i.src; });
  return ['sr/planta-t1.jpg','sr/planta-t2.jpg','sr/planta-t3.jpg','sr/planta-t4.jpg','sr/planta-t5.jpg','sr/planta-t6.jpg'];
})();
const plantaAlts = TIPOS.map(function(t){ return 'Planta do apartamento ' + t.n.toLowerCase() + ' de ' + t.area + ' — ' + t.kicker; });
const plantaCaps = TIPOS.map(function(t){ return 'Planta ilustrativa · ' + t.n + ' · ' + t.area; });

function renderTipo(i){
  var t = TIPOS[i];
  infoEl.innerHTML =
    '<div class="kicker">' + t.kicker + '</div>' +
    '<h3>' + t.area + '</h3>' +
    '<div class="sub">' + t.n + ' · duas vagas de garagem</div>' +
    '<div class="spec">' + t.specs.map(function(s){ return '<div><div class="sl">'+s.l+'</div><div class="sv">'+s.v+'</div></div>'; }).join('') + '</div>' +
    '<ul class="feats">' + t.feats.map(function(f){ return '<li>'+f+'</li>'; }).join('') + '</ul>' +
    '<a class="btn btn-primary js-tipo-cta" href="#" style="align-self:flex-start">Quero saber mais</a>';
  var cta = infoEl.querySelector('.js-tipo-cta');
  if (cta){
    cta.setAttribute('href', wppLink('Olá! Quero saber mais sobre o ' + t.n + ' de ' + t.area + ' do ' + CONFIG.empreendimento + '.'));
    cta.setAttribute('target', '_blank'); cta.setAttribute('rel', 'noopener');
  }
  if (plantaEl){
    plantaEl.style.opacity = '0';
    var src = plantaImgs[i], pre = new Image();
    pre.onload = function(){ plantaEl.src = src; plantaEl.alt = plantaAlts[i]; plantaEl.style.opacity = '1'; };
    pre.src = src;
  }
  if (plantaCapEl) plantaCapEl.textContent = plantaCaps[i];
  currentTipo = i;
}
document.querySelectorAll('.js-tabs .tab').forEach(function(tab){
  tab.addEventListener('click', function(){
    document.querySelectorAll('.js-tabs .tab').forEach(function(t){ t.classList.remove('active'); });
    tab.classList.add('active');
    renderTipo(parseInt(tab.dataset.t, 10));
  });
});
renderTipo(0);

/* ============================================================
   LIGHTBOX com navegação
   ============================================================ */
const lb = document.getElementById('lb');
const lbImg = document.getElementById('lb-img');
const lbCap = document.getElementById('lb-cap');
const lbCount = document.getElementById('lb-count');
const lbPrev = document.getElementById('lb-prev');
const lbNext = document.getElementById('lb-next');
let lbItems = [], lbIndex = 0;

function renderLb(){
  var it = lbItems[lbIndex]; if (!it) return;
  lbImg.src = it.src;
  lbImg.alt = it.alt || ('Imagem ampliada do ' + CONFIG.empreendimento);
  lbCap.textContent = it.cap || '';
  var multi = lbItems.length > 1;
  lbPrev.hidden = !multi; lbNext.hidden = !multi;
  lbCount.textContent = multi ? (lbIndex + 1) + ' / ' + lbItems.length : '';
}
function openGroup(items, idx){
  lbItems = items; lbIndex = idx || 0; renderLb();
  lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function openOne(src, alt, cap){ openGroup([{ src: src, alt: alt, cap: cap }], 0); }
function closeLb(){
  lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function step(d){ if (lbItems.length < 2) return; lbIndex = (lbIndex + d + lbItems.length) % lbItems.length; renderLb(); }

document.getElementById('lb-close').addEventListener('click', closeLb);
lbPrev.addEventListener('click', function(e){ e.stopPropagation(); step(-1); });
lbNext.addEventListener('click', function(e){ e.stopPropagation(); step(1); });
lb.addEventListener('click', function(e){ if (e.target === lb || e.target.classList.contains('lb-inner')) closeLb(); });
document.addEventListener('keydown', function(e){
  if (mm.classList.contains('open') && e.key === 'Escape'){ setMenu(false); return; }
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLb();
  else if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'ArrowLeft') step(-1);
});

/* planta ampliada */
if (plantaZoomEl){
  plantaZoomEl.addEventListener('click', function(){
    openOne(plantaImgs[currentTipo], plantaAlts[currentTipo], plantaCaps[currentTipo]);
  });
}

/* galerias navegáveis */
function capOf(fig){
  if (!fig) return '';
  var t = fig.querySelector('.cap .t'), s = fig.querySelector('.cap .s');
  var tt = t ? t.textContent.trim() : '', ss = s ? s.textContent.trim() : '';
  return tt + (ss ? ' · ' + ss : '');
}
function buildGroup(sel){
  return Array.prototype.map.call(document.querySelectorAll(sel), function(box){
    var img = box.querySelector('img');
    return { src: (img.currentSrc || img.src), alt: img.alt, cap: capOf(box) || img.alt };
  });
}
['.gal .gi', '.apt-grid .ai'].forEach(function(sel){
  document.querySelectorAll(sel).forEach(function(box, i){
    box.addEventListener('click', function(){ openGroup(buildGroup(sel), i); });
  });
});
document.querySelectorAll('.js-zoom').forEach(function(box){
  box.addEventListener('click', function(){
    var img = box.querySelector('img');
    openOne(img.currentSrc || img.src, img.alt, box.dataset.cap || img.alt);
  });
});
document.querySelectorAll('.about-img img').forEach(function(img){
  img.addEventListener('click', function(){
    openOne(img.currentSrc || img.src, img.alt, 'Perspectiva ilustrada da fachada — ' + CONFIG.empreendimento);
  });
});
