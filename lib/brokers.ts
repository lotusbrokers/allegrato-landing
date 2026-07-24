import { supabase, TENANT_ID } from './supabase';

// Camada de dados dos CORRETORES do Portal.
// Fonte: view pública portal_brokers = tenant_memberships (quem é corretor:
// role + tenant) JOIN user_profiles (nome/foto). Leitura anônima; a view expõe
// só id/name/photo_url — PII (email/phone) fica de fora por grant de coluna.
// Ver supabase/migrations/0002_portal_brokers_view.sql.

export type Broker = {
  id: string;
  name: string;
  photoUrl: string | null;
  creci: string | null;
  imoveisAtivos: number;
};

type BrokerRow = {
  id: string;
  name: string;
  photo_url: string | null;
  creci: string | null;
  imoveis_ativos: number;
};

/** Corretores do tenant Lotus (para /lotus-corretores).
 *  A view portal_brokers já filtra role (corretor/team_leader), tenant e
 *  nome não-vazio. O .eq(tenant_id) aqui é defesa em profundidade. */
export async function getBrokers(): Promise<Broker[]> {
  const { data, error } = await supabase
    .from('portal_brokers')
    .select('id, name, photo_url, creci, imoveis_ativos')
    .eq('tenant_id', TENANT_ID)
    .order('name');

  if (error) {
    console.error('[getBrokers] erro Supabase:', error.message);
    return [];
  }
  return (data as BrokerRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    photoUrl: r.photo_url,
    creci: r.creci,
    imoveisAtivos: r.imoveis_ativos ?? 0,
  }));
}
