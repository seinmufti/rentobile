-- Rentobile schema: profiles (username + role), listings, favorites, booking requests,
-- listing photo storage, and row-level security. Only admins can write listings.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null check (username ~ '^[a-z0-9_]{3,20}$'),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
create unique index profiles_username_key on public.profiles (lower(username));

-- True when the current request comes from an admin. security definer avoids RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile for every new auth user, using the username passed at sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin-only role changes; refuses to remove the last admin.
create or replace function public.set_user_role(target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  if new_role not in ('user', 'admin') then
    raise exception 'Invalid role %', new_role;
  end if;
  if new_role = 'user'
     and (select role from public.profiles where id = target) = 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Cannot demote the last admin';
  end if;
  update public.profiles set role = new_role where id = target;
end;
$$;

-- Lets the sign-up screen tell people a username is taken before submitting.
create or replace function public.username_available(name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(name));
$$;

alter table public.profiles enable row level security;

create policy "Profiles: read own or admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());
-- No insert/update/delete policies: profiles are created by the trigger and roles change via set_user_role().

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  title text,
  brand text,
  model text,
  year int check (year between 1950 and 2100),
  color text,
  price_per_day numeric(12, 2) check (price_per_day >= 0),
  currency text check (currency in ('USD', 'IQD')),
  location text,
  available_from date,
  available_to date,
  photos text[] not null default '{}',
  description text,
  phone text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (available_to is null or available_from is null or available_to >= available_from)
);
create index listings_created_at_idx on public.listings (created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_touch_updated_at
  before update on public.listings
  for each row execute function public.touch_updated_at();

alter table public.listings enable row level security;

create policy "Listings: anyone reads published, admins read all"
  on public.listings for select
  using (is_published or public.is_admin());
create policy "Listings: admins insert"
  on public.listings for insert
  with check (public.is_admin());
create policy "Listings: admins update"
  on public.listings for update
  using (public.is_admin())
  with check (public.is_admin());
create policy "Listings: admins delete"
  on public.listings for delete
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Favorites
-- ---------------------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "Favorites: own rows"
  on public.favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Booking requests
-- ---------------------------------------------------------------------------
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  start_date date not null,
  end_date date not null,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  check (end_date >= start_date)
);
create index booking_requests_user_idx on public.booking_requests (user_id, created_at desc);
create index booking_requests_status_idx on public.booking_requests (status, created_at desc);

alter table public.booking_requests enable row level security;

create policy "Bookings: read own or admin"
  on public.booking_requests for select
  using (user_id = auth.uid() or public.is_admin());
create policy "Bookings: users create own pending requests"
  on public.booking_requests for insert
  with check (user_id = auth.uid() and status = 'pending');
create policy "Bookings: admins update"
  on public.booking_requests for update
  using (public.is_admin())
  with check (public.is_admin());

-- Users may only cancel their own pending request; nothing else about it changes.
create or replace function public.cancel_booking(request uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.booking_requests
     set status = 'cancelled', decided_at = now()
   where id = request and user_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'Request not found or no longer pending';
  end if;
end;
$$;

-- Admin decision helper keeps decided_at consistent.
create or replace function public.decide_booking(request uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can decide bookings' using errcode = '42501';
  end if;
  if new_status not in ('approved', 'declined') then
    raise exception 'Invalid status %', new_status;
  end if;
  update public.booking_requests
     set status = new_status, decided_at = now()
   where id = request;
end;
$$;

-- Usernames on bookings for the admin screen (admins only; RLS on profiles already allows this).
create or replace view public.booking_requests_detailed
with (security_invoker = true) as
select b.*, p.username,
       l.title as listing_title, l.brand as listing_brand, l.model as listing_model,
       l.photos as listing_photos
from public.booking_requests b
left join public.profiles p on p.id = b.user_id
left join public.listings l on l.id = b.listing_id;

-- ---------------------------------------------------------------------------
-- Grants (RPCs callable by signed-in users; RLS still applies to tables)
-- ---------------------------------------------------------------------------
revoke all on function public.set_user_role(uuid, text) from public, anon;
revoke all on function public.cancel_booking(uuid) from public, anon;
revoke all on function public.decide_booking(uuid, text) from public, anon;
grant execute on function public.set_user_role(uuid, text) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.decide_booking(uuid, text) to authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant select on public.booking_requests_detailed to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: listing photos (public read, admin write)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "Listing photos: admins upload"
  on storage.objects for insert
  with check (bucket_id = 'listing-photos' and public.is_admin());
create policy "Listing photos: admins update"
  on storage.objects for update
  using (bucket_id = 'listing-photos' and public.is_admin());
create policy "Listing photos: admins delete"
  on storage.objects for delete
  using (bucket_id = 'listing-photos' and public.is_admin());
