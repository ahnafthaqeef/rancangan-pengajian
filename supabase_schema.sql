-- Rancangan Pengajian Harian — Supabase Schema
-- Run this in your Supabase SQL editor

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  subject text not null,
  objective text not null,
  created_at timestamptz default now(),
  unique(user_id, date, subject)
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade not null,
  title text not null,
  done boolean default false,
  done_at timestamptz,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- RLS
alter table plans enable row level security;
alter table activities enable row level security;

create policy "users manage own plans" on plans
  for all using (auth.uid() = user_id);

create policy "users manage activities of own plans" on activities
  for all using (
    exists (select 1 from plans where plans.id = activities.plan_id and plans.user_id = auth.uid())
  );
