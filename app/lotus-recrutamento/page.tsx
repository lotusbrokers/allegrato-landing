import type { Metadata } from 'next';
import './recrutamento.css';
import LotusRecrutamento from '@/components/LotusRecrutamento';
import { PERGUNTAS_RECRUTAMENTO } from '@/lib/recrutamento';
import { IMAGEM_COMPARTILHAMENTO, SITE } from '@/lib/site';
// Página nova em 19/10/2026 (Seja-Corretor-Lotus.html): título e descrição são
// os do arquivo.
//
// A Fraunces do portal (styles/fonts.css) vai só até o peso 500, e os títulos
// desta página são 600, com eixo óptico, como o arquivo pedia ao Google Fonts.
// A fonte fica no projeto (app/_fontes), sem depender do Google no build; a
// variável alimenta --serif em recrutamento.css.
import { fraunces } from '@/app/_fontes/fraunces';

const URL_DA_PAGINA = 'https://www.lotusbrokers.com.br/lotus-recrutamento';

export const metadata: Metadata = {
  // "Vaga de corretor de imóveis em Jundiaí" desde 12/11/2026 (Radar C9: a busca hoje é
  // dos sites de vagas). "corretor de imóveis em Jundiaí" continua no título, que é o
  // que segura o 4º lugar em "trabalhar como corretor de imóveis Jundiaí".
  title: 'Vaga de corretor de imóveis em Jundiaí e Itupeva | Lotus Brokers',
  description:
    'Vaga de corretor de imóveis em Jundiaí e Itupeva: comissão até 60%, mentoria 1:1, formação completa e estrutura de marketing. Com ou sem experiência.',
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
  // O texto da vaga é o da própria página: o Google exige que bata com o que se lê.
  description:
    '<p>Vaga de corretor de imóveis na Lotus Brokers, em Jundiaí e Itupeva, com ou sem experiência.</p>' +
    '<ul><li>Comissão até 60%, com tabela transparente.</li><li>Formação completa e mentoria 1:1 até a primeira venda.</li>' +
    '<li>Marketing, CRM, fotos e material prontos.</li><li>Um bairro e uma carteira para chamar de seus.</li><li>Plano de carreira, do início ao especialista sênior.</li></ul>' +
    '<p>Para atuar é preciso CRECI; a Lotus orienta quem ainda vai tirar o seu. Candidatura pelo formulário da página, com resposta pelo WhatsApp.</p>',
  hiringOrganization: { '@type': 'Organization', name: SITE.nome, sameAs: 'https://www.lotusbrokers.com.br', logo: 'https://www.lotusbrokers.com.br/logo-lotus-dourado.png' },
  directApply: true,
  jobLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.logradouro,
      addressLocality: 'Jundiaí',
      addressRegion: 'SP',
      postalCode: SITE.cep,
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
