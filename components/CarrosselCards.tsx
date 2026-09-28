'use client';

/**
 * CarrosselCards — vitrine horizontal de cards, com setas.
 *
 * Nasceu para as duas vitrines novas da home (condomínios e oportunidades da
 * semana). Uma só implementação porque as duas precisam exatamente do mesmo
 * comportamento; duas cópias divergiriam no primeiro ajuste.
 *
 * O deslize é scroll nativo com scroll-snap, e não transform controlado por
 * JavaScript. Com isso o arrasto no celular, o swipe no trackpad e a navegação
 * por teclado funcionam sem código nosso, e a lista continua sendo uma lista
 * para quem lê com leitor de tela.
 *
 * ACESSIBILIDADE
 *  - A faixa é um `region` rotulado e recebe foco: quem navega por teclado
 *    chega nela e rola com as setas do próprio navegador.
 *  - As setas são `button` de verdade, com rótulo, e somem nas pontas em vez de
 *    ficarem clicáveis sem efeito.
 *  - Sem rotação automática. Vitrine que anda sozinha atrapalha quem está lendo
 *    um card, e aqui não há nada que justifique o risco.
 *  - `scroll-behavior` suave só quando o sistema não pede menos movimento.
 */

import Link from 'next/link';
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

/** Quanto anda a cada clique: quase uma tela, deixando um card à vista como pista. */
const FRACAO_DO_PASSO = 0.85;

const S = {
  cabecalho: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 24,
    flexWrap: 'wrap',
    marginBottom: 26,
  } as CSSProperties,
  eyebrow: {
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '.18em',
    textTransform: 'uppercase',
    color: '#b18a4a',
    marginBottom: 14,
  } as CSSProperties,
  titulo: {
    fontFamily: "'Fraunces',serif",
    fontWeight: 300,
    fontSize: 'clamp(26px,3.4vw,42px)',
    lineHeight: 1.06,
    letterSpacing: '-.02em',
    color: '#15241c',
    margin: 0,
    maxWidth: 640,
  } as CSSProperties,
  descricao: {
    fontSize: 16,
    color: '#3f6249',
    fontWeight: 300,
    lineHeight: 1.55,
    maxWidth: 520,
    margin: '14px 0 0',
  } as CSSProperties,
  controles: { display: 'flex', alignItems: 'center', gap: 10 } as CSSProperties,
  seta: (ativa: boolean): CSSProperties => ({
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: '1px solid rgba(21,36,28,.18)',
    background: '#fff',
    color: '#1d3a2c',
    fontSize: 20,
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: ativa ? 'pointer' : 'default',
    opacity: ativa ? 1 : 0.35,
    transition: 'opacity .2s, background .2s',
  }),
  verTodos: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 14.5,
    fontWeight: 600,
    color: '#b18a4a',
    whiteSpace: 'nowrap',
  } as CSSProperties,
  faixa: {
    display: 'flex',
    gap: 20,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    // Espaço para a sombra dos cards não ser cortada pelo overflow.
    padding: '4px 4px 18px',
    margin: '0 -4px',
  } as CSSProperties,
};

export default function CarrosselCards({
  eyebrow,
  titulo,
  descricao,
  verTodos,
  rotulo,
  children,
}: {
  eyebrow?: string;
  titulo: string;
  descricao?: string;
  /** Link opcional à direita do título ("Ver todos"). */
  verTodos?: { label: string; href: string };
  /** Nome da faixa para quem usa leitor de tela. */
  rotulo: string;
  children: ReactNode;
}) {
  const faixaRef = useRef<HTMLDivElement>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);

  /** Recalcula quais setas fazem sentido agora. */
  const medir = useCallback(() => {
    const el = faixaRef.current;
    if (!el) return;
    const sobra = el.scrollWidth - el.clientWidth;
    setPodeVoltar(el.scrollLeft > 8);
    // Margem de 8px: arredondamento de layout deixa 1 ou 2px de sobra e a seta
    // ficaria acesa no fim da faixa sem ter para onde ir.
    setPodeAvancar(sobra > 8 && el.scrollLeft < sobra - 8);
  }, []);

  useEffect(() => {
    medir();
    const el = faixaRef.current;
    if (!el) return;
    // ResizeObserver e não só o resize da janela: a faixa também muda de
    // tamanho quando as imagens carregam e quando o painel lateral abre.
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    window.addEventListener('resize', medir);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, [medir]);

  const andar = (direcao: 1 | -1) => {
    const el = faixaRef.current;
    if (!el) return;
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({
      left: direcao * el.clientWidth * FRACAO_DO_PASSO,
      behavior: suave ? 'smooth' : 'auto',
    });
  };

  return (
    <div>
      {/* A barra de rolagem some no desktop, mas a faixa continua rolável por
          arrasto, roda, teclado e toque — nada depende de ver a barra. */}
      <style>{`
        [data-carrossel-faixa]{scrollbar-width:none;-ms-overflow-style:none}
        [data-carrossel-faixa]::-webkit-scrollbar{display:none}
        [data-carrossel-faixa] > *{scroll-snap-align:start;flex:0 0 auto}
      `}</style>

      <div style={S.cabecalho}>
        <div>
          {eyebrow && <div style={S.eyebrow}>{eyebrow}</div>}
          <h2 style={S.titulo}>{titulo}</h2>
          {descricao && <p style={S.descricao}>{descricao}</p>}
        </div>
        <div style={S.controles}>
          {verTodos && (
            <Link href={verTodos.href} target="_top" style={S.verTodos}>
              {verTodos.label} <span aria-hidden="true">→</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => andar(-1)}
            disabled={!podeVoltar}
            aria-label={`Voltar em ${rotulo}`}
            style={S.seta(podeVoltar)}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={() => andar(1)}
            disabled={!podeAvancar}
            aria-label={`Avançar em ${rotulo}`}
            style={S.seta(podeAvancar)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <div
        ref={faixaRef}
        data-carrossel-faixa=""
        role="region"
        aria-label={rotulo}
        tabIndex={0}
        onScroll={medir}
        style={S.faixa}
      >
        {children}
      </div>
    </div>
  );
}
