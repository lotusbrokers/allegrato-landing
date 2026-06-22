/* TERRACE SERRA DO JAPI — interactions & motion */
(function(){
  'use strict';

  /* ---- nav condense ---- */
  var nav = document.querySelector('.nav');
  var waFloat = document.querySelector('.wa-float');
  function onScroll(){
    var y = window.scrollY || window.pageYOffset;
    if(nav) nav.classList.toggle('scrolled', y > 60);
    if(waFloat) waFloat.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- scroll reveal ---- */
  var revEls = document.querySelectorAll('.reveal, .img-reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, {threshold:0.12, rootMargin:'0px 0px -8% 0px'});
    revEls.forEach(function(el){ io.observe(el); });
    /* failsafe: reveal anything still hidden (e.g. inside fixed-height iframe embeds) */
    setTimeout(function(){ document.querySelectorAll('.reveal:not(.in), .img-reveal:not(.in)').forEach(function(el){ el.classList.add('in'); }); }, 900);
  } else {
    revEls.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---- hero parallax ---- */
  var heroImg = document.querySelector('.hero__media img');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(heroImg && !reduce){
    var ticking = false;
    window.addEventListener('scroll', function(){
      if(!ticking){
        window.requestAnimationFrame(function(){
          var y = window.scrollY || 0;
          if(y < window.innerHeight){
            heroImg.style.transform = 'translate3d(0,'+(y*0.32)+'px,0) scale(1.04)';
          }
          ticking = false;
        });
        ticking = true;
      }
    }, {passive:true});
  }

  /* ---- subtle parallax on [data-parallax] images ---- */
  if(!reduce){
    var pxEls = [].slice.call(document.querySelectorAll('[data-parallax]'));
    if(pxEls.length){
      var pTick = false;
      function px(){
        var vh = window.innerHeight;
        pxEls.forEach(function(el){
          var r = el.getBoundingClientRect();
          if(r.bottom < 0 || r.top > vh) return;
          var prog = (r.top + r.height/2 - vh/2) / vh; // -1..1
          var amt = parseFloat(el.getAttribute('data-parallax')) || 6;
          el.style.transform = 'translate3d(0,'+(prog*amt*-1)+'%,0) scale(1.08)';
        });
        pTick = false;
      }
      window.addEventListener('scroll', function(){
        if(!pTick){ window.requestAnimationFrame(px); pTick = true; }
      }, {passive:true});
      px();
    }
  }

  /* ---- counters ---- */
  function animateCount(el){
    var target = parseFloat(el.getAttribute('data-count'));
    var dec = (el.getAttribute('data-dec')|0);
    var dur = 1600, start = null;
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts-start)/dur, 1);
      var eased = 1 - Math.pow(1-p, 3);
      var val = target * eased;
      el.textContent = dec ? val.toFixed(dec) : Math.round(val).toLocaleString('pt-BR');
      if(p < 1) requestAnimationFrame(step);
      else el.textContent = dec ? target.toFixed(dec) : target.toLocaleString('pt-BR');
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  if('IntersectionObserver' in window){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ animateCount(e.target); cio.unobserve(e.target); }
      });
    }, {threshold:0.6});
    counters.forEach(function(el){ cio.observe(el); });
  } else {
    counters.forEach(function(el){ el.textContent = el.getAttribute('data-count'); });
  }

  /* ---- generic tab groups (lazer + plantas) ---- */
  function wireTabs(scope){
    var groups = document.querySelectorAll(scope);
    groups.forEach(function(group){
      var tabs = group.querySelectorAll('[data-tab]');
      var panelHost = document.querySelector(group.getAttribute('data-panels'));
      tabs.forEach(function(tab){
        tab.addEventListener('click', function(){
          var id = tab.getAttribute('data-tab');
          tabs.forEach(function(t){ t.classList.toggle('active', t===tab); });
          if(panelHost){
            panelHost.querySelectorAll('[data-panel]').forEach(function(p){
              p.classList.toggle('active', p.getAttribute('data-panel')===id);
            });
          }
        });
      });
    });
  }
  wireTabs('[data-tabs]');

  /* ---- mobile drawer ---- */
  var burger = document.querySelector('.nav__burger');
  var drawer = document.querySelector('.drawer');
  if(burger && drawer){
    burger.addEventListener('click', function(){ drawer.classList.add('open'); });
    drawer.querySelector('.drawer__close').addEventListener('click', function(){ drawer.classList.remove('open'); });
    drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ drawer.classList.remove('open'); }); });
  }

  /* ---- form -> whatsapp ---- */
  var form = document.querySelector('#lead-form');
  if(form){
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var nome = (form.nome.value||'').trim();
      var tel = (form.telefone.value||'').trim();
      var email = (form.email.value||'').trim();
      var msg = 'Ola! Tenho interesse no Terrace Serra do Japi (Jundiai).%0A%0A'
        + 'Nome: ' + encodeURIComponent(nome)
        + '%0ATelefone: ' + encodeURIComponent(tel)
        + '%0AE-mail: ' + encodeURIComponent(email)
        + '%0A%0AGostaria de receber valores e condicoes.';
      var url = 'https://wa.me/5511926143393?text=' + msg;
      var ok = document.querySelector('.form-ok');
      var inner = document.querySelector('#lead-form');
      if(ok && inner){ inner.style.display='none'; ok.classList.add('show'); }
      window.open(url, '_blank');
    });
  }

  /* ---- lightbox gallery ---- */
  (function(){
    var galleries = [].slice.call(document.querySelectorAll('[data-gallery]'));
    if(!galleries.length) return;
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML =
      '<div class="lightbox__count"></div>'+
      '<button class="lightbox__close" aria-label="Fechar">&times;</button>'+
      '<button class="lightbox__nav prev" aria-label="Anterior"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>'+
      '<button class="lightbox__nav next" aria-label="Próxima"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>'+
      '<div class="lightbox__stage"><img class="lightbox__img" alt=""><div class="lightbox__cap"><div class="nm"></div><div class="ct"></div></div></div>';
    document.body.appendChild(lb);
    var imgEl = lb.querySelector('.lightbox__img');
    var nmEl = lb.querySelector('.lightbox__cap .nm');
    var ctEl = lb.querySelector('.lightbox__cap .ct');
    var countEl = lb.querySelector('.lightbox__count');
    var prevBtn = lb.querySelector('.lightbox__nav.prev');
    var nextBtn = lb.querySelector('.lightbox__nav.next');
    var current = [], idx = 0;

    function show(i){
      idx = (i + current.length) % current.length;
      var it = current[idx];
      imgEl.classList.remove('ready');
      var pre = new Image();
      pre.onload = function(){ imgEl.src = it.full; imgEl.alt = it.name; requestAnimationFrame(function(){ imgEl.classList.add('ready'); }); };
      pre.src = it.full;
      if(pre.complete){ imgEl.src = it.full; imgEl.classList.add('ready'); }
      nmEl.textContent = it.name;
      ctEl.textContent = it.cat;
      countEl.textContent = (idx+1)+' / '+current.length;
      var multi = current.length > 1;
      prevBtn.style.display = multi ? '' : 'none';
      nextBtn.style.display = multi ? '' : 'none';
      countEl.style.display = multi ? '' : 'none';
    }
    function open(group, i){ current = group; lb.classList.add('open'); document.body.style.overflow='hidden'; show(i); }
    function close(){ lb.classList.remove('open'); document.body.style.overflow=''; }

    galleries.forEach(function(g){
      var items = [].slice.call(g.querySelectorAll('[data-lb]')).map(function(el){
        return { el:el, full: el.getAttribute('data-full'), name: el.getAttribute('data-name')||'', cat: el.getAttribute('data-cat')||'' };
      });
      items.forEach(function(it, i){ it.el.addEventListener('click', function(){ open(items, i); }); });
    });
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    prevBtn.addEventListener('click', function(){ show(idx-1); });
    nextBtn.addEventListener('click', function(){ show(idx+1); });
    lb.addEventListener('click', function(e){ if(e.target===lb || e.target.classList.contains('lightbox__stage')) close(); });
    document.addEventListener('keydown', function(e){
      if(!lb.classList.contains('open')) return;
      if(e.key==='Escape') close();
      else if(e.key==='ArrowLeft') show(idx-1);
      else if(e.key==='ArrowRight') show(idx+1);
    });
    var sx=0;
    lb.addEventListener('touchstart', function(e){ sx=e.touches[0].clientX; }, {passive:true});
    lb.addEventListener('touchend', function(e){ var dx=e.changedTouches[0].clientX - sx; if(Math.abs(dx)>50) show(dx>0?idx-1:idx+1); }, {passive:true});
  })();

  /* ---- interiors carousel (roleta) ---- */
  [].slice.call(document.querySelectorAll('[data-roleta]')).forEach(function(r){
    var track = r.querySelector('.roleta__track');
    var prev = r.querySelector('.roleta__btn.prev');
    var next = r.querySelector('.roleta__btn.next');
    function step(){ var s = track.querySelector('.roleta__slide'); return s ? s.offsetWidth + 22 : track.clientWidth*0.8; }
    function upd(){
      if(prev) prev.disabled = track.scrollLeft <= 4;
      if(next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    }
    if(prev) prev.addEventListener('click', function(){ track.scrollBy({left:-step(), behavior:'smooth'}); });
    if(next) next.addEventListener('click', function(){ track.scrollBy({left:step(), behavior:'smooth'}); });
    track.addEventListener('scroll', upd, {passive:true});
    window.addEventListener('resize', upd);
    upd();
  });

  /* ---- year ---- */
  var yr = document.querySelector('#year');
  if(yr) yr.textContent = new Date().getFullYear();

})();
