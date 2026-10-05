import type { Metadata } from 'next';
import Link from 'next/link';
import { CartaoImovel } from '@/components/area-do-corretor/Cartoes';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { catalogo, tiposDeImovel } from '@/lib/area-do-corretor/dados';
import { ROTA_BASE } from '@/lib/area-do-corretor/acesso';
import estilos from '@/components/area-do-corretor/area.module.css';

export const metadata: Metadata = { title: 'Imóveis de terceiros' };

const ROTA = `${ROTA_BASE}/terceiros`;

type Filtros = { tipo?: string; finalidade?: string };

function rotaCom(filtros: Filtros): string {
  const q = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v) as [string, string][]).toString();
  return q ? `${ROTA}?${q}` : ROTA;
}

/**
 * Imóveis de terceiros, separados pelos tipos que existem no cadastro. Não há
 * pastas fixas ("alto padrão", "loteamentos"): uma categoria só aparece quando
 * existe imóvel dela, e os nomes são os da Dashboard.
 */
export default async function TerceirosDaArea({ searchParams }: { searchParams: Promise<Filtros> }) {
  await exigirCorretor();
  const { tipo, finalidade } = await searchParams;
  const { imoveis } = await catalogo();

  const tipos = tiposDeImovel(imoveis);
  const daFinalidade = finalidade === 'alugar' || finalidade === 'comprar' ? imoveis.filter((i) => i.fin === finalidade) : imoveis;
  const filtrados = tipo ? daFinalidade.filter((i) => i.type === tipo) : daFinalidade;
  const temAluguel = imoveis.some((i) => i.fin === 'alugar');

  return (
    <>
      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>Imóveis de terceiros</h1>
        <p className={estilos.subtitulo}>
          {imoveis.length} imóveis no cadastro da Lotus. Abra um para ver a ficha completa e mandar o anúncio ao cliente.
        </p>
      </div>

      <nav className={estilos.chips} aria-label="Filtrar por tipo de imóvel">
        <Link href={rotaCom({ finalidade })} className={`${estilos.chip} ${!tipo ? estilos.chipAtivo : ''}`}>
          Todos
        </Link>
        {tipos.map((t) => (
          <Link
            key={t.tipo}
            href={rotaCom({ tipo: t.tipo, finalidade })}
            className={`${estilos.chip} ${tipo === t.tipo ? estilos.chipAtivo : ''}`}
          >
            {t.tipo} <span aria-hidden="true">· {t.total}</span>
          </Link>
        ))}
      </nav>

      {temAluguel && (
        <nav className={estilos.chips} style={{ marginTop: -6 }} aria-label="Filtrar por finalidade">
          {[
            { valor: undefined, rotulo: 'Venda e aluguel' },
            { valor: 'comprar', rotulo: 'Venda' },
            { valor: 'alugar', rotulo: 'Aluguel' },
          ].map((f) => (
            <Link
              key={f.rotulo}
              href={rotaCom({ tipo, finalidade: f.valor })}
              className={`${estilos.chip} ${finalidade === f.valor ? estilos.chipAtivo : ''}`}
            >
              {f.rotulo}
            </Link>
          ))}
        </nav>
      )}

      {filtrados.length > 0 ? (
        <div className={estilos.grade}>
          {filtrados.map((i) => (
            <CartaoImovel key={i.codigo} i={i} />
          ))}
        </div>
      ) : (
        <p className={estilos.vazio}>Nenhum imóvel com esses filtros.</p>
      )}
    </>
  );
}
