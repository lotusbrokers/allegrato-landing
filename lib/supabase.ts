import { createClient } from '@supabase/supabase-js';

// Cliente Supabase do Portal — SOMENTE LEITURA, anon key (pública por design).
// Lê apenas as views públicas portal_* , sempre filtrando pelo tenant fixo Lotus.
// Nunca usar service_role aqui.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID!;

// Estratégia de cache (Next 15 App Router):
// - Fetch CACHEÁVEL (não usar `cache: 'no-store'`): `no-store` força render
//   dinâmico e QUEBRA `generateStaticParams`/SSG (as rotas [id] não prerenderizam
//   e viram dinâmicas por request). Cada página controla a janela de frescor com
//   `export const revalidate = N` (ISR).
// - Revalidação ON-DEMAND: o /api/revalidate chama `revalidatePath`, que invalida
//   o CACHE DE ROTA — funciona mesmo com o fetch cacheável (não depende do Data
//   Cache do fetch). Marcamos as leituras com uma tag ('portal') para permitir
//   `revalidateTag('portal')` no futuro, se quisermos invalidação por dado.
const fetchTagged: typeof fetch = (input, init) =>
  fetch(input, { ...init, next: { tags: ['portal'] } } as RequestInit);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchTagged },
});
