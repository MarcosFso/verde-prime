-- =============================================================================
-- Verde Prime — retrato do banco de dados tal como está em produção
-- =============================================================================
-- Este arquivo DOCUMENTA a estrutura que já existe no Supabase. Ele foi
-- reconstruído lendo o banco (tabelas, colunas, restrições, políticas RLS,
-- funções, gatilho e bucket) em 08/11/2026.
--
-- NÃO rode este arquivo no projeto de produção: tudo aqui já existe lá.
-- Ele serve para (1) auditar as regras de acesso, (2) versionar mudanças no git
-- e (3) recriar o banco do zero num projeto novo, se um dia for preciso.
--
-- Não há dados aqui, só estrutura.
-- =============================================================================

create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- profiles: um perfil por usuário do Supabase Auth
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  username          text not null unique,
  is_admin          boolean not null default false,
  created_at        timestamptz default now(),
  is_active         boolean not null default true,
  terms_accepted_at timestamptz
);

-- -----------------------------------------------------------------------------
-- fichas: a ficha técnica de cada cliente
-- -----------------------------------------------------------------------------
create table public.fichas (
  id                        uuid primary key default gen_random_uuid(),
  owner_id                  uuid not null default auth.uid() references auth.users (id),
  criado_em                 timestamptz default now(),
  arquivado                 boolean not null default false,
  historico                 jsonb not null default '[]'::jsonb,
  fotos                     jsonb not null default '[]'::jsonb,
  documentos                jsonb not null default '[]'::jsonb,

  -- cabeçalho
  data_visita               date,
  tecnico                   text,

  -- proprietário / possuidor
  nome                      text not null,
  cpf_cnpj                  text,
  telefone                  text,
  email                     text,

  -- imóvel rural
  nome_imovel               text,
  municipio_uf              text,
  area_aproximada           numeric,
  matricula                 text,
  cartorio                  text,
  ccir                      text,
  possui_sigef              text,
  area_certificada          numeric,

  -- CAR
  possui_car                text,
  numero_car                text,
  area_declarada            numeric,
  situacao_car              text,
  situacao_car_detalhe      text,
  outro_car_contiguo        text,
  sobreposicao              text,
  observacoes_car           text,

  -- levantamento ambiental
  uso_predominante          text[] default '{}'::text[],
  uso_predominante_detalhe  text,
  app_curso_dagua           text,
  nascente                  text,
  represa_lagoa             text,
  reserva_legal             text,
  supressao_vegetacao       text,
  passivo_ambiental         text,
  desmatamento_anterior     text,
  desmatamento_posterior    text,

  -- documentação
  documentacao              text[],
  documentacao_detalhe      text,
  documentos_pendentes      text,

  -- campo
  coordenada_referencia     text,
  registro_fotografico      text,
  arquivo_geografico        text,
  formato_arquivo           text,
  formato_arquivo_detalhe   text,
  levantamento_gps          text,
  observacoes_campo         text,

  -- notificação / pendência do SICAR
  notificacao_sicar         text,
  numero_protocolo          text,
  data_notificacao          date,
  prazo_atendimento         date,
  motivo_exigencia          text,
  providencia_necessaria    text,
  documentos_necessarios    text,

  observacoes_tecnicas      text,

  -- providências e controle do serviço
  providencias              text[],
  providencias_detalhe      text,
  data_prevista_execucao    date,
  responsavel_servico       text,
  data_conclusao            date,
  situacao_atendimento      text default 'aguardando_documentos'::text,

  -- financeiro
  forma_pagamento           text,
  valor_cobrado             numeric,
  valor_recebido            numeric,
  observacoes_financeiro    text,
  pagamentos                jsonb default '[]'::jsonb,
  recibos                   jsonb default '[]'::jsonb,

  -- cadista
  cadista_nome              text,
  cadista_data              date,
  cadista_data_entrega      date,
  cadista_valor             numeric,
  cadista_observacoes       text,

  -- protocolo
  protocolo_tipo            text,
  sei_data                  date,
  sei_processo              text,
  sei_cliente               text,
  sei_acesso                text,
  sei_status                text,
  sei_andamento             text,
  protocolo_car             text,

  -- lixeira (preenchido = ficha removida, mas recuperável)
  excluido_em               timestamptz
);

-- -----------------------------------------------------------------------------
-- despesas
-- -----------------------------------------------------------------------------
create table public.despesas (
  id         bigint generated by default as identity primary key,
  owner_id   uuid not null references auth.users (id) on delete cascade,
  descricao  text not null,
  valor      numeric not null default 0,
  categoria  text not null default 'outros'::text,
  data       date not null default current_date,
  criado_em  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Funções
-- -----------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
as $$
  select coalesce((select is_admin from profiles where id = uid), false);
$$;

-- Cria o perfil quando alguém se cadastra. O primeiro usuário do sistema vira admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  is_first boolean;
begin
  select count(*) = 0 into is_first from public.profiles;
  insert into public.profiles (id, username, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    is_first
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.fichas   enable row level security;
alter table public.despesas enable row level security;

-- profiles
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_select_own_or_admin on public.profiles
  for select using (auth.uid() = id or is_admin(auth.uid()));
create policy profiles_update_own_or_admin on public.profiles
  for update using (auth.uid() = id or is_admin(auth.uid()));

-- fichas
create policy fichas_select on public.fichas
  for select using (auth.uid() = owner_id or is_admin(auth.uid()));
create policy fichas_insert on public.fichas
  for insert with check (auth.uid() = owner_id or is_admin(auth.uid()));
create policy fichas_update on public.fichas
  for update using (auth.uid() = owner_id or is_admin(auth.uid()));
create policy fichas_delete on public.fichas
  for delete using (auth.uid() = owner_id or is_admin(auth.uid()));

-- despesas (não há política de UPDATE: despesa não se edita, só se apaga)
create policy despesas_select on public.despesas
  for select using (owner_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));
create policy despesas_insert on public.despesas
  for insert with check (owner_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));
create policy despesas_delete on public.despesas
  for delete using (owner_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- -----------------------------------------------------------------------------
-- Storage: bucket privado "anexos"; cada usuário só mexe na própria pasta (<uid>/...)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('anexos', 'anexos', false)
on conflict (id) do nothing;

create policy anexos_select_own on storage.objects
  for select using (bucket_id = 'anexos' and ((auth.uid())::text = (storage.foldername(name))[1] or is_admin(auth.uid())));
create policy anexos_insert_own on storage.objects
  for insert with check (bucket_id = 'anexos' and (auth.uid())::text = (storage.foldername(name))[1]);
create policy anexos_delete_own on storage.objects
  for delete using (bucket_id = 'anexos' and ((auth.uid())::text = (storage.foldername(name))[1] or is_admin(auth.uid())));
