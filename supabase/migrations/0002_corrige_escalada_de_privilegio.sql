-- =============================================================================
-- 0002 — Corrige a escalada de privilégio em public.profiles
-- =============================================================================
-- PROBLEMA (confirmado por teste em 08/11/2026, com tudo desfeito no fim):
--   a política profiles_update_own_or_admin deixa qualquer usuário alterar a
--   PRÓPRIA linha inteira. Isso inclui is_admin. Um usuário comum conseguia se
--   promover a administrador e, em seguida, ler as 13 fichas de todos os clientes
--   (CPF, telefone, e-mail). Como o cadastro é aberto, qualquer pessoa poderia
--   fazer isso.
--
-- O QUE ESTA MIGRAÇÃO FAZ (não apaga nem altera nenhum dado):
--   1. Gatilho que impede usuário comum de mexer em is_admin / is_active / id /
--      created_at. Administrador só altera esses campos de OUTRAS pessoas.
--   2. profiles_insert_own passa a exigir is_admin = false e is_active = true.
--   3. is_admin(): fixa o search_path e só responde sobre o próprio usuário que
--      chama (antes, qualquer um podia perguntar se um UUID é admin).
--   4. Remove permissões que o app não usa (anon nas tabelas; TRUNCATE, TRIGGER
--      e REFERENCES para usuários logados) e fecha o acesso direto às funções.
--
-- COMPORTAMENTO DO APP QUE CONTINUA IGUAL:
--   - usuário comum aceita os termos (altera terms_accepted_at) ........ permitido
--   - administrador promove/desativa OUTRO usuário .................... permitido
--   - administrador altera o próprio is_admin/is_active ................ bloqueado
--     (o app já bloqueava na tela; agora o banco também bloqueia, o que evita
--     ficar sem nenhum administrador)
--   - mexer pelo SQL Editor ou com a chave service_role ............... permitido
--     (nesses casos auth.uid() é nulo)
-- =============================================================================

-- 1) Gatilho de proteção das colunas sensíveis ---------------------------------
create or replace function public.protege_colunas_profiles()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- SQL Editor, migrações e service_role não têm usuário logado: liberado.
  if auth.uid() is null then
    return new;
  end if;

  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Os campos id e created_at não podem ser alterados.'
      using errcode = '42501';
  end if;

  if new.is_admin is distinct from old.is_admin
     or new.is_active is distinct from old.is_active then

    if not public.is_admin(auth.uid()) then
      raise exception 'Apenas administradores podem alterar permissões de acesso.'
        using errcode = '42501';
    end if;

    if old.id = auth.uid() then
      raise exception 'Você não pode alterar o seu próprio acesso.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protege_colunas_profiles on public.profiles;
create trigger protege_colunas_profiles
  before update on public.profiles
  for each row execute function public.protege_colunas_profiles();

-- 2) Inserção do próprio perfil: nunca como admin ------------------------------
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert
  with check (auth.uid() = id and is_admin = false and is_active = true);

-- 3) is_admin(): search_path fixo e sem vazar a lista de administradores -------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = uid and uid = auth.uid()),
    false
  );
$$;

-- 4) Menos permissões ---------------------------------------------------------
-- O app só usa usuários logados (role authenticated) nestas tabelas.
revoke all on table public.profiles, public.fichas, public.despesas from anon;
revoke truncate, trigger, references on table public.profiles, public.fichas, public.despesas from authenticated;

-- is_admin é chamada pelas políticas (precisa do authenticated), mas não pelo visitante.
revoke execute on function public.is_admin(uuid) from public, anon;
grant  execute on function public.is_admin(uuid) to authenticated;

-- handle_new_user só deve ser disparada pelo gatilho, nunca chamada pela API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
