/**
 * `<title>` da página do imóvel (PDP), montado a partir dos campos — nunca do
 * `titulo` livre do feed.
 *
 * O título do feed já vem com preço, metragem e hífens soltos ("... - 2
 * quartos- R$310.000,00"); concatenar o preço de novo produzia "R$310.000,00,
 * R$ 310.000 | Lotus Brokers". Aqui o preço entra uma vez, formatado, e cada
 * campo ausente simplesmente não aparece — sem vírgula nem hífen sobrando.
 *
 * Forma cheia: "{Tipo} com {N} quartos em {Bairro}, {Cidade} | R$ {preço} | Lotus Brokers".
 * O trecho antes de "| Lotus Brokers" é mantido em até ~60 caracteres (65, na
 * prática), encurtando nesta ordem: sai a cidade, depois o "com", depois o
 * bairro. Tipo, quartos e preço são os últimos a cair.
 *
 * Módulo sem dependências (nem do Supabase) para o teste importar a função pura.
 */

export type CamposDoTitulo = {
  tipo_simplificado?: string | null;
  tipo?: string | null;
  quartos?: number | null;
  bairro?: string | null;
  cidade?: string | null;
  valor_venda?: number | null;
  valor_locacao?: number | null;
};

export const MARCA = 'Lotus Brokers';
// ~60 é o que o Google costuma exibir; 65 dá folga para não perder o bairro
// por um ou dois caracteres — ele vale mais no resultado do que a marca no fim.
const LIMITE = 65;

const limpo = (v: string | null | undefined) => (v ?? '').replace(/\s+/g, ' ').trim();
// O feed grava tipo_simplificado em minúsculas ("apartamento", "casa").
const capitalizado = (v: string) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : v);

/** "R$ 310.000" — sem centavos, com separador de milhar pt-BR. Locação ganha "/mês". */
export function precoDoTitulo(imovel: CamposDoTitulo): string {
  const venda = imovel.valor_venda ?? 0;
  const locacao = imovel.valor_locacao ?? 0;
  if (venda > 0) return 'R$ ' + Math.round(venda).toLocaleString('pt-BR');
  if (locacao > 0) return 'R$ ' + Math.round(locacao).toLocaleString('pt-BR') + '/mês';
  return '';
}

/** Só a parte descritiva ("Apartamento com 2 quartos em Reserva do Japy, Jundiaí"). */
function descricao(imovel: CamposDoTitulo, opcoes: { cidade: boolean; com: boolean; bairro: boolean }): string {
  const tipo = capitalizado(limpo(imovel.tipo_simplificado) || limpo(imovel.tipo)) || 'Imóvel';
  const quartos = imovel.quartos && imovel.quartos > 0 ? imovel.quartos : 0;
  const bairro = opcoes.bairro ? limpo(imovel.bairro) : '';
  const cidade = opcoes.cidade ? limpo(imovel.cidade) : '';

  let s = tipo;
  if (quartos) s += (opcoes.com ? ' com ' : ' ') + quartos + (quartos === 1 ? ' quarto' : ' quartos');
  const lugar = [bairro, cidade].filter(Boolean).join(', ');
  if (lugar) s += ' em ' + lugar;
  return s;
}

/**
 * Título completo, com a marca. Ex.: "Apartamento com 2 quartos em Reserva do
 * Japy | R$ 310.000 | Lotus Brokers".
 */
export function tituloDaPdp(imovel: CamposDoTitulo): string {
  const preco = precoDoTitulo(imovel);
  const monta = (d: string) => (preco ? `${d} | ${preco}` : d);

  const tentativas: { cidade: boolean; com: boolean; bairro: boolean }[] = [
    { cidade: true, com: true, bairro: true },
    { cidade: false, com: true, bairro: true },
    { cidade: false, com: false, bairro: true },
    { cidade: true, com: false, bairro: false },
    { cidade: false, com: false, bairro: false },
  ];
  let principal = monta(descricao(imovel, tentativas[0]));
  for (const t of tentativas) {
    principal = monta(descricao(imovel, t));
    if (principal.length <= LIMITE) break;
  }
  return `${principal} | ${MARCA}`;
}
