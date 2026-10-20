/**
 * Pastas do Google Drive da Área do Gestor, pedido da Lotus em 19/10/2026: a da
 * Diretoria e a do Marketing, abertas a todo gestor (owner e admin).
 *
 * Funcionam como a pasta dos corretores (lib/area-do-corretor/drive.ts): mesma
 * chave de API, mesmas regras do que nunca aparece (senha, leads, arquivo de
 * sistema), compartilhamento "qualquer pessoa com o link". Os IDs ficam no
 * ambiente pelo mesmo motivo: o repositório é público, e o ID no código abriria
 * as pastas a quem o lesse.
 *
 * Módulo sem Next nem Supabase, para o teste importar direto.
 */
import { idValido } from '../area-do-corretor/drive-regras';

export type ChaveDaPasta = 'diretoria' | 'marketing';

export type PastaDaGestao = {
  chave: ChaveDaPasta;
  titulo: string;
  resumo: string;
  /** Variável de ambiente com o ID (ou o link) da pasta. */
  variavel: string;
  /** null sem a variável, ou com um valor que não é ID nem link de pasta. */
  id: string | null;
};

const PASTAS: Omit<PastaDaGestao, 'id'>[] = [
  { chave: 'diretoria', titulo: 'Diretoria', resumo: 'Pasta da diretoria no Drive', variavel: 'GOOGLE_DRIVE_PASTA_DIRETORIA_ID' },
  { chave: 'marketing', titulo: 'Marketing', resumo: 'Pasta do marketing no Drive', variavel: 'GOOGLE_DRIVE_PASTA_MARKETING_ID' },
];

/**
 * Aceita o ID puro ou o link da pasta (".../drive/folders/<id>?usp=drive_link"),
 * como a Lotus copia do Drive. Qualquer outra coisa vira null: o ID entra na
 * consulta ao Drive.
 */
export function idDaPasta(valor: string | null | undefined): string | null {
  const bruto = valor?.trim() ?? '';
  const id = bruto.match(/\/folders\/([A-Za-z0-9_-]+)/)?.[1] ?? bruto;
  return idValido(id) ? id : null;
}

export function pastasDaGestao(ambiente: Record<string, string | undefined> = process.env): PastaDaGestao[] {
  return PASTAS.map((p) => ({ ...p, id: idDaPasta(ambiente[p.variavel]) }));
}

export function pastaDaGestao(chave: string, ambiente: Record<string, string | undefined> = process.env): PastaDaGestao | null {
  return pastasDaGestao(ambiente).find((p) => p.chave === chave) ?? null;
}
