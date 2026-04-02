-- Add test_script and is_ab_comparison columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS test_script TEXT;

ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS is_ab_comparison BOOLEAN DEFAULT false;
