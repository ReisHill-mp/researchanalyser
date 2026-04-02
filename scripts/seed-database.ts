import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('Setting up database tables...')

  try {
    // Insert seed data
    console.log('Inserting seed data...')
    const projectsData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Q1 Checkout Optimization',
        study_name: 'Checkout Flow Comparison Study',
        description: 'Evaluating new streamlined checkout against current multi-step flow',
        study_type: 'ab-comparison',
        status: 'complete',
        participant_count: 24,
        tags: ['checkout', 'conversion', 'q1-2024'],
        team: ['Sarah Chen', 'Mike Johnson'],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-02-01T14:30:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Mobile Navigation Redesign',
        study_name: 'Nav Pattern Concept Test',
        description: 'Testing three navigation pattern concepts for mobile app',
        study_type: 'concept-test',
        status: 'validation-required',
        participant_count: 18,
        tags: ['mobile', 'navigation', 'q1-2024'],
        team: ['Lisa Park', 'James Wilson'],
        created_at: '2024-01-20T09:00:00Z',
        updated_at: '2024-01-28T16:45:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Onboarding Flow Evaluation',
        study_name: 'New User Onboarding Study',
        description: 'Single-flow evaluation of the updated onboarding experience',
        study_type: 'single-flow',
        status: 'analyzing',
        participant_count: 12,
        tags: ['onboarding', 'new-users', 'q1-2024'],
        team: ['Sarah Chen'],
        created_at: '2024-01-25T11:00:00Z',
        updated_at: '2024-01-30T10:15:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Dashboard Widget Study',
        study_name: 'Widget Layout Comparison',
        description: 'Within-subject comparison of dashboard widget arrangements',
        study_type: 'within-subject',
        status: 'ingesting',
        participant_count: 16,
        tags: ['dashboard', 'widgets', 'q1-2024'],
        team: ['Mike Johnson', 'Lisa Park'],
        created_at: '2024-01-28T14:00:00Z',
        updated_at: '2024-01-29T09:30:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Search Results Page',
        study_name: 'Search UX Evaluation',
        description: 'Evaluating search result presentation and filtering',
        study_type: 'single-flow',
        status: 'draft',
        participant_count: 0,
        tags: ['search', 'discovery'],
        team: ['James Wilson'],
        created_at: '2024-01-30T08:00:00Z',
        updated_at: '2024-01-30T08:00:00Z',
      },
    ]

    const { error: insertError } = await supabase
      .from('projects')
      .upsert(projectsData)

    if (insertError) {
      console.error('Error inserting projects:', insertError)
    } else {
      console.log('✓ Projects data inserted')
    }

    // Insert transcripts
    console.log('Inserting transcripts...')
    const transcriptsData = [
      { project_id: '550e8400-e29b-41d4-a716-446655440001', session_id: 'S001', transcript: 'Sample transcript for session 1' },
      { project_id: '550e8400-e29b-41d4-a716-446655440001', session_id: 'S002', transcript: 'Sample transcript for session 2' },
      { project_id: '550e8400-e29b-41d4-a716-446655440001', session_id: 'S003', transcript: 'Sample transcript for session 3' },
      { project_id: '550e8400-e29b-41d4-a716-446655440002', session_id: 'S004', transcript: 'Sample transcript for session 4' },
      { project_id: '550e8400-e29b-41d4-a716-446655440002', session_id: 'S005', transcript: 'Sample transcript for session 5' },
      { project_id: '550e8400-e29b-41d4-a716-446655440003', session_id: 'S006', transcript: 'Sample transcript for session 6' },
      { project_id: '550e8400-e29b-41d4-a716-446655440004', session_id: 'S007', transcript: 'Sample transcript for session 7' },
      { project_id: '550e8400-e29b-41d4-a716-446655440004', session_id: 'S008', transcript: 'Sample transcript for session 8' },
    ]

    const { error: transcriptsError } = await supabase
      .from('transcripts')
      .upsert(transcriptsData)

    if (transcriptsError) {
      console.error('Error inserting transcripts:', transcriptsError)
    } else {
      console.log('✓ Transcripts inserted')
    }

    console.log('✓ Database setup complete!')
  } catch (error) {
    console.error('Setup error:', error)
    process.exit(1)
  }
}

setupDatabase()
