import type { Metadata } from 'next';
import estilos from '@/components/area-do-corretor/area.module.css';

/**
 * Área do Corretor: hub interno dos corretores da Lotus, com o login da
 * Dashboard. Fora do Google por três camadas: este noindex, o X-Robots-Tag do
 * middleware e o Disallow do robots.txt; e fora do sitemap (lib/landings.ts).
 *
 * Tudo aqui é dinâmico (depende de quem está logado): nada é gerado no build,
 * então a área não cria dependência do Supabase na hora do deploy.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Área do Corretor | Lotus Brokers', template: '%s | Área do Corretor Lotus' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function LayoutDaArea({ children }: { children: React.ReactNode }) {
  return <div className={estilos.raiz}>{children}</div>;
}
