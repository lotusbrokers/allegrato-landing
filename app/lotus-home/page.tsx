import { permanentRedirect } from 'next/navigation';

/**
 * /lotus-home — o endereço antigo da home.
 *
 * A home passou a ser a raiz do site em 28/09/2026: www.lotusbrokers.com.br,
 * sem sufixo. Esta rota fica de pé porque /lotus-home esteve no ar desde o
 * início, está no sitemap, pode estar indexada e certamente está em link
 * salvo, anúncio e assinatura de e-mail — sumir com ela devolveria 404 a quem
 * já tinha o endereço.
 *
 * 308 e não 307: a mudança é definitiva, e é isso que o Google precisa ouvir
 * para transferir a autoridade da URL antiga para a nova em vez de manter as
 * duas na fila.
 */
export default function LotusHomeRedirect() {
  permanentRedirect('/');
}
