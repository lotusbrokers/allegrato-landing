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
 * O título inteiro cabe em 70 caracteres e a cidade nunca sai (auditoria do
 * site de 13/11/2026, "Título até 70 caracteres, com a cidade"). Até então o
 * trecho antes da marca ia até 65 e a cidade era a primeira a cair: o AP0693
 * saía com 78 caracteres e sem Jundiaí. Encurta nesta ordem: sai o "com",
 * depois a marca do fim (o Google já mostra o nome do site junto do
 * resultado), depois os quartos, depois o bairro (que leva os quartos e a
 * marca de volta, se couberem). Tipo, cidade e preço ficam sempre.
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
/** Limite do título inteiro, com a marca quando ela entra. */
export const LIMITE_DO_TITULO = 70;

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

type Partes = { com: boolean; quartos: boolean; bairro: boolean; marca: boolean };

/** Só a parte descritiva ("Apartamento com 2 quartos em Reserva do Japy, Jundiaí"). */
function descricao(imovel: CamposDoTitulo, partes: Partes): string {
  const tipo = capitalizado(limpo(imovel.tipo_simplificado) || limpo(imovel.tipo)) || 'Imóvel';
  const quartos = partes.quartos && imovel.quartos && imovel.quartos > 0 ? imovel.quartos : 0;
  const bairro = partes.bairro ? limpo(imovel.bairro) : '';
  const cidade = limpo(imovel.cidade);

  let s = tipo;
  if (quartos) s += (partes.com ? ' com ' : ' ') + quartos + (quartos === 1 ? ' quarto' : ' quartos');
  const lugar = [bairro, cidade].filter(Boolean).join(', ');
  if (lugar) s += ' em ' + lugar;
  return s;
}

/** Da forma cheia à mais curta; vale a primeira que couber. */
const TENTATIVAS: Partes[] = [
  { com: true, quartos: true, bairro: true, marca: true },
  { com: false, quartos: true, bairro: true, marca: true },
  { com: true, quartos: true, bairro: true, marca: false },
  { com: false, quartos: true, bairro: true, marca: false },
  { com: false, quartos: false, bairro: true, marca: false },
  { com: true, quartos: true, bairro: false, marca: true },
  { com: false, quartos: true, bairro: false, marca: true },
  { com: false, quartos: true, bairro: false, marca: false },
  { com: false, quartos: false, bairro: false, marca: false },
];

/**
 * Título da página, em até 70 caracteres. Ex.: "Casa com 4 quartos em Malota,
 * Jundiaí | R$ 2.150.000 | Lotus Brokers".
 */
export function tituloDaPdp(imovel: CamposDoTitulo): string {
  const preco = precoDoTitulo(imovel);
  const monta = (p: Partes) => [descricao(imovel, p), preco, p.marca ? MARCA : ''].filter(Boolean).join(' | ');
  for (const p of TENTATIVAS) {
    const titulo = monta(p);
    if (titulo.length <= LIMITE_DO_TITULO) return titulo;
  }
  return monta(TENTATIVAS[TENTATIVAS.length - 1]);
}
