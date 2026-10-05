import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Avatar from '@/components/area-do-corretor/Avatar';
import Compartilhar from '@/components/area-do-corretor/Compartilhar';
import { BotaoFavoritar, RegistraAcesso } from '@/components/area-do-corretor/Memoria';
import Icone from '@/components/area-do-corretor/Icone';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { captadorDoImovel } from '@/lib/area-do-corretor/captador';
import { rotaDoImovel } from '@/lib/area-do-corretor/dados';
import { linkDoImovel } from '@/lib/area-do-corretor/compartilhar';
import { ROTA_BASE } from '@/lib/area-do-corretor/acesso';
import { formatValor, getImovel } from '@/lib/imoveis';
import { imagemOtimizada } from '@/lib/imagem-otimizada';
import estilos from '@/components/area-do-corretor/area.module.css';

type Props = { params: Promise<{ codigo: string }> };

function tituloDo(imovel: { tipo: string | null; bairro: string | null }): string {
  return [imovel.tipo || 'Imóvel', imovel.bairro].filter(Boolean).join(' · ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params;
  const imovel = await getImovel(codigo);
  return { title: imovel ? tituloDo(imovel) : 'Imóvel' };
}

/** A ficha do imóvel é a mesma consulta da página pública (/lotus-imovel/[codigo]). */
export default async function ImovelDaArea({ params }: Props) {
  const corretor = await exigirCorretor();
  // Como em /lotus-imovel/[codigo]: o código vem da rota como está, sem decodificar de novo.
  const { codigo } = await params;
  const imovel = await getImovel(codigo);
  if (!imovel) notFound();
  const captador = await captadorDoImovel(imovel.id);

  const titulo = tituloDo(imovel);
  const local = [imovel.bairro, imovel.cidade].filter(Boolean).join(' · ');
  const aluguel = !imovel.valor_venda && !!imovel.valor_locacao;
  const valor = aluguel ? `${formatValor(imovel.valor_locacao)}/mês` : formatValor(imovel.valor_venda);
  const fotos = (imovel.fotos ?? []).filter((f) => f?.url).slice(0, 12);
  const item = { chave: `imovel:${codigo}`, tipo: 'imovel' as const, titulo, detalhe: [imovel.cidade, valor].filter(Boolean).join(' · '), href: rotaDoImovel(codigo) };

  const ficha: [string, string | null][] = [
    ['Código', codigo],
    ['Finalidade', aluguel ? 'Aluguel' : 'Venda'],
    ['Valor', valor],
    ['Condomínio', imovel.valor_condominio ? formatValor(imovel.valor_condominio) : null],
    ['IPTU', imovel.valor_iptu ? formatValor(imovel.valor_iptu) : null],
    ['Área útil', imovel.area_util ? `${imovel.area_util} m²` : null],
    ['Área total', imovel.area_total ? `${imovel.area_total} m²` : null],
    ['Dormitórios', imovel.quartos ? String(imovel.quartos) : null],
    ['Suítes', imovel.suites ? String(imovel.suites) : null],
    ['Banheiros', imovel.banheiros ? String(imovel.banheiros) : null],
    ['Vagas', imovel.vagas ? String(imovel.vagas) : null],
  ];

  return (
    <>
      <RegistraAcesso usuario={corretor.id} item={item} />
      <Link href={`${ROTA_BASE}/terceiros`} className={estilos.migalha}>
        <Icone nome="voltar" tamanho={16} /> Imóveis de terceiros
      </Link>

      <div className={estilos.detalhe}>
        {fotos.length > 0 ? (
          <div className={estilos.galeria} aria-label={`Fotos: ${titulo}`}>
            {fotos.map((f, n) => {
              const img = imagemOtimizada(f.url);
              return (
                <img
                  key={f.url}
                  src={img.src}
                  srcSet={img.srcSet}
                  sizes="(min-width: 900px) 620px, 100vw"
                  alt={f.legenda || `${titulo}, foto ${n + 1}`}
                  loading={n === 0 ? 'eager' : 'lazy'}
                />
              );
            })}
          </div>
        ) : (
          <div className={estilos.cartaoImagem} style={{ borderRadius: 14 }} aria-hidden="true" />
        )}

        <div>
          <span className={estilos.selo}>{aluguel ? 'Aluguel' : 'Venda'}</span>
          <h1 className={estilos.titulo} style={{ marginTop: 8 }}>
            {titulo}
          </h1>
          {local && <p className={estilos.subtitulo}>{local}</p>}

          <dl className={estilos.ficha}>
            {ficha
              .filter(([, v]) => v)
              .map(([rotulo, v]) => (
                <div key={rotulo} style={{ display: 'contents' }}>
                  <dt>{rotulo}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
          </dl>

          {/* Quem captou o imóvel (pedido da Lotus em 05/10/2026). Sem o dado, o bloco não aparece. */}
          {captador && (
            <div className={estilos.captador}>
              <Avatar nome={captador.nome} foto={captador.foto} tamanho={56} />
              <div>
                <span className={estilos.captadorRotulo}>Corretor captador</span>
                <span className={estilos.captadorNome}>{captador.nome}</span>
              </div>
            </div>
          )}

          <div className={estilos.acoes}>
            <Compartilhar texto={`${titulo}${imovel.cidade ? `, ${imovel.cidade}` : ''}. ${valor}. Veja o anúncio:`} url={linkDoImovel(codigo)} />
            <BotaoFavoritar usuario={corretor.id} item={item} />
          </div>

          {(imovel.link_video || imovel.tour_virtual) && (
            <div className={estilos.acoes}>
              {imovel.link_video && (
                <a href={imovel.link_video} target="_blank" rel="noopener" className={estilos.botao}>
                  <Icone nome="externo" /> Vídeo
                </a>
              )}
              {imovel.tour_virtual && (
                <a href={imovel.tour_virtual} target="_blank" rel="noopener" className={estilos.botao}>
                  <Icone nome="externo" /> Tour virtual
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {imovel.descricao && (
        <section className={estilos.secao} aria-labelledby="descricao">
          <h2 id="descricao" className={estilos.tituloSecao}>
            Descrição
          </h2>
          <p className={estilos.texto} style={{ marginTop: 10 }}>
            {imovel.descricao}
          </p>
        </section>
      )}
    </>
  );
}
