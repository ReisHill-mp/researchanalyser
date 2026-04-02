import { createClient } from '@/lib/supabase-client'
import { mockProjects } from '@/lib/mock-data'
import type { Project } from '@/lib/types'

export interface Transcript {
  id: string
  projectId: string
  participantId: string
  sessionId: string
  condition?: string
  expectedOrder?: number
  actualOrder?: number
  completion: 'complete' | 'partial' | 'failed'
  status: 'mapped' | 'exported' | 'failed'
  excluded: boolean
  validationFlags: string[]
  createdAt: string
}

export async function getProjectTranscripts(projectId: string): Promise<Transcript[]> {
  try {
    const supabase = createClient()

    const { data: transcripts, error } = await supabase
      .from('transcripts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error || !transcripts) {
      return []
    }

    return transcripts.map((t) => ({
      id: t.id,
      projectId: t.project_id,
      participantId: t.participant_id || `P${t.id.slice(0, 4).toUpperCase()}`,
      sessionId: t.session_id,
      condition: t.condition || undefined,
      expectedOrder: t.expected_order || undefined,
      actualOrder: t.actual_order || undefined,
      completion: t.completion || 'complete',
      status: t.status || 'mapped',
      excluded: t.excluded || false,
      validationFlags: t.validation_flags || [],
      createdAt: t.created_at,
    }))
  } catch (error) {
    return []
  }
}

export interface ProjectFile {
  id: string
  projectId: string
  fileName: string
  fileSize?: number
  fileType?: string
  category: 'script' | 'screener' | 'stimuli' | 'assignment' | 'other'
  parsedTasks?: number
  participantCount?: number
  createdAt: string
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
  try {
    const supabase = createClient()

    const { data: files, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error || !files) {
      return []
    }

    return files.map((file) => ({
      id: file.id,
      projectId: file.project_id,
      fileName: file.file_name,
      fileSize: file.file_size,
      fileType: file.file_type,
      category: file.category || 'other',
      parsedTasks: file.parsed_tasks,
      participantCount: file.participant_count,
      createdAt: file.created_at,
    }))
  } catch (error) {
    return []
  }
}

export async function getProjects(): Promise<Project[]> {
  try {
    const supabase = createClient()

    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false })

    if (projectsError) {
      return mockProjects
    }

    if (!projects || projects.length === 0) {
      return mockProjects
    }

    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const [transcriptsResult, findingsResult] = await Promise.all([
          supabase
            .from('transcripts')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id),
          supabase
            .from('findings')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id),
        ])

        const transcriptCount = transcriptsResult.error ? 0 : transcriptsResult.count || 0
        const findingsCount = findingsResult.error ? 0 : findingsResult.count || 0

        return {
          id: project.id,
          name: project.name,
          studyName: project.study_name,
          description: project.description,
          studyType: project.study_type,
          status: project.status,
          transcriptCount,
          findingsCount,
          participantCount: project.participant_count || 0,
          tags: project.tags || [],
          team: project.team || [],
          usertestingUrl: project.usertesting_url || undefined,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
        } as Project
      })
    )

    return projectsWithCounts
  } catch (error) {
    return mockProjects
  }
}

export interface Finding {
  id: string
  projectId: string
  title: string
  description: string
  type: 'pain-point' | 'delighter' | 'observation'
  severity?: 'critical' | 'moderate' | 'minor'
  category?: string
  priority?: string
  createdAt: string
}

export async function getProjectFindings(projectId: string): Promise<Finding[]> {
  try {
    const supabase = createClient()

    const { data: findings, error } = await supabase
      .from('findings')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error || !findings) {
      return []
    }

    return findings.map((f) => ({
      id: f.id,
      projectId: f.project_id,
      title: f.title,
      description: f.description || '',
      type: f.type || 'observation',
      severity: f.severity || undefined,
      category: f.category || undefined,
      priority: f.priority || undefined,
      createdAt: f.created_at,
    }))
  } catch (error) {
    return []
  }
}

export interface AnalysisQuestion {
  id: string
  questionNumber: string
  question: string
  summary: string
  keyInsights: string[]
  conditionBreakdown: Record<string, string>
  citations: { quote: string; participantId: string; timestamp?: string }[]
  participantCount: number
}

export interface ConditionSummary {
  id: string
  conditionName: string
  summary: string
}

export interface AnalysisRun {
  id: string
  projectId: string
  status: 'pending' | 'running' | 'complete' | 'failed'
  modelVersion?: string
  promptVersion?: string
  createdAt: string
  completedAt?: string
  questions: AnalysisQuestion[]
  conditionSummaries: ConditionSummary[]
}

export async function getProjectAnalysis(projectId: string): Promise<AnalysisRun | null> {
  try {
    const supabase = createClient()

    // Get the latest analysis run for this project
    const { data: analysisRun, error: runError } = await supabase
      .from('analysis_runs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (runError || !analysisRun) {
      return null
    }

    // Fetch questions and condition summaries in parallel
    const [questionsResult, summariesResult] = await Promise.all([
      supabase
        .from('analysis_questions')
        .select('*')
        .eq('analysis_run_id', analysisRun.id)
        .order('question_number', { ascending: true }),
      supabase
        .from('condition_summaries')
        .select('*')
        .eq('analysis_run_id', analysisRun.id),
    ])

    const questions: AnalysisQuestion[] = (questionsResult.data || []).map((q) => ({
      id: q.id,
      questionNumber: q.question_number,
      question: q.question_text,
      summary: q.summary || '',
      keyInsights: q.key_insights || [],
      conditionBreakdown: q.condition_breakdown || {},
      citations: q.citations || [],
      participantCount: q.participant_count || 0,
    }))

    const conditionSummaries: ConditionSummary[] = (summariesResult.data || []).map((s) => ({
      id: s.id,
      conditionName: s.condition_name,
      summary: s.summary || '',
    }))

    return {
      id: analysisRun.id,
      projectId: analysisRun.project_id,
      status: analysisRun.status || 'pending',
      modelVersion: analysisRun.model_version || undefined,
      promptVersion: analysisRun.prompt_version || undefined,
      createdAt: analysisRun.created_at,
      completedAt: analysisRun.completed_at || undefined,
      questions,
      conditionSummaries,
    }
  } catch (error) {
    return null
  }
}

export async function deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Delete project - cascade delete will handle related records
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting project:', error)
    return { success: false, error: 'Failed to delete project' }
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const supabase = createClient()

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (projectError || !project) {
      const mockProject = mockProjects.find((p) => p.id === id)
      return mockProject || null
    }

    const [transcriptsResult, findingsResult] = await Promise.all([
      supabase
        .from('transcripts')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id),
      supabase
        .from('findings')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id),
    ])

    const transcriptCount = transcriptsResult.error ? 0 : transcriptsResult.count || 0
    const findingsCount = findingsResult.error ? 0 : findingsResult.count || 0

    return {
      id: project.id,
      name: project.name,
      studyName: project.study_name,
      description: project.description,
      studyType: project.study_type,
      status: project.status,
      transcriptCount,
      findingsCount,
      participantCount: project.participant_count || 0,
      tags: project.tags || [],
      team: project.team || [],
      usertestingUrl: project.usertesting_url || undefined,
      testScript: project.test_script || undefined,
      isABComparison: project.is_ab_comparison || false,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    } as Project
  } catch (error) {
    const mockProject = mockProjects.find((p) => p.id === id)
    return mockProject || null
  }
}

// Get the latest import run for a project
export async function getLatestImportRun(projectId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('import_runs')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data
  } catch (error) {
    return null
  }
}

// Get all sessions for a project
export async function getProjectSessions(projectId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('sessions')
      .select('id, username, video_length, session_url, discovered_at')
      .eq('project_id', projectId)
      .order('discovered_at', { ascending: true })

    if (error) return []
    return data || []
  } catch (error) {
    return []
  }
}

// Get transcript count for a project
export async function getProjectTranscriptCount(projectId: string): Promise<number> {
  try {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('transcripts')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if (error) return 0
    return count || 0
  } catch (error) {
    return 0
  }
}

// Update import run status and counts
export async function updateImportRunStatus(
  importRunId: string,
  status: 'queued' | 'running' | 'complete' | 'failed',
  discoveredCount?: number,
  importedCount?: number,
  errorMessage?: string
) {
  try {
    const supabase = createClient()
    const updatePayload: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'complete') {
      updatePayload.completed_at = new Date().toISOString()
      if (discoveredCount !== undefined) {
        updatePayload.discovered_session_count = discoveredCount
      }
      if (importedCount !== undefined) {
        updatePayload.imported_transcript_count = importedCount
      }
    }

    if (status === 'failed') {
      updatePayload.completed_at = new Date().toISOString()
      if (errorMessage) {
        updatePayload.error_message = errorMessage
      }
    }

    const { error } = await supabase
      .from('import_runs')
      .update(updatePayload)
      .eq('id', importRunId)

    return !error
  } catch (error) {
    return false
  }
}

