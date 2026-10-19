import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import './recrutamento.css';
import LotusRecrutamento from '@/components/LotusRecrutamento';
import { PERGUNTAS_RECRUTAMENTO } from '@/lib/recrutamento';
import { IMAGEM_COMPARTILHAMENTO } from '@/lib/site';

// Página nova em 19/10/2026 (Seja-Corretor-Lotus.html): título e descrição são
// os do arquivo.
//
// A Fraunces do portal (styles/fonts.css) vai só até o peso 500, e os títulos
// desta página são 600, com eixo óptico, como o arquivo pedia ao Google Fonts.
// next/font auto-hospeda a fonte (sem request a terceiro); a variável alimenta
// --serif em recrutamento.css.
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

const URL_DA_PAGINA = 'https://www.lotusbrokers.com.br/lotus-recrutamento';

export const metadata: Metadata = {
  title: 'Seja um Corretor Lotus em Jundiaí e Itupeva: carreira | Lotus Brokers',
  description:
    'Carreira de corretor de imóveis na Lotus Brokers, em Jundiaí e Itupeva. Comissão até 60%, mentoria e formação de especialista, estrutura que te tira do operacional. Com ou sem experiência.',
  alternates: { canonical: URL_DA_PAGINA },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: URL_DA_PAGINA,
    title: 'Seja um corretor Lotus, carreira de especialista',
    description:
      'Vendedor de imóveis é commodity. Especialista é escolha. Construa sua carreira com estrutura, mentoria e marketing premium.',
    images: [IMAGEM_COMPARTILHAMENTO],
  },
  twitter: { card: 'summary_large_image' },
};

const jobPostingLd = {
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: 'Corretor de imóveis especialista',
  description:
    'Vaga para corretor especialista na Lotus Brokers, com mentoria, estrutura de apoio, time de marketing e comissão até 60%.',
  hiringOrganization: { '@type': 'Organization', name: 'Lotus Brokers' },
  jobLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Jundiaí',
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
  },
  employmentType: 'CONTRACTOR',
  datePosted: '2026-01-01',
};

// Mesmas perguntas da página (lib/recrutamento.ts).
const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PERGUNTAS_RECRUTAMENTO.map((f) => ({
    '@type': 'Question',
    name: f.pergunta,
    acceptedAnswer: { '@type': 'Answer', text: f.resposta },
  })),
};

export default function LotusRecrutamentoPage() {
  return (
    <div className={fraunces.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <LotusRecrutamento />
    </div>
  );
}
