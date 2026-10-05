import type { Metadata } from 'next';
import Link from 'next/link';
import { CartaoImovel } from '@/components/area-do-corretor/Cartoes';
import { FormularioDeBusca, ResumoDaBusca } from '@/components/area-do-corretor/BuscaPorMedidas';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { catalogo, tiposDeImovel } from '@/lib/area-do-corretor/dados';
import { ROTA_BASE } from '@/lib/area-do-corretor/acesso';
import { filtrarImoveis, lerFiltros, temFiltro, type FiltrosDaBusca } from '@/lib/area-do-corretor/filtros';
import estilos from '@/components/area-do-corretor/area.module.css';

export const metadata: Metadata = { title: 'Imóveis de terceiros' };

const ROTA = `${ROTA_BASE}/terceiros`;

type Busca = { tipo?: string; finalidade?: string; quartos?: string; m2?: string; valor?: string };

/** URL da lista com estes parâmetros, sem os vazios. */
function rotaCom(params: { tipo?: string; finalidade?: string; filtros?: FiltrosDaBusca }): string {
  const q = new URLSearchParams();
  if (params.tipo) q.set('tipo', params.tipo);
  if (params.finalidade) q.set('finalidade', params.finalidade);
  const f = params.filtros;
  if (f?.quartos) q.set('quartos', String(f.quartos));
  if (f?.m2) q.set('m2', String(f.m2));
  if (f?.valor) q.set('valor', String(f.valor));
  const busca = q.toString();
  return busca ? `${ROTA}?${busca}` : ROTA;
}

/**
 * Imóveis de terceiros, separados pelos tipos que existem no cadastro. Não há
 * pastas fixas ("alto padrão", "loteamentos"): uma categoria só aparece quando
 * existe imóvel dela, e os nomes são os da Dashboard. A busca por quartos,
 * metragem e valor (pedido da Lotus em 05/10/2026) combina com os dois.
 */
export default async function TerceirosDaArea({ searchParams }: { searchParams: Promise<Busca> }) {
  await exigirCorretor();
  const params = await searchParams;
  const tipo = params.tipo;
  const finalidade = params.finalidade === 'alugar' || params.finalidade === 'comprar' ? params.finalidade : undefined;
  const filtros = lerFiltros(params);
  const { imoveis } = await catalogo();

  const tipos = tiposDeImovel(imoveis);
  const daFinalidade = finalidade ? imoveis.filter((i) => i.fin === finalidade) : imoveis;
  const doTipo = tipo ? daFinalidade.filter((i) => i.type === tipo) : daFinalidade;
  const { itens: filtrados, semDado } = filtrarImoveis(doTipo, filtros);
  const temAluguel = imoveis.some((i) => i.fin === 'alugar');
  const filtrando = temFiltro(filtros);

  return (
    <>
      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>Imóveis de terceiros</h1>
        <p className={estilos.subtitulo}>
          {imoveis.length} imóveis no cadastro da Lotus. Abra um para ver a ficha completa e mandar o anúncio ao cliente.
        </p>
      </div>

      <FormularioDeBusca acao={ROTA} filtros={filtros} manter={{ tipo, finalidade }} rotulo="Buscar imóveis de terceiros" />

      <nav className={estilos.chips} aria-label="Filtrar por tipo de imóvel">
        <Link href={rotaCom({ finalidade, filtros })} className={`${estilos.chip} ${!tipo ? estilos.chipAtivo : ''}`}>
          Todos
        </Link>
        {tipos.map((t) => (
          <Link
            key={t.tipo}
            href={rotaCom({ tipo: t.tipo, finalidade, filtros })}
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
              href={rotaCom({ tipo, finalidade: f.valor, filtros })}
              className={`${estilos.chip} ${finalidade === f.valor ? estilos.chipAtivo : ''}`}
            >
              {f.rotulo}
            </Link>
          ))}
        </nav>
      )}

      {filtrando && (
        <ResumoDaBusca
          encontrados={filtrados.length}
          total={doTipo.length}
          semDado={semDado}
          filtros={filtros}
          limpar={rotaCom({ tipo, finalidade })}
          nome={{ singular: 'imóvel', plural: 'imóveis' }}
        />
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
