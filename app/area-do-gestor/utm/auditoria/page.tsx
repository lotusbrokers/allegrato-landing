import type { Metadata } from 'next';
import Link from 'next/link';
import { EtiquetaDaSeveridade } from '@/components/utm/Etiquetas';
import TabelaDeRegistros from '@/components/utm/TabelaDeRegistros';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { ORDEM_DAS_SEVERIDADES, ROTULO_DA_SEVERIDADE, VERIFICACOES, type CodigoDaVerificacao } from '@/lib/utm/auditoria';
import { carregarPainel, linhasDaTabela, nomeDoRegistro, ROTA_UTM, rotaDoRegistro } from '@/lib/utm/painel';
import type { Severidade } from '@/lib/utm/tipos';
import estilos from '@/components/utm/utm.module.css';

export const metadata: Metadata = { title: 'Auditoria de links' };

export default async function Auditoria({ searchParams }: { searchParams: Promise<{ severidade?: string; codigo?: string }> }) {
  await exigirGestor();
  const filtro = await searchParams;
  const painel = await carregarPainel();

  const ocorrencias = painel.registros.flatMap((r) =>
    (painel.problemas.get(r.chave) ?? []).map((p) => ({ registro: r, problema: p })),
  );
  const filtradas = ocorrencias.filter(
    ({ problema }) => (!filtro.severidade || problema.severidade === filtro.severidade) && (!filtro.codigo || problema.codigo === filtro.codigo),
  );
  const ordenadas = [...filtradas].sort(
    (a, b) => ORDEM_DAS_SEVERIDADES.indexOf(a.problema.severidade) - ORDEM_DAS_SEVERIDADES.indexOf(b.problema.severidade),
  );
  const contagem = (s: Severidade) => ocorrencias.filter((o) => o.problema.severidade === s).length;
  const chavesComProblema = new Set(filtradas.map((o) => o.registro.chave));

  return (
    <>
      <header className={estilos.cabecalhoDaPagina}>
        <h1>Auditoria de links</h1>
        <p>
          O que a Meta usa de fato: a URL de destino e os parâmetros de cada anúncio importado. Macro dinâmica ainda não trocada é o
          normal num anúncio no ar e não conta como defeito.
        </p>
      </header>

      <section className={estilos.indicadores} aria-label="Problemas por severidade">
        {ORDEM_DAS_SEVERIDADES.map((s) => (
          <div key={s} className={estilos.indicador}>
            <strong>{contagem(s)}</strong>
            <span>{ROTULO_DA_SEVERIDADE[s]}</span>
          </div>
        ))}
      </section>

      <form className={estilos.filtros} action={`${ROTA_UTM}/auditoria`}>
        <label>
          Severidade
          <select name="severidade" defaultValue={filtro.severidade ?? ''}>
            <option value="">Todas</option>
            {ORDEM_DAS_SEVERIDADES.map((s) => (
              <option key={s} value={s}>
                {ROTULO_DA_SEVERIDADE[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Verificação
          <select name="codigo" defaultValue={filtro.codigo ?? ''}>
            <option value="">Todas</option>
            {(Object.keys(VERIFICACOES) as CodigoDaVerificacao[]).map((c) => (
              <option key={c} value={c}>
                {VERIFICACOES[c].descricao}
              </option>
            ))}
          </select>
        </label>
        <div className={estilos.botoes}>
          <button type="submit" className={`${estilos.botao} ${estilos.botaoPrimario}`}>
            Filtrar
          </button>
          <Link href={`${ROTA_UTM}/auditoria`} className={estilos.botao}>
            Limpar
          </Link>
        </div>
      </form>

      {ordenadas.length === 0 ? (
        <p className={estilos.painel}>{painel.registros.length === 0 ? 'Nada importado ainda.' : 'Nenhum problema com esses filtros.'}</p>
      ) : (
        <div className={estilos.tabelaRolavel}>
          <table className={estilos.tabela}>
            <thead>
              <tr>
                <th>Severidade</th>
                <th>Registro</th>
                <th>Problema</th>
                <th>Como corrigir</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map(({ registro, problema }, i) => (
                <tr key={`${registro.chave}-${i}`}>
                  <td>
                    <EtiquetaDaSeveridade severidade={problema.severidade} />
                  </td>
                  <td>
                    <Link href={rotaDoRegistro(registro.chave)}>{nomeDoRegistro(registro)}</Link>
                    <span className={estilos.secundario}>{registro.dados.campanhaNome}</span>
                  </td>
                  <td>{problema.mensagem}</td>
                  <td>{problema.sugestao ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {chavesComProblema.size > 0 && (
        <section className={estilos.painel}>
          <h2>Exportar o relatório</h2>
          <p>Os registros com os problemas listados acima, com a auditoria de cada um.</p>
          <TabelaDeRegistros linhas={linhasDaTabela(painel.registros.filter((r) => chavesComProblema.has(r.chave)), painel)} />
        </section>
      )}
    </>
  );
}
