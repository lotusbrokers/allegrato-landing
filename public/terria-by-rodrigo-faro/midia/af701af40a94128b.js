/* TERRIÁ by Rodrigo Faro — Lotus Brokers */
const CONFIG = { WPP: '5511926143393', empreendimento: 'Terriá by Rodrigo Faro' }; // WhatsApp da LIA

function wpp(msg){ return 'https://wa.me/' + CONFIG.WPP + '?text=' + encodeURIComponent(msg || 'Olá! Quero saber mais sobre o ' + CONFIG.empreendimento + '.'); }
document.querySelectorAll('.js-wpp').forEach(function(a){ a.href = wpp(a.dataset.msg); a.target = '_blank'; a.rel = 'noopener'; });

document.querySelectorAll('.js-lead').forEach(function(f){
  f.addEventListener('submit', function(e){
    e.preventDefault();
    if (!f.checkValidity()){ f.reportValidity(); return; }
    var d = new FormData(f);
    var msg = 'Olá! Quero entrar na lista de prioridade do ' + CONFIG.empreendimento + '.' +
      ' Nome: ' + d.get('nome') + '. WhatsApp: ' + d.get('tel') + '. E-mail: ' + d.get('email') + '. Interesse: ' + d.get('interesse') + '.';
    window.open(wpp(msg), '_blank', 'noopener');
    var ok = f.querySelector('.ok'); if (ok) ok.style.display = 'block';
  });
});

var hd = document.getElementById('hd');
function onScroll(){ hd.classList.toggle('on', window.scrollY > 40); }
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

var rv = Array.prototype.slice.call(document.querySelectorAll('[data-rv]'));
function reveal(){
  var vh = window.innerHeight;
  for (var i = rv.length - 1; i >= 0; i--){ var r = rv[i].getBoundingClientRect(); if (r.top < vh * .92 && r.bottom > -40){ rv[i].classList.add('in'); rv.splice(i, 1); } }
}
window.addEventListener('scroll', reveal, { passive: true }); window.addEventListener('resize', reveal); reveal(); requestAnimationFrame(reveal);

var lb = document.getElementById('lb'), lbImg = document.getElementById('lb-img'), lbCap = document.getElementById('lb-cap');
var lbP = document.getElementById('lb-p'), lbN = document.getElementById('lb-n'), lbItems = [], lbI = 0;
function capOf(el){ var h = el.querySelector('h3'), f = el.querySelector('figcaption'); return h ? h.textContent : (f ? f.textContent : (el.getAttribute('aria-label') || '')); }
function showLb(){ var el = lbItems[lbI], im = el.querySelector('img'); lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt; lbCap.textContent = capOf(el) + (lbItems.length > 1 ? '  ·  ' + (lbI + 1) + ' / ' + lbItems.length : ''); lbP.hidden = lbN.hidden = lbItems.length < 2; }
function step(d){ if (lbItems.length < 2) return; lbI = (lbI + d + lbItems.length) % lbItems.length; showLb(); }
function closeLb(){ lb.classList.remove('open'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }
document.querySelectorAll('.js-zoom').forEach(function(el){
  el.addEventListener('click', function(){
    var g = el.dataset.group;
    lbItems = g ? Array.prototype.slice.call(document.querySelectorAll('.js-zoom[data-group="' + g + '"]')) : [el];
    lbI = lbItems.indexOf(el); showLb();
    lb.classList.add('open'); lb.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden';
  });
});
lbP.addEventListener('click', function(e){ e.stopPropagation(); step(-1); });
lbN.addEventListener('click', function(e){ e.stopPropagation(); step(1); });
document.getElementById('lb-x').addEventListener('click', closeLb);
lb.addEventListener('click', function(e){ if (e.target === lb || e.target.classList.contains('lb-in')) closeLb(); });
document.addEventListener('keydown', function(e){ if (!lb.classList.contains('open')) return; if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); });

/* seletor de plantas */
(function(){var tabs=document.querySelectorAll('.pl-tab'),pls=document.querySelectorAll('.plans .plan');
tabs.forEach(function(t){t.addEventListener('click',function(){var i=+t.dataset.pl;
tabs.forEach(function(x,j){x.classList.toggle('on',j===i);x.setAttribute('aria-selected',j===i?'true':'false');});
pls.forEach(function(p,j){p.classList.toggle('on',j===i);});});});})();
