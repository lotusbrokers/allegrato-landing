/**
 * Tipos do UTM Manager (Área do Gestor, /area-do-gestor/utm).
 *
 * O registro é a linha do Meta Ads: um anúncio, ou um conjunto ou uma campanha
 * quando a exportação vem nesse nível. Os IDs da Meta são a identidade; os
 * campos marcados "manual" são da equipe e nenhuma importação os sobrescreve.
 */
import type { CampoCsv } from './colunas';

export type Usuario = { id: string; nome: string };

export type Nivel = 'anuncio' | 'conjunto' | 'campanha';

/** Status configurado (o liga e desliga de cada nível no Gerenciador de Anúncios). */
export type EstadoConfigurado = 'ativo' | 'pausado' | 'arquivado' | 'excluido' | 'desconhecido';

/**
 * Veiculação, quando o arquivo traz: "veiculando" é o único estado em que o
 * anúncio está de fato no ar. "parado" é ligado mas sem entrega (agendado, em
 * análise, rejeitado...); "desligado" é desligado em algum nível ou concluído.
 */
export type Veiculacao = 'veiculando' | 'parado' | 'desligado' | 'desconhecida';

/** Os campos que vêm do CSV, todos como texto: ID da Meta tem até 20 dígitos e não cabe em number. */
export type DadosImportados = Partial<Record<CampoCsv, string>>;

/**
 * Etapas da aplicação da UTM no Meta Ads. Copiar não é aplicar: só a pessoa
 * confirma que colou no anúncio, e só uma importação nova mostra que a Meta
 * de fato gravou ("validada").
 */
export type EstadoDaAplicacao = 'gerada' | 'copiada' | 'confirmada' | 'validada';

export type Aplicacao = {
  estado: EstadoDaAplicacao;
  /** O texto de parâmetros gerado, como vai para o campo "Parâmetros de URL" do Meta Ads. */
  parametros: string;
  quando: string;
  usuario: Usuario | null;
};

export type Associacao = {
  empreendimentoId: string;
  /** "url": a URL de destino é a página do empreendimento no site. "manual": escolha da equipe, que a importação nunca troca. */
  origem: 'url' | 'manual';
};

export type Registro = {
  /** "anuncio:<id>", "conjunto:<id>" ou "campanha:<id>". */
  chave: string;
  nivel: Nivel;
  dados: DadosImportados;
  primeiraImportacao: string;
  ultimaImportacao: string;
  loteId: string;
  /** Não veio na última importação da mesma conta. Só sinaliza: não quer dizer pausado nem apaga nada. */
  ausenteNaUltimaImportacao: boolean;
  // ---- manual ----
  associacao: Associacao | null;
  observacoes: string;
  aplicacao: Aplicacao | null;
};

export type Categoria = string;

/** Empreendimento: os do catálogo do site ("site:<slug>") ou cadastrados aqui ("manual:<id>"). */
export type Empreendimento = {
  id: string;
  origem: 'site' | 'manual';
  nome: string;
  construtora: string;
  categoria: Categoria;
  url: string;
  regiao: string;
  status: 'ativo' | 'inativo';
  observacoes: string;
};

/** O que fica guardado de um empreendimento: tudo, se é manual; só os campos da equipe, se é do site. */
export type EmpreendimentoGuardado =
  | (Empreendimento & { origem: 'manual' })
  | { id: string; origem: 'site'; categoria: Categoria; status: 'ativo' | 'inativo'; observacoes: string };

export type Construtora = { id: string; nome: string; observacoes: string };

export type Severidade = 'critico' | 'atencao' | 'informativo';

export type ParametroDoPadrao = { chave: string; valor: string; obrigatorio: boolean };

export type Configuracao = {
  /** Os parâmetros principais (utm_*), na ordem em que entram na URL. */
  parametros: ParametroDoPadrao[];
  /** IDs da Meta como parâmetros extras, ligados um a um. */
  extras: ParametroDoPadrao[];
  categorias: Categoria[];
  /** Severidade de cada verificação da auditoria (ver lib/utm/auditoria.ts). */
  severidades: Record<string, Severidade>;
};

export type ContagensDaImportacao = {
  encontrados: number;
  elegiveis: number;
  importados: number;
  novos: number;
  atualizados: number;
  /** Já cadastrados que vieram pausados ou desligados: o status é atualizado, sem contar como importação. */
  desligados: number;
  /** UTMs confirmadas ou copiadas que este arquivo mostrou gravadas na Meta. */
  validados: number;
  ignorados: number;
  duplicados: number;
  revisao: number;
};

export type Lote = {
  id: string;
  quando: string;
  usuario: Usuario | null;
  arquivo: string;
  contagens: ContagensDaImportacao;
};

export type TipoDeEvento =
  | 'importacao'
  | 'atualizacao'
  | 'geracao'
  | 'copia'
  | 'confirmacao'
  | 'associacao'
  | 'exportacao'
  | 'configuracao'
  | 'empreendimento'
  | 'construtora';

export type Evento = {
  id: string;
  quando: string;
  usuario: Usuario | null;
  tipo: TipoDeEvento;
  /** Chave do registro ou id do empreendimento afetado, quando houver. */
  alvo: string | null;
  resumo: string;
};

export type EstadoUtm = {
  versao: 1;
  registros: Record<string, Registro>;
  empreendimentos: Record<string, EmpreendimentoGuardado>;
  construtoras: Record<string, Construtora>;
  configuracao: Configuracao;
  lotes: Lote[];
  historico: Evento[];
};
