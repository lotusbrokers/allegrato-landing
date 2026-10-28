import type { Metadata } from 'next';
import Link from 'next/link';
import TabelaDeRegistros from '@/components/utm/TabelaDeRegistros';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { ROTULO_DO_RASTREAMENTO, type Rastreamento } from '@/lib/utm/auditoria';
import { carregarPainel, linhasDaTabela, nomeDoRegistro, ROTA_UTM, statusDo } from '@/lib/utm/painel';
import estilos from '@/components/utm/utm.module.css';

export const metadata: Metadata = { title: 'Campanhas ativas' };

type Busca = { q?: string; empreendimento?: string; construtora?: string; status?: string; problema?: string; ordem?: string };

export default async function Campanhas({ searchParams }: { searchParams: Promise<Busca> }) {
  await exigirGestor();
  const busca = await searchParams;
  const painel = await carregarPainel();
  const porId = new Map(painel.empreendimentos.map((e) => [e.id, e]));

  const termo = busca.q?.trim().toLowerCase() ?? '';
  const filtrados = painel.registros.filter((r) => {
    const d = r.dados;
    const empreendimento = r.associacao ? porId.get(r.associacao.empreendimentoId) : undefined;
    const status = statusDo(r);
    if (termo) {
      const texto = [d.campanhaNome, d.conjuntoNome, d.anuncioNome, d.campanhaId, d.conjuntoId, d.anuncioId].join(' ').toLowerCase();
      if (!texto.includes(termo)) return false;
    }
    if (busca.empreendimento === 'nenhum' && empreendimento) return false;
    if (busca.empreendimento && busca.empreendimento !== 'nenhum' && r.associacao?.empreendimentoId !== busca.empreendimento) return false;
    if (busca.construtora && empreendimento?.construtora !== busca.construtora) return false;
    if (busca.status === 'ativo' && !status.ativo) return false;
    if (busca.status === 'desligado' && status.ativo) return false;
    if (busca.status === 'ausente' && !r.ausenteNaUltimaImportacao) return false;
    if (busca.problema && painel.rastreamento.get(r.chave) !== busca.problema) return false;
    return true;
  });

  const ordenados = [...filtrados].sort((a, b) =>
    busca.ordem === 'recentes'
      ? b.ultimaImportacao.localeCompare(a.ultimaImportacao)
      : (a.dados.campanhaNome ?? '').localeCompare(b.dados.campanhaNome ?? '', 'pt-BR') || nomeDoRegistro(a).localeCompare(nomeDoRegistro(b), 'pt-BR'),
  );

  const linhas = linhasDaTabela(ordenados, painel);

  const comEmpreendimento = painel.empreendimentos.filter((e) => painel.registros.some((r) => r.associacao?.empreendimentoId === e.id));

  return (
    <>
      <header className={estilos.cabecalhoDaPagina}>
        <h1>Campanhas ativas</h1>
        <p>
          {painel.registros.length} registros importados. Pesquise por nome ou ID; abra um registro para associar o empreendimento,
          gerar e copiar a UTM.
        </p>
      </header>

      <form className={estilos.filtros} action={`${ROTA_UTM}/campanhas`}>
        <label>
          Nome ou ID
          <input type="search" name="q" defaultValue={busca.q ?? ''} />
        </label>
        <label>
          Empreendimento
          <select name="empreendimento" defaultValue={busca.empreendimento ?? ''}>
            <option value="">Todos</option>
            <option value="nenhum">Não identificado</option>
            {comEmpreendimento.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Construtora
          <select name="construtora" defaultValue={busca.construtora ?? ''}>
            <option value="">Todas</option>
            {painel.construtoras.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select name="status" defaultValue={busca.status ?? ''}>
            <option value="">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="desligado">Desligados depois de importados</option>
            <option value="ausente">Não vieram na última importação</option>
          </select>
        </label>
        <label>
          Rastreamento
          <select name="problema" defaultValue={busca.problema ?? ''}>
            <option value="">Todos</option>
            {(Object.keys(ROTULO_DO_RASTREAMENTO) as Rastreamento[]).map((r) => (
              <option key={r} value={r}>
                {ROTULO_DO_RASTREAMENTO[r]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ordem
          <select name="ordem" defaultValue={busca.ordem ?? ''}>
            <option value="">Por nome</option>
            <option value="recentes">Importados por último</option>
          </select>
        </label>
        <div className={estilos.botoes}>
          <button type="submit" className={`${estilos.botao} ${estilos.botaoPrimario}`}>
            Filtrar
          </button>
          <Link href={`${ROTA_UTM}/campanhas`} className={estilos.botao}>
            Limpar
          </Link>
        </div>
      </form>

      {painel.registros.length === 0 ? (
        <p className={estilos.painel}>
          Nenhum registro ainda. <Link href={`${ROTA_UTM}/importar`}>Importe o CSV do Meta Ads</Link>.
        </p>
      ) : linhas.length === 0 ? (
        <p className={estilos.painel}>Nenhum registro com esses filtros.</p>
      ) : (
        <TabelaDeRegistros linhas={linhas} />
      )}
    </>
  );
}
