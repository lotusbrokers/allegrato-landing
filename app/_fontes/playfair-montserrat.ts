import localFont from 'next/font/local';

/**
 * Playfair Display e Montserrat das landings Avalon e SKY Videiras.
 *
 * Até 06/11/2026 vinham do next/font/google, que baixa a fonte do Google
 * durante o build. Naquele dia o build do Easypanel quebrou em /sky-videiras
 * porque o Google não entregou a Playfair Display ("Cannot read properties of
 * null (reading '1')"), e a produção ficou parada na versão anterior. Com os
 * arquivos aqui, o build não depende mais do Google.
 *
 * Os arquivos são os mesmos que o Google servia ao build (fontes variáveis,
 * subconjunto latin, que cobre o português e era o único que as páginas
 * pediam), copiados de .next/static/media em 06/11/2026.
 *
 * Cada módulo de app/_fontes só declara as fontes de quem o importa: o next/font
 * pré-carrega tudo o que o módulo declara. A pasta começa com "_" para o App
 * Router não tratá-la como rota.
 */

/** Títulos. Alimenta --serif em avalon.css e sky-videiras.css. */
export const playfair = localFont({
  src: [
    { path: './playfair-display-latin.woff2', weight: '500 700', style: 'normal' },
    { path: './playfair-display-italic-latin.woff2', weight: '500 700', style: 'italic' },
  ],
  variable: '--font-playfair',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

/** Texto. Alimenta --sans. */
export const montserrat = localFont({
  src: './montserrat-latin.woff2',
  weight: '300 700',
  style: 'normal',
  variable: '--font-montserrat',
  display: 'swap',
});
