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
export default function PreloadHints() {
  ReactDOM.preconnect('https://glbtwvusiaaovllxhiig.supabase.co');
  return null;
}
