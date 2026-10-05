/**
 * Regras da integração com o Google Drive que não dependem da API: nomes,
 * tipos de arquivo, o que nunca aparece, e a correspondência entre as pastas do
 * Drive e os empreendimentos/construtoras da Dashboard.
 *
 * A pasta é organizada pela equipe da Lotus, à mão: "2. LANÇAMENTOS / FA Oliva /
 * Vila Trunfo". Os nomes não batem letra a letra com os da Dashboard ("Vila
 * Triunfo", "F A Oliva") — por isso a correspondência tolera caixa, acento,
 * pontuação, palavras genéricas e erro de digitação, em vez de exigir nome igual.
 */
import { normalizar } from './busca';

/** Credencial não circula por link: arquivo com nome assim não aparece na área nem na busca. */
export function arquivoSensivel(nome: string): boolean {
  return /senha|password|credencia/.test(normalizar(nome));
}

/** Arquivo que o sistema operacional cria sozinho (.DS_Store do Mac, Thumbs.db do Windows): não é material. */
export function arquivoDeSistema(nome: string): boolean {
  return nome.startsWith('.') || /^(thumbs\.db|desktop\.ini)$/i.test(nome);
}

/**
 * Lista de leads é dado pessoal de cliente (nome, telefone): não circula pela
 * área, mesmo estando na pasta compartilhada ("z. Leads Plantão", pedido da
 * Lotus em 05/10/2026). Vale para pasta ou arquivo com "lead" ou "leads" no nome.
 */
export function dadosDeClientes(nome: string): boolean {
  return /\bleads?\b/.test(normalizar(nome));
}

/** O que nunca aparece na área (nem por link direto, nem na busca): credenciais, dados de clientes e arquivos de sistema. */
export function ficaDeFora(nome: string): boolean {
  return arquivoSensivel(nome) || dadosDeClientes(nome) || arquivoDeSistema(nome);
}

/**
 * "SANTA ANGELA / SANTA ANGELA": pasta cujo único conteúdo é uma subpasta de
 * mesmo nome — sobra comum de subir uma pasta para dentro de outra igual. A
 * área passa direto por ela; sem isso os empreendimentos ficam um nível abaixo
 * do esperado e não são achados. Devolve a subpasta repetida, ou null.
 */
export function subpastaRepetida<T extends { nome: string; pasta: boolean }>(nomeDaPasta: string, conteudo: T[]): T | null {
  if (conteudo.length !== 1 || !conteudo[0].pasta) return null;
  const chave = chaveDeComparacao(nomeDaPasta);
  return chave && chaveDeComparacao(conteudo[0].nome) === chave ? conteudo[0] : null;
}

/**
 * Nome para a tela: sem a numeração de ordem ("2. LANÇAMENTOS" → "LANÇAMENTOS")
 * e sem o sufixo que o Drive acrescenta a pasta extraída de .zip
 * ("Vivart Grand Alamedas-20260917T152753Z-1-001").
 */
export function nomeLimpo(nome: string): string {
  const limpo = nome
    .replace(/^\s*\d+\s*[.)-]\s*/, '')
    .replace(/-\d{8}T\d{6}Z-\d+-\d+$/i, '')
    .trim();
  return limpo || nome.trim();
}

/** A numeração que a Lotus usa para ordenar ("1. PRONTOS"); pasta sem número vai para o fim. */
export function ordemDaPasta(nome: string): number {
  const m = nome.match(/^\s*(\d+)\s*[.)-]/);
  return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
}

export type TipoDeArquivo = 'pasta' | 'pdf' | 'imagem' | 'video' | 'planilha' | 'apresentacao' | 'documento' | 'arquivo';

export const ROTULO_DO_TIPO: Record<TipoDeArquivo, string> = {
  pasta: 'Pasta',
  pdf: 'PDF',
  imagem: 'Imagem',
  video: 'Vídeo',
  planilha: 'Planilha',
  apresentacao: 'Apresentação',
  documento: 'Documento',
  arquivo: 'Arquivo',
};

export function tipoDeArquivo(mime: string, nome: string): TipoDeArquivo {
  if (mime === 'application/vnd.google-apps.folder') return 'pasta';
  if (mime === 'application/pdf' || /\.pdf$/i.test(nome)) return 'pdf';
  if (mime.startsWith('image/')) return 'imagem';
  if (mime.startsWith('video/')) return 'video';
  if (/spreadsheet|excel|csv/.test(mime) || /\.(xlsx?|csv)$/i.test(nome)) return 'planilha';
  if (/presentation|powerpoint/.test(mime) || /\.pptx?$/i.test(nome)) return 'apresentacao';
  if (/document|msword|text\//.test(mime) || /\.(docx?|txt)$/i.test(nome)) return 'documento';
  return 'arquivo';
}

/** Ícone da pasta pelo assunto do nome; o padrão é a pasta comum. */
export function iconeDaPasta(nome: string): 'predio' | 'casa' | 'megafone' | 'documento' | 'relogio' | 'ferramenta' | 'pasta' {
  const n = normalizar(nome);
  if (/lancamento/.test(n)) return 'predio';
  if (/pronto|terceiro|imove/.test(n)) return 'casa';
  if (/regra|politica|curso|livro|treinamento|manual/.test(n)) return 'documento';
  if (/marketing|campanha|divulga/.test(n)) return 'megafone';
  if (/pauta|reuni/.test(n)) return 'relogio';
  if (/ferramenta|simula/.test(n)) return 'ferramenta';
  return 'pasta';
}

/* ---------------- Correspondência de nomes ---------------- */

/** Palavras que não distinguem um empreendimento (ou construtora) de outro. */
const GENERICAS = new Set([
  'de', 'do', 'da', 'dos', 'das', 'e',
  'residencial', 'residence', 'condominio',
  'jundiai', 'itupeva', 'sp',
  'incorporadora', 'construtora', 'grupo', 'empreendimentos',
]);

/** Forma comparável: sem acento, pontuação, espaço e palavras genéricas. "F A Oliva" e "FA Oliva" viram "faoliva". */
export function chaveDeComparacao(nome: string): string {
  return normalizar(nomeLimpo(nome))
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((p) => p && !GENERICAS.has(p))
    .join('');
}

function bigramas(s: string): string[] {
  const r: string[] = [];
  for (let i = 0; i < s.length - 1; i++) r.push(s.slice(i, i + 2));
  return r;
}

/**
 * Semelhança de 0 a 1 entre dois nomes. Iguais na forma comparável: 1. Um
 * contido no outro ("epic" em "epicjundiai"): 0,9 a 1, mais perto de 1 quanto
 * maior a parte comum. Fora isso, o coeficiente de Dice dos pares de letras,
 * que absorve erro de digitação ("Vila Trunfo" × "Vila Triunfo" ≈ 0,84).
 */
export function semelhanca(a: string, b: string): number {
  const x = chaveDeComparacao(a);
  const y = chaveDeComparacao(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const [curto, longo] = x.length <= y.length ? [x, y] : [y, x];
  if (curto.length >= 4 && longo.includes(curto)) return 0.9 + 0.1 * (curto.length / longo.length);

  const bx = bigramas(x);
  const sobra = bigramas(y);
  const total = bx.length + sobra.length;
  let comuns = 0;
  for (const g of bx) {
    const i = sobra.indexOf(g);
    if (i >= 0) {
      comuns++;
      sobra.splice(i, 1);
    }
  }
  return total ? (2 * comuns) / total : 0;
}

/** O candidato mais parecido com `nome`, se passar do mínimo; no empate, o primeiro. */
export function maisParecido<T extends { nome: string }>(nome: string, candidatos: T[], minimo: number): T | null {
  let melhor: T | null = null;
  let nota = 0;
  for (const c of candidatos) {
    const s = semelhanca(nome, c.nome);
    if (s > nota) {
      melhor = c;
      nota = s;
    }
  }
  return nota >= minimo ? melhor : null;
}
