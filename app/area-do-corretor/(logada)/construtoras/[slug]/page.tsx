import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Compartilhar from '@/components/area-do-corretor/Compartilhar';
import { CartaoLancamento } from '@/components/area-do-corretor/Cartoes';
import { BotaoFavoritar, RegistraAcesso } from '@/components/area-do-corretor/Memoria';
import Icone from '@/components/area-do-corretor/Icone';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { catalogo, construtorasDoCatalogo, rotaDaConstrutora } from '@/lib/area-do-corretor/dados';
import { linkDaConstrutora } from '@/lib/area-do-corretor/compartilhar';
import { driveConfigurado, mapaDoDrive, pastaDaConstrutora } from '@/lib/area-do-corretor/drive';
import { ROTA_BASE } from '@/lib/area-do-corretor/acesso';
import { construtoraPorSlug } from '@/lib/construtoras-paginas';
import { conteudoDaConstrutora } from '@/lib/construtoras-conteudo';
import estilos from '@/components/area-do-corretor/area.module.css';

type Props = { params: Promise<{ slug: string }> };

async function buscarConstrutora(slug: string) {
  const { lancamentos } = await catalogo();
  return construtoraPorSlug(construtorasDoCatalogo(lancamentos), slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: (await buscarConstrutora(slug))?.nome ?? 'Construtora' };
}

export default async function ConstrutoraDaArea({ params }: Props) {
  const corretor = await exigirCorretor();
  const { slug } = await params;
  const c = await buscarConstrutora(slug);
  if (!c) notFound();

  // "Sobre" só existe quando a Lotus enviou o texto (lib/construtoras-conteudo.ts).
  const sobre = conteudoDaConstrutora(c.slug)?.paragrafos ?? [];
  // Pasta dela em "LANÇAMENTOS" no Drive, achada por nome parecido ("FA Oliva" × "F A Oliva").
  const mapa = driveConfigurado() ? await mapaDoDrive().catch(() => null) : null;
  const pastaNoDrive = mapa ? pastaDaConstrutora(mapa, c.nome) : null;
  const item = {
    chave: `construtora:${c.slug}`,
    tipo: 'construtora' as const,
    titulo: c.nome,
    detalhe: c.lancamentos.length === 1 ? '1 lançamento' : `${c.lancamentos.length} lançamentos`,
    href: rotaDaConstrutora(c.slug),
  };

  return (
    <>
      <RegistraAcesso usuario={corretor.id} item={item} />
      <Link href={`${ROTA_BASE}/construtoras`} className={estilos.migalha}>
        <Icone nome="voltar" tamanho={16} /> Construtoras
      </Link>

      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>{c.nome}</h1>
        <div className={estilos.acoes}>
          {pastaNoDrive && (
            <Link href={pastaNoDrive.href} className={`${estilos.botao} ${estilos.botaoPrimario}`}>
              <Icone nome="pasta" /> Materiais no Drive
            </Link>
          )}
          <Compartilhar texto={`${c.nome}: conheça os empreendimentos que a Lotus comercializa.`} url={linkDaConstrutora(c.slug)} />
          <BotaoFavoritar usuario={corretor.id} item={item} />
        </div>
      </div>

      {sobre.length > 0 && (
        <section className={estilos.secao} aria-labelledby="sobre">
          <h2 id="sobre" className={estilos.tituloSecao}>
            Sobre a {c.nome}
          </h2>
          {sobre.map((p) => (
            <p key={p} className={estilos.texto} style={{ marginTop: 10, maxWidth: 760 }}>
              {p}
            </p>
          ))}
        </section>
      )}

      <section className={estilos.secao} aria-labelledby="empreendimentos">
        <h2 id="empreendimentos" className={estilos.tituloSecao} style={{ marginBottom: 14 }}>
          Empreendimentos
        </h2>
        {c.lancamentos.length > 0 ? (
          <div className={estilos.grade}>
            {c.lancamentos.map((l) => (
              <CartaoLancamento key={l.id} l={l} />
            ))}
          </div>
        ) : (
          <p className={estilos.vazio}>Nenhum lançamento desta construtora no cadastro da Dashboard agora.</p>
        )}
      </section>
    </>
  );
}
