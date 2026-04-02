alter table public.import_runs
  add column if not exists current_step text,
  add column if not exists current_user text,
  add column if not exists progress_log jsonb default '[]'::jsonb;
