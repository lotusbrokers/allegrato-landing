import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { salvarRegistro } from '@/app/area-do-gestor/utm/acoes';
import { EtiquetaDaSeveridade, EtiquetaDoRastreamento } from '@/components/utm/Etiquetas';
import { dataHora } from '@/lib/utm/formato';
import Formulario from '@/components/utm/Formulario';
import PainelDaUtm from '@/components/utm/PainelDaUtm';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { DEFINICAO_DOS_CAMPOS, type CampoCsv } from '@/lib/utm/colunas';
import { carregarPainel, nomeDoRegistro, ROTA_UTM } from '@/lib/utm/painel';
import estilos from '@/components/utm/utm.module.css';

export const metadata: Metadata = { title: 'Registro' };

const FICHA: CampoCsv[] = [
  'contaNome',
  'contaId',
  'campanhaNome',
  'campanhaId',
  'campanhaStatus',
  'objetivo',
  'conjuntoNome',
  'conjuntoId',
  'conjuntoStatus',
  'anuncioNome',
  'anuncioId',
  'anuncioStatus',
  'veiculacao',
  'posicionamento',
  'inicio',
  'termino',
  'urlDestino',
  'parametrosUrl',
];

export default async function Registro({ params }: { params: Promise<{ chave: string }> }) {
  await exigirGestor();
  const { chave: bruta } = await params;
  const chave = decodeURIComponent(bruta);
  const painel = await carregarPainel();
  const registro = painel.estado.registros[chave];
  if (!registro) notFound();

  const problemas = painel.problemas.get(chave) ?? [];
  const eventos = painel.estado.historico.filter((e) => e.alvo === chave).slice(-20).reverse();
  const empreendimentoAtual = registro.associacao ? painel.empreendimentos.find((e) => e.id === registro.associacao?.empreendimentoId) : undefined;

  return (
    <>
      <Link href={`${ROTA_UTM}/campanhas`} className={estilos.secundario}>
        ← Campanhas ativas
      </Link>
      <header className={estilos.cabecalhoDaPagina}>
        <h1>{nomeDoRegistro(registro)}</h1>
        <p>
          {registro.nivel === 'anuncio' ? 'Anúncio' : registro.nivel === 'conjunto' ? 'Conjunto de anúncios' : 'Campanha'} da campanha{' '}
          {registro.dados.campanhaNome}. <EtiquetaDoRastreamento rastreamento={painel.rastreamento.get(chave) ?? 'ausente'} />
        </p>
        {registro.ausenteNaUltimaImportacao && (
          <p className={estilos.alerta}>Este registro não veio na última importação da conta. Pode ter sido pausado, excluído ou filtrado na exportação.</p>
        )}
      </header>

      <div className={estilos.duasColunas}>
        <section className={estilos.painel}>
          <h2>Dados importados</h2>
          <dl className={estilos.ficha}>
            {FICHA.filter((c) => registro.dados[c]).map((c) => (
              <div key={c} style={{ display: 'contents' }}>
                <dt>{DEFINICAO_DOS_CAMPOS[c].rotulo}</dt>
                <dd>{registro.dados[c]}</dd>
              </div>
            ))}
            <dt>Primeira importação</dt>
            <dd>{dataHora(registro.primeiraImportacao)}</dd>
            <dt>Última importação</dt>
            <dd>{dataHora(registro.ultimaImportacao)}</dd>
          </dl>
        </section>

        <section className={estilos.painel}>
          <h2>Empreendimento e observações</h2>
          {registro.associacao?.origem === 'url' && empreendimentoAtual && (
            <p>Associado a {empreendimentoAtual.nome} porque a URL de destino é a página dele no site. Salvar confirma a escolha.</p>
          )}
          <Formulario acao={salvarRegistro} rotulo="Salvar">
            <input type="hidden" name="chave" value={chave} />
            <label className={estilos.campo}>
              Empreendimento
              <select name="empreendimento" defaultValue={registro.associacao?.empreendimentoId ?? ''}>
                <option value="">Empreendimento não identificado</option>
                {painel.empreendimentos
                  .filter((e) => e.status === 'ativo' || e.id === registro.associacao?.empreendimentoId)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                      {e.construtora ? ` · ${e.construtora}` : ''}
                    </option>
                  ))}
              </select>
            </label>
            <label className={estilos.campo}>
              Observações
              <textarea name="observacoes" maxLength={1000} defaultValue={registro.observacoes} />
            </label>
          </Formulario>
        </section>
      </div>

      <PainelDaUtm chave={chave} configuracao={painel.estado.configuracao} dados={registro.dados} aplicacaoInicial={registro.aplicacao} />

      <section className={estilos.painel}>
        <h2>Auditoria</h2>
        {problemas.length === 0 ? (
          <p>Nenhum problema encontrado.</p>
        ) : (
          <ul className={estilos.lista}>
            {problemas.map((p, i) => (
              <li key={i}>
                <EtiquetaDaSeveridade severidade={p.severidade} /> {p.mensagem}
                {p.sugestao && <span className={estilos.secundario}>{p.sugestao}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={estilos.painel}>
        <h2>Histórico deste registro</h2>
        {eventos.length === 0 ? (
          <p>Nada registrado ainda.</p>
        ) : (
          <ul className={estilos.lista}>
            {eventos.map((e) => (
              <li key={e.id}>
                {dataHora(e.quando)}: {e.resumo}
                {e.usuario ? ` (${e.usuario.nome})` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
