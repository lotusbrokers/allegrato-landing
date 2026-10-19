import { SITE } from './site';

/**
 * Dados da página /lotus-recrutamento usados em mais de um lugar.
 *
 * As perguntas aparecem na página e no FAQPage (JSON-LD) da rota e precisam
 * ser as mesmas: o Google penaliza marcação que não corresponde ao que a
 * página mostra. Até 19/10/2026 o texto vivia duplicado no componente e na
 * page.tsx, e as duas cópias já tinham divergido. Módulo sem React: a
 * page.tsx (servidor) e o componente (navegador) importam daqui.
 */

/**
 * WhatsApp que recebe as candidaturas: o número geral da Lotus, o mesmo do
 * arquivo da página enviado em 19/10/2026. Se o recrutamento ganhar número
 * próprio, basta trocar aqui.
 */
export const WHATSAPP_RECRUTAMENTO = SITE.telefone.replace(/\D/g, '');

export function linkDoWhatsApp(texto: string): string {
  return `https://wa.me/${WHATSAPP_RECRUTAMENTO}?text=${encodeURIComponent(texto)}`;
}

export type Candidatura = {
  nome: string;
  whatsapp: string;
  email?: string;
  experiencia: string;
  area: string;
};

/**
 * Mensagem que o candidato envia pelo WhatsApp ao concluir o formulário. O
 * site não guarda a candidatura: ela chega à Lotus por essa mensagem. O
 * e-mail só entra quando foi preenchido.
 */
export function mensagemDeCandidatura(c: Candidatura): string {
  const email = c.email?.trim();
  return (
    `Olá! Meu nome é ${c.nome.trim()} e quero me candidatar na Lotus (${c.area}). ` +
    `${c.experiencia}. Meu WhatsApp: ${c.whatsapp.trim()}.` +
    (email ? ` Meu e-mail: ${email}.` : '')
  );
}

export const PERGUNTAS_RECRUTAMENTO: { pergunta: string; resposta: string }[] = [
  {
    pergunta: 'Preciso ter experiência?',
    resposta:
      'Não. A Lotus forma corretores do zero, com treinamento completo e mentoria. Quem já tem experiência acelera ainda mais com a nossa estrutura.',
  },
  {
    pergunta: 'Preciso de CRECI?',
    resposta:
      'Para atuar como corretor, sim — e a gente te orienta em todo o processo, inclusive se você ainda vai tirar o seu.',
  },
  {
    pergunta: 'Atende quais cidades?',
    resposta:
      'Jundiaí e Itupeva, com especialistas por bairro e um portfólio forte de lançamentos e usados da região.',
  },
  {
    pergunta: 'Só tem vaga para corretor?',
    resposta:
      'Não. Também abrimos vagas para administrativo, financeiro e marketing — selecione a área no formulário.',
  },
];
