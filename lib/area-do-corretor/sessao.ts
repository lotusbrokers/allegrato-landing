/**
 * Sessão do corretor no servidor: quem está logado e com que papel.
 *
 * Login e senha são os da Dashboard (OctoDash): o mesmo projeto Supabase, o
 * mesmo Supabase Auth, os mesmos usuários. Nada é cadastrado aqui. A sessão do
 * site fica em cookie no domínio da Lotus (@supabase/ssr), independente da
 * sessão da Dashboard, que mora no navegador, no domínio dela.
 *
 * Toda leitura é feita com o token do próprio corretor, então vale a RLS que a
 * Dashboard já aplica. O cliente anônimo do portal (lib/supabase.ts) continua
 * só lendo as views portal_*; este aqui não usa service_role em hipótese alguma.
 */
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { TENANT_ID } from '@/lib/supabase';
import { melhorPapel, ROTA_ENTRADA, type PapelComAcesso } from './acesso';

export async function clienteDaSessao() {
  const loja = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return loja.getAll();
      },
      setAll(novos) {
        try {
          for (const { name, value, options } of novos) loja.set(name, value, options);
        } catch {
          // Server Component não grava cookie; o middleware renova a sessão a cada navegação.
        }
      },
    },
  });
}

type Cliente = Awaited<ReturnType<typeof clienteDaSessao>>;

/**
 * Papel da pessoa no tenant da Lotus, pela mesma view que a Dashboard consulta
 * no login. Lança em erro de banco: "não consegui confirmar" não pode virar
 * "não tem acesso" — são mensagens diferentes para o corretor.
 */
export async function papelNoTenant(supabase: Cliente, usuarioId: string): Promise<PapelComAcesso | null> {
  const { data, error } = await supabase
    .from('my_memberships_with_tenant')
    .select('role')
    .eq('user_id', usuarioId)
    .eq('tenant_id', TENANT_ID);
  if (error) throw new Error(`[area-do-corretor] vínculos indisponíveis: ${error.message}`);
  return melhorPapel((data ?? []).map((v: { role: string | null }) => v.role));
}

/** Nome e foto vêm de user_profiles; sem eles a área ainda funciona, com o nome do e-mail. */
async function perfilDe(supabase: Cliente, usuarioId: string): Promise<{ nome: string | null; foto: string | null }> {
  const { data } = await supabase.from('user_profiles').select('full_name, avatar_url').eq('id', usuarioId).maybeSingle();
  return { nome: data?.full_name?.trim() || null, foto: data?.avatar_url || null };
}

export type Corretor = {
  id: string;
  email: string;
  nome: string;
  primeiroNome: string;
  foto: string | null;
  papel: PapelComAcesso;
};

export type Situacao =
  | { tipo: 'anonimo' }
  | { tipo: 'sem-acesso'; email: string }
  | { tipo: 'corretor'; corretor: Corretor };

/** Uma consulta por requisição, por mais que layout e página perguntem. */
export const situacaoAtual = cache(async (): Promise<Situacao> => {
  const supabase = await clienteDaSessao();
  // getUser confere o token no Supabase; getSession só leria o cookie, que o navegador pode forjar.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { tipo: 'anonimo' };

  const [papel, perfil] = await Promise.all([papelNoTenant(supabase, user.id), perfilDe(supabase, user.id)]);
  const email = user.email ?? '';
  if (!papel) return { tipo: 'sem-acesso', email };

  const nome = perfil.nome || email.split('@')[0] || 'Corretor';
  return {
    tipo: 'corretor',
    corretor: { id: user.id, email, nome, primeiroNome: nome.split(/\s+/)[0], foto: perfil.foto, papel },
  };
});

/**
 * Para cada página e ação da área. Chamar em todas, não só no layout: no App
 * Router a página renderiza em paralelo ao layout, e a checagem precisa estar
 * onde o dado é lido.
 */
export async function exigirCorretor(): Promise<Corretor> {
  const situacao = await situacaoAtual();
  if (situacao.tipo === 'corretor') return situacao.corretor;
  redirect(ROTA_ENTRADA);
}
