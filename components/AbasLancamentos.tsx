import Link from 'next/link';

/**
 * As duas abas da seção de lançamentos: por empreendimento e por construtora.
 *
 * /lotus-lancamentos e /construtoras são a mesma seção vista de dois ângulos —
 * a lista de empreendimentos e a lista de quem os constrói. Sem a aba,
 * /construtoras só era alcançável pelo card de um empreendimento ou pela URL
 * direta, e quem chegava na listagem não sabia que ela existia.
 *
 * Sem hooks e sem handler de propósito: assim o mesmo componente serve à
 * listagem, que é Client Component, e à página de construtoras, que é Server
 * Component. O estado de "aba ativa" vem por prop porque cada página sabe qual
 * é a sua — não há navegação em JavaScript aqui, são dois links de verdade,
 * que o buscador segue e o visitante pode abrir em outra guia.
 */

const ABAS = [
  { chave: 'empreendimentos', rotulo: 'Empreendimentos', href: '/lotus-lancamentos' },
  { chave: 'construtoras', rotulo: 'Construtoras', href: '/construtoras' },
] as const;

export type AbaAtiva = (typeof ABAS)[number]['chave'];

const base = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 14.5,
  fontWeight: 600,
  lineHeight: 1,
  padding: '11px 22px',
  borderRadius: 40,
  whiteSpace: 'nowrap' as const,
  transition: 'background .2s, color .2s, border-color .2s',
};

export default function AbasLancamentos({ ativa }: { ativa: AbaAtiva }) {
  return (
    <div
      role="navigation"
      aria-label="Ver lançamentos por empreendimento ou por construtora"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 30 }}
    >
      {ABAS.map((aba) =>
        aba.chave === ativa ? (
          // A aba ativa não é link: já estamos nela, e um link para a própria
          // página confunde leitor de tela e teclado.
          <span
            key={aba.chave}
            aria-current="page"
            style={{ ...base, background: '#15241c', color: '#f7f2e8', border: '1px solid #15241c' }}
          >
            {aba.rotulo}
          </span>
        ) : (
          <Link
            key={aba.chave}
            href={aba.href}
            target="_top"
            className="lt-aba"
            style={{ ...base, background: 'transparent', color: '#15241c', border: '1px solid rgba(21,36,28,.25)' }}
          >
            {aba.rotulo}
          </Link>
        )
      )}
    </div>
  );
}
