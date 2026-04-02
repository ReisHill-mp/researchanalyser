import { createClient } from '@/lib/supabase-client'
import type { NextRequest } from 'next/server'

interface AnalysisQuestionPayload {
  questionNumber: string
  questionText: string
  summary: string
  keyInsights: string[]
  conditionBreakdown: Record<string, string>
  citations: {
    quote: string
    participantId: string
    timestamp?: string
    summary?: string
    condition?: string
    transcriptReference?: string
    sessionId?: string
  }[]
  participantCount: number
}

interface ConditionSummaryPayload {
  conditionName: string
  summary: string
}

interface FindingPayload {
  type: 'pain-point' | 'delighter' | 'insight' | 'recommendation'
  title: string
  description: string
  severity?: 'critical' | 'major' | 'minor'
  participantCount?: number
  conditions?: string[]
  tags?: string[]
}

interface AnalysisResultsPayload {
  analysisRunId?: string
  status?: 'running' | 'complete' | 'failed'
  currentStep?: string
  progressLog?: string[]
  errorMessage?: string
  questions?: AnalysisQuestionPayload[]
  conditionSummaries?: ConditionSummaryPayload[]
  findings?: FindingPayload[]
}

function buildModernFindingRows(projectId: string, findings: FindingPayload[]) {
  return findings.map((finding) => ({
    project_id: projectId,
    type: finding.type,
    title: finding.title,
    description: finding.description,
    severity: finding.severity ?? null,
    participant_count: finding.participantCount ?? 0,
    conditions: finding.conditions ?? [],
    tags: finding.tags ?? ['auto-generated', 'analysis'],
  }))
}

function buildLegacyFindingRows(projectId: string, findings: FindingPayload[]) {
  return findings.map((finding) => ({
    project_id: projectId,
    title: finding.title,
    summary: finding.description || finding.title,
    detail: finding.description || null,
    category: finding.type,
    priority:
      finding.severity === 'critical'
        ? 'high'
        : finding.severity === 'major'
        ? 'medium'
        : 'low',
    created_at: new Date().toISOString(),
  }))
}

function buildSummaryDetailFindingRows(projectId: string, findings: FindingPayload[]) {
  return findings.map((finding) => ({
    project_id: projectId,
    title: finding.title,
    summary: finding.description || finding.title,
    detail: finding.description || null,
    transcript_reference: null,
    participant_reference: null,
    created_at: new Date().toISOString(),
  }))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  try {
    const body = (await request.json()) as AnalysisResultsPayload
    const supabase = createClient()

    const { data: latestRun, error: runError } = await supabase
      .from('analysis_runs')
      .select('id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (runError || !latestRun) {
      return Response.json({ error: 'Analysis run not found' }, { status: 404 })
    }

    const analysisRunId = body.analysisRunId || latestRun.id

    const updatePayload: Record<string, unknown> = {
      status: body.status === 'failed' ? 'failed' : body.status === 'complete' ? 'complete' : 'running',
      current_step: body.currentStep ?? null,
      progress_log: body.progressLog ?? [],
      error_message: body.status === 'failed' ? body.errorMessage || 'Analysis failed' : null,
    }

    if (body.status === 'complete' || body.status === 'failed') {
      updatePayload.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('analysis_runs')
      .update(updatePayload)
      .eq('id', analysisRunId)

    if (updateError) {
      return Response.json(
        { error: 'Failed to update analysis run', details: updateError.message },
        { status: 500 }
      )
    }

    if (body.status === 'running') {
      return Response.json({ success: true, status: 'running' })
    }

    if (body.status === 'failed') {
      return Response.json({ success: true, status: 'failed' })
    }

    if (!body.questions || !body.conditionSummaries || !body.findings) {
      return Response.json(
        { error: 'questions, conditionSummaries, and findings are required for a complete analysis result' },
        { status: 400 }
      )
    }

    const questionRows = body.questions.map((question) => ({
      analysis_run_id: analysisRunId,
      question_number: question.questionNumber,
      question_text: question.questionText,
      summary: question.summary,
      key_insights: question.keyInsights,
      condition_breakdown: question.conditionBreakdown,
      citations: question.citations,
      participant_count: question.participantCount,
    }))

    const conditionRows = body.conditionSummaries.map((summary) => ({
      analysis_run_id: analysisRunId,
      condition_name: summary.conditionName,
      summary: summary.summary,
    }))

    const modernFindingRows = buildModernFindingRows(projectId, body.findings)
    const legacyFindingRows = buildLegacyFindingRows(projectId, body.findings)
    const summaryDetailFindingRows = buildSummaryDetailFindingRows(projectId, body.findings)

    const { error: clearQuestionsError } = await supabase
      .from('analysis_questions')
      .delete()
      .eq('analysis_run_id', analysisRunId)

    if (clearQuestionsError) {
      return Response.json(
        { error: 'Failed to clear previous analysis questions', details: clearQuestionsError.message },
        { status: 500 }
      )
    }

    const { error: clearConditionsError } = await supabase
      .from('condition_summaries')
      .delete()
      .eq('analysis_run_id', analysisRunId)

    if (clearConditionsError) {
      return Response.json(
        { error: 'Failed to clear previous condition summaries', details: clearConditionsError.message },
        { status: 500 }
      )
    }

    await supabase
      .from('findings')
      .delete()
      .eq('project_id', projectId)

    if (questionRows.length > 0) {
      const { error: questionInsertError } = await supabase
        .from('analysis_questions')
        .insert(questionRows)

      if (questionInsertError) {
        return Response.json(
          { error: 'Failed to insert analysis questions', details: questionInsertError.message },
          { status: 500 }
        )
      }
    }

    if (conditionRows.length > 0) {
      const { error: conditionInsertError } = await supabase
        .from('condition_summaries')
        .insert(conditionRows)

      if (conditionInsertError) {
        return Response.json(
          { error: 'Failed to insert condition summaries', details: conditionInsertError.message },
          { status: 500 }
        )
      }
    }

    if (modernFindingRows.length > 0) {
      const { error: modernInsertError } = await supabase
        .from('findings')
        .insert(modernFindingRows)

      if (modernInsertError) {
        const { error: legacyInsertError } = await supabase
          .from('findings')
          .insert(legacyFindingRows)

        if (legacyInsertError) {
          const { error: summaryDetailInsertError } = await supabase
            .from('findings')
            .insert(summaryDetailFindingRows)

          if (summaryDetailInsertError) {
            return Response.json(
              {
                error: 'Failed to insert findings',
                details: `${modernInsertError.message} | legacy fallback: ${legacyInsertError.message} | summary/detail fallback: ${summaryDetailInsertError.message}`,
              },
              { status: 500 }
            )
          }
        }
      }
    }

    return Response.json({
      success: true,
      analysisRunId,
      questionsInserted: questionRows.length,
      conditionSummariesInserted: conditionRows.length,
      findingsInserted: modernFindingRows.length,
    })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Invalid request payload',
      },
      { status: 400 }
    )
  }
}
