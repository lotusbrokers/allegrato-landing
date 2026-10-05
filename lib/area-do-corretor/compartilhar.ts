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

export function linkDoImovel(codigo: string): string {
  return urlPublica(`/lotus-imovel/${encodeURIComponent(codigo)}`);
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
