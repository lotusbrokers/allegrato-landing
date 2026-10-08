/* ============================================================
   EDIFÍCIO TREND — interações · Lotus Brokers
   ============================================================ */

/* ============================================================
   >>> CONFIGURAÇÃO CENTRAL — edite apenas este bloco <<<
   ============================================================ */
const CONFIG = {
  // WhatsApp da LIA (atendimento Lotus Brokers). 55 + DDD + número.
  WPP: '5511926143393',

  empreendimento: 'Edifício Trend',
  imobiliaria: 'Lotus Brokers',

  // Integração futura (CRM / API / Webhook). Vazio = só fluxo de WhatsApp.
  ENDPOINT: '',
  METHOD: 'POST',

  // Link da política de privacidade, quando houver.
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

/* ---------- Privacidade ---------- */
document.querySelectorAll('.js-priv').forEach(function(el){
  if (CONFIG.PRIVACIDADE){ el.href = CONFIG.PRIVACIDADE; el.target = '_blank'; el.rel = 'noopener'; }
  else el.addEventListener('click', function(e){ e.preventDefault(); });
});

/* ---------- Header ---------- */
const hd = document.getElementById('hd');
function onScroll(){ hd.classList.toggle('on', window.scrollY > 40); }
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Menu mobile ---------- */
const mob = document.getElementById('mob');
function setMenu(open){
  mob.classList.toggle('open', open);
  mob.setAttribute('aria-hidden', open ? 'false' : 'true');
  document.body.style.overflow = open ? 'hidden' : '';
  var b = document.querySelector('.js-mo');
  if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
}
document.querySelectorAll('.js-mo').forEach(function(b){ b.addEventListener('click', function(){ setMenu(true); }); });
document.querySelectorAll('.js-mc').forEach(function(b){ b.addEventListener('click', function(){ setMenu(false); }); });
mob.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ setMenu(false); }); });

/* ---------- Hero ---------- */
requestAnimationFrame(function(){ var h = document.getElementById('hero'); if (h) h.classList.add('go'); });

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

/* ---------- Formulários ---------- */
function boxOf(el){ return el.closest('.fld') || el.closest('.cons'); }
function validate(form){
  var ok = true;
  form.querySelectorAll('[required]').forEach(function(el){
    var good;
    if (el.type === 'checkbox') good = el.checked;
    else if (el.type === 'email') good = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
    else if (el.name === 'tel') good = el.value.replace(/\D/g,'').length >= 10;
    else good = el.value.trim().length > 1;
    var b = boxOf(el);
    if (b) b.classList.toggle('bad', !good);
    el.classList.toggle('e', !good);
    if (!good && ok){ ok = false; try { el.focus(); } catch(e){} }
  });
  return ok;
}
function leadMsg(d){
  var m = 'Olá! Tenho interesse no ' + CONFIG.empreendimento + '.';
  if (d.nome) m += ' Meu nome é ' + d.nome + '.';
  if (d.tipo) m += ' Interesse: ' + d.tipo + '.';
  if (d.tel) m += ' Telefone: ' + d.tel + '.';
  if (d.email) m += ' E-mail: ' + d.email + '.';
  if (d.msg) m += ' ' + d.msg;
  m += ' Podem me enviar a tabela e as condições?';
  return m;
}
document.querySelectorAll('.js-lead').forEach(function(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (!validate(form)) return;
    var fd = new FormData(form);
    var data = {
      nome:(fd.get('nome')||'').toString().trim(),
      email:(fd.get('email')||'').toString().trim(),
      tel:(fd.get('tel')||'').toString().trim(),
      tipo:(fd.get('tipo')||'').toString().trim(),
      msg:(fd.get('msg')||'').toString().trim(),
      consent:!!fd.get('consent'),
      empreendimento:CONFIG.empreendimento,
      imobiliaria:CONFIG.imobiliaria,
      origem:location.href,
      enviadoEm:new Date().toISOString()
    };
    if (CONFIG.ENDPOINT){
      try {
        fetch(CONFIG.ENDPOINT, { method:CONFIG.METHOD, headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }).catch(function(){});
      } catch(err){}
    }
    try { if (window.dataLayer) window.dataLayer.push({ event:'lead_trend', lead:data }); } catch(err){}
    try { if (window.fbq) window.fbq('track','Lead'); } catch(err){}

    var card = form.closest('.lead') || form.closest('.fform');
    var ok = card ? card.querySelector('.js-ok') : null;
    var wpp = ok ? ok.querySelector('.js-wpp') : null;
    if (wpp) wpp.setAttribute('href', wppLink(leadMsg(data)));
    form.style.display = 'none';
    if (ok) ok.classList.add('show');
    var or = card ? card.querySelector('.or') : null;
    if (or) or.style.display = 'none';
  });
  form.querySelectorAll('[required]').forEach(function(el){
    function clear(){ var b = boxOf(el); if (b) b.classList.remove('bad'); el.classList.remove('e'); }
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
  });
});

/* ---------- Reveal ---------- */
const rvEls = Array.prototype.slice.call(document.querySelectorAll('[data-rv]'));
function checkRv(instant){
  var vh = window.innerHeight || document.documentElement.clientHeight;
  for (var i = rvEls.length - 1; i >= 0; i--){
    var el = rvEls[i], r = el.getBoundingClientRect();
    if (r.top < vh * 0.92 && r.bottom > -40){
      if (instant){
        el.style.transition = 'none'; el.classList.add('in');
        (function(x){ requestAnimationFrame(function(){ x.style.transition = ''; }); })(el);
      } else el.classList.add('in');
      rvEls.splice(i, 1);
    }
  }
}
window.addEventListener('scroll', function(){ checkRv(false); }, { passive: true });
window.addEventListener('resize', function(){ checkRv(false); }, { passive: true });
checkRv(true);
requestAnimationFrame(function(){ checkRv(true); });
window.addEventListener('load', function(){ checkRv(false); });

/* ============================================================
   TIPOLOGIAS — dados da ficha técnica do book
   ============================================================ */
const TIPOS = [
  { n:'Studio', area:'26,40 m²', k:'Tipo C · studio',
    sb:'Sugestão de planta — ambiente único integrado',
    specs:[{l:'Área',v:'26,40'},{l:'Ambiente',v:'Único'},{l:'Vaga',v:'—'}],
    fts:['Ambiente único integrado','Cozinha e área de serviço compactas','Banheiro completo','Os studios de 26,40 m² não possuem vaga'],
    img:'planta-26', alt:'Planta do studio de 26,40 m² do Edifício Trend — sugestão de planta',
    cap:'Planta ilustrativa · Studio 26,40 m² · sugestão de planta' },

  { n:'Unidade comercial', area:'26,40 m²', k:'Tipo C · uso comercial',
    sb:'Mesma metragem, layout voltado ao uso comercial',
    specs:[{l:'Área',v:'26,40'},{l:'Unidades',v:'01'},{l:'Pavimento',v:'Térreo'}],
    fts:['Sugestão de layout para escritório','Copa e banheiro','Uma unidade comercial no empreendimento','Vitrine para a Avenida Doutor Cavalcanti'],
    img:'planta-26c', alt:'Planta da unidade de 26,40 m² do Edifício Trend com layout comercial',
    cap:'Planta ilustrativa · 26,40 m² · sugestão de layout comercial' },

  { n:'Tipo B', area:'48,15 m²', k:'1 dormitório',
    sb:'Living integrado à cozinha e ao dormitório',
    specs:[{l:'Área',v:'48,15'},{l:'Dorm.',v:'1'},{l:'Vaga',v:'1'}],
    fts:['Dormitório com armário planejado','Living integrado à cozinha','Área de serviço independente','Banheiro social completo'],
    img:'planta-48', alt:'Planta do apartamento tipo B de 48,15 m² do Edifício Trend com 1 dormitório',
    cap:'Planta ilustrativa · Tipo B · 48,15 m²' },

  { n:'Tipo A / D', area:'57,75 e 57,90 m²', k:'1 dormitório ampliado',
    sb:'Duas variações de mesma faixa de metragem',
    specs:[{l:'Área',v:'57,75'},{l:'e',v:'57,90'},{l:'Vaga',v:'1'}],
    fts:['Living ampliado com sala de jantar','Cozinha com bancada e área de serviço','Dormitório com armário planejado','Duas variações: tipo A (57,75 m²) e tipo D (57,90 m²)'],
    img:'planta-57', alt:'Planta do apartamento de 57 m² do Edifício Trend',
    cap:'Planta ilustrativa · Tipo A / D · 57,75 e 57,90 m²' },

  { n:'Tipo E', area:'62,90 m²', k:'2 dormitórios',
    sb:'Dois dormitórios e home office',
    specs:[{l:'Área',v:'62,90'},{l:'Dorm.',v:'2'},{l:'Vaga',v:'1'}],
    fts:['Dois dormitórios com armários planejados','Espaço para home office','Living integrado à cozinha','Dois banheiros'],
    img:'planta-62', alt:'Planta do apartamento tipo E de 62,90 m² do Edifício Trend com 2 dormitórios',
    cap:'Planta ilustrativa · Tipo E · 62,90 m²' },

  { n:'Tipo G', area:'66,10 m²', k:'2 dormitórios',
    sb:'Metragem intermediária com dois dormitórios',
    specs:[{l:'Área',v:'66,10'},{l:'Dorm.',v:'2'},{l:'Vaga',v:'1'}],
    fts:['Dois dormitórios','Living e cozinha integrados','Área de serviço independente','Dois banheiros'],
    img:'planta-66', alt:'Planta do apartamento tipo G de 66,10 m² do Edifício Trend com 2 dormitórios',
    cap:'Planta ilustrativa · Tipo G · 66,10 m²' },

  { n:'Tipo F', area:'73,65 m²', k:'3 dormitórios · maior tipologia',
    sb:'A maior planta do empreendimento',
    specs:[{l:'Área',v:'73,65'},{l:'Dorm.',v:'3'},{l:'Vaga',v:'1'}],
    fts:['Três dormitórios','Living com sala de jantar e estar','Cozinha com bancada e área de serviço','Dois banheiros','Maior tipologia do Edifício Trend'],
    img:'planta-73', alt:'Planta do apartamento tipo F de 73,65 m² do Edifício Trend com 3 dormitórios',
    cap:'Planta ilustrativa · Tipo F · 73,65 m²' }
];

const infEl = document.querySelector('.js-inf');
const plEl = document.querySelector('.js-pl');
const pcapEl = document.querySelector('.js-pcap');
const pzEl = document.querySelector('.js-pz');
let cur = 0;

const plImgs = (function(){
  var els = document.querySelectorAll('#pl-src img');
  if (els && els.length === TIPOS.length) return Array.prototype.map.call(els, function(i){ return i.src; });
  return TIPOS.map(function(t){ return 'td/' + t.img + '.jpg'; });
})();

function renderTipo(i){
  var t = TIPOS[i];
  infEl.innerHTML =
    '<div class="k">' + t.k + '</div>' +
    '<h3>' + t.area + '</h3>' +
    '<div class="sb">' + t.n + ' · ' + t.sb + '</div>' +
    '<div class="sp">' + t.specs.map(function(s){ return '<div><div class="l">'+s.l+'</div><div class="v">'+s.v+'</div></div>'; }).join('') + '</div>' +
    '<ul class="fts">' + t.fts.map(function(f){ return '<li>'+f+'</li>'; }).join('') + '</ul>' +
    '<a class="btn btn-dark js-tcta" href="#" style="align-self:flex-start;width:auto">Quero saber mais</a>';
  var cta = infEl.querySelector('.js-tcta');
  if (cta){
    cta.setAttribute('href', wppLink('Olá! Quero saber mais sobre o ' + t.n + ' de ' + t.area + ' do ' + CONFIG.empreendimento + '.'));
    cta.setAttribute('target','_blank'); cta.setAttribute('rel','noopener');
  }
  if (plEl){
    plEl.style.opacity = '0';
    var src = plImgs[i], pre = new Image();
    pre.onload = function(){ plEl.src = src; plEl.alt = t.alt; plEl.style.opacity = '1'; };
    pre.src = src;
  }
  if (pcapEl) pcapEl.textContent = t.cap;
  cur = i;
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
const lbN = document.getElementById('lb-n');
const lbP = document.getElementById('lb-p');
const lbNx = document.getElementById('lb-nx');
let items = [], idx = 0;

function draw(){
  var it = items[idx]; if (!it) return;
  lbImg.src = it.src;
  lbImg.alt = it.alt || ('Imagem ampliada do ' + CONFIG.empreendimento);
  lbCap.textContent = it.cap || '';
  var multi = items.length > 1;
  lbP.hidden = !multi; lbNx.hidden = !multi;
  lbN.textContent = multi ? (idx + 1) + ' / ' + items.length : '';
}
function openGroup(list, i){
  items = list; idx = i || 0; draw();
  lb.classList.add('open'); lb.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
}
function openOne(src, alt, cap){ openGroup([{src:src, alt:alt, cap:cap}], 0); }
function closeLb(){
  lb.classList.remove('open'); lb.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}
function step(d){ if (items.length < 2) return; idx = (idx + d + items.length) % items.length; draw(); }

document.getElementById('lb-x').addEventListener('click', closeLb);
lbP.addEventListener('click', function(e){ e.stopPropagation(); step(-1); });
lbNx.addEventListener('click', function(e){ e.stopPropagation(); step(1); });
lb.addEventListener('click', function(e){ if (e.target === lb || e.target.classList.contains('lb-in')) closeLb(); });
document.addEventListener('keydown', function(e){
  if (mob.classList.contains('open') && e.key === 'Escape'){ setMenu(false); return; }
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLb();
  else if (e.key === 'ArrowRight') step(1);
  else if (e.key === 'ArrowLeft') step(-1);
});

/* planta ampliada — navega entre todas as tipologias */
if (pzEl){
  pzEl.addEventListener('click', function(){
    openGroup(TIPOS.map(function(t,i){ return { src:plImgs[i], alt:t.alt, cap:t.cap }; }), cur);
  });
}

/* galeria do rooftop */
function capOf(fig){
  if (!fig) return '';
  var t = fig.querySelector('.cap .t'), s = fig.querySelector('.cap .s');
  var a = t ? t.textContent.trim() : '', b = s ? s.textContent.trim() : '';
  return a + (b ? ' · ' + b : '');
}
(function(){
  var sel = '.gal .gi';
  var boxes = document.querySelectorAll(sel);
  boxes.forEach(function(box, i){
    box.addEventListener('click', function(){
      var group = Array.prototype.map.call(document.querySelectorAll(sel), function(b){
        var im = b.querySelector('img');
        return { src:(im.currentSrc || im.src), alt:im.alt, cap:capOf(b) || im.alt };
      });
      openGroup(group, i);
    });
  });
})();

/* imagens isoladas */
document.querySelectorAll('.js-zoom').forEach(function(box){
  box.addEventListener('click', function(){
    var im = box.querySelector('img');
    openOne(im.currentSrc || im.src, im.alt, box.dataset.cap || im.alt);
  });
});
document.querySelectorAll('.ab-i img').forEach(function(im){
  im.addEventListener('click', function(){
    openOne(im.currentSrc || im.src, im.alt, 'Perspectiva ilustrada da fachada — ' + CONFIG.empreendimento);
  });
});
