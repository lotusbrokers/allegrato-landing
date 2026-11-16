/**
 * Página própria de cada corretor: /lotus-corretores/<slug>, desde 16/11/2026.
 *
 * Até então o "Ver perfil" trocava a tela de /lotus-corretores por estado, sem
 * mudar o endereço (o mesmo que o blog fazia até 21/09/2026): para o Google não
 * havia perfil nenhum, e a auditoria do site cobrou "Perfil individual" em
 * 28/10 e em 13/11.
 *
 * O slug sai do nome, como o cadastro grava, porque o id é UUID do Supabase e
 * não serve de endereço. Módulo puro: a rota, o sitemap, a listagem (que é
 * componente de cliente) e o teste importam daqui, e por isso os quatro chegam
 * ao mesmo endereço para a mesma pessoa.
 */

/**
 * Quem aparece no site: só quem tem CRECI cadastrado na Dash (regra de
 * 07/08/2026, quando todos os corretores passaram a ter número). Vale para a
 * listagem, para a página do corretor e para o sitemap.
 */
export function estaNoSite(corretor: { creci: string | null }): boolean {
  return Boolean(corretor.creci?.trim());
}

/** "Mariana  Mamede" vira "mariana-mamede"; "Gabriele Fávaro", "gabriele-favaro". */
export function slugDoNome(nome: string): string {
  return nome
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * O slug de cada corretor, por id. Dois nomes iguais (ainda não aconteceu)
 * ganham "-2", "-3"... na ordem do id, para o endereço não trocar de dono entre
 * uma geração da página e outra.
 */
export function slugsDosCorretores(corretores: readonly { id: string; name: string }[]): Record<string, string> {
  const ordenados = [...corretores].sort((a, b) => {
    const porSlug = slugDoNome(a.name).localeCompare(slugDoNome(b.name));
    return porSlug !== 0 ? porSlug : a.id.localeCompare(b.id);
  });
  const vezes = new Map<string, number>();
  const slugs: Record<string, string> = {};
  for (const c of ordenados) {
    const base = slugDoNome(c.name) || 'corretor';
    const n = (vezes.get(base) ?? 0) + 1;
    vezes.set(base, n);
    slugs[c.id] = n === 1 ? base : `${base}-${n}`;
  }
  return slugs;
}

/** Endereço da página do corretor. */
export function hrefDoCorretor(slug: string): string {
  return `/lotus-corretores/${slug}`;
}

/** "CRECI 123.456-F", como o cartão da listagem mostra; null sem número. */
export function creciEmTexto(creci: string | null): string | null {
  const c = (creci ?? '').trim();
  if (!c) return null;
  return /creci/i.test(c) ? c : `CRECI ${c}`;
}

/**
 * Meta description da página, só com o que o cadastro tem (nome, CRECI,
 * especialidade ou região, se há imóveis) e em até 160 caracteres: a parte
 * final cai antes de passar do limite.
 */
export function descricaoDoPerfil(p: { nome: string; creci: string | null; especialidade: string; temImoveis: boolean }): string {
  const nome = p.nome.trim().replace(/\s+/g, ' ');
  const creci = creciEmTexto(p.creci);
  const base = `${nome}${creci ? ` (${creci})` : ''} é especialista da Lotus Brokers em ${p.especialidade}.`;
  const formas = [
    `${base} ${p.temImoveis ? 'Veja os imóveis e fale direto pelo WhatsApp.' : 'Fale direto pelo WhatsApp.'}`,
    `${base} Fale pelo WhatsApp.`,
    base,
  ];
  return formas.find((d) => d.length <= 160) ?? base.slice(0, 159).trimEnd() + '…';
}

/**
 * `<title>` da página: a forma mais completa que cabe em 70 caracteres (a
 * régua da auditoria do site). "Especialista" e não "corretor" ou "corretora":
 * a palavra não tem gênero, e o cadastro não diz como cada um prefere.
 */
export function tituloDoPerfil(nome: string): string {
  const n = nome.trim().replace(/\s+/g, ' ');
  const formas = [
    `${n}: especialista em imóveis em Jundiaí | Lotus Brokers`,
    `${n}: especialista em imóveis | Lotus Brokers`,
    `${n} | Lotus Brokers`,
  ];
  return formas.find((t) => t.length <= 70) ?? formas[formas.length - 1];
}
