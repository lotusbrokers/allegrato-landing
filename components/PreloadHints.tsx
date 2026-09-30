'use client';

import ReactDOM from 'react-dom';

// Resource hints globais. As fotos dos imóveis vêm do Storage do Supabase, um
// host externo: `preconnect` estabelece DNS+TLS com ele logo no início do
// carregamento, então quando o browser for buscar as imagens a conexão já está
// pronta — reduz a latência do primeiro byte de cada imagem sem mudar nenhum
// markup. É a forma oficial de resource hints no App Router
// (ReactDOM.preconnect). Zero impacto visual.
//
// O preconnect com i.postimg.cc saiu em 24/09/2026: o hero da home deixou de
// morar lá. Abrir conexão com um host que ninguém mais usa só gasta handshake.
// Subconjunto latino das três fontes que a primeira tela usa (Fraunces normal
// e itálico no título, Hanken Grotesk no resto). Declaradas em styles/fonts.css
// com font-display:swap, elas só eram pedidas depois do CSS chegar; o texto
// aparecia na fonte reserva e trocava depois, e a troca movia o painel de
// busca da home (CLS de 0,13 no Lighthouse mobile). Pré-carregadas, chegam
// junto com o HTML. Os demais subconjuntos (cirílico, vietnamita, latin-ext)
// seguem sob demanda.
const FONTES_CRITICAS = ['/fonts/a007.woff2', '/fonts/a004.woff2', '/fonts/a011.woff2'];

export default function PreloadHints() {
  ReactDOM.preconnect('https://glbtwvusiaaovllxhiig.supabase.co');
  for (const href of FONTES_CRITICAS) {
    ReactDOM.preload(href, { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
  }
  return null;
}
