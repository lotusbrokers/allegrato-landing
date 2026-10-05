import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import FormularioEntrada from './FormularioEntrada';
import { sair } from '../acoes';
import { situacaoAtual, type Situacao } from '@/lib/area-do-corretor/sessao';
import { destinoSeguro } from '@/lib/area-do-corretor/acesso';
import { URL_DASHBOARD } from '@/lib/area-do-corretor/secoes';
import { logoLotus } from '@/lib/imagem-otimizada';
import estilos from '@/components/area-do-corretor/area.module.css';

export const metadata: Metadata = { title: 'Entrar' };

/**
 * Entrada da Área do Corretor, com o e-mail e a senha da Dashboard.
 *
 * Por que uma tela no site e não a da Dashboard: a Dashboard guarda a sessão no
 * navegador, no domínio dela, e não sabe devolver o usuário a outro site depois
 * do login. Entrar direto vindo da Dashboard depende de um link de uso único
 * emitido por ela (fase 3 do plano de 05/10/2026).
 */
export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ volta?: string }> }) {
  const { volta } = await searchParams;
  const destino = destinoSeguro(volta);
  let situacao: Situacao = { tipo: 'anonimo' };
  try {
    situacao = await situacaoAtual();
  } catch {
    // Banco sem responder: a entrada é o último lugar que pode quebrar. Mostra o formulário.
  }
  if (situacao.tipo === 'corretor') redirect(destino);

  const logo = logoLotus();
  return (
    <main className={estilos.entrada}>
      <div className={estilos.cartaoEntrada}>
        <img src={logo.src} srcSet={logo.srcSet} sizes={logo.sizes} alt="Lotus Brokers" width={91} height={34} />
        <h1 className={estilos.titulo} style={{ fontSize: 30, textAlign: 'center' }}>
          Área do Corretor
        </h1>

        {situacao.tipo === 'sem-acesso' ? (
          <>
            <p className={estilos.subtitulo} style={{ textAlign: 'center' }}>
              Você entrou como <strong>{situacao.email}</strong>, mas esta conta não tem acesso à Área do Corretor
              da Lotus. Se deveria ter, fale com a administração.
            </p>
            <form action={sair} className={estilos.formulario}>
              <button type="submit" className={`${estilos.botao} ${estilos.botaoPrimario}`}>
                Sair e entrar com outra conta
              </button>
            </form>
          </>
        ) : (
          <>
            <p className={estilos.subtitulo} style={{ textAlign: 'center' }}>
              Use o mesmo e-mail e a mesma senha da Dashboard.
            </p>
            <FormularioEntrada volta={destino} />
          </>
        )}

        <div className={estilos.linksEntrada}>
          <a href={URL_DASHBOARD} target="_blank" rel="noopener">
            Esqueci minha senha
          </a>
          <a href="/">Voltar ao site</a>
        </div>
      </div>
    </main>
  );
}
