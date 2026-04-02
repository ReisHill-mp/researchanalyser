-- Enhance transcripts table to support participant/condition tracking
alter table public.transcripts add column if not exists participant_id text;
alter table public.transcripts add column if not exists condition text;
alter table public.transcripts add column if not exists expected_order integer;
alter table public.transcripts add column if not exists actual_order integer;
alter table public.transcripts add column if not exists completion text default 'complete';
alter table public.transcripts add column if not exists status text default 'mapped';
alter table public.transcripts add column if not exists excluded boolean default false;
alter table public.transcripts add column if not exists validation_flags text[] default '{}';

create index if not exists idx_transcripts_participant_id on public.transcripts(participant_id);
create index if not exists idx_transcripts_condition on public.transcripts(condition);
