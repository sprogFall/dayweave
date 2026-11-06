-- Dayweave 基础数据库结构（幂等，可重复执行）
-- 所有对象统一使用 dw_ 前缀：同一个 Supabase 项目会被多个应用共用，无前缀的名字会互相冲突。
-- 当前仅包含账号资料，业务表请在后续功能中通过 migrations 增量添加。
-- 所有用户数据表都必须启用 RLS，并以 auth.uid() 作为权限边界。

create extension if not exists pgcrypto;

create table if not exists public.dw_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dw_profiles is '用户公开资料，一人一行，由 auth.users 自动创建';

create or replace function public.dw_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dw_profiles_set_updated_at on public.dw_profiles;
create trigger dw_profiles_set_updated_at
before update on public.dw_profiles
for each row execute function public.dw_set_updated_at();

-- 注册时自动建立资料。display_name 优先取注册表单传入的 metadata。
-- 触发器名同样带前缀：共用同一个库时，其他项目的 auth.users 触发器不会被误删。
create or replace function public.dw_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.dw_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists dw_on_auth_user_created on auth.users;
create trigger dw_on_auth_user_created
after insert on auth.users
for each row execute function public.dw_handle_new_user();

alter table public.dw_profiles enable row level security;

drop policy if exists "dw_profiles_select_own" on public.dw_profiles;
create policy "dw_profiles_select_own"
on public.dw_profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "dw_profiles_insert_own" on public.dw_profiles;
create policy "dw_profiles_insert_own"
on public.dw_profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "dw_profiles_update_own" on public.dw_profiles;
create policy "dw_profiles_update_own"
on public.dw_profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

grant select, insert, update on public.dw_profiles to authenticated;

-- 工时任务：预计工时、时间范围与完成状态。
create table if not exists public.dw_work_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  start_date date not null default current_date,
  due_date date not null default current_date,
  status text not null default 'open' check (status in ('open', 'done')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dw_work_tasks_range_key check (due_date >= start_date)
);

comment on table public.dw_work_tasks is '工时任务：预计工时、时间范围与完成状态';
comment on column public.dw_work_tasks.estimated_minutes is '预计工时，分钟；0 表示未估';

create index if not exists dw_work_tasks_user_status_idx
  on public.dw_work_tasks (user_id, status, due_date);

drop trigger if exists dw_work_tasks_set_updated_at on public.dw_work_tasks;
create trigger dw_work_tasks_set_updated_at
before update on public.dw_work_tasks
for each row execute function public.dw_set_updated_at();

-- 工时记录：挂在任务下，分钟单位；删任务时级联删除。
create table if not exists public.dw_work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.dw_work_tasks(id) on delete cascade,
  content text not null default '',
  minutes integer not null check (minutes > 0 and minutes <= 1440),
  work_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dw_work_logs is '挂在任务下的工时记录；删任务时级联删除';
comment on column public.dw_work_logs.minutes is '本次花费的分钟数，单条上限 24 小时';

create index if not exists dw_work_logs_user_date_idx
  on public.dw_work_logs (user_id, work_date desc);

create index if not exists dw_work_logs_task_idx
  on public.dw_work_logs (task_id);

drop trigger if exists dw_work_logs_set_updated_at on public.dw_work_logs;
create trigger dw_work_logs_set_updated_at
before update on public.dw_work_logs
for each row execute function public.dw_set_updated_at();

alter table public.dw_work_tasks enable row level security;
alter table public.dw_work_logs enable row level security;

drop policy if exists "dw_work_tasks_select_own" on public.dw_work_tasks;
create policy "dw_work_tasks_select_own"
on public.dw_work_tasks for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "dw_work_tasks_insert_own" on public.dw_work_tasks;
create policy "dw_work_tasks_insert_own"
on public.dw_work_tasks for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "dw_work_tasks_update_own" on public.dw_work_tasks;
create policy "dw_work_tasks_update_own"
on public.dw_work_tasks for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "dw_work_tasks_delete_own" on public.dw_work_tasks;
create policy "dw_work_tasks_delete_own"
on public.dw_work_tasks for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "dw_work_logs_select_own" on public.dw_work_logs;
create policy "dw_work_logs_select_own"
on public.dw_work_logs for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "dw_work_logs_insert_own" on public.dw_work_logs;
create policy "dw_work_logs_insert_own"
on public.dw_work_logs for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "dw_work_logs_update_own" on public.dw_work_logs;
create policy "dw_work_logs_update_own"
on public.dw_work_logs for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "dw_work_logs_delete_own" on public.dw_work_logs;
create policy "dw_work_logs_delete_own"
on public.dw_work_logs for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.dw_work_tasks to authenticated;
grant select, insert, update, delete on public.dw_work_logs to authenticated;

-- 后续功能示例：
-- 1. 新表命名 dw_<业务>，必须 create table + enable row level security + policy；
-- 2. 策略 / 触发器 / 函数一并带 dw_ 前缀；
-- 3. 需要实时同步的表加入 supabase_realtime publication；
-- 4. 每个变更同时写入 supabase/migrations/<timestamp>_<name>.sql 并同步本文件。
