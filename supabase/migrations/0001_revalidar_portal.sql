-- Revalidação on-demand do Portal a partir do dash.
--
-- Quando um lançamento muda no Supabase, dispara um POST para /api/revalidate
-- do portal Next.js, que chama revalidatePath('/lotus-home', '/lotus-lancamentos').
-- Sem isto, o site só reflete a mudança quando a janela de ISR (1h) expira.
--
-- Arquitetura: Supabase (trigger) -> pg_net.http_post -> /api/revalidate -> Next.
-- A rota valida o header `x-revalidate-secret` contra REVALIDATE_SECRET (env do
-- portal). Ver portal/app/api/revalidate/route.ts.
--
-- ANTES DE APLICAR, substitua os dois placeholders abaixo:
--   __PORTAL_URL__      = domínio público do portal (ex.: https://www.lotusbrokers.com.br)
--   __REVALIDATE_SECRET__ = o mesmo valor da env REVALIDATE_SECRET do portal
--
-- Se a tabela de lançamentos tiver outro nome, ajuste o `on public.lancamentos`
-- no final.

create extension if not exists pg_net;

create or replace function public.revalidar_portal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url     := '__PORTAL_URL__/api/revalidate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-revalidate-secret', '__REVALIDATE_SECRET__'
    ),
    body    := '{}'::jsonb
  );
  return null; -- trigger AFTER ... FOR EACH STATEMENT não usa o retorno.
end;
$$;

drop trigger if exists trg_revalidar_portal on public.lancamentos;

create trigger trg_revalidar_portal
after insert or update or delete on public.lancamentos
for each statement
execute function public.revalidar_portal();
