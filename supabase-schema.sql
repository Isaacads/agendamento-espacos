-- Criação da tabela de espaços (spaces)
create table spaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criação da tabela de agendamentos (schedules)
create table schedules (
  id uuid default gen_random_uuid() primary key,
  space_id uuid references spaces(id) on delete cascade not null,
  professor_name text not null,
  user_id uuid references auth.users(id) not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criação da tabela de equipamentos (equipments)
create table equipments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criação da tabela de agendamentos de equipamentos (equipment_schedules)
create table equipment_schedules (
  id uuid default gen_random_uuid() primary key,
  equipment_id uuid references equipments(id) on delete cascade not null,
  professor_name text not null,
  user_id uuid references auth.users(id) not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Adicionando políticas de segurança (RLS - Row Level Security)
-- Para este exemplo simples, permitiremos acesso público a tudo.
-- Em produção, você deve restringir isso a usuários autenticados.

alter table spaces enable row level security;
alter table schedules enable row level security;
alter table equipments enable row level security;
alter table equipment_schedules enable row level security;

create policy "Permitir leitura de espaços para todos" on spaces for select using (true);
create policy "Permitir inserção de espaços para todos" on spaces for insert with check (true);
create policy "Permitir atualização de espaços para todos" on spaces for update using (true);
create policy "Permitir deleção de espaços para todos" on spaces for delete using (true);

create policy "Permitir leitura de agendamentos para todos" on schedules for select using (true);
create policy "Permitir inserção de agendamentos para todos" on schedules for insert with check (true);
create policy "Permitir atualização de agendamentos para todos" on schedules for update using (true);
create policy "Permitir deleção de agendamentos para todos" on schedules for delete using (true);

create policy "Permitir leitura de equipamentos para todos" on equipments for select using (true);
create policy "Permitir inserção de equipamentos para todos" on equipments for insert with check (true);
create policy "Permitir atualização de equipamentos para todos" on equipments for update using (true);
create policy "Permitir deleção de equipamentos para todos" on equipments for delete using (true);

create policy "Permitir leitura de agendamentos de equipamentos para todos" on equipment_schedules for select using (true);
create policy "Permitir inserção de agendamentos de equipamentos para todos" on equipment_schedules for insert with check (true);
create policy "Permitir atualização de agendamentos de equipamentos para todos" on equipment_schedules for update using (true);
create policy "Permitir deleção de agendamentos de equipamentos para todos" on equipment_schedules for delete using (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table
  spaces,
  schedules,
  equipments,
  equipment_schedules
to anon, authenticated;

notify pgrst, 'reload schema';
