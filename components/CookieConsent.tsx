'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CLASSE_COM_CONSENTIMENTO, CONSENT_REABRIR, readConsent, writeConsent, type ConsentValue } from '@/lib/consent';

// Banner de consentimento portado do <script> inline do estático lotus-cookies/index.html.
// Exibe só quando não há cookie "lotus_consent"; a gravação + Consent Mode v2
// ficam em lib/consent.ts (compartilhado com components/Analytics.tsx).
//
// Desde 25/11/2026 o banner vem no HTML do servidor, para aparecer junto com a
// página: montado só depois do JavaScript, ele virava o LCP no celular (2,25 s
// de atraso no Doppio). Quem já escolheu não o vê porque o <html> é marcado
// antes da primeira pintura (CONSENT_MARCA_SCRIPT) e o CSS o esconde; depois da
// hidratação, o efeito abaixo o tira do DOM.

const box: CSSProperties = {
  position: 'fixed',
  left: 16,
  right: 16,
  bottom: 16,
  zIndex: 9999,
  maxWidth: 560,
  margin: '0 auto',
  background: '#15241c',
  color: '#f7f2e8',
  border: '1px solid rgba(205,171,110,.4)',
  borderRadius: 14,
  padding: '18px 20px',
  boxShadow: '0 18px 50px -20px rgba(0,0,0,.5)',
  fontFamily: 'system-ui,-apple-system,sans-serif',
};

const acceptBtn: CSSProperties = {
  background: '#b18a4a',
  color: '#15241c',
  fontWeight: 700,
  fontSize: 13.5,
  border: 'none',
  padding: '10px 18px',
  borderRadius: 30,
  cursor: 'pointer',
};

const rejectBtn: CSSProperties = {
  background: 'transparent',
  color: '#f7f2e8',
  fontWeight: 600,
  fontSize: 13.5,
  border: '1px solid rgba(247,242,232,.3)',
  padding: '10px 18px',
  borderRadius: 30,
  cursor: 'pointer',
};

export default function CookieConsent() {
  // true no servidor e na hidratação: o banner sai no HTML (ver o topo).
  const [visible, setVisible] = useState(true);
  const caixaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(readConsent() === null);
    // O botao "Abrir preferencias de cookies" (/lotus-cookies) pede o banner de
    // volta mesmo com escolha ja gravada: a LGPD exige poder rever o
    // consentimento, e sem isso so limpando cookies no navegador. A marca do
    // <html> sai junto, senão o CSS continuaria escondendo o banner.
    const reabrir = () => {
      document.documentElement.classList.remove(CLASSE_COM_CONSENTIMENTO);
      setVisible(true);
    };
    window.addEventListener(CONSENT_REABRIR, reabrir);
    return () => window.removeEventListener(CONSENT_REABRIR, reabrir);
  }, []);

  /**
   * Publica a altura do banner em --lt-banner-h enquanto ele está na tela.
   *
   * O banner é fixed, ocupa a largura toda no rodapé e vive na camada 9999;
   * os CTAs flutuantes ficam em bottom:24px na camada 95. Medido num aparelho
   * de 390px, o banner ia de y=585 a y=784 e os botões de y=722 a y=776: o
   * banner cobria os dois por inteiro, e não havia como alcançá-los até
   * aceitar os cookies.
   *
   * A altura vai para uma variável em vez de um valor fixo porque o banner
   * muda de altura conforme a largura da tela (151px a 390px, 199px a 360px).
   * Quem consome é [data-flutuantes] em styles/base.css.
   */
  useEffect(() => {
    const raiz = document.documentElement;
    if (!visible) {
      raiz.style.removeProperty('--lt-banner-h');
      return;
    }
    const medir = () => {
      const h = caixaRef.current?.offsetHeight ?? 0;
      // 0 = escondido pelo CSS (quem já escolheu, antes de o efeito de cima
      // tirar o banner): os botões flutuantes não precisam subir.
      if (h === 0) raiz.style.removeProperty('--lt-banner-h');
      else raiz.style.setProperty('--lt-banner-h', `${h + 12}px`);
    };
    medir();
    const obs = new ResizeObserver(medir);
    if (caixaRef.current) obs.observe(caixaRef.current);
    window.addEventListener('resize', medir);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', medir);
      raiz.style.removeProperty('--lt-banner-h');
    };
  }, [visible]);

  function setConsent(value: ConsentValue) {
    writeConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    // data-nosnippet: o texto do aviso vai no HTML de toda página e não deve
    // aparecer como trecho da página nos resultados do Google.
    <div id="lotus-cookie" ref={caixaRef} role="dialog" aria-label="Aviso de cookies" style={box} data-nosnippet="">
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 13.5,
          lineHeight: 1.5,
          color: 'rgba(247,242,232,.85)',
        }}
      >
        Usamos cookies para melhorar sua experiência e entender o uso do site.
        Aceite todos ou recuse os não-essenciais.{' '}
        <Link
          href="/lotus-cookies"
          style={{ color: '#cdab6e', textDecoration: 'underline' }}
        >
          Política de Cookies
        </Link>
        .
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          id="lotus-cookie-accept"
          type="button"
          style={acceptBtn}
          onClick={() => setConsent('all')}
        >
          Aceitar todos
        </button>
        <button
          id="lotus-cookie-reject"
          type="button"
          style={rejectBtn}
          onClick={() => setConsent('essential')}
        >
          Recusar não-essenciais
        </button>
      </div>
    </div>
  );
}
