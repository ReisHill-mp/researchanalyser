import { createClient } from '@/lib/supabase-client'

function normalizeUserTestingSessionsUrl(rawUrl: string) {
  const value = rawUrl.trim()
  if (!value) return value

  try {
    const url = new URL(value)

    if (url.hash.startsWith('#!/study/')) {
      url.pathname = `${url.pathname.replace(/\/$/, '')}${url.hash.replace('#!', '')}`
      url.hash = ''
    }

    return url.toString()
  } catch {
    return value
  }
}

// GET: fetch all sessions for a project
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('sessions')
      .select('id, username, video_length, session_url, discovered_at')
      .eq('project_id', projectId)
      .order('discovered_at', { ascending: true })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(data ?? [])
  } catch (err) {
    return Response.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

// POST: save the project's UserTesting URL and optionally upsert discovered sessions
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  try {
    const body = await request.json()
    const { sessionsUrl, sessions } = body as {
      sessionsUrl: string
      sessions?: { session_id: string; username: string; video_length?: string; session_url?: string }[]
    }

    if (!sessionsUrl?.trim()) {
      return Response.json({ error: 'sessionsUrl is required' }, { status: 400 })
    }

    const normalizedSessionsUrl = normalizeUserTestingSessionsUrl(sessionsUrl)

    const supabase = createClient()

    // Update the project's usertesting_url
    const { error: projectError } = await supabase
      .from('projects')
      .update({ usertesting_url: normalizedSessionsUrl })
      .eq('id', projectId)

    if (projectError) {
      return Response.json({ error: projectError.message }, { status: 500 })
    }

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return Response.json({ saved: 0 }, { status: 200 })
    }

    const rows = sessions.map((s) => ({
      project_id: projectId,
      session_id: s.session_id,
      username: s.username,
      video_length: s.video_length ?? null,
      session_url: s.session_url ?? null,
    }))

    const { data, error: sessionError } = await supabase
      .from('sessions')
      .upsert(rows, { onConflict: 'project_id,session_id' })
      .select('id, username, video_length')

    if (sessionError) {
      return Response.json({ error: sessionError.message }, { status: 500 })
    }

    return Response.json({ saved: data?.length ?? 0 }, { status: 201 })
  } catch (err) {
    return Response.json({ error: 'Failed to save sessions' }, { status: 500 })
  }
}
