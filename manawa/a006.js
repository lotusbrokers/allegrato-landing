/* ===== Manawa Residencial — Imobiliária JAPI ===== */
(function () {
  "use strict";

  var WA_NUMBER = "5511926143393";
  var WA_BASE = "https://api.whatsapp.com/send?phone=" + WA_NUMBER + "&text=";
  var GAL_BASE = "https://maclucer.com.br/wp-content/uploads/2024/11/1243.1-Mac-Lucer_pagina-empreendimento_Manawa_galeria_";

  /* ---------- Inline icons ---------- */
  var ICONS = {
    PLAN: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3h18v18H3z"/><path d="M3 9h6V3M15 21v-6h6M9 3v6h12"/></svg>',
    BED: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 17v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5M2 17h20M2 17v3M22 17v3M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/></svg>',
    CAR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13l1.5-5A2 2 0 0 1 8.4 6.5h7.2a2 2 0 0 1 1.9 1.5L19 13M5 13h14v5H5zM5 13a2 2 0 0 0-2 2v1h2M19 13a2 2 0 0 1 2 2v1h-2M7 18v2M17 18v2"/></svg>',
    SHIELD: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/></svg>',
    LEAF: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 20c8 2 16-4 16-14 0 0-12-2-15 5-1.5 3.5 0 7 3 8z"/><path d="M4 20c2-6 6-9 11-11"/></svg>',
    FLAME: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 1.5-4 .5 2 1.5 2.5 2 2.5C9 8 11 5 12 2z"/></svg>',
    PIN: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    KEY: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5"/><path d="M11.5 11.5L21 21M17 17l2-2M15 19l1.5-1.5"/></svg>',
    CHECK: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12l5 5L20 6"/></svg>',
    CHECK_BIG: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12l5 5L20 6"/></svg>',
    WA: '<svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-.985zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>',
    EXPAND: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>'
  };

  // Inject icons
  var html = document.body.innerHTML;
  Object.keys(ICONS).forEach(function (k) {
    html = html.split("{ICON_" + k + "}").join(ICONS[k]);
  });
  document.body.innerHTML = html;

  /* ---------- Image fallback ---------- */
  function attachFallback(img) {
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", function () {
      if (img.dataset.failed) return;
      img.dataset.failed = "1";
      var d = document.createElement("div");
      d.className = "imgph " + img.className;
      d.style.width = "100%";
      d.style.height = "100%";
      d.textContent = img.dataset.ph || "Imagem do empreendimento";
      if (img.parentNode) img.parentNode.replaceChild(d, img);
    });
  }

  // Lazy-load tagged images (hero / about / family)
  document.querySelectorAll("img[data-src]").forEach(function (img) {
    attachFallback(img);
    img.src = img.dataset.src;
  });

  /* ---------- WhatsApp links ---------- */
  var waMsg = encodeURIComponent("Olá! Tenho interesse no Manawa Residencial em Jundiaí. Pode me enviar mais informações?");
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    a.setAttribute("href", WA_BASE + waMsg);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });

  /* ---------- Sticky header ---------- */
  var header = document.getElementById("header");
  function onScroll() {
    if (window.scrollY > 60) header.classList.add("solid");
    else header.classList.remove("solid");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile drawer ---------- */
  var drawer = document.getElementById("drawer");
  document.getElementById("menuBtn").addEventListener("click", function () { drawer.classList.add("open"); });
  document.getElementById("drawerClose").addEventListener("click", function () { drawer.classList.remove("open"); });
  drawer.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { drawer.classList.remove("open"); });
  });

  /* ---------- Lazer chips (oficiais — ficha técnica) ---------- */
  var CHIPS = ["Piscina adulto", "Piscina infantil", "Piscina coberta", "Espelho d'água", "Deck",
    "Salão de festas", "Village Garden", "Espaço gourmet", "Churrasqueira", "Brinquedoteca",
    "Salão de jogos", "Playground", "Quadra recreativa", "Academia", "Home office",
    "Pet place", "Lavanderia compartilhada", "Mini-market"];
  var chipsEl = document.getElementById("lazerChips");
  CHIPS.forEach(function (c) {
    var s = document.createElement("span");
    s.textContent = c;
    chipsEl.appendChild(s);
  });

  /* ---------- Gallery ---------- */
  var GAL = [
    { f: "piscina", c: "Piscina adulto e infantil", cls: "wide" },
    { f: "piscina-coberta", c: "Piscina coberta", cls: "tall" },
    { f: "academia", c: "Academia", cls: "" },
    { f: "salao-de-festas", c: "Salão de festas", cls: "wide" },
    { f: "espaco-gourmet", c: "Espaço gourmet", cls: "" },
    { f: "churrasqueira", c: "Churrasqueira", cls: "" },
    { f: "coworking", c: "Home office", cls: "tall" },
    { f: "brinquedoteca", c: "Brinquedoteca", cls: "" },
    { f: "playground", c: "Playground", cls: "" },
    { f: "quadra-poli", c: "Quadra recreativa", cls: "wide" },
    { f: "pet-place", c: "Pet place", cls: "" },
    { f: "lavanderia", c: "Lavanderia compartilhada", cls: "" },
    { f: "mini-marketing", c: "Mini-market", cls: "" },
    { f: "garden", c: "Village Garden", cls: "wide" }
  ];
  var galEl = document.getElementById("gallery");
  galEl.style.gridAutoFlow = "dense";
  var LB_ITEMS = [];
  GAL.forEach(function (g) {
    var url = GAL_BASE + g.f + ".jpg";
    var fig = document.createElement("figure");
    if (g.cls) fig.className = g.cls;
    var img = document.createElement("img");
    img.alt = g.c + " — Manawa Residencial";
    img.dataset.ph = g.c;
    attachFallback(img);
    img.src = url;
    var cap = document.createElement("figcaption");
    cap.textContent = g.c;
    fig.appendChild(img);
    fig.appendChild(cap);
    var idx = LB_ITEMS.length;
    LB_ITEMS.push({ src: url, cap: g.c });
    fig.addEventListener("click", function () { openLightbox(idx); });
    galEl.appendChild(fig);
  });

  /* ---------- Plantas (clique para ampliar) ---------- */
  var PLANTAS = [
    { src: "assets/plantas/p1-10279.png", cap: "102,79 m² · 3 dormitórios (1 suíte) + escritório · 2 vagas — Torre A" },
    { src: "assets/plantas/p2-9462.png", cap: "94,62 m² · 3 dormitórios (1 suíte) · 2 vagas — Torre B" },
    { src: "assets/plantas/p3-7627.png", cap: "76,27 m² · 2 suítes + lavabo · 1 vaga — Torre A" },
    { src: "assets/plantas/p4-6596.png", cap: "65,96 m² · 2 dormitórios (1 suíte) · 1 vaga — Torre B" }
  ];
  var planLbIndex = {};
  PLANTAS.forEach(function (p, i) { planLbIndex[i] = LB_ITEMS.length; LB_ITEMS.push(p); });
  document.querySelectorAll(".plan-fig").forEach(function (fig) {
    fig.addEventListener("click", function () {
      var n = parseInt(fig.getAttribute("data-plan"), 10) || 0;
      openLightbox(planLbIndex[n]);
    });
  });

  /* ---------- Obra photos ---------- */
  var OBRA = [
    { u: "https://maclucer.com.br/wp-content/uploads/2026/05/WhatsApp-Image-2026-04-29-at-08.43.46.jpeg", c: "Obra Manawa — 05/2026" },
    { u: "https://maclucer.com.br/wp-content/uploads/2026/05/WhatsApp-Image-2026-04-29-at-08.44.28.jpeg", c: "Obra Manawa — 05/2026" },
    { u: "https://maclucer.com.br/wp-content/uploads/2026/05/WhatsApp-Image-2026-04-29-at-08.44.49.jpeg", c: "Obra Manawa — 05/2026" },
    { u: "https://maclucer.com.br/wp-content/uploads/2026/02/1.jpg", c: "Obra Manawa — 02/2026" }
  ];
  var obraEl = document.getElementById("obraPhotos");
  OBRA.forEach(function (o) {
    var fig = document.createElement("figure");
    var img = document.createElement("img");
    img.alt = o.c;
    img.dataset.ph = o.c;
    attachFallback(img);
    img.src = o.u;
    fig.appendChild(img);
    var idx = LB_ITEMS.length;
    LB_ITEMS.push({ src: o.u, cap: o.c });
    fig.addEventListener("click", function () { openLightbox(idx); });
    obraEl.appendChild(fig);
  });

  /* ---------- Reveal animation ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14 });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbCap = document.getElementById("lbCap");
  var lbCur = 0;
  lbImg.referrerPolicy = "no-referrer";
  function openLightbox(i) {
    lbCur = i;
    lbImg.src = LB_ITEMS[i].src;
    lbImg.alt = LB_ITEMS[i].cap;
    lbCap.textContent = LB_ITEMS[i].cap;
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  function step(d) {
    lbCur = (lbCur + d + LB_ITEMS.length) % LB_ITEMS.length;
    lbImg.src = LB_ITEMS[lbCur].src;
    lbCap.textContent = LB_ITEMS[lbCur].cap;
  }
  document.getElementById("lbClose").addEventListener("click", closeLightbox);
  document.getElementById("lbPrev").addEventListener("click", function () { step(-1); });
  document.getElementById("lbNext").addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  /* ---------- Form ---------- */
  var form = document.getElementById("leadForm");
  var formOk = document.getElementById("formOk");
  function setErr(id, on) {
    var f = document.getElementById(id).closest(".field");
    if (f) f.classList.toggle("err", on);
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var nome = document.getElementById("nome");
    var tel = document.getElementById("tel");
    var email = document.getElementById("email");
    var consent = document.getElementById("consent");
    var interesse = document.getElementById("interesse");
    var ok = true;
    if (!nome.value.trim()) { setErr("nome", true); ok = false; } else setErr("nome", false);
    if (tel.value.replace(/\D/g, "").length < 8) { setErr("tel", true); ok = false; } else setErr("tel", false);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) { setErr("email", true); ok = false; } else setErr("email", false);
    if (!consent.checked) { ok = false; }
    if (!ok) return;

    var msg = "Olá! Quero conhecer o *Manawa Residencial* (Jundiaí).%0A%0A" +
      "*Nome:* " + encodeURIComponent(nome.value.trim()) + "%0A" +
      "*Telefone:* " + encodeURIComponent(tel.value.trim()) + "%0A" +
      "*E-mail:* " + encodeURIComponent(email.value.trim()) + "%0A" +
      "*Interesse:* " + encodeURIComponent(interesse.value);
    var waUrl = WA_BASE + msg;

    form.style.display = "none";
    formOk.style.display = "block";
    formOk.querySelector("[data-wa]").setAttribute("href", waUrl);
    window.open(waUrl, "_blank", "noopener");
  });

  // Phone mask (simple BR)
  var telInput = document.getElementById("tel");
  telInput.addEventListener("input", function () {
    var v = telInput.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) telInput.value = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
    else if (v.length > 2) telInput.value = "(" + v.slice(0, 2) + ") " + v.slice(2);
    else if (v.length > 0) telInput.value = "(" + v;
  });
})();
