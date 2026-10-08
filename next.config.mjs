import { siteIndexavel } from './lib/indexacao.mjs';

// Indexação por ambiente — a mesma regra de app/layout.tsx (meta robots) e
// app/robots.ts (robots.txt). Lida no build: mudar SITE_INDEXABLE pede deploy.
const indexavel = siteIndexavel();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Domínio sem www responde 200 com o mesmo conteúdo (o proxy entrega os dois
  // hosts a este servidor). Canonical já apontava para o www, mas o certo é o
  // redirect: um endereço só, sem depender de o robô honrar o canonical.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'lotusbrokers.com.br' }],
        destination: 'https://www.lotusbrokers.com.br/:path*',
        permanent: true,
      },
    ];
  },
  // X-Robots-Tag vale para toda resposta, inclusive as landings estáticas de
  // public/ e as páginas que declaram o próprio meta robots. No modo
  // indexável não emite nada: o padrão do robô já é indexar.
  //
  // Cache longo para public/<landing>/midia/: fotos, fontes e scripts das
  // landings desempacotadas (scripts/desempacotar-landing.mjs). O nome de cada
  // arquivo é o hash do próprio conteúdo, então uma URL nunca muda de conteúdo
  // — sem isto o Next manda max-age=0 e o navegador confere cada foto de novo
  // a cada visita.
  async headers() {
    const midia = {
      source: '/:landing/midia/:arquivo*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    };
    if (indexavel) return [midia];
    return [midia, { source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
  images: {
    // Quanto tempo vale a foto otimizada (/_next/image) antes de ser refeita.
    // O padrão do Next 15 é 60 s: passado um minuto, toda foto pedida de novo
    // era redimensionada outra vez, e o servidor (o mesmo do Dashboard) vivia
    // ocupado com isso. Em 08/10/2026 as fotos da busca levavam até 12 s e
    // pareciam sumidas. Vencido o prazo, o visitante recebe a versão guardada
    // e a nova é feita por trás. Foto trocada no MESMO endereço leva até um
    // dia para aparecer; para trocar já, use um nome de arquivo novo.
    minimumCacheTTL: 86400,
    // As fotos vêm de hosts externos (watermark do dash, Storage Supabase, CDNs
    // usados nas landings). Liberamos os hosts conhecidos; ampliar conforme surgirem.
    remotePatterns: [
      { protocol: 'https', hostname: 'octodash-octo-dash.fltgo5.easypanel.host' },
      { protocol: 'https', hostname: 'glbtwvusiaaovllxhiig.supabase.co' },
      { protocol: 'https', hostname: 'i.postimg.cc' },
      { protocol: 'https', hostname: 'vvcconstrutora.com.br' },
    ],
  },
  // Landings publicadas como HTML, não como componente React.
  //
  // As 23 landings antigas foram convertidas uma a uma para React (ver o
  // cabeçalho de qualquer componente em components/). Estas vão ao ar como
  // HTML, servidas de public/<slug>/index.html numa URL limpa.
  //
  // Todas chegaram como bundle auto-extraível (formato dc-runtime, o mesmo das
  // 23) ou, a Oásis, como HTML com as fotos coladas em data URI — de 0,7 a
  // 9,6 MB por página, o que deixava o site inteiro lento. Foram DESEMPACOTADAS:
  // fotos, fontes e scripts viraram arquivos em public/<slug>/midia/.
  // Desempacotar em vez de portar preserva o layout exatamente como o cliente
  // aprovou.
  //
  // - Reserva Castanheira e Santorini: desempacotadas à mão, antes do script.
  // - As outras 11, em 06/10/2026, por scripts/desempacotar-landing.mjs (ver o
  //   cabeçalho dele): mesmo texto, links e formulários do bundle, conferidos
  //   página a página. Se uma landing chegar de novo como bundle, é só rodá-lo.
  //
  // Os scripts da Lotus no fim de cada página (rodapé, atalhos, correções)
  // ainda observam o documento com MutationObserver, herança do tempo em que
  // o bundle trocava o documento inteiro no load; em página comum são
  // inofensivos e continuam idênticos aos de Santorini e Reserva Castanheira.
  //
  // O que elas NÃO herdam por não serem React: cabeçalho e rodapé do portal,
  // botão flutuante de volta para /lotus-lancamentos e o banner de cookies.
  // Ao convertê-las para componente, apagar a entrada aqui e criar app/<slug>/.
  async rewrites() {
    return [
      { source: '/altissimi', destination: '/altissimi/index.html' },
      { source: '/oasis', destination: '/oasis/index.html' },
      { source: '/vila-triunfo', destination: '/vila-triunfo/index.html' },
      { source: '/reserva-castanheira', destination: '/reserva-castanheira/index.html' },
      { source: '/santorini', destination: '/santorini/index.html' },
      { source: '/epic-jundiai', destination: '/epic-jundiai/index.html' },
      { source: '/mistral-jundiai', destination: '/mistral-jundiai/index.html' },
      { source: '/gioviale', destination: '/gioviale/index.html' },
      { source: '/lago-samambaia', destination: '/lago-samambaia/index.html' },
      { source: '/villaggio-engordadouro', destination: '/villaggio-engordadouro/index.html' },
      { source: '/reserva-di-medeiros', destination: '/reserva-di-medeiros/index.html' },
      { source: '/edificio-trend', destination: '/edificio-trend/index.html' },
      { source: '/auten-serrah', destination: '/auten-serrah/index.html' },
    ];
  },
};

export default nextConfig;
