import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LotusHeader from '@/components/LotusHeader';
import RodapeLotus from '@/components/RodapeLotus';
import CardEmpreendimento from '@/components/CardEmpreendimento';
import { getLancamentosList, isListItemApresentavel } from '@/lib/lancamentos';
import { agruparPorConstrutora, construtoraPorSlug } from '@/lib/construtoras-paginas';
import { conteudoDaConstrutora } from '@/lib/construtoras-conteudo';

export const revalidate = 3600;

/** As construtoras vêm do banco, então a lista de rotas também. */
async function todas() {
  const lancamentos = (await getLancamentosList()).filter(isListItemApresentavel);
  return agruparPorConstrutora(lancamentos);
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
    `${quantos} ${quantos === 1 ? 'empreendimento' : 'empreendimentos'} da ${c.nome}` +
    `${cidades ? ` em ${cidades}` : ''} com acompanhamento da Lotus Brokers. Veja plantas, condições e fale com um especialista.`;

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
        <section style={{ position: 'relative', background: '#15241c', overflow: 'hidden' }}>
          {c.capa && (
            <img
              src={c.capa.img}
              alt={`${c.capa.empreendimento}, empreendimento da ${c.nome}`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.28 }}
            />
          )}
          <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '86px 32px 74px' }}>
            <Link
              href="/construtoras"
              target="_top"
              style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#b18a4a' }}
            >
              ← Construtoras
            </Link>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(32px,4.6vw,56px)', color: '#f7f2e8', lineHeight: 1.05, margin: '18px 0 16px' }}>
              {c.nome}
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(247,242,232,.8)', fontWeight: 300, lineHeight: 1.55, margin: 0, maxWidth: 680 }}>
              {c.lancamentos.length} {c.lancamentos.length === 1 ? 'empreendimento acompanhado' : 'empreendimentos acompanhados'} pela Lotus
              {cidades.length > 0 && ` em ${cidades.join(', ')}`}.
            </p>
            {c.capa && (
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
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              {sobre.logo && (
                // Fundo claro: o logo entra nas cores da marca, sem tratamento.
                <img
                  src={sobre.logo}
                  alt={`${c.nome}`}
                  style={{ height: 92, width: 'auto', display: 'block', marginBottom: 30 }}
                />
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
                    {sobre.lista.itens.map((item) => (
                      <li key={item} style={{ fontSize: 16.5, color: '#3f6249', fontWeight: 300, lineHeight: 1.65 }}>
                        {item}
                      </li>
                    ))}
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
