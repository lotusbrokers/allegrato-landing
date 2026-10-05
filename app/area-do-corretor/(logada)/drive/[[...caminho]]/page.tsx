import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { subpastaRepetida } from '@/lib/area-do-corretor/drive-regras';
import ConteudoDoDrive from '@/components/area-do-corretor/ConteudoDoDrive';
import { BotaoFavoritar, RegistraAcesso } from '@/components/area-do-corretor/Memoria';
import Icone from '@/components/area-do-corretor/Icone';
import { exigirCorretor } from '@/lib/area-do-corretor/sessao';
import { conteudoDaPasta, driveConfigurado, idDaRaiz, rotaDaPasta, trilhaDaPasta, type ItemDoDrive } from '@/lib/area-do-corretor/drive';
import { podeGerenciar } from '@/lib/area-do-corretor/acesso';
import estilos from '@/components/area-do-corretor/area.module.css';

type Props = { params: Promise<{ caminho?: string[] }> };

const TITULO_DA_RAIZ = 'Materiais no Drive';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { caminho = [] } = await params;
  const trilha = driveConfigurado() ? await trilhaDaPasta(caminho).catch(() => null) : null;
  return { title: (trilha && trilha[trilha.length - 1]?.nome) ?? TITULO_DA_RAIZ };
}

/**
 * Navegação pela pasta do Drive da Lotus. A URL leva os IDs desde a raiz
 * (/drive/<pasta>/<subpasta>), e cada passo é conferido como subpasta do
 * anterior (trilhaDaPasta): a rota só abre o que está dentro de "1. Corretores".
 */
export default async function PastaDoDrive({ params }: Props) {
  const corretor = await exigirCorretor();
  const { caminho = [] } = await params;

  if (!driveConfigurado()) {
    return (
      <div className={estilos.aviso} role="status">
        <h3>A pasta do Drive ainda não está conectada</h3>
        <p>
          {podeGerenciar(corretor.papel)
            ? 'Faltam as variáveis GOOGLE_DRIVE_API_KEY e GOOGLE_DRIVE_PASTA_ID no ambiente do site.'
            : 'Os materiais vão aparecer aqui assim que a administração conectar a pasta.'}
        </p>
      </div>
    );
  }

  const trilha = await trilhaDaPasta(caminho).catch(() => null);
  if (!trilha) notFound();

  const atual = trilha[trilha.length - 1] ?? null;
  const pastaId = atual?.id ?? idDaRaiz()!;
  const titulo = atual?.nome ?? TITULO_DA_RAIZ;
  const rotaAtual = rotaDaPasta(caminho);

  let itens: ItemDoDrive[] | null = null;
  try {
    itens = await conteudoDaPasta(pastaId);
  } catch (erro) {
    console.error(erro instanceof Error ? erro.message : erro);
  }

  // Pasta repetida ("SANTA ANGELA / SANTA ANGELA"): vai direto para dentro dela, sem o clique a mais.
  const repetida = atual && itens ? subpastaRepetida(atual.nome, itens) : null;
  if (repetida) redirect(`${rotaAtual}/${repetida.id}`);

  return (
    <>
      {atual && (
        <RegistraAcesso
          usuario={corretor.id}
          item={{
            chave: `pasta:${atual.id}`,
            tipo: 'pasta',
            titulo,
            detalhe: trilha.slice(0, -1).map((t) => t.nome).join(' / ') || 'Drive',
            href: rotaAtual,
          }}
        />
      )}

      {trilha.length > 0 && (
        <nav className={estilos.trilha} aria-label="Caminho no Drive">
          <Link href={rotaDaPasta([])}>
            <Icone nome="voltar" tamanho={16} /> Drive
          </Link>
          {trilha.slice(0, -1).map((t) => (
            <span key={t.id} style={{ display: 'contents' }}>
              <span aria-hidden="true">/</span>
              <Link href={t.href}>{t.nome}</Link>
            </span>
          ))}
        </nav>
      )}

      <div className={estilos.saudacao}>
        <h1 className={estilos.titulo}>{titulo}</h1>
        {!atual && <p className={estilos.subtitulo}>As pastas que a equipe da Lotus mantém no Google Drive.</p>}
        {atual && (
          <div className={estilos.acoes}>
            <a href={`https://drive.google.com/drive/folders/${atual.id}`} target="_blank" rel="noopener" className={estilos.botao}>
              <Icone nome="externo" /> Abrir no Google Drive
            </a>
            <BotaoFavoritar
              usuario={corretor.id}
              item={{ chave: `pasta:${atual.id}`, tipo: 'pasta', titulo, detalhe: 'Pasta no Drive', href: rotaAtual }}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        {itens ? (
          <ConteudoDoDrive itens={itens} rotaAtual={rotaAtual} nomeDaPasta={titulo} usuario={corretor.id} />
        ) : (
          <div className={estilos.aviso} role="alert">
            <h3>O Google Drive não respondeu agora</h3>
            <p>Tente de novo em instantes. Se continuar, abra a pasta direto no Drive.</p>
          </div>
        )}
      </div>
    </>
  );
}
