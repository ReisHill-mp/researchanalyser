import { createClient } from '@/lib/supabase-client'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
  }

  try {
    const supabase = createClient()

    // Get project to verify it exists and has usertesting_url
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, usertesting_url')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Validate usertesting_url
    if (!project.usertesting_url) {
      return NextResponse.json(
        { error: 'UserTesting URL not configured for this project' },
        { status: 400 }
      )
    }

    if (!project.usertesting_url.endsWith('/sessions')) {
      return NextResponse.json(
        { error: 'Invalid UserTesting URL - must end with /sessions' },
        { status: 400 }
      )
    }

    // Create import run record with status='queued'
    const { data: importRun, error: createError } = await supabase
      .from('import_runs')
      .insert({
        project_id: projectId,
        status: 'queued',
        sessions_url: project.usertesting_url,
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create import run', details: createError.message },
        { status: 500 }
      )
    }

    // Return success immediately - external worker will handle the actual import
    return NextResponse.json(
      {
        success: true,
        importRunId: importRun.id,
        status: 'queued',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to start transcript import', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
  }

  try {
    const supabase = createClient()

    // Get latest import run
    const { data: latestRun, error: runError } = await supabase
      .from('import_runs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get transcript count
    const { count: transcriptCount } = await supabase
      .from('transcripts')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)

    // Get session count
    const { count: sessionCount } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)

    return NextResponse.json({
      importRun: latestRun || null,
      discoveredSessions: sessionCount || 0,
      importedTranscripts: transcriptCount || 0,
    })
  } catch (error) {
    console.error('Error fetching import status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import status' },
      { status: 500 }
    )
  }
}
