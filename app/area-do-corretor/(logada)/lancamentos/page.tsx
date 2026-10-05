import type { Metadata } from 'next';
import Link from 'next/link';
import { CartaoLancamento } from '@/components/area-do-corretor/Cartoes';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { catalogo } from '@/lib/area-do-corretor/dados';
import { ROTA_BASE } from '@/lib/area-do-corretor/acesso';
import {
  OPCOES_METRAGEM,
  OPCOES_QUARTOS,
  OPCOES_VALOR,
  filtrarLancamentos,
  lerFiltros,
  rotuloDeValor,
  temFiltro,
  type FiltrosDeLancamento,
} from '@/lib/area-do-corretor/filtros';
import estilos from '@/components/area-do-corretor/area.module.css';

export const metadata: Metadata = { title: 'Lançamentos' };

const ROTA = `${ROTA_BASE}/lancamentos`;

type Busca = { fase?: string; quartos?: string; m2?: string; valor?: string };

/** URL da lista com estes parâmetros, sem os vazios. */
function rotaCom(params: { fase?: string; filtros?: FiltrosDeLancamento }): string {
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
  // "quartos, metragem ou valor": o que a busca pediu e o cadastro pode não ter.
  const pedidos = [filtros.quartos && 'quartos', filtros.m2 && 'metragem', filtros.valor && 'valor'].filter(
    (c): c is string => Boolean(c),
  );
  const faltantes = pedidos.length > 1 ? `${pedidos.slice(0, -1).join(', ')} ou ${pedidos[pedidos.length - 1]}` : pedidos[0];

  return (
    <>
      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>Lançamentos</h1>
        <p className={estilos.subtitulo}>
          {lancamentos.length} empreendimentos que a Lotus comercializa. Cada um tem a ficha, o link da página pública
          para mandar ao cliente e os materiais da pasta dele no Drive.
        </p>
      </div>

      {/* GET simples: funciona sem JavaScript e a busca fica na URL, para voltar a ela ou mandar a um colega. */}
      <form method="get" action={ROTA} className={estilos.filtros} aria-label="Buscar lançamentos">
        {fase && <input type="hidden" name="fase" value={fase} />}
        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Quartos</span>
          <select name="quartos" defaultValue={filtros.quartos ?? ''} className={estilos.entradaTexto}>
            <option value="">Qualquer</option>
            {OPCOES_QUARTOS.map((n) => (
              <option key={n} value={n}>
                {n} ou mais
              </option>
            ))}
          </select>
        </label>
        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Metragem</span>
          <select name="m2" defaultValue={filtros.m2 ?? ''} className={estilos.entradaTexto}>
            <option value="">Qualquer</option>
            {OPCOES_METRAGEM.map((n) => (
              <option key={n} value={n}>
                Mín. {n} m²
              </option>
            ))}
          </select>
        </label>
        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Valor</span>
          <select name="valor" defaultValue={filtros.valor ?? ''} className={estilos.entradaTexto}>
            <option value="">Qualquer</option>
            {OPCOES_VALOR.map((n) => (
              <option key={n} value={n}>
                Até {rotuloDeValor(n)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={`${estilos.botao} ${estilos.botaoPrimario}`}>
          Buscar
        </button>
      </form>

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
        <p className={estilos.resumoFiltro} role="status">
          {ordenados.length} de {daFase.length} {ordenados.length === 1 ? 'lançamento' : 'lançamentos'}
          {semDado > 0 && ` · ${semDado} sem ${faltantes} no cadastro ${semDado === 1 ? 'ficou' : 'ficaram'} de fora`}
          {' · '}
          <Link href={rotaCom({ fase })}>Limpar busca</Link>
        </p>
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
