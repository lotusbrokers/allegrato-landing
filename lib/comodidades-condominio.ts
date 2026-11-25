/**
 * Comodidades do condomínio (lazer e estrutura), lidas das colunas infra_* da
 * Dashboard. Módulo puro: a página do condomínio (componente cliente) e a
 * descrição de busca (lib/metadados-condominio.ts) usam a mesma lista.
 */
import type { CondominioRow } from './condominios';

/** Coluna infra_* -> rótulo legível. Só entra na lista quando a coluna é true. */
const ROTULOS: Record<`infra_${string}`, string> = {
  infra_piscina: 'Piscina',
  infra_academia: 'Academia',
  infra_playground: 'Playground',
  infra_salao_festas: 'Salão de festas',
  infra_churrasqueira: 'Churrasqueira',
  infra_quadra_poliesportiva: 'Quadra poliesportiva',
  infra_portaria_24h: 'Portaria 24h',
  infra_espaco_gourmet: 'Espaço gourmet',
  infra_brinquedoteca: 'Brinquedoteca',
  infra_sauna_seca: 'Sauna',
  infra_salao_jogos: 'Salão de jogos',
  infra_bicicletario: 'Bicicletário',
  infra_espaco_pet: 'Espaço pet',
  infra_wifi: 'Wi-Fi nas áreas comuns',
};

/**
 * Ordem da descrição de busca: o que mais pesa para quem compra vem primeiro,
 * porque só cabem duas ou três. Bicicletário e Wi-Fi ficam de fora dela.
 */
const PREFERENCIA_NA_BUSCA: `infra_${string}`[] = [
  'infra_portaria_24h',
  'infra_piscina',
  'infra_academia',
  'infra_espaco_gourmet',
  'infra_salao_festas',
  'infra_quadra_poliesportiva',
  'infra_playground',
  'infra_churrasqueira',
  'infra_brinquedoteca',
  'infra_sauna_seca',
  'infra_salao_jogos',
  'infra_espaco_pet',
];

type ComInfra = Pick<CondominioRow, `infra_${string}`>;

/** Comodidades marcadas na Dashboard, na ordem em que a página as mostra. */
export function comodidadesDoCondominio(data: ComInfra): string[] {
  return Object.entries(ROTULOS)
    .filter(([coluna]) => data[coluna as `infra_${string}`] === true)
    .map(([, rotulo]) => rotulo);
}

/** As mesmas comodidades, na ordem de preferência da descrição de busca. */
export function comodidadesParaABusca(data: ComInfra): string[] {
  return PREFERENCIA_NA_BUSCA.filter((coluna) => data[coluna] === true).map((coluna) => ROTULOS[coluna]);
}
