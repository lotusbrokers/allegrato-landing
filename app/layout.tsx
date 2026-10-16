import type { Metadata } from 'next';
import { IMAGEM_COMPARTILHAMENTO, PERFIL_GOOGLE, REDES_SOCIAIS, SITE } from '@/lib/site';
import { DOMINIO_OFICIAL, siteIndexavel } from '@/lib/indexacao.mjs';
import './globals.css';
import CookieConsent from '@/components/CookieConsent';
import Analytics, { AnalyticsNoScript } from '@/components/Analytics';
import PreloadHints from '@/components/PreloadHints';

// Metadata portada de lotus-home/index.html (paridade de SEO com o estático).
// TODO go-live: revisar canonical/og:url para o domínio final e publicar sitemap/robots.
// Base para resolver URLs relativas de og:image/twitter. Vem de env
// (NEXT_PUBLIC_SITE_URL) para não hard-codar o domínio — muda por ambiente e o
// domínio final do deploy é definido lá, num só lugar. Só define metadataBase
// se a env existir (senão o Next usa o default do runtime sem quebrar o build).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

// Indexação por ambiente (SITE_INDEXABLE; ver lib/indexacao.mjs). Página que
// declara o próprio `robots` sobrescreve este meta, mas o cabeçalho
// X-Robots-Tag do next.config.mjs vale para todas — no modo noindex ele manda.
const indexavel = siteIndexavel();

// Verificação de propriedade no Google Search Console e no Bing Webmaster Tools
// pelo método da meta tag. O token do Google foi enviado pela Lotus em
// 02/10/2026 e é público por natureza: vai no HTML de toda página. A env
// GOOGLE_SITE_VERIFICATION, se existir no deploy, tem precedência, para trocar o
// token sem mexer no código. O do Bing só entra pela env. Lidas no build.
//
// A tag verifica a propriedade "Prefixo do URL". A propriedade "Domínio" do
// Search Console só aceita o registro TXT no DNS (hoje na Locaweb), com o mesmo
// valor: google-site-verification=<token>.
const TOKEN_GOOGLE = '2apuTfimrWRrWw9IY4vQTQgR7WzvE4Q1fcuR3DvMHbE';
const verificacaoGoogle = process.env.GOOGLE_SITE_VERIFICATION?.trim() || TOKEN_GOOGLE;
const verificacaoBing = process.env.BING_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  // max-image-preview:large autoriza foto grande na busca e no Discover; sem
  // ela, o Google mostra miniatura. Até 16/10/2026 só o Manawa declarava.
  robots: indexavel ? { index: true, follow: true, 'max-image-preview': 'large' } : { index: false, follow: false },
  verification: {
    ...(verificacaoGoogle ? { google: verificacaoGoogle } : {}),
    ...(verificacaoBing ? { other: { 'msvalidate.01': verificacaoBing } } : {}),
  },
  title: 'Imóveis, lançamentos e bairros em Jundiaí e Itupeva | Lotus Brokers',
  description:
    'Lotus Brokers, imobiliária moderna de Jundiaí e Itupeva, voltada para um atendimento de excelência. Lançamentos, casas, apartamentos e terrenos com especialistas que conhecem cada bairro.',
  alternates: { canonical: 'https://www.lotusbrokers.com.br/' },
  openGraph: {
    siteName: 'Lotus Brokers',
    type: 'website',
    url: 'https://www.lotusbrokers.com.br/',
    locale: 'pt_BR',
    title: 'Lotus Brokers, Imóveis em Jundiaí e Itupeva',
    description:
      'Imobiliária moderna de Jundiaí e Itupeva, com atendimento de excelência. Lançamentos e revenda com especialistas de cada bairro.',
    images: [IMAGEM_COMPARTILHAMENTO],
  },
  twitter: { card: 'summary_large_image' },
};

// JSON-LD RealEstateAgent (portado do estático).
//
// legalName, taxID, endereço, telefone, ponto no mapa, horário e perfis
// (sameAs) entram porque o Google usa esses campos para casar o site com a
// empresa no Knowledge Panel e no Perfil da Empresa. Tudo aqui tem de bater com
// o perfil: endereço, telefone e horário saem de lib/site.ts, conferidos nele.
// São invisíveis ao visitante: indexação, não conteúdo de página.
//
// O @id deixa outras marcações apontarem para esta mesma empresa (o WebSite da
// home a cita como publisher) em vez de repetir os dados.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': `${DOMINIO_OFICIAL}/#imobiliaria`,
  name: SITE.nome,
  legalName: SITE.razaoSocial,
  url: `${DOMINIO_OFICIAL}/`,
  logo: `${DOMINIO_OFICIAL}/logo-lotus-dourado.png`,
  image: IMAGEM_COMPARTILHAMENTO,
  telephone: SITE.telefone,
  // O prefixo "CNPJ " é rótulo de interface; o schema quer só o número.
  taxID: SITE.cnpj.replace(/\D/g, ''),
  description:
    'Imobiliária moderna de Jundiaí e Itupeva, voltada para um atendimento de excelência, com equipe de corretores segmentada por especialidade e por bairro.',
  areaServed: ['Jundiaí', 'Itupeva', 'Vinhedo', 'Valinhos', 'Indaiatuba'],
  address: {
    '@type': 'PostalAddress',
    streetAddress: `${SITE.logradouro}, ${SITE.bairro}`,
    addressLocality: 'Jundiaí',
    addressRegion: 'SP',
    postalCode: SITE.cep,
    addressCountry: 'BR',
  },
  geo: { '@type': 'GeoCoordinates', latitude: PERFIL_GOOGLE.latitude, longitude: PERFIL_GOOGLE.longitude },
  hasMap: PERFIL_GOOGLE.url,
  openingHoursSpecification: PERFIL_GOOGLE.horario.map((h) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: h.dias,
    opens: h.abre,
    closes: h.fecha,
  })),
  sameAs: [PERFIL_GOOGLE.url, ...REDES_SOCIAIS],
  slogan: 'Grandes histórias têm endereço.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AnalyticsNoScript />
        <PreloadHints />
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        {/* Banner de consentimento global (aparece em todas as páginas, como no
            site estático). Só renderiza se não houver cookie lotus_consent. */}
        <CookieConsent />
      </body>
    </html>
  );
}
