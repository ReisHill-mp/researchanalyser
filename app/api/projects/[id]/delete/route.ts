import { deleteProject } from '@/lib/queries'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return Response.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const result = await deleteProject(id)

    if (!result.success) {
      return Response.json(
        { error: result.error || 'Failed to delete project' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error in delete endpoint:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
