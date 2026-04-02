import { createClient } from '@/lib/supabase-client'
import type { NextRequest } from 'next/server'

/**
 * WORKER IMPORT RESULTS ENDPOINT
 *
 * This endpoint is designed for an EXTERNAL authenticated worker service
 * to write back real UserTesting session and transcript data.
 *
 * WORKER RESPONSIBILITIES:
 * 1. Access the UserTesting /sessions URL (e.g., https://usertesting.com/projects/xyz/sessions)
 * 2. Discover the list of completed sessions displayed on that page
 * 3. For each session, extract:
 *    - Session ID
 *    - Participant username
 *    - Video length/duration
 *    - Link to the session
 * 4. Scrape the session page to extract the participant's transcript text
 * 5. POST the discovered sessions and transcripts to this endpoint
 *
 * FRONTEND IS NOT RESPONSIBLE FOR SCRAPING:
 * - The frontend app does NOT directly scrape UserTesting
 * - The frontend only manages project setup, import state, and status display
 * - All real UserTesting data ingestion happens via this worker service
 *
 * AUTHENTICATION:
 * - This endpoint should be protected by API key or service auth in production
 * - Currently relies on project_id validation; add auth middleware as needed
 */

interface ImportSession {
  sessionId: string
  username: string
  sessionUrl: string
  videoLength: string
}

interface ImportTranscript {
  sessionId: string
  participantId: string
  transcript: string
}

interface ImportResultsPayload {
  sessions: ImportSession[]
  transcripts: ImportTranscript[]
  status?: 'running' | 'complete' | 'failed'
  errorMessage?: string
}

/**
 * EXAMPLE WORKER PAYLOAD:
 *
 * {
 *   "sessions": [
 *     {
 *       "sessionId": "session-12345",
 *       "username": "John D.",
 *       "sessionUrl": "https://usertesting.com/projects/xyz/sessions/12345",
 *       "videoLength": "12 min"
 *     },
 *     {
 *       "sessionId": "session-12346",
 *       "username": "Jane S.",
 *       "sessionUrl": "https://usertesting.com/projects/xyz/sessions/12346",
 *       "videoLength": "15 min"
 *     }
 *   ],
 *   "transcripts": [
 *     {
 *       "sessionId": "session-12345",
 *       "participantId": "user-12345",
 *       "transcript": "I like this design because... The flow was smooth until... Overall I would rate this..."
 *     },
 *     {
 *       "sessionId": "session-12346",
 *       "participantId": "user-12346",
 *       "transcript": "The navigation was confusing when... I expected the button to... This feature worked well..."
 *     }
 *   ],
 *   "status": "complete"
 * }
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  try {
    const body = (await request.json()) as ImportResultsPayload

    // Validate payload
    if (!body.sessions || !Array.isArray(body.sessions)) {
      return Response.json(
        { error: 'sessions array is required' },
        { status: 400 }
      )
    }

    if (!body.transcripts || !Array.isArray(body.transcripts)) {
      return Response.json(
        { error: 'transcripts array is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 1. Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // 2. Get the latest import run to update
    const { data: latestImportRun, error: importRunError } = await supabase
      .from('import_runs')
      .select('id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (importRunError && importRunError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is OK
      return Response.json(
        { error: 'Failed to fetch import run' },
        { status: 500 }
      )
    }

    const importRunId = latestImportRun?.id

    // 3. Update import run to 'running' status
    if (importRunId) {
      const { error: updateRunError } = await supabase
        .from('import_runs')
        .update({
          status: 'running',
          updated_at: new Date().toISOString(),
        })
        .eq('id', importRunId)

      if (updateRunError) {
        return Response.json(
          { error: 'Failed to update import run' },
          { status: 500 }
        )
      }
    }

    try {
      // 4. Upsert sessions into the database
      const sessionsToInsert = body.sessions.map((session) => ({
        project_id: projectId,
        session_id: session.sessionId,
        username: session.username,
        session_url: session.sessionUrl,
        video_length: session.videoLength,
        discovered_at: new Date().toISOString(),
      }))

      if (sessionsToInsert.length > 0) {
        const { error: sessionsError } = await supabase
          .from('sessions')
          .upsert(sessionsToInsert, {
            onConflict: 'project_id,session_id',
          })

        if (sessionsError) {
          throw new Error(`Failed to upsert sessions: ${sessionsError.message}`)
        }
      }

      // 5. Upsert transcripts into the database
      const transcriptsToInsert = body.transcripts.map((transcript) => ({
        project_id: projectId,
        session_id: transcript.sessionId,
        participant_id: transcript.participantId,
        content: transcript.transcript,
        imported_at: new Date().toISOString(),
      }))

      if (transcriptsToInsert.length > 0) {
        const { error: transcriptsError } = await supabase
          .from('transcripts')
          .upsert(transcriptsToInsert, {
            onConflict: 'project_id,session_id',
          })

        if (transcriptsError) {
          throw new Error(
            `Failed to upsert transcripts: ${transcriptsError.message}`
          )
        }
      }

      // 6. Update import run to 'complete' with final counts
      if (importRunId) {
        const { error: finalUpdateError } = await supabase
          .from('import_runs')
          .update({
            status: 'complete',
            discovered_session_count: body.sessions.length,
            imported_transcript_count: body.transcripts.length,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', importRunId)

        if (finalUpdateError) {
          throw new Error(`Failed to finalize import run: ${finalUpdateError.message}`)
        }
      }

      return Response.json(
        {
          success: true,
          importRunId,
          sessionsInserted: body.sessions.length,
          transcriptsInserted: body.transcripts.length,
        },
        { status: 200 }
      )
    } catch (error) {
      // If processing failed, mark import run as failed
      if (importRunId) {
        await supabase
          .from('import_runs')
          .update({
            status: 'failed',
            error_message:
              error instanceof Error ? error.message : 'Unknown error during import',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', importRunId)
      }

      return Response.json(
        {
          error: error instanceof Error ? error.message : 'Failed to process import results',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Invalid request payload',
      },
      { status: 400 }
    )
  }
}
