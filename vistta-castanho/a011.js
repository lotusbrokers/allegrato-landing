/* ============================================================
   VISTTA CASTANHO · interactions
   ============================================================ */
(function(){
  "use strict";
  var WA_NUMBER = "5511926143393";

  function waLink(msg){
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
  }

  document.addEventListener("DOMContentLoaded", function(){

    /* ---- Header scroll state + float WA ---- */
    var header = document.querySelector(".header");
    var waFloat = document.querySelector(".wa-float");
    function onScroll(){
      var y = window.pageYOffset || document.documentElement.scrollTop;
      header.classList.toggle("scrolled", y > 40);
      waFloat.classList.toggle("show", y > 600);
    }
    window.addEventListener("scroll", onScroll, {passive:true});
    onScroll();

    /* ---- Mobile menu ---- */
    var burger = document.querySelector(".burger");
    var mobile = document.querySelector(".mobile-menu");
    function toggleMenu(force){
      var open = force !== undefined ? force : !mobile.classList.contains("open");
      mobile.classList.toggle("open", open);
      burger.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    }
    burger.addEventListener("click", function(){ toggleMenu(); });
    mobile.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){ toggleMenu(false); });
    });

    /* ---- Reveal + counters via scroll check (robust everywhere) ---- */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal,.reveal-x,.clip-up"));
    var countEls = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    var revTicking = false;
    function checkReveals(){
      var vh = window.innerHeight;
      for(var i=revealEls.length-1;i>=0;i--){
        var el = revealEls[i];
        var top = el.getBoundingClientRect().top;
        if(top < vh*0.9){
          el.classList.add("in");
          revealEls.splice(i,1);
        }
      }
      for(var j=countEls.length-1;j>=0;j--){
        var c = countEls[j];
        if(c.getBoundingClientRect().top < vh*0.85){
          animateCount(c);
          countEls.splice(j,1);
        }
      }
      revTicking = false;
    }
    function reqReveals(){ if(!revTicking){ revTicking=true; requestAnimationFrame(checkReveals); } }
    window.addEventListener("scroll", reqReveals, {passive:true});
    window.addEventListener("resize", reqReveals);
    checkReveals();
    setTimeout(checkReveals, 120);
    window.addEventListener("load", checkReveals);
    function animateCount(el){
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-dec")||"0",10);
      var dur = 1600, start = null;
      function step(ts){
        if(!start) start = ts;
        var p = Math.min((ts-start)/dur,1);
        var eased = 1-Math.pow(1-p,3);
        var val = target*eased;
        el.textContent = formatNum(val, dec);
        if(p<1) requestAnimationFrame(step);
        else el.textContent = formatNum(target, dec);
      }
      requestAnimationFrame(step);
    }
    function formatNum(v, dec){
      var s = v.toFixed(dec);
      var parts = s.split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return dec>0 ? parts.join(",") : parts[0];
    }

    /* ---- Parallax (hero + fullbleed) ---- */
    var parallaxEls = [];
    document.querySelectorAll("[data-parallax]").forEach(function(el){
      parallaxEls.push({el:el, speed:parseFloat(el.getAttribute("data-parallax"))});
    });
    var ticking = false;
    function parallaxUpdate(){
      var vh = window.innerHeight;
      parallaxEls.forEach(function(p){
        var rect = p.el.parentElement.getBoundingClientRect();
        var center = rect.top + rect.height/2;
        var off = (center - vh/2) * p.speed;
        p.el.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
      });
      ticking = false;
    }
    function reqParallax(){ if(!ticking){ ticking=true; requestAnimationFrame(parallaxUpdate); } }
    if(parallaxEls.length && !matchMedia("(prefers-reduced-motion:reduce)").matches){
      window.addEventListener("scroll", reqParallax, {passive:true});
      window.addEventListener("resize", reqParallax);
      parallaxUpdate();
    }

    /* ---- Select filled state ---- */
    document.querySelectorAll("select").forEach(function(s){
      s.addEventListener("change", function(){ s.classList.toggle("filled", !!s.value); });
    });

    /* ---- Video lazy embed ---- */
    document.querySelectorAll(".video-poster").forEach(function(poster){
      poster.addEventListener("click", function(){
        var frame = poster.parentElement;
        var iframe = document.createElement("iframe");
        iframe.src = "https://player.vimeo.com/video/1128979059?autoplay=1&title=0&byline=0&portrait=0&color=c2a05a";
        iframe.setAttribute("allow","autoplay; fullscreen; picture-in-picture");
        iframe.setAttribute("allowfullscreen","");
        frame.appendChild(iframe);
        poster.style.display = "none";
      });
    });

    /* ---- Lead forms -> WhatsApp ---- */
    function handleForm(form){
      form.addEventListener("submit", function(ev){
        ev.preventDefault();
        var data = {};
        form.querySelectorAll("input,select,textarea").forEach(function(f){
          if(f.name) data[f.name] = f.value.trim();
        });
        var msg = "Olá! Tenho interesse no *Vistta Castanho* (loteamento fechado no Castanho, Jundiaí).";
        msg += "\n\nNome: " + (data.nome||"-");
        if(data.telefone) msg += "\nTelefone: " + data.telefone;
        if(data.interesse) msg += "\nInteresse: " + data.interesse;
        if(data.mensagem) msg += "\nMensagem: " + data.mensagem;
        msg += "\n\nGostaria de falar com um corretor da Imobiliária Japi.";
        window.open(waLink(msg), "_blank");
        var btn = form.querySelector("button[type=submit]");
        if(btn){ var t=btn.innerHTML; btn.innerHTML="Abrindo WhatsApp…"; setTimeout(function(){ btn.innerHTML=t; },2500); }
      });
    }
    document.querySelectorAll("form[data-wa]").forEach(handleForm);

    /* ---- Lightbox gallery ---- */
    var lb = document.querySelector(".lightbox");
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector(".lb-cap");
    var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile[data-full]"));
    var current = 0;
    function openLb(i){
      current = i;
      var t = tiles[current];
      lbImg.src = t.getAttribute("data-full");
      lbCap.textContent = t.getAttribute("data-cap")||"";
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function closeLb(){ lb.classList.remove("open"); document.body.style.overflow=""; }
    function nav(d){ current=(current+d+tiles.length)%tiles.length; openLb(current); }
    tiles.forEach(function(t,i){ t.addEventListener("click", function(){ openLb(i); }); });
    lb.querySelector(".lb-close").addEventListener("click", closeLb);
    lb.querySelector(".lb-prev").addEventListener("click", function(e){ e.stopPropagation(); nav(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function(e){ e.stopPropagation(); nav(1); });
    lb.addEventListener("click", function(e){ if(e.target===lb) closeLb(); });
    document.addEventListener("keydown", function(e){
      if(!lb.classList.contains("open")) return;
      if(e.key==="Escape") closeLb();
      if(e.key==="ArrowRight") nav(1);
      if(e.key==="ArrowLeft") nav(-1);
    });

    /* ---- Active nav link on scroll ---- */
    var sections = Array.prototype.slice.call(document.querySelectorAll("section[id]"));
    var navLinks = document.querySelectorAll(".nav-links a");
    function updateActiveNav(){
      var mid = window.innerHeight*0.4, active = null;
      sections.forEach(function(s){
        var r = s.getBoundingClientRect();
        if(r.top <= mid && r.bottom >= mid) active = s.getAttribute("id");
      });
      navLinks.forEach(function(a){
        a.style.color = active && a.getAttribute("href")==="#"+active ? "var(--text-cream)" : "";
      });
    }
    window.addEventListener("scroll", updateActiveNav, {passive:true});
    updateActiveNav();

  });
})();
