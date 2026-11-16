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
