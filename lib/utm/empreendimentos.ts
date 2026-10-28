/**
 * Empreendimentos e construtoras do UTM Manager.
 *
 * Os empreendimentos que o site já conhece (lançamentos da Dashboard com
 * página no portal) não são recadastrados: nome, construtora, endereço da
 * página e região vêm do catálogo do site a cada leitura. Aqui guardamos só o
 * que é da equipe de marketing (categoria, status e observações) e os
 * empreendimentos cadastrados à mão, como páginas institucionais.
 */
import type { Construtora, Empreendimento, EmpreendimentoGuardado } from './tipos';

/** O mínimo que o catálogo do site precisa dar (ver lib/lancamentos.ts, LancamentoListItem). */
export type ItemDoCatalogo = {
  slug: string;
  nome: string;
  construtora: string;
  /** Caminho da página no site ("/allegrato"), ou null quando não há página. */
  caminho: string | null;
  bairro: string;
  cidade: string;
};

export function idDoSite(slug: string): string {
  return `site:${slug}`;
}

export function listarEmpreendimentos(catalogo: ItemDoCatalogo[], guardados: Record<string, EmpreendimentoGuardado>, origemDoSite: string): Empreendimento[] {
  const doSite: Empreendimento[] = catalogo.map((item) => {
    const id = idDoSite(item.slug);
    const ajuste = guardados[id];
    return {
      id,
      origem: 'site',
      nome: item.nome,
      construtora: item.construtora,
      categoria: ajuste?.categoria ?? '',
      url: item.caminho ? `${origemDoSite}${item.caminho}` : '',
      regiao: [item.bairro, item.cidade].filter(Boolean).join(', '),
      status: ajuste?.status ?? 'ativo',
      observacoes: ajuste?.observacoes ?? '',
    };
  });
  const manuais = Object.values(guardados).filter((g): g is Empreendimento & { origem: 'manual' } => g.origem === 'manual');
  return [...doSite, ...manuais].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/** Construtoras citadas nos empreendimentos mais as cadastradas aqui, sem repetir. */
export function listarConstrutoras(empreendimentos: Empreendimento[], cadastradas: Record<string, Construtora>): string[] {
  const nomes = new Set<string>();
  for (const e of empreendimentos) if (e.construtora.trim()) nomes.add(e.construtora.trim());
  for (const c of Object.values(cadastradas)) nomes.add(c.nome.trim());
  return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/** Host e caminho comparáveis: sem www, sem barra no fim, sem query nem fragmento. */
function enderecoComparavel(url: string): string | null {
  try {
    const u = new URL(url.trim());
    return `${u.hostname.replace(/^www\./, '').toLowerCase()}${u.pathname.replace(/\/+$/, '').toLowerCase()}`;
  } catch {
    return null;
  }
}

/**
 * Empreendimento cuja página é exatamente a URL de destino. É a única
 * associação automática: o nome da campanha não serve, porque "Lançamento
 * Jundiaí" pode ser qualquer um. Duas páginas iguais (cadastro repetido) não
 * associam nada: na dúvida, a escolha fica com a equipe.
 */
export function empreendimentoPelaUrl(url: string | undefined, empreendimentos: Empreendimento[]): string | null {
  if (!url) return null;
  const alvo = enderecoComparavel(url);
  if (!alvo) return null;
  const achados = empreendimentos.filter((e) => e.url && e.status === 'ativo' && enderecoComparavel(e.url) === alvo);
  return achados.length === 1 ? achados[0].id : null;
}

export type DadosDoEmpreendimento = Omit<Empreendimento, 'id' | 'origem'>;

/** Confere o formulário do empreendimento manual; o do site só aceita os campos da equipe. */
export function validarEmpreendimento(dados: DadosDoEmpreendimento, categorias: string[], manual: boolean): string[] {
  const erros: string[] = [];
  if (manual) {
    if (!dados.nome.trim()) erros.push('Informe o nome do empreendimento.');
    if (dados.nome.length > 120) erros.push('Nome com mais de 120 caracteres.');
    if (dados.construtora.length > 120) erros.push('Construtora com mais de 120 caracteres.');
    if (dados.regiao.length > 120) erros.push('Região com mais de 120 caracteres.');
    if (dados.url.trim()) {
      const endereco = enderecoComparavel(dados.url);
      if (!endereco || !/^https?:\/\//i.test(dados.url.trim())) erros.push('A URL oficial precisa começar com https:// e ser um endereço válido.');
    }
  }
  if (dados.categoria && !categorias.includes(dados.categoria)) erros.push('Categoria fora da lista configurada.');
  if (dados.status !== 'ativo' && dados.status !== 'inativo') erros.push('Status inválido.');
  if (dados.observacoes.length > 1000) erros.push('Observações com mais de 1000 caracteres.');
  return erros;
}
