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

-- 后续功能示例：
-- 1. 新表命名 dw_<业务>，必须 create table + enable row level security + policy；
-- 2. 策略 / 触发器 / 函数一并带 dw_ 前缀；
-- 3. 需要实时同步的表加入 supabase_realtime publication；
-- 4. 每个变更同时写入 supabase/migrations/<timestamp>_<name>.sql 并同步本文件。
