-- 工时体系：任务（dw_work_tasks）挂着工时记录（dw_work_logs）。
-- 工时以分钟为单位存储，避免小数小时在累计时产生浮点误差。
-- 幂等：重复执行不报错，已存在的表不会被改动。

create extension if not exists pgcrypto;

-- 迁移可能先于 schema.sql 执行，这里重复声明一次，保证脚本可独立运行。
create or replace function public.dw_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
comment on column public.dw_work_logs.work_date is '工时归属的自然日，用于按天 / 按周汇总';

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
