'use client';

import Link from 'next/link';

/**
 * Caixa de consentimento LGPD dos formulários do portal.
 *
 * Nasceu da auditoria de 24/09/2026, que achou quatro formulários coletando
 * dado pessoal sem consentimento explícito: as três newsletters (home, blog e
 * lançamentos) e o "avise-me" da busca, que pede telefone. Os formulários de
 * lead já tinham a caixa, mas cada um com a sua cópia do markup — e em todos
 * "Política de Privacidade" era texto solto, sem link para a política.
 *
 * Por isso um componente só: a regra de consentimento passa a ter um lugar, e
 * o link para a política deixa de depender de alguém lembrar de colá-lo.
 *
 * O que ele garante, e que a LGPD exige:
 *  - a caixa NUNCA vem marcada (o atributo `checked` não existe aqui);
 *  - o envio não passa sem ela — `required` é validação nativa do navegador,
 *    que já vem com mensagem, foco no campo e leitura por leitor de tela;
 *  - o rótulo inteiro é clicável e alcançável por teclado, porque o input
 *    mora dentro do <label>;
 *  - a política abre em aba nova, para não perder o que a pessoa digitou.
 *
 * `tom` acompanha o fundo do formulário: os de fundo escuro precisam de texto
 * claro, e o contraste foi conferido nos dois.
 */
export default function ConsentimentoLgpd({
  tom = 'claro',
  className,
}: {
  tom?: 'claro' | 'escuro';
  className?: string;
}) {
  const escuro = tom === 'escuro';
  const cor = escuro ? 'rgba(247,242,232,.72)' : '#3f6249';
  const corLink = escuro ? '#cdab6e' : '#1d3a2c';

  return (
    <label
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 9,
        fontSize: 12,
        lineHeight: 1.45,
        color: cor,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <input
        type="checkbox"
        required
        style={{
          marginTop: 2,
          width: 16,
          height: 16,
          flexShrink: 0,
          accentColor: escuro ? '#cdab6e' : '#1d3a2c',
          cursor: 'pointer',
        }}
      />
      <span>
        Li e concordo com a{' '}
        <Link
          href="/lotus-privacidade"
          target="_blank"
          rel="noopener"
          style={{ color: corLink, textDecoration: 'underline' }}
        >
          Política de Privacidade
        </Link>{' '}
        e autorizo o tratamento dos meus dados para os fins informados.
      </span>
    </label>
  );
}
