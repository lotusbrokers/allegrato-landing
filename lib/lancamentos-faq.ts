/**
 * Perguntas frequentes de /lotus-lancamentos.
 *
 * Mesma separação de lib/home-faq.ts: a seção desenha esta lista e a rota
 * monta o FAQPage dela. Até 28/10/2026 o FAQPage era uma cópia antiga, com
 * outras perguntas, que não apareciam na página.
 */
import type { PerguntaFrequente } from './home-faq';

export const FAQ_LANCAMENTOS: PerguntaFrequente[] = [
  { q: 'Por que comprar na planta?', a: 'Porque pode oferecer condições comerciais diferenciadas, maior variedade de unidades e potencial de valorização ao longo da obra. Esses benefícios variam conforme o empreendimento e precisam ser analisados caso a caso.' },
  { q: 'É seguro comprar na planta?', a: 'Sim, desde que a construtora seja sólida e o registro de incorporação esteja em ordem. A Lotus avalia o histórico da construtora e a documentação antes de recomendar.' },
  { q: 'Quanto preciso de entrada?', a: 'Varia por empreendimento, mas em geral a entrada é parcelada durante a obra, o que dilui bastante o esforço inicial frente a um imóvel pronto.' },
  { q: 'Posso financiar um lançamento?', a: 'Sim. Durante a obra você paga direto à construtora e, na entrega (ou perto dela), pode financiar o saldo pelo banco. A Lotus acompanha a simulação.' },
];
