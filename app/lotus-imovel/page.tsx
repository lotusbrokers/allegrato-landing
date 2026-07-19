import { redirect } from 'next/navigation';
import { getImovelCodigos } from '@/lib/imoveis';

// Índice /lotus-imovel: sem UI de listagem própria — redireciona para o primeiro
// imóvel publicado. As páginas ricas são as rotas [codigo]. A busca vive em /lotus-busca.
// ISR: revalida a cada 1h para acompanhar novos imóveis publicados.
export const revalidate = 3600;

export default async function LotusImovelIndex() {
  const codigos = await getImovelCodigos();
  if (codigos.length > 0) redirect(`/lotus-imovel/${codigos[0]}`);
  // Sem imóveis publicados: cai na busca (estado neutro, sem tela vazia).
  redirect('/lotus-busca');
}
