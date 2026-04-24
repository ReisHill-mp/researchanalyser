import { getProjectTranscripts } from '@/lib/queries'
import { createClient } from '@/lib/supabase-client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transcripts = await getProjectTranscripts(id)
    return Response.json(transcripts)
  } catch (error) {
    console.error('Error fetching transcripts:', error)
    return Response.json(
      { error: 'Failed to fetch transcripts' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const participantId = String(body.participantId || '').trim()
    const transcript = String(body.transcript || '').trim()

    if (!participantId) {
      return Response.json({ error: 'Participant name is required' }, { status: 400 })
    }

    if (!transcript) {
      return Response.json({ error: 'Transcript text is required' }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('transcripts')
      .insert({
        project_id: id,
        session_id: participantId,
        participant_id: participantId,
        transcript,
        status: 'mapped',
        completion: 'complete',
        excluded: false,
        validation_flags: [],
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating transcript:', error)
      return Response.json(
        { error: 'Failed to save transcript', details: error.message },
        { status: 500 }
      )
    }

    const { count } = await supabase
      .from('transcripts')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id)

    await supabase
      .from('projects')
      .update({ participant_count: count || 0, updated_at: new Date().toISOString() })
      .eq('id', id)

    return Response.json(data, { status: 201 })
  } catch (error) {
    console.error('Error saving transcript:', error)
    return Response.json(
      { error: 'Failed to save transcript' },
      { status: 500 }
    )
  }
}
