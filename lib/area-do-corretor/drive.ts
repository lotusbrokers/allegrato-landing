/**
 * Materiais da Área do Corretor, lidos da pasta do Google Drive da Lotus
 * ("1. Corretores"), que a equipe organiza direto no Drive (decisão de 05/10/2026).
 *
 * Só no servidor: a chave de API (GOOGLE_DRIVE_API_KEY) nunca vai ao navegador,
 * e a pasta (GOOGLE_DRIVE_PASTA_ID) fica em variável de ambiente porque este
 * repositório é público — o ID no código abriria os materiais a quem lesse.
 * A chave lê apenas o que está compartilhado como "qualquer pessoa com o link".
 *
 * Cada pasta fica guardada por 5 minutos: o que a equipe muda no Drive aparece
 * na área sem deploy, com esse atraso no máximo.
 */
import { unstable_cache } from 'next/cache';
import { ROTA_BASE } from './acesso';
import type { ItemDeBusca } from './busca';
import {
  ficaDeFora,
  maisParecido,
  nomeLimpo,
  ordemDaPasta,
  ROTULO_DO_TIPO,
  subpastaRepetida,
  tipoDeArquivo,
  type TipoDeArquivo,
} from './drive-regras';

const API = 'https://www.googleapis.com/drive/v3/files';
const MIME_PASTA = 'application/vnd.google-apps.folder';
const MIME_ATALHO = 'application/vnd.google-apps.shortcut';
const GUARDA_SEGUNDOS = 300;
/**
 * Versão das guardas: muda junto com as regras de filtro (ficaDeFora) e com o
 * formato do mapa. Listagem guardada com a regra antiga não pode ser reaproveitada.
 */
const VERSAO_DA_GUARDA = 'v3';
/** Chave de API do Google: "AIza" + 35 letras, números, - ou _. */
const FORMATO_DA_CHAVE = /^AIza[A-Za-z0-9_-]{35}$/;

function configuracao(): { chave: string; raiz: string } | null {
  const chave = process.env.GOOGLE_DRIVE_API_KEY?.trim();
  const raiz = process.env.GOOGLE_DRIVE_PASTA_ID?.trim();
  return chave && raiz ? { chave, raiz } : null;
}

export function driveConfigurado(): boolean {
  return configuracao() !== null;
}

/** IDs do Drive só têm letras, números, - e _. O ID entra na consulta: nada fora disso passa. */
export function idValido(id: string): boolean {
  return /^[A-Za-z0-9_-]{10,100}$/.test(id);
}

export type ItemDoDrive = {
  id: string;
  nome: string;
  pasta: boolean;
  tipo: TipoDeArquivo;
  /** Abre no Drive (visualização). */
  link: string;
  /** Download direto; o Drive só oferece para arquivo comum (não para Docs/Planilhas Google). */
  download: string | null;
  modificadoEm: string | null;
  ordem: number;
};

type ItemBruto = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  modifiedTime?: string;
  shortcutDetails?: { targetId: string; targetMimeType: string };
};

/** Atalho do Drive vale pelo que aponta: atalho para pasta é navegável como pasta. */
function paraItem(b: ItemBruto): ItemDoDrive {
  const atalho = b.mimeType === MIME_ATALHO && b.shortcutDetails ? b.shortcutDetails : null;
  const mime = atalho ? atalho.targetMimeType : b.mimeType;
  const id = atalho ? atalho.targetId : b.id;
  const pasta = mime === MIME_PASTA;
  return {
    id,
    nome: nomeLimpo(b.name),
    pasta,
    tipo: tipoDeArquivo(mime, b.name),
    link: b.webViewLink ?? (pasta ? `https://drive.google.com/drive/folders/${id}` : `https://drive.google.com/file/d/${id}/view`),
    download: atalho ? null : (b.webContentLink ?? null),
    modificadoEm: b.modifiedTime ?? null,
    ordem: ordemDaPasta(b.name),
  };
}

async function buscarConteudo(pastaId: string): Promise<ItemDoDrive[]> {
  const config = configuracao();
  if (!config) throw new Error('[area-do-corretor] Google Drive não configurado');
  if (!idValido(pastaId)) throw new Error('[area-do-corretor] id de pasta inválido');

  const itens: ItemDoDrive[] = [];
  let pagina: string | undefined;
  for (let n = 0; n < 5; n++) {
    const parametros = new URLSearchParams({
      q: `'${pastaId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink, modifiedTime, shortcutDetails)',
      pageSize: '1000',
      orderBy: 'folder,name_natural',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      key: config.chave,
    });
    if (pagina) parametros.set('pageToken', pagina);
    const resposta = await fetch(`${API}?${parametros}`);
    if (!resposta.ok) {
      // O motivo que o Google devolve (chave inválida, API desativada, pasta sem acesso) vai para o log; a chave não aparece nele.
      const corpo = (await resposta.json().catch(() => null)) as { error?: { message?: string; errors?: { reason?: string }[] } } | null;
      const motivo = [corpo?.error?.errors?.[0]?.reason, corpo?.error?.message].filter(Boolean).join(': ');
      // Chave recusada: diz se o formato bate (AIza + 35 caracteres), sem mostrar a chave. O engano
      // mais comum é colar junto aspas, < > ou espaço, no .env.local ou no Easypanel.
      const dica = /api key not valid/i.test(motivo) && !FORMATO_DA_CHAVE.test(config.chave)
        ? ` — GOOGLE_DRIVE_API_KEY não tem o formato de chave do Google (começa com AIza, 39 caracteres; tem ${config.chave.length})`
        : '';
      throw new Error(`[area-do-corretor] Drive respondeu ${resposta.status} para a pasta ${pastaId}${motivo ? ` (${motivo})` : ''}${dica}`);
    }
    const dados = (await resposta.json()) as { files?: ItemBruto[]; nextPageToken?: string };
    for (const b of dados.files ?? []) if (!ficaDeFora(b.name)) itens.push(paraItem(b));
    pagina = dados.nextPageToken;
    if (!pagina) break;
  }
  // Pastas antes dos arquivos; entre pastas, a numeração da Lotus ("1. PRONTOS") e depois o nome.
  return itens.sort((a, b) => Number(b.pasta) - Number(a.pasta) || a.ordem - b.ordem);
}

/** Conteúdo de uma pasta (pastas primeiro). Lança se o Drive não responder. */
export function conteudoDaPasta(pastaId: string): Promise<ItemDoDrive[]> {
  return unstable_cache(() => buscarConteudo(pastaId), ['area-do-corretor:drive:pasta', VERSAO_DA_GUARDA, pastaId], {
    revalidate: GUARDA_SEGUNDOS,
  })();
}

/** Rota da área para uma pasta, pelos IDs desde a raiz (sem a raiz). */
export function rotaDaPasta(caminho: string[]): string {
  return caminho.length ? `${ROTA_BASE}/drive/${caminho.join('/')}` : `${ROTA_BASE}/drive`;
}

export type PastaNoCaminho = { id: string; nome: string; href: string };

/**
 * Confere que cada ID do caminho é subpasta do anterior, a partir da raiz da
 * Lotus, e devolve a trilha com os nomes. Assim a rota só abre pastas que estão
 * dentro de "1. Corretores" — nunca uma pasta pública qualquer do Drive.
 * Devolve null se algum passo não confere.
 */
export async function trilhaDaPasta(caminho: string[]): Promise<PastaNoCaminho[] | null> {
  const config = configuracao();
  if (!config || !caminho.every(idValido)) return null;
  const trilha: PastaNoCaminho[] = [];
  let atual = config.raiz;
  for (let i = 0; i < caminho.length; i++) {
    const filha = (await conteudoDaPasta(atual)).find((item) => item.pasta && item.id === caminho[i]);
    if (!filha) return null;
    trilha.push({ id: filha.id, nome: filha.nome, href: rotaDaPasta(caminho.slice(0, i + 1)) });
    atual = filha.id;
  }
  return trilha;
}

export function idDaRaiz(): string | null {
  return configuracao()?.raiz ?? null;
}

/* ---------------- Mapa dos três primeiros níveis ---------------- */

/**
 * Pasta do mapa. `nivel` é o nível lógico (1 = seção, 2 = construtora, 3 =
 * empreendimento); `caminho` são os IDs reais desde a raiz, que podem ser mais
 * longos quando há pasta repetida no meio ("SANTA ANGELA / SANTA ANGELA").
 */
export type PastaMapeada = { id: string; nome: string; caminho: string[]; nivel: number; href: string; paiId: string | null };
export type ArquivoMapeado = ItemDoDrive & { pasta: false; local: PastaMapeada };
export type MapaDoDrive = { secoes: PastaMapeada[]; pastas: PastaMapeada[]; arquivos: ArquivoMapeado[] };

/**
 * Conteúdo da pasta, passando direto por subpasta repetida (ver
 * subpastaRepetida). Devolve também os IDs atravessados, que entram no caminho.
 */
async function conteudoSemRepeticao(id: string, nome: string): Promise<{ itens: ItemDoDrive[]; atravessadas: string[] }> {
  let itens = await conteudoDaPasta(id);
  const atravessadas: string[] = [];
  for (let n = 0; n < 3; n++) {
    const repetida = subpastaRepetida(nome, itens);
    if (!repetida) break;
    atravessadas.push(repetida.id);
    itens = await conteudoDaPasta(repetida.id);
  }
  return { itens, atravessadas };
}

/**
 * As seções da raiz (nível 1), as subpastas delas (nível 2: as construtoras em
 * "LANÇAMENTOS") e as do nível 3 (os empreendimentos), com os arquivos dos
 * níveis 1 e 2. É o que alimenta a busca e a ligação empreendimento → pasta.
 * Mais fundo do que isso, a navegação abre pasta a pasta.
 */
async function montarMapa(): Promise<MapaDoDrive> {
  const raiz = configuracao()?.raiz;
  if (!raiz) return { secoes: [], pastas: [], arquivos: [] };

  type Fronteira = { id: string; nome: string; caminho: string[]; local: PastaMapeada | null };
  const pastas: PastaMapeada[] = [];
  const arquivos: ArquivoMapeado[] = [];
  let fronteira: Fronteira[] = [{ id: raiz, nome: '', caminho: [], local: null }];

  for (let nivel = 1; nivel <= 3 && fronteira.length; nivel++) {
    const conteudos = await Promise.all(
      fronteira.map((p) =>
        nivel === 1
          ? // A raiz falhando derruba o mapa de propósito: erro não fica guardado, e a próxima visita tenta de novo.
            // Guardar um mapa vazio deixaria a área "indisponível" por 5 minutos depois do problema resolvido.
            conteudoSemRepeticao(p.id, p.nome)
          : conteudoSemRepeticao(p.id, p.nome).catch((erro: unknown) => {
              // Uma subpasta que falha não derruba o mapa: ela só fica fora da busca até a próxima leitura.
              console.error(erro instanceof Error ? erro.message : erro);
              return { itens: [] as ItemDoDrive[], atravessadas: [] as string[] };
            }),
      ),
    );
    const proxima: Fronteira[] = [];
    fronteira.forEach((pai, i) => {
      const { itens, atravessadas } = conteudos[i];
      const base = [...pai.caminho, ...atravessadas];
      // Arquivo de pasta atravessada mora na subpasta repetida: o link vai até ela.
      const localDosArquivos = pai.local && atravessadas.length ? { ...pai.local, href: rotaDaPasta(base) } : pai.local;
      for (const item of itens) {
        if (item.pasta) {
          const caminho = [...base, item.id];
          const mapeada: PastaMapeada = {
            id: item.id,
            nome: item.nome,
            caminho,
            nivel,
            href: rotaDaPasta(caminho),
            paiId: pai.local?.id ?? null,
          };
          pastas.push(mapeada);
          proxima.push({ id: item.id, nome: item.nome, caminho, local: mapeada });
        } else if (localDosArquivos) {
          arquivos.push({ ...item, pasta: false, local: localDosArquivos });
        }
      }
    });
    // Arquivos do nível 3 ficam para a navegação: listá-los aqui multiplicaria as chamadas.
    fronteira = nivel < 3 ? proxima : [];
  }
  return { secoes: pastas.filter((p) => p.nivel === 1), pastas, arquivos };
}

/**
 * Mapa guardado como um todo; cada pasta dentro dele também tem a própria guarda.
 * A chave leva VERSAO_DA_GUARDA (ver acima).
 */
export const mapaDoDrive = unstable_cache(montarMapa, ['area-do-corretor:drive:mapa', VERSAO_DA_GUARDA], { revalidate: GUARDA_SEGUNDOS });

/** A seção de lançamentos do Drive ("2. LANÇAMENTOS"), achada pelo nome. */
function secaoDeLancamentos(mapa: MapaDoDrive): PastaMapeada | null {
  return maisParecido('Lançamentos', mapa.secoes, 0.9);
}

function filhasDe(mapa: MapaDoDrive, pai: PastaMapeada): PastaMapeada[] {
  return mapa.pastas.filter((p) => p.paiId === pai.id);
}

/** Pasta da construtora em "LANÇAMENTOS" (nível 2). */
export function pastaDaConstrutora(mapa: MapaDoDrive, construtora: string): PastaMapeada | null {
  const secao = secaoDeLancamentos(mapa);
  if (!secao || !construtora) return null;
  return maisParecido(construtora, filhasDe(mapa, secao), 0.8);
}

/**
 * Pasta do empreendimento: primeiro entre as subpastas da construtora dele;
 * se a construtora não tiver pasta ou o empreendimento não estiver nela, busca
 * em toda a seção de lançamentos com régua mais alta (a Gran Ville, por
 * exemplo, tem pasta própria no nível das construtoras). Sem pasta própria,
 * vale a da construtora.
 */
export function pastaDoLancamento(
  mapa: MapaDoDrive,
  empreendimento: string,
  construtora: string,
): { pasta: PastaMapeada; propria: boolean } | null {
  const secao = secaoDeLancamentos(mapa);
  if (!secao) return null;
  const daConstrutora = pastaDaConstrutora(mapa, construtora);
  const propria =
    (daConstrutora && maisParecido(empreendimento, filhasDe(mapa, daConstrutora), 0.75)) ||
    maisParecido(
      empreendimento,
      mapa.pastas.filter((p) => p.caminho[0] === secao.id && p.nivel > 1),
      0.9,
    );
  if (propria) return { pasta: propria, propria: true };
  return daConstrutora ? { pasta: daConstrutora, propria: false } : null;
}

/** Pastas e arquivos do mapa no formato da busca global. */
export function indiceDoDrive(mapa: MapaDoDrive): ItemDeBusca[] {
  const trilha = (p: PastaMapeada) =>
    p.caminho
      .map((id) => mapa.pastas.find((x) => x.id === id)?.nome)
      .filter(Boolean)
      .join(' / ');
  return [
    ...mapa.pastas.map((p) => ({ tipo: 'pasta' as const, titulo: p.nome, detalhe: trilha(p), href: p.href, termos: 'drive pasta material' })),
    ...mapa.arquivos.map((a) => ({
      tipo: 'arquivo' as const,
      titulo: a.nome,
      detalhe: `${ROTULO_DO_TIPO[a.tipo]} · ${trilha(a.local)}`,
      href: `${a.local.href}#arquivo-${a.id}`,
      termos: `drive material ${ROTULO_DO_TIPO[a.tipo]}`,
    })),
  ];
}
