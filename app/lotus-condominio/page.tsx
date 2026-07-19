import { redirect } from 'next/navigation';
import { getCondominioIds } from '@/lib/condominios';

// Índice /lotus-condominio: sem UI de listagem própria por enquanto — redireciona
// para o primeiro condomínio publicado. As páginas ricas são as rotas [id].
// ISR: revalida a cada 1h para acompanhar novos condomínios publicados.
export const revalidate = 3600;

export default async function LotusCondominioIndex() {
  const ids = await getCondominioIds();
  if (ids.length > 0) redirect(`/lotus-condominio/${ids[0]}`);
  // Sem condomínios publicados: cai na home (estado neutro, sem tela vazia).
  redirect('/lotus-home');
}
