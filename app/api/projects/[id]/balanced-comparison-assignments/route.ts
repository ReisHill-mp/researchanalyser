import { createClient } from '@/lib/supabase-client'

interface BalancedComparisonAssignmentPayload {
  participantId: string
  orderLabel: 'A-B' | 'B-A'
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createClient()

    const { data, error } = await supabase
      .from('balanced_comparison_assignments')
      .select('participant_id, order_label')
      .eq('project_id', id)

    if (error) {
      return Response.json(
        { error: 'Failed to fetch balanced comparison assignments', details: error.message },
        { status: 500 }
      )
    }

    return Response.json(
      (data || []).map((assignment) => ({
        participantId: assignment.participant_id,
        orderLabel: assignment.order_label === 'B-A' ? 'B-A' : 'A-B',
      }))
    )
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch balanced comparison assignments' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const assignments = Array.isArray(body.assignments)
      ? body.assignments
          .map((assignment: { participantId?: string; orderLabel?: string }): BalancedComparisonAssignmentPayload => ({
            participantId: String(assignment.participantId || '').trim(),
            orderLabel: assignment.orderLabel === 'B-A' ? 'B-A' : 'A-B',
          }))
          .filter((assignment: BalancedComparisonAssignmentPayload) => assignment.participantId)
      : []

    const supabase = createClient()

    const { error: deleteError } = await supabase
      .from('balanced_comparison_assignments')
      .delete()
      .eq('project_id', id)

    if (deleteError) {
      return Response.json(
        { error: 'Failed to clear previous assignments', details: deleteError.message },
        { status: 500 }
      )
    }

    if (assignments.length > 0) {
      const { error: insertError } = await supabase
        .from('balanced_comparison_assignments')
        .insert(
          assignments.map((assignment: BalancedComparisonAssignmentPayload) => ({
            project_id: id,
            participant_id: assignment.participantId,
            order_label: assignment.orderLabel,
          }))
        )

      if (insertError) {
        return Response.json(
          { error: 'Failed to save balanced comparison assignments', details: insertError.message },
          { status: 500 }
        )
      }
    }

    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    return Response.json({ success: true, assignments })
  } catch (error) {
    return Response.json(
      { error: 'Failed to save balanced comparison assignments' },
      { status: 500 }
    )
  }
}
