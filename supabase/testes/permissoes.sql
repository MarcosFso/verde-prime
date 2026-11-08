-- =============================================================================
-- Teste de permissões do banco (seguro: NÃO grava nada)
-- =============================================================================
-- Como usar: cole no SQL Editor do Supabase e execute.
--
-- Cada verificação roda dentro de um bloco que termina forçando um erro, e o
-- Postgres desfaz tudo o que aconteceu dentro dele. No fim, o script também
-- termina em erro DE PROPÓSITO: o texto desse erro é o relatório. Por isso o
-- Supabase mostra "Failed to run sql query" — é o esperado.
--
-- Escolhe sozinho um administrador e dois usuários comuns, então não há IDs
-- de pessoas reais neste arquivo.
--
-- O que cada linha deve mostrar:
--   BLOQUEADO-ok  -> o ataque falhou (bom)
--   FALHA         -> o ataque funcionou (corrigir com urgência)
--   FUNCIONA-ok   -> o uso normal do app continua funcionando (bom)
-- =============================================================================
do $t$
declare
  res  text := '';
  n    int;
  usuA uuid;  -- usuário comum (preferindo quem tem fichas)
  usuB uuid;  -- outro usuário comum
  adm  uuid;  -- um administrador
begin
  select id into adm from public.profiles where is_admin order by created_at limit 1;
  select id into usuA from public.profiles where not is_admin
    order by (select count(*) from public.fichas f where f.owner_id = profiles.id) desc, created_at limit 1;
  select id into usuB from public.profiles where not is_admin and id <> usuA order by created_at desc limit 1;

  if adm is null or usuA is null or usuB is null then
    raise exception 'Precisa de ao menos 1 administrador e 2 usuários comuns para testar.';
  end if;

  -- ----- ATAQUES: devem ser bloqueados -----
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', usuB, 'role', 'authenticated')::text, true);
    update public.profiles set is_admin = true where id = usuB;
    get diagnostics n = row_count;
    raise exception 'FALHA: usuário comum virou admin (linhas=%)', n;
  exception when others then
    res := res || case when sqlerrm like 'FALHA%' then sqlerrm else 'BLOQUEADO-ok: comum tenta virar admin' end || E'\n';
  end;

  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', usuB, 'role', 'authenticated')::text, true);
    update public.profiles set username = username where id = adm;
    get diagnostics n = row_count;
    raise exception '%', case when n = 0 then 'BLOQUEADO-ok: comum não consegue alterar o perfil de outro' else 'FALHA: comum alterou o perfil de outro (linhas=' || n || ')' end;
  exception when others then res := res || sqlerrm || E'\n'; end;

  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', usuB, 'role', 'authenticated')::text, true);
    select count(*) into n from public.fichas where owner_id <> usuB;
    raise exception '%', case when n = 0 then 'BLOQUEADO-ok: comum não enxerga fichas de outros' else 'FALHA: comum enxerga ' || n || ' fichas de outros' end;
  exception when others then res := res || sqlerrm || E'\n'; end;

  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', usuB, 'role', 'authenticated')::text, true);
    insert into public.fichas (owner_id, nome) values (usuA, 'teste-invasao');
    raise exception 'FALHA: comum criou ficha em nome de outro';
  exception when others then
    res := res || case when sqlerrm like 'FALHA%' then sqlerrm else 'BLOQUEADO-ok: comum cria ficha em nome de outro' end || E'\n';
  end;

  begin
    set local role anon;
    select count(*) into n from public.fichas;
    raise exception '%', case when n = 0 then 'BLOQUEADO-ok: visitante sem login vê 0 fichas' else 'FALHA: visitante sem login leu ' || n || ' fichas' end;
  exception when others then
    res := res || case when sqlerrm like 'FALHA%' or sqlerrm like 'BLOQUEADO%' then sqlerrm else 'BLOQUEADO-ok: visitante sem login não lê fichas (' || sqlerrm || ')' end || E'\n';
  end;

  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
    update public.profiles set is_admin = false where id = adm;
    raise exception 'FALHA: admin removeu o próprio acesso';
  exception when others then
    res := res || case when sqlerrm like 'FALHA%' then sqlerrm else 'BLOQUEADO-ok: admin altera o próprio acesso' end || E'\n';
  end;

  -- ----- USO NORMAL: deve funcionar -----
  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', usuB, 'role', 'authenticated')::text, true);
    update public.profiles set terms_accepted_at = now() where id = usuB;
    get diagnostics n = row_count;
    raise exception '%', case when n = 1 then 'FUNCIONA-ok: comum aceita os termos' else 'FALHA: comum não consegue aceitar os termos' end;
  exception when others then res := res || sqlerrm || E'\n'; end;

  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
    update public.profiles set is_active = false where id = usuB;
    get diagnostics n = row_count;
    raise exception '%', case when n = 1 then 'FUNCIONA-ok: admin desativa outro usuário' else 'FALHA: admin não consegue desativar outro usuário' end;
  exception when others then res := res || sqlerrm || E'\n'; end;

  begin
    set local role authenticated;
    perform set_config('request.jwt.claims', json_build_object('sub', adm, 'role', 'authenticated')::text, true);
    select count(*) into n from public.fichas;
    raise exception 'FUNCIONA-ok: admin enxerga % ficha(s) no total', n;
  exception when others then res := res || sqlerrm || E'\n'; end;

  raise exception E'\n=== RELATÓRIO (tudo desfeito) ===\n%', res;
end $t$;
