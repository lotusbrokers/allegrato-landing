'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * Mapa do Google (embed) que só entra na página quando a pessoa se aproxima
 * dele. `loading="lazy"` no iframe não bastava: o Chrome começa a carregar
 * iframes preguiçosos a 1.250–2.500 px do viewport (quanto pior a conexão,
 * maior a distância), então na PDP o embed — ~800 ms de JavaScript do Maps
 * na linha principal — entrava junto com a primeira tela em celular.
 *
 * Aqui o iframe nasce a 300 px de distância, com o IntersectionObserver; até
 * lá fica só a caixa com a cor de fundo, do mesmo tamanho, então nada salta.
 * Sem IntersectionObserver (navegador antigo) o mapa entra de imediato.
 */
export default function MapaEmbed({ title, src, style }: { title: string; src: string; style?: CSSProperties }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const el = caixa.current;
    if (!el || mostrar) return;
    if (!('IntersectionObserver' in window)) {
      setMostrar(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMostrar(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mostrar]);

  return (
    <div ref={caixa} style={{ position: 'absolute', inset: 0 }}>
      {mostrar && (
        <iframe
          title={title}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, ...style }}
          allowFullScreen
        />
      )}
    </div>
  );
}
