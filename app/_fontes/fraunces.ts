import localFont from 'next/font/local';

/**
 * Fraunces da página de recrutamento: títulos em 600 com eixo óptico. A
 * Fraunces do portal (styles/fonts.css) vai só até o peso 500.
 *
 * Até 06/11/2026 vinha do next/font/google, que baixa a fonte do Google durante
 * o build; ver app/_fontes/playfair-montserrat.ts. O arquivo é o mesmo que o
 * Google servia ao build (fonte variável com eixo opsz, subconjunto latin),
 * copiado de .next/static/media em 06/11/2026. Alimenta --serif em
 * recrutamento.css.
 */
export const fraunces = localFont({
  src: [
    { path: './fraunces-latin.woff2', weight: '100 900', style: 'normal' },
    { path: './fraunces-italic-latin.woff2', weight: '100 900', style: 'italic' },
  ],
  variable: '--font-fraunces',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});
