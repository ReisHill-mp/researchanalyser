import { getProjectAnalysis } from '@/lib/queries'

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
