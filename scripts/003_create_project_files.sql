-- Create project files table for storing research materials
create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  file_name text not null,
  file_size integer,
  file_type text,
  file_path text,
  category text default 'other', -- 'script', 'screener', 'stimuli', 'assignment'
  parsed_tasks integer,
  participant_count integer,
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);

create index if not exists idx_project_files_project_id on public.project_files(project_id);
create index if not exists idx_project_files_category on public.project_files(category);
