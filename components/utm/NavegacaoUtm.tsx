'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import estilos from './utm.module.css';

const SECOES = [
  { caminho: '', titulo: 'Visão geral' },
  { caminho: '/campanhas', titulo: 'Campanhas ativas' },
  { caminho: '/importar', titulo: 'Importar CSV' },
  { caminho: '/gerador', titulo: 'Gerador de UTMs' },
  { caminho: '/auditoria', titulo: 'Auditoria de links' },
  { caminho: '/empreendimentos', titulo: 'Empreendimentos e construtoras' },
  { caminho: '/historico', titulo: 'Histórico' },
  { caminho: '/configuracoes', titulo: 'Configurações' },
];

/**
 * Menu do UTM Manager. Linha que rola de lado no celular, em vez de menu
 * lateral: a área inteira é pensada primeiro para o celular.
 */
export default function NavegacaoUtm({ base }: { base: string }) {
  const atual = usePathname();
  return (
    <nav aria-label="UTM Manager">
      <ul className={estilos.navegacao}>
        {SECOES.map((s) => {
          const href = `${base}${s.caminho}`;
          const ativa = s.caminho === '' ? atual === base : atual === href || atual.startsWith(`${href}/`);
          return (
            <li key={s.caminho}>
              {/* Com classe: a área sublinha de dourado todo link sem classe (texto corrido). */}
              <Link href={href} className={estilos.itemDaNavegacao} aria-current={ativa ? 'page' : undefined}>
                {s.titulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
