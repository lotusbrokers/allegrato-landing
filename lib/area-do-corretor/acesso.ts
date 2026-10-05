/**
 * Regras de acesso da Área do Corretor, sem Supabase, para serem testáveis.
 *
 * A área não tem cadastro nem login próprios: usa as contas da Dashboard
 * (OctoDash), que vivem no mesmo projeto Supabase do site. Quem pode entrar é
 * decidido pelo papel do vínculo com o tenant da Lotus (tenant_memberships.role,
 * lido pela view my_memberships_with_tenant, a mesma que a Dashboard consulta no
 * login). Papéis existentes na Dashboard em 05/10/2026: owner, admin,
 * team_leader, corretor e financeiro — este último fica de fora.
 */

/** Em ordem de alcance: em mais de um vínculo no mesmo tenant, vale o primeiro da lista. */
export const PAPEIS_COM_ACESSO = ['owner', 'admin', 'team_leader', 'corretor'] as const;
export type PapelComAcesso = (typeof PAPEIS_COM_ACESSO)[number];

/**
 * Quem organiza o conteúdo. A gestão em si acontece no Google Drive (decisão da
 * Lotus); aqui isto só decide quem vê os atalhos de gestão.
 */
const PAPEIS_GESTORES: readonly PapelComAcesso[] = ['owner', 'admin'];

const ROTULOS: Record<PapelComAcesso, string> = {
  owner: 'Diretoria',
  admin: 'Administração',
  team_leader: 'Líder de equipe',
  corretor: 'Corretor',
};

export function temAcesso(papel: string | null | undefined): papel is PapelComAcesso {
  return (PAPEIS_COM_ACESSO as readonly string[]).includes(papel ?? '');
}

/** O papel de maior alcance entre os vínculos da pessoa no tenant, ou null sem nenhum válido. */
export function melhorPapel(papeis: (string | null | undefined)[]): PapelComAcesso | null {
  return PAPEIS_COM_ACESSO.find((p) => papeis.includes(p)) ?? null;
}

export function podeGerenciar(papel: PapelComAcesso): boolean {
  return PAPEIS_GESTORES.includes(papel);
}

export function rotuloDoPapel(papel: PapelComAcesso): string {
  return ROTULOS[papel];
}

export const ROTA_BASE = '/area-do-corretor';
export const ROTA_ENTRADA = `${ROTA_BASE}/entrar`;

/**
 * Para onde mandar depois do login. O `volta` chega pela URL, então só vale um
 * caminho da própria área: qualquer outra coisa (outro site, "//host", a própria
 * tela de entrada) cai na home da área. Sem isto, um link malicioso usaria o
 * login da Lotus para levar o corretor a uma página falsa.
 */
export function destinoSeguro(volta: string | null | undefined): string {
  if (!volta || !volta.startsWith(ROTA_BASE) || volta.includes('\\')) return ROTA_BASE;
  const resto = volta.slice(ROTA_BASE.length);
  if (resto && !/^[/?#]/.test(resto)) return ROTA_BASE; // "/area-do-corretorX" não é a área
  if (volta === ROTA_ENTRADA || volta.startsWith(`${ROTA_ENTRADA}?`) || volta.startsWith(`${ROTA_ENTRADA}/`)) return ROTA_BASE;
  return volta;
}
