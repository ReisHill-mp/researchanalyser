alter table public.analysis_runs
  add column if not exists current_step text;

alter table public.analysis_runs
  add column if not exists progress_log jsonb default '[]'::jsonb;

alter table public.analysis_runs
  add column if not exists error_message text;
