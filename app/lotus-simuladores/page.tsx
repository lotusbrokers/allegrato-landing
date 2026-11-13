import type { Metadata } from 'next';
import Link from 'next/link';
import LotusHeader from '@/components/LotusHeader';
import RodapeLotus from '@/components/RodapeLotus';
import { IMAGEM_COMPARTILHAMENTO, SITE } from '@/lib/site';
import { ANTES_DE_SIMULAR, PERGUNTAS_SIMULADORES, SIMULADORES, SIMULADORES_CONFERIDOS_EM } from '@/lib/simuladores';

const URL_DA_PAGINA = 'https://www.lotusbrokers.com.br/lotus-simuladores';

// Hub de simuladores dos bancos (radar competitivo, 13/11/2026). Dados e
// endereços em lib/simuladores.ts.
export const metadata: Metadata = {
  title: 'Simuladores de financiamento imobiliário dos bancos | Lotus Brokers',
  description:
    'Simule o financiamento imobiliário na Caixa, no Banco do Brasil, no Itaú, no Bradesco e no Santander, e veja o que ter em mãos para comparar as condições.',
  alternates: { canonical: URL_DA_PAGINA },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: URL_DA_PAGINA,
    title: 'Simuladores de financiamento imobiliário dos bancos',
    description: 'Os simuladores oficiais da Caixa, do Banco do Brasil, do Itaú, do Bradesco e do Santander, num lugar só.',
    images: [IMAGEM_COMPARTILHAMENTO],
  },
  twitter: { card: 'summary_large_image' },
};

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PERGUNTAS_SIMULADORES.map((p) => ({
    '@type': 'Question',
    name: p.q,
    acceptedAnswer: { '@type': 'Answer', text: p.a },
  })),
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.lotusbrokers.com.br/' },
    { '@type': 'ListItem', position: 2, name: 'Simuladores de financiamento', item: URL_DA_PAGINA },
  ],
};

const WHATSAPP = `https://wa.me/${SITE.telefone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Quero ajuda para simular e comparar o financiamento do meu imóvel.')}`;

const conferidoEm = new Date(`${SIMULADORES_CONFERIDOS_EM}T12:00:00-03:00`).toLocaleDateString('pt-BR');

const S = {
  eyebrow: { fontSize: 13, fontWeight: 600, letterSpacing: '.18em', textTransform: 'uppercase', color: '#b18a4a', margin: '0 0 16px' },
  h2: { fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(24px,3vw,36px)', color: '#15241c', lineHeight: 1.1, margin: '0 0 22px' },
  texto: { fontSize: 16, color: '#3f6249', fontWeight: 300, lineHeight: 1.65, margin: 0 },
} as const;

export default function SimuladoresPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <LotusHeader active="comprar" />

      <main style={{ background: '#f7f2e8' }}>
        <section style={{ padding: '72px 32px 40px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <p style={S.eyebrow}>Financiamento</p>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontWeight: 300, fontSize: 'clamp(32px,4.6vw,54px)', color: '#15241c', lineHeight: 1.05, letterSpacing: '-.02em', margin: '0 0 18px' }}>
              Simuladores de financiamento imobiliário
            </h1>
            <p style={{ ...S.texto, fontSize: 17.5, maxWidth: 720 }}>
              Antes de escolher o imóvel, simule nos bancos: cada um tem taxa, prazo e regra próprios. Aqui estão os
              simuladores oficiais dos principais bancos do crédito imobiliário e o que ter em mãos para a simulação
              sair perto da realidade.
            </p>
          </div>
        </section>

        <section style={{ padding: '8px 32px 64px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 18 }}>
            {SIMULADORES.map((s) => (
              <div key={s.banco} style={{ background: '#fff', borderRadius: 18, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: '0 16px 40px -34px rgba(21,36,28,.3)' }}>
                <h2 style={{ fontFamily: "'Fraunces',serif", fontWeight: 400, fontSize: 24, color: '#15241c', margin: 0 }}>{s.banco}</h2>
                <p style={{ ...S.texto, fontSize: 14.5, flex: 1 }}>{s.nota}</p>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ alignSelf: 'flex-start', background: '#1d3a2c', color: '#f7f2e8', fontWeight: 600, fontSize: 14.5, padding: '11px 20px', borderRadius: 40, textDecoration: 'none' }}
                >
                  Simular no site do banco ↗
                </a>
              </div>
            ))}
          </div>
          <p style={{ ...S.texto, fontSize: 13.5, maxWidth: 1080, margin: '18px auto 0' }}>
            Os simuladores são dos próprios bancos e abrem em nova aba: a Lotus não recebe o que você digita lá.
            Endereços conferidos em {conferidoEm}.
          </p>
        </section>

        <section style={{ background: '#fff', padding: '72px 32px' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <p style={S.eyebrow}>Antes de simular</p>
            <h2 style={S.h2}>O que ter em mãos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '22px 36px' }}>
              {ANTES_DE_SIMULAR.map((item) => (
                <div key={item.titulo}>
                  <h3 style={{ fontSize: 16.5, fontWeight: 600, color: '#15241c', margin: '0 0 6px' }}>{item.titulo}</h3>
                  <p style={{ ...S.texto, fontSize: 15 }}>{item.texto}</p>
                </div>
              ))}
            </div>
            <p style={{ ...S.texto, marginTop: 34, maxWidth: 760 }}>
              Para comparar as simulações, olhe o Custo Efetivo Total (CET), e não só a taxa de juros. O passo a passo
              está no guia{' '}
              <Link href="/lotus-blog/como-financiar-o-primeiro-imovel" style={{ color: '#1d3a2c', fontWeight: 600 }}>
                como financiar a compra do seu primeiro imóvel
              </Link>
              ; se o imóvel é na planta, veja também{' '}
              <Link href="/lotus-blog/como-financiar-lancamento-imobiliario" style={{ color: '#1d3a2c', fontWeight: 600 }}>
                como funciona o financiamento na planta
              </Link>
              .
            </p>
          </div>
        </section>

        <section style={{ padding: '72px 32px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <h2 style={S.h2}>Perguntas sobre simulação</h2>
            {/* <details> deixa a resposta no HTML, escondida pelo navegador, sem JavaScript. */}
            {PERGUNTAS_SIMULADORES.map((p) => (
              <details key={p.q} style={{ borderBottom: '1px solid rgba(21,36,28,.12)', padding: '18px 0' }}>
                <summary style={{ fontSize: 16.5, fontWeight: 500, color: '#15241c', cursor: 'pointer' }}>{p.q}</summary>
                <p style={{ ...S.texto, fontSize: 15, marginTop: 12 }}>{p.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section style={{ background: '#1d3a2c', padding: '72px 32px', textAlign: 'center' }}>
          <h2 style={{ ...S.h2, color: '#f7f2e8', margin: '0 0 14px' }}>Prefere comparar com um especialista?</h2>
          <p style={{ ...S.texto, color: 'rgba(247,242,232,.8)', margin: '0 auto 26px', maxWidth: 560 }}>
            Um especialista da Lotus compara as condições dos bancos com você, junto dos correspondentes bancários
            parceiros, sem custo adicional.
          </p>
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#cdab6e', color: '#15241c', fontWeight: 600, fontSize: 15.5, padding: '14px 28px', borderRadius: 40, textDecoration: 'none' }}>
            Quero comparar com um especialista
          </a>
        </section>
      </main>

      <RodapeLotus />
    </>
  );
}
