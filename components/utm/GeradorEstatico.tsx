'use client';

import { useState } from 'react';
import { parametrosDoPadrao } from '@/lib/utm/configuracao';
import { gerarEstatico, valoresDoRegistro } from '@/lib/utm/gerador';
import type { Configuracao, DadosImportados } from '@/lib/utm/tipos';
import { macrosDo } from '@/lib/utm/url';
import BotaoCopiar from './BotaoCopiar';
import estilos from './utm.module.css';

/**
 * Link estático com os valores conhecidos. Parâmetro cuja macro não tem valor
 * (a origem, {{site_source_name}}, só existe no clique) pede o valor à
 * pessoa. UTM que já está na URL com outro valor só entra depois da escolha
 * entre manter e trocar.
 */
export default function GeradorEstatico({ configuracao, urlInicial, dados = {} }: { configuracao: Configuracao; urlInicial: string; dados?: DadosImportados }) {
  const [url, setUrl] = useState(urlInicial);
  const [informados, setInformados] = useState<Record<string, string>>({});
  const [substituir, setSubstituir] = useState<string[]>([]);
  const [manter, setManter] = useState<string[]>([]);
  const resultado = gerarEstatico(configuracao, url, valoresDoRegistro(dados), informados, { substituir, manter });
  const conhecidos = valoresDoRegistro(dados);

  function decidir(chave: string, escolha: 'substituir' | 'manter') {
    setSubstituir((s) => (escolha === 'substituir' ? [...new Set([...s, chave])] : s.filter((c) => c !== chave)));
    setManter((m) => (escolha === 'manter' ? [...new Set([...m, chave])] : m.filter((c) => c !== chave)));
  }

  return (
    <div className={estilos.formulario}>
      <label className={estilos.campo}>
        URL de destino
        <input type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.lotusbrokers.com.br/..." />
      </label>
      <div className={estilos.filtros}>
        {parametrosDoPadrao(configuracao).map((p) => {
          const semValor = macrosDo(p.valor).filter((m) => !conhecidos[m as keyof typeof conhecidos]);
          return (
            <label key={p.chave}>
              {p.chave}
              <input
                value={informados[p.chave] ?? ''}
                onChange={(e) => setInformados({ ...informados, [p.chave]: e.target.value })}
                placeholder={semValor.length ? `informe (${p.valor})` : `padrão: ${p.valor}`}
              />
            </label>
          );
        })}
      </div>
      {resultado.erro && url.trim() && <p className={estilos.alerta}>{resultado.erro}</p>}
      {resultado.faltando.length > 0 && (
        <p className={estilos.alerta}>
          Sem valor conhecido para {resultado.faltando.map((f) => `${f.chave} (${f.macros.map((m) => `{{${m}}}`).join(', ')})`).join(' e ')}. Informe acima: a
          ferramenta não inventa a origem do acesso.
        </p>
      )}
      {resultado.conflitos.length > 0 && (
        <div className={estilos.alerta}>
          <strong>A URL já tem estes parâmetros com outro valor</strong>
          <ul className={estilos.lista}>
            {resultado.conflitos.map((c) => (
              <li key={c.chave}>
                {c.chave}: atual "{c.atual}", padrão "{c.novo}".{' '}
                <button type="button" className={estilos.botao} onClick={() => decidir(c.chave, 'substituir')}>
                  Usar o padrão
                </button>{' '}
                <button type="button" className={estilos.botao} onClick={() => decidir(c.chave, 'manter')}>
                  Manter o atual
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {resultado.url && (
        <>
          <code className={estilos.codigo}>{resultado.url}</code>
          <BotaoCopiar texto={resultado.url} rotulo="Copiar link" />
        </>
      )}
    </div>
  );
}
