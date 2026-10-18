/**
 * O código do corretor que mandou o link do imóvel: `/lotus-imovel/AP677?c=k7m2qx`.
 *
 * A Dash acrescenta `?c=` ao link que o corretor copia ou envia. O site só
 * carrega esse código até a Lia, dentro do texto do WhatsApp e do `message` dos
 * formulários, com o marcador fixo "código do corretor: <c>", que é o que a Lia
 * procura. Quem resolve o código para um corretor é o banco da Dash
 * (`leads.codigo_do_link`, migration 20261146), não o site.
 *
 * O código é lido no navegador, nunca no servidor: ler `searchParams` na rota
 * tiraria a página do imóvel do cache (ISR). E fica no sessionStorage, não em
 * cookie nem localStorage: identifica o corretor, não o visitante, e acaba com
 * a aba.
 */

/** 6 caracteres sem 0/o/1/l/i: a mesma regra do CHECK de `tenant_memberships.codigo_link`. */
const FORMATO = /^[a-hjkmnp-z2-9]{6}$/;

export const CHAVE_DO_CODIGO = 'lotus:codigo-do-corretor';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** O `c` da query string, em minúsculas e no formato do banco; fora dele, null. */
export function codigoDaUrl(search: string): string | null {
  const c = new URLSearchParams(search).get('c')?.trim().toLowerCase() ?? '';
  return FORMATO.test(c) ? c : null;
}

/**
 * Código da URL, guardado para a aba; sem código válido na URL, o guardado.
 * Assim a pessoa abre outro imóvel na mesma aba e o código continua.
 * Armazenamento bloqueado (modo privado, cookies desligados) nunca derruba a
 * página: fica valendo só o que está na URL.
 */
export function codigoDaVisita(search: string, storage: StorageLike | null): string | null {
  const daUrl = codigoDaUrl(search);
  try {
    if (daUrl) {
      storage?.setItem(CHAVE_DO_CODIGO, daUrl);
      return daUrl;
    }
    const guardado = storage?.getItem(CHAVE_DO_CODIGO) ?? '';
    return FORMATO.test(guardado) ? guardado : null;
  } catch {
    return daUrl;
  }
}

/** No navegador: o código desta aba. Só chamar em efeito ou evento, nunca no render. */
export function codigoDestaAba(): string | null {
  let storage: StorageLike | null = null;
  try {
    storage = window.sessionStorage;
  } catch {
    // o acesso ao sessionStorage lança quando o navegador bloqueia o armazenamento
  }
  return codigoDaVisita(window.location.search, storage);
}

/** O texto que a Lia procura. Não mudar sem combinar com ela. */
export function marcadorDoCorretor(codigo: string): string {
  return `código do corretor: ${codigo}`;
}

/**
 * Trecho do fim da mensagem do WhatsApp:
 * "… quero agendar uma visita com Mariana Mamede (código do corretor: k7m2qx)."
 * Sem o nome (view fora do ar, código de quem não está no site), vai só o código.
 */
export function trechoDoCorretor(codigo: string, nome?: string | null): string {
  const marcador = `(${marcadorDoCorretor(codigo)})`;
  return nome ? ` com ${nome} ${marcador}` : ` ${marcador}`;
}
