import type { CondominioRow, FotoCondominio } from './condominios';
import { slugCondominio } from './slug-condominio';

/**
 * O que a seção "O condomínio <nome>" da página do imóvel precisa.
 *
 * Só nome, título, slug e fotos: é o que viaja para o navegador, em vez da
 * ficha inteira do condomínio.
 */
export type CondominioDoImovel = {
  nome: string;
  titulo: string;
  /** /lotus-condominio/<slug> — o mesmo slugCondominio da rota. */
  slug: string;
  /** Capa primeiro, o resto na ordem do cadastro. */
  fotos: FotoCondominio[];
};

/**
 * Regra da seção do condomínio na página do imóvel.
 *
 * `null` quando não há o que mostrar: imóvel sem condomínio, condomínio não
 * publicado (getCondominio devolve null para ele) ou condomínio sem foto.
 * Nesses casos a página fica como era antes da seção existir.
 *
 * Módulo sem Supabase para o teste importar a função pura.
 */
export function condominioDoImovel(
  cond: Pick<CondominioRow, 'nome' | 'fotos'> | null,
): CondominioDoImovel | null {
  const fotos = (cond?.fotos ?? []).filter((f) => f.url);
  if (!cond || fotos.length === 0) return null;
  const capa = fotos.find((f) => f.isCapa);
  return {
    nome: cond.nome,
    // "Condomínio Chácara Primavera" vira "O condomínio Chácara Primavera",
    // não "O condomínio Condomínio Chácara Primavera".
    titulo: `O condomínio ${cond.nome.replace(/^condom[ií]nio\s+/i, '')}`,
    slug: slugCondominio(cond.nome),
    fotos: capa ? [capa, ...fotos.filter((f) => f !== capa)] : fotos,
  };
}
