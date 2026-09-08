import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LotusHeader from '@/components/LotusHeader';
import RodapeLotus from '@/components/RodapeLotus';
import CardEmpreendimento from '@/components/CardEmpreendimento';
import { getLancamentosList, isListItemApresentavel } from '@/lib/lancamentos';
import { agruparPorConstrutora, comCuradasSemLancamento, construtoraPorSlug } from '@/lib/construtoras-paginas';
import { conteudoDaConstrutora, curadasSemLancamento } from '@/lib/construtoras-conteudo';

export const revalidate = 3600;

/**
 * Caixas do logo, no hero e no "Sobre".
 *
 * Duas medidas porque as marcas chegam em dois formatos, e a mesma caixa não
 * serve para os dois: a horizontal é larga e baixa, a empilhada é alta e
 * estreita. As duas têm área parecida (~28.000px² no hero, ~23.000px² no
 * "Sobre"), então as marcas pesam igual na página, que é o que importa.
 *
 * Quem usa a empilhada declara `logoVertical` em lib/construtoras-conteudo.ts.
 */
const AJUSTE = { width: 'auto', height: 'auto', display: 'block' } as const;
const CAIXA_HERO = { maxHeight: 104, maxWidth: 320, ...AJUSTE } as const;
const CAIXA_HERO_EMPILHADA = { maxHeight: 230, maxWidth: 170, ...AJUSTE } as const;
const CAIXA_SOBRE = { maxHeight: 92, maxWidth: 300, ...AJUSTE } as const;
const CAIXA_EMPILHADA = { maxHeight: 210, maxWidth: 150, ...AJUSTE } as const;

/** As construtoras vêm do banco, então a lista de rotas também. */
async function todas() {
  const lancamentos = (await getLancamentosList()).filter(isListItemApresentavel);
  return comCuradasSemLancamento(agruparPorConstrutora(lancamentos), curadasSemLancamento());
}

export async function generateStaticParams() {
  return (await todas()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = construtoraPorSlug(await todas(), slug);
  if (!c) return { title: 'Construtora não encontrada | Lotus Brokers' };

  const quantos = c.lancamentos.length;
  const cidades = [...new Set(c.lancamentos.map((l) => l.city).filter(Boolean))].join(', ');
  const url = `https://www.lotusbrokers.com.br/construtoras/${c.slug}`;
  const descricao =
    quantos > 0
      ? `${quantos} ${quantos === 1 ? 'empreendimento' : 'empreendimentos'} da ${c.nome}` +
        `${cidades ? ` em ${cidades}` : ''} com acompanhamento da Lotus Brokers. Veja plantas, condições e fale com um especialista.`
      : `Conheça a ${c.nome}, construtora parceira da Lotus Brokers em Jundiaí e região: história, números e diferenciais.`;

  return {
    title: `${c.nome}, lançamentos e empreendimentos | Lotus Brokers`,
    description: descricao,
    alternates: { canonical: url },
    openGraph: {
      siteName: 'Lotus Brokers',
      type: 'website',
      url,
      title: `${c.nome} | Lotus Brokers`,
      description: descricao,
      images: c.capa ? [c.capa.img] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function ConstrutoraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = construtoraPorSlug(await todas(), slug);
  if (!c) notFound();

  const cidades = [...new Set(c.lancamentos.map((l) => l.city).filter(Boolean))];
  const sobre = conteudoDaConstrutora(c.slug);

  // O banner enviado pela Lotus vence a capa emprestada de um empreendimento.
  const fundoDoHero = sobre?.banner ?? c.capa?.img ?? null;
  // No hero, que é escuro, só entra logo de arte clara: o negativo declarado,
  // ou o próprio logo quando ele já é negativo. Sem um dos dois, fica o nome
  // escrito, que é o que sempre esteve ali.
  const logoDoHero = sobre?.logoNegativo ?? (sobre?.logoEmFundoEscuro ? sobre.logo : null);

  const SITE = 'https://www.lotusbrokers.com.br';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: c.nome,
    url: `${SITE}/construtoras/${c.slug}`,
    ...(c.capa ? { image: c.capa.img } : {}),
    // Logo e descrição só entram quando a Lotus enviou — declarar campo vazio
    // seria pior do que não declarar.
    ...(sobre?.logo ? { logo: `${SITE}${sobre.logo}` } : {}),
    ...(sobre ? { description: sobre.paragrafos[0] } : {}),
    // makesOffer descreve o vínculo real que existe: os empreendimentos dela
    // acompanhados pela Lotus. Nada aqui é afirmação institucional sobre a
    // empresa, que o portal não tem como sustentar.
    makesOffer: c.lancamentos.map((l) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Residence', name: l.name },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <LotusHeader active="lancamentos" />

      <main style={{ background: '#f7f2e8' }}>
        {/* ---------------- Hero ---------------- */}
        {/* O padding lateral fica na <section>, e não na caixa de 1280 — que é
            como as seções de baixo fazem. Com ele dentro da caixa, o conteúdo do
            hero começava 32px à direita do "Sobre" e dos cards, e a página
            inteira parecia torta. */}
        <section style={{ position: 'relative', background: '#15241c', overflow: 'hidden', padding: '0 32px' }}>
          {fundoDoHero && (
            <img
              src={fundoDoHero}
              alt=""
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.28 }}
            />
          )}
          <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '86px 0 74px' }}>
            <Link
              href="/construtoras"
              target="_top"
              style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#b18a4a' }}
            >
              ← Construtoras
            </Link>
            {/* O logo ocupa o lugar do nome, mas dentro do <h1>: o alt carrega o
                nome, então o buscador e o leitor de tela continuam recebendo o
                título da página. Construtora sem versão clara do logo mantém o
                nome escrito. */}
            <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(32px,4.6vw,56px)', color: '#f7f2e8', lineHeight: 1.05, margin: '18px 0 16px' }}>
              {logoDoHero ? (
                <img
                  src={logoDoHero}
                  alt={c.nome}
                  style={sobre?.logoVertical ? CAIXA_HERO_EMPILHADA : CAIXA_HERO}
                />
              ) : (
                c.nome
              )}
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(247,242,232,.8)', fontWeight: 300, lineHeight: 1.55, margin: 0, maxWidth: 680 }}>
              {c.lancamentos.length > 0 ? (
                <>
                  {c.lancamentos.length} {c.lancamentos.length === 1 ? 'empreendimento acompanhado' : 'empreendimentos acompanhados'} pela Lotus
                  {cidades.length > 0 && ` em ${cidades.join(', ')}`}.
                </>
              ) : (
                'Construtora parceira da Lotus Brokers em Jundiaí e região.'
              )}
            </p>
            {/* Só creditamos a foto quando ela é a capa emprestada de um
                empreendimento. O banner enviado pela construtora não precisa —
                e dizer "Foto: Allegrato" sobre o banner dela seria errado. */}
            {!sobre?.banner && c.capa && (
              <div style={{ fontSize: 12, color: 'rgba(247,242,232,.5)', marginTop: 14 }}>
                Foto: {c.capa.empreendimento}
              </div>
            )}
          </div>
        </section>

        {/* ---------------- Sobre a construtora ----------------
            Só existe quando a Lotus enviou o texto (lib/construtoras-conteudo.ts).
            Sem ele a página segue direto para os lançamentos, sem deixar buraco
            nem preencher com texto genérico. */}
        {sobre && (
          <section style={{ padding: '74px 32px 10px' }}>
            {/* 1280 como o hero e a grade de lançamentos. Com 1000 o texto
                começava 140px à direita dos dois, e a página parecia
                desalinhada. A medida de leitura continua curta pelo maxWidth
                dos parágrafos, não pelo do container. */}
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              {/* O logo aparece UMA vez por página. Quando o hero já o mostra,
                  repetir aqui logo abaixo fica redundante. Quando o hero mostra
                  o nome escrito — porque a construtora ainda não tem versão
                  clara da marca —, é aqui que a marca aparece, e tirá-la
                  deixaria a página sem logo nenhum. */}
              {sobre.logo && !logoDoHero && (
                // Fundo claro: o logo entra nas cores da marca, sem tratamento.
                // Limitado por altura E largura: os logos chegam em formatos
                // muito diferentes — empilhados (Santa Ângela, ~2:1) e
                // horizontais (GP, ~4,5:1). Só com altura fixa o horizontal
                // saía com o dobro da largura do empilhado e dominava a seção.
                //
                // Logo negativo (arte clara) ganha uma placa escura atrás: nesta
                // seção o fundo é claro, e sem ela a marca simplesmente sumiria.
                <div
                  style={
                    sobre.logoEmFundoEscuro
                      ? { display: 'inline-block', background: '#15241c', borderRadius: 14, padding: '18px 22px', marginBottom: 30 }
                      : { marginBottom: 30 }
                  }
                >
                  <img
                    src={sobre.logo}
                    alt={c.nome}
                    style={sobre.logoVertical ? CAIXA_EMPILHADA : CAIXA_SOBRE}
                  />
                </div>
              )}
              <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(26px,3.2vw,38px)', color: '#15241c', lineHeight: 1.1, margin: '0 0 22px' }}>
                Sobre a {c.nome}
              </h2>

              {sobre.paragrafos.map((t, i) => (
                <p key={i} style={{ fontSize: 16.5, color: '#3f6249', fontWeight: 300, lineHeight: 1.65, margin: '0 0 16px', maxWidth: 760 }}>
                  {t}
                </p>
              ))}

              {sobre.numeros && sobre.numeros.length > 0 && sobre.numerosTitulo && (
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#b18a4a', marginTop: 34 }}>
                  {sobre.numerosTitulo}
                </div>
              )}
              {sobre.numeros && sobre.numeros.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
                    gap: 20,
                    margin: sobre.numerosTitulo ? '14px 0 34px' : '34px 0',
                    padding: '30px 0',
                    borderTop: '1px solid rgba(21,36,28,.12)',
                    borderBottom: '1px solid rgba(21,36,28,.12)',
                  }}
                >
                  {sobre.numeros.map((n) => (
                    <div key={n.rotulo}>
                      <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(30px,3.4vw,42px)', color: '#b18a4a', lineHeight: 1 }}>
                        {n.valor}
                      </div>
                      <div style={{ fontSize: 13.5, color: '#3f6249', marginTop: 8, letterSpacing: '.02em' }}>{n.rotulo}</div>
                    </div>
                  ))}
                </div>
              )}

              {sobre.lista && sobre.lista.itens.length > 0 && (
                <div style={{ margin: '30px 0 34px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.16em', textTransform: 'uppercase', color: '#b18a4a', marginBottom: 16 }}>
                    {sobre.lista.titulo}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 9, listStyle: 'disc', maxWidth: 760 }}>
                    {/* Como no FAQ: quando o item traz "Termo — explicação", o
                        termo vem destacado. Item sem travessão sai inteiro. */}
                    {sobre.lista.itens.map((item) => {
                      const corte = item.indexOf(' — ');
                      const termo = corte > 0 ? item.slice(0, corte) : null;
                      const resto = corte > 0 ? item.slice(corte) : item;
                      return (
                        <li key={item} style={{ fontSize: 16.5, color: '#3f6249', fontWeight: 300, lineHeight: 1.65 }}>
                          {termo && <strong style={{ fontWeight: 600, color: '#15241c' }}>{termo}</strong>}
                          {resto}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {sobre.paragrafosFinais?.map((t, i) => (
                <p key={i} style={{ fontSize: 16.5, color: '#3f6249', fontWeight: 300, lineHeight: 1.65, margin: '0 0 16px', maxWidth: 760 }}>
                  {t}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* ---------------- Lançamentos ----------------
            A única seção que sai do banco: o vínculo construtora → empreendimento
            do dashboard. O "Sobre" acima depende de texto enviado pela Lotus,
            porque esse cadastro não existe lá — ver lib/construtoras-conteudo.ts. */}
        {c.lancamentos.length > 0 && (
        <section style={{ padding: '70px 32px 90px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(26px,3.2vw,38px)', color: '#15241c', lineHeight: 1.1, margin: '0 0 8px' }}>
              Lançamentos {c.nome}
            </h2>
            <p style={{ fontSize: 15, color: '#3f6249', fontWeight: 300, margin: '0 0 34px' }}>
              Empreendimentos desta construtora com acompanhamento da Lotus.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 24 }}>
              {c.lancamentos.map((l) => (
                <CardEmpreendimento key={l.id} item={l} />
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ---------------- CTA ---------------- */}
        <section style={{ background: '#ece2cf', padding: '80px 32px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(24px,3vw,36px)', color: '#15241c', lineHeight: 1.12, margin: '0 0 14px' }}>
              Quer conhecer um empreendimento da {c.nome}?
            </h2>
            <p style={{ fontSize: 16.5, color: '#3f6249', fontWeight: 300, lineHeight: 1.6, margin: '0 0 28px' }}>
              O especialista do Squad Lançamentos analisa incorporadora, projeto, memorial e fluxo de pagamento antes de
              recomendar. Fale com ele antes de decidir.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={
                  'https://wa.me/5511926143393?text=' +
                  encodeURIComponent(`Olá! Quero conhecer os empreendimentos da ${c.nome}.`)
                }
                target="_blank"
                rel="noopener"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#b18a4a',
                  color: '#15241c',
                  fontWeight: 600,
                  fontSize: 15,
                  padding: '14px 26px',
                  borderRadius: 40,
                }}
              >
                Falar com um especialista
              </a>
              <Link
                href="/lotus-lancamentos"
                target="_top"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'transparent',
                  color: '#15241c',
                  fontWeight: 600,
                  fontSize: 15,
                  padding: '13px 25px',
                  border: '1px solid rgba(21,36,28,.25)',
                  borderRadius: 40,
                }}
              >
                Ver todos os lançamentos
              </Link>
            </div>
          </div>
        </section>
      </main>

      <RodapeLotus />
    </>
  );
}
