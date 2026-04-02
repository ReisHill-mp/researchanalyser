-- Analysis runs table to store AI analysis for projects
create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text default 'pending',
  model_version text,
  prompt_version text,
  created_at timestamp with time zone default current_timestamp,
  completed_at timestamp with time zone
);

-- Analysis questions table for question-by-question breakdown
create table if not exists public.analysis_questions (
  id uuid primary key default gen_random_uuid(),
  analysis_run_id uuid not null references public.analysis_runs(id) on delete cascade,
  question_number text not null,
  question_text text not null,
  summary text,
  key_insights jsonb default '[]',
  condition_breakdown jsonb default '{}',
  citations jsonb default '[]',
  participant_count integer default 0,
  created_at timestamp with time zone default current_timestamp
);

-- Condition summaries for analysis
create table if not exists public.condition_summaries (
  id uuid primary key default gen_random_uuid(),
  analysis_run_id uuid not null references public.analysis_runs(id) on delete cascade,
  condition_name text not null,
  summary text,
  created_at timestamp with time zone default current_timestamp
);

create index if not exists idx_analysis_runs_project on public.analysis_runs(project_id);
create index if not exists idx_analysis_questions_run on public.analysis_questions(analysis_run_id);
create index if not exists idx_condition_summaries_run on public.condition_summaries(analysis_run_id);
