/*
 * Medição das landings estáticas (public/<slug>/index.html). O <head> de cada
 * uma traz, como no snippet do Google:
 *   <script async src="/medicao.js"></script>
 *   <script async src="https://www.googletagmanager.com/gtag/js?id=G-ELYJJMHD5N"></script>
 * A biblioteca fica no HTML para o "Testar" do GA4 encontrar a tag na página;
 * este arquivo faz o resto (consentimento e config).
 *
 * Essas páginas não passam pelo layout do Next e por isso não recebem o
 * components/Analytics.tsx. Aqui vai a mesma tag GA4 instalada lá, pedida pela
 * Lotus em 02/10/2026. Ao trocar o ID, trocar aqui, lá e no <head> das landings.
 *
 * LGPD (Consent Mode v2), mesma regra do resto do site: sem o cookie
 * lotus_consent=all, o GA4 mede sem gravar cookies. Estas páginas não têm o
 * banner de cookies; quem já aceitou em outra página do site chega aqui com o
 * consentimento dado.
 *
 * Só mede no domínio oficial: fora dele a biblioteca carrega, mas sem o config
 * não envia nada (abrir a landing em localhost não vira visita).
 *
 * As landings empacotadas trocam o documento inteiro depois de montar a página;
 * a tag continua valendo, porque vive no window, e não no DOM trocado.
 */
(function () {
  if (location.hostname !== 'www.lotusbrokers.com.br') return;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  var aceitou = /(^|; )lotus_consent=all(;|$)/.test(document.cookie);
  gtag('consent', 'default', {
    analytics_storage: aceitou ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  gtag('js', new Date());
  gtag('config', 'G-ELYJJMHD5N');
})();
