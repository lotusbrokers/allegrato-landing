import type { CondominioRow, FotoCondominio } from './condominios';
import type { FotoImovel } from './imoveis';
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

/** Uma foto da galeria da página do imóvel (mosaico e tela cheia). */
export type FotoDaGaleria = {
  url: string;
  /** Na foto do condomínio: "Condomínio <nome>", seguido da legenda dela. */
  legenda?: string;
  doCondominio: boolean;
};

/**
 * Galeria da página do imóvel: as fotos da unidade primeiro, com a capa dela
 * na frente, e depois as do condomínio, com a capa dele na frente das outras
 * do condomínio (pedido do dono em 18/10). As duas listas são ordenadas
 * separadas: juntar antes de ordenar levaria a capa do condomínio ao topo.
 *
 * Sem URL vazia e sem URL repetida; a mesma URL nas duas listas fica no lugar
 * da foto do imóvel.
 */
export function galeriaDoImovel(
  fotosDoImovel: FotoImovel[] | null,
  condominio: CondominioDoImovel | null,
): FotoDaGaleria[] {
  const doImovel = fotosDoImovel ?? [];
  const capa = doImovel.find((f) => f.isCapa);
  const rotulo = condominio ? `Condomínio ${condominio.nome.replace(/^condom[ií]nio\s+/i, '')}` : '';
  const candidatas: FotoDaGaleria[] = [
    ...(capa ? [capa, ...doImovel.filter((f) => f !== capa)] : doImovel).map((f) => ({
      url: f.url,
      legenda: f.legenda,
      doCondominio: false,
    })),
    // condominioDoImovel já pôs a capa do condomínio na frente das dele.
    ...(condominio?.fotos ?? []).map((f) => ({
      url: f.url,
      legenda: f.legenda ? `${rotulo} · ${f.legenda}` : rotulo,
      doCondominio: true,
    })),
  ];
  const vistas = new Set<string>();
  return candidatas.filter((f) => {
    if (!f.url || vistas.has(f.url)) return false;
    vistas.add(f.url);
    return true;
  });
}
