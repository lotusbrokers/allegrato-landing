/**
 * Título e descrição de busca da página do condomínio (/lotus-condominio/<slug>).
 * Módulo puro: a rota e o teste importam daqui.
 */
import { descricaoComNome } from './descricao-com-nome';
import { resumoDescricao } from './resumo-imovel';

/**
 * A forma mais completa que cabe em 70 caracteres, sempre com a cidade.
 * Até 16/11/2026 era uma forma só ("<nome>, <cidade>, guia do condomínio e
 * imóveis | Lotus Brokers"), e 46 dos 78 condomínios passavam de 70 no
 * diagnóstico de indexação (seo-data/diagnostico.csv).
 */
export function tituloDoCondominio(nome: string, cidade: string): string {
  const base = `${nome.trim().replace(/\s+/g, ' ')}, ${cidade}`;
  const formas = [
    `${base}: guia do condomínio e imóveis | Lotus Brokers`,
    `${base}: guia do condomínio | Lotus Brokers`,
    `${base} | Lotus Brokers`,
    base,
  ];
  return formas.find((t) => t.length <= 70) ?? formas[formas.length - 1];
}

/**
 * Descrição de busca com o nome do condomínio no trecho que o Google mostra.
 *
 * A pergunta "o texto já cita o nome?" vale no RESUMO, não no texto inteiro.
 * Com o texto inteiro, o Ecovillage I e o Ecovillage II, que têm a mesma
 * descrição na Dash e só citam o número depois do corte, saíam com a mesma
 * meta description (diagnóstico de 16/11/2026). O resumo já deixa espaço para
 * o nome na frente, então o total não passa do limite.
 */
export function descricaoDoCondominio(texto: string, nome: string, limite = 155): string {
  const n = nome.trim().replace(/\s+/g, ' ');
  return descricaoComNome(resumoDescricao(texto, limite - n.length - 2), n);
}

export type DadosDoCondominio = {
  nome: string;
  bairro: string | null;
  cidade: string | null;
  /** Rótulos das comodidades, na ordem de preferência (comodidadesParaABusca). */
  comodidades: string[];
  /** Imóveis à venda no condomínio (os que a página pode mostrar). */
  imoveisAVenda: number;
  /** Menor preço entre eles, em reais; null quando nenhum tem preço. */
  menorPreco: number | null;
};

/**
 * Preço curto e sem arredondar para cima: o "a partir de" não pode prometer
 * menos do que o imóvel mais barato custa. 467.642 -> "R$ 467 mil";
 * 1.234.567 -> "R$ 1,23 milhão".
 */
export function valorCurto(valor: number): string {
  if (valor >= 1e6) {
    const milhoes = Math.floor(valor / 1e4) / 100;
    return `R$ ${String(milhoes).replace('.', ',')} ${milhoes < 2 ? 'milhão' : 'milhões'}`;
  }
  return `R$ ${Math.floor(valor / 1e3)} mil`;
}

/** "a", "a e b", "a, b e c", em minúscula para entrar no meio da frase. */
function listaEmFrase(itens: string[]): string {
  const minusculas = itens.map((item) => item.charAt(0).toLowerCase() + item.slice(1));
  return minusculas.length > 1 ? `${minusculas.slice(0, -1).join(', ')} e ${minusculas[minusculas.length - 1]}` : minusculas[0];
}

const FECHO = 'Guia com fotos, mapa e corretor da Lotus.';

/**
 * Descrição de busca feita com os dados do condomínio, no lugar do texto de
 * divulgação da Dashboard (N15 da auditoria de 25/11/2026). O Mirante tinha 951
 * impressões e 0,6% de cliques com "O Residencial Mirante é sua última
 * oportunidade de morar...": a frase não dizia onde fica nem o que a página tem.
 *
 * Leva, nesta ordem: nome, bairro e cidade; imóveis à venda e o menor preço;
 * até 3 comodidades; e o que a página traz. Some primeiro o fecho e depois as
 * comodidades, até caber no limite.
 *
 * Devolve null quando não há nada além da cidade (sem bairro, comodidade nem
 * imóvel): aí a rota usa o texto da Dashboard (descricaoDoCondominio).
 */
export function descricaoComDados(d: DadosDoCondominio, limite = 155): string | null {
  const limpar = (s: string | null) => s?.trim().replace(/\s+/g, ' ') || null;
  const nome = limpar(d.nome) ?? '';
  const cidade = limpar(d.cidade);
  // Há cadastros com o próprio condomínio no campo bairro ("Residencial Pecan",
  // "Condomínio Reserva da Serra"): aí o bairro não diz nada e fica de fora.
  const comparavel = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^condominio\s+/, '');
  const bairroCru = limpar(d.bairro);
  const bairro =
    bairroCru && !comparavel(nome).includes(comparavel(bairroCru)) && !comparavel(bairroCru).includes(comparavel(nome))
      ? bairroCru
      : null;
  if (!bairro && d.comodidades.length === 0 && d.imoveisAVenda === 0) return null;

  const onde = [bairro && `no bairro ${bairro}`, cidade && `em ${cidade}`].filter(Boolean).join(', ');
  const jaDizCondominio = /^condom[ií]nio\b/i.test(nome);
  const abertura = !onde ? nome : jaDizCondominio ? `${nome}, ${onde}` : `${nome}, condomínio ${onde}`;
  const precoValido = d.menorPreco !== null && d.menorPreco >= 1000;
  const venda =
    d.imoveisAVenda > 0
      ? `${d.imoveisAVenda} ${d.imoveisAVenda === 1 ? 'imóvel' : 'imóveis'} à venda${precoValido ? ` a partir de ${valorCurto(d.menorPreco as number)}` : ''}`
      : '';
  const inicio = venda ? `${abertura}: ${venda}.` : `${abertura}.`;

  for (let qtd = Math.min(3, d.comodidades.length); qtd >= 0; qtd--) {
    const comodidades = qtd > 0 ? ` Com ${listaEmFrase(d.comodidades.slice(0, qtd))}.` : '';
    for (const fecho of [` ${FECHO}`, '']) {
      const texto = `${inicio}${comodidades}${fecho}`;
      if (texto.length <= limite) return texto;
    }
  }
  return inicio.length <= limite ? inicio : abertura;
}
