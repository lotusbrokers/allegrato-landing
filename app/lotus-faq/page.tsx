import type { Metadata } from 'next';
import LotusFaq from '@/components/LotusFaq';
import { FAQ, respostaEmTexto } from '@/lib/faq';

// ISR igual ao das demais rotas do portal. O conteúdo é estático (vem de
// lib/faq.ts), mas manter o mesmo padrão evita uma exceção para explicar depois.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Perguntas frequentes sobre comprar e vender imóvel em Jundiaí | Lotus Brokers',
  description:
    'Respostas diretas sobre comprar, financiar, vender e investir em imóveis em Jundiaí e Itupeva: documentação, lançamentos, FGTS, ITBI, bairros e suporte jurídico.',
  alternates: {
    canonical: 'https://www.lotusbrokers.com.br/lotus-faq',
  },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: 'https://www.lotusbrokers.com.br/lotus-faq',
    title: 'Perguntas frequentes, Lotus Brokers',
    description:
      'Tudo que você precisa saber antes de comprar, financiar ou vender em Jundiaí e Itupeva, respondido sem enrolação.',
    images: [
      'https://i.postimg.cc/nzx1wvHM/Chat-GPT-Image-25-de-jun-de-2026-14-04-13.png',
    ],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

/**
 * FAQPage do schema.org, montado no servidor.
 *
 * Estava sendo injetado por useEffect dentro do componente, o que só o criava
 * depois da hidratação — o buscador que lê o HTML servido não encontrava
 * pergunta nenhuma. Aqui ele sai no HTML, como os JSON-LD de
 * /lotus-lancamentos já fazem.
 *
 * `respostaEmTexto` junta parágrafo, lista e fechos: mandar só o parágrafo de
 * abertura deixaria de fora justamente o conteúdo das respostas em lista.
 */
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: respostaEmTexto(f) },
  })),
};

export default function LotusFaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <LotusFaq />
    </>
  );
}
