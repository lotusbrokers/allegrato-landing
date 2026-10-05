import Link from 'next/link';
import { OPCOES_METRAGEM, OPCOES_QUARTOS, OPCOES_VALOR, rotuloDeValor, type FiltrosDaBusca } from '@/lib/area-do-corretor/filtros';
import estilos from './area.module.css';

/**
 * Busca por quartos, metragem e valor, nas listas de lançamentos e de imóveis de
 * terceiros da área. GET simples: funciona sem JavaScript e a busca fica na URL,
 * para voltar a ela ou mandar a um colega. `manter` repete como campo oculto o
 * que a lista já filtrava por link (fase, tipo, finalidade).
 */
export function FormularioDeBusca({
  acao,
  filtros,
  manter,
  rotulo,
}: {
  acao: string;
  filtros: FiltrosDaBusca;
  manter: Record<string, string | undefined>;
  rotulo: string;
}) {
  return (
    <form method="get" action={acao} className={estilos.filtros} aria-label={rotulo}>
      {Object.entries(manter).map(([nome, valor]) => (valor ? <input key={nome} type="hidden" name={nome} value={valor} /> : null))}
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
  );
}

/**
 * "5 de 36 lançamentos · 25 sem quartos ou valor no cadastro ficaram de fora ·
 * Limpar busca". Só aparece com busca ativa.
 */
export function ResumoDaBusca({
  encontrados,
  total,
  semDado,
  filtros,
  limpar,
  nome,
}: {
  encontrados: number;
  total: number;
  semDado: number;
  filtros: FiltrosDaBusca;
  limpar: string;
  nome: { singular: string; plural: string };
}) {
  // "quartos, metragem ou valor": o que a busca pediu e o cadastro pode não ter.
  const pedidos = [filtros.quartos && 'quartos', filtros.m2 && 'metragem', filtros.valor && 'valor'].filter(
    (c): c is string => Boolean(c),
  );
  const faltantes = pedidos.length > 1 ? `${pedidos.slice(0, -1).join(', ')} ou ${pedidos[pedidos.length - 1]}` : pedidos[0];

  return (
    <p className={estilos.resumoFiltro} role="status">
      {encontrados} de {total} {encontrados === 1 ? nome.singular : nome.plural}
      {semDado > 0 && ` · ${semDado} sem ${faltantes} no cadastro ${semDado === 1 ? 'ficou' : 'ficaram'} de fora`}
      {' · '}
      <Link href={limpar}>Limpar busca</Link>
    </p>
  );
}
