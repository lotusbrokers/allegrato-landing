import Link from 'next/link';
import type { LancamentoListItem } from '@/lib/lancamentos';
import type { ImovelBusca } from '@/lib/imoveis';
import { imagemOtimizada } from '@/lib/imagem-otimizada';
import { rotaDoImovel, rotaDoLancamento, type Destaque } from '@/lib/area-do-corretor/dados';
import type { Secao } from '@/lib/area-do-corretor/secoes';
import { SEM_PRECO } from '@/lib/preco-sob-consulta';
import Icone, { type NomeDoIcone } from './Icone';
import estilos from './area.module.css';

/** Foto do card em WebP, nas larguras que um card de até ~400px pede. Sem foto, o fundo verde do CSS. */
function Foto({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <div className={estilos.cartaoImagem} aria-hidden="true" />;
  const img = imagemOtimizada(src, [640, 1080]);
  return (
    <img
      src={img.src}
      srcSet={img.srcSet}
      sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 90vw"
      alt={alt}
      loading="lazy"
      fetchPriority="low"
      className={estilos.cartaoImagem}
    />
  );
}

export function CartaoDestaque({ d }: { d: Destaque }) {
  return (
    <Link href={d.href} className={estilos.cartao}>
      <Foto src={d.img} alt={d.titulo} />
      <div className={estilos.cartaoCorpo}>
        <span className={estilos.selo}>{d.selo}</span>
        <h3 className={estilos.cartaoTitulo}>{d.titulo}</h3>
        {d.detalhe && <span className={estilos.cartaoDetalhe}>{d.detalhe}</span>}
        <span className={estilos.cartaoPreco}>{d.preco ?? SEM_PRECO}</span>
        <span className={estilos.cta}>
          Ver oportunidade <Icone nome="seta" tamanho={16} />
        </span>
      </div>
    </Link>
  );
}

export function CartaoLancamento({ l }: { l: LancamentoListItem }) {
  return (
    <Link href={rotaDoLancamento(l)} className={estilos.cartao}>
      <Foto src={l.img} alt={l.name} />
      <div className={estilos.cartaoCorpo}>
        {l.exclusive && <span className={estilos.selo}>Exclusivo Lotus</span>}
        <h3 className={estilos.cartaoTitulo}>{l.name}</h3>
        <span className={estilos.cartaoDetalhe}>{[l.neighborhood, l.city].filter(Boolean).join(' · ')}</span>
        <span className={estilos.cartaoDetalhe}>{[l.builder, l.stage].filter(Boolean).join(' · ')}</span>
        {/* Metragem e quartos como estão no cadastro: é o texto que a busca da lista lê. */}
        {l.specs && <span className={estilos.cartaoDetalhe}>{l.specs}</span>}
        <span className={estilos.cartaoPreco}>{l.price ?? SEM_PRECO}</span>
      </div>
    </Link>
  );
}

export function CartaoImovel({ i }: { i: ImovelBusca }) {
  const medidas = [i.beds ? `${i.beds} dorm.` : '', i.area ? `${i.area} m²` : '', i.vagas ? `${i.vagas} vaga${i.vagas > 1 ? 's' : ''}` : '']
    .filter(Boolean)
    .join(' · ');
  return (
    <Link href={rotaDoImovel(i.codigo)} className={estilos.cartao}>
      <Foto src={i.img || null} alt={`${i.type} no ${i.neighborhood}`} />
      <div className={estilos.cartaoCorpo}>
        <span className={estilos.selo}>{i.fin === 'alugar' ? 'Aluguel' : 'Venda'}</span>
        <h3 className={estilos.cartaoTitulo}>
          {i.type} · {i.neighborhood}
        </h3>
        <span className={estilos.cartaoDetalhe}>{[i.city, `cód. ${i.codigo}`].filter(Boolean).join(' · ')}</span>
        {medidas && <span className={estilos.cartaoDetalhe}>{medidas}</span>}
        <span className={estilos.cartaoPreco}>{i.price}</span>
      </div>
    </Link>
  );
}

/** Cartão de acesso rápido: seção fixa (Secao) ou pasta do Drive. */
export function Atalho({
  titulo,
  resumo,
  href,
  icone,
  contagem,
}: {
  titulo: string;
  resumo?: string;
  href: string;
  icone: NomeDoIcone;
  contagem?: number;
}) {
  return (
    <Link href={href} className={estilos.atalho}>
      <span className={estilos.iconeAtalho}>
        <Icone nome={icone} />
      </span>
      <span className={estilos.nomeAtalho}>{titulo}</span>
      {resumo && <span className={estilos.resumoAtalho}>{resumo}</span>}
      {contagem !== undefined && <span className={estilos.contagem}>{contagem}</span>}
    </Link>
  );
}

export function AtalhoDaSecao({ secao, contagem }: { secao: Secao; contagem?: number }) {
  return <Atalho titulo={secao.titulo} resumo={secao.resumo} href={secao.href} icone={secao.icone} contagem={contagem} />;
}
