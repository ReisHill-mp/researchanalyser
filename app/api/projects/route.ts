import { getProjects } from '@/lib/queries'
import { createClient } from '@/lib/supabase-client'

export async function GET() {
  try {
    const projects = await getProjects()
    return Response.json(projects)
  } catch (error) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { error: 'Failed to fetch projects', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { projectName, studyName, testScript, isABComparison, studyType, sessionsUrl, ownerName } = body
    
    if (!projectName || !projectName.trim()) {
      return Response.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }
    
    if (!testScript || !testScript.trim()) {
      return Response.json(
        { error: 'Test script is required' },
        { status: 400 }
      )
    }

    if (!ownerName || !ownerName.trim()) {
      return Response.json(
        { error: 'Your name is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: projectName.trim(),
        study_name: (studyName || projectName).trim(),
        description: body.description?.trim() || null,
        study_type: studyType || (isABComparison ? 'balanced-comparison' : 'single-flow'),
        status: 'draft',
        participant_count: 0,
        tags: body.tags || [],
        team: [ownerName.trim()],
        test_script: testScript.trim(),
        is_ab_comparison: isABComparison,
        usertesting_url: sessionsUrl?.trim() || null,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Supabase insert error:', error)
      return Response.json(
        { error: 'Failed to create project', details: error.message },
        { status: 500 }
      )
    }

    return Response.json(data, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { error: 'Failed to create project', details: errorMessage },
      { status: 500 }
    )
  }
}
