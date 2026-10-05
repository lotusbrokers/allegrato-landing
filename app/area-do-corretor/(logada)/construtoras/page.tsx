import type { Metadata } from 'next';
import Link from 'next/link';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { catalogo, construtorasDoCatalogo, rotaDaConstrutora } from '@/lib/area-do-corretor/dados';
import { imagemOtimizada } from '@/lib/imagem-otimizada';
import estilos from '@/components/area-do-corretor/area.module.css';

export const metadata: Metadata = { title: 'Construtoras' };

export default async function ConstrutorasDaArea() {
  await exigirCorretor();
  const { lancamentos } = await catalogo();
  const construtoras = construtorasDoCatalogo(lancamentos);

  return (
    <>
      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>Construtoras</h1>
        <p className={estilos.subtitulo}>As parceiras da Lotus e os empreendimentos de cada uma.</p>
      </div>

      <div className={estilos.grade} style={{ marginTop: 18 }}>
        {construtoras.map((c) => {
          const capa = c.capa ? imagemOtimizada(c.capa.img, [640, 1080]) : null;
          return (
            <Link key={c.slug} href={rotaDaConstrutora(c.slug)} className={estilos.cartao}>
              {capa ? (
                <img
                  src={capa.src}
                  srcSet={capa.srcSet}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 90vw"
                  alt={c.capa!.empreendimento}
                  loading="lazy"
                  fetchPriority="low"
                  className={estilos.cartaoImagem}
                />
              ) : (
                <div className={estilos.cartaoImagem} aria-hidden="true" />
              )}
              <div className={estilos.cartaoCorpo}>
                <h3 className={estilos.cartaoTitulo}>{c.nome}</h3>
                <span className={estilos.cartaoDetalhe}>
                  {c.lancamentos.length === 0
                    ? 'Sem lançamento no cadastro'
                    : c.lancamentos.length === 1
                      ? '1 lançamento'
                      : `${c.lancamentos.length} lançamentos`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
