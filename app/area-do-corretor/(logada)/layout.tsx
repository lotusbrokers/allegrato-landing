import Cabecalho from '@/components/area-do-corretor/Cabecalho';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { SITE } from '@/lib/site';
import estilos from '@/components/area-do-corretor/area.module.css';

/** Moldura das páginas logadas. Cada página também chama exigirCorretor (ver sessao.ts). */
export default async function LayoutLogado({ children }: { children: React.ReactNode }) {
  const corretor = await exigirCorretor();
  return (
    <>
      <Cabecalho corretor={corretor} />
      <main className={estilos.conteudo}>{children}</main>
      <footer className={estilos.rodape}>
        Área do Corretor · uso interno da {SITE.nome}, {SITE.creciPj}. Os dados dos imóveis e lançamentos vêm da
        Dashboard; o que estiver errado se corrige lá.
      </footer>
    </>
  );
}
