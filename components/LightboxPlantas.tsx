'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lightbox único das PLANTAS, compartilhado por todas as landings.
 *
 * Motivo de existir: a auditoria de 18/08/2026 mediu as 28 landings em Chrome
 * e achou três problemas distintos.
 *
 * - Em Avalon, Jardins do Horto, SKY Videiras e Oásis a planta não abria de
 *   jeito nenhum: 9 imagens sem qualquer comportamento de clique.
 * - Das 21 landings que já tinham lightbox próprio, só 3 fechavam com Esc.
 * - 11 delas deixavam a página rolando por trás do modal aberto.
 *
 * As 21 implementações não compartilham formato de estado nem de fechamento,
 * então normalizar cada uma seriam 21 edições distintas e 21 chances de
 * regressão. Em vez disso este componente ASSUME o clique nas plantas: captura
 * o evento na fase de captura e impede que o handler da página rode, de modo
 * que toda planta do site abre no mesmo modal, com o mesmo comportamento.
 *
 * O lightbox próprio de cada landing continua servindo as galerias de fotos,
 * que não são escopo desta auditoria e seguem funcionando como antes.
 *
 * Identificação da planta: alt mencionando planta/tipologia/implantação, ou
 * imagem dentro de uma seção cujo id traz esses termos. Foi a heurística usada
 * na auditoria, e é a mesma que a verificação relê depois.
 */

const SELETOR_SECAO = '[id*="planta" i], [id*="tipologia" i]';
const RE_ALT = /planta|tipologia|implanta/i;

function ehPlanta(img: HTMLImageElement): boolean {
  if (RE_ALT.test(img.alt || '')) return true;
  return Boolean(img.closest(SELETOR_SECAO));
}

export default function LightboxPlantas() {
  const [aberta, setAberta] = useState<{ src: string; alt: string } | null>(null);
  const [montado, setMontado] = useState(false);
  // Caber na tela é o padrão; o tamanho real é o que deixa as cotas legíveis.
  const [tamanhoReal, setTamanhoReal] = useState(false);
  const fundoRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMontado(true), []);

  const fechar = useCallback(() => {
    setAberta(null);
    setTamanhoReal(false);
  }, []);

  // Ao ampliar, a rolagem começa no meio da planta: no canto superior esquerdo
  // costuma não haver nada além de margem.
  useEffect(() => {
    const fundo = fundoRef.current;
    if (!tamanhoReal || !fundo) return;
    fundo.scrollLeft = (fundo.scrollWidth - fundo.clientWidth) / 2;
    fundo.scrollTop = (fundo.scrollHeight - fundo.clientHeight) / 2;
  }, [tamanhoReal, aberta]);

  // Captura o clique antes de a página tratá-lo. Sem a fase de captura, o
  // lightbox da própria landing abriria junto e teríamos dois modais.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const alvo = e.target as HTMLElement | null;
      // Dentro do próprio modal o clique é dele: a imagem ampliada também
      // casa com ehPlanta, e sem esta saída o modal se reabriria a cada toque
      // — foi o que engoliu o alternar de tamanho real na primeira versão.
      if (alvo?.closest?.('[data-lightbox-plantas]')) return;
      const img = alvo?.closest?.('img') as HTMLImageElement | null;
      if (!img || !ehPlanta(img)) return;
      e.preventDefault();
      e.stopPropagation();
      setTamanhoReal(false);
      setAberta({ src: img.currentSrc || img.src, alt: img.alt || 'Planta do empreendimento' });
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Cursor de zoom nas plantas: sinaliza que são clicáveis. Feito em JS e não
  // em CSS porque o seletor depende do alt, que CSS não alcança.
  useEffect(() => {
    const aplicar = () => {
      document.querySelectorAll('img').forEach((img) => {
        if (ehPlanta(img as HTMLImageElement)) (img as HTMLImageElement).style.cursor = 'zoom-in';
      });
    };
    aplicar();
    const obs = new MutationObserver(aplicar);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  // Esc fecha e a página para de rolar por trás.
  useEffect(() => {
    if (!aberta) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fechar();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener('keydown', onKey);
    };
  }, [aberta, fechar]);

  if (!montado || !aberta) return null;

  return createPortal(
    <div
      ref={fundoRef}
      data-lightbox-plantas=""
      role="dialog"
      aria-modal="true"
      aria-label={aberta.alt}
      onClick={fechar}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        display: 'flex',
        // Em tamanho real a planta é maior que a tela: alinhar ao início em vez
        // de centralizar é o que permite rolar até as bordas — centralizado, o
        // que passa do topo e da esquerda fica inalcançável.
        alignItems: tamanhoReal ? 'flex-start' : 'center',
        justifyContent: tamanhoReal ? 'flex-start' : 'center',
        overflow: tamanhoReal ? 'auto' : 'hidden',
        padding: tamanhoReal ? 0 : 'clamp(12px, 4vw, 40px)',
        background: 'rgba(10,14,12,.94)',
        // Sem o desfoque em tamanho real, e de proposito: backdrop-filter faz
        // deste elemento o referencial dos filhos position:fixed, e com isso o
        // botao de fechar rolava junto com a planta e sumia da tela. Em tamanho
        // real o fundo esta todo coberto pela imagem, entao nao ha o que borrar.
        backdropFilter: tamanhoReal ? 'none' : 'blur(3px)',
        cursor: 'zoom-out',
        animation: 'ltPlantaEntra .22s ease-out',
      }}
    >
      <style>{`
        @keyframes ltPlantaEntra { from { opacity: 0 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          [data-lightbox-plantas] { animation: none !important }
        }
      `}</style>

      <button
        type="button"
        aria-label="Fechar"
        onClick={fechar}
        style={{
          // Fixo e não absoluto: em tamanho real o fundo rola, e um botão
          // absoluto sairia de cena junto com a planta.
          position: 'fixed',
          top: 'calc(14px + env(safe-area-inset-top, 0px))',
          right: 14,
          width: 46,
          height: 46,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,.32)',
          background: 'rgba(0,0,0,.42)',
          color: '#fff',
          fontSize: 26,
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        ×
      </button>

      <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, maxHeight: tamanhoReal ? 'none' : '100%' }}>
        <img
          src={aberta.src}
          alt={aberta.alt}
          // Clique na imagem não fecha (só o fundo e o X): alterna entre caber
          // na tela e tamanho real, que é como se leem as cotas.
          onClick={(e) => {
            e.stopPropagation();
            setTamanhoReal((v) => !v);
          }}
          style={{
            display: 'block',
            maxWidth: tamanhoReal ? 'none' : 'min(1600px, 96vw)',
            maxHeight: tamanhoReal ? 'none' : '84vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: tamanhoReal ? 0 : 6,
            background: '#fff',
            cursor: tamanhoReal ? 'zoom-out' : 'zoom-in',
            boxShadow: '0 30px 90px rgba(0,0,0,.55)',
          }}
        />
        {!tamanhoReal && (
          <figcaption
            style={{
              color: 'rgba(255,255,255,.82)',
              fontFamily: "'Hanken Grotesk',system-ui,sans-serif",
              fontSize: 14,
              textAlign: 'center',
              maxWidth: '90vw',
            }}
          >
            {aberta.alt}
            {/* Sem esta linha ninguém descobre o tamanho real: no celular não
                há cursor para indicar que a imagem responde ao toque. */}
            <span style={{ display: 'block', marginTop: 6, color: 'rgba(255,255,255,.6)', fontSize: 13 }}>
              Toque na planta para ver em tamanho real
            </span>
          </figcaption>
        )}
      </figure>
    </div>,
    document.body
  );
}
