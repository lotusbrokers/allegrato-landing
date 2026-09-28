'use client';

/**
 * LotusCondominios — índice de /lotus-condominio: lista os condomínios do
 * dashboard e leva cada card para a página dele em /lotus-condominio/[slug].
 *
 * Existia a página rica de cada condomínio e não existia a lista: /lotus-condominio
 * só redirecionava para o primeiro publicado, e o breadcrumb "Condomínios" que
 * as próprias páginas mostram apontava para esse redirecionamento. Esta página
 * é o destino que já estava sendo prometido.
 *
 * Estrutura e padrão visual seguem LotusBairrosIndex, que é o índice irmão
 * (header, hero, grid, CTA, rodapé curto, float do WhatsApp). A diferença é a
 * escala: bairros são poucos e cabem numa olhada; condomínios passam de 40, e
 * por isso aqui existem busca e filtro de cidade.
 *
 * Os dados chegam prontos da rota (server component), que lê o Supabase. Este
 * componente é de cliente só por causa da busca e do filtro.
 */

import Link from 'next/link';
import React, { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import LotusHeader from './LotusHeader';
import { footerLegalLine } from '@/lib/site';
import type { CondominioCard } from '@/lib/condominios';

const WHATSAPP_DEFAULT = '5511926143393';

function parseStyle(css: string): CSSProperties {
  const out: Record<string, string> = {};
  if (!css) return out as CSSProperties;
  for (const decl of css.split(';')) {
    const trimmed = decl.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(':');
    if (idx === -1) continue;
    const rawProp = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!rawProp) continue;
    const prop = rawProp.startsWith('--')
      ? rawProp
      : rawProp.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
    out[prop] = value;
  }
  return out as CSSProperties;
}

type HoverableProps<T extends keyof React.JSX.IntrinsicElements> = {
  as?: T;
  baseStyle: CSSProperties;
  hoverStyle: CSSProperties;
  children?: ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, 'style' | 'children'>;

function Hoverable<T extends keyof React.JSX.IntrinsicElements = 'div'>({
  as,
  baseStyle,
  hoverStyle,
  children,
  ...rest
}: HoverableProps<T>) {
  const [hover, setHover] = useState(false);
  const rprops = rest as Record<string, unknown>;
  const href = typeof rprops.href === 'string' ? rprops.href : undefined;
  const isInternal = as === 'a' && href?.startsWith('/') && rprops.target !== '_blank';
  const Tag: React.ElementType = isInternal ? Link : (as || 'div');
  const { target: _t, ...linkRest } = rprops;
  const tagProps = isInternal ? linkRest : rest;
  return (
    <Tag
      {...tagProps}
      style={hover ? { ...baseStyle, ...hoverStyle } : baseStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </Tag>
  );
}

/**
 * Texto comparável: sem acento, sem caixa.
 *
 * Quem digita "jardim ermida" tem que achar "Jardim Ermida I", e quem digita
 * "perola" tem que achar "Perola D Itália". Busca sensível a acento numa lista
 * em português é busca que não acha.
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Linha "Bairro, Cidade" tolerante a cadastro incompleto. */
function localDe(c: CondominioCard): string {
  return [c.bairro, c.cidade].filter(Boolean).join(', ');
}

/** Card do condomínio — mesmo desenho dos "condomínios parecidos" da página do condomínio. */
function CondominioItem({ c }: { c: CondominioCard }) {
  const local = localDe(c);
  return (
    <Hoverable
      as="a"
      href={`/lotus-condominio/${c.slug}`}
      target="_top"
      baseStyle={parseStyle('display:flex;flex-direction:column;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 14px 36px -32px rgba(21,36,28,.32);transition:transform .25s ease, box-shadow .25s ease;')}
      hoverStyle={parseStyle('transform:translateY(-3px);box-shadow:0 20px 44px -30px rgba(21,36,28,.45)')}
    >
      <div style={parseStyle('position:relative;aspect-ratio:16/10;background:linear-gradient(135deg,#1d3a2c,#3f6249);')}>
        {c.capa && (
          <img
            src={c.capa}
            alt={local ? `${c.nome}, ${local}` : c.nome}
            loading="lazy"
            decoding="async"
            style={parseStyle('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;')}
          />
        )}
      </div>
      <div style={parseStyle('padding:16px 18px 18px;display:flex;flex-direction:column;gap:6px;flex:1;')}>
        <h3 style={parseStyle("font-family:'Fraunces',serif;font-weight:400;font-size:19px;color:#15241c;margin:0;line-height:1.12;")}>{c.nome}</h3>
        {local && (
          <div style={parseStyle('font-size:12.5px;color:#8aa593;')}>{local}</div>
        )}
        {c.resumo && (
          <p style={parseStyle('font-size:13.5px;color:#3f6249;font-weight:300;line-height:1.5;margin:4px 0 0;')}>{c.resumo}</p>
        )}
        <div style={parseStyle('font-size:13px;font-weight:600;color:#b18a4a;margin-top:auto;padding-top:10px;')}>Ver o condomínio →</div>
      </div>
    </Hoverable>
  );
}

export default function LotusCondominios({
  condominios,
  whatsapp = WHATSAPP_DEFAULT,
}: {
  condominios: CondominioCard[];
  whatsapp?: string;
}) {
  const [busca, setBusca] = useState('');
  const [cidade, setCidade] = useState<string>('todas');

  const waLink =
    'https://wa.me/' +
    String(whatsapp ?? WHATSAPP_DEFAULT) +
    '?text=' +
    encodeURIComponent('Quero saber mais sobre um condomínio em Jundiaí ou Itupeva.');

  /** Cidades que existem de fato no cadastro, em ordem alfabética. */
  const cidades = useMemo(() => {
    const vistas = new Set<string>();
    for (const c of condominios) if (c.cidade) vistas.add(c.cidade);
    return [...vistas].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [condominios]);

  /**
   * Busca por nome E por bairro: quem procura condomínio quase sempre começa
   * pela região ("Medeiros", "Engordadouro"), não pelo nome do empreendimento.
   */
  const filtrados = useMemo(() => {
    const termo = normalizar(busca);
    return condominios.filter((c) => {
      if (cidade !== 'todas' && c.cidade !== cidade) return false;
      if (!termo) return true;
      return normalizar(`${c.nome} ${c.bairro ?? ''} ${c.cidade ?? ''}`).includes(termo);
    });
  }, [condominios, busca, cidade]);

  const total = condominios.length;
  const filtrando = busca.trim() !== '' || cidade !== 'todas';

  const chip = (ativo: boolean): CSSProperties =>
    parseStyle(
      'padding:9px 18px;border-radius:30px;font-size:13.5px;font-weight:500;cursor:pointer;transition:background .2s, color .2s, border-color .2s;' +
        (ativo
          ? 'background:#1d3a2c;color:#f7f2e8;border:1px solid #1d3a2c;'
          : 'background:#fff;color:#3f6249;border:1px solid rgba(21,36,28,.16);'),
    );

  return (
    <div>
      <LotusHeader active="bairros" maxWidth={1200} whatsapp={whatsapp} />

      {/* HERO */}
      <section style={parseStyle('max-width:1200px;margin:0 auto;padding:64px 32px 34px;')}>
        <div style={parseStyle('font-size:13px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#b18a4a;margin-bottom:16px;')}>Condomínios</div>
        <h1 style={parseStyle("font-family:'Fraunces',serif;font-weight:300;font-size:clamp(34px,5vw,58px);line-height:1.03;letter-spacing:-.02em;color:#15241c;margin:0 0 16px;max-width:820px;")}>
          Os condomínios de Jundiaí e Itupeva, por dentro.
        </h1>
        <p style={parseStyle('font-size:clamp(16px,1.6vw,19px);color:#3f6249;font-weight:300;line-height:1.55;max-width:640px;margin:0;')}>
          Estrutura, lazer, localização e fotos de cada condomínio que a Lotus acompanha. Quem conhece o condomínio por dentro sabe o que muda no seu dia a dia.
        </p>
      </section>

      {/* BUSCA E FILTROS — só existem se houver lista para filtrar. Com o banco
          fora do ar, campo de busca sobre lista vazia é só frustração. */}
      {total > 0 && (
      <section style={parseStyle('max-width:1200px;margin:0 auto;padding:0 32px 26px;')}>
        <div style={parseStyle('display:flex;flex-wrap:wrap;align-items:center;gap:12px;')}>
          <label style={parseStyle('flex:1;min-width:250px;position:relative;display:block;')}>
            <span style={parseStyle('position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;')}>Buscar condomínio por nome ou bairro</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou bairro. Ex.: Medeiros"
              style={parseStyle('width:100%;box-sizing:border-box;border:1px solid rgba(21,36,28,.16);background:#fff;color:#15241c;font-size:14.5px;padding:12px 18px;border-radius:30px;outline-offset:2px;')}
            />
          </label>
          <div style={parseStyle('display:flex;flex-wrap:wrap;gap:8px;')}>
            <button type="button" onClick={() => setCidade('todas')} style={chip(cidade === 'todas')}>Todas as cidades</button>
            {cidades.map((c) => (
              <button key={c} type="button" onClick={() => setCidade(c)} style={chip(cidade === c)}>{c}</button>
            ))}
          </div>
        </div>
        <p style={parseStyle('font-size:13.5px;color:#8aa593;margin:16px 0 0;')} aria-live="polite">
          {filtrando
            ? `${filtrados.length} de ${total} ${total === 1 ? 'condomínio' : 'condomínios'}`
            : `${total} ${total === 1 ? 'condomínio' : 'condomínios'} acompanhados pela Lotus`}
        </p>
      </section>
      )}

      {/* GRID */}
      <section style={parseStyle('max-width:1200px;margin:0 auto;padding:0 32px 90px;')}>
        {filtrados.length > 0 ? (
          <div style={parseStyle('display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;')}>
            {filtrados.map((c) => (
              <CondominioItem key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <div style={parseStyle('background:#fff;border:1px solid rgba(21,36,28,.1);border-radius:18px;padding:44px 32px;text-align:center;')}>
            {/* Duas situações diferentes, dois textos: filtro sem resultado é
                culpa do filtro; lista vazia é o cadastro fora do ar. Um texto
                só mentiria em um dos dois casos. */}
            <h2 style={parseStyle("font-family:'Fraunces',serif;font-weight:400;font-size:24px;color:#15241c;margin:0 0 10px;")}>
              {total === 0 ? 'A lista está sendo atualizada.' : 'Nenhum condomínio com esse filtro.'}
            </h2>
            <p style={parseStyle('font-size:15px;color:#3f6249;font-weight:300;line-height:1.55;max-width:460px;margin:0 auto 22px;')}>
              {total === 0
                ? 'Os condomínios voltam para cá em instantes. Enquanto isso, diga qual condomínio interessa e a gente responde direto.'
                : 'A Lotus conhece condomínio que ainda não está nesta lista. Diga o que você procura e a gente confere.'}
            </p>
            <Hoverable as="a" href={waLink} target="_blank" rel="noopener" baseStyle={parseStyle('display:inline-flex;align-items:center;gap:8px;background:#1d3a2c;color:#f7f2e8;font-weight:600;font-size:15px;padding:13px 26px;border-radius:40px;transition:background .2s;')} hoverStyle={parseStyle('background:#15241c')}>Falar com um especialista <span>→</span></Hoverable>
          </div>
        )}
      </section>

      {/* CTA */}
      <section style={parseStyle('background:#ece2cf;padding:72px 32px;')}>
        <div style={parseStyle('max-width:820px;margin:0 auto;text-align:center;')}>
          <h2 style={parseStyle("font-family:'Fraunces',serif;font-weight:300;font-size:clamp(26px,3.2vw,40px);color:#15241c;margin:0 0 16px;line-height:1.08;")}>Procura imóvel em um condomínio específico?</h2>
          <p style={parseStyle('font-size:17px;color:#3f6249;font-weight:300;line-height:1.55;max-width:560px;margin:0 auto 30px;')}>
            A Lotus acompanha o que entra e sai em cada um deles. Conte qual condomínio interessa e a gente avisa quando aparecer a unidade certa.
          </p>
          <Hoverable as="a" href={waLink} target="_blank" rel="noopener" baseStyle={parseStyle('display:inline-flex;align-items:center;gap:8px;background:#1d3a2c;color:#f7f2e8;font-weight:600;font-size:16px;padding:15px 30px;border-radius:40px;transition:background .2s;')} hoverStyle={parseStyle('background:#15241c')}>Falar com um especialista <span>→</span></Hoverable>
        </div>
      </section>

      {/* FOOTER */}
      <footer data-rodape-portal="" style={parseStyle('background:#15241c;padding:56px 32px 36px;')}>
        <div style={parseStyle('max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;')}>
          <div style={parseStyle('display:flex;align-items:center;gap:12px;')}>
            <img src="/logo-lotus-dourado.png" alt="Lotus Brokers" style={{ height: 34, width: 'auto', display: 'block' }} />
          </div>
          <div style={parseStyle('font-size:13px;color:rgba(247,242,232,.5);')}>{footerLegalLine()}</div>
        </div>
      </footer>

      {/* WHATSAPP FLOAT */}
      <a href={waLink} target="_blank" rel="noopener" aria-label="WhatsApp" style={parseStyle('position:fixed;right:22px;bottom:22px;z-index:75;width:54px;height:54px;border-radius:50%;background:#25543b;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 34px -10px rgba(21,36,28,.6);')}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#f7f2e8"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.7-1.2-4.4-3.9-4.6-4.1-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.3.4c-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.1.1.6-.1 1.2Z"></path></svg>
      </a>
    </div>
  );
}
