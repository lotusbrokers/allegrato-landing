'use server';

import { redirect } from 'next/navigation';
import { clienteDaSessao, papelNoTenant } from '@/lib/area-do-corretor/sessao';
import { destinoSeguro, ROTA_ENTRADA } from '@/lib/area-do-corretor/acesso';

export type EstadoDaEntrada = { erro: string | null; email: string };

/**
 * Login com a conta da Dashboard (mesmo Supabase Auth). Quem autentica mas não
 * tem papel de corretor no tenant da Lotus é deslogado na hora: a sessão não
 * fica aberta para quem não pode usar a área.
 */
export async function entrar(_anterior: EstadoDaEntrada, dados: FormData): Promise<EstadoDaEntrada> {
  const email = String(dados.get('email') ?? '').trim().toLowerCase();
  const senha = String(dados.get('senha') ?? '');
  const volta = String(dados.get('volta') ?? '');

  if (!email || !senha) return { erro: 'Informe seu e-mail e sua senha.', email };
  // Limites só contra entrada absurda; quem decide se a senha confere é o Supabase.
  if (email.length > 254 || senha.length > 200) return { erro: 'E-mail ou senha incorretos.', email };

  const supabase = await clienteDaSessao();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error || !data.user) {
    // O Supabase responde igual para e-mail inexistente e senha errada, e a
    // mensagem também: dizer qual dos dois falhou ajudaria quem tenta adivinhar contas.
    if (error?.code === 'invalid_credentials') return { erro: 'E-mail ou senha incorretos.', email };
    if (error?.code === 'email_not_confirmed') {
      return { erro: 'Seu e-mail ainda não foi confirmado. Confirme pelo link que a Dashboard enviou.', email };
    }
    if (error?.status === 429) return { erro: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.', email };
    return { erro: 'Não foi possível entrar agora. Tente de novo em instantes.', email };
  }

  let papel: Awaited<ReturnType<typeof papelNoTenant>>;
  try {
    papel = await papelNoTenant(supabase, data.user.id);
  } catch {
    await supabase.auth.signOut({ scope: 'local' });
    return { erro: 'Não foi possível confirmar seu acesso agora. Tente de novo em instantes.', email };
  }
  if (!papel) {
    await supabase.auth.signOut({ scope: 'local' });
    return { erro: 'Esta conta não tem acesso à Área do Corretor da Lotus. Fale com a administração.', email };
  }

  redirect(destinoSeguro(volta));
}

/**
 * Sai só deste navegador (scope local). O padrão do Supabase é 'global', que
 * derrubaria também a sessão da Dashboard e de todos os aparelhos do corretor.
 */
export async function sair(): Promise<void> {
  const supabase = await clienteDaSessao();
  await supabase.auth.signOut({ scope: 'local' });
  redirect(ROTA_ENTRADA);
}
