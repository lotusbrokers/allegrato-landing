'use client';

import { useState } from 'react';
import estilos from './utm.module.css';

/**
 * Copia o texto para a área de transferência. `aoCopiar` registra a cópia no
 * servidor quando o texto é de um registro; copiar não quer dizer aplicar no
 * Meta Ads, e a tela diz isso.
 */
export default function BotaoCopiar({ texto, rotulo = 'Copiar', aoCopiar }: { texto: string; rotulo?: string; aoCopiar?: () => Promise<void> }) {
  const [situacao, setSituacao] = useState<'pronto' | 'copiado' | 'falhou'>('pronto');

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setSituacao('copiado');
      await aoCopiar?.();
    } catch {
      setSituacao('falhou');
    }
  }

  return (
    <span className={estilos.botoes}>
      <button type="button" className={estilos.botao} onClick={copiar} disabled={!texto}>
        {rotulo}
      </button>
      <span role="status" aria-live="polite" className={estilos.secundario}>
        {situacao === 'copiado' && (aoCopiar ? 'Copiado. Depois de colar no Meta Ads, confirme a aplicação aqui.' : 'Copiado.')}
        {situacao === 'falhou' && 'O navegador não deixou copiar. Selecione o texto e copie à mão.'}
      </span>
    </span>
  );
}
