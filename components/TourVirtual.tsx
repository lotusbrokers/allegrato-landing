'use client';

import { useState } from 'react';

/**
 * Tour virtual de um empreendimento, numa página de fora, dentro da landing.
 * O primeiro foi a apresentação interativa do Doppio (doppio.zamitt.com), pedido
 * da Lotus em 17/11/2026.
 *
 * Só carrega quando a pessoa clica em "Iniciar". O tour é um aplicativo inteiro
 * (vídeo, 360°, plantas), pesado demais para entrar junto com a página. E um
 * iframe interativo no meio da rolagem prende o dedo no celular: quem arrasta
 * gira o tour em vez de descer a página. Até o clique fica a capa, no mesmo
 * tamanho, então nada salta.
 *
 * "Abrir em tela cheia" leva à mesma página numa aba nova, o jeito mais
 * confortável no celular.
 *
 * A caixa tem 16:9 no computador e cresce até 70% da altura da tela no celular
 * (min-height). A largura é 100% declarada: com aspect-ratio e min-height sem
 * largura, o navegador tira a largura da altura e a caixa vaza da tela.
 *
 * O botão mostra só "Iniciar o tour", que cabe numa linha até nos celulares de
 * 320px; "Iniciar o tour virtual" quebrava em duas e encostava nas bordas da
 * caixa a 360px. O nome inteiro fica no aria-label, para o leitor de tela.
 */
export default function TourVirtual({
  src,
  titulo,
  capa,
  capaAlt,
}: {
  /** Endereço do tour. */
  src: string;
  /** Nome do tour, para o iframe e para quem usa leitor de tela. */
  titulo: string;
  /** Imagem da capa, de dentro do site. */
  capa: string;
  capaAlt: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          minHeight: 'min(70vh, 560px)',
          overflow: 'hidden',
          borderRadius: 4,
          background: '#0e0905',
        }}
      >
        {aberto ? (
          <iframe
            title={titulo}
            src={src}
            allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <button
            type="button"
            aria-label="Iniciar o tour virtual"
            onClick={() => setAberto(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              padding: 0,
              border: 0,
              cursor: 'pointer',
              background: 'none',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <img
              src={capa}
              alt={capaAlt}
              loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <span
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,9,5,.2), rgba(14,9,5,.62))' }}
            />
            <span
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                maxWidth: 'calc(100% - 32px)',
                padding: '15px 22px',
                textAlign: 'center',
                border: '1px solid rgba(243,236,224,.7)',
                background: 'rgba(20,12,6,.45)',
                color: '#f3ece0',
                fontFamily: "'Jost', sans-serif",
                fontSize: 13,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 15, letterSpacing: 0 }}>▶</span>
              Iniciar o tour
            </span>
          </button>
        )}
      </div>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          marginTop: 16,
          color: '#c9a36a',
          fontFamily: "'Jost', sans-serif",
          fontSize: 12,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}
      >
        Abrir em tela cheia ↗
      </a>
    </div>
  );
}
