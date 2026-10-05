import type { Metadata } from 'next';
import Link from 'next/link';
import { CartaoLancamento } from '@/components/area-do-corretor/Cartoes';
import { FormularioDeBusca, ResumoDaBusca } from '@/components/area-do-corretor/BuscaPorMedidas';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { catalogo } from '@/lib/area-do-corretor/dados';
import { ROTA_BASE } from '@/lib/area-do-corretor/acesso';
import { filtrarLancamentos, lerFiltros, temFiltro, type FiltrosDaBusca } from '@/lib/area-do-corretor/filtros';
import estilos from '@/components/area-do-corretor/area.module.css';

export const metadata: Metadata = { title: 'Lançamentos' };

const ROTA = `${ROTA_BASE}/lancamentos`;

type Busca = { fase?: string; quartos?: string; m2?: string; valor?: string };

/** URL da lista com estes parâmetros, sem os vazios. */
function rotaCom(params: { fase?: string; filtros?: FiltrosDaBusca }): string {
  const q = new URLSearchParams();
  if (params.fase) q.set('fase', params.fase);
  const f = params.filtros;
  if (f?.quartos) q.set('quartos', String(f.quartos));
  if (f?.m2) q.set('m2', String(f.m2));
  if (f?.valor) q.set('valor', String(f.valor));
  const busca = q.toString();
  return busca ? `${ROTA}?${busca}` : ROTA;
}

export default async function LancamentosDaArea({ searchParams }: { searchParams: Promise<Busca> }) {
  await exigirCorretor();
  const params = await searchParams;
  const fase = params.fase;
  const filtros = lerFiltros(params);
  const { lancamentos } = await catalogo();

  // As fases são as que existem no cadastro (o texto vem da Dashboard), na ordem em que aparecem.
  const fases = [...new Set(lancamentos.map((l) => l.stage).filter(Boolean))];
  const daFase = fase ? lancamentos.filter((l) => l.stage === fase) : lancamentos;
  const { itens: filtrados, semDado } = filtrarLancamentos(daFase, filtros);
  // Exclusivos da Lotus na frente; o resto na ordem do cadastro.
  const ordenados = [...filtrados].sort((a, b) => Number(b.exclusive) - Number(a.exclusive));
  const filtrando = temFiltro(filtros);

  return (
    <>
      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>Lançamentos</h1>
        <p className={estilos.subtitulo}>
          {lancamentos.length} empreendimentos que a Lotus comercializa. Cada um tem a ficha, o link da página pública
          para mandar ao cliente e os materiais da pasta dele no Drive.
        </p>
      </div>

      <FormularioDeBusca acao={ROTA} filtros={filtros} manter={{ fase }} rotulo="Buscar lançamentos" />

      {fases.length > 1 && (
        <nav className={estilos.chips} aria-label="Filtrar por fase da obra">
          <Link
            href={rotaCom({ filtros })}
            className={`${estilos.chip} ${!fase ? estilos.chipAtivo : ''}`}
            aria-current={!fase ? 'page' : undefined}
          >
            Todos
          </Link>
          {fases.map((f) => (
            <Link
              key={f}
              href={rotaCom({ fase: f, filtros })}
              className={`${estilos.chip} ${fase === f ? estilos.chipAtivo : ''}`}
              aria-current={fase === f ? 'page' : undefined}
            >
              {f}
            </Link>
          ))}
        </nav>
      )}

      {filtrando && (
        <ResumoDaBusca
          encontrados={ordenados.length}
          total={daFase.length}
          semDado={semDado}
          filtros={filtros}
          limpar={rotaCom({ fase })}
          nome={{ singular: 'lançamento', plural: 'lançamentos' }}
        />
      )}

      {ordenados.length > 0 ? (
        <div className={estilos.grade}>
          {ordenados.map((l) => (
            <CartaoLancamento key={l.id} l={l} />
          ))}
        </div>
      ) : (
        <p className={estilos.vazio}>{filtrando ? 'Nenhum lançamento com essa busca.' : 'Nenhum lançamento nesta fase.'}</p>
      )}
    </>
  );
}
