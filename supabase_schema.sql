-- ============================================================
-- Adoração em Família Floro — Supabase Schema
-- Execute este script no SQL Editor do seu projeto Supabase
-- Projeto: ADORAÇÃOFAMILIAFLOROS (thrfdgetmezrfnvclwub)
-- ============================================================

-- Tabela de semanas de adoração
create table if not exists public.weeks (
  id          text primary key,
  date        text not null,
  responsible_id text not null check (responsible_id in ('rafael', 'gracy', 'ricardo')),
  type        text not null check (type in ('theme', 'broadcast', 'meeting_prep', 'free')),
  theme       text,
  description text,
  custom_dynamic text,
  generated_content jsonb,
  completed   boolean default false,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Habilitar Row Level Security
alter table public.weeks enable row level security;

-- Política: permitir acesso anônimo completo (autenticação é feita no front-end)
create policy "Allow full access to all" on public.weeks
  for all
  using (true)
  with check (true);

-- Índice por data para ordenação rápida
create index if not exists weeks_date_idx on public.weeks(date desc);

-- Função de atualização automática do updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.weeks
  for each row execute function public.handle_updated_at();
