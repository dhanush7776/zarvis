-- ============================================================================
-- Zarvis — initial schema
-- Tables: profiles, conversations, messages, memories, documents, images,
--         settings, subscriptions, voice_logs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Safety reset: this migration is meant to run once against a fresh project,
-- but SQL editors let you re-run scripts after a partial failure. Dropping
-- everything first means a rerun always produces the exact schema below,
-- instead of silently keeping an old/incomplete table shape from a prior
-- partial run (which is what "create table if not exists" would otherwise do).
-- ----------------------------------------------------------------------------
drop table if exists public.voice_logs cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.settings cascade;
drop table if exists public.images cascade;
drop table if exists public.documents cascade;
drop table if exists public.memories cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.profiles cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.touch_conversation_on_message() cascade;
drop function if exists public.match_documents(vector, uuid, int) cascade;
drop function if exists public.set_updated_at() cascade;

create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- ----------------------------------------------------------------------------
-- Utility: updated_at trigger function
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile + default settings + free subscription on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan, status) values (new.id, 'free', 'active')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- conversations
-- ----------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New conversation',
  is_pinned boolean not null default false,
  mode text not null default 'chat',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_conversations_user_id on public.conversations (user_id);
create index if not exists idx_conversations_user_updated on public.conversations (user_id, updated_at desc);
create index if not exists idx_conversations_pinned on public.conversations (user_id, is_pinned);

create trigger trg_conversations_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- messages
-- ----------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  attachments jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_messages_conversation_id on public.messages (conversation_id, created_at);
create index if not exists idx_messages_user_id on public.messages (user_id);

-- Bump the parent conversation's updated_at (and auto-title it) on new messages
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations
  set updated_at = timezone('utc', now()),
      title = case
        when title = 'New conversation' and new.role = 'user'
          then left(regexp_replace(new.content, '\s+', ' ', 'g'), 60)
        else title
      end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger trg_messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- ----------------------------------------------------------------------------
-- memories
-- ----------------------------------------------------------------------------
create table if not exists public.memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  category text not null default 'general',
  importance smallint not null default 3 check (importance between 1 and 5),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_memories_user_id on public.memories (user_id, created_at desc);
create index if not exists idx_memories_category on public.memories (user_id, category);

create trigger trg_memories_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- documents  (pdf uploads, extracted text + embedding for semantic search)
-- ----------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  content_text text,
  embedding vector(1024),
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_documents_user_id on public.documents (user_id, created_at desc);
create index if not exists idx_documents_embedding on public.documents
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- Semantic search RPC: returns the user's documents ranked by cosine similarity
create or replace function public.match_documents(
  query_embedding vector(1024),
  match_user_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  name text,
  content_text text,
  similarity float
)
language sql stable
as $$
  select
    d.id,
    d.name,
    d.content_text,
    1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.user_id = match_user_id
    and d.embedding is not null
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- ----------------------------------------------------------------------------
-- images
-- ----------------------------------------------------------------------------
create table if not exists public.images (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  analysis text,
  ocr_text text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_images_user_id on public.images (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- settings (one row per user)
-- ----------------------------------------------------------------------------
create table if not exists public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'dark',
  language text not null default 'en',
  voice_name text not null default 'default',
  wake_mode_enabled boolean not null default true,
  wake_word text not null default 'hey zarvis',
  clap_detection_enabled boolean not null default true,
  clap_sensitivity smallint not null default 5 check (clap_sensitivity between 1 and 10),
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- subscriptions
-- ----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'ultra')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due')),
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_subscriptions_user_id on public.subscriptions (user_id);

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- voice_logs
-- ----------------------------------------------------------------------------
create table if not exists public.voice_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trigger text not null check (trigger in ('wake_word', 'double_clap', 'manual')),
  transcript text,
  response text,
  duration_ms integer,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_voice_logs_user_id on public.voice_logs (user_id, created_at desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.documents enable row level security;
alter table public.images enable row level security;
alter table public.settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.voice_logs enable row level security;

-- profiles: a user can read/update only their own row
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- conversations
create policy "conversations_select_own" on public.conversations for select using (auth.uid() = user_id);
create policy "conversations_insert_own" on public.conversations for insert with check (auth.uid() = user_id);
create policy "conversations_update_own" on public.conversations for update using (auth.uid() = user_id);
create policy "conversations_delete_own" on public.conversations for delete using (auth.uid() = user_id);

-- messages
create policy "messages_select_own" on public.messages for select using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages for insert with check (auth.uid() = user_id);
create policy "messages_update_own" on public.messages for update using (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages for delete using (auth.uid() = user_id);

-- memories
create policy "memories_select_own" on public.memories for select using (auth.uid() = user_id);
create policy "memories_insert_own" on public.memories for insert with check (auth.uid() = user_id);
create policy "memories_update_own" on public.memories for update using (auth.uid() = user_id);
create policy "memories_delete_own" on public.memories for delete using (auth.uid() = user_id);

-- documents
create policy "documents_select_own" on public.documents for select using (auth.uid() = user_id);
create policy "documents_insert_own" on public.documents for insert with check (auth.uid() = user_id);
create policy "documents_update_own" on public.documents for update using (auth.uid() = user_id);
create policy "documents_delete_own" on public.documents for delete using (auth.uid() = user_id);

-- images
create policy "images_select_own" on public.images for select using (auth.uid() = user_id);
create policy "images_insert_own" on public.images for insert with check (auth.uid() = user_id);
create policy "images_update_own" on public.images for update using (auth.uid() = user_id);
create policy "images_delete_own" on public.images for delete using (auth.uid() = user_id);

-- settings
create policy "settings_select_own" on public.settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on public.settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.settings for update using (auth.uid() = user_id);

-- subscriptions
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
create policy "subscriptions_update_own" on public.subscriptions for update using (auth.uid() = user_id);

-- voice_logs
create policy "voice_logs_select_own" on public.voice_logs for select using (auth.uid() = user_id);
create policy "voice_logs_insert_own" on public.voice_logs for insert with check (auth.uid() = user_id);
create policy "voice_logs_delete_own" on public.voice_logs for delete using (auth.uid() = user_id);

-- ============================================================================
-- Storage buckets (documents + images)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('images', 'images', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "documents_storage_own"
  on storage.objects for all
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "images_storage_own"
  on storage.objects for all
  using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_storage_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_storage_write_own"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatars_storage_update_own"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- Realtime
-- ============================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
