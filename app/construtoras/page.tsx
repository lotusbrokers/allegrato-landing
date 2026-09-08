import type { Metadata } from 'next';
import Link from 'next/link';
import LotusHeader from '@/components/LotusHeader';
import RodapeLotus from '@/components/RodapeLotus';
import AbasLancamentos from '@/components/AbasLancamentos';
import SliderConstrutoras from '@/components/SliderConstrutoras';
import { getLancamentosList, isListItemApresentavel } from '@/lib/lancamentos';
import { agruparPorConstrutora, comCuradasSemLancamento } from '@/lib/construtoras-paginas';
import { curadasSemLancamento } from '@/lib/construtoras-conteudo';

// Mesmo ISR das demais rotas do portal.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Construtoras parceiras da Lotus em Jundiaí e Itupeva | Lotus Brokers',
  description:
    'Conheça as construtoras e incorporadoras com empreendimentos acompanhados pela Lotus Brokers em Jundiaí, Itupeva e região, e veja os lançamentos de cada uma.',
  alternates: { canonical: 'https://www.lotusbrokers.com.br/construtoras' },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: 'https://www.lotusbrokers.com.br/construtoras',
    title: 'Construtoras parceiras da Lotus Brokers',
    description:
      'As construtoras por trás dos empreendimentos que a Lotus acompanha em Jundiaí, Itupeva e região.',
  },
  twitter: { card: 'summary_large_image' },
};

export default async function ConstrutorasPage() {
  // A mesma fonte da listagem de lançamentos, com o mesmo filtro de
  // apresentável: uma construtora não deve aparecer aqui por causa de um
  // cadastro pela metade que nem chega a ser exibido em /lotus-lancamentos.
  const lancamentos = (await getLancamentosList()).filter(isListItemApresentavel);
  // Junto das que vêm dos lançamentos entram as que só têm conteúdo curado —
  // a view portal_lancamentos não expõe os lançamentos de todas as construtoras
  // do dashboard, e sem isto essas ficariam sem página mesmo com texto pronto.
  const construtoras = comCuradasSemLancamento(agruparPorConstrutora(lancamentos), curadasSemLancamento());

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Construtoras parceiras da Lotus Brokers',
    description:
      'Construtoras e incorporadoras com empreendimentos acompanhados pela Lotus Brokers em Jundiaí, Itupeva e região.',
    hasPart: construtoras.map((c) => ({
      '@type': 'Organization',
      name: c.nome,
      url: `https://www.lotusbrokers.com.br/construtoras/${c.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <LotusHeader active="lancamentos" />

      <main style={{ background: '#f7f2e8' }}>
        <section style={{ background: '#15241c', padding: '86px 32px 74px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#b18a4a', marginBottom: 18 }}>
              Quem constrói
            </div>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(30px,4vw,50px)', color: '#f7f2e8', lineHeight: 1.06, margin: '0 0 18px', maxWidth: 780 }}>
              As construtoras por trás dos empreendimentos que acompanhamos.
            </h1>
            <p style={{ fontSize: 17, color: 'rgba(247,242,232,.78)', fontWeight: 300, lineHeight: 1.55, margin: 0, maxWidth: 680 }}>
              Antes de recomendar um lançamento, o Squad Lançamentos analisa quem está construindo. Aqui você vê cada
              construtora e todos os empreendimentos dela que a Lotus acompanha.
            </p>
          </div>
        </section>

        <section style={{ padding: '70px 32px 100px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {/* Vitrine curada da Lotus, antes da lista completa. */}
            <SliderConstrutoras />
            {/* A mesma dupla de abas de /lotus-lancamentos, aqui com a outra ativa. */}
            <AbasLancamentos ativa="construtoras" />
            <div style={{ fontSize: 13.5, color: '#8aa593', marginBottom: 26 }}>
              {construtoras.length} {construtoras.length === 1 ? 'construtora' : 'construtoras'}
            </div>

            {construtoras.length === 0 ? (
              <p style={{ fontSize: 16, color: '#3f6249' }}>
                Nenhuma construtora informada nos empreendimentos publicados no momento.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 24 }}>
                {construtoras.map((c) => (
                  <Link
                    key={c.slug}
                    className="lt-card-emp"
                    href={`/construtoras/${c.slug}`}
                    target="_top"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      background: '#fff',
                      borderRadius: 18,
                      overflow: 'hidden',
                      boxShadow: '0 16px 40px -32px rgba(21,36,28,.34)',
                    }}
                  >
                    <div style={{ position: 'relative', aspectRatio: '4 / 3', background: '#1d3a2c' }}>
                      {c.capa && (
                        <img
                          src={c.capa.img}
                          alt={`${c.capa.empreendimento}, empreendimento da ${c.nome}`}
                          loading="lazy"
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 400, fontSize: 23, color: '#15241c', margin: '0 0 6px', lineHeight: 1.05 }}>
                        {c.nome}
                      </h2>
                      <div style={{ fontSize: 13.5, color: '#3f6249' }}>
                        {c.lancamentos.length > 0
                          ? c.lancamentos.length + (c.lancamentos.length === 1 ? ' empreendimento' : ' empreendimentos') + ' com a Lotus'
                          : 'Conheça a construtora'}
                      </div>
                      {/* A foto é de um empreendimento, não da construtora. Dizer
                          isso evita que ela passe por imagem institucional. */}
                      {c.capa && (
                        <div style={{ fontSize: 12, color: '#8aa593', marginTop: 6 }}>Foto: {c.capa.empreendimento}</div>
                      )}
                      <div
                        style={{
                          marginTop: 'auto',
                          borderTop: '1px solid rgba(21,36,28,.08)',
                          paddingTop: 16,
                          fontSize: 13,
                          color: '#b18a4a',
                          fontWeight: 600,
                        }}
                      >
                        Ver a construtora →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <RodapeLotus />
    </>
  );
}
