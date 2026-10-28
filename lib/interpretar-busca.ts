/**
 * Busca por texto de /lotus-busca: o que a pessoa escreve vira filtro.
 *
 * Atende o botão "Buscar" da página e a aba "Descrever o que procuro" da home,
 * que chega como ?q=. Até 28/10/2026 a leitura do texto morava no componente e
 * errava em três pontos, todos conferidos no site publicado:
 *
 *   - "apartamento até 500 mil" trazia todos os apartamentos. A regra de
 *     milhão aceitava o "mi" de "mil", e o teto virava R$ 500 milhões.
 *   - Os lugares vinham de uma lista fixa de 11 nomes. Fora dela (Engordadouro,
 *     Louveira, a própria Jundiaí) o lugar era ignorado e a busca trazia o tipo
 *     pedido na região inteira. "Serra do Japi" virava o filtro "serra", que
 *     não está em bairro nenhum: o exemplo escrito na caixa de busca não achava
 *     nada.
 *   - Texto sem tipo, quarto, preço ou lugar, como o nome de um condomínio,
 *     apagava os filtros e mostrava o acervo inteiro, como se o botão não
 *     tivesse feito nada.
 *
 * Agora os lugares vêm do acervo e dos guias de bairro, e o texto que não vira
 * filtro nenhum é procurado nos anúncios. A Serra do Japi é região, não bairro,
 * e não vira filtro: ligá-la a bairros seria afirmar uma geografia que o
 * cadastro não tem.
 *
 * Módulo sem dependências, para o teste importar sem arrastar o banco.
 */

export type FiltroDaBusca =
  | { kind: 'type'; val: string; label: string }
  | { kind: 'loc'; val: string; label: string }
  | { kind: 'beds'; val: number; label: string }
  | { kind: 'priceMin'; val: number; label: string }
  | { kind: 'priceMax'; val: number; label: string }
  | { kind: 'texto'; val: string; label: string };

/** Nomes que a busca reconhece como lugar. */
export type LugaresDaBusca = {
  /** Bairros do acervo e dos guias de /lotus-bairro. */
  bairros: readonly string[];
  /** Cidades do acervo. */
  cidades: readonly string[];
};

/** O que um imóvel precisa expor para passar pelos filtros. */
export type ImovelDaBusca = {
  codigo: string;
  type: string;
  neighborhood: string;
  city: string;
  beds: number;
  priceNum: number;
  desc: string;
};

/**
 * Lugares reconhecidos mesmo sem imóvel cadastrado neles: os bairros da lista
 * fixa anterior que não têm guia (os que têm chegam pelos guias) e as cidades
 * do seletor da home. Sem eles, "casa em Valinhos" ignoraria a cidade e
 * mostraria as casas da região inteira como se fossem de lá. Com eles, a busca
 * volta vazia, que é a resposta verdadeira, e a página oferece a caça pelo
 * especialista.
 */
const LUGARES_FIXOS: LugaresDaBusca = {
  bairros: ['Anhangabaú', 'Malota', 'Reserva da Serra'],
  cidades: ['Jundiaí', 'Itupeva', 'Vinhedo', 'Valinhos', 'Cabreúva'],
};

/**
 * Palavra -> tipo como o cadastro grava. A ordem decide o empate: em "casa ou
 * apartamento" vale casa, como já valia.
 */
const TIPOS: ReadonlyArray<[RegExp, string]> = [
  [/\bcasas?\b/, 'Casa'],
  [/\bsobrados?\b/, 'Sobrado'],
  [/\b(apart\w*|aptos?|apes?)\b/, 'Apartamento'],
  [/\bcoberturas?\b/, 'Cobertura'],
  [/\b(terrenos?|lotes?)\b/, 'Terreno'],
  [/\b(comercia(l|is)|salas?|lojas?)\b/, 'Comercial'],
];

const POR_EXTENSO: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5 };
const QUARTOS = /\b(\d+|um|uma|dois|duas|tres|quatro|cinco)\s*(suites?|dorm\w*|quartos?)\b/g;

/**
 * Valor com unidade ("500 mil", "2,5 mi", "800k") ou com "R$". O "\b" depois
 * da unidade é o que separa "mi" de "mil". Número solto fica de fora: é quarto,
 * metragem ou andar.
 */
const VALOR = /(r\$\s*)?\b(\d+(?:[.,]\d+)*)\s*(milhoes|milhao|mi|mil|k)?\b/g;
const MULTIPLICADOR: Record<string, number> = { milhoes: 1e6, milhao: 1e6, mi: 1e6, mil: 1e3, k: 1e3 };
/** O que vem antes de um valor que é piso, e não teto. Sem nada disso, é teto. */
const PISO = /(acima de|a partir de|mais de|minimo de|no minimo|pelo menos|maior que|superior a)\s*(r\$)?\s*$/;

const PREFIXOS = new Set(['jardim', 'parque', 'vila', 'chacara', 'residencial', 'recanto', 'conjunto', 'nucleo', 'loteamento', 'condominio']);
const ARTIGOS = new Set(['de', 'do', 'da', 'dos', 'das']);
const ROMANOS = new Set(['i', 'ii', 'iii', 'iv', 'v']);

/** Minúsculas e sem acento: "Jundiaí" e "jundiai" são a mesma busca. */
function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Só letras e números, para comparar palavra com palavra ("Jundiaí," = "jundiai"). */
function palavras(texto: string): string {
  return semAcento(texto).replace(/[^a-z0-9]+/g, ' ').trim();
}

/** "1.500.000,00" -> 1500000; "2,5" e "2.5" -> 2.5. Ponto só é milhar quando separa grupos de três. */
function numeroBr(texto: string): number {
  const milhar = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(texto);
  return Number.parseFloat(milhar ? texto.replace(/\./g, '').replace(',', '.') : texto.replace(',', '.'));
}

/** Rótulo curto de valor, como o seletor de preço escreve: "R$ 500 mil", "R$ 2,5 mi". */
export function rotuloDeValor(valor: number): string {
  const decimal = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
  if (valor >= 1e6) return `R$ ${decimal(valor / 1e6)} mi`;
  if (valor >= 1e3) return `R$ ${decimal(valor / 1e3)} mil`;
  return `R$ ${decimal(valor)}`;
}

/**
 * O nome sem o genérico, como as pessoas escrevem o bairro:
 * "Parque Residencial Eloy Chaves" -> "Eloy Chaves", "Jardim Ermida II" -> "Ermida".
 */
function nomeCurto(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  let inicio = 0;
  let fim = partes.length;
  while (inicio < fim && PREFIXOS.has(palavras(partes[inicio]))) inicio++;
  while (inicio < fim && ARTIGOS.has(palavras(partes[inicio]))) inicio++;
  while (fim > inicio && ROMANOS.has(palavras(partes[fim - 1]))) fim--;
  return partes.slice(inicio, fim).join(' ');
}

type Lugar = { chave: string; nome: string; bairro: boolean };

function lugaresConhecidos(lugares: LugaresDaBusca): Lugar[] {
  const lista: Lugar[] = [];
  const incluir = (nome: string, bairro: boolean) => {
    const limpo = nome?.trim();
    if (!limpo) return;
    lista.push({ chave: palavras(limpo), nome: limpo, bairro });
    const curto = nomeCurto(limpo);
    // Nome curto demais casaria com palavra comum da frase.
    if (curto !== limpo && palavras(curto).length >= 5) lista.push({ chave: palavras(curto), nome: curto, bairro });
  };
  for (const b of [...LUGARES_FIXOS.bairros, ...lugares.bairros]) incluir(b, true);
  for (const c of [...LUGARES_FIXOS.cidades, ...lugares.cidades]) incluir(c, false);
  return lista;
}

/** Os filtros que o texto pede, na ordem em que viram etiqueta na tela. */
export function interpretarBusca(texto: string, lugares: LugaresDaBusca): FiltroDaBusca[] {
  const frase = palavras(texto);
  if (!frase) return [];
  const filtros: FiltroDaBusca[] = [];

  let quartos = 0;
  for (const m of frase.matchAll(QUARTOS)) quartos = Math.max(quartos, POR_EXTENSO[m[1]] ?? Number.parseInt(m[1], 10));
  if (quartos > 0) filtros.push({ kind: 'beds', val: quartos, label: `${quartos}+ dorm.` });

  // Os valores saem do texto com pontuação: é nela que estão "2,5" e "1.500.000".
  const bruto = semAcento(texto);
  const valores: { valor: number; antes: string }[] = [];
  for (const m of bruto.matchAll(VALOR)) {
    const [, real, numero, unidade] = m;
    if (!unidade && !real) continue;
    const valor = Math.round(numeroBr(numero) * (unidade ? MULTIPLICADOR[unidade] : 1));
    if (valor > 0) valores.push({ valor, antes: bruto.slice(0, m.index) });
  }
  const distintos = [...new Set(valores.map((v) => v.valor))].sort((a, b) => a - b);
  const piso = (v: number): FiltroDaBusca => ({ kind: 'priceMin', val: v, label: `a partir de ${rotuloDeValor(v)}` });
  const teto = (v: number): FiltroDaBusca => ({ kind: 'priceMax', val: v, label: `até ${rotuloDeValor(v)}` });
  // Dois valores na mesma frase são uma faixa: "entre 500 mil e 1 milhão".
  if (distintos.length >= 2) filtros.push(piso(distintos[0]), teto(distintos[distintos.length - 1]));
  else if (valores.length > 0) filtros.push(PISO.test(valores[0].antes) ? piso(valores[0].valor) : teto(valores[0].valor));

  // Bairro vale mais que cidade (é o recorte mais fino), e o nome mais longo
  // mais que o curto: "Chácara Malota" antes de "Malota".
  const lugar = lugaresConhecidos(lugares)
    .filter((l) => ` ${frase} `.includes(` ${l.chave} `))
    .sort((a, b) => Number(b.bairro) - Number(a.bairro) || b.chave.length - a.chave.length)[0];
  if (lugar) filtros.push({ kind: 'loc', val: lugar.nome.toLowerCase(), label: lugar.nome });

  const tipo = TIPOS.find(([padrao]) => padrao.test(frase));
  if (tipo) filtros.push({ kind: 'type', val: tipo[1], label: tipo[1] });

  // Nada reconhecido: o texto é procurado nos anúncios (nome de condomínio,
  // código do imóvel...), em vez de devolver o acervo inteiro.
  if (filtros.length === 0) filtros.push({ kind: 'texto', val: texto.trim(), label: `“${texto.trim()}”` });
  return filtros;
}

/** O imóvel atende a todos os filtros? (E, não OU.) */
export function passaNaBusca(imovel: ImovelDaBusca, filtros: readonly FiltroDaBusca[]): boolean {
  return filtros.every((f) => {
    switch (f.kind) {
      case 'type':
        return palavras(imovel.type) === palavras(f.val);
      case 'loc':
        return ` ${palavras(`${imovel.neighborhood} ${imovel.city}`)} `.includes(` ${palavras(f.val)} `);
      case 'beds':
        return imovel.beds >= f.val;
      case 'priceMin':
        return imovel.priceNum >= f.val;
      // Sem preço cadastrado o imóvel não entra em faixa nenhuma. Antes ele
      // entrava em todas, porque 0 é menor que qualquer teto.
      case 'priceMax':
        return imovel.priceNum > 0 && imovel.priceNum <= f.val;
      case 'texto': {
        const anuncio = palavras(`${imovel.codigo} ${imovel.type} ${imovel.neighborhood} ${imovel.city} ${imovel.desc}`);
        return palavras(f.val).split(' ').every((termo) => anuncio.includes(termo));
      }
    }
  });
}
