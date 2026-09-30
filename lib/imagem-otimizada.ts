/**
 * Fotos via o otimizador de imagens do Next (/_next/image): converte para
 * WebP/AVIF conforme o navegador aceita, redimensiona para a largura pedida e
 * comprime — com cache no servidor. É o caminho para as fotos do feed (Storage
 * e serviço de marca d'água), que chegam como JPEG de 1280px e ~150 KB cada,
 * e para os arquivos de public/ pesados demais (um PNG de 3 MB na home).
 *
 * Só entra o que o otimizador aceita: caminhos de public/ e os hosts liberados
 * em `images.remotePatterns` (next.config.mjs). Qualquer outra URL volta como
 * veio — um host fora da lista responderia 400.
 *
 * Módulo sem dependências, para o teste importar a função pura.
 */

/** Espelha `images.remotePatterns` de next.config.mjs. */
const HOSTS_LIBERADOS = [
  'octodash-octo-dash.fltgo5.easypanel.host',
  'glbtwvusiaaovllxhiig.supabase.co',
  'i.postimg.cc',
  'vvcconstrutora.com.br',
];

/** Larguras dos `deviceSizes` padrão do Next — só essas o otimizador aceita. */
export const LARGURAS_PADRAO = [640, 1080, 1920];
const QUALIDADE_PADRAO = 72;

export function otimizavel(src: string | null | undefined): boolean {
  if (!src || src.startsWith('data:') || /\.(svg|gif)(\?|#|$)/i.test(src)) return false;
  if (src.startsWith('/')) return !src.startsWith('//') && !src.startsWith('/_next/');
  try {
    return HOSTS_LIBERADOS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}

/**
 * `src` (a variante de 1080px, para navegador sem srcset) e `srcSet` com as
 * larguras pedidas. Sem `srcSet` quando a imagem não passa pelo otimizador.
 */
export function imagemOtimizada(
  src: string,
  larguras: number[] = LARGURAS_PADRAO,
  qualidade: number = QUALIDADE_PADRAO,
): { src: string; srcSet?: string } {
  if (!otimizavel(src)) return { src };
  const url = (w: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${qualidade}`;
  const padrao = larguras.includes(1080) ? 1080 : larguras[larguras.length - 1];
  return { src: url(padrao), srcSet: larguras.map((w) => `${url(w)} ${w}w`).join(', ') };
}
