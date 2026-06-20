-- Выполни это в Supabase → SQL Editor → New query → Run
-- Создаёт таблицу для результатов викторины.

create table if not exists results (
  id bigint generated always as identity primary key,
  name text not null,
  score int not null,
  total int not null,
  created_at timestamptz default now()
);

-- Разрешаем доступ через anon-ключ (для простоты праздничного проекта).
alter table results enable row level security;

create policy "anyone can insert" on results
  for insert to anon with check (true);

create policy "anyone can read" on results
  for select to anon using (true);
