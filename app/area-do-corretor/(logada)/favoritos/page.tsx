import type { Metadata } from 'next';
import { ListaSalva } from '@/components/area-do-corretor/Memoria';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import estilos from '@/components/area-do-corretor/area.module.css';

export const metadata: Metadata = { title: 'Meus favoritos' };

export default async function FavoritosDaArea() {
  const corretor = await exigirCorretor();
  return (
    <>
      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>Meus favoritos</h1>
        <p className={estilos.subtitulo}>
          O que você salvou para achar rápido. Os favoritos ficam guardados neste aparelho.
        </p>
      </div>
      <div style={{ marginTop: 18 }}>
        <ListaSalva
          usuario={corretor.id}
          lista="favoritos"
          removivel
          vazio="Nenhum favorito ainda. Toque em “Favoritar” num lançamento, imóvel ou construtora."
        />
      </div>
    </>
  );
}
