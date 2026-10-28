import Link from 'next/link';
import { dataHora, plural } from '@/lib/utm/formato';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { META_API } from '@/lib/utm/meta-api';
import { carregarPainel, ROTA_UTM } from '@/lib/utm/painel';
import estilos from '@/components/utm/utm.module.css';

export default async function VisaoGeral() {
  await exigirGestor();
  const painel = await carregarPainel();
  const { registros, rastreamento, estado } = painel;

  const campanhas = new Set(registros.map((r) => r.dados.campanhaId).filter(Boolean)).size;
  const anuncios = registros.filter((r) => r.nivel === 'anuncio').length;
  const contar = (...situacoes: string[]) => registros.filter((r) => situacoes.includes(rastreamento.get(r.chave) ?? '')).length;
  const aguardando = registros.filter((r) => r.aplicacao && (r.aplicacao.estado === 'gerada' || r.aplicacao.estado === 'copiada')).length;
  const confirmadas = registros.filter((r) => r.aplicacao?.estado === 'confirmada').length;
  const validadas = registros.filter((r) => r.aplicacao?.estado === 'validada').length;
  const ausentes = registros.filter((r) => r.ausenteNaUltimaImportacao).length;
  const ultimo = estado.lotes.at(-1);

  return (
    <>
      <header className={estilos.cabecalhoDaPagina}>
        <h1>UTM Manager</h1>
        <p>
          As UTMs das campanhas ativas do Meta Ads da Lotus: de onde veio cada acesso ao site, por campanha, empreendimento,
          conjunto e anúncio. Os números abaixo saem só do que foi importado aqui.
        </p>
      </header>

      {registros.length === 0 ? (
        <section className={estilos.painel}>
          <h2>Nenhuma campanha importada ainda</h2>
          <p>
            Exporte as campanhas ativas no Gerenciador de Anúncios em CSV e importe aqui. A ferramenta mostra uma prévia antes
            de gravar qualquer coisa.
          </p>
          <div className={estilos.botoes}>
            <Link href={`${ROTA_UTM}/importar`} className={`${estilos.botao} ${estilos.botaoPrimario}`}>
              Importar CSV
            </Link>
            <Link href={`${ROTA_UTM}/gerador`} className={estilos.botao}>
              Gerar UTMs
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className={estilos.indicadores} aria-label="Indicadores">
            <div className={estilos.indicador}>
              <strong>{campanhas}</strong>
              <span>campanhas importadas</span>
            </div>
            <div className={estilos.indicador}>
              <strong>{anuncios}</strong>
              <span>anúncios identificados</span>
            </div>
            <div className={estilos.indicador}>
              <strong>{contar('valido')}</strong>
              <span>com UTM válida</span>
            </div>
            <div className={estilos.indicador}>
              <strong>{contar('ausente', 'atencao')}</strong>
              <span>sem rastreamento adequado</span>
            </div>
            <div className={estilos.indicador}>
              <strong>{contar('critico')}</strong>
              <span>com problema crítico</span>
            </div>
            <div className={estilos.indicador}>
              <strong>{ausentes}</strong>
              <span>não vieram na última importação</span>
            </div>
          </section>

          <div className={estilos.duasColunas}>
            <section className={estilos.painel}>
              <h2>Última importação</h2>
              {ultimo ? (
                <>
                  <p>
                    {dataHora(ultimo.quando)}, por {ultimo.usuario?.nome ?? 'alguém sem nome registrado'}, do arquivo {ultimo.arquivo}.
                  </p>
                  <ul className={estilos.lista}>
                    <li>{plural(ultimo.contagens.encontrados, 'registro encontrado', 'registros encontrados')}</li>
                    <li>
                      {plural(ultimo.contagens.importados, 'importado', 'importados')} ({ultimo.contagens.novos} novos,{' '}
                      {ultimo.contagens.atualizados} atualizados)
                    </li>
                    <li>{plural(ultimo.contagens.ignorados, 'ignorado', 'ignorados')}</li>
                  </ul>
                </>
              ) : (
                <p>Nenhuma ainda.</p>
              )}
            </section>
            <section className={estilos.painel}>
              <h2>Situação da validação</h2>
              <ul className={estilos.lista}>
                <li>{plural(aguardando, 'registro com UTM gerada ou copiada, aguardando confirmação', 'registros com UTM gerada ou copiada, aguardando confirmação')}</li>
                <li>{plural(confirmadas, 'aplicação confirmada à mão', 'aplicações confirmadas à mão')}, ainda sem nova importação para conferir</li>
                <li>{plural(validadas, 'validada por nova importação', 'validadas por nova importação')}</li>
              </ul>
            </section>
          </div>

          <div className={estilos.botoes}>
            <Link href={`${ROTA_UTM}/importar`} className={`${estilos.botao} ${estilos.botaoPrimario}`}>
              Importar CSV
            </Link>
            <Link href={`${ROTA_UTM}/gerador`} className={estilos.botao}>
              Gerar UTMs
            </Link>
            <Link href={`${ROTA_UTM}/auditoria`} className={estilos.botao}>
              Ver a auditoria
            </Link>
          </div>
        </>
      )}

      <section className={estilos.painel}>
        <h2>Integração com a Meta</h2>
        <p>
          {META_API.situacao}. {META_API.explicacao}
        </p>
      </section>
    </>
  );
}
