'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { CONSENT_EVENT, readConsent, type ConsentValue } from '@/lib/consent';
import { DOMINIO_OFICIAL } from '@/lib/indexacao.mjs';

// Medição do site (Parte 1 do briefing 8h): GTM + GA4 + Clarity. O GA4 vai
// direto pelo gtag.js desde 02/10/2026 (ver GA4_ID); antes ia pelo GTM.
// IDs do GTM, Clarity e Pixel vêm de env NEXT_PUBLIC_*; sem ID o bloco
// simplesmente não renderiza, então dev/preview ficam limpos e o deploy liga
// tudo só pelas envs.
//
// LGPD / Consent Mode v2: o script inline abaixo roda antes do GTM e declara
// analytics_storage/ad_storage = denied por padrão (ou granted, se já existe
// cookie lotus_consent=all). CookieConsent faz o `consent update` no aceite.
// Clarity e Meta Pixel não têm consent mode: só carregam com consentimento 'all'.
//
// GA4 em SPA, no tempo em que ia pelo GTM: o GTM não vê a navegação client-side
// do Next, então cada troca de rota faz push de `page_view` no dataLayer, que
// dispara o evento GA4 `page_view` do GTM. Com o GA4 fora do GTM (ver GA4_ID),
// esse push não alimenta mais nada e o PageViews pode sair.

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// GA4 direto pelo gtag.js, pedido da Lotus em 02/10/2026: propriedade
// G-ELYJJMHD5N. No Google, ela tem a G-QBVBX74XEY (a que o GTM carregava) como
// tag conectada, e a Lotus decidiu manter assim: esta tag alimenta as duas,
// inclusive nas landings estáticas. Por isso o GA4 sai do GTM (tag do Google
// G-QBVBX74XEY e evento page_view); enquanto estiver lá, as páginas do Next
// contam em dobro na G-QBVBX74XEY. Para conferir a ligação: a tag publicada em
// googletagmanager.com/gtag/js?id=G-ELYJJMHD5N cita a G-QBVBX74XEY.
// Vai no HTML como o snippet do Google (biblioteca no <head>, config logo depois
// do consent default), e não por next/script, que só injeta depois da hidratação:
// assim o "Testar" das instruções de instalação do GA4 encontra a tag na página.
// O ID fica no código, e não em env, porque as landings estáticas de public/
// (que não passam por este layout) usam a mesma tag, onde env não chega. Ao
// trocar o ID, trocar aqui, em public/medicao.js e no <head> das landings.
// Só mede no domínio oficial: fora dele a biblioteca carrega, mas sem o config
// não envia nada (`next dev` e `next start` local não viram visita).
// Troca de rota no cliente: o próprio GA4 conta a página vista, pela medição
// otimizada do fluxo ("alterações de página com base no histórico", ligada).
const GA4_ID = 'G-ELYJJMHD5N';
const GA4_HOST = new URL(DOMINIO_OFICIAL).hostname;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Consentimento atual, reagindo ao aceite do banner (CONSENT_EVENT). */
function useConsent(): ConsentValue | null {
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  useEffect(() => {
    setConsent(readConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent<ConsentValue>).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);
  return consent;
}

const consentInit = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
var granted = /(^|; )lotus_consent=all(;|$)/.test(document.cookie);
gtag('consent','default',{
  analytics_storage: granted ? 'granted' : 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});
`;

// gtag() e o consent default vêm do consentInit, que roda antes deste script.
const ga4Config = `
if (location.hostname === '${GA4_HOST}') {
  gtag('js', new Date());
  gtag('config', '${GA4_ID}');
}
`;

function PageViews() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      page_path: pathname,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [pathname]);
  return null;
}

function Clarity() {
  const consent = useConsent();
  if (!CLARITY_ID || consent !== 'all') return null;
  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}

function MetaPixel() {
  const consent = useConsent();
  const pathname = usePathname();
  const primeiraRota = useRef(true);

  // PageView por troca de rota SPA. A primeira é pulada: o snippet base já
  // dispara o PageView inicial ao carregar. Sem consentimento, fbq não existe
  // e o optional chaining vira no-op.
  useEffect(() => {
    if (!pathname) return;
    if (primeiraRota.current) {
      primeiraRota.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [pathname]);

  if (!META_PIXEL_ID || consent !== 'all') return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}

export default function Analytics() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: consentInit }} />
      {/* O React leva este script async para o <head> no HTML do servidor. */}
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} />
      <script dangerouslySetInnerHTML={{ __html: ga4Config }} />
      {GTM_ID && (
        <>
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
          <PageViews />
          <Clarity />
          <MetaPixel />
        </>
      )}
    </>
  );
}

/** <noscript> do GTM — vai logo após a abertura do <body>, como pede o Google. */
export function AnalyticsNoScript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
