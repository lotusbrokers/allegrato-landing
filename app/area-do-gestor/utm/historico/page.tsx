import type { Metadata } from 'next';
import Link from 'next/link';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { armazem, LIMITE_DO_HISTORICO } from '@/lib/utm/armazem';
import { dataHora } from '@/lib/utm/formato';
import { ROTA_UTM, rotaDoRegistro } from '@/lib/utm/painel';
import type { TipoDeEvento } from '@/lib/utm/tipos';
import estilos from '@/components/utm/utm.module.css';

export const metadata: Metadata = { title: 'Histórico' };

const ROTULO_DO_TIPO: Record<TipoDeEvento, string> = {
  importacao: 'Importação',
  atualizacao: 'Atualização',
  geracao: 'Geração de parâmetros',
  copia: 'Cópia de parâmetros',
  confirmacao: 'Aplicação confirmada',
  associacao: 'Associação de empreendimento',
  exportacao: 'Exportação',
  configuracao: 'Configuração',
  empreendimento: 'Empreendimento',
  construtora: 'Construtora',
};

const POR_PAGINA = 200;

export default async function Historico({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await exigirGestor();
  const { tipo } = await searchParams;
  const estado = await armazem().ler();
  const eventos = [...estado.historico].reverse().filter((e) => !tipo || e.tipo === tipo);

  return (
    <>
      <header className={estilos.cabecalhoDaPagina}>
        <h1>Histórico</h1>
        <p>
          Quem fez o quê e quando: importações, associações, gerações e cópias de parâmetros, confirmações, exportações e mudanças
          de configuração. Ficam os {LIMITE_DO_HISTORICO.toLocaleString('pt-BR')} eventos mais recentes.
        </p>
      </header>

      <form className={estilos.filtros} action={`${ROTA_UTM}/historico`}>
        <label>
          Tipo
          <select name="tipo" defaultValue={tipo ?? ''}>
            <option value="">Todos</option>
            {(Object.keys(ROTULO_DO_TIPO) as TipoDeEvento[]).map((t) => (
              <option key={t} value={t}>
                {ROTULO_DO_TIPO[t]}
              </option>
            ))}
          </select>
        </label>
        <div className={estilos.botoes}>
          <button type="submit" className={`${estilos.botao} ${estilos.botaoPrimario}`}>
            Filtrar
          </button>
        </div>
      </form>

      {eventos.length === 0 ? (
        <p className={estilos.painel}>Nada registrado ainda.</p>
      ) : (
        <div className={estilos.tabelaRolavel}>
          <table className={estilos.tabela}>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Quem</th>
                <th>Tipo</th>
                <th>O que mudou</th>
              </tr>
            </thead>
            <tbody>
              {eventos.slice(0, POR_PAGINA).map((e) => (
                <tr key={e.id}>
                  <td>{dataHora(e.quando)}</td>
                  <td>{e.usuario?.nome ?? '—'}</td>
                  <td>{ROTULO_DO_TIPO[e.tipo]}</td>
                  <td>
                    {e.resumo}
                    {e.alvo && estado.registros[e.alvo] && (
                      <span className={estilos.secundario}>
                        <Link href={rotaDoRegistro(e.alvo)}>Abrir o registro</Link>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {eventos.length > POR_PAGINA && <p className={estilos.secundario}>Mostrando os {POR_PAGINA} mais recentes de {eventos.length}.</p>}
    </>
  );
}
