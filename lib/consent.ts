// Consentimento de cookies (LGPD). Cookie lotus_consent: 'all' | 'essential'.
// Compartilhado por CookieConsent (grava) e Analytics (lê / reage).

export type ConsentValue = 'all' | 'essential';

export const CONSENT_COOKIE = 'lotus_consent';
export const CONSENT_EVENT = 'lotus-consent';
const MAX_AGE = 15552000; // 180 dias

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function readConsent(): ConsentValue | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(all|essential)(?:;|$)`));
  return (m?.[1] as ConsentValue) ?? null;
}

/** Grava o cookie, atualiza o Consent Mode v2 e avisa quem escuta (Clarity). */
export function writeConsent(value: ConsentValue): void {
  document.cookie = `${CONSENT_COOKIE}=${value};path=/;max-age=${MAX_AGE};SameSite=Lax`;
  window.dataLayer = window.dataLayer || [];
  // gtag exige o objeto `arguments`, não um array — por isso a function.
  function gtag(..._args: unknown[]) {
    window.dataLayer!.push(arguments);
  }
  gtag('consent', 'update', {
    analytics_storage: value === 'all' ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.dataLayer.push({ event: 'cookie_consent', consent: value });
  window.dispatchEvent(new CustomEvent<ConsentValue>(CONSENT_EVENT, { detail: value }));
}

/**
 * Evento que pede ao banner para reaparecer, mesmo já havendo escolha gravada.
 *
 * Existe para o botão "Abrir preferências de cookies" da Política de Cookies:
 * a LGPD exige que a pessoa possa rever o consentimento a qualquer momento, e
 * sem isto a única forma de mudar de ideia seria apagar cookies no navegador.
 *
 * Reabrir NÃO apaga a escolha atual: o cookie só muda quando a pessoa clica de
 * novo em aceitar ou recusar. Fechar sem escolher mantém o que já valia.
 */
export const CONSENT_REABRIR = 'lotus-consent-reabrir';

export function reabrirPreferencias(): void {
  window.dispatchEvent(new Event(CONSENT_REABRIR));
}

/**
 * Classe que marca o <html> de quem já escolheu os cookies, antes da primeira
 * pintura. O CSS (app/globals.css) esconde o aviso nesse caso.
 *
 * Existe porque o aviso passou a vir no HTML do servidor (25/11/2026). Antes
 * ele só era montado depois do JavaScript, e no celular virava o maior
 * elemento da tela para o PageSpeed: no Doppio, o LCP era o texto do aviso,
 * com 2,25 s de atraso. Vindo no HTML, ele aparece junto com a página; quem já
 * escolheu não o vê piscar, porque a marca chega antes dele.
 */
export const CLASSE_COM_CONSENTIMENTO = 'lt-consentido';

/**
 * Script do início do <body> (app/layout.tsx): põe a classe acima quando o
 * cookie de consentimento já existe. Roda antes de o aviso ser lido pelo
 * navegador, então não há quadro com o aviso visível para quem já escolheu.
 * A regra do cookie é a mesma de readConsent().
 */
export const CONSENT_MARCA_SCRIPT = `(function(){try{if(/(?:^|; )${CONSENT_COOKIE}=(?:all|essential)(?:;|$)/.test(document.cookie))document.documentElement.classList.add("${CLASSE_COM_CONSENTIMENTO}")}catch(e){}})();`;
