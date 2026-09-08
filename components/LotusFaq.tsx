'use client';
import { footerLegalLine } from '@/lib/site';

/**
 * LotusFaq — porte 1:1 de lotus-faq/index.html (mecanismo dc-runtime) para React.
 * Visual e comportamento idênticos ao estático. Dados hard-coded (viram fetch numa fase futura).
 *
 * Convenções de porte (mesmas de LotusHome):
 *  - style="css literal"  -> style={parseStyle('css literal')}
 *  - style-hover="css"    -> <Hoverable baseStyle={...} hoverStyle={parseStyle('css')}>
 *  - sc-for / sc-if       -> .map() / {cond && ...}
 */

import Link from 'next/link';
import LotusHeader from './LotusHeader';
import React, {
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Converte uma string CSS ("a:b;c:d") em objeto React.CSSProperties.
 * camelCase nas propriedades; preserva valores EXATOS (cores, px, gradientes).
 * Split cuidadoso: separa apenas no PRIMEIRO ":" de cada declaração (valores
 * como gradientes e data: URIs contêm ":" internos).
 */
function parseStyle(css: string): CSSProperties {
  const out: Record<string, string> = {};
  if (!css) return out;
  for (const decl of css.split(';')) {
    const trimmed = decl.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(':');
    if (idx === -1) continue;
    const rawProp = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!rawProp) continue;
    const prop = rawProp.startsWith('--')
      ? rawProp // custom property: mantém como está
      : rawProp
          .replace(/^-webkit-/, 'Webkit')
          .replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
    out[prop] = value;
  }
  return out as CSSProperties;
}

/**
 * Reproduz style-hover do dc-runtime: hoverStyle vira :hover.
 * Aplica hoverStyle (merge sobre baseStyle) no mouseenter e remove no mouseleave.
 */
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
  // Rota interna (href "/..." não-âncora) vira <Link> do Next: navegação
  // client-side instantânea + prefetch, sem full reload/tela branca.
  const rprops = rest as Record<string, unknown>;
  const href = typeof rprops.href === 'string' ? rprops.href : undefined;
  const isInternal =
    as === 'a' && href?.startsWith('/') && rprops.target !== '_blank';
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

/* ------------------------------------------------------------------ */
/* Dados estáticos (valores EXATOS do fonte)                          */
/* ------------------------------------------------------------------ */

const WHATSAPP_DEFAULT = '5511926143393';

import { CATS, FAQ, respostaEmTexto, type Cat, type FaqItem } from '@/lib/faq';

/* chips (valores EXATOS do renderVals) */
const CHIP_ON = 'border:none;border-radius:30px;padding:10px 18px;font-size:13.5px;font-weight:600;cursor:pointer;background:#1d3a2c;color:#f7f2e8;transition:all .2s;';
const CHIP_OFF = 'border:1px solid rgba(21,36,28,.16);border-radius:30px;padding:10px 18px;font-size:13.5px;font-weight:600;cursor:pointer;background:#fff;color:#3f6249;transition:all .2s;';

/**
 * Corpo da resposta: parágrafo, lista, fecho e observação.
 *
 * O texto vem de lib/faq.ts na mesma forma em que a Lotus escreve as respostas.
 * Achatar tudo num parágrafo só — que era o que a tela fazia — tirava a leitura
 * em lista justamente das respostas que mais precisam dela: documentos exigidos,
 * checklist de compra, o que verificar antes de assinar.
 *
 * Em cada item da lista, o trecho antes de " — " é o termo e vem destacado; o
 * resto é a explicação. Item sem travessão sai inteiro, sem destaque.
 */
function Resposta({ item }: { item: FaqItem }) {
  const corpo = parseStyle('font-size:15.5px;color:#3f6249;font-weight:300;line-height:1.65;margin:0;max-width:760px;');
  return (
    <div style={parseStyle('padding:0 26px 26px;')}>
      <p style={corpo}>{item.a}</p>
      {item.lista && item.lista.length > 0 && (
        <ul style={parseStyle('margin:14px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:9px;list-style:disc;')}>
          {item.lista.map((linha, i) => {
            const corte = linha.indexOf(' — ');
            const termo = corte > 0 ? linha.slice(0, corte) : null;
            const resto = corte > 0 ? linha.slice(corte) : linha;
            return (
              <li key={i} style={corpo}>
                {termo && <strong style={parseStyle('font-weight:600;color:#15241c;')}>{termo}</strong>}
                {resto}
              </li>
            );
          })}
        </ul>
      )}
      {item.depois && <p style={{ ...corpo, marginTop: 14 }}>{item.depois}</p>}
      {item.nota && (
        <p style={{ ...corpo, marginTop: 14, fontStyle: 'italic', color: '#5b7a66' }}>{item.nota}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

export default function LotusFaq({
  whatsapp = WHATSAPP_DEFAULT,
}: {
  whatsapp?: string;
} = {}) {
  // state = { cat: 'all', query: '', openId: null, askDone: false };
  const [cat, setCat] = useState<string>('all');
  const [query, setQuery] = useState<string>('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [askDone, setAskDone] = useState<boolean>(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // waLink: 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(...)
  const waLink =
    'https://wa.me/' +
    String(whatsapp ?? WHATSAPP_DEFAULT) +
    '?text=' +
    encodeURIComponent('Tenho uma dúvida e quero falar com um especialista da Lotus.');

  // O JSON-LD do FAQPage saiu daqui para app/lotus-faq/page.tsx: injetado por
  // useEffect ele só existia depois da hidratação, e o buscador que lê o HTML
  // servido não via pergunta nenhuma. No servidor ele vai no HTML de saída.

  // renderVals (derivados de state)
  const q = query.trim().toLowerCase();

  const list = FAQ.filter(
    (f) =>
      (cat === 'all' || f.cat === cat) &&
      // A busca varre a resposta inteira — parágrafo, lista e fechos. Só com
      // f.a, procurar por "FGTS" ou "ITBI" não achava nada: esses termos moram
      // dentro das listas.
      (q === '' || (f.q + ' ' + respostaEmTexto(f)).toLowerCase().includes(q))
  );

  const catLabel = (CATS.find((c) => c.id === cat) || ({} as Cat)).label;
  const catSuffix = cat === 'all' ? '' : ' em ' + catLabel;

  const hasQuery = query !== '';
  const hasResults = list.length > 0;
  const noResults = list.length === 0;

  const onSearch = (e: React.FormEvent<HTMLInputElement>) => {
    setQuery((e.target as HTMLInputElement).value);
    setOpenId(null);
  };
  const clearSearch = () => {
    setQuery('');
    if (searchRef.current) searchRef.current.value = '';
  };
  const submitAsk = (e: React.FormEvent<HTMLFormElement>) => {
    if (e && e.preventDefault) e.preventDefault();
    setAskDone(true);
  };

  return (
    <div>
      {/* HEADER */}
      <LotusHeader active="guias" whatsapp={whatsapp} />

      {/* HERO + BUSCA */}
      <section style={parseStyle('background:#1d3a2c;position:relative;overflow:hidden;')}>
        <div style={parseStyle("position:absolute;inset:0;opacity:.05;mix-blend-mode:overlay;pointer-events:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");")}></div>
        <div style={parseStyle('position:relative;max-width:820px;margin:0 auto;padding:90px 32px;text-align:center;')}>
          <div style={parseStyle('font-size:13px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#cdab6e;margin-bottom:22px;')}>Perguntas frequentes</div>
          <h1 style={parseStyle("font-family:'Fraunces',serif;font-weight:300;font-size:clamp(34px,5vw,60px);line-height:1.03;letter-spacing:-.02em;color:#f7f2e8;margin:0 0 18px;")}>Tudo o que você quer saber sobre imóveis na região.</h1>
          <p style={parseStyle('font-size:clamp(15px,1.6vw,19px);color:rgba(247,242,232,.82);font-weight:300;line-height:1.5;max-width:560px;margin:0 auto 32px;')}>Comprar, vender, financiar e investir em Jundiaí e Itupeva, respondido de forma direta por quem vive o mercado da região.</p>
          <div style={parseStyle('display:flex;align-items:center;gap:10px;background:#f7f2e8;border-radius:14px;padding:7px 7px 7px 18px;max-width:540px;margin:0 auto;box-shadow:0 20px 50px -24px rgba(0,0,0,.5);')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8aa593" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path></svg>
            <input ref={searchRef} type="text" placeholder="Busque sua dúvida, ex.: financiamento, ITBI, FGTS…" value={query} onInput={onSearch} onChange={onSearch} style={parseStyle('flex:1;border:none;outline:none;background:transparent;font-size:15.5px;color:#15241c;padding:9px 0;')} />
            {hasQuery && (
              <>
                <button onClick={clearSearch} aria-label="Limpar" style={parseStyle('flex-shrink:0;background:#ece2cf;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;color:#3f6249;font-size:15px;')}>✕</button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CATEGORIAS + LISTA */}
      <section style={parseStyle('background:#f7f2e8;padding:48px 32px 100px;')}>
        <div style={parseStyle('max-width:980px;margin:0 auto;')}>
          <div style={parseStyle('display:flex;flex-wrap:wrap;gap:9px;justify-content:center;max-width:760px;margin:0 auto 40px;')}>
            {/* hint-placeholder-count="9" */}
            {CATS.map((c, i) => (
              <button key={i} onClick={() => { setCat(c.id); setOpenId(null); }} style={parseStyle(cat === c.id ? CHIP_ON : CHIP_OFF)}>{c.label}</button>
            ))}
          </div>

          <div style={parseStyle('font-size:13.5px;color:#8aa593;margin-bottom:18px;')}>{list.length} perguntas{catSuffix}</div>

          {hasResults && (
            <>
              <div style={parseStyle('display:flex;flex-direction:column;gap:12px;')}>
                {/* hint-placeholder-count="8" */}
                {list.map((f, i) => {
                  const fCat = (CATS.find((c) => c.id === f.cat) || ({} as Cat)).label;
                  const open = openId === f.id;
                  const sign = open ? '–' : '+';
                  const toggle = () => setOpenId((prev) => (prev === f.id ? null : f.id));
                  return (
                    <div key={i} style={parseStyle('background:#fff;border-radius:14px;box-shadow:0 14px 36px -34px rgba(21,36,28,.34);overflow:hidden;')}>
                      <button onClick={toggle} style={parseStyle('width:100%;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;background:none;border:none;cursor:pointer;padding:24px 26px;text-align:left;')}>
                        <div>
                          <div style={parseStyle('font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#b18a4a;margin-bottom:7px;')}>{fCat}</div>
                          <span style={parseStyle('font-size:17px;font-weight:500;color:#15241c;line-height:1.35;')}>{f.q}</span>
                        </div>
                        <span style={parseStyle('flex-shrink:0;font-size:24px;color:#b18a4a;font-weight:300;line-height:1;margin-top:14px;')}>{sign}</span>
                      </button>
                      {open && (
                        <>
                          <Resposta item={f} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {noResults && (
            <>
              <div style={parseStyle('background:#ece2cf;border-radius:18px;padding:48px;text-align:center;')}>
                <div style={parseStyle("font-family:'Fraunces',serif;font-size:22px;color:#15241c;margin-bottom:8px;")}>Não achamos essa dúvida.</div>
                <p style={parseStyle('font-size:15px;color:#3f6249;font-weight:300;max-width:420px;margin:0 auto 22px;')}>Tente outras palavras, ou fale direto com a gente, respondemos qualquer pergunta sobre imóveis na região.</p>
                <a href={waLink} target="_blank" rel="noopener" style={parseStyle('display:inline-block;background:#1d3a2c;color:#f7f2e8;font-weight:600;font-size:14.5px;padding:13px 26px;border-radius:40px;')}>Perguntar no WhatsApp</a>
              </div>
            </>
          )}
        </div>
      </section>

      {/* FORM DÚVIDA */}
      <section style={parseStyle('background:#1d3a2c;padding:90px 32px;position:relative;overflow:hidden;')}>
        <div style={parseStyle("position:absolute;inset:0;opacity:.05;mix-blend-mode:overlay;pointer-events:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");")}></div>
        <div style={parseStyle('max-width:680px;margin:0 auto;position:relative;text-align:center;')}>
          <div style={parseStyle('font-size:13px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#cdab6e;margin-bottom:16px;')}>Não achou sua resposta?</div>
          <h2 style={parseStyle("font-family:'Fraunces',serif;font-weight:300;font-size:clamp(28px,3.8vw,44px);color:#f7f2e8;line-height:1.05;margin:0 0 14px;")}>Manda sua dúvida pra gente.</h2>
          <p style={parseStyle('font-size:17px;color:rgba(247,242,232,.78);font-weight:300;line-height:1.55;margin:0 0 34px;')}>A LIA faz o primeiro atendimento na hora, a qualquer horário, e passa para um especialista do seu bairro assim que você quiser. É só pedir.</p>
          <div style={parseStyle('background:#f7f2e8;border-radius:22px;padding:clamp(28px,4vw,40px);text-align:left;')}>
            {askDone && (
              <>
                <div style={parseStyle('text-align:center;padding:24px 0;')}>
                  <div style={parseStyle('width:60px;height:60px;border-radius:50%;background:#1d3a2c;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;')}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cdab6e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"></path></svg></div>
                  <div style={parseStyle("font-family:'Fraunces',serif;font-size:24px;color:#1d3a2c;margin-bottom:10px;")}>Dúvida recebida! 🌿</div>
                  <p style={parseStyle('font-size:15px;color:#3f6249;font-weight:300;line-height:1.55;margin:0;')}>Um especialista da Lotus vai te responder pelo WhatsApp ou e-mail em breve.</p>
                </div>
              </>
            )}
            {!askDone && (
              <>
                <form onSubmit={submitAsk} style={parseStyle('display:flex;flex-direction:column;gap:13px;')}>
                  <input type="text" required placeholder="Seu nome" style={parseStyle('width:100%;border:1px solid rgba(21,36,28,.16);background:#fff;color:#15241c;font-size:15px;padding:13px 14px;border-radius:11px;outline:none;')} />
                  <div style={parseStyle('display:grid;grid-template-columns:1fr 1fr;gap:12px;')}>
                    <input type="text" required placeholder="Telefone / WhatsApp" style={parseStyle('width:100%;border:1px solid rgba(21,36,28,.16);background:#fff;color:#15241c;font-size:15px;padding:13px 14px;border-radius:11px;outline:none;')} />
                    <input type="email" required placeholder="E-mail" style={parseStyle('width:100%;border:1px solid rgba(21,36,28,.16);background:#fff;color:#15241c;font-size:15px;padding:13px 14px;border-radius:11px;outline:none;')} />
                  </div>
                  <textarea required placeholder="Qual é a sua dúvida?" rows={4} style={parseStyle('width:100%;border:1px solid rgba(21,36,28,.16);background:#fff;color:#15241c;font-size:15px;padding:13px 14px;border-radius:11px;outline:none;resize:vertical;font-family:inherit;')}></textarea>
                  <label style={parseStyle('display:flex;align-items:flex-start;gap:9px;font-size:12px;color:#3f6249;line-height:1.45;cursor:pointer;')}>
                    <input type="checkbox" required style={parseStyle('margin-top:2px;width:16px;height:16px;accent-color:#1d3a2c;')} />
                    Autorizo a Lotus a entrar em contato e concordo com a Política de Privacidade (LGPD).
                  </label>
                  <Hoverable as="button" type="submit" baseStyle={parseStyle('margin-top:6px;background:#b18a4a;color:#15241c;font-weight:600;font-size:16px;padding:16px;border:none;border-radius:12px;cursor:pointer;transition:background .2s;')} hoverStyle={parseStyle('background:#a07a3c')}>Enviar minha dúvida</Hoverable>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer data-rodape-portal="" style={parseStyle('background:#15241c;padding:72px 32px 36px;position:relative;overflow:hidden;')}>
        <div style={parseStyle("position:absolute;inset:0;opacity:.04;mix-blend-mode:overlay;pointer-events:none;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\");")}></div>
        <div style={parseStyle('max-width:1280px;margin:0 auto;position:relative;')}>
          <div style={parseStyle('display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:40px;padding-bottom:48px;border-bottom:1px solid rgba(247,242,232,.12);')}>
            <div>
              <div style={parseStyle('display:flex;align-items:center;gap:12px;margin-bottom:18px;')}>
                <img src="/logo-lotus-dourado.png" alt="Lotus Brokers" style={{ height: 34, width: 'auto', display: 'block' }} />
              </div>
              <p style={parseStyle("font-family:'Fraunces',serif;font-style:italic;font-weight:300;font-size:19px;color:rgba(247,242,232,.85);line-height:1.35;max-width:300px;margin:0 0 18px;")}>Grandes escolhas têm endereço.</p>
              <p style={parseStyle('font-size:13.5px;color:rgba(247,242,232,.55);line-height:1.6;margin:0;')}>Consultoria imobiliária para compra, venda, locação e investimento em imóveis de médio e alto padrão em Jundiaí, Itupeva e região.</p>
            </div>
            <div>
              <div style={parseStyle('font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#cdab6e;margin-bottom:18px;')}>A Lotus</div>
              <div style={parseStyle('display:flex;flex-direction:column;gap:12px;font-size:14.5px;color:rgba(247,242,232,.72);')}>
                <Hoverable as="a" target="_top" href="/lotus-sobre" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Sobre nós</Hoverable>
                <Hoverable as="a" target="_top" href="/lotus-corretores" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Corretores</Hoverable>
                <Hoverable as="a" target="_top" href="/lotus-recrutamento" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Seja um corretor</Hoverable>
                <Hoverable as="a" href={waLink} target="_blank" rel="noopener" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Contato</Hoverable>
              </div>
            </div>
            <div>
              <div style={parseStyle('font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#cdab6e;margin-bottom:18px;')}>Serviços</div>
              <div style={parseStyle('display:flex;flex-direction:column;gap:12px;font-size:14.5px;color:rgba(247,242,232,.72);')}>
                <Hoverable as="a" target="_top" href="/lotus-lancamentos" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Lançamentos</Hoverable>
                <Hoverable as="a" target="_top" href="/lotus-busca" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Comprar &amp; alugar</Hoverable>
                <Hoverable as="a" target="_top" href="/lotus-anunciar" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Anunciar imóvel</Hoverable>
                <Hoverable as="a" target="_top" href="/lotus-bairro" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Bairros</Hoverable>
                <Hoverable as="a" target="_top" href="/lotus-home#blog" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Blog</Hoverable>
              </div>
            </div>
            <div>
              <div style={parseStyle('font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#cdab6e;margin-bottom:18px;')}>Políticas</div>
              <div style={parseStyle('display:flex;flex-direction:column;gap:12px;font-size:14.5px;color:rgba(247,242,232,.72);')}>
                <Hoverable as="a" href="../lotus-privacidade/" target="_top" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Privacidade (LGPD)</Hoverable>
                <Hoverable as="a" href="../lotus-termos/" target="_top" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Termos de uso</Hoverable>
                <Hoverable as="a" href="../lotus-cookies/" target="_top" baseStyle={parseStyle('transition:color .2s;')} hoverStyle={parseStyle('color:#cdab6e')}>Cookies</Hoverable>
              </div>
            </div>
          </div>
          <div style={parseStyle('display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;padding-top:26px;font-size:13px;color:rgba(247,242,232,.5);')}>
            <div>{footerLegalLine()}</div>
            <div style={parseStyle('display:flex;gap:12px;align-items:center;')}>
              <Hoverable as="a" href="https://www.facebook.com/profile.php?id=61587132887416&locale=pt_BR" target="_blank" rel="noopener" aria-label="Facebook" baseStyle={parseStyle('width:40px;height:40px;border-radius:50%;border:1px solid rgba(247,242,232,.25);display:flex;align-items:center;justify-content:center;color:rgba(247,242,232,.8);transition:all .2s;')} hoverStyle={parseStyle('color:#15241c;background:#cdab6e;border-color:#cdab6e')}><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5H14z"></path></svg></Hoverable>
              <Hoverable as="a" href="https://www.youtube.com/@LotusBrokersImobili%C3%A1ria" target="_blank" rel="noopener" aria-label="YouTube" baseStyle={parseStyle('width:40px;height:40px;border-radius:50%;border:1px solid rgba(247,242,232,.25);display:flex;align-items:center;justify-content:center;color:rgba(247,242,232,.8);transition:all .2s;')} hoverStyle={parseStyle('color:#15241c;background:#cdab6e;border-color:#cdab6e')}><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12s0-3-.4-4.3a2.6 2.6 0 0 0-1.8-1.9C18 5.4 12 5.4 12 5.4s-6 0-7.8.4A2.6 2.6 0 0 0 2.4 7.7C2 9 2 12 2 12s0 3 .4 4.3a2.6 2.6 0 0 0 1.8 1.9c1.8.4 7.8.4 7.8.4s6 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.9C22 15 22 12 22 12zm-12 2.6V9.4l5 2.6-5 2.6z"></path></svg></Hoverable>
              <Hoverable as="a" href="https://www.instagram.com/lotusbrokers_/" target="_blank" rel="noopener" aria-label="Instagram" baseStyle={parseStyle('width:40px;height:40px;border-radius:50%;border:1px solid rgba(247,242,232,.25);display:flex;align-items:center;justify-content:center;color:rgba(247,242,232,.8);transition:all .2s;')} hoverStyle={parseStyle('color:#15241c;background:#cdab6e;border-color:#cdab6e')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"></circle></svg></Hoverable>
              <Hoverable as="a" href="https://www.tiktok.com/@lotusbrokers" target="_blank" rel="noopener" aria-label="TikTok" baseStyle={parseStyle('width:40px;height:40px;border-radius:50%;border:1px solid rgba(247,242,232,.25);display:flex;align-items:center;justify-content:center;color:rgba(247,242,232,.8);transition:all .2s;')} hoverStyle={parseStyle('color:#15241c;background:#cdab6e;border-color:#cdab6e')}><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.3 2.1 1.5 3.6 3.5 3.9v2.6c-1.3.1-2.5-.3-3.5-1v5.8c0 3.3-2.4 5.7-5.5 5.7A5.4 5.4 0 0 1 5 14.7c0-3 2.3-5.3 5.4-5.1v2.7c-.4-.1-.8-.2-1.2-.1-1.3.2-2.1 1.2-2 2.6.1 1.3 1.1 2.1 2.4 2 .1 0 .2 0 .3-.1 1.1-.3 1.6-1.1 1.6-2.4V3H16z"></path></svg></Hoverable>
            </div>
          </div>
        </div>
      </footer>

      <a href={waLink} target="_blank" rel="noopener" aria-label="WhatsApp" style={parseStyle('position:fixed;right:22px;bottom:22px;z-index:75;width:54px;height:54px;border-radius:50%;background:#25543b;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 34px -10px rgba(21,36,28,.6);')}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#f7f2e8"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.6-.1-.4-.1-.9-.3-1.5-.6-2.7-1.2-4.4-3.9-4.6-4.1-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2 0 .4-.1.5l-.3.4c-.2.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.4.1.6-.1l.8-.9c.2-.2.4-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.1.1.6-.1 1.2Z"></path></svg>
      </a>
    </div>
  );
}
