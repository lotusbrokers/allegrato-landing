/**
 * Links que o corretor manda para o cliente.
 *
 * O que se compartilha é sempre a página PÚBLICA do site (landing do
 * lançamento, anúncio do imóvel, página da construtora), nunca a URL da Área do
 * Corretor: o cliente não tem login, e a página pública já é a que o Google
 * indexa e que a Lotus mantém em dia. Material do Google Drive é compartilhado
 * pelo link do próprio Drive, e quem abre depende da permissão definida lá.
 */
import { DOMINIO_OFICIAL } from '../indexacao.mjs';

/** URL absoluta no domínio oficial a partir de um caminho do site ("/lotus-imovel/123"). */
export function urlPublica(caminho: string): string {
  return new URL(caminho, DOMINIO_OFICIAL).toString();
}

/**
 * Com o código do corretor logado, o link leva `?c=`: quem chegar por ele à
 * Lia chega identificado como cliente desse corretor (ver lib/corretor-do-link).
 */
export function linkDoImovel(codigo: string, codigoDoCorretor?: string | null): string {
  const url = new URL(`/lotus-imovel/${encodeURIComponent(codigo)}`, DOMINIO_OFICIAL);
  if (codigoDoCorretor) url.searchParams.set('c', codigoDoCorretor);
  return url.toString();
}

export function linkDaConstrutora(slug: string): string {
  return urlPublica(`/construtoras/${encodeURIComponent(slug)}`);
}

/**
 * Lançamento: a landing própria quando existe; sem landing, a vitrine de
 * lançamentos — melhor do que mandar o cliente para uma página vazia.
 */
export function linkDoLancamento(href: string | null): string {
  return urlPublica(href ?? '/lotus-lancamentos');
}

/** wa.me sem número abre o WhatsApp para o corretor escolher o contato. */
export function linkWhatsApp(texto: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${texto}\n${url}`)}`;
}
