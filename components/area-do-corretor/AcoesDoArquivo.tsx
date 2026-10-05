'use client';

import { useState } from 'react';
import type { ItemSalvo } from '@/lib/area-do-corretor/memoria-local';
import { BotaoFavoritar } from './Memoria';
import Icone from './Icone';
import estilos from './area.module.css';

/**
 * Ações de um arquivo do Drive: abrir, baixar, copiar o link e favoritar. O
 * link é o do próprio Drive, e quem consegue abri-lo é decidido pelo
 * compartilhamento lá ("qualquer pessoa com o link").
 *
 * Sem botão de WhatsApp: ele mandava o link do Drive ao cliente, e a Lotus
 * pediu para tirá-lo em 05/10/2026. Para o cliente, as fichas têm "Compartilhar
 * no WhatsApp" com a página pública (Compartilhar.tsx).
 */
export default function AcoesDoArquivo({
  usuario,
  item,
  link,
  download,
}: {
  usuario: string;
  item: ItemSalvo;
  link: string;
  download: string | null;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt('Copie o link:', link);
    }
  }

  return (
    <div className={estilos.acoesCompactas}>
      <a href={link} target="_blank" rel="noopener" className={estilos.botaoIcone} title="Abrir no Drive">
        <Icone nome="externo" tamanho={18} />
        <span className={estilos.rotuloAcao}>Abrir</span>
      </a>
      {download && (
        <a href={download} className={estilos.botaoIcone} title="Baixar">
          <Icone nome="baixar" tamanho={18} />
          <span className={estilos.rotuloAcao}>Baixar</span>
        </a>
      )}
      <button type="button" className={estilos.botaoIcone} onClick={copiar} title="Copiar link">
        <Icone nome="copiar" tamanho={18} />
        <span className={estilos.rotuloAcao}>{copiado ? 'Copiado' : 'Copiar link'}</span>
      </button>
      <BotaoFavoritar usuario={usuario} item={item} compacto />
    </div>
  );
}
