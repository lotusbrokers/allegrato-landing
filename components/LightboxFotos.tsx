'use client';

/**
 * LightboxFotos — galeria em tela cheia, com setas.
 *
 * Nasceu para a página do condomínio, onde a galeria mostrava cinco fotos num
 * mosaico fixo e as outras (há cadastros com 70) não tinham como ser vistas.
 *
 * O componente é montado pelo pai quando abre e desmontado quando fecha — o
 * índice vive aqui dentro, então o pai só precisa guardar "por qual foto
 * começar". Menos estado espalhado do que um lightbox controlado de fora.
 *
 * Navegação: setas na tela, setas do teclado, Esc para sair e arrasto lateral
 * no celular. Dá a volta nas pontas: depois da última vem a primeira, o que
 * evita a seta morta que faz a pessoa achar que travou.
 *
 * A página do imóvel tem um lightbox equivalente escrito dentro dela. Não foi
 * migrado junto porque funciona e a troca não foi pedida; quando for, é este o
 * componente para onde ele vai.
 */

import React, { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

export type FotoLightbox = { url: string; legenda?: string };

/** Distância mínima do arrasto para contar como troca de foto, em px. */
const ARRASTO_MINIMO = 45;

const S = {
  fundo: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'rgba(10,18,14,.94)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
  botao: (extra: CSSProperties): CSSProperties => ({
    position: 'absolute',
    zIndex: 2,
    borderRadius: '50%',
    background: 'rgba(10,18,14,.62)',
    border: '1px solid rgba(247,242,232,.45)',
    color: '#f7f2e8',
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...extra,
  }),
  palco: {
    width: 'min(92vw,1180px)',
    height: 'min(82vh,820px)',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    // touchAction none no eixo X para o arrasto não virar scroll da página.
    touchAction: 'pan-y',
  } as CSSProperties,
  foto: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  } as CSSProperties,
  rodape: {
    position: 'absolute',
    bottom: 22,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    maxWidth: '86vw',
  } as CSSProperties,
  contador: {
    background: 'rgba(247,242,232,.14)',
    color: '#f7f2e8',
    fontSize: 13,
    padding: '7px 16px',
    borderRadius: 30,
    whiteSpace: 'nowrap',
  } as CSSProperties,
  legenda: {
    color: 'rgba(247,242,232,.82)',
    fontSize: 13.5,
    lineHeight: 1.4,
    textAlign: 'center',
  } as CSSProperties,
};

export default function LightboxFotos({
  fotos,
  indiceInicial = 0,
  titulo,
  onFechar,
}: {
  fotos: FotoLightbox[];
  indiceInicial?: number;
  /** Nome do que está sendo mostrado — entra no alt e no rótulo acessível. */
  titulo: string;
  onFechar: () => void;
}) {
  const total = fotos.length;
  const [indice, setIndice] = useState(() => Math.min(Math.max(indiceInicial, 0), Math.max(total - 1, 0)));
  const fecharRef = useRef<HTMLButtonElement>(null);
  const arrastoX = useRef<number | null>(null);

  const anterior = useCallback(() => setIndice((i) => (i + total - 1) % total), [total]);
  const proxima = useCallback(() => setIndice((i) => (i + 1) % total), [total]);

  // Teclado: as setas trocam a foto e Esc fecha, como em qualquer visualizador.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
      else if (e.key === 'ArrowRight') proxima();
      else if (e.key === 'ArrowLeft') anterior();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [anterior, proxima, onFechar]);

  // Trava a rolagem do fundo enquanto o lightbox está aberto: sem isso a página
  // rola atrás e a pessoa fecha em outro lugar do que estava.
  useEffect(() => {
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    fecharRef.current?.focus();
    return () => { document.body.style.overflow = anterior; };
  }, []);

  if (total === 0) return null;

  const atual = fotos[indice];
  const umaSo = total === 1;

  return (
    <div
      style={S.fundo}
      role="dialog"
      aria-modal="true"
      aria-label={`Fotos de ${titulo}`}
      // Clicar no fundo fecha; clicar na foto, não — por isso o stopPropagation
      // no palco logo abaixo.
      onClick={onFechar}
    >
      <button
        ref={fecharRef}
        type="button"
        onClick={onFechar}
        aria-label="Fechar galeria"
        style={S.botao({ top: 22, right: 24, width: 44, height: 44, fontSize: 24 })}
      >
        ✕
      </button>

      {!umaSo && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); anterior(); }}
            aria-label="Foto anterior"
            style={S.botao({ left: 14, top: '50%', transform: 'translateY(-50%)', width: 50, height: 50, fontSize: 26 })}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); proxima(); }}
            aria-label="Próxima foto"
            style={S.botao({ right: 14, top: '50%', transform: 'translateY(-50%)', width: 50, height: 50, fontSize: 26 })}
          >
            ›
          </button>
        </>
      )}

      <div
        style={S.palco}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => { arrastoX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const inicio = arrastoX.current;
          arrastoX.current = null;
          if (inicio === null || umaSo) return;
          const dx = e.changedTouches[0].clientX - inicio;
          if (Math.abs(dx) < ARRASTO_MINIMO) return;
          if (dx < 0) proxima();
          else anterior();
        }}
      >
        {/* object-fit contain: foto de condomínio vem em proporções diferentes e
            cortar no lightbox esconde justamente o que a pessoa abriu para ver. */}
        <img
          src={atual.url}
          alt={atual.legenda ? `${titulo}: ${atual.legenda}` : `${titulo}, foto ${indice + 1} de ${total}`}
          style={S.foto}
        />
      </div>

      <div style={S.rodape} onClick={(e) => e.stopPropagation()}>
        <span style={S.contador} aria-live="polite">{indice + 1} / {total}</span>
        {atual.legenda && <span style={S.legenda}>{atual.legenda}</span>}
      </div>
    </div>
  );
}
