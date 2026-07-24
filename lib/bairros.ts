/**
 * Guias de bairro — fonte única do conteúdo editorial de /lotus-bairro.
 *
 * Bairro não é dado transacional (não vive no Supabase); é conteúdo de guia.
 * Aqui fica o texto de cada bairro. Eloy Chaves está 100% preenchido (conteúdo
 * real que já existia na página). Os demais vêm com PLACEHOLDERS marcados
 * `TODO` — a estrutura é a mesma, basta trocar os textos por bairro.
 *
 * Os imóveis de cada bairro NÃO ficam aqui: vêm do banco, filtrados por bairro
 * (ver getImoveisPorBairro em lib/imoveis.ts).
 */

export type BairroFaq = { q: string; a: string };
export type BairroGuideItem = { num: string; title: string; text: string };
export type BairroStat = { value: string; label: string };
export type BairroDado = {
  value: string;
  count: number;
  prefix?: string;
  suffix?: string;
  sep?: boolean;
  label: string;
};

export type Bairro = {
  slug: string;
  nome: string;
  cidade: string;
  /** Chamada curta do hero. */
  tagline: string;
  /** Imagem do hero (caminho em public/ ou URL). '' cai no gradiente. */
  heroImg: string;
  /** 4 mini-stats do topo. */
  stats: BairroStat[];
  /** Parágrafo TL;DR do resumo. */
  tldr: string;
  /** Guia (6 blocos numerados). */
  guide: BairroGuideItem[];
  /** Dados de mercado (contador animado). */
  dados: BairroDado[];
  /** Tipologias mais comuns (chips). */
  tipologias: string[];
  /** FAQ do bairro. */
  faq: BairroFaq[];
  /** Especialista do bairro. */
  especialista: { nome: string; creci: string; bio: string; fotoImg: string };
  /** Query do embed do Google Maps (ex "Eloy Chaves, Jundiaí, SP"). */
  mapQuery: string;
  /** Conteúdo real preenchido? (false = placeholders a revisar). */
  publicado: boolean;
};

/** Guia placeholder — mesma estrutura, textos genéricos a revisar por bairro. */
function placeholderGuide(nome: string, cidade: string): BairroGuideItem[] {
  return [
    { num: '1', title: 'Como é viver aqui', text: `TODO: descreva o dia a dia em ${nome}, ${cidade} — ritmo, perfil de morador, o que torna o bairro característico.` },
    { num: '2', title: 'Escolas', text: `TODO: escolas e creches em ${nome} e no entorno.` },
    { num: '3', title: 'Comércio e serviços', text: `TODO: comércio de bairro, mercados, farmácias e serviços do dia a dia em ${nome}.` },
    { num: '4', title: 'Transporte e acessos', text: `TODO: principais vias, rodovias e tempo até o centro de ${cidade}.` },
    { num: '5', title: 'Lazer e natureza', text: `TODO: parques, praças e áreas de lazer próximas a ${nome}.` },
    { num: '6', title: 'Segurança e infraestrutura', text: `TODO: infraestrutura e percepção de segurança em ${nome}.` },
  ];
}

/** Dados de mercado placeholder (zerados — a revisar). */
function placeholderDados(): BairroDado[] {
  return [
    { value: 'R$ —', count: 0, prefix: 'R$ ', sep: true, label: 'm² médio · compra' },
    { value: 'R$ —', count: 0, prefix: 'R$ ', label: 'm² médio · locação' },
    { value: '—%', count: 0, prefix: '+', suffix: '%', label: 'valorização · 12 meses' },
    { value: '— dias', count: 0, suffix: ' dias', label: 'tempo médio de venda' },
  ];
}

function placeholderBairro(
  slug: string,
  nome: string,
  cidade: string,
  heroImg: string
): Bairro {
  return {
    slug,
    nome,
    cidade,
    tagline: `TODO: uma linha sobre o que torna ${nome} especial em ${cidade}.`,
    heroImg,
    stats: [
      { value: 'R$ —', label: 'preço médio do m² (compra)' },
      { value: '—', label: 'perfil predominante' },
      { value: '~— min', label: `até o centro de ${cidade}` },
      { value: '~— min', label: 'até a Serra do Japi' },
    ],
    tldr: `TODO: resumo de ${nome}, ${cidade} — perfil, tipologias predominantes, faixa de preço e para quem o bairro é indicado.`,
    guide: placeholderGuide(nome, cidade),
    dados: placeholderDados(),
    tipologias: ['Casa térrea', 'Casa em condomínio', 'Sobrado', 'Apartamento'],
    faq: [
      { q: `${nome} é um bom bairro para famílias?`, a: `TODO: resposta sobre ${nome} para famílias.` },
      { q: `Quanto custa morar em ${nome}?`, a: `TODO: faixa de preço de compra e locação em ${nome}.` },
      { q: `${nome} é seguro?`, a: `TODO: percepção de segurança em ${nome}, com honestidade.` },
    ],
    especialista: {
      nome: 'Especialista Lotus',
      creci: 'CRECI —',
      bio: `TODO: nome e bio do corretor especialista em ${nome}.`,
      fotoImg: '',
    },
    mapQuery: `${nome}, ${cidade}, SP`,
    publicado: false,
  };
}

// Eloy Chaves — conteúdo real (portado do componente original).
const eloyChaves: Bairro = {
  slug: 'eloy-chaves',
  nome: 'Eloy Chaves',
  cidade: 'Jundiaí',
  tagline:
    'O bairro arborizado e tranquilo de Jundiaí, a 10 minutos da Serra do Japi — preferido de famílias que querem espaço sem abrir mão da cidade ao lado.',
  heroImg: '/gran-ville-santo-angelo/a038.jpg',
  stats: [
    { value: 'R$ 7.500', label: 'preço médio do m² (compra)' },
    { value: 'Famílias', label: 'perfil predominante' },
    { value: '~12 min', label: 'até o centro de Jundiaí' },
    { value: '~10 min', label: 'até a Serra do Japi' },
  ],
  tldr:
    'Eloy Chaves é um bairro residencial e arborizado de Jundiaí, procurado por famílias pela tranquilidade, segurança percebida e proximidade da Serra do Japi. Predominam casas e condomínios; o m² para compra fica em torno de R$ 7.500, com imóveis de R$ 600 mil a R$ 2,5 milhões. É para quem quer espaço e verde sem se afastar da cidade.',
  guide: [
    { num: '1', title: 'Como é viver aqui', text: 'Eloy Chaves tem ritmo de bairro: gente que se conhece, criança andando de bicicleta, manhã com cheiro de pão na padaria. É residencial de verdade — pouco comércio barulhento, muito verde nas ruas — mas com a cidade a poucos minutos sempre que você precisa.' },
    { num: '2', title: 'Escolas', text: 'A região é bem servida de escolas particulares e públicas de boa reputação, a maioria a 5–10 minutos. Famílias com filhos em idade escolar são parte do perfil do bairro — e isso se reflete na rotina tranquila e na procura constante.' },
    { num: '3', title: 'Comércio e serviços', text: 'Padarias, mercados de bairro, farmácias, pet shops e serviços do dia a dia estão a poucas quadras. Para compras maiores, o Maxi Shopping e o centro de Jundiaí ficam a cerca de 10 minutos de carro.' },
    { num: '4', title: 'Transporte e acessos', text: 'O acesso à Rodovia Anhanguera fica a cerca de 6 minutos, facilitando quem trabalha em Campinas ou na capital. As principais avenidas de Jundiaí conectam o bairro ao centro e à estação em poucos minutos.' },
    { num: '5', title: 'Lazer e natureza', text: 'O grande trunfo é a proximidade da Serra do Japi e dos parques da região — trilhas, ar puro e verde a cerca de 10 minutos. No bairro, praças e clubes completam o fim de semana das famílias.' },
    { num: '6', title: 'Segurança e infraestrutura', text: 'Infraestrutura consolidada: ruas asfaltadas, iluminação, saneamento. É percebido como um dos bairros mais tranquilos de Jundiaí. A Lotus fala disso com honestidade — cada trecho tem suas características, e a gente te orienta de verdade.' },
  ],
  dados: [
    { value: 'R$ 7.500', count: 7500, prefix: 'R$ ', sep: true, label: 'm² médio · compra' },
    { value: 'R$ 32', count: 32, prefix: 'R$ ', label: 'm² médio · locação' },
    { value: '+8%', count: 8, prefix: '+', suffix: '%', label: 'valorização · 12 meses' },
    { value: '68 dias', count: 68, suffix: ' dias', label: 'tempo médio de venda' },
  ],
  tipologias: ['Casa térrea', 'Casa em condomínio', 'Sobrado', 'Apartamento 3 dorms'],
  faq: [
    { q: 'Eloy Chaves é um bom bairro para famílias?', a: 'É um dos mais procurados por famílias em Jundiaí: ruas arborizadas e tranquilas, boas escolas a poucos minutos, comércio de bairro no dia a dia e a Serra do Japi e parques por perto.' },
    { q: 'Quanto custa morar em Eloy Chaves?', a: 'O m² para compra fica em torno de R$ 7.500. Casas variam de R$ 600 mil a R$ 2,5 milhões; apartamentos a partir de cerca de R$ 450 mil. Locação de casa parte de aproximadamente R$ 3.000/mês.' },
    { q: 'Quais condomínios existem em Eloy Chaves?', a: 'A região concentra condomínios de casas e loteamentos fechados, além de ruas residenciais abertas. A Marina, nossa especialista do bairro, indica o melhor para o seu perfil.' },
    { q: 'Eloy Chaves é seguro?', a: 'É percebido como um dos bairros mais tranquilos de Jundiaí, com forte presença residencial e ruas movimentadas por moradores. Como em qualquer lugar, varia por trecho — a gente te orienta com honestidade.' },
  ],
  especialista: {
    nome: 'Marina Tavares',
    creci: 'CRECI 000001-F',
    bio: 'Especialista em Eloy Chaves há mais de 8 anos. Ela mora e trabalha na região — sabe qual rua pega sol da manhã, qual escola tem vaga e onde mora a melhor padaria.',
    fotoImg: '',
  },
  mapQuery: 'Eloy Chaves, Jundiaí, SP',
  publicado: true,
};

// Ordem e imagens espelham os cards de bairro da home (LotusHome).
export const BAIRROS: Bairro[] = [
  eloyChaves,
  placeholderBairro('anhangabau', 'Anhangabaú', 'Jundiaí', '/auten-jundiai/a023.jpg'),
  placeholderBairro('malota', 'Malota', 'Jundiaí', '/forest-houses/a002.jpg'),
  placeholderBairro('medeiros', 'Medeiros', 'Jundiaí', '/vivarte/a003.jpg'),
  placeholderBairro('centro-itupeva', 'Centro', 'Itupeva', '/jardins-do-horto/a004.jpg'),
  placeholderBairro('reserva-da-serra', 'Reserva da Serra', 'Itupeva', '/altos-da-avenida/a005.png'),
  placeholderBairro('horto-florestal', 'Horto Florestal', 'Itupeva', '/vistta-castanho/a007.jpg'),
];

const BY_SLUG = new Map(BAIRROS.map((b) => [b.slug, b]));

/** Um bairro pelo slug (undefined se não existir). */
export function getBairro(slug: string): Bairro | undefined {
  return BY_SLUG.get(slug);
}

/** Todos os slugs (para generateStaticParams). */
export function bairroSlugs(): string[] {
  return BAIRROS.map((b) => b.slug);
}

/** Cards do índice (nome, cidade, tagline curta, imagem). */
export function listBairros(): Bairro[] {
  return BAIRROS;
}

/** Vizinhos de um bairro: os demais da mesma cidade (até 4). */
export function bairrosVizinhos(slug: string): Bairro[] {
  const atual = getBairro(slug);
  if (!atual) return [];
  return BAIRROS.filter((b) => b.slug !== slug && b.cidade === atual.cidade).slice(0, 4);
}
