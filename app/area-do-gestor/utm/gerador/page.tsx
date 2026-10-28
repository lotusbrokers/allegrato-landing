import type { Metadata } from 'next';
import BotaoCopiar from '@/components/utm/BotaoCopiar';
import GeradorEstatico from '@/components/utm/GeradorEstatico';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { gerarDinamico } from '@/lib/utm/gerador';
import { carregarPainel } from '@/lib/utm/painel';
import estilos from '@/components/utm/utm.module.css';

export const metadata: Metadata = { title: 'Gerador de UTMs' };

export default async function Gerador({ searchParams }: { searchParams: Promise<{ empreendimento?: string }> }) {
  await exigirGestor();
  const { empreendimento: escolhido } = await searchParams;
  const painel = await carregarPainel();
  const configuracao = painel.estado.configuracao;
  const comPagina = painel.empreendimentos.filter((e) => e.url && e.status === 'ativo');
  const empreendimento = comPagina.find((e) => e.id === escolhido);
  const modelo = gerarDinamico(configuracao, empreendimento?.url);

  return (
    <>
      <header className={estilos.cabecalhoDaPagina}>
        <h1>Gerador de UTMs</h1>
        <p>O padrão da Lotus pronto para colar no Meta Ads, e links estáticos para usar fora dele.</p>
      </header>

      <section className={estilos.painel}>
        <h2>Modo dinâmico: modelo para o Meta Ads</h2>
        <p>
          Vale para qualquer anúncio: a Meta troca cada macro pelo valor real no clique. Cole em "Parâmetros de URL", na parte de
          destino do anúncio. Este texto é o modelo, não um link de anúncio já aplicado.
        </p>
        <code className={estilos.codigo}>{modelo.parametros}</code>
        <BotaoCopiar texto={modelo.parametros} rotulo="Copiar modelo" />
      </section>

      <section className={estilos.painel}>
        <h2>Modo estático: link pronto</h2>
        <form className={estilos.filtros} action="">
          <label>
            Página de um empreendimento
            <select name="empreendimento" defaultValue={empreendimento?.id ?? ''}>
              <option value="">Outra URL (digitar abaixo)</option>
              {comPagina.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </label>
          <div className={estilos.botoes}>
            <button type="submit" className={estilos.botao}>
              Usar esta página
            </button>
          </div>
        </form>
        <GeradorEstatico key={empreendimento?.id ?? 'livre'} configuracao={configuracao} urlInicial={empreendimento?.url ?? ''} />
      </section>
    </>
  );
}
