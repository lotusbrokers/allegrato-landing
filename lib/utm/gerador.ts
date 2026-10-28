/**
 * Geração dos parâmetros de UTM a partir do padrão configurado, nos dois modos.
 *
 * Modo dinâmico: o texto para o campo "Parâmetros de URL" do Meta Ads, com as
 * macros, que a Meta troca pelo valor no clique. É o modo de quem configura o
 * anúncio, e serve para todos os anúncios.
 *
 * Modo estático: um link pronto, com os valores que se conhecem do registro
 * (nome e ID da campanha, do conjunto e do anúncio). Serve para link fora do
 * Meta Ads, como bio ou WhatsApp. Macro sem valor conhecido não é inventada:
 * a pessoa informa, ou o link não é gerado.
 */
import { parametrosDoPadrao } from './configuracao';
import type { Configuracao, DadosImportados } from './tipos';
import {
  analisarUrl,
  montarUrl,
  resolverMacros,
  textoDosParametros,
  urlComParametrosDaMeta,
  type Conflito,
  type ParametroNovo,
  type ValoresConhecidos,
} from './url';

export function valoresDoRegistro(dados: DadosImportados): ValoresConhecidos {
  return {
    'campaign.id': dados.campanhaId,
    'campaign.name': dados.campanhaNome,
    'adset.id': dados.conjuntoId,
    'adset.name': dados.conjuntoNome,
    'ad.id': dados.anuncioId,
    'ad.name': dados.anuncioNome,
  };
}

export type ModoDinamico = {
  /** O texto para colar em "Parâmetros de URL". */
  parametros: string;
  /** Como o link fica depois que a Meta junta tudo (com as macros ainda por trocar). */
  previa: string | null;
  /** UTM que já está na URL de destino: a Meta somaria as duas e o relatório receberia o parâmetro repetido. */
  conflitosNaUrl: Conflito[];
  erro: string | null;
};

export function gerarDinamico(configuracao: Configuracao, urlDestino: string | undefined): ModoDinamico {
  const parametros = parametrosDoPadrao(configuracao).map((p) => ({ chave: p.chave, valor: p.valor }));
  const texto = textoDosParametros(parametros);
  if (!urlDestino?.trim()) return { parametros: texto, previa: null, conflitosNaUrl: [], erro: null };
  const analise = analisarUrl(urlDestino);
  if (!analise.ok) return { parametros: texto, previa: null, conflitosNaUrl: [], erro: analise.erro };
  const chaves = new Set(parametros.map((p) => p.chave.toLowerCase()));
  const conflitosNaUrl = analise.url.parametros
    .filter((p) => chaves.has(p.chave.toLowerCase()))
    .map((p) => ({ chave: p.chave, atual: p.valor, novo: parametros.find((n) => n.chave.toLowerCase() === p.chave.toLowerCase())?.valor ?? '' }));
  return { parametros: texto, previa: urlComParametrosDaMeta(urlDestino.trim(), texto), conflitosNaUrl, erro: null };
}

export type ModoEstatico = {
  url: string | null;
  /** Macros sem valor conhecido, por parâmetro. Com alguma, o link não sai. */
  faltando: { chave: string; macros: string[] }[];
  conflitos: Conflito[];
  erro: string | null;
};

/** Decisão sobre cada UTM que já estava na URL de destino com outro valor. */
export type DecisoesDeConflito = { substituir: string[]; manter: string[] };

/**
 * `valoresInformados` sobrepõe, por parâmetro, o que a pessoa digitou (por
 * exemplo utm_source=instagram). Conflito sem decisão não gera link: a tela
 * mostra o valor atual e o novo e a pessoa escolhe entre trocar e manter.
 */
export function gerarEstatico(
  configuracao: Configuracao,
  urlDestino: string | undefined,
  conhecidos: ValoresConhecidos,
  valoresInformados: Record<string, string> = {},
  decisoes: DecisoesDeConflito = { substituir: [], manter: [] },
): ModoEstatico {
  if (!urlDestino?.trim()) return { url: null, faltando: [], conflitos: [], erro: 'Informe a URL de destino.' };
  const analise = analisarUrl(urlDestino);
  if (!analise.ok) return { url: null, faltando: [], conflitos: [], erro: analise.erro };

  const faltando: ModoEstatico['faltando'] = [];
  const parametros: ParametroNovo[] = parametrosDoPadrao(configuracao)
    .filter((p) => !decisoes.manter.includes(p.chave))
    .map((p) => {
      const informado = valoresInformados[p.chave]?.trim();
      if (informado) return { chave: p.chave, valor: informado };
      const { valor, semValor } = resolverMacros(p.valor, conhecidos);
      if (semValor.length) faltando.push({ chave: p.chave, macros: semValor });
      return { chave: p.chave, valor };
    });
  const montada = montarUrl(analise.url, parametros, decisoes.substituir);
  const pronto = faltando.length === 0 && montada.conflitos.length === 0;
  return { url: pronto ? montada.url : null, faltando, conflitos: montada.conflitos, erro: null };
}
