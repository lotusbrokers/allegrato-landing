/* ============================================================
   GRAN VILLE SANTO ANGELO — interações
   ============================================================ */
(function(){
  "use strict";
  var WA = "5511926143393";
  var reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector(".header");
  var fab = document.querySelector(".fab");
  function onScroll(){
    var y = window.scrollY;
    if(header) header.classList.toggle("scrolled", y > 60);
    if(fab) fab.classList.toggle("show", y > 700);
  }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector(".burger");
  if(burger){
    burger.addEventListener("click", function(){
      document.body.classList.toggle("menu-open");
    });
    document.querySelectorAll(".mobile-menu a").forEach(function(a){
      a.addEventListener("click", function(){ document.body.classList.remove("menu-open"); });
    });
  }

  /* ---------- Reveal on scroll (robusto + failsafe) ---------- */
  var revealEls = document.querySelectorAll(".reveal,.reveal-img");
  function reveal(el){ el.classList.add("in"); }
  if("IntersectionObserver" in window && !reduce){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ reveal(e.target); io.unobserve(e.target); }
      });
    },{threshold:0.01, rootMargin:"0px 0px -6% 0px"});
    revealEls.forEach(function(el){
      // elementos já visíveis no load aparecem imediatamente
      var r = el.getBoundingClientRect();
      if(r.top < window.innerHeight*0.95 && r.bottom > 0){ reveal(el); }
      else io.observe(el);
    });
    // fallback robusto: revela no scroll qualquer elemento que entre na viewport
    var scrollReveal = function(){
      var pending = false;
      revealEls.forEach(function(el){
        if(el.classList.contains("in")) return;
        var r = el.getBoundingClientRect();
        if(r.top < window.innerHeight*0.98 && r.bottom > 0){ reveal(el); }
        else pending = true;
      });
      if(!pending){ window.removeEventListener("scroll", onScrollReveal); }
    };
    var srTick=false;
    var onScrollReveal = function(){ if(!srTick){ requestAnimationFrame(function(){ scrollReveal(); srTick=false; }); srTick=true; } };
    window.addEventListener("scroll", onScrollReveal, {passive:true});
    window.addEventListener("load", scrollReveal);
    setTimeout(scrollReveal, 400);
  } else {
    revealEls.forEach(reveal);
  }

  /* ---------- Number counters ---------- */
  function animateCount(el){
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec")||"0",10);
    var dur = 1700, t0 = null;
    function fmt(v){
      var s = v.toFixed(dec);
      var parts = s.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,".");
      return parts.join(",");
    }
    function step(ts){
      if(!t0) t0 = ts;
      var p = Math.min((ts-t0)/dur,1);
      var e = 1 - Math.pow(1-p,3);
      el.textContent = fmt(target*e);
      if(p<1) requestAnimationFrame(step);
      else el.textContent = fmt(target);
    }
    if(reduce){ el.textContent = fmt(target); return; }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if("IntersectionObserver" in window){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ animateCount(e.target); cio.unobserve(e.target);} });
    },{threshold:0.5});
    counters.forEach(function(c){ cio.observe(c); });
  } else { counters.forEach(animateCount); }

  /* ---------- Gallery filter ---------- */
  var filterBtns = document.querySelectorAll(".filterbar button");
  var gcards = document.querySelectorAll(".gallery .gcard");
  function applyFilter(cat){
    gcards.forEach(function(card){
      var match = cat==="all" || card.getAttribute("data-cat")===cat;
      card.classList.toggle("hide", !match);
    });
  }
  filterBtns.forEach(function(b){
    b.addEventListener("click", function(){
      filterBtns.forEach(function(x){ x.classList.remove("active"); });
      b.classList.add("active");
      applyFilter(b.getAttribute("data-filter"));
    });
  });
  // stagger-in gallery cards
  if("IntersectionObserver" in window && !reduce){
    var gio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          var idx = Array.prototype.indexOf.call(gcards, e.target);
          e.target.style.transitionDelay = ((idx%6)*0.07)+"s";
          e.target.classList.add("in");
          gio.unobserve(e.target);
        }
      });
    },{threshold:0.1});
    gcards.forEach(function(c){ gio.observe(c); });
  } else { gcards.forEach(function(c){ c.classList.add("in"); }); }

  /* ---------- Lightbox ---------- */
  var lb = document.querySelector(".lightbox");
  if(lb){
    var lbImg = lb.querySelector("img");
    var lbCapT = lb.querySelector(".cap-t");
    var lbCapS = lb.querySelector(".cap-s");
    var items = [];
    var current = 0;
    document.querySelectorAll("[data-lb]").forEach(function(el){
      items.push({src:el.getAttribute("data-lb"), t:el.getAttribute("data-lb-t")||"", s:el.getAttribute("data-lb-s")||""});
      var i = items.length-1;
      el.addEventListener("click", function(){ openLB(i); });
    });
    function show(i){
      current = (i+items.length)%items.length;
      var it = items[current];
      lbImg.src = it.src;
      if(lbCapT) lbCapT.textContent = it.t;
      if(lbCapS) lbCapS.textContent = it.s;
    }
    function openLB(i){ show(i); lb.classList.add("open"); document.body.style.overflow="hidden"; }
    function closeLB(){ lb.classList.remove("open"); document.body.style.overflow=""; }
    lb.querySelector(".lb-close").addEventListener("click", closeLB);
    lb.querySelector(".lb-nav.prev").addEventListener("click", function(){ show(current-1); });
    lb.querySelector(".lb-nav.next").addEventListener("click", function(){ show(current+1); });
    lb.addEventListener("click", function(e){ if(e.target===lb) closeLB(); });
    document.addEventListener("keydown", function(e){
      if(!lb.classList.contains("open")) return;
      if(e.key==="Escape") closeLB();
      if(e.key==="ArrowLeft") show(current-1);
      if(e.key==="ArrowRight") show(current+1);
    });
  }

  /* ---------- Accordion ---------- */
  document.querySelectorAll(".acc__q").forEach(function(q){
    q.addEventListener("click", function(){
      var item = q.closest(".acc__item");
      var ans = item.querySelector(".acc__a");
      var open = item.classList.contains("open");
      // close siblings in same acc
      var acc = item.closest(".acc");
      if(acc){
        acc.querySelectorAll(".acc__item.open").forEach(function(o){
          if(o!==item){ o.classList.remove("open"); o.querySelector(".acc__a").style.maxHeight=null; }
        });
      }
      if(open){ item.classList.remove("open"); ans.style.maxHeight=null; }
      else { item.classList.add("open"); ans.style.maxHeight = ans.scrollHeight + "px"; }
    });
  });

  /* ---------- Form ---------- */
  var form = document.querySelector(".lead-form");
  if(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var nome = form.querySelector('[name="nome"]').value.trim();
      var tel = form.querySelector('[name="telefone"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim();
      if(!nome || !tel){ return; }
      // Build WhatsApp deep-link with the lead info (no backend; routes to corretor)
      var msg = "Olá! Tenho interesse no Gran Ville Santo Angelo.%0A%0ANome: "+encodeURIComponent(nome)+
                "%0AWhatsApp: "+encodeURIComponent(tel)+
                (email?("%0AE-mail: "+encodeURIComponent(email)):"");
      var url = "https://wa.me/"+WA+"?text="+msg;
      var ok = form.parentNode.querySelector(".form__ok");
      var fields = form.querySelectorAll(".field, .btn, .form__legal, h3, p.sub");
      form.style.display="none";
      if(ok){ ok.classList.add("show"); var link = ok.querySelector(".ok-wa"); if(link) link.href=url; }
      // open whatsapp in new tab
      window.open(url, "_blank");
    });
  }

  /* ---------- Magnetic buttons (subtle) ---------- */
  if(!reduce && window.matchMedia("(pointer:fine)").matches){
    document.querySelectorAll(".btn").forEach(function(btn){
      btn.addEventListener("mousemove", function(e){
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width/2;
        var my = e.clientY - r.top - r.height/2;
        btn.style.transform = "translate("+(mx*0.12)+"px,"+(my*0.18-2)+"px)";
      });
      btn.addEventListener("mouseleave", function(){ btn.style.transform=""; });
    });
  }

  /* ---------- Parallax (light) ---------- */
  if(!reduce){
    var plxEls = document.querySelectorAll("[data-plx]");
    var ticking = false;
    function plx(){
      plxEls.forEach(function(el){
        var speed = parseFloat(el.getAttribute("data-plx"))||0.15;
        var r = el.getBoundingClientRect();
        var center = r.top + r.height/2 - window.innerHeight/2;
        el.style.transform = "translateY("+(center*-speed)+"px)";
      });
      ticking=false;
    }
    window.addEventListener("scroll", function(){
      if(!ticking){ requestAnimationFrame(plx); ticking=true; }
    },{passive:true});
    plx();
  }

  /* ---------- Carrossel (esporte) ---------- */
  document.querySelectorAll("[data-carousel]").forEach(function(root){
    var track = root.querySelector(".carousel__track");
    var slides = Array.prototype.slice.call(track.children);
    var prev = root.querySelector(".carousel__btn.prev");
    var next = root.querySelector(".carousel__btn.next");
    var dotsWrap = root.querySelector(".carousel__dots");
    var index = 0;
    function perView(){ return window.innerWidth >= 1040 ? 3 : (window.innerWidth >= 640 ? 2 : 1); }
    function maxIndex(){ return Math.max(0, slides.length - perView()); }
    function build(){
      if(!dotsWrap) return;
      dotsWrap.innerHTML = "";
      for(var i=0;i<=maxIndex();i++){
        var d = document.createElement("button");
        d.className = "carousel__dot" + (i===index?" active":"");
        d.setAttribute("aria-label","Ir para o slide "+(i+1));
        (function(n){ d.addEventListener("click", function(){ go(n); }); })(i);
        dotsWrap.appendChild(d);
      }
    }
    function go(i){
      index = Math.max(0, Math.min(i, maxIndex()));
      var slideW = slides[0].getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0) || 20;
      track.style.transform = "translateX(" + (-(slideW + gap) * index) + "px)";
      if(dotsWrap){
        Array.prototype.forEach.call(dotsWrap.children, function(d,n){ d.classList.toggle("active", n===index); });
      }
      if(prev) prev.disabled = index===0;
      if(next) next.disabled = index===maxIndex();
    }
    if(prev) prev.addEventListener("click", function(){ go(index-1); });
    if(next) next.addEventListener("click", function(){ go(index+1); });
    var rt;
    window.addEventListener("resize", function(){ clearTimeout(rt); rt=setTimeout(function(){ build(); go(Math.min(index,maxIndex())); }, 150); });
    // swipe
    var sx=0, dragging=false;
    track.addEventListener("touchstart", function(e){ sx=e.touches[0].clientX; dragging=true; }, {passive:true});
    track.addEventListener("touchend", function(e){
      if(!dragging) return; dragging=false;
      var dx = e.changedTouches[0].clientX - sx;
      if(Math.abs(dx)>40){ go(index + (dx<0?1:-1)); }
    });
    build(); go(0);
  });

  /* ---------- Active nav highlight ---------- */
  var navLinks = document.querySelectorAll(".nav a[href^='#']");
  var sections = [];
  navLinks.forEach(function(l){
    var id = l.getAttribute("href").slice(1);
    var sec = document.getElementById(id);
    if(sec) sections.push({link:l, sec:sec});
  });
  if("IntersectionObserver" in window && sections.length){
    var nio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          navLinks.forEach(function(l){ l.style.opacity="0.92"; });
          var match = sections.find(function(s){ return s.sec===e.target; });
          if(match) match.link.style.opacity="1";
        }
      });
    },{rootMargin:"-45% 0px -50% 0px"});
    sections.forEach(function(s){ nio.observe(s.sec); });
  }

})();
