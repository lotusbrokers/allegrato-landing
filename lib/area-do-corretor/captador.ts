/**
 * Corretor que captou o imóvel de terceiros — quem o cadastrou na Dashboard —,
 * para a ficha da área.
 *
 * Captador = imoveis_locais.criado_por, a mesma definição da contagem de
 * imóveis por corretor (supabase/migrations/0003). A vitrine pública
 * (portal_imoveis) não expõe essa coluna de propósito; aqui a leitura é feita
 * com a sessão do corretor logado, sob a RLS da Dashboard, e só na área.
 *
 * Sem permissão, sem cadastro ou sem nome, devolve null e a ficha não mostra o
 * bloco: o resto da ficha não depende disto. Em 05/10/2026, 10 dos 23 imóveis
 * vinham de duas contas sem nome no perfil da Dashboard.
 *
 * Foto: a do perfil da Dashboard; sem ela (o caso de todos em 05/10/2026), a
 * mesma que a página /lotus-corretores usa (lib/corretores-conteudo.ts).
 */
import { conteudoRealDe } from '@/lib/corretores-conteudo';
import { clienteDaSessao } from './sessao';

export type Captador = { id: string; nome: string; foto: string | null };

export async function captadorDoImovel(imovelId: string): Promise<Captador | null> {
  const supabase = await clienteDaSessao();
  const { data: imovel, error } = await supabase.from('imoveis_locais').select('criado_por').eq('id', imovelId).maybeSingle();
  if (error) {
    console.error('[area-do-corretor] captador do imóvel indisponível:', error.message);
    return null;
  }
  const id = imovel?.criado_por as string | null | undefined;
  if (!id) return null;

  const { data: perfil, error: erroPerfil } = await supabase
    .from('user_profiles')
    .select('full_name, avatar_url')
    .eq('id', id)
    .maybeSingle();
  if (erroPerfil) {
    console.error('[area-do-corretor] perfil do captador indisponível:', erroPerfil.message);
    return null;
  }
  // "Mariana  Mamede": o cadastro tem espaço duplo em vários nomes.
  const nome = (perfil?.full_name as string | null | undefined)?.trim().replace(/\s+/g, ' ');
  if (!nome) return null;
  const foto = (perfil?.avatar_url as string | null | undefined) || conteudoRealDe(nome)?.foto || null;
  return { id, nome, foto };
}
