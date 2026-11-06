-- Dayweave 业务数据库结构（幂等，可重复执行）
-- 共享 profiles / families / family_members 与 rename_family RPC 由 family-piggy 管理。
-- 前置：先部署 family-piggy schema 及家庭管理迁移（含 join_family / rename_family RPC）；本文件不复制或修改其表/权限。
-- 升级旧库请先执行 20261107000000_use_shared_profiles_and_families.sql，安全迁移并移除 dw_profiles。
-- 既有 family_members INSERT 仅检查本人 user_id，可能绕过邀请码加入任意家庭；
-- 此安全问题需与 family-piggy 另行协调。客户端加入只调用 join_family 校验邀请码，不直接 INSERT 成员。

do $$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.families') is null
     or to_regclass('public.family_members') is null
     or to_regprocedure('public.rename_family(uuid,text)') is null then
    raise exception '请先部署 family-piggy 共享基础表及 rename_family RPC';
  end if;
end;
$$;

create extension if not exists pgcrypto;

-- 业务表仍使用该更新时间触发函数，不随旧资料表删除。
create or replace function public.dw_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
