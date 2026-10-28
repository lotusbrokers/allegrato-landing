/**
 * Integração com a Meta Marketing API: planejada para a segunda fase, sem
 * nenhuma chamada nesta.
 *
 * A importação por CSV já entrega o que o resto da ferramenta usa: linhas com
 * os campos de lib/utm/colunas.ts. A integração futura é só outra fonte dessas
 * linhas (a interface abaixo). Prévia, elegibilidade, auditoria e gravação
 * continuam as mesmas, e o CSV continua funcionando se a API nunca for ligada.
 *
 * Quando a fase começar (ver docs/utm-manager.md):
 *  - app na Meta for Developers, com revisão para ads_read se o acesso for de
 *    terceiros; token de usuário do sistema do Business Manager, só no
 *    servidor (variável de ambiente), nunca no navegador nem no log;
 *  - leitura de campaigns, adsets e ads com effective_status e configured
 *    status, e de creative{url_tags, object_story_spec} para os parâmetros;
 *  - respeitar o limite de chamadas (cabeçalho x-business-use-case-usage) e
 *    a versão da API, registrando erro de API no histórico.
 * Sem raspagem do Gerenciador de Anúncios e sem pedir senha pessoal da Meta.
 */
import type { LinhaMapeada } from './colunas';

/** Uma fonte de registros ativos do Meta Ads. O CSV é a única implementada. */
export interface FonteDeCampanhas {
  nome: string;
  /** Linhas no mesmo formato da importação por CSV. */
  lerAtivas(): Promise<LinhaMapeada[]>;
}

/** O que a tela mostra sobre a integração. Não há botão de sincronizar enquanto não houver integração. */
export const META_API = {
  configurada: false,
  situacao: 'Não configurada',
  explicacao:
    'A leitura automática das campanhas pela Meta Marketing API está planejada para a segunda fase. Até lá, a importação é pelo CSV exportado do Gerenciador de Anúncios.',
} as const;
