import { getProjectFiles } from '@/lib/queries'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return Response.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const files = await getProjectFiles(id)
    return Response.json(files)
  } catch (error) {
    console.error('Error fetching project files:', error)
    return Response.json(
      { error: 'Failed to fetch project files' },
      { status: 500 }
    )
  }
}
