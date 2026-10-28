'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { confirmarImportacao, previaDaImportacao } from '@/app/area-do-gestor/utm/acoes';
import { aplicarMapeamento, camposQueFaltam, CAMPOS_CSV, DEFINICAO_DOS_CAMPOS, mapearColunas, type LinhaMapeada, type Mapeamento } from '@/lib/utm/colunas';
import { decodificarArquivo, lerCsv, type Tabela } from '@/lib/utm/csv';
import { plural } from '@/lib/utm/formato';
import { MAXIMO_DE_LINHAS, type Candidato, type Previa } from '@/lib/utm/importacao';
import type { ContagensDaImportacao, Lote } from '@/lib/utm/tipos';
import estilos from './utm.module.css';

/** Arquivo maior que isso não é exportação de campanhas ativas. */
const TAMANHO_MAXIMO = 20 * 1024 * 1024;
/** Margem sob o limite de 1 MB que o Next impõe ao corpo de uma Server Action. */
const ENVIO_MAXIMO = 950 * 1024;

const ROTULO_DA_ELEGIBILIDADE = { elegivel: 'Elegível', inelegivel: 'Fora do escopo', revisao: 'Precisa de revisão' };
const ROTULO_DA_SITUACAO = { novo: 'Novo', atualizacao: 'Atualiza', 'sem-mudanca': 'Sem mudança' };

type Etapa = { tipo: 'escolher' } | { tipo: 'mapear' } | { tipo: 'previa'; previa: Previa } | { tipo: 'concluida'; lote: Lote };

/**
 * Importação do CSV do Meta Ads em etapas: arquivo, colunas, prévia,
 * confirmação e relatório. O arquivo é lido aqui no navegador; para o
 * servidor vão só os campos mapeados, que ele valida de novo. Nada é gravado
 * antes da confirmação.
 */
export default function Importador({ base }: { base: string }) {
  const [etapa, setEtapa] = useState<Etapa>({ tipo: 'escolher' });
  const [arquivo, setArquivo] = useState('');
  const [tabela, setTabela] = useState<Tabela | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [mapeamento, setMapeamento] = useState<Mapeamento | null>(null);
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const linhas: LinhaMapeada[] = useMemo(() => (tabela && mapeamento ? aplicarMapeamento(tabela.linhas, mapeamento) : []), [tabela, mapeamento]);
  const faltando = mapeamento ? camposQueFaltam(mapeamento) : [];

  async function lerArquivo(lista: FileList | null) {
    setErro(null);
    const escolhido = lista?.[0];
    if (!escolhido) return;
    if (!/\.(csv|txt)$/i.test(escolhido.name)) return setErro('Escolha um arquivo .csv exportado do Meta Ads.');
    if (escolhido.size === 0) return setErro('O arquivo está vazio.');
    if (escolhido.size > TAMANHO_MAXIMO) return setErro('O arquivo passa de 20 MB. Exporte só as campanhas ativas.');
    const texto = decodificarArquivo(new Uint8Array(await escolhido.arrayBuffer()));
    const lida = lerCsv(texto.texto);
    if (lida.cabecalho.length === 0 || lida.linhas.length === 0) return setErro(lida.avisos.join(' ') || 'O arquivo não tem linhas de dados.');
    if (lida.linhas.length > MAXIMO_DE_LINHAS) return setErro(`O arquivo tem ${lida.linhas.length} linhas; o limite por importação é ${MAXIMO_DE_LINHAS}.`);
    setArquivo(escolhido.name);
    setTabela(lida);
    setAvisos([texto.aviso, ...lida.avisos].filter((a): a is string => Boolean(a)));
    setMapeamento(mapearColunas(lida.cabecalho).mapeamento);
    setEtapa({ tipo: 'mapear' });
  }

  function cabeEmUmEnvio(dados: unknown): boolean {
    if (new Blob([JSON.stringify(dados)]).size <= ENVIO_MAXIMO) return true;
    setErro('Os dados mapeados passam do limite de uma importação. Divida o arquivo (por campanha, por exemplo) e importe em partes.');
    return false;
  }

  async function gerarPrevia() {
    setErro(null);
    if (!cabeEmUmEnvio({ linhas })) return;
    setEnviando(true);
    const resposta = await previaDaImportacao({ linhas });
    setEnviando(false);
    if (!resposta.ok) return setErro(resposta.erro);
    const importaveis = resposta.previa.candidatos.filter((c) => c.chave && c.elegibilidade === 'elegivel' && !c.duplicadoNoArquivo);
    setEscolhidos(new Set(importaveis.map((c) => c.chave as string)));
    setEtapa({ tipo: 'previa', previa: resposta.previa });
  }

  async function confirmar() {
    setErro(null);
    const dados = { arquivo, linhas, escolhidos: [...escolhidos] };
    if (!cabeEmUmEnvio(dados)) return;
    setEnviando(true);
    const resposta = await confirmarImportacao(dados);
    setEnviando(false);
    if (!resposta.ok) return setErro(resposta.erro);
    setEtapa({ tipo: 'concluida', lote: resposta.lote });
  }

  function recomecar() {
    setEtapa({ tipo: 'escolher' });
    setTabela(null);
    setMapeamento(null);
    setAvisos([]);
    setErro(null);
  }

  return (
    <div className={estilos.ferramenta}>
      {erro && (
        <p className={estilos.alerta} role="alert">
          {erro}
        </p>
      )}

      {etapa.tipo === 'escolher' && (
        <section className={estilos.painel}>
          <h2>1. Arquivo</h2>
          <p>CSV exportado do Gerenciador de Anúncios, em português ou em inglês, separado por vírgula ou ponto e vírgula.</p>
          <label className={estilos.campo}>
            Arquivo CSV
            <input type="file" accept=".csv,.txt,text/csv" onChange={(e) => lerArquivo(e.target.files)} />
          </label>
        </section>
      )}

      {etapa.tipo === 'mapear' && tabela && mapeamento && (
        <section className={estilos.painel}>
          <h2>2. Colunas</h2>
          <p>
            {arquivo}: {tabela.linhas.length} linhas, separadas por {tabela.delimitador === ';' ? 'ponto e vírgula' : tabela.delimitador === ',' ? 'vírgula' : 'tabulação'}.
            Confira a coluna de cada campo; o que não foi reconhecido pode ser escolhido aqui.
          </p>
          {avisos.length > 0 && (
            <div className={estilos.alerta} role="status">
              <strong>Avisos da leitura</strong>
              <ul className={estilos.lista}>
                {avisos.slice(0, 12).map((a) => (
                  <li key={a}>{a}</li>
                ))}
                {avisos.length > 12 && <li>e mais {avisos.length - 12} avisos.</li>}
              </ul>
            </div>
          )}
          <div className={estilos.filtros}>
            {CAMPOS_CSV.map((campo) => (
              <label key={campo}>
                {DEFINICAO_DOS_CAMPOS[campo].rotulo}
                <select
                  value={mapeamento[campo] ?? ''}
                  onChange={(e) => setMapeamento({ ...mapeamento, [campo]: e.target.value === '' ? null : Number(e.target.value) })}
                >
                  <option value="">Não está no arquivo</option>
                  {tabela.cabecalho.map((nome, i) => (
                    <option key={`${nome}-${i}`} value={i}>
                      {nome || `Coluna ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {faltando.length > 0 && (
            <p className={estilos.alerta} role="status">
              Para importar, indique a coluna de: {faltando.map((c) => DEFINICAO_DOS_CAMPOS[c].rotulo).join(' e ')}. Sem o ID da campanha não há
              como reconhecer o registro numa próxima importação.
            </p>
          )}
          <div className={estilos.botoes}>
            <button type="button" className={`${estilos.botao} ${estilos.botaoPrimario}`} onClick={gerarPrevia} disabled={enviando || faltando.length > 0}>
              {enviando ? 'Gerando a prévia…' : 'Ver a prévia'}
            </button>
            <button type="button" className={estilos.botao} onClick={recomecar}>
              Escolher outro arquivo
            </button>
          </div>
        </section>
      )}

      {etapa.tipo === 'previa' && (
        <Previsao
          previa={etapa.previa}
          escolhidos={escolhidos}
          alternar={(chave) => {
            const proximo = new Set(escolhidos);
            if (proximo.has(chave)) proximo.delete(chave);
            else proximo.add(chave);
            setEscolhidos(proximo);
          }}
          confirmar={confirmar}
          voltar={() => setEtapa({ tipo: 'mapear' })}
          enviando={enviando}
        />
      )}

      {etapa.tipo === 'concluida' && (
        <section className={estilos.painel}>
          <h2>Importação concluída</h2>
          <RelatorioDoLote c={etapa.lote.contagens} />
          <div className={estilos.botoes}>
            <Link href={`${base}/campanhas`} className={`${estilos.botao} ${estilos.botaoPrimario}`}>
              Ver as campanhas
            </Link>
            <Link href={`${base}/auditoria`} className={estilos.botao}>
              Ver a auditoria
            </Link>
            <button type="button" className={estilos.botao} onClick={recomecar}>
              Importar outro arquivo
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function RelatorioDoLote({ c }: { c: ContagensDaImportacao }) {
  const semMudanca = c.importados - c.novos - c.atualizados;
  return (
    <ul className={estilos.lista}>
      <li>{plural(c.encontrados, 'registro encontrado no arquivo', 'registros encontrados no arquivo')}</li>
      <li>{plural(c.elegiveis, 'elegível', 'elegíveis')}</li>
      <li>
        {plural(c.importados, 'importado', 'importados')}: {c.novos} {c.novos === 1 ? 'novo' : 'novos'}, {c.atualizados}{' '}
        {c.atualizados === 1 ? 'atualizado' : 'atualizados'} e {semMudanca} sem mudança
      </li>
      {c.validados > 0 && <li>{plural(c.validados, 'UTM validada: a Meta devolveu os parâmetros aplicados', 'UTMs validadas: a Meta devolveu os parâmetros aplicados')}</li>}
      {c.desligados > 0 && <li>{plural(c.desligados, 'já cadastrado veio desligado e teve o status atualizado', 'já cadastrados vieram desligados e tiveram o status atualizado')}</li>}
      <li>{plural(c.duplicados, 'duplicado no arquivo', 'duplicados no arquivo')}</li>
      <li>{plural(c.revisao, 'precisa de revisão', 'precisam de revisão')}</li>
      <li>{plural(c.ignorados, 'ignorado no total', 'ignorados no total')}</li>
    </ul>
  );
}

function Previsao({
  previa,
  escolhidos,
  alternar,
  confirmar,
  voltar,
  enviando,
}: {
  previa: Previa;
  escolhidos: Set<string>;
  alternar: (chave: string) => void;
  confirmar: () => void;
  voltar: () => void;
  enviando: boolean;
}) {
  const c = previa.contagens;
  const importavel = (x: Candidato) => Boolean(x.chave) && x.elegibilidade === 'elegivel' && !x.duplicadoNoArquivo;
  const escolhidosNovos = previa.candidatos.filter((x) => importavel(x) && escolhidos.has(x.chave as string));
  return (
    <section className={estilos.painel}>
      <h2>3. Prévia</h2>
      <p>
        {plural(c.encontrados, 'encontrado', 'encontrados')} · {plural(c.elegiveis, 'elegível', 'elegíveis')} ({c.novos}{' '}
        {c.novos === 1 ? 'novo' : 'novos'}, {c.atualizados} com mudança) · {plural(c.duplicados, 'duplicado', 'duplicados')} no arquivo ·{' '}
        {c.revisao} para revisar
        {c.desligados > 0 ? ` · ${plural(c.desligados, 'já cadastrado que veio desligado (o status será atualizado)', 'já cadastrados que vieram desligados (o status deles será atualizado)')}` : ''}.
      </p>
      <p>Entram na importação só os elegíveis marcados. Os demais ficam de fora, com o motivo ao lado.</p>
      <div className={estilos.tabelaRolavel}>
        <table className={estilos.tabela}>
          <thead>
            <tr>
              <th>Importar</th>
              <th>Linha</th>
              <th>Campanha / conjunto / anúncio</th>
              <th>Situação</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {previa.candidatos.map((x) => (
              <tr key={`${x.linha}-${x.chave}`}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Importar a linha ${x.linha}`}
                    checked={Boolean(x.chave && escolhidos.has(x.chave)) && importavel(x)}
                    disabled={!importavel(x)}
                    onChange={() => x.chave && alternar(x.chave)}
                  />
                </td>
                <td>{x.linha}</td>
                <td>
                  {x.dados.campanhaNome ?? '—'}
                  {x.dados.conjuntoNome && <span className={estilos.secundario}>{x.dados.conjuntoNome}</span>}
                  {x.dados.anuncioNome && <span className={estilos.secundario}>{x.dados.anuncioNome}</span>}
                </td>
                <td>
                  <span className={`${estilos.etiqueta} ${x.elegibilidade === 'elegivel' ? estilos.valido : x.elegibilidade === 'revisao' ? estilos.atencao : estilos.neutro}`}>
                    {x.duplicadoNoArquivo ? 'Duplicado' : ROTULO_DA_ELEGIBILIDADE[x.elegibilidade]}
                  </span>
                  {importavel(x) && <span className={estilos.secundario}>{ROTULO_DA_SITUACAO[x.situacao]}</span>}
                  {x.mudancas.length > 0 && <span className={estilos.secundario}>Muda: {x.mudancas.join(', ')}</span>}
                </td>
                <td>{x.motivos.join(' ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={estilos.botoes} style={{ marginTop: 12 }}>
        <button type="button" className={`${estilos.botao} ${estilos.botaoPrimario}`} onClick={confirmar} disabled={enviando || (escolhidosNovos.length === 0 && c.desligados === 0)}>
          {enviando ? 'Importando…' : `Importar ${escolhidosNovos.length} ${escolhidosNovos.length === 1 ? 'registro' : 'registros'}`}
        </button>
        <button type="button" className={estilos.botao} onClick={voltar} disabled={enviando}>
          Voltar às colunas
        </button>
      </div>
    </section>
  );
}
