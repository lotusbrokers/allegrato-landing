/**
 * Importação do CSV do Meta Ads: da linha mapeada à prévia, e da prévia aos
 * registros guardados.
 *
 * O navegador lê o arquivo e manda só os campos mapeados. Aqui, no servidor,
 * tudo é validado de novo como entrada externa: tamanho, IDs, status. A prévia
 * não grava nada; a importação grava só o que a pessoa confirmou e que continua
 * elegível na conferência do servidor.
 */
import { CAMPOS_CSV, DEFINICAO_DOS_CAMPOS, type CampoCsv, type LinhaMapeada } from './colunas';
import { avaliarElegibilidade, nivelDa, type Elegibilidade } from './status';
import type { ContagensDaImportacao, DadosImportados, EstadoUtm, Lote, Nivel, Registro, Usuario } from './tipos';
import { lerParametros } from './url';

/** Teto de uma importação. Acima disso a ação do servidor estoura o limite de 1 MB do Next. */
export const MAXIMO_DE_LINHAS = 3000;
const MAXIMO_POR_CAMPO = 500;
const MAXIMO_POR_URL = 2048;

/** Campos que vêm do CSV e são atualizados a cada importação. Os manuais ficam fora desta lista. */
const CAMPOS_ID: CampoCsv[] = ['contaId', 'campanhaId', 'conjuntoId', 'anuncioId'];

export type EntradaInvalida = { ok: false; erro: string };

/**
 * Limpa as linhas recebidas do navegador: só os campos conhecidos, só texto,
 * sem caractere de controle e dentro do tamanho. Recusa o lote inteiro quando
 * a forma não é a esperada: quem manda outra coisa não é a tela de importação.
 */
export function validarLinhas(entrada: unknown): { ok: true; linhas: LinhaMapeada[] } | EntradaInvalida {
  if (!Array.isArray(entrada)) return { ok: false, erro: 'Formato de importação inválido.' };
  if (entrada.length === 0) return { ok: false, erro: 'Nenhuma linha para importar.' };
  if (entrada.length > MAXIMO_DE_LINHAS) return { ok: false, erro: `O arquivo tem ${entrada.length} linhas; o limite por importação é ${MAXIMO_DE_LINHAS}. Exporte só as campanhas ativas ou divida o arquivo.` };

  const linhas: LinhaMapeada[] = [];
  for (const item of entrada) {
    if (!item || typeof item !== 'object') return { ok: false, erro: 'Formato de importação inválido.' };
    const bruto = item as Record<string, unknown>;
    const linha: LinhaMapeada = { linha: Number.isInteger(bruto.linha) ? (bruto.linha as number) : 0 };
    for (const campo of CAMPOS_CSV) {
      const valor = bruto[campo];
      if (valor === undefined || valor === null || valor === '') continue;
      if (typeof valor !== 'string') return { ok: false, erro: `Campo ${campo} com tipo inválido na linha ${linha.linha}.` };
      const limpo = valor.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
      const limite = campo === 'urlDestino' || campo === 'parametrosUrl' ? MAXIMO_POR_URL : MAXIMO_POR_CAMPO;
      if (limpo.length > limite) return { ok: false, erro: `${DEFINICAO_DOS_CAMPOS[campo].rotulo} com mais de ${limite} caracteres na linha ${linha.linha}.` };
      if (limpo) linha[campo] = limpo;
    }
    linhas.push(linha);
  }
  return { ok: true, linhas };
}

/**
 * ID da Meta: só dígitos. "1,20212E+17" é o Excel tendo transformado o ID em
 * número e perdido os últimos dígitos; com ele não dá para achar o registro.
 */
export function problemaNoId(valor: string | undefined): string | null {
  if (!valor) return null;
  if (/^\d+([.,]\d+)?e\+?\d+$/i.test(valor)) return `ID "${valor}" em notação científica: o Excel cortou os dígitos. Exporte de novo sem abrir no Excel.`;
  if (!/^\d{1,25}$/.test(valor)) return `ID "${valor}" não é um número da Meta.`;
  return null;
}

/** Chave estável do registro pelos IDs da Meta; null se faltar o ID do próprio nível. */
export function chaveDe(dados: DadosImportados): { chave: string; nivel: Nivel } | null {
  const nivel = nivelDa(dados);
  const id = nivel === 'anuncio' ? dados.anuncioId : nivel === 'conjunto' ? dados.conjuntoId : dados.campanhaId;
  return id ? { chave: `${nivel}:${id}`, nivel } : null;
}

export type Candidato = {
  linha: number;
  chave: string | null;
  nivel: Nivel;
  dados: DadosImportados;
  elegibilidade: Elegibilidade;
  motivos: string[];
  /** Mesma chave numa linha anterior do arquivo: esta é ignorada. */
  duplicadoNoArquivo: boolean;
  /** Em relação ao que já está guardado. */
  situacao: 'novo' | 'atualizacao' | 'sem-mudanca';
  /** Rótulos dos campos que mudam, numa atualização. */
  mudancas: string[];
};

export type Previa = { candidatos: Candidato[]; contagens: Omit<ContagensDaImportacao, 'importados' | 'ignorados' | 'validados'> };

function camposDiferentes(antes: DadosImportados, depois: DadosImportados): string[] {
  return CAMPOS_CSV.filter((c) => (antes[c] ?? '') !== (depois[c] ?? '')).map((c) => DEFINICAO_DOS_CAMPOS[c].rotulo);
}

/** A prévia: cada linha classificada, sem gravar nada. */
export function prepararImportacao(linhas: LinhaMapeada[], existentes: Record<string, Registro>): Previa {
  const vistas = new Set<string>();
  const candidatos: Candidato[] = linhas.map((linha) => {
    const { linha: numero, ...dados } = linha;
    const identidade = chaveDe(dados);
    const motivos: string[] = [];
    let elegibilidade: Elegibilidade;

    const problemasDeId = CAMPOS_ID.map((c) => problemaNoId(dados[c])).filter((p): p is string => p !== null);
    if (!dados.campanhaId) {
      elegibilidade = 'revisao';
      motivos.push('Sem o ID da campanha: não há como reconhecer este registro numa próxima importação.');
    } else if (problemasDeId.length) {
      elegibilidade = 'revisao';
      motivos.push(...problemasDeId);
    } else {
      const avaliacao = avaliarElegibilidade(dados);
      elegibilidade = avaliacao.elegibilidade;
      motivos.push(...avaliacao.motivos);
    }

    const chave = identidade && !problemasDeId.length ? identidade.chave : null;
    const duplicadoNoArquivo = chave !== null && vistas.has(chave);
    if (chave) vistas.add(chave);
    if (duplicadoNoArquivo) motivos.push('Mesmo ID em outra linha do arquivo; vale a primeira.');

    const existente = chave ? existentes[chave] : undefined;
    const mudancas = existente ? camposDiferentes(existente.dados, dados) : [];
    return {
      linha: numero,
      chave,
      nivel: identidade?.nivel ?? nivelDa(dados),
      dados,
      elegibilidade,
      motivos,
      duplicadoNoArquivo,
      situacao: !existente ? 'novo' : mudancas.length ? 'atualizacao' : 'sem-mudanca',
      mudancas,
    };
  });

  const importaveis = candidatos.filter((c) => c.elegibilidade === 'elegivel' && !c.duplicadoNoArquivo);
  return {
    candidatos,
    contagens: {
      encontrados: candidatos.length,
      elegiveis: importaveis.length,
      novos: importaveis.filter((c) => c.situacao === 'novo').length,
      atualizados: importaveis.filter((c) => c.situacao === 'atualizacao').length,
      desligados: candidatos.filter((c) => desligouJaCadastrado(c, existentes)).length,
      duplicados: candidatos.filter((c) => c.duplicadoNoArquivo).length,
      revisao: candidatos.filter((c) => c.elegibilidade === 'revisao').length,
    },
  };
}

/**
 * Já cadastrado que agora veio desligado (pausado, arquivado, concluído). Não
 * é importação nova: é o registro conhecido sendo atualizado, para a tabela
 * não mostrar como ativo o que a Meta já desligou.
 */
function desligouJaCadastrado(c: Candidato, existentes: Record<string, Registro>): boolean {
  return c.chave !== null && c.elegibilidade === 'inelegivel' && !c.duplicadoNoArquivo && Boolean(existentes[c.chave]);
}

/** Parâmetros do texto, sem ordem, para comparar o gerado com o que a Meta devolveu. */
function mesmoConjuntoDeParametros(a: string, b: string): boolean {
  const chave = (texto: string) =>
    lerParametros(texto)
      .map((p) => `${p.chave.toLowerCase()}=${p.valor}`)
      .sort()
      .join('&');
  return chave(a) === chave(b);
}

export type ContextoDaImportacao = {
  quando: string;
  usuario: Usuario | null;
  arquivo: string;
  loteId: string;
  /** Associação automática pela URL de destino (ver lib/utm/empreendimentos.ts). */
  empreendimentoDaUrl: (url: string | undefined) => string | null;
};

/**
 * Grava no estado só o que é elegível, não repetido e foi escolhido. Campos
 * manuais (associação manual, observações, aplicação) nunca são tocados; a
 * associação pela URL é refeita, porque a URL pode ter mudado no anúncio.
 *
 * Quem não veio no arquivo, sendo de uma conta presente nele, fica marcado
 * como ausente: a ausência pode ser pausa, filtro na exportação ou exclusão, e
 * o arquivo não diz qual. Nada é apagado.
 */
export function aplicarImportacao(estado: EstadoUtm, previa: Previa, escolhidos: Set<string>, contexto: ContextoDaImportacao): Lote {
  const importar = previa.candidatos.filter(
    (c): c is Candidato & { chave: string } => c.chave !== null && c.elegibilidade === 'elegivel' && !c.duplicadoNoArquivo && escolhidos.has(c.chave),
  );

  let novos = 0;
  let atualizados = 0;
  let validados = 0;
  for (const candidato of importar) {
    const existente = estado.registros[candidato.chave];
    const empreendimentoDaUrl = contexto.empreendimentoDaUrl(candidato.dados.urlDestino);
    const associacao =
      existente?.associacao?.origem === 'manual'
        ? existente.associacao
        : empreendimentoDaUrl
          ? { empreendimentoId: empreendimentoDaUrl, origem: 'url' as const }
          : null;

    let aplicacao = existente?.aplicacao ?? null;
    if (aplicacao && aplicacao.estado !== 'validada' && candidato.dados.parametrosUrl && mesmoConjuntoDeParametros(aplicacao.parametros, candidato.dados.parametrosUrl)) {
      aplicacao = { ...aplicacao, estado: 'validada', quando: contexto.quando };
      validados++;
    }

    if (existente) {
      if (candidato.situacao === 'atualizacao') atualizados++;
    } else {
      novos++;
    }
    estado.registros[candidato.chave] = {
      chave: candidato.chave,
      nivel: candidato.nivel,
      dados: candidato.dados,
      primeiraImportacao: existente?.primeiraImportacao ?? contexto.quando,
      ultimaImportacao: contexto.quando,
      loteId: contexto.loteId,
      ausenteNaUltimaImportacao: false,
      associacao,
      observacoes: existente?.observacoes ?? '',
      aplicacao,
    };
  }

  // Já cadastrado que veio desligado: atualiza status e veiculação, sem pedir
  // escolha (não há o que decidir) e sem mexer nos campos da equipe.
  for (const candidato of previa.candidatos) {
    if (!desligouJaCadastrado(candidato, estado.registros)) continue;
    const existente = estado.registros[candidato.chave as string];
    existente.dados = candidato.dados;
    existente.ultimaImportacao = contexto.quando;
    existente.loteId = contexto.loteId;
    existente.ausenteNaUltimaImportacao = false;
  }

  // Ausência só vale para contas presentes no arquivo; sem a coluna de conta,
  // vale para tudo o que foi importado antes.
  const contasNoArquivo = new Set(previa.candidatos.map((c) => c.dados.contaId ?? ''));
  const presentes = new Set(previa.candidatos.map((c) => c.chave).filter(Boolean));
  for (const registro of Object.values(estado.registros)) {
    if (presentes.has(registro.chave)) continue;
    if (contasNoArquivo.has(registro.dados.contaId ?? '')) registro.ausenteNaUltimaImportacao = true;
  }

  const lote: Lote = {
    id: contexto.loteId,
    quando: contexto.quando,
    usuario: contexto.usuario,
    arquivo: contexto.arquivo,
    contagens: {
      ...previa.contagens,
      importados: importar.length,
      novos,
      atualizados,
      validados,
      ignorados: previa.contagens.encontrados - importar.length,
    },
  };
  estado.lotes.push(lote);
  return lote;
}
