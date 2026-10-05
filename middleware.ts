import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ROTA_ENTRADA } from '@/lib/area-do-corretor/acesso';

/**
 * Porteiro da Área do Corretor (ver o matcher: o resto do site não passa por
 * aqui e continua estático).
 *
 * - Renova a sessão do Supabase quando o token vence. Server Component não grava
 *   cookie; sem esta renovação o corretor seria deslogado a cada hora.
 * - Sem sessão, manda para a entrada guardando a página pedida em `volta`, para
 *   o login devolver o corretor exatamente onde ele queria ir.
 * - Marca toda resposta da área como privada: fora do índice do Google e de
 *   qualquer cache compartilhado.
 *
 * O papel (corretor, admin...) é conferido nas páginas, com o banco; aqui só a
 * existência da sessão, para não consultar o banco duas vezes por navegação.
 */
export async function middleware(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(novos) {
        for (const { name, value } of novos) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of novos) resposta.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  if (!user && pathname !== ROTA_ENTRADA) {
    const entrada = request.nextUrl.clone();
    entrada.pathname = ROTA_ENTRADA;
    entrada.search = '';
    entrada.searchParams.set('volta', pathname + search);
    const redirecionamento = NextResponse.redirect(entrada);
    // Leva junto os cookies que o Supabase limpou (sessão vencida ou inválida).
    for (const cookie of resposta.cookies.getAll()) redirecionamento.cookies.set(cookie);
    return privada(redirecionamento);
  }

  return privada(resposta);
}

function privada(resposta: NextResponse): NextResponse {
  resposta.headers.set('X-Robots-Tag', 'noindex, nofollow');
  resposta.headers.set('Cache-Control', 'private, no-store');
  return resposta;
}

export const config = {
  matcher: ['/area-do-corretor', '/area-do-corretor/:path*'],
};
