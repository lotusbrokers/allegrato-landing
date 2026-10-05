'use client';

import estilos from '@/components/area-do-corretor/area.module.css';

/**
 * Falha ao carregar a área: o mais comum é o Supabase demorando a responder,
 * seja nos dados, seja na conferência do acesso. Fica no nível da área, e não
 * em (logada), para pegar também o erro do layout logado. Mostra o problema em
 * vez de uma página vazia e deixa tentar de novo.
 */
export default function ErroDaArea({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className={estilos.conteudo}>
      <div className={estilos.aviso} role="alert">
        <h3>Não foi possível carregar esta página agora</h3>
        <p>Os dados vêm da Dashboard, que pode estar demorando a responder. Tente de novo em instantes.</p>
        <div className={estilos.acoes}>
          <button type="button" className={`${estilos.botao} ${estilos.botaoPrimario}`} onClick={reset}>
            Tentar de novo
          </button>
          <a href="/" className={estilos.botao}>
            Ir para o site
          </a>
        </div>
      </div>
    </main>
  );
}
