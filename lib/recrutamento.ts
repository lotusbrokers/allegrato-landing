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

// As quatro primeiras respondem o que procura quem busca "vaga de corretor de imóveis
// em Jundiaí" (Radar C9, 12/11/2026), com o que a página já diz: nada de número novo.
export const PERGUNTAS_RECRUTAMENTO: { pergunta: string; resposta: string }[] = [
  {
    pergunta: 'Quanto ganha um corretor na Lotus?',
    resposta:
      'A comissão vai até 60%, com tabela transparente: você sabe quanto ganha em cada negócio. As condições completas são apresentadas no processo seletivo.',
  },
  {
    pergunta: 'De onde vêm os clientes?',
    resposta:
      'Em vez de disputar lead em grupo de WhatsApp, o corretor da Lotus trabalha um bairro, com carteira, conteúdo, marketing e CRM da Lotus a favor. As regras de distribuição de contatos são explicadas no processo seletivo.',
  },
  {
    pergunta: 'Como é o treinamento?',
    resposta:
      'Uma imersão com produto, bairro, processo e as ferramentas da Lotus, e mentoria 1:1 até a primeira venda, que você faz acompanhado.',
  },
  {
    pergunta: 'Como me candidatar à vaga?',
    resposta:
      'Pelo formulário desta página, em 2 minutos. Um recrutador da Lotus responde pelo WhatsApp; depois vêm a conversa, a imersão e a primeira venda com mentoria.',
  },
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
