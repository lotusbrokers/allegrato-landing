import { supabase, TENANT_ID } from './supabase';
import { conteudoRealDe } from './corretores-conteudo';
import type { PessoaDoCartao } from './corretor-do-link';

// Camada de dados dos CORRETORES do Portal.
// Fonte: view pública portal_brokers = tenant_memberships (quem é corretor:
// role + tenant) JOIN user_profiles (nome/foto). Leitura anônima; a view expõe
// só id/name/photo_url — PII (email/phone) fica de fora por grant de coluna.
// Ver supabase/migrations/0002_portal_brokers_view.sql.

export type Broker = {
  id: string;
  name: string;
  photoUrl: string | null;
  creci: string | null;
  imoveisAtivos: number;
};

type BrokerRow = {
  id: string;
  name: string;
  photo_url: string | null;
  creci: string | null;
  imoveis_ativos: number;
};

/**
 * AJUSTES LOCAIS DA LISTA — paliativo, não a fonte de verdade.
 *
 * A composição da equipe é dado do dashboard (octo-dash2): quem entra e quem
 * sai deve ser alterado lá, na `tenant_memberships`. O portal só LÊ o Supabase,
 * então estes dois blocos permitem refletir uma mudança de equipe no site antes
 * do dashboard ser atualizado.
 *
 * Assim que o cadastro real for feito, ESVAZIE os dois: manter um corretor
 * inventado aqui depois de ele existir no banco produz entrada duplicada, e
 * manter alguém em OCULTOS depois de removido no banco vira código morto.
 */
// Existem no Supabase, mas não devem aparecer no site.
// No banco o Samir está cadastrado como "Samir Said" (não "Augusto").
// Alex Xavier da Silva saiu do site em 22/09/2026, a pedido da Lotus. Enquanto
// o cadastro dele existir no dashboard, é esta linha que o mantém fora; tirando
// de lá, apague-a — a foto e a bio dele continuam em LotusCorretores.
const OCULTOS = new Set(['reginaldo barbosa faleiros', 'samir said', 'alex xavier da silva']);

// A EQUIPE, ENQUANTO O BANCO NÃO RESPONDE — apagar quando ele voltar.
//
// Desde 23/09/2026 a leitura de portal_brokers responde 401 ("permission
// denied for view user_profiles"): o anon perdeu o SELECT nessa relação, que
// foi recriada do lado do dashboard. Sem isto, /lotus-corretores fica sem
// ninguém.
//
// Os nomes e os CRECIs são cópia do que o próprio dashboard tinha, lidos horas
// antes de a permissão cair. A exceção é Gabriele Fávaro: ela não aparece no
// cadastro que o portal enxerga (nem entre os 16 vínculos de corretor da
// imobiliária), e o CRECI dela foi informado pela Lotus em 24/09/2026. Se ela
// continuar fora do dashboard, some daqui junto com esta lista — vale conferir
// o papel e o CRECI no cadastro dela. Nada aqui é estimado: quem não tinha CRECI lá
// continua fora, e `imoveisAtivos` fica em zero porque o número muda todo dia
// e não dá para conferir agora — em zero, a linha simplesmente não aparece.
//
// Foto e descritivo NÃO moram aqui: vêm de CONTEUDO_REAL, em
// components/LotusCorretores, casados pelo nome.
//
// Restaurado o acesso, o banco volta a mandar sozinho (quem já existe lá é
// descartado daqui pelo nome) e esta lista deve ser esvaziada.
const EXTRAS: Broker[] = [
  { id: 'alexandra-niero', name: 'Alexandra Niero', photoUrl: null, creci: '272.515-F', imoveisAtivos: 0 },
  { id: 'fabio-goncalves', name: 'Fábio Gonçalves', photoUrl: null, creci: '319294-F', imoveisAtivos: 0 },
  { id: 'fernanda-souza', name: 'Fernanda Souza', photoUrl: null, creci: '219893', imoveisAtivos: 0 },
  { id: 'flavia-ceolin', name: 'Flavia Ceolin', photoUrl: null, creci: '324927', imoveisAtivos: 0 },
  { id: 'gabriele-favaro', name: 'Gabriele Fávaro', photoUrl: null, creci: '242152-F', imoveisAtivos: 0 },
  { id: 'gisele-alves', name: 'Gisele Alves', photoUrl: null, creci: '328459', imoveisAtivos: 0 },
  { id: 'humberto-martinez', name: 'Humberto Martinez', photoUrl: null, creci: '302852', imoveisAtivos: 0 },
  { id: 'lara-matos', name: 'Lara Matos', photoUrl: null, creci: '382.076 - F', imoveisAtivos: 0 },
  { id: 'marcos-lafratta', name: 'Marcos Lafratta', photoUrl: null, creci: '335323-F', imoveisAtivos: 0 },
  { id: 'mariana-mamede', name: 'Mariana Mamede', photoUrl: null, creci: '251592 F', imoveisAtivos: 0 },
];

const chaveNome = (nome: string) => nome.normalize('NFC').toLowerCase().trim().replace(/\s+/g, ' ');

// Quem a Lotus mandou tirar do site fica fora venha do banco ou da lista local.
const semOcultos = (itens: Broker[]) => itens.filter((b) => !OCULTOS.has(chaveNome(b.name)));

/** Corretores do tenant Lotus (para /lotus-corretores).
 *  A view portal_brokers já filtra role (corretor/team_leader), tenant e
 *  nome não-vazio. O .eq(tenant_id) aqui é defesa em profundidade. */
export async function getBrokers(): Promise<Broker[]> {
  const { data, error } = await supabase
    .from('portal_brokers')
    .select('id, name, photo_url, creci, imoveis_ativos')
    .eq('tenant_id', TENANT_ID)
    .order('name');

  if (error) {
    console.error('[getBrokers] erro Supabase:', error.message);
    // Antes daqui saía [], e fazia sentido: os EXTRAS tinham uma pessoa só, e
    // publicar uma equipe de um nome era pior do que assumir o vazio. Hoje os
    // EXTRAS são a equipe inteira, copiada do dashboard, então segurar a
    // página com eles é melhor do que deixá-la sem ninguém.
    return semOcultos(EXTRAS).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  const doBanco = (data as BrokerRow[])
    .map((r) => ({
      id: r.id,
      name: r.name,
      photoUrl: r.photo_url,
      creci: r.creci,
      imoveisAtivos: r.imoveis_ativos ?? 0,
    }))
    .filter((b) => !OCULTOS.has(chaveNome(b.name)));


  // Se o corretor já existe no banco, o banco vence e o EXTRA é descartado —
  // evita duplicata no dia em que o cadastro real for feito.
  const jaNoBanco = new Set(doBanco.map((b) => chaveNome(b.name)));
  const extras = EXTRAS.filter((e) => !jaNoBanco.has(chaveNome(e.name)));

  // A ordenação por nome vinha do `.order('name')`; refaz porque os extras
  // entrariam sempre no fim.
  return [...doBanco, ...extras].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/**
 * Uma linha de portal_brokers como o cartão do imóvel a mostra. Sem linha, sem
 * nome ou de quem a Lotus tirou do site, null: quem chama mostra o genérico.
 * A foto tem a mesma reserva da página de corretores.
 */
function pessoaDoSite(row: Pick<BrokerRow, 'name' | 'photo_url'> | null): PessoaDoCartao | null {
  // "Mariana  Mamede": o cadastro tem espaço duplo em vários nomes.
  const nome = row?.name?.trim().replace(/\s+/g, ' ');
  if (!nome || OCULTOS.has(chaveNome(nome))) return null;
  return { nome, foto: row?.photo_url || conteudoRealDe(nome)?.foto || null };
}

/**
 * Nome e foto de quem mandou o link do imóvel (`?c=`), para o painel da página.
 *
 * `codigo_link` entra em portal_brokers pela migration 20261146 da Dash. Antes
 * dela, com erro, com código de quem não está na view (a Diretoria não está) ou
 * de quem a Lotus tirou do site, devolve null: o painel fica com o captador (ou
 * o genérico) e o código segue no texto do WhatsApp, porque quem resolve o
 * corretor é a Dash.
 */
export async function getBrokerDoLink(codigo: string): Promise<PessoaDoCartao | null> {
  const { data, error } = await supabase
    .from('portal_brokers')
    .select('name, photo_url')
    .eq('tenant_id', TENANT_ID)
    .eq('codigo_link', codigo)
    .maybeSingle();
  if (error) {
    console.error('[getBrokerDoLink] erro Supabase:', error.message);
    return null;
  }
  return pessoaDoSite(data as Pick<BrokerRow, 'name' | 'photo_url'> | null);
}

/**
 * Nome e foto de quem captou o imóvel: o cartão da página do imóvel sem link de
 * corretor e o "Corretor captador" da Área do Corretor.
 *
 * `portal_imoveis.captador_id` entra pela migration 20261176 da Dash. A leitura
 * fica fora do SELECT_FULL de propósito: sem a coluna (antes da migration), só
 * esta consulta falha e devolve null, e a página do imóvel continua de pé. Com
 * erro, sem captador, com captador fora de portal_brokers (Diretoria,
 * ex-membro) ou oculto, também null. O 2º captador não aparece.
 */
export async function getCaptadorDoImovel(codigoImovel: string): Promise<PessoaDoCartao | null> {
  const { data: imovel, error } = await supabase
    .from('portal_imoveis')
    .select('captador_id')
    .eq('tenant_id', TENANT_ID)
    .eq('codigo_imovel', codigoImovel)
    .maybeSingle();
  if (error) {
    console.error('[getCaptadorDoImovel] erro Supabase:', error.message);
    return null;
  }
  const captadorId = (imovel as { captador_id: string | null } | null)?.captador_id;
  if (!captadorId) return null;

  const { data, error: erroDoCaptador } = await supabase
    .from('portal_brokers')
    .select('name, photo_url')
    .eq('tenant_id', TENANT_ID)
    .eq('id', captadorId)
    .maybeSingle();
  if (erroDoCaptador) {
    console.error('[getCaptadorDoImovel] erro Supabase:', erroDoCaptador.message);
    return null;
  }
  return pessoaDoSite(data as Pick<BrokerRow, 'name' | 'photo_url'> | null);
}
