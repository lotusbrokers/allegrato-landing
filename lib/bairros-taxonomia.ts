/**
 * Pertencimento: sub-bairro / loteamento / condomínio -> bairro do guia.
 *
 * O cadastro do imóvel tem um campo `bairro` só, e nele a equipe grava o nível
 * mais específico: "Jardim Ermida II", "Vila Sereno", "Jardim Messina". Os
 * guias de /lotus-bairro, por sua vez, falam do nível acima: "Eloy Chaves".
 *
 * Sem uma ponte entre os dois, a busca por bairro exato não encontra nada:
 * nenhum dos imóveis cadastrados tem `bairro = "Eloy Chaves"`, então o guia de
 * Eloy Chaves mostrava zero imóveis e a página do imóvel não tinha guia para
 * apontar. Não era falta de estoque; era taxonomia.
 *
 * Este mapa é a ponte, e cobre só quem é de fato sub-bairro: só entra pertencimento que
 * dá para confirmar, não chute geográfico (ver os comentários de cada linha). Os demais nomes que aparecem no cadastro
 * são bairros de verdade, e não sub-bairros: ver a nota no fim
 * do arquivo.
 *
 * Quando o dashboard ganhar um campo próprio de sub-bairro, este mapa vira
 * fallback: a leitura passa a preferir o dado cadastrado e só cai aqui para os
 * registros antigos. A assinatura das funções não muda.
 */

/**
 * sub-bairro (como vem no cadastro, sem acento e em minúsculas) -> bairro do
 * guia (nome em lib/bairros.ts).
 *
 * Bonfiglioli, Jardim Bonfiglioli e Vianelo entraram em 16/10/2026: o próprio
 * guia diz que o Vianelo Bonfiglioli é "formado pela união entre o Vianelo e o
 * Jardim Bonfiglioli", e o cadastro grava só uma das partes (o Santorini está
 * como "Bonfiglioli"). Recanto IV Centenário é o outro nome do Recanto Quarto
 * Centenário, como responde o FAQ do guia.
 */
const PERTENCE_A: Record<string, string> = {
  // Jardim Ermida I e II contavam para o Eloy Chaves até 13/11/2026. Desde
  // então são do guia próprio do Jardim Ermida (lib/bairros.ts): a auditoria
  // do site pediu, em 28/10 e em 13/11, que o guia do Eloy Chaves mostre só os
  // imóveis do bairro, e o texto do Jardim Ermida o trata como bairro vizinho.
  // O Vila Sereno continua no Eloy Chaves, como dizem os títulos de AP676/AP677.
  'jardim ermida i': 'Jardim Ermida',
  'jardim ermida ii': 'Jardim Ermida',
  'vila sereno': 'Eloy Chaves',
  // Nome completo do bairro, como o próprio guia abre ("o Parque Residencial
  // Eloy Chaves"). 4 condomínios gravados assim ficavam sem link para o guia
  // (medido em 12/11/2026).
  'parque residencial eloy chaves': 'Eloy Chaves',
  bonfiglioli: 'Vianelo Bonfiglioli',
  'jardim bonfiglioli': 'Vianelo Bonfiglioli',
  vianelo: 'Vianelo Bonfiglioli',
  'recanto iv centenario': 'Recanto Quarto Centenário',
};

const chave = (s: string) =>
  s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Bairro do guia a que este endereço pertence, ou null.
 *
 * Um bairro que JÁ é nível de guia responde por si mesmo: "Eloy Chaves" ->
 * "Eloy Chaves". Assim quem chamar não precisa saber em que nível está.
 */
export function bairroDoGuia(bairroDoImovel: string | null | undefined, nomesDeGuia: string[]): string | null {
  const k = chave(bairroDoImovel || '');
  if (!k) return null;
  const proprio = nomesDeGuia.find((n) => chave(n) === k);
  if (proprio) return proprio;
  const pai = PERTENCE_A[k];
  return pai && nomesDeGuia.some((n) => chave(n) === chave(pai)) ? pai : null;
}

/**
 * Todos os nomes que um guia deve procurar no cadastro: ele mesmo e os
 * sub-bairros que pertencem a ele. É o que faz o guia do Jardim Ermida somar os
 * imóveis de Jardim Ermida I e II.
 */
export function nomesDoBairro(bairroDoGuiaNome: string): string[] {
  const k = chave(bairroDoGuiaNome);
  const filhos = Object.entries(PERTENCE_A)
    .filter(([, pai]) => chave(pai) === k)
    .map(([sub]) => sub);
  return [bairroDoGuiaNome, ...filhos];
}

/**
 * O imóvel entra no guia? Entra se o bairro dele é o do guia ou um sub-bairro
 * do guia, na mesma cidade. Um critério só para a lista do guia
 * (getImoveisPorBairro) e para as contagens da home e de /lotus-bairro, para o
 * número do cartão bater com o que a página mostra.
 *
 * Até 13/11/2026 a comparação era só em minúsculas: "Recanto IV Centenário",
 * com acento, não casava com a chave sem acento do mapa. Também não olhava a
 * cidade, e o guia "Centro" (o de Itupeva) recebia o Centro de Jundiaí. Imóvel
 * sem cidade no cadastro ainda entra pelo bairro, como antes.
 */
export function imovelDoGuia(
  imovel: { neighborhood: string; city: string },
  guia: { nome: string; cidade: string },
): boolean {
  if (imovel.city && chave(imovel.city) !== chave(guia.cidade)) return false;
  const k = chave(imovel.neighborhood);
  return k !== '' && nomesDoBairro(guia.nome).some((n) => chave(n) === k);
}

/** Sub-bairros conhecidos, para diagnóstico e para o teste. */
export function subBairrosConhecidos(): Record<string, string> {
  return { ...PERTENCE_A };
}

/*
 * NÃO mapeie Jardim Messina, Jardim Pacaembu, Vila Rio Branco nem Jardim
 * Colonial aqui dentro.
 *
 * A Lotus confirmou em 26/08/2026 que os quatro são de NÍVEL DE BAIRRO, e em
 * 27/08/2026 eles ganharam guia próprio em lib/bairros.ts. A ausência deles no
 * mapa acima é decisão, não esquecimento: quem vir "Jardim Ermida II ->
 * Eloy Chaves" e quiser dar um pai a todo bairro pequeno acabaria escondendo
 * quatro guias legítimos dentro de outro.
 *
 * Antes havia aqui uma constante BAIRROS_SEM_GUIA_AINDA listando os quatro.
 * Saiu quando os guias entraram: o nome passou a mentir, ninguém a importava, e
 * o fato que ela guardava está dito nestas linhas.
 */
