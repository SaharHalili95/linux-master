-- Accounts and synced progress. See docs/superpowers/specs/2026-11-08-accounts-sync-design.md.
-- Progress is keyed by our own learner id, so the sign-in provider can change later.
create table public.learners (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.progress (
  learner_id uuid primary key references public.learners (id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (pg_column_size(state) < 65536),
  updated_at timestamptz not null default now()
);

alter table public.learners enable row level security;
alter table public.progress enable row level security;

create policy "read own learner" on public.learners for select to authenticated
  using (auth_user_id = (select auth.uid()));
create policy "read own progress" on public.progress for select to authenticated
  using (learner_id in (select id from public.learners where auth_user_id = (select auth.uid())));
create policy "update own progress" on public.progress for update to authenticated
  using (learner_id in (select id from public.learners where auth_user_id = (select auth.uid())))
  with check (learner_id in (select id from public.learners where auth_user_id = (select auth.uid())));

revoke all on public.learners, public.progress from anon, authenticated;
grant select on public.learners to authenticated;
grant select, update (state) on public.progress to authenticated;

-- The rows are created here, not by the app, so a learner can never make a row for someone else.
create function public.create_learner() returns trigger language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  insert into public.learners (auth_user_id) values (new.id) returning id into new_id;
  insert into public.progress (learner_id) values (new_id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_learner();

create function public.touch_progress() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger progress_touched before update on public.progress for each row execute function public.touch_progress();

-- Apple requires deleting the whole account from inside the app. The cascade removes the learner and the progress.
create function public.delete_my_account() returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke execute on function public.create_learner(), public.delete_my_account() from public, anon, authenticated;
grant execute on function public.delete_my_account() to authenticated;
