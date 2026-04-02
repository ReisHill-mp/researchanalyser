-- Add usertesting_url column to projects table
alter table public.projects 
add column if not exists usertesting_url text;
