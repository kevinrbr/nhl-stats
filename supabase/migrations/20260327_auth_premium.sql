-- Required for hashing premium codes.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  is_premium boolean not null default false,
  premium_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.premium_codes (
  id bigserial primary key,
  email text not null,
  code_hash text not null unique,
  duration_days integer not null default 30 check (duration_days > 0),
  expires_at timestamptz,
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.premium_codes enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (
    id = auth.uid()
    and coalesce(is_premium, false) = false
    and premium_until is null
  );

-- Prevent direct privilege escalation from client-side calls.
revoke update, delete on table public.profiles from anon, authenticated;

-- No direct read access on premium codes.
revoke all on table public.premium_codes from anon, authenticated;

create or replace function public.redeem_premium_code(input_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_uid uuid;
  current_email text;
  normalized_code text;
  target_code public.premium_codes%rowtype;
  new_premium_until timestamptz;
begin
  current_uid := auth.uid();
  if current_uid is null then
    return jsonb_build_object('success', false, 'message', 'Authentication required');
  end if;

  current_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if current_email = '' then
    return jsonb_build_object('success', false, 'message', 'Email claim missing');
  end if;

  normalized_code := trim(coalesce(input_code, ''));
  if normalized_code = '' then
    return jsonb_build_object('success', false, 'message', 'Code required');
  end if;

  select *
  into target_code
  from public.premium_codes
  where code_hash = encode(extensions.digest(normalized_code, 'sha256'), 'hex')
  for update;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Invalid code');
  end if;

  if target_code.redeemed_by is not null then
    return jsonb_build_object('success', false, 'message', 'Code already used');
  end if;

  if target_code.expires_at is not null and target_code.expires_at < now() then
    return jsonb_build_object('success', false, 'message', 'Code expired');
  end if;

  if lower(target_code.email) <> current_email then
    return jsonb_build_object('success', false, 'message', 'Code not valid for this email');
  end if;

  update public.premium_codes
  set redeemed_by = current_uid,
      redeemed_at = now()
  where id = target_code.id;

  insert into public.profiles (id, email, is_premium, premium_until, updated_at)
  values (
    current_uid,
    current_email,
    true,
    now() + make_interval(days => target_code.duration_days),
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        is_premium = true,
        premium_until = (
          case
            when public.profiles.premium_until is null or public.profiles.premium_until < now()
              then now()
            else public.profiles.premium_until
          end
        ) + make_interval(days => target_code.duration_days),
        updated_at = now()
  returning premium_until into new_premium_until;

  return jsonb_build_object(
    'success', true,
    'message', 'Premium access activated',
    'premium_until', new_premium_until
  );
end;
$$;

revoke all on function public.redeem_premium_code(text) from public;
grant execute on function public.redeem_premium_code(text) to authenticated;

-- Example insertion (manual admin use):
-- insert into public.premium_codes (email, code_hash, duration_days, expires_at)
-- values (
--   'user@example.com',
--   encode(extensions.digest('MY-ONE-TIME-CODE', 'sha256'), 'hex'),
--   30,
--   now() + interval '60 days'
-- );
