import type { Metadata } from 'next';
import { salvarConstrutora, salvarEmpreendimento } from '@/app/area-do-gestor/utm/acoes';
import Formulario from '@/components/utm/Formulario';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { carregarPainel } from '@/lib/utm/painel';
import type { Empreendimento } from '@/lib/utm/tipos';
import estilos from '@/components/utm/utm.module.css';

export const metadata: Metadata = { title: 'Empreendimentos e construtoras' };

/** Campos do formulário. Do site, só categoria, status e observações são editáveis aqui. */
function CamposDoEmpreendimento({ e, categorias }: { e?: Empreendimento; categorias: string[] }) {
  const doSite = e?.origem === 'site';
  return (
    <>
      <input type="hidden" name="id" value={e?.id ?? ''} />
      {!doSite && (
        <div className={estilos.filtros}>
          <label>
            Nome
            <input name="nome" required maxLength={120} defaultValue={e?.nome ?? ''} />
          </label>
          <label>
            Construtora
            <input name="construtora" maxLength={120} list="construtoras-cadastradas" defaultValue={e?.construtora ?? ''} />
          </label>
          <label>
            URL oficial de destino
            <input name="url" type="url" maxLength={500} placeholder="https://www.lotusbrokers.com.br/..." defaultValue={e?.url ?? ''} />
          </label>
          <label>
            Região
            <input name="regiao" maxLength={120} defaultValue={e?.regiao ?? ''} />
          </label>
        </div>
      )}
      <div className={estilos.filtros}>
        <label>
          Categoria
          <select name="categoria" defaultValue={e?.categoria ?? ''}>
            <option value="">Sem categoria</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status do cadastro
          <select name="status" defaultValue={e?.status ?? 'ativo'}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </label>
      </div>
      <label className={estilos.campo}>
        Observações
        <textarea name="observacoes" maxLength={1000} defaultValue={e?.observacoes ?? ''} />
      </label>
    </>
  );
}

export default async function Empreendimentos() {
  await exigirGestor();
  const painel = await carregarPainel();
  const { categorias } = painel.estado.configuracao;
  const usados = new Map<string, number>();
  for (const r of painel.registros) if (r.associacao) usados.set(r.associacao.empreendimentoId, (usados.get(r.associacao.empreendimentoId) ?? 0) + 1);

  return (
    <>
      <header className={estilos.cabecalhoDaPagina}>
        <h1>Empreendimentos e construtoras</h1>
        <p>
          Os lançamentos com página no site vêm do cadastro da Dashboard: nome, construtora, endereço e região não se repetem aqui.
          Para eles, a equipe define categoria, status e observações. Páginas fora do catálogo (institucionais, por exemplo) são
          cadastradas à mão.
        </p>
      </header>

      {painel.catalogoFalhou && (
        <p className={estilos.alerta} role="alert">
          O catálogo do site não respondeu agora. Os empreendimentos cadastrados aqui continuam valendo; os do site voltam quando o banco responder.
        </p>
      )}

      <section className={estilos.painel}>
        <h2>Cadastrar empreendimento</h2>
        <Formulario acao={salvarEmpreendimento} rotulo="Cadastrar" limparAoSalvar>
          <CamposDoEmpreendimento categorias={categorias} />
        </Formulario>
        {/* Uma lista só para todos os formulários: o id não pode repetir na página. */}
        <datalist id="construtoras-cadastradas">
          {painel.construtoras.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </section>

      <section className={estilos.painel}>
        <h2>Empreendimentos ({painel.empreendimentos.length})</h2>
        <div className={estilos.tabelaRolavel}>
          <table className={estilos.tabela}>
            <thead>
              <tr>
                <th>Empreendimento</th>
                <th>Construtora</th>
                <th>Categoria</th>
                <th>Região</th>
                <th>Status</th>
                <th>Registros</th>
                <th>Editar</th>
              </tr>
            </thead>
            <tbody>
              {painel.empreendimentos.map((e) => (
                <tr key={e.id}>
                  <td>
                    {e.nome}
                    <span className={estilos.secundario}>{e.url || 'Sem página no site'}</span>
                    <span className={estilos.secundario}>{e.origem === 'site' ? 'Catálogo do site' : 'Cadastrado aqui'}</span>
                  </td>
                  <td>{e.construtora || '—'}</td>
                  <td>{e.categoria || '—'}</td>
                  <td>{e.regiao || '—'}</td>
                  <td>{e.status === 'ativo' ? 'Ativo' : 'Inativo'}</td>
                  <td>{usados.get(e.id) ?? 0}</td>
                  <td>
                    <details>
                      <summary>Editar</summary>
                      <Formulario acao={salvarEmpreendimento} rotulo="Salvar">
                        <CamposDoEmpreendimento e={e} categorias={categorias} />
                      </Formulario>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={estilos.painel}>
        <h2>Construtoras ({painel.construtoras.length})</h2>
        <p>{painel.construtoras.join(' · ') || 'Nenhuma ainda.'}</p>
        <h3>Cadastrar construtora</h3>
        <Formulario acao={salvarConstrutora} rotulo="Cadastrar" limparAoSalvar>
          <div className={estilos.filtros}>
            <label>
              Nome
              <input name="nome" required maxLength={120} />
            </label>
          </div>
          <label className={estilos.campo}>
            Observações
            <textarea name="observacoes" maxLength={1000} />
          </label>
        </Formulario>
      </section>
    </>
  );
}
