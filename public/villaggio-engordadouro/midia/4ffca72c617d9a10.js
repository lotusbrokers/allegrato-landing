/* ============================================================
   APPLAUSI LAGO SAMAMBAIA · Lotus Brokers — interactions
   ============================================================ */
(function(){
  "use strict";
  var WA = "5511926143393";
  function waLink(msg){ return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg); }

  document.addEventListener("DOMContentLoaded", function(){

    var header = document.querySelector(".header");
    var waFloat = document.querySelector(".wa-float");
    function onScroll(){
      var y = window.pageYOffset || document.documentElement.scrollTop;
      header.classList.toggle("scrolled", y > 40);
      waFloat.classList.toggle("show", y > 600);
    }
    window.addEventListener("scroll", onScroll, {passive:true});
    onScroll();

    /* mobile menu */
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

    /* reveals + counters (scroll-driven, robust) */
    var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal,.clip-up"));
    var countEls = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
    var ticking = false;
    function check(){
      var vh = window.innerHeight;
      for(var i=revealEls.length-1;i>=0;i--){
        if(revealEls[i].getBoundingClientRect().top < vh*0.9){
          revealEls[i].classList.add("in"); revealEls.splice(i,1);
        }
      }
      for(var j=countEls.length-1;j>=0;j--){
        if(countEls[j].getBoundingClientRect().top < vh*0.85){
          animateCount(countEls[j]); countEls.splice(j,1);
        }
      }
      ticking = false;
    }
    function req(){ if(!ticking){ ticking=true; requestAnimationFrame(check); } }
    window.addEventListener("scroll", req, {passive:true});
    window.addEventListener("resize", req);
    window.addEventListener("load", check);
    check(); setTimeout(check,120);

    function animateCount(el){
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-dec")||"0",10);
      var dur = 1500, start = null;
      function fmt(v){
        var s = v.toFixed(dec).split(".");
        s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return dec>0 ? s.join(",") : s[0];
      }
      function step(ts){
        if(!start) start = ts;
        var p = Math.min((ts-start)/dur,1);
        el.textContent = fmt(target*(1-Math.pow(1-p,3)));
        if(p<1) requestAnimationFrame(step); else el.textContent = fmt(target);
      }
      requestAnimationFrame(step);
    }

    /* parallax */
    var pEls = [];
    document.querySelectorAll("[data-parallax]").forEach(function(el){
      pEls.push({el:el, speed:parseFloat(el.getAttribute("data-parallax"))});
    });
    var pTick = false;
    function pUpdate(){
      var vh = window.innerHeight;
      pEls.forEach(function(p){
        var r = p.el.parentElement.getBoundingClientRect();
        var off = (r.top + r.height/2 - vh/2) * p.speed;
        p.el.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
      });
      pTick = false;
    }
    function pReq(){ if(!pTick){ pTick=true; requestAnimationFrame(pUpdate); } }
    if(pEls.length && !matchMedia("(prefers-reduced-motion:reduce)").matches){
      window.addEventListener("scroll", pReq, {passive:true});
      window.addEventListener("resize", pReq);
      pUpdate();
    }

    /* select filled */
    document.querySelectorAll("select").forEach(function(s){
      s.addEventListener("change", function(){ s.classList.toggle("filled", !!s.value); });
    });

    /* forms -> WhatsApp (LIA) */
    document.querySelectorAll("form[data-wa]").forEach(function(form){
      form.addEventListener("submit", function(ev){
        ev.preventDefault();
        var d = {};
        form.querySelectorAll("input,select,textarea").forEach(function(f){
          if(f.name) d[f.name] = f.value.trim();
        });
        var msg = "Olá! Vi a página do *Applausi Villaggio Engordadouro* (Jundiaí) e quero falar com um especialista da Lotus.";
        msg += "\n\nNome: " + (d.nome||"-");
        if(d.telefone) msg += "\nWhatsApp: " + d.telefone;
        if(d.interesse) msg += "\nInteresse: " + d.interesse;
        if(d.mensagem) msg += "\nMensagem: " + d.mensagem;
        window.open(waLink(msg), "_blank");
        var btn = form.querySelector("button[type=submit]");
        if(btn){ var t = btn.innerHTML; btn.innerHTML = "Abrindo WhatsApp…"; setTimeout(function(){ btn.innerHTML = t; }, 2500); }
      });
    });

    /* lightbox */
    var lb = document.querySelector(".lightbox");
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector(".lb-cap");
    var tiles = Array.prototype.slice.call(document.querySelectorAll(".tile"));
    var cur = 0;
    function open(i){
      cur = i;
      var t = tiles[cur];
      var inner = t.querySelector("img");
      lbImg.src = (inner && inner.currentSrc) || (inner && inner.src) || t.getAttribute("data-full");
      lbCap.textContent = t.getAttribute("data-cap") || "";
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close(){ lb.classList.remove("open"); document.body.style.overflow=""; }
    function nav(d){ open((cur+d+tiles.length)%tiles.length); }
    tiles.forEach(function(t,i){ t.addEventListener("click", function(){ open(i); }); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function(e){ e.stopPropagation(); nav(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function(e){ e.stopPropagation(); nav(1); });
    lb.addEventListener("click", function(e){ if(e.target===lb) close(); });
    document.addEventListener("keydown", function(e){
      if(!lb.classList.contains("open")) return;
      if(e.key==="Escape") close();
      if(e.key==="ArrowRight") nav(1);
      if(e.key==="ArrowLeft") nav(-1);
    });

    /* FAQ accordion */
    document.querySelectorAll(".qa").forEach(function(qa){
      var btn = qa.querySelector("button");
      var ans = qa.querySelector(".a");
      btn.addEventListener("click", function(){
        var isOpen = qa.classList.contains("open");
        document.querySelectorAll(".qa.open").forEach(function(o){
          o.classList.remove("open");
          o.querySelector(".a").style.maxHeight = "0px";
          o.querySelector("button").setAttribute("aria-expanded","false");
        });
        if(!isOpen){
          qa.classList.add("open");
          ans.style.maxHeight = ans.scrollHeight + "px";
          btn.setAttribute("aria-expanded","true");
        }
      });
    });

    /* active nav */
    var sections = Array.prototype.slice.call(document.querySelectorAll("section[id]"));
    var navLinks = document.querySelectorAll(".nav-links a");
    function activeNav(){
      var mid = window.innerHeight*0.4, active = null;
      sections.forEach(function(s){
        var r = s.getBoundingClientRect();
        if(r.top <= mid && r.bottom >= mid) active = s.getAttribute("id");
      });
      navLinks.forEach(function(a){
        a.style.color = active && a.getAttribute("href")==="#"+active ? "var(--ivory)" : "";
      });
    }
    window.addEventListener("scroll", activeNav, {passive:true});
    activeNav();

  });
})();
