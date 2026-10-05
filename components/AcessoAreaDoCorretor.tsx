import Link from 'next/link';
import { ROTA_BASE } from '@/lib/area-do-corretor/acesso';

/**
 * Acesso dos corretores à Área do Corretor, a partir do site público.
 *
 * - FaixaAreaDoCorretor: faixa fina acima do cabeçalho, com o botão à direita.
 *   Fica fora da linha principal do topo porque ela já leva 7 links e 2 botões,
 *   e um botão de texto a mais a faz quebrar em 1280px (ver styles/base.css).
 * - BotaoAreaDoCorretor: o botão em si; `grande` é a versão do rodapé da home.
 *
 * O menu lateral leva o mesmo destino (NAV_ITENS_LATERAIS em LotusHeader.tsx).
 */

function IconePessoa() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function BotaoAreaDoCorretor({ grande = false }: { grande?: boolean }) {
  return (
    // Sem prefetch: com target="_top" o clique já é navegação completa, e a rota
    // é protegida (middleware + sessão) — pré-carregar a cada página vista seria
    // trabalho do servidor jogado fora.
    <Link
      href={ROTA_BASE}
      target="_top"
      prefetch={false}
      className={grande ? 'lt-botao-corretor lt-botao-corretor-grande' : 'lt-botao-corretor'}
    >
      <IconePessoa />
      Área do Corretor
    </Link>
  );
}

/**
 * `maxWidth` e `lado` repetem a largura e o recuo lateral do cabeçalho de baixo,
 * para o botão alinhar com o último botão dele. Sem `lado`, vale o recuo da home
 * (40px; 20px no celular), definido em styles/base.css.
 */
export function FaixaAreaDoCorretor({ maxWidth = 1280, lado }: { maxWidth?: number; lado?: number }) {
  return (
    <div className="lt-faixa-corretor">
      <div className="lt-faixa-corretor-interno" style={{ maxWidth, paddingLeft: lado, paddingRight: lado }}>
        <BotaoAreaDoCorretor />
      </div>
    </div>
  );
}
