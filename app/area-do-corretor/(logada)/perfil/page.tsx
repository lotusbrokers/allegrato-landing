import type { Metadata } from 'next';
import Icone from '@/components/area-do-corretor/Icone';
import { sair } from '../../acoes';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { rotuloDoPapel } from '@/lib/area-do-corretor/acesso';
import { URL_DASHBOARD } from '@/lib/area-do-corretor/secoes';
import estilos from '@/components/area-do-corretor/area.module.css';

export const metadata: Metadata = { title: 'Meu perfil' };

/** Só leitura: nome, foto e papel são da Dashboard, e é lá que se alteram. */
export default async function PerfilDaArea() {
  const corretor = await exigirCorretor();
  return (
    <>
      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>Meu perfil</h1>
      </div>
      <div className={estilos.aviso} style={{ marginTop: 18, maxWidth: 560 }}>
        <dl className={estilos.ficha} style={{ marginTop: 0 }}>
          <dt>Nome</dt>
          <dd>{corretor.nome}</dd>
          <dt>E-mail</dt>
          <dd>{corretor.email}</dd>
          <dt>Acesso</dt>
          <dd>{rotuloDoPapel(corretor.papel)}</dd>
        </dl>
        <p style={{ marginTop: 16 }}>Seus dados, sua foto e sua senha são os da Dashboard. Para alterar, use a Dashboard.</p>
        <div className={estilos.acoes}>
          <a href={URL_DASHBOARD} target="_blank" rel="noopener" className={`${estilos.botao} ${estilos.botaoPrimario}`}>
            <Icone nome="painel" /> Abrir a Dashboard
          </a>
          <form action={sair}>
            <button type="submit" className={estilos.botao}>
              <Icone nome="sair" /> Sair da Área do Corretor
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
