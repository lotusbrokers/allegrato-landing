import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ConteudoDoDrive from '@/components/area-do-corretor/ConteudoDoDrive';
import Icone from '@/components/area-do-corretor/Icone';
import { ROTA_GESTOR } from '@/lib/area-do-corretor/acesso';
import { chaveDoDriveConfigurada, conteudoDaPasta, rotaDaPasta, trilhaDaPasta, type ItemDoDrive } from '@/lib/area-do-corretor/drive';
import { subpastaRepetida } from '@/lib/area-do-corretor/drive-regras';
import { exigirGestor } from '@/lib/area-do-corretor/sessao';
import { pastaDaGestao } from '@/lib/area-do-gestor/pastas';
import estilos from '@/components/area-do-corretor/area.module.css';

type Props = { params: Promise<{ pasta: string; caminho?: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pasta, caminho = [] } = await params;
  const raiz = pastaDaGestao(pasta);
  if (!raiz) return {};
  const trilha = raiz.id ? await trilhaDaPasta(caminho, raiz.id, `${ROTA_GESTOR}/drive/${raiz.chave}`).catch(() => null) : null;
  return { title: (trilha && trilha[trilha.length - 1]?.nome) ?? raiz.titulo };
}

/**
 * Uma pasta da gestão no Drive (Diretoria ou Marketing), com a mesma navegação
 * da pasta dos corretores: a URL leva os IDs desde a raiz, e cada passo é
 * conferido como subpasta do anterior (trilhaDaPasta). A rota só abre o que está
 * dentro da pasta escolhida.
 */
export default async function PastaDoGestor({ params }: Props) {
  const gestor = await exigirGestor();
  const { pasta, caminho = [] } = await params;
  const raiz = pastaDaGestao(pasta);
  if (!raiz) notFound();
  const base = `${ROTA_GESTOR}/drive/${raiz.chave}`;

  if (!raiz.id || !chaveDoDriveConfigurada()) {
    const faltando = [chaveDoDriveConfigurada() ? null : 'GOOGLE_DRIVE_API_KEY', raiz.id ? null : raiz.variavel].filter(Boolean);
    return (
      <div className={estilos.aviso} role="status">
        <h3>A pasta {raiz.titulo} ainda não está conectada</h3>
        <p>Falta no ambiente do site: {faltando.join(' e ')}.</p>
      </div>
    );
  }

  const trilha = await trilhaDaPasta(caminho, raiz.id, base).catch(() => null);
  if (!trilha) notFound();

  const atual = trilha[trilha.length - 1] ?? null;
  const pastaId = atual?.id ?? raiz.id;
  const titulo = atual?.nome ?? raiz.titulo;
  const rotaAtual = rotaDaPasta(caminho, base);

  let itens: ItemDoDrive[] | null = null;
  try {
    itens = await conteudoDaPasta(pastaId);
  } catch (erro) {
    console.error(erro instanceof Error ? erro.message : erro);
  }

  // Pasta repetida ("MARKETING / MARKETING"): vai direto para dentro dela, sem o clique a mais.
  const repetida = atual && itens ? subpastaRepetida(atual.nome, itens) : null;
  if (repetida) redirect(`${rotaAtual}/${repetida.id}`);

  return (
    <>
      <nav className={estilos.trilha} aria-label="Caminho no Drive">
        <Link href={atual ? base : ROTA_GESTOR}>
          <Icone nome="voltar" tamanho={16} /> {atual ? raiz.titulo : 'Área do Gestor'}
        </Link>
        {trilha.slice(0, -1).map((t) => (
          <span key={t.id} style={{ display: 'contents' }}>
            <span aria-hidden="true">/</span>
            <Link href={t.href}>{t.nome}</Link>
          </span>
        ))}
      </nav>

      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>{titulo}</h1>
        <div className={estilos.acoes}>
          <a href={`https://drive.google.com/drive/folders/${pastaId}`} target="_blank" rel="noopener" className={estilos.botao}>
            <Icone nome="externo" /> Abrir no Google Drive
          </a>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        {!itens ? (
          <div className={estilos.aviso} role="alert">
            <h3>O Google Drive não respondeu agora</h3>
            <p>Tente de novo em instantes. Se continuar, abra a pasta direto no Drive.</p>
          </div>
        ) : itens.length === 0 && !atual ? (
          // Pasta que não está compartilhada por link também chega vazia: o Drive só lista o que a chave enxerga.
          <div className={estilos.aviso} role="status">
            <h3>Nada aparece nesta pasta</h3>
            <p>
              Ou ela está vazia, ou ainda não está compartilhada no Drive como &quot;Qualquer pessoa com o link&quot;,
              como a pasta dos corretores.
            </p>
          </div>
        ) : (
          <ConteudoDoDrive itens={itens} rotaAtual={rotaAtual} nomeDaPasta={titulo} usuario={gestor.id} />
        )}
      </div>
    </>
  );
}
