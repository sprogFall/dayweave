-- 共享基础表与 RPC 由 family-piggy 管理；必须先部署其 schema 与家庭管理迁移。
-- 本迁移不复制共享 schema、不改其 RLS / grants / RPC，不操作远端。
-- 安全注意：既有 family_members INSERT 策略只检查 user_id = auth.uid()，
-- 缺少邀请码/owner 授权校验，存在自行加入任意家庭的风险；需与 family-piggy 另行协调修复。
-- Dayweave 本次只读取家庭并调用 owner rename_family，不开放创建/加入/解散。
begin;

do $$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.families') is null
     or to_regclass('public.family_members') is null
     or to_regprocedure('public.rename_family(uuid,text)') is null then
    raise exception '请先部署 family-piggy 共享 profiles/families/family_members 及 rename_family RPC';
  end if;
end;
$$;

-- 阻止资料搬迁与旧注册触发器移除之间出现新用户，整个过程在同一事务内完成。
lock table auth.users in share row exclusive mode;

do $$
begin
  if to_regclass('public.dw_profiles') is not null then
    -- 同时阻止旧客户端在复制后、删表前写入未迁移资料。
    lock table public.dw_profiles in access exclusive mode;
    -- 先搬历史资料；已有共享资料绝不被 INSERT 覆盖。
    insert into public.profiles (id, nickname, avatar_url, created_at, updated_at)
    select id, display_name, avatar_url, created_at, updated_at
    from public.dw_profiles
    on conflict (id) do nothing;

    -- 仅补共享空值，不覆盖任何非空共享昵称/头像；不做无变化 UPDATE。
    update public.profiles p
    set nickname = case when nullif(btrim(p.nickname), '') is null
                         then coalesce(nullif(btrim(d.display_name), ''), p.nickname)
                         else p.nickname end,
        avatar_url = case when nullif(btrim(p.avatar_url), '') is null
                          then coalesce(nullif(btrim(d.avatar_url), ''), p.avatar_url)
                          else p.avatar_url end
    from public.dw_profiles d
    where p.id = d.id
      and ((nullif(btrim(p.nickname), '') is null and nullif(btrim(d.display_name), '') is not null)
        or (nullif(btrim(p.avatar_url), '') is null and nullif(btrim(d.avatar_url), '') is not null));

    if exists (
      select 1 from public.dw_profiles d
      where not exists (select 1 from public.profiles p where p.id = d.id)
    ) then
      raise exception '历史资料尚未完整迁入共享 profiles，拒绝移除 dw_profiles';
    end if;
  end if;
end;
$$;

-- 按 auth user id 补齐全部缺失行；已有共享资料（包括空值）不由 metadata 覆盖。
insert into public.profiles (id, nickname, created_at, updated_at)
select id,
       coalesce(nullif(btrim(raw_user_meta_data ->> 'nickname'), ''),
                nullif(btrim(raw_user_meta_data ->> 'display_name'), ''),
                nullif(split_part(email, '@', 1), ''), '用户'),
       coalesce(created_at, now()), coalesce(updated_at, created_at, now())
from auth.users
on conflict (id) do nothing;

-- 先确保资料迁移成功，最后移除 Dayweave 旧触发器/函数/表；不用 CASCADE 隐式删除未知依赖。
drop trigger if exists dw_on_auth_user_created on auth.users;
drop function if exists public.dw_handle_new_user();
do $$
begin
  if to_regclass('public.dw_profiles') is not null then
    drop trigger if exists dw_profiles_set_updated_at on public.dw_profiles;
    drop table public.dw_profiles;
  end if;
end;
$$;
-- public.dw_set_updated_at 仍供 dw_work_tasks / dw_work_logs 使用，必须保留。
commit;
