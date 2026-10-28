'use client';

import Link from 'next/link';
import { useState } from 'react';
import { exportarRegistros } from '@/app/area-do-gestor/utm/acoes';
// Só o tipo: lib/utm/painel é do servidor e não entra no pacote do navegador.
import type { LinhaDaTabela } from '@/lib/utm/painel';
import { EtiquetaDaEtapa, EtiquetaDoRastreamento } from './Etiquetas';
import estilos from './utm.module.css';

type Recorte = 'filtrados' | 'selecionados' | 'todos' | 'problemas' | 'validos';

const RECORTES: { valor: Recorte; rotulo: string }[] = [
  { valor: 'filtrados', rotulo: 'Os da lista (com os filtros)' },
  { valor: 'selecionados', rotulo: 'Só os selecionados' },
  { valor: 'todos', rotulo: 'Todos os ativos elegíveis' },
  { valor: 'problemas', rotulo: 'Só os com problema' },
  { valor: 'validos', rotulo: 'Só os com UTM válida' },
];

/** Baixa o CSV que a ação do servidor montou. */
function baixar(nome: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}

export default function TabelaDeRegistros({ linhas }: { linhas: LinhaDaTabela[] }) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [recorte, setRecorte] = useState<Recorte>('filtrados');
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  function alternar(chave: string) {
    const proximo = new Set(selecionados);
    if (proximo.has(chave)) proximo.delete(chave);
    else proximo.add(chave);
    setSelecionados(proximo);
  }

  async function exportar() {
    setMensagem(null);
    const chaves = recorte === 'selecionados' ? [...selecionados] : linhas.map((l) => l.chave);
    if (recorte === 'selecionados' && chaves.length === 0) return setMensagem('Selecione ao menos um registro.');
    setExportando(true);
    const resposta = await exportarRegistros({ recorte, chaves });
    setExportando(false);
    if (!resposta.ok) return setMensagem(resposta.erro);
    baixar(resposta.nome, resposta.conteudo);
    setMensagem(`${resposta.quantidade} registros exportados.`);
  }

  const todosMarcados = linhas.length > 0 && linhas.every((l) => selecionados.has(l.chave));

  return (
    <>
      <div className={estilos.botoes}>
        <label className={estilos.campo}>
          Exportar
          <select value={recorte} onChange={(e) => setRecorte(e.target.value as Recorte)}>
            {RECORTES.map((r) => (
              <option key={r.valor} value={r.valor}>
                {r.rotulo}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={estilos.botao} onClick={exportar} disabled={exportando} style={{ alignSelf: 'end' }}>
          {exportando ? 'Exportando…' : 'Baixar CSV'}
        </button>
        <span role="status" className={estilos.secundario}>
          {mensagem}
        </span>
      </div>

      <div className={estilos.tabelaRolavel}>
        <table className={estilos.tabela}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Selecionar todos da lista"
                  checked={todosMarcados}
                  onChange={() => setSelecionados(todosMarcados ? new Set() : new Set(linhas.map((l) => l.chave)))}
                />
              </th>
              <th>Campanha</th>
              <th>Empreendimento</th>
              <th>Conjunto / anúncio</th>
              <th>IDs</th>
              <th>Status</th>
              <th>Situação da UTM</th>
              <th>Última importação</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.chave}>
                <td>
                  <input type="checkbox" aria-label={`Selecionar ${l.anuncio || l.campanha}`} checked={selecionados.has(l.chave)} onChange={() => alternar(l.chave)} />
                </td>
                <td>
                  <Link href={l.href}>{l.campanha || '—'}</Link>
                </td>
                <td>
                  {l.empreendimento ?? <span className={`${estilos.etiqueta} ${estilos.atencao}`}>Empreendimento não identificado</span>}
                  {l.construtora && <span className={estilos.secundario}>{l.construtora}</span>}
                </td>
                <td>
                  {l.conjunto || '—'}
                  {l.anuncio && <span className={estilos.secundario}>{l.anuncio}</span>}
                </td>
                <td>
                  <span className={estilos.secundario}>Campanha {l.campanhaId}</span>
                  {l.anuncioId && <span className={estilos.secundario}>Anúncio {l.anuncioId}</span>}
                </td>
                <td>
                  {l.status}
                  {l.ausente && <span className={estilos.secundario}>Não veio na última importação</span>}
                </td>
                <td>
                  <EtiquetaDoRastreamento rastreamento={l.rastreamento} />
                  <span className={estilos.secundario}>
                    <EtiquetaDaEtapa etapa={l.etapa} />
                  </span>
                </td>
                <td>{l.ultimaImportacao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
