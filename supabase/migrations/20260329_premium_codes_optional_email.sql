-- Upgrade path: allow one-shot premium codes not tied to an email.
-- Safe to run after 20260327_auth_premium.sql.

alter table public.premium_codes
  alter column email drop not null;

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

  -- If email is set, code is reserved for that account.
  -- If email is null, the code is open one-shot and can be redeemed by any authenticated user once.
  if target_code.email is not null and lower(target_code.email) <> current_email then
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
