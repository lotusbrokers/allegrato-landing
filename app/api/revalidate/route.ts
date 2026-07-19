import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

// Revalidação on-demand do Portal (arquitetura do briefing:
//   Supabase → trigger/edge function → POST /api/revalidate → Next revalida).
//
// Sem isto, as páginas ISR só atualizam quando a janela de revalidate (1h)
// expira. Com isto, o dashboard força a atualização assim que um lançamento
// muda — o site reflete a mudança em segundos.
//
// SEGURANÇA: a rota é protegida por segredo compartilhado (REVALIDATE_SECRET).
// O trigger do Supabase envia o segredo no header `x-revalidate-secret`. Sem o
// segredo correto, responde 401 — impede que terceiros forcem revalidações
// (custo/DoS). Comparação de tamanho constante para não vazar o segredo por
// timing. NUNCA expor o segredo no cliente (só server-side / no trigger).

export const runtime = 'nodejs';

// Páginas que dependem dos dados de `lancamentos`. Revalidadas por padrão quando
// o corpo não especifica `path`. Manter em sincronia com as rotas que leem o
// Supabase (hoje: home e a listagem de lançamentos).
const DEFAULT_PATHS = ['/lotus-home', '/lotus-lancamentos'];

// Comparação de tamanho constante (evita timing attack no segredo).
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    // Falha fechada: sem segredo configurado, a rota não opera.
    return NextResponse.json(
      { revalidated: false, error: 'REVALIDATE_SECRET não configurado' },
      { status: 500 },
    );
  }

  const provided = req.headers.get('x-revalidate-secret') ?? '';
  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ revalidated: false, error: 'não autorizado' }, { status: 401 });
  }

  // Corpo opcional: { path?: string } para revalidar uma rota específica; sem
  // corpo/path, revalida as páginas padrão que dependem de lançamentos.
  let paths = DEFAULT_PATHS;
  try {
    const body = (await req.json()) as { path?: string } | null;
    if (body?.path && typeof body.path === 'string') paths = [body.path];
  } catch {
    // sem corpo JSON válido → usa os paths padrão.
  }

  for (const p of paths) revalidatePath(p);

  return NextResponse.json({ revalidated: true, paths });
}
