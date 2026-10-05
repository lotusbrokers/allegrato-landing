'use client';

import { useState } from 'react';
import { linkWhatsApp } from '@/lib/area-do-corretor/compartilhar';
import Icone from './Icone';
import estilos from './area.module.css';

/**
 * Ações de envio para o cliente: WhatsApp (o principal, no celular), copiar o
 * link e abrir a página pública. `url` é sempre a página pública do site.
 */
export default function Compartilhar({ texto, url }: { texto: string; url: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sem permissão de área de transferência (http, navegador antigo): mostra o link para copiar à mão.
      window.prompt('Copie o link:', url);
    }
  }

  return (
    <>
      <a
        href={linkWhatsApp(texto, url)}
        target="_blank"
        rel="noopener"
        className={`${estilos.botao} ${estilos.botaoWhatsApp}`}
      >
        <Icone nome="whatsapp" />
        Compartilhar no WhatsApp
      </a>
      <button type="button" className={estilos.botao} onClick={copiar}>
        <Icone nome="copiar" />
        {copiado ? 'Link copiado' : 'Copiar link'}
      </button>
      <a href={url} target="_blank" rel="noopener" className={estilos.botao}>
        <Icone nome="externo" />
        Página pública
      </a>
    </>
  );
}
