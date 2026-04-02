-- Create findings table
create table if not exists public.findings (
  id uuid default gen_random_uuid() primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null check (type in ('pain-point', 'delighter', 'insight', 'recommendation')),
  title text not null,
  description text,
  severity text check (severity in ('critical', 'major', 'minor')),
  participant_count integer default 0,
  conditions text[] default '{}',
  tags text[] default '{}',
  created_at timestamp with time zone default current_timestamp,
  updated_at timestamp with time zone default current_timestamp
);

-- Create index for findings by project
create index if not exists idx_findings_project_id on public.findings(project_id);
create index if not exists idx_findings_type on public.findings(type);
