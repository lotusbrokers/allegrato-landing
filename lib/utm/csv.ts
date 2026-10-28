/**
 * Leitura e escrita de CSV do UTM Manager, sem dependência.
 *
 * Roda no navegador (o arquivo do Meta Ads é lido lá, e só as colunas
 * mapeadas vão para o servidor) e nos testes. Segue a RFC 4180: campo entre
 * aspas pode ter delimitador, quebra de linha e aspas dobradas (""). Dividir
 * por vírgula não serve: o nome de campanha e a URL de destino têm vírgula.
 */

export type Codificacao = 'utf-8' | 'utf-16le' | 'utf-16be' | 'windows-1252';

export type TextoDoArquivo = {
  texto: string;
  codificacao: Codificacao;
  /** Aviso para a prévia quando a leitura precisou de conversão ou desconfia dos acentos. */
  aviso: string | null;
};

/**
 * Bytes do arquivo para texto. O Meta exporta em UTF-8, mas um CSV aberto e
 * salvo no Excel em português vira Windows-1252: lido como UTF-8, cada acento
 * viraria um "�". Por isso o UTF-8 é estrito e, se falhar, a leitura cai para
 * Windows-1252 avisando.
 */
export function decodificarArquivo(bytes: Uint8Array): TextoDoArquivo {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { texto: new TextDecoder('utf-16le').decode(bytes.subarray(2)), codificacao: 'utf-16le', aviso: null };
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { texto: new TextDecoder('utf-16be').decode(bytes.subarray(2)), codificacao: 'utf-16be', aviso: null };
  }
  const semBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes;
  try {
    const texto = new TextDecoder('utf-8', { fatal: true }).decode(semBom);
    // "Ã§" e "Ã£" no lugar de "ç" e "ã": texto que já foi convertido duas vezes.
    const aviso = /Ã[\u0080-¿]/.test(texto)
      ? 'Os acentos do arquivo parecem corrompidos ("Ã§" no lugar de "ç"). Exporte de novo do Meta Ads, sem abrir no Excel.'
      : null;
    return { texto, codificacao: 'utf-8', aviso };
  } catch {
    return {
      texto: new TextDecoder('windows-1252').decode(semBom),
      codificacao: 'windows-1252',
      aviso: 'O arquivo não estava em UTF-8 e foi lido como Windows-1252, o formato do Excel em português. Confira os acentos na prévia.',
    };
  }
}

export type Delimitador = ',' | ';' | '\t';

export type Tabela = {
  cabecalho: string[];
  /** Linhas de dados, já com o número da linha no arquivo (1 = cabeçalho). */
  linhas: { numero: number; campos: string[] }[];
  delimitador: Delimitador;
  avisos: string[];
};

/** Delimitador do cabeçalho: o que mais aparece fora de aspas na primeira linha. */
export function detectarDelimitador(texto: string): Delimitador {
  const contagem: Record<Delimitador, number> = { ',': 0, ';': 0, '\t': 0 };
  let entreAspas = false;
  for (const c of texto) {
    if (c === '"') entreAspas = !entreAspas;
    else if (!entreAspas && (c === '\n' || c === '\r')) break;
    else if (!entreAspas && c in contagem) contagem[c as Delimitador]++;
  }
  return (Object.entries(contagem) as [Delimitador, number][]).sort((a, b) => b[1] - a[1])[0][0];
}

/** Registros do CSV, cada um com a linha física em que começa. */
function registros(texto: string, delimitador: Delimitador): { numero: number; campos: string[] }[] {
  const saida: { numero: number; campos: string[] }[] = [];
  let campos: string[] = [];
  let campo = '';
  let entreAspas = false;
  let linha = 1;
  let inicioDoRegistro = 1;

  const fecharCampo = () => {
    campos.push(campo);
    campo = '';
  };
  const fecharRegistro = () => {
    fecharCampo();
    saida.push({ numero: inicioDoRegistro, campos });
    campos = [];
  };

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreAspas = false;
        }
      } else {
        if (c === '\n' || (c === '\r' && texto[i + 1] !== '\n')) linha++;
        campo += c;
      }
    } else if (c === '"' && campo === '') {
      entreAspas = true;
    } else if (c === delimitador) {
      fecharCampo();
    } else if (c === '\r' || c === '\n') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fecharRegistro();
      linha++;
      inicioDoRegistro = linha;
    } else {
      campo += c;
    }
  }
  if (campo !== '' || campos.length > 0) fecharRegistro();
  return saida;
}

const vazia = (campos: string[]) => campos.every((c) => c.trim() === '');

/**
 * Cabeçalho e linhas do CSV. Não lança: o que estiver estranho vira aviso para
 * a prévia, e a decisão de importar fica com quem está vendo.
 */
export function lerCsv(texto: string): Tabela {
  const semBom = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
  const delimitador = detectarDelimitador(semBom);
  const todos = registros(semBom, delimitador).filter((r) => !vazia(r.campos));
  const avisos: string[] = [];
  if (todos.length === 0) return { cabecalho: [], linhas: [], delimitador, avisos: ['O arquivo está vazio.'] };

  const cabecalho = todos[0].campos.map((c) => c.trim());
  const vistos = new Map<string, number>();
  for (const nome of cabecalho) vistos.set(nome.toLowerCase(), (vistos.get(nome.toLowerCase()) ?? 0) + 1);
  const repetidas = [...vistos].filter(([nome, n]) => nome && n > 1).map(([nome]) => nome);
  if (repetidas.length) avisos.push(`Colunas repetidas no cabeçalho: ${repetidas.join(', ')}. Vale a primeira de cada uma.`);

  const linhas = todos.slice(1).map((r) => {
    if (r.campos.length < cabecalho.length) {
      avisos.push(`Linha ${r.numero} incompleta: ${r.campos.length} de ${cabecalho.length} colunas.`);
      return { numero: r.numero, campos: [...r.campos, ...Array(cabecalho.length - r.campos.length).fill('')] };
    }
    if (r.campos.length > cabecalho.length) avisos.push(`Linha ${r.numero} com mais colunas que o cabeçalho; as sobras foram ignoradas.`);
    return { numero: r.numero, campos: r.campos.slice(0, cabecalho.length) };
  });
  if (linhas.length === 0) avisos.push('O arquivo só tem o cabeçalho, sem nenhuma linha de dados.');
  return { cabecalho, linhas, delimitador, avisos };
}

/**
 * Célula segura para abrir em planilha. Começando por = + - @ (ou tabulação e
 * retorno), o Excel e o Google Planilhas tratam o texto como fórmula: um nome
 * de anúncio "=HYPERLINK(...)" viraria link no arquivo exportado. O apóstrofo
 * na frente faz a planilha mostrar o texto como texto.
 */
export function celulaSegura(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
}

/**
 * CSV para baixar e abrir no Excel em português: ponto e vírgula (o separador
 * de lista do Excel no Brasil), BOM para ele reconhecer o UTF-8 e quebra CRLF.
 */
export function escreverCsv(linhas: string[][]): string {
  const campo = (valor: string) => {
    const seguro = celulaSegura(valor ?? '');
    return /[";\r\n]|^\s|\s$/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
  };
  return '﻿' + linhas.map((l) => l.map(campo).join(';')).join('\r\n') + '\r\n';
}
