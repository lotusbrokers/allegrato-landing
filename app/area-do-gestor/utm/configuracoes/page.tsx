import type { Metadata } from 'next';
import { salvarConfiguracao } from '@/app/area-do-gestor/utm/acoes';
import Formulario from '@/components/utm/Formulario';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { armazem, diretorioDosDados } from '@/lib/utm/armazem';
import { ORDEM_DAS_SEVERIDADES, ROTULO_DA_SEVERIDADE, VERIFICACOES, type CodigoDaVerificacao } from '@/lib/utm/auditoria';
import { EXTRAS_DISPONIVEIS, PARAMETROS_PADRAO } from '@/lib/utm/configuracao';
import { gerarDinamico } from '@/lib/utm/gerador';
import { META_API } from '@/lib/utm/meta-api';
import { MACROS_DA_META } from '@/lib/utm/url';
import estilos from '@/components/utm/utm.module.css';

export const metadata: Metadata = { title: 'Configurações' };

const SEMPRE_OBRIGATORIOS = ['utm_source', 'utm_medium', 'utm_campaign'];

export default async function Configuracoes() {
  await exigirGestor();
  const { configuracao } = await armazem().ler();
  const { persistente } = diretorioDosDados();
  const valorDe = (chave: string) => configuracao.parametros.find((p) => p.chave === chave);

  return (
    <>
      <header className={estilos.cabecalhoDaPagina}>
        <h1>Configurações</h1>
        <p>
          O padrão de UTM da Lotus, as categorias de empreendimento e a severidade de cada verificação da auditoria. Mudar o padrão
          não muda nenhum anúncio: os registros passam a mostrar o texto novo para gerar e aplicar de novo.
        </p>
      </header>

      <section className={estilos.painel}>
        <h2>Padrão atual</h2>
        <code className={estilos.codigo}>{gerarDinamico(configuracao, undefined).parametros}</code>
      </section>

      <Formulario acao={salvarConfiguracao} rotulo="Salvar configuração">
        <section className={estilos.painel}>
          <h2>Parâmetros principais</h2>
          <p>Macros aceitas pela Meta: {MACROS_DA_META.map((m) => `{{${m}}}`).join(', ')}. Texto fixo também vale, como paid_social.</p>
          <div className={estilos.filtros}>
            {PARAMETROS_PADRAO.map((p) => {
              const atual = valorDe(p.chave);
              const sempre = SEMPRE_OBRIGATORIOS.includes(p.chave);
              return (
                <div key={p.chave} className={estilos.formulario}>
                  <label className={estilos.campo}>
                    {p.chave}
                    <input name={`valor:${p.chave}`} required maxLength={200} defaultValue={atual?.valor ?? p.valor} />
                  </label>
                  <label className={estilos.campoMarcado}>
                    <input type="checkbox" name={`obrigatorio:${p.chave}`} defaultChecked={sempre || (atual?.obrigatorio ?? true)} disabled={sempre} />
                    {sempre ? 'Sempre obrigatório' : 'Obrigatório na auditoria'}
                  </label>
                </div>
              );
            })}
          </div>
          <h3>IDs da Meta como parâmetros extras</h3>
          <p>O nome de um anúncio pode repetir; o ID não. Ligue para ter o ID no relatório.</p>
          {EXTRAS_DISPONIVEIS.map((e) => (
            <label key={e.chave} className={estilos.campoMarcado}>
              <input type="checkbox" name={`extra:${e.chave}`} defaultChecked={configuracao.extras.some((x) => x.chave === e.chave)} />
              {e.chave}={e.valor}
            </label>
          ))}
        </section>

        <section className={estilos.painel}>
          <h2>Categorias de empreendimento</h2>
          <label className={estilos.campo}>
            Uma por linha
            <textarea name="categorias" rows={8} defaultValue={configuracao.categorias.join('\n')} />
          </label>
        </section>

        <section className={estilos.painel}>
          <h2>Severidade da auditoria</h2>
          <div className={estilos.filtros}>
            {(Object.keys(VERIFICACOES) as CodigoDaVerificacao[]).map((codigo) => (
              <label key={codigo}>
                {VERIFICACOES[codigo].descricao}
                <select name={`severidade:${codigo}`} defaultValue={configuracao.severidades[codigo] ?? VERIFICACOES[codigo].severidade}>
                  {ORDEM_DAS_SEVERIDADES.map((s) => (
                    <option key={s} value={s}>
                      {ROTULO_DA_SEVERIDADE[s]}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>
      </Formulario>

      <section className={estilos.painel}>
        <h2>Ambiente</h2>
        <ul className={estilos.lista}>
          <li>
            Armazenamento:{' '}
            {persistente
              ? 'pasta definida em UTM_DATA_DIR.'
              : 'pasta .dados/utm do projeto (UTM_DATA_DIR não definida). Em produção, os dados somem a cada deploy até a variável apontar para um volume.'}
          </li>
          <li>
            Meta Marketing API: {META_API.situacao.toLowerCase()}. {META_API.explicacao}
          </li>
        </ul>
      </section>
    </>
  );
}
