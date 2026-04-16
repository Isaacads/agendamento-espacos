-- 1. Tabela de perfis para armazenar nome e cargo (role) dos usuários
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text default 'professor' not null
);

-- 2. Habilitar RLS e adicionar políticas
alter table profiles enable row level security;

create policy "Perfis são visíveis para todos os usuários" on profiles for select using (true);
create policy "Usuários podem atualizar seu próprio perfil" on profiles for update using (auth.uid() = id);
create policy "Usuários podem inserir seu próprio perfil" on profiles for insert with check (auth.uid() = id);

-- 3. Atualizar a tabela de schedules (agendamentos) para usar o ID do professor em vez do nome digitado
-- (Se houver dados na tabela, é mais seguro limpar antes de aplicar essa restrição)
delete from schedules;

alter table schedules drop column professor_name;
alter table schedules add column user_id uuid references profiles(id) not null;

-- Atualizar as políticas de schedules para que apenas usuários logados possam inserir e deletar
drop policy if exists "Permitir inserção de agendamentos para todos" on schedules;
create policy "Apenas o dono pode inserir agendamento" on schedules for insert with check (auth.uid() = user_id);

drop policy if exists "Permitir deleção de agendamentos para todos" on schedules;
create policy "Apenas o dono pode deletar seu agendamento" on schedules for delete using (auth.uid() = user_id);
