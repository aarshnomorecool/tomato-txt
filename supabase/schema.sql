-- ==========================================================
-- Tomato Chat — Complete Database Schema
-- Run this ENTIRE file in Supabase SQL Editor (one shot)
-- ==========================================================

create extension if not exists pgcrypto;

-- ==========================================================
-- 1. PROFILES
-- ==========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null,
  avatar_url text,
  pin_code text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- If table already exists, add new columns safely
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'pin_code'
  ) then
    alter table public.profiles add column pin_code text;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'is_admin'
  ) then
    alter table public.profiles add column is_admin boolean not null default false;
  end if;
end $$;

-- ==========================================================
-- 2. TRIGGER: Auto-create profile on signup
-- ==========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_username text;
begin
  safe_username := lower(
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      split_part(new.email, '@', 1)
    )
  );

  insert into public.profiles (id, username, email, avatar_url, pin_code)
  values (
    new.id,
    safe_username,
    new.email,
    'https://api.dicebear.com/9.x/initials/svg?seed=' || safe_username,
    coalesce(new.raw_user_meta_data->>'pin_code', null)
  )
  on conflict (id) do update
  set
    username = excluded.username,
    email = excluded.email,
    avatar_url = excluded.avatar_url,
    pin_code = coalesce(excluded.pin_code, profiles.pin_code);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================================
-- 3. MESSAGES
-- ==========================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  content text,
  image_url text,
  is_seen boolean not null default false,
  created_at timestamptz not null default now(),
  constraint message_has_content_or_image check (content is not null or image_url is not null)
);

-- ==========================================================
-- 4. CONVERSATIONS
-- ==========================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references auth.users(id) on delete cascade,
  user2_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint users_must_be_different check (user1_id <> user2_id)
);

create unique index if not exists conversations_pair_unique
  on public.conversations (least(user1_id, user2_id), greatest(user1_id, user2_id));

-- ==========================================================
-- 5. FRIEND REQUESTS
-- ==========================================================
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cannot_friend_self check (sender_id <> receiver_id)
);

-- Prevent duplicate pending/accepted requests between the same pair
create unique index if not exists friend_requests_pair_unique
  on public.friend_requests (
    least(sender_id, receiver_id),
    greatest(sender_id, receiver_id)
  )
  where status in ('pending', 'accepted');

-- ==========================================================
-- 6. ROW LEVEL SECURITY
-- ==========================================================
alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.conversations enable row level security;
alter table public.friend_requests enable row level security;

-- Drop existing policies first to avoid conflicts on re-run
do $$
begin
  -- Profiles
  drop policy if exists "profiles are readable by authenticated users" on public.profiles;
  drop policy if exists "users can update own profile" on public.profiles;
  -- Conversations
  drop policy if exists "users can read own conversations" on public.conversations;
  drop policy if exists "users can create conversations they participate in" on public.conversations;
  -- Messages
  drop policy if exists "users can read own messages" on public.messages;
  drop policy if exists "users can send messages" on public.messages;
  drop policy if exists "recipient can mark messages as seen" on public.messages;
  -- Friend Requests
  drop policy if exists "users can read their own friend requests" on public.friend_requests;
  drop policy if exists "users can send friend requests" on public.friend_requests;
  drop policy if exists "users can update friend requests they received" on public.friend_requests;
  drop policy if exists "users can delete friend requests they are part of" on public.friend_requests;
end $$;

-- Profiles policies
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Conversations policies
create policy "users can read own conversations"
  on public.conversations for select
  to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "users can create conversations they participate in"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- Messages policies
create policy "users can read own messages"
  on public.messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "users can send messages"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy "recipient can mark messages as seen"
  on public.messages for update
  to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Friend Requests policies
create policy "users can read their own friend requests"
  on public.friend_requests for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "users can send friend requests"
  on public.friend_requests for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy "users can update friend requests they received"
  on public.friend_requests for update
  to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

create policy "users can delete friend requests they are part of"
  on public.friend_requests for delete
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- ==========================================================
-- 7. STORAGE
-- ==========================================================
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

do $$
begin
  drop policy if exists "chat images are publicly readable" on storage.objects;
  drop policy if exists "authenticated users can upload chat images" on storage.objects;
end $$;

create policy "chat images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'chat-images');

create policy "authenticated users can upload chat images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'chat-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ==========================================================
-- 8. REALTIME (enable for messages and friend_requests)
-- ==========================================================
-- These may fail if already added — that's fine, ignore errors
do $$
begin
  execute 'alter publication supabase_realtime add table public.messages';
exception when others then
  null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.friend_requests';
exception when others then
  null;
end $$;

-- ==========================================================
-- 9. SET ADMIN: aarshc6444@gmail.com
-- ==========================================================
update public.profiles
set is_admin = true
where email = 'aarshc6444@gmail.com';
