import Link from 'next/link';
import { sair } from '@/app/area-do-corretor/acoes';
import { ROTA_BASE } from '@/lib/area-do-corretor/acesso';
import { URL_DASHBOARD, URL_EMAIL_LOTUS } from '@/lib/area-do-corretor/secoes';
import type { Corretor } from '@/lib/area-do-corretor/sessao';
import { logoLotus } from '@/lib/imagem-otimizada';
import Icone from './Icone';
import estilos from './area.module.css';

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

/** No celular os botões viram só ícone; o texto aparece a partir de 768px. */
export default function Cabecalho({ corretor }: { corretor: Corretor }) {
  const logo = logoLotus();
  return (
    <header className={estilos.cabecalho}>
      <div className={estilos.cabecalhoInterno}>
        <Link href={ROTA_BASE} className={estilos.marca} aria-label="Área do Corretor, início">
          <img src={logo.src} srcSet={logo.srcSet} sizes={logo.sizes} alt="Lotus Brokers" width={80} height={30} />
          <span className={estilos.rotuloArea}>Área do Corretor</span>
        </Link>

        {/* lt-mobile-nav: styles/base.css esconde todo `header nav` abaixo de 760px
            (é o menu de desktop das páginas portadas); aqui a nav é a do celular também. */}
        <nav className={`${estilos.navCabecalho} lt-mobile-nav`} aria-label="Conta e atalhos">
          <a href={URL_DASHBOARD} target="_blank" rel="noopener" className={estilos.botaoCabecalho} title="Dashboard">
            <Icone nome="painel" />
            <span className={estilos.textoBotao}>Dashboard</span>
          </a>
          <a href={URL_EMAIL_LOTUS} target="_blank" rel="noopener" className={estilos.botaoCabecalho} title="E-mail Lotus">
            <Icone nome="email" />
            <span className={estilos.textoBotao}>E-mail</span>
          </a>
          <a href="/" className={estilos.botaoCabecalho} title="Site Lotus Brokers">
            <Icone nome="globo" />
            <span className={estilos.textoBotao}>Site</span>
          </a>
          <Link href={`${ROTA_BASE}/perfil`} className={estilos.botaoCabecalho} title="Meu perfil">
            {corretor.foto ? (
              <img src={corretor.foto} alt="" className={estilos.avatar} width={30} height={30} />
            ) : (
              <span className={estilos.avatar} aria-hidden="true">
                {iniciais(corretor.nome)}
              </span>
            )}
            <span className={estilos.textoBotao}>{corretor.primeiroNome}</span>
          </Link>
          <form action={sair}>
            <button type="submit" className={estilos.botaoCabecalho} title="Sair">
              <Icone nome="sair" />
              <span className={estilos.textoBotao}>Sair</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
