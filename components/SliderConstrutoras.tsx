'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * Vitrine giratória no topo de /construtoras.
 *
 * Cada slide é uma construtora em destaque, com uma imagem de empreendimento
 * dela, o nome e o link para a página da construtora. A ordem e a escolha são
 * curadoria da Lotus, não da máquina — por isso a lista mora aqui, escrita, e
 * não sai de um "as três primeiras" qualquer.
 *
 * O slide inteiro é um link, e não um botão que navega por JavaScript: assim o
 * buscador segue, o visitante abre em outra guia e o destino aparece na barra
 * de status antes do clique.
 *
 * ACESSIBILIDADE. A rotação automática para quando o ponteiro entra ou algum
 * elemento recebe foco pelo teclado — senão o slide troca no meio da leitura ou
 * enquanto se tenta clicar. E não começa a girar quando o sistema pede menos
 * movimento (prefers-reduced-motion), caso em que os pontos continuam
 * funcionando para navegar à mão.
 */

type Slide = {
  nome: string;
  href: string;
  img: string;
  /** O que a foto mostra — vira o alt e a legenda de crédito. */
  legenda: string;
};

const SLIDES: Slide[] = [
  {
    nome: 'Santa Ângela',
    href: '/construtoras/santa-angela',
    img: '/construtoras/slides/santa-angela.jpg',
    legenda: 'Allegrato, empreendimento da Santa Ângela',
  },
  {
    nome: 'GP Desenvolvimento Urbano',
    href: '/construtoras/gp-desenvolvimento-urbano',
    img: '/construtoras/slides/gp-desenvolvimento-urbano.jpg',
    legenda: 'Gran Ville Santo Ângelo, empreendimento da GP Desenvolvimento Urbano',
  },
  {
    nome: 'Auten Incorporadora',
    href: '/construtoras/auten-incorporadora',
    img: '/construtoras/slides/auten-incorporadora.jpg',
    legenda: 'Empreendimento da Auten Incorporadora',
  },
];

const INTERVALO = 6000;

const S = {
  caixa: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    background: '#1d3a2c',
    marginBottom: 34,
    boxShadow: '0 20px 50px -38px rgba(21,36,28,.5)',
  } as CSSProperties,
  palco: { position: 'relative', aspectRatio: '16 / 7' } as CSSProperties,
  slide: (visivel: boolean): CSSProperties => ({
    position: 'absolute',
    inset: 0,
    opacity: visivel ? 1 : 0,
    transition: 'opacity .6s ease',
    // O slide escondido não pode receber clique nem tabulação por baixo do visível.
    pointerEvents: visivel ? 'auto' : 'none',
    visibility: visivel ? 'visible' : 'hidden',
  }),
  img: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } as CSSProperties,
  veu: {
    position: 'absolute',
    inset: 0,
    // Escurece só a base, onde fica o texto: a foto continua à vista.
    background: 'linear-gradient(to top, rgba(21,36,28,.86) 0%, rgba(21,36,28,.35) 42%, rgba(21,36,28,0) 70%)',
  } as CSSProperties,
  texto: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 'clamp(20px,3vw,34px)' } as CSSProperties,
  rotulo: {
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: '.18em',
    textTransform: 'uppercase',
    color: '#cdab6e',
    marginBottom: 10,
  } as CSSProperties,
  nome: {
    fontFamily: "'Fraunces',serif",
    fontWeight: 300,
    fontSize: 'clamp(24px,3.4vw,40px)',
    color: '#f7f2e8',
    lineHeight: 1.05,
    margin: 0,
  } as CSSProperties,
  chamada: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    fontSize: 14.5,
    fontWeight: 600,
    color: '#f7f2e8',
  } as CSSProperties,
  pontos: {
    position: 'absolute',
    right: 'clamp(20px,3vw,34px)',
    bottom: 'clamp(20px,3vw,34px)',
    display: 'flex',
    gap: 8,
    zIndex: 2,
  } as CSSProperties,
  ponto: (ativo: boolean): CSSProperties => ({
    width: ativo ? 26 : 10,
    height: 10,
    borderRadius: 20,
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    background: ativo ? '#cdab6e' : 'rgba(247,242,232,.45)',
    transition: 'width .3s ease, background .3s ease',
  }),
};

export default function SliderConstrutoras() {
  const [atual, setAtual] = useState(0);
  const [parado, setParado] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parado) return;
    // Sistema pedindo menos movimento: os pontos continuam, a rotação não começa.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setAtual((i) => (i + 1) % SLIDES.length), INTERVALO);
    return () => clearInterval(t);
  }, [parado]);

  const pausar = () => setParado(true);
  const seguir = () => setParado(false);

  return (
    <div
      ref={caixaRef}
      style={S.caixa}
      onMouseEnter={pausar}
      onMouseLeave={seguir}
      onFocusCapture={pausar}
      onBlurCapture={(e) => {
        // Só retoma quando o foco sai do slider inteiro, e não a cada troca de
        // elemento dentro dele.
        if (!caixaRef.current?.contains(e.relatedTarget as Node)) seguir();
      }}
      aria-roledescription="carrossel"
      aria-label="Construtoras em destaque"
    >
      <div style={S.palco}>
        {SLIDES.map((s, i) => (
          <div
            key={s.href}
            style={S.slide(i === atual)}
            aria-hidden={i !== atual}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${SLIDES.length}: ${s.nome}`}
          >
            <Link href={s.href} target="_top" style={{ display: 'block', height: '100%' }}>
              <img
                src={s.img}
                alt={s.legenda}
                // O primeiro entra junto com a página; os outros só quando trocam.
                loading={i === 0 ? 'eager' : 'lazy'}
                style={S.img}
              />
              <div style={S.veu} />
              <div style={S.texto}>
                <div style={S.rotulo}>Construtora em destaque</div>
                <div style={S.nome}>{s.nome}</div>
                <span style={S.chamada}>
                  Ver a construtora <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          </div>
        ))}

        <div style={S.pontos}>
          {SLIDES.map((s, i) => (
            <button
              key={s.href}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Ver ${s.nome}`}
              aria-current={i === atual ? 'true' : undefined}
              style={S.ponto(i === atual)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
