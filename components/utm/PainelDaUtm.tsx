'use client';

import { useState } from 'react';
import { registrarEtapa } from '@/app/area-do-gestor/utm/acoes';
import { gerarDinamico } from '@/lib/utm/gerador';
import type { Aplicacao, Configuracao, DadosImportados, EstadoDaAplicacao } from '@/lib/utm/tipos';
import BotaoCopiar from './BotaoCopiar';
import { ROTULO_DA_ETAPA } from './Etiquetas';
import { dataHora } from '@/lib/utm/formato';
import GeradorEstatico from './GeradorEstatico';
import estilos from './utm.module.css';

const ORDEM: EstadoDaAplicacao[] = ['gerada', 'copiada', 'confirmada', 'validada'];

/**
 * A UTM de um registro: o texto do padrão para "Parâmetros de URL", a cópia,
 * a confirmação manual e a validação pela próxima importação. Cada passo é
 * registrado no servidor, que recalcula o texto pelo padrão salvo.
 */
export default function PainelDaUtm({ chave, configuracao, dados, aplicacaoInicial }: { chave: string; configuracao: Configuracao; dados: DadosImportados; aplicacaoInicial: Aplicacao | null }) {
  const [aplicacao, setAplicacao] = useState(aplicacaoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const modelo = gerarDinamico(configuracao, dados.urlDestino);
  const doPadraoAtual = aplicacao?.parametros === modelo.parametros;
  const etapaAtual = doPadraoAtual ? aplicacao?.estado : undefined;

  async function avancar(etapa: 'gerada' | 'copiada' | 'confirmada') {
    setErro(null);
    const resposta = await registrarEtapa({ chave, etapa });
    if (!resposta.ok) return setErro(resposta.erro);
    setAplicacao(resposta.aplicacao);
  }

  return (
    <section className={estilos.painel}>
      <h2>UTM deste registro</h2>
      <ol className={estilos.etapas} aria-label="Etapas da aplicação">
        {ORDEM.map((etapa) => (
          <li key={etapa} data-feita={etapaAtual ? ORDEM.indexOf(etapa) <= ORDEM.indexOf(etapaAtual) : false}>
            {ROTULO_DA_ETAPA[etapa]}
          </li>
        ))}
      </ol>
      {aplicacao && !doPadraoAtual && (
        <p className={estilos.alerta}>O padrão mudou depois da última geração ({dataHora(aplicacao.quando)}). Gere e aplique de novo.</p>
      )}
      {aplicacao && doPadraoAtual && (
        <p>
          {ROTULO_DA_ETAPA[aplicacao.estado]} em {dataHora(aplicacao.quando)}
          {aplicacao.usuario ? `, por ${aplicacao.usuario.nome}` : ''}.
          {aplicacao.estado === 'confirmada' && ' A próxima importação confere se a Meta gravou os mesmos parâmetros.'}
        </p>
      )}

      <h3>Modo dinâmico: para o campo "Parâmetros de URL" do Meta Ads</h3>
      {!etapaAtual ? (
        <div className={estilos.botoes}>
          <button type="button" className={`${estilos.botao} ${estilos.botaoPrimario}`} onClick={() => avancar('gerada')}>
            Gerar os parâmetros do padrão
          </button>
        </div>
      ) : (
        <code className={estilos.codigo}>{modelo.parametros}</code>
      )}
      {modelo.erro && <p className={estilos.alerta}>URL de destino com problema: {modelo.erro}</p>}
      {modelo.conflitosNaUrl.length > 0 && (
        <div className={estilos.alerta}>
          <strong>A URL de destino já tem UTM</strong>
          A Meta junta a URL e os parâmetros, e o relatório receberia o parâmetro duas vezes:
          <ul className={estilos.lista}>
            {modelo.conflitosNaUrl.map((c) => (
              <li key={c.chave}>
                {c.chave}: na URL "{c.atual}", no padrão "{c.novo}"
              </li>
            ))}
          </ul>
          Tire esses parâmetros da URL de destino no Meta Ads antes de aplicar o padrão.
        </div>
      )}
      {etapaAtual && modelo.previa && (
        <>
          <p>Como o link fica (as macros viram valor no clique):</p>
          <code className={estilos.codigo}>{modelo.previa}</code>
        </>
      )}
      <div className={estilos.botoes}>
        {etapaAtual && <BotaoCopiar texto={modelo.parametros} rotulo="Copiar parâmetros" aoCopiar={() => avancar('copiada')} />}
        {!confirmando ? (
          <button type="button" className={estilos.botao} onClick={() => setConfirmando(true)} disabled={!etapaAtual || etapaAtual === 'confirmada' || etapaAtual === 'validada'}>
            Marcar como aplicada no Meta Ads
          </button>
        ) : (
          <span className={estilos.botoes}>
            <span>Você colou estes parâmetros no anúncio e publicou?</span>
            <button
              type="button"
              className={`${estilos.botao} ${estilos.botaoPrimario}`}
              onClick={async () => {
                setConfirmando(false);
                await avancar('confirmada');
              }}
            >
              Sim, apliquei
            </button>
            <button type="button" className={estilos.botao} onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </span>
        )}
      </div>
      {etapaAtual === 'gerada' && <p className={estilos.secundario}>Copie os parâmetros e cole no anúncio; depois confirme aqui.</p>}
      {erro && (
        <p className={estilos.alerta} role="alert">
          {erro}
        </p>
      )}

      <details>
        <summary>Como aplicar no Meta Ads</summary>
        <ol className={estilos.lista}>
          <li>Copie os parâmetros acima.</li>
          <li>No Gerenciador de Anúncios, abra este anúncio para editar e vá até a parte de destino e rastreamento.</li>
          <li>Cole o texto em "Parâmetros de URL" e publique.</li>
          <li>Volte aqui e marque como aplicada. A próxima importação do CSV valida se a Meta gravou o mesmo texto.</li>
        </ol>
      </details>

      <h3>Modo estático: um link pronto, com os valores deste registro</h3>
      <p>Para usar fora do Meta Ads, como bio ou mensagem. Não muda a situação da UTM do anúncio.</p>
      <GeradorEstatico configuracao={configuracao} urlInicial={dados.urlDestino ?? ''} dados={dados} />
    </section>
  );
}
