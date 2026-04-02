import { getProjectById, getProjectFindings, getProjectAnalysis } from '@/lib/queries'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [project, findings, analysis] = await Promise.all([
      getProjectById(id),
      getProjectFindings(id),
      getProjectAnalysis(id),
    ])

    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    return Response.json({
      project,
      findings,
      analysis,
    })
  } catch (error) {
    console.error('Error fetching report data:', error)
    return Response.json({ error: 'Failed to fetch report data' }, { status: 500 })
  }
}
