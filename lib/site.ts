/**
 * Dados institucionais/legais da Lotus — fonte única de verdade.
 *
 * Antes, a linha de rodapé "© ... CRECI ... CNPJ ..." estava copiada literal
 * em ~10 componentes. Centralizar aqui evita divergência e deixa a troca dos
 * números reais num só lugar.
 *
 * CRECI e CNPJ reais informados pela Lotus em 26/08/2026. A guarda
 * isPlaceholder continua no código: se algum dia um valor voltar a ser
 * genérico, a linha legal se omite sozinha em vez de publicar número falso.
 */

export const SITE = {
  nome: 'Lotus Brokers',
  /** Razão social registrada. O campo nome acima é o fantasia, usado na interface. */
  razaoSocial: 'Lotus Brokers Negócios Imobiliários',
  /**
   * Endereço do escritório. A rua é Luiz José Sereno, nesta ordem: é o nome no
   * CEP 13212-210 (Correios) e no Perfil da Empresa no Google. Até 16/10/2026 o
   * site dizia "José Luiz", e endereço divergente entre site e perfil enfraquece
   * a ligação que o Google faz entre os dois.
   */
  endereco: 'Av. Luiz José Sereno, 655, sala 5, Jardim Ermida II, Jundiaí/SP',
  logradouro: 'Av. Luiz José Sereno, 655, sala 5',
  bairro: 'Jardim Ermida II',
  cep: '13212-210',
  /** Telefone e WhatsApp, o mesmo número em todo o site e no perfil do Google. */
  telefone: '+55 11 92614-3393',
  creciPj: 'CRECI 054615-J',
  cnpj: 'CNPJ 67.767.385/0001-98',
  regiao: 'Jundiaí · Itupeva · SP',
  ano: 2026,
} as const;

/**
 * Perfil da Empresa no Google, como a Lotus aparece no Maps (link enviado pela
 * Lotus em 16/10/2026). O ponto e o horário são os do perfil: o dado
 * estruturado do site tem de dizer o mesmo que ele.
 */
export const PERFIL_GOOGLE = {
  url: 'https://maps.google.com/?cid=17362839248987197221',
  latitude: -23.1879705,
  longitude: -46.9651952,
  horario: [
    { dias: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], abre: '09:00', fecha: '18:00' },
    { dias: ['Saturday'], abre: '09:00', fecha: '13:00' },
  ],
} as const;

/** Perfis oficiais da Lotus nas redes (os mesmos dos rodapés). */
export const REDES_SOCIAIS = [
  'https://www.instagram.com/lotusbrokers_/',
  'https://www.facebook.com/profile.php?id=61587132887416',
  'https://www.youtube.com/@LotusBrokersImobili%C3%A1ria',
  'https://www.tiktok.com/@lotusbrokers',
] as const;

/** Imagem de compartilhamento padrão, para página sem foto própria. */
export const IMAGEM_COMPARTILHAMENTO = 'https://www.lotusbrokers.com.br/home-hero-jundiai.jpg';

/** true enquanto o valor ainda é placeholder. Heurística: um número legal real
 *  não tem uma sequência de 4+ zeros seguidos; os placeholders atuais têm
 *  ("00000-J", "00.000.000/0001-00"). */
function isPlaceholder(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 0 || /0{4,}/.test(digits);
}

/**
 * Linha legal do rodapé. Monta "© ANO Nome · CRECI · CNPJ · Região",
 * omitindo CRECI/CNPJ enquanto forem placeholders — assim não vaza
 * "CRECI 00000" em produção, mas volta sozinho quando os reais entrarem.
 */
export function footerLegalLine(): string {
  const partes: string[] = [`© ${SITE.ano} ${SITE.nome}`];
  if (!isPlaceholder(SITE.creciPj)) partes.push(SITE.creciPj);
  if (!isPlaceholder(SITE.cnpj)) partes.push(SITE.cnpj);
  partes.push(SITE.regiao);
  return partes.join(' · ');
}
