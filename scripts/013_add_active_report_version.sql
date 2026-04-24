alter table public.projects
  add column if not exists active_report_version_id uuid references public.report_versions(id) on delete set null;
