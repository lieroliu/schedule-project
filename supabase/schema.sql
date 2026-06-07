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

-- 使用者排程（日期 + 時段 + 備註）
create table if not exists busy_dates (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  date date not null,
  note text,
  start_time time,
  end_time time,
  unique(participant_id, date)
);

create index if not exists idx_busy_dates_room on busy_dates(room_id);
create index if not exists idx_participants_room on participants(room_id);

-- 約定排程（從空檔時段建立的共同約會）
create table if not exists agreed_slots (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references rooms(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  title text,
  created_by uuid references participants(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_agreed_slots_room on agreed_slots(room_id);

-- 啟用 Realtime
alter publication supabase_realtime add table busy_dates;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table agreed_slots;

-- Row Level Security（公開讀寫，適合協作工具）
alter table rooms enable row level security;
alter table participants enable row level security;
alter table busy_dates enable row level security;
alter table agreed_slots enable row level security;

create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);

create policy "participants_select" on participants for select using (true);
create policy "participants_insert" on participants for insert with check (true);

create policy "busy_dates_select" on busy_dates for select using (true);
create policy "busy_dates_insert" on busy_dates for insert with check (true);
create policy "busy_dates_delete" on busy_dates for delete using (true);
create policy "busy_dates_update" on busy_dates for update using (true);
create policy "participants_update" on participants for update using (true);

create policy "agreed_slots_select" on agreed_slots for select using (true);
create policy "agreed_slots_insert" on agreed_slots for insert with check (true);
create policy "agreed_slots_delete" on agreed_slots for delete using (true);

-- 若已建立舊版資料表，執行以下 migration：
-- alter table busy_dates add column if not exists note text;
-- alter table busy_dates add column if not exists start_time time;
-- alter table busy_dates add column if not exists end_time time;
-- create table if not exists agreed_slots (...);  -- 見上方完整定義
