-- 共同空檔日曆：Supabase 資料表結構
-- 在 Supabase Dashboard > SQL Editor 執行此腳本

create extension if not exists "pgcrypto";

-- 排程房間
create table if not exists rooms (
  id text primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now()
);

-- 參與者
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz default now()
);

-- 使用者排程（沒空日期 + 備註）
create table if not exists busy_dates (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  date date not null,
  note text,
  unique(participant_id, date)
);

create index if not exists idx_busy_dates_room on busy_dates(room_id);
create index if not exists idx_participants_room on participants(room_id);

-- 啟用 Realtime
alter publication supabase_realtime add table busy_dates;
alter publication supabase_realtime add table participants;

-- Row Level Security（公開讀寫，適合協作工具）
alter table rooms enable row level security;
alter table participants enable row level security;
alter table busy_dates enable row level security;

create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);

create policy "participants_select" on participants for select using (true);
create policy "participants_insert" on participants for insert with check (true);

create policy "busy_dates_select" on busy_dates for select using (true);
create policy "busy_dates_insert" on busy_dates for insert with check (true);
create policy "busy_dates_delete" on busy_dates for delete using (true);
create policy "busy_dates_update" on busy_dates for update using (true);
create policy "participants_update" on participants for update using (true);

-- 若已建立舊版資料表，執行以下 migration：
-- alter table busy_dates add column if not exists note text;
