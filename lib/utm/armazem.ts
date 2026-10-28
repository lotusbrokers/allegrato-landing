/**
 * Onde o UTM Manager guarda os dados: um arquivo JSON no servidor.
 *
 * Por que não o Supabase: o site só lê o banco da Dashboard (OctoDash) e nunca
 * escreve nele, por regra da Lotus; criar tabela lá é trabalho do time da
 * Dashboard. Para algumas centenas de anúncios ativos, um arquivo resolve:
 *  - cada alteração lê, muda e grava o estado inteiro, em fila (uma de cada
 *    vez no processo) e por troca atômica de arquivo (grava num temporário e
 *    renomeia). Uma importação ou entra inteira ou não entra;
 *  - a versão anterior fica em estado.anterior.json, para desfazer à mão;
 *  - arquivo ilegível não é sobrescrito: a leitura falha e nada é gravado.
 *
 * Em produção a pasta precisa sobreviver ao deploy: UTM_DATA_DIR apontando
 * para um volume do Easypanel (ver docs/utm-manager.md). Sem a variável, a
 * pasta é .dados/utm dentro do projeto, que serve no computador e some a cada
 * deploy; a Visão geral avisa.
 *
 * Se um dia forem várias instâncias do site ou milhares de registros, a troca
 * é por um banco próprio, mantendo ler() e alterar() como interface.
 *
 * Só para código de servidor: usa node:fs.
 */
import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { configuracaoPadrao } from './configuracao';
import type { EstadoUtm, Evento, TipoDeEvento, Usuario } from './tipos';

/** Histórico guardado; acima disso saem os eventos mais antigos. */
export const LIMITE_DO_HISTORICO = 5000;

export function diretorioDosDados(): { caminho: string; persistente: boolean } {
  const configurado = process.env.UTM_DATA_DIR?.trim();
  return configurado ? { caminho: configurado, persistente: true } : { caminho: join(process.cwd(), '.dados', 'utm'), persistente: false };
}

export function estadoInicial(): EstadoUtm {
  return { versao: 1, registros: {}, empreendimentos: {}, construtoras: {}, configuracao: configuracaoPadrao(), lotes: [], historico: [] };
}

/**
 * Estado lido do disco, completado com o que versões novas acrescentaram (uma
 * verificação nova da auditoria ganha a severidade padrão). Versão
 * desconhecida não é lida: melhor parar do que gravar por cima.
 */
export function completarEstado(lido: unknown): EstadoUtm {
  if (!lido || typeof lido !== 'object' || (lido as { versao?: unknown }).versao !== 1) {
    throw new Error('[utm] estado.json com versão desconhecida; nada foi gravado.');
  }
  const base = estadoInicial();
  const estado = lido as Partial<EstadoUtm>;
  return {
    versao: 1,
    registros: estado.registros ?? {},
    empreendimentos: estado.empreendimentos ?? {},
    construtoras: estado.construtoras ?? {},
    configuracao: {
      ...base.configuracao,
      ...estado.configuracao,
      severidades: { ...base.configuracao.severidades, ...estado.configuracao?.severidades },
    },
    lotes: estado.lotes ?? [],
    historico: estado.historico ?? [],
  };
}

export type Armazem = {
  arquivo: string;
  ler(): Promise<EstadoUtm>;
  /** Lê, aplica a mudança e grava, um de cada vez. O que `mudar` devolve volta para quem chamou. */
  alterar<T>(mudar: (estado: EstadoUtm) => T): Promise<T>;
};

export function criarArmazem(diretorio: string): Armazem {
  const arquivo = join(diretorio, 'estado.json');
  let fila: Promise<unknown> = Promise.resolve();

  async function ler(): Promise<EstadoUtm> {
    let texto: string;
    try {
      texto = await readFile(arquivo, 'utf8');
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return estadoInicial();
      throw e;
    }
    try {
      return completarEstado(JSON.parse(texto));
    } catch (e) {
      throw new Error(`[utm] ${arquivo} ilegível (${(e as Error).message}). A versão anterior está em estado.anterior.json.`);
    }
  }

  async function gravar(estado: EstadoUtm): Promise<void> {
    await mkdir(diretorio, { recursive: true });
    const temporario = join(diretorio, `estado.${process.pid}.${randomUUID()}.tmp`);
    await writeFile(temporario, JSON.stringify(estado), 'utf8');
    try {
      await copyFile(arquivo, join(diretorio, 'estado.anterior.json'));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    }
    await rename(temporario, arquivo);
  }

  function alterar<T>(mudar: (estado: EstadoUtm) => T): Promise<T> {
    const tarefa = fila.then(async () => {
      const estado = await ler();
      const resultado = mudar(estado);
      if (estado.historico.length > LIMITE_DO_HISTORICO) estado.historico.splice(0, estado.historico.length - LIMITE_DO_HISTORICO);
      await gravar(estado);
      return resultado;
    });
    // A fila segue mesmo se esta alteração falhar; o erro vai para quem chamou.
    fila = tarefa.catch(() => undefined);
    return tarefa;
  }

  return { arquivo, ler, alterar };
}

let doServidor: Armazem | null = null;

/** O armazém do processo, com uma fila só para todas as requisições. */
export function armazem(): Armazem {
  doServidor ??= criarArmazem(diretorioDosDados().caminho);
  return doServidor;
}

export function registrarEvento(estado: EstadoUtm, tipo: TipoDeEvento, usuario: Usuario | null, alvo: string | null, resumo: string, quando = new Date().toISOString()): Evento {
  const evento: Evento = { id: randomUUID(), quando, usuario, tipo, alvo, resumo: resumo.slice(0, 500) };
  estado.historico.push(evento);
  return evento;
}
