'use client';

import ReactDOM from 'react-dom';

// Resource hints globais. As imagens do portal vêm de hosts externos
// (github.io e o Storage do Supabase). `preconnect` estabelece DNS+TLS com esses
// hosts logo no início do carregamento, então quando o browser for buscar as
// imagens a conexão já está pronta — reduz a latência do primeiro byte de cada
// imagem sem mudar nenhum markup. É a forma oficial de resource hints no App
// Router (ReactDOM.preconnect). Zero impacto visual.
export default function PreloadHints() {
  ReactDOM.preconnect('https://lotusbrokers.github.io');
  ReactDOM.preconnect('https://glbtwvusiaaovllxhiig.supabase.co');
  ReactDOM.preconnect('https://i.postimg.cc'); // hero da home
  return null;
}
