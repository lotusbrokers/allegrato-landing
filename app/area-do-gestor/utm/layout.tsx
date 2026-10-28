import type { Metadata } from 'next';
import NavegacaoUtm from '@/components/utm/NavegacaoUtm';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { diretorioDosDados } from '@/lib/utm/armazem';
import { ROTA_UTM } from '@/lib/utm/painel';
import estilos from '@/components/utm/utm.module.css';

/**
 * UTM Manager (briefing de 28/10/2026): as UTMs das campanhas ativas do Meta
 * Ads, importadas por CSV. Mora na Área do Gestor e herda dela a proteção: o
 * middleware exige sessão, cada página e cada ação conferem o papel no
 * servidor (exigirGestor), e nada aqui é indexado.
 */
export const metadata: Metadata = { title: { default: 'UTM Manager', template: '%s | UTM Manager' } };

export default async function LayoutDoUtm({ children }: { children: React.ReactNode }) {
  await exigirGestor();
  const { persistente } = diretorioDosDados();
  return (
    <div className={estilos.ferramenta}>
      <NavegacaoUtm base={ROTA_UTM} />
      {!persistente && process.env.NODE_ENV === 'production' && (
        <p className={estilos.alerta} role="alert">
          <strong>Os dados desta ferramenta ainda não sobrevivem a um deploy.</strong>
          Falta configurar UTM_DATA_DIR no servidor, apontando para um volume (ver docs/utm-manager.md). Até lá, cada
          publicação do site apaga as importações.
        </p>
      )}
      {children}
    </div>
  );
}
