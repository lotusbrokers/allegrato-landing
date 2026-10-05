'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { buscar, type ItemDeBusca, type TipoDeItem } from '@/lib/area-do-corretor/busca';
import Icone from './Icone';
import estilos from './area.module.css';

const ROTULO: Record<TipoDeItem, string> = {
  secao: 'Seção',
  lancamento: 'Lançamento',
  construtora: 'Construtora',
  imovel: 'Terceiros',
  pasta: 'Pasta',
  arquivo: 'Arquivo',
};

/** Busca global: filtra o índice a cada tecla, sem ir ao servidor. */
export default function BuscaGlobal({ indice }: { indice: ItemDeBusca[] }) {
  const [consulta, setConsulta] = useState('');
  const resultados = useMemo(() => buscar(indice, consulta), [indice, consulta]);
  const buscando = consulta.trim().length > 0;

  return (
    <div className={estilos.busca} role="search">
      <label htmlFor="busca-area" className={estilos.somenteLeitor}>
        O que você está procurando?
      </label>
      <span className={estilos.iconeBusca}>
        <Icone nome="busca" />
      </span>
      <input
        id="busca-area"
        type="search"
        className={estilos.campoBusca}
        placeholder="Empreendimento, bairro, construtora, material…"
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        autoComplete="off"
        enterKeyHint="search"
      />
      {buscando &&
        (resultados.length > 0 ? (
          <ul className={estilos.resultados} aria-label="Resultados da busca">
            {resultados.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className={estilos.resultado}>
                  <span className={estilos.tipoResultado}>{ROTULO[r.tipo]}</span>
                  <span className={estilos.resultadoTexto}>
                    <span className={estilos.resultadoTitulo}>{r.titulo}</span>
                    {r.detalhe && <span className={estilos.resultadoDetalhe}>{r.detalhe}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={estilos.semResultado} role="status">
            Nada encontrado para “{consulta.trim()}”. Tente o nome do empreendimento, o bairro ou a construtora.
          </p>
        ))}
    </div>
  );
}
