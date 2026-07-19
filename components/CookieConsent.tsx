'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';

// Banner de consentimento portado do <script> inline do estático lotus-cookies/index.html.
// Comportamento preservado: exibe só quando não há cookie "lotus_consent", grava o
// consentimento por 180 dias (15552000s) e faz push no dataLayer (GTM).
declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (document.cookie.indexOf('lotus_consent=') === -1) {
      setVisible(true);
    }
  }, []);

  function setConsent(value: string) {
    document.cookie = `lotus_consent=${value};path=/;max-age=15552000;SameSite=Lax`;
    setVisible(false);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'cookie_consent', consent: value });
  }

  if (!visible) return null;

  return (
    <div id="lotus-cookie" role="dialog" aria-label="Aviso de cookies" style={box}>
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
