/**
 * Favoritos e "acessados recentemente", guardados no aparelho do corretor
 * (localStorage) e separados por usuário.
 *
 * No aparelho, e não no banco, por decisão de 05/10/2026: nada de tabelas novas
 * no Supabase da Dashboard por ora. O custo é que a lista do celular não aparece
 * no computador. Se isso pesar, `ler` e `gravar` são o único ponto a trocar por
 * uma tabela; as telas não mudam.
 *
 * localStorage pode faltar (aba anônima, armazenamento bloqueado): toda leitura
 * e gravação tolera a falha, e a área funciona com as listas vazias.
 */
import { destinoSeguro } from './acesso';
import type { TipoDeItem } from './busca';

export type ItemSalvo = {
  /** Identidade do item: "<tipo>:<id>". */
  chave: string;
  tipo: TipoDeItem;
  titulo: string;
  detalhe: string;
  href: string;
};

export type Lista = 'favoritos' | 'recentes';

const MAXIMO: Record<Lista, number> = { favoritos: 60, recentes: 8 };
const EVENTO = 'lotus-area-corretor:memoria';

/** Favorita ou desfavorita; o favorito novo entra no topo. */
export function comFavoritoAlternado(lista: ItemSalvo[], item: ItemSalvo): ItemSalvo[] {
  if (lista.some((i) => i.chave === item.chave)) return lista.filter((i) => i.chave !== item.chave);
  return [item, ...lista].slice(0, MAXIMO.favoritos);
}

/** O acesso mais novo vai para o topo, sem repetir o mesmo item. */
export function comAcessoRegistrado(lista: ItemSalvo[], item: ItemSalvo): ItemSalvo[] {
  return [item, ...lista.filter((i) => i.chave !== item.chave)].slice(0, MAXIMO.recentes);
}

function chaveDoArmazenamento(usuario: string, lista: Lista): string {
  return `lotus-area-corretor:${usuario}:${lista}`;
}

/** Só leva para dentro da área: um item editado à mão não vira link para outro site. */
function ehItemSalvo(v: unknown): v is ItemSalvo {
  const i = v as ItemSalvo;
  return (
    !!i &&
    typeof i.chave === 'string' &&
    typeof i.titulo === 'string' &&
    typeof i.href === 'string' &&
    destinoSeguro(i.href) === i.href
  );
}

/** Texto cru da lista, para o useSyncExternalStore comparar sem reparsear. */
export function lerBruto(usuario: string, lista: Lista): string {
  try {
    return window.localStorage.getItem(chaveDoArmazenamento(usuario, lista)) ?? '[]';
  } catch {
    return '[]';
  }
}

/** Descarta o que não tiver a forma esperada (dado antigo ou editado à mão). */
export function interpretar(bruto: string): ItemSalvo[] {
  try {
    const v: unknown = JSON.parse(bruto);
    return Array.isArray(v) ? v.filter(ehItemSalvo) : [];
  } catch {
    return [];
  }
}

export function ler(usuario: string, lista: Lista): ItemSalvo[] {
  return interpretar(lerBruto(usuario, lista));
}

export function gravar(usuario: string, lista: Lista, itens: ItemSalvo[]): void {
  try {
    window.localStorage.setItem(chaveDoArmazenamento(usuario, lista), JSON.stringify(itens));
  } catch {
    // Sem armazenamento a lista só não persiste; a tela segue funcionando.
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Avisa quando qualquer lista muda, nesta aba ou em outra. */
export function assinar(aoMudar: () => void): () => void {
  window.addEventListener(EVENTO, aoMudar);
  window.addEventListener('storage', aoMudar);
  return () => {
    window.removeEventListener(EVENTO, aoMudar);
    window.removeEventListener('storage', aoMudar);
  };
}
