import type { Metadata } from 'next';

/**
 * Metadata de /meus-dados.
 *
 * A página é Client Component (o formulário tem estado) e não pode exportar
 * metadata; o layout da rota faz isso por ela. Sem ele, /meus-dados herdava
 * título, descrição, imagem e canonical da home, e aparecia ao Google como uma
 * segunda home.
 *
 * noindex: é a área do titular dos dados (LGPD), não conteúdo para a busca. O
 * robots.txt deixou de bloquear a rota em 16/10/2026: com o bloqueio, o Google
 * não lia a página e não chegava a ver o noindex.
 */
export const metadata: Metadata = {
  title: 'Seus dados pessoais (LGPD) | Lotus Brokers',
  description:
    'Exerça seus direitos sobre os dados pessoais tratados pela Lotus Brokers: acesso, correção, exclusão e os demais previstos na LGPD.',
  alternates: { canonical: 'https://www.lotusbrokers.com.br/meus-dados' },
  robots: { index: false, follow: true },
};

export default function MeusDadosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
