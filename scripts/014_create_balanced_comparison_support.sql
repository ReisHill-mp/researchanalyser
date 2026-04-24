create table if not exists public.balanced_comparison_assignments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  participant_id text not null,
  order_label text not null check (order_label in ('A-B', 'B-A')),
  created_at timestamp with time zone default current_timestamp,
  unique (project_id, participant_id)
);

alter table public.analysis_questions
  add column if not exists feedback_group text;
