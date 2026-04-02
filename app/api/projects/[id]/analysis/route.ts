import { getProjectAnalysis } from '@/lib/queries'
import { createClient } from '@/lib/supabase-client'
import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'
import { spawn } from 'node:child_process'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const analysis = await getProjectAnalysis(id)

    if (!analysis) {
      return Response.json(null)
    }

    return Response.json(analysis)
  } catch (error) {
    console.error('API error:', error)
    return Response.json({ error: 'Failed to fetch analysis' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, test_script')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { count: transcriptCount, error: transcriptError } = await supabase
      .from('transcripts')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if (transcriptError || !transcriptCount) {
      return NextResponse.json(
        { error: 'No transcripts available yet. Import transcripts before running analysis.' },
        { status: 400 }
      )
    }

    const { data: analysisRun, error: createError } = await supabase
      .from('analysis_runs')
      .insert({
        project_id: projectId,
        status: 'queued',
        model_version: 'local-research-synthesizer',
        prompt_version: 'ux-researcher-designer-v1',
        current_step: 'Queued',
        progress_log: ['Queued analysis run'],
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create analysis run', details: createError.message },
        { status: 500 }
      )
    }

    if (process.env.NODE_ENV !== 'production') {
      const host = request.headers.get('host') || 'localhost:3000'
      const proto =
        host.includes('localhost') || host.startsWith('127.0.0.1')
          ? 'http'
          : request.headers.get('x-forwarded-proto') || 'https'
      const appUrl = `${proto}://${host}`

      const child = spawn(
        'node',
        [
          'scripts/run_local_analysis.js',
          '--project-id',
          projectId,
          '--analysis-run-id',
          analysisRun.id,
          '--app-url',
          appUrl,
        ],
        {
          cwd: process.cwd(),
          env: process.env,
          detached: true,
          stdio: 'ignore',
        }
      )

      child.unref()
    }

    return NextResponse.json(
      {
        success: true,
        analysisRunId: analysisRun.id,
        status: 'queued',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Analysis start error:', error)
    return NextResponse.json(
      {
        error: 'Failed to start analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
