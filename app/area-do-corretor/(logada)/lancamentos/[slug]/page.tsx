import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Compartilhar from '@/components/area-do-corretor/Compartilhar';
import ConteudoDoDrive from '@/components/area-do-corretor/ConteudoDoDrive';
import { conteudoDaPasta, driveConfigurado, mapaDoDrive, pastaDoLancamento } from '@/lib/area-do-corretor/drive';
import { BotaoFavoritar, RegistraAcesso } from '@/components/area-do-corretor/Memoria';
import Icone from '@/components/area-do-corretor/Icone';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { catalogo, construtorasDoCatalogo, lancamentoPorSlug, rotaDaConstrutora, rotaDoLancamento } from '@/lib/area-do-corretor/dados';
import { linkDoLancamento } from '@/lib/area-do-corretor/compartilhar';
import { ROTA_BASE } from '@/lib/area-do-corretor/acesso';
import { imagemOtimizada } from '@/lib/imagem-otimizada';
import estilos from '@/components/area-do-corretor/area.module.css';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const l = lancamentoPorSlug((await catalogo()).lancamentos, slug);
  return { title: l?.name ?? 'Lançamento' };
}

export default async function LancamentoDaArea({ params }: Props) {
  const corretor = await exigirCorretor();
  const { slug } = await params;
  const { lancamentos } = await catalogo();
  const l = lancamentoPorSlug(lancamentos, slug);
  if (!l) notFound();

  const construtora = construtorasDoCatalogo(lancamentos).find((c) => c.lancamentos.some((x) => x.id === l.id));
  const local = [l.neighborhood, l.city].filter(Boolean).join(' · ');
  const urlPublica = linkDoLancamento(l.href);
  const item = { chave: `lancamento:${l.id}`, tipo: 'lancamento' as const, titulo: l.name, detalhe: local, href: rotaDoLancamento(l) };
  const foto = l.img ? imagemOtimizada(l.img) : null;

  return (
    <>
      <RegistraAcesso usuario={corretor.id} item={item} />
      <Link href={`${ROTA_BASE}/lancamentos`} className={estilos.migalha}>
        <Icone nome="voltar" tamanho={16} /> Lançamentos
      </Link>

      <div className={estilos.detalhe}>
        {foto ? (
          <img
            src={foto.src}
            srcSet={foto.srcSet}
            sizes="(min-width: 900px) 620px, 100vw"
            alt={l.name}
            className={estilos.cartaoImagem}
            style={{ borderRadius: 14 }}
          />
        ) : (
          <div className={estilos.cartaoImagem} style={{ borderRadius: 14 }} aria-hidden="true" />
        )}

        <div>
          {l.exclusive && <span className={estilos.selo}>Exclusivo Lotus</span>}
          <h1 className={estilos.titulo} style={{ marginTop: 8 }}>
            {l.name}
          </h1>
          {local && <p className={estilos.subtitulo}>{local}</p>}

          <dl className={estilos.ficha}>
            {construtora && (
              <>
                <dt>Construtora</dt>
                <dd>
                  <Link href={rotaDaConstrutora(construtora.slug)}>{construtora.nome}</Link>
                </dd>
              </>
            )}
            {l.stage && (
              <>
                <dt>Fase</dt>
                <dd>{l.stage}</dd>
              </>
            )}
            {l.specs && (
              <>
                <dt>Tipologias</dt>
                <dd>{l.specs}</dd>
              </>
            )}
            <dt>Valor</dt>
            <dd>{l.price ?? 'Sob consulta'}</dd>
          </dl>

          <div className={estilos.acoes}>
            <Compartilhar texto={`${l.name}${local ? `, ${local}` : ''}. Veja os detalhes:`} url={urlPublica} />
            <BotaoFavoritar usuario={corretor.id} item={item} />
          </div>
          {!l.href && (
            <p className={estilos.texto} style={{ marginTop: 12, fontSize: 14 }}>
              Este empreendimento ainda não tem página própria no site; o link leva à vitrine de lançamentos.
            </p>
          )}
        </div>
      </div>

      <MateriaisDoLancamento nome={l.name} construtora={construtora?.nome ?? l.builder} usuario={corretor.id} />
    </>
  );
}

/**
 * Os arquivos da pasta do empreendimento no Drive ("LANÇAMENTOS / <construtora>
 * / <empreendimento>"), achada por nome parecido (ver drive-regras.ts). Sem
 * pasta própria, aponta a da construtora; sem nenhuma, a seção não aparece.
 */
async function MateriaisDoLancamento({ nome, construtora, usuario }: { nome: string; construtora: string; usuario: string }) {
  if (!driveConfigurado()) return null;
  const mapa = await mapaDoDrive().catch(() => null);
  const vinculo = mapa ? pastaDoLancamento(mapa, nome, construtora) : null;
  if (!vinculo) return null;

  const itens = vinculo.propria ? await conteudoDaPasta(vinculo.pasta.id).catch(() => null) : null;
  return (
    <section className={estilos.secao} aria-labelledby="materiais-do-lancamento">
      <div className={estilos.cabecalhoSecao}>
        <h2 id="materiais-do-lancamento" className={estilos.tituloSecao}>
          <Icone nome="pasta" /> {vinculo.propria ? `Materiais do ${nome}` : `Materiais da ${vinculo.pasta.nome}`}
        </h2>
        <Link href={vinculo.pasta.href} className={estilos.verTodos}>
          Abrir pasta
        </Link>
      </div>
      {itens ? (
        <ConteudoDoDrive itens={itens} rotaAtual={vinculo.pasta.href} nomeDaPasta={vinculo.pasta.nome} usuario={usuario} />
      ) : (
        <p className={estilos.vazio}>
          {vinculo.propria
            ? 'O Google Drive não respondeu agora. Use "Abrir pasta" para tentar de novo.'
            : `Este empreendimento não tem pasta própria no Drive; os materiais estão na pasta da ${vinculo.pasta.nome}.`}
        </p>
      )}
    </section>
  );
}
