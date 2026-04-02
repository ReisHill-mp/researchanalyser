import { getProjectById } from '@/lib/queries'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return Response.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const project = await getProjectById(id)

    if (!project) {
      return Response.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return Response.json(project)
  } catch (error) {
    console.error('API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { error: 'Failed to fetch project', details: errorMessage },
      { status: 500 }
    )
  }
}
