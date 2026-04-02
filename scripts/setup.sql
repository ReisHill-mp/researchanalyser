-- Create projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  study_name text not null,
  description text,
  study_type text not null,
  status text not null default 'draft',
  participant_count integer default 0,
  tags text[] default '{}',
  team text[] default '{}',
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);

-- Create transcripts table
create table if not exists public.transcripts (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  session_id text not null,
  transcript text,
  created_at timestamp with time zone default current_timestamp
);

-- Create indexes for common queries
create index if not exists idx_projects_updated_at on public.projects(updated_at desc);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_transcripts_project_id on public.transcripts(project_id);
