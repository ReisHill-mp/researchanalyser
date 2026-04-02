import { getProjectTranscripts } from '@/lib/queries'

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
