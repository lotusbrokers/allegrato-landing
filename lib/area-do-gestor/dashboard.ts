/**
 * Atalhos da Área do Gestor para os módulos da Dashboard (OctoDash), pedido da
 * Lotus em 19/10/2026. A área não repete o que a Dashboard faz: leva até lá.
 *
 * Rotas e descrições copiadas do menu da própria Dashboard em 19/10/2026 (a
 * configuração do menu lateral, no código publicado dela). A Dashboard decide o
 * que cada pessoa vê pelo cargo; o atalho só abre a tela. Se ela mudar uma rota,
 * o atalho cai na página inicial dela: conferir o menu e atualizar aqui.
 */
import { URL_DASHBOARD } from '../area-do-corretor/secoes';

/** Ícones de components/area-do-corretor/Icone.tsx usados nos grupos. */
export type IconeDoGrupo = 'painel' | 'casa' | 'megafone' | 'documento' | 'estrela' | 'whatsapp' | 'ferramenta';

export type ModuloDaDashboard = { titulo: string; resumo: string; rota: string };
export type GrupoDaDashboard = { titulo: string; icone: IconeDoGrupo; modulos: ModuloDaDashboard[] };

export const MODULOS_DA_DASHBOARD: GrupoDaDashboard[] = [
  {
    titulo: 'Comercial',
    icone: 'painel',
    modulos: [
      { titulo: 'Comercial', resumo: 'Os leads, o bolsão, o funil de interessado, a comissão e o simulador.', rota: '/metricas/cliente-interessado' },
      { titulo: 'Bolsão', resumo: 'Leads disponíveis, sem dono, equipes e distribuição.', rota: '/bolsao' },
      { titulo: 'Comissionamento', resumo: 'As comissões da equipe.', rota: '/metricas/comissionamento' },
      { titulo: 'Conferência de vendas', resumo: 'As vendas para conferir.', rota: '/comercial/vendas' },
      { titulo: 'Metas', resumo: 'As metas comerciais da operação e os desafios.', rota: '/metas' },
      { titulo: 'Simulador de pagamento', resumo: 'Condições de pagamento para o cliente.', rota: '/ferramentas/simulador' },
    ],
  },
  {
    titulo: 'Imóveis e captação',
    icone: 'casa',
    modulos: [
      { titulo: 'Captação', resumo: 'O radar de anúncios de dono direto, o funil de proprietários e o estudo de mercado.', rota: '/captacao' },
      { titulo: 'Imóveis', resumo: 'O catálogo, os lançamentos, as construtoras e o mapa.', rota: '/imoveis' },
      { titulo: 'Imóveis para aprovar', resumo: 'Os cadastros esperando aprovação.', rota: '/imoveis?tab=catalogo&ver=aprovar' },
    ],
  },
  {
    titulo: 'Marketing',
    icone: 'megafone',
    modulos: [
      { titulo: 'Marketing', resumo: 'As campanhas, as demandas, o estúdio, o calendário e o DNA da marca.', rota: '/marketing/hoje' },
      { titulo: 'Comunicação', resumo: 'Disparos, públicos, templates e campanhas.', rota: '/comunicacao/disparador' },
      { titulo: 'Agentes de IA', resumo: 'O Caio, de marketing, e a Elaine, comportamental.', rota: '/agentes-ia/agente-marketing' },
    ],
  },
  {
    titulo: 'Financeiro',
    icone: 'documento',
    modulos: [
      { titulo: 'Financeiro', resumo: 'A receber, a pagar, fluxo de caixa, DRE, conciliação e notas.', rota: '/financeiro' },
      { titulo: 'Pagamentos para aprovar', resumo: 'Os pagamentos esperando aprovação.', rota: '/financeiro/aprovar' },
    ],
  },
  {
    titulo: 'Equipe',
    icone: 'estrela',
    modulos: [
      { titulo: 'Gestão de Equipe', resumo: 'Quem está no time, as equipes e as tarefas.', rota: '/gestao-equipe' },
      { titulo: 'Recrutamento', resumo: 'Quem está entrando: os candidatos e o processo.', rota: '/recrutamento/geral' },
      { titulo: 'Materiais de estudo', resumo: 'Os cursos, a trilha e os materiais de estudo da casa.', rota: '/materiais' },
      { titulo: 'Reuniões', resumo: 'As atas das reuniões e as tarefas que saíram delas.', rota: '/reunioes' },
    ],
  },
  {
    titulo: 'Lia',
    icone: 'whatsapp',
    modulos: [
      { titulo: 'WhatsApp', resumo: 'As conversas de WhatsApp com os clientes.', rota: '/chat' },
      { titulo: 'Plantão da Lia', resumo: 'Os chamados que a Lia passou para a equipe.', rota: '/agentes-ia/plantao' },
      { titulo: 'Relatórios da Lia', resumo: 'Quem ela atendeu, passou e por quê, e quanto custou.', rota: '/agentes-ia/relatorios' },
    ],
  },
  {
    titulo: 'Jurídico',
    icone: 'documento',
    modulos: [
      { titulo: 'Jurídico', resumo: 'As propostas e os contratos do corretor.', rota: '/juridico/visao-geral' },
      { titulo: 'Termos para aprovar', resumo: 'Os termos esperando aprovação.', rota: '/juridico/termos' },
    ],
  },
  {
    titulo: 'Sistema',
    icone: 'ferramenta',
    modulos: [
      { titulo: 'Relatórios', resumo: 'Leads, imóveis, vendas, equipe e marketing.', rota: '/relatorios' },
      { titulo: 'Integrações', resumo: 'As conexões com portais, formulários e outros sistemas.', rota: '/integracoes' },
      { titulo: 'Configurações', resumo: 'O perfil, a aparência e as configurações da casa.', rota: '/configuracoes' },
    ],
  },
];

/** Endereço de uma tela da Dashboard. */
export function linkDaDashboard(rota: string, base: string = URL_DASHBOARD): string {
  return `${base.replace(/\/+$/, '')}${rota}`;
}
