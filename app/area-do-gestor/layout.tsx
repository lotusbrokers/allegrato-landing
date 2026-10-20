import type { Metadata } from 'next';
import Cabecalho from '@/components/area-do-corretor/Cabecalho';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { SITE } from '@/lib/site';
import estilos from '@/components/area-do-corretor/area.module.css';

/**
 * Área do Gestor (pedido da Lotus em 19/10/2026): o hub de quem gerencia, com as
 * pastas da Diretoria e do Marketing no Drive e os atalhos para os módulos da
 * Dashboard. Entra quem é owner ou admin na Dashboard, com a mesma conta e a
 * mesma tela de entrada da Área do Corretor; o middleware guarda as duas.
 *
 * Fora do Google como a Área do Corretor: este noindex, o X-Robots-Tag do
 * middleware, o Disallow do robots.txt e fora do sitemap (lib/landings.ts).
 * Tudo depende de quem está logado: nada é gerado no build.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Área do Gestor | Lotus Brokers', template: '%s | Área do Gestor Lotus' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

/** Cada página também chama exigirGestor (ver sessao.ts). */
export default async function LayoutDoGestor({ children }: { children: React.ReactNode }) {
  const gestor = await exigirGestor();
  return (
    <div className={estilos.raiz}>
      <Cabecalho corretor={gestor} area="gestor" />
      <main className={estilos.conteudo}>{children}</main>
      <footer className={estilos.rodape}>
        Área do Gestor · uso interno da {SITE.nome}, {SITE.creciPj}. As pastas vêm do Google Drive da Lotus; os atalhos
        abrem a Dashboard, que decide o que cada um vê.
      </footer>
    </div>
  );
}
