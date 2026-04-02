-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  study_name TEXT NOT NULL,
  description TEXT,
  study_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  participant_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  team TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_transcripts_project_id ON transcripts(project_id);

-- Insert sample data from the mock data
INSERT INTO projects (id, name, study_name, description, study_type, status, participant_count, tags, team, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Q1 Checkout Optimization', 'Checkout Flow Comparison Study', 'Evaluating new streamlined checkout against current multi-step flow', 'ab-comparison', 'complete', 24, '{"checkout","conversion","q1-2024"}', '{"Sarah Chen","Mike Johnson"}', '2024-01-15T10:00:00Z', '2024-02-01T14:30:00Z'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Mobile Navigation Redesign', 'Nav Pattern Concept Test', 'Testing three navigation pattern concepts for mobile app', 'concept-test', 'validation-required', 18, '{"mobile","navigation","q1-2024"}', '{"Lisa Park","James Wilson"}', '2024-01-20T09:00:00Z', '2024-01-28T16:45:00Z'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Onboarding Flow Evaluation', 'New User Onboarding Study', 'Single-flow evaluation of the updated onboarding experience', 'single-flow', 'analyzing', 12, '{"onboarding","new-users","q1-2024"}', '{"Sarah Chen"}', '2024-01-25T11:00:00Z', '2024-01-30T10:15:00Z'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Dashboard Widget Study', 'Widget Layout Comparison', 'Within-subject comparison of dashboard widget arrangements', 'within-subject', 'ingesting', 16, '{"dashboard","widgets","q1-2024"}', '{"Mike Johnson","Lisa Park"}', '2024-01-28T14:00:00Z', '2024-01-29T09:30:00Z'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Search Results Page', 'Search UX Evaluation', 'Evaluating search result presentation and filtering', 'single-flow', 'draft', 0, '{"search","discovery"}', '{"James Wilson"}', '2024-01-30T08:00:00Z', '2024-01-30T08:00:00Z')
ON CONFLICT DO NOTHING;

-- Insert sample transcripts
INSERT INTO transcripts (project_id, session_id, transcript)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'S001', 'Sample transcript for session 1'),
  ('550e8400-e29b-41d4-a716-446655440001', 'S002', 'Sample transcript for session 2'),
  ('550e8400-e29b-41d4-a716-446655440001', 'S003', 'Sample transcript for session 3'),
  ('550e8400-e29b-41d4-a716-446655440002', 'S004', 'Sample transcript for session 4'),
  ('550e8400-e29b-41d4-a716-446655440002', 'S005', 'Sample transcript for session 5'),
  ('550e8400-e29b-41d4-a716-446655440003', 'S006', 'Sample transcript for session 6'),
  ('550e8400-e29b-41d4-a716-446655440004', 'S007', 'Sample transcript for session 7'),
  ('550e8400-e29b-41d4-a716-446655440004', 'S008', 'Sample transcript for session 8')
ON CONFLICT DO NOTHING;
