'use client';

import Link from 'next/link';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import {
  assinar,
  comAcessoRegistrado,
  comFavoritoAlternado,
  gravar,
  interpretar,
  ler,
  lerBruto,
  type ItemSalvo,
  type Lista,
} from '@/lib/area-do-corretor/memoria-local';
import Icone from './Icone';
import estilos from './area.module.css';

/**
 * Favoritos e recentes na tela. A lista vem do localStorage (ver
 * lib/area-do-corretor/memoria-local.ts); no servidor ela é sempre vazia, e o
 * navegador completa depois, sem divergir da hidratação.
 */
function useListaSalva(usuario: string, lista: Lista): ItemSalvo[] {
  const bruto = useSyncExternalStore(
    assinar,
    () => lerBruto(usuario, lista),
    () => '[]',
  );
  return useMemo(() => interpretar(bruto), [bruto]);
}

/** `compacto`: o botão pequeno das linhas de arquivo, com o texto só a partir do tablet. */
export function BotaoFavoritar({ usuario, item, compacto = false }: { usuario: string; item: ItemSalvo; compacto?: boolean }) {
  const favoritos = useListaSalva(usuario, 'favoritos');
  const marcado = favoritos.some((i) => i.chave === item.chave);
  const texto = marcado ? 'Nos favoritos' : 'Favoritar';
  return (
    <button
      type="button"
      className={compacto ? estilos.botaoIcone : `${estilos.botao} ${estilos.botaoFavorito}`}
      aria-pressed={marcado}
      title={compacto ? texto : undefined}
      onClick={() => gravar(usuario, 'favoritos', comFavoritoAlternado(ler(usuario, 'favoritos'), item))}
    >
      <Icone nome="estrela" tamanho={compacto ? 18 : 20} />
      {compacto ? <span className={estilos.rotuloAcao}>{texto}</span> : texto}
    </button>
  );
}

/** Põe o item no topo dos "acessados recentemente" quando a página abre. */
export function RegistraAcesso({ usuario, item }: { usuario: string; item: ItemSalvo }) {
  useEffect(() => {
    gravar(usuario, 'recentes', comAcessoRegistrado(ler(usuario, 'recentes'), item));
    // A chave identifica o item: título e rota mudam junto com ela.
  }, [usuario, item.chave]);
  return null;
}

export function ListaSalva({
  usuario,
  lista,
  vazio,
  limite,
  removivel = false,
}: {
  usuario: string;
  lista: Lista;
  vazio: string;
  limite?: number;
  removivel?: boolean;
}) {
  const itens = useListaSalva(usuario, lista);
  const visiveis = limite ? itens.slice(0, limite) : itens;
  if (visiveis.length === 0) return <p className={estilos.vazio}>{vazio}</p>;

  return (
    <ul className={estilos.listaCompacta}>
      {visiveis.map((i) => (
        <li key={i.chave} className={estilos.itemCompacto}>
          <Link href={i.href}>
            <span className={estilos.resultadoTitulo}>{i.titulo}</span>
            {i.detalhe && <span className={estilos.resultadoDetalhe}>{i.detalhe}</span>}
          </Link>
          {removivel && (
            <button
              type="button"
              className={estilos.botaoCabecalho}
              style={{ color: 'inherit', borderColor: 'transparent' }}
              aria-label={`Remover ${i.titulo} dos favoritos`}
              onClick={() => gravar(usuario, lista, comFavoritoAlternado(ler(usuario, lista), i))}
            >
              ✕
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
