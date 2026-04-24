create table if not exists public.report_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  analysis_run_id uuid references public.analysis_runs(id) on delete set null,
  generation_mode text not null default 'deterministic',
  model text,
  prompt text not null,
  report_json jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default current_timestamp
);

create index if not exists idx_report_versions_project on public.report_versions(project_id, created_at desc);
