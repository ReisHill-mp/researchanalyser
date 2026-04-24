-- Lock project data to server-side access only.
-- The app reads and writes these tables through Next.js API routes using the
-- service role key, so browser roles do not need direct table access.

alter table public.projects enable row level security;
alter table public.findings enable row level security;
alter table public.project_files enable row level security;
alter table public.transcripts enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.analysis_questions enable row level security;
alter table public.condition_summaries enable row level security;
alter table public.sessions enable row level security;
alter table public.import_runs enable row level security;
alter table public.report_versions enable row level security;
alter table public.balanced_comparison_assignments enable row level security;

revoke all on table public.projects from anon, authenticated;
revoke all on table public.findings from anon, authenticated;
revoke all on table public.project_files from anon, authenticated;
revoke all on table public.transcripts from anon, authenticated;
revoke all on table public.analysis_runs from anon, authenticated;
revoke all on table public.analysis_questions from anon, authenticated;
revoke all on table public.condition_summaries from anon, authenticated;
revoke all on table public.sessions from anon, authenticated;
revoke all on table public.import_runs from anon, authenticated;
revoke all on table public.report_versions from anon, authenticated;
revoke all on table public.balanced_comparison_assignments from anon, authenticated;
