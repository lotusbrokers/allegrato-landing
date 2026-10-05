'use client';

import { useState } from 'react';
import { linkWhatsApp } from '@/lib/area-do-corretor/compartilhar';
import type { ItemSalvo } from '@/lib/area-do-corretor/memoria-local';
import { BotaoFavoritar } from './Memoria';
import Icone from './Icone';
import estilos from './area.module.css';

/**
 * Ações de um arquivo do Drive: abrir, baixar, mandar no WhatsApp, copiar o
 * link e favoritar. O link é o do próprio Drive, e quem consegue abri-lo é
 * decidido pelo compartilhamento lá ("qualquer pessoa com o link").
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
      <a
        href={linkWhatsApp(item.titulo, link)}
        target="_blank"
        rel="noopener"
        className={estilos.botaoIcone}
        title="Enviar pelo WhatsApp"
      >
        <Icone nome="whatsapp" tamanho={18} />
        <span className={estilos.rotuloAcao}>WhatsApp</span>
      </a>
      <button type="button" className={estilos.botaoIcone} onClick={copiar} title="Copiar link">
        <Icone nome="copiar" tamanho={18} />
        <span className={estilos.rotuloAcao}>{copiado ? 'Copiado' : 'Copiar link'}</span>
      </button>
      <BotaoFavoritar usuario={usuario} item={item} compacto />
    </div>
  );
}
