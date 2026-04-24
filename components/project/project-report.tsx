'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileOutput,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react'
import type { Project } from '@/lib/types'
import type { AnalysisRun, Finding } from '@/lib/queries'
import type { ResearchReportData, PriorityBucket } from '@/lib/report-builder'
import { priorityLabels } from '@/lib/report-builder'

interface ProjectReportProps {
  project: Project
}

interface ReportPayload {
  project: Project
  findings: Finding[]
  analysis: AnalysisRun | null
  report: ResearchReportData
  reportVersions?: Array<{
    id: string
    createdAt: string
    generationMode: 'deterministic' | 'ai'
    model?: string
    prompt: string
    report: ResearchReportData
  }>
  activeReportVersionId?: string | null
  generation?: {
    mode: 'deterministic' | 'ai'
    model?: string
    warning?: string
  }
}

export function ProjectReport({ project }: ProjectReportProps) {
  const [findings, setFindings] = useState<Finding[]>([])
  const [analysis, setAnalysis] = useState<AnalysisRun | null>(null)
  const [report, setReport] = useState<ResearchReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [promptDraft, setPromptDraft] = useState('')
  const [generationMeta, setGenerationMeta] = useState<ReportPayload['generation'] | null>(null)
  const [regenerateError, setRegenerateError] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/projects/${project.id}/report`)
        if (!response.ok) throw new Error('Failed to fetch report')
        const data: ReportPayload = await response.json()
        setFindings(data.findings || [])
        setAnalysis(data.analysis || null)
        setReport(data.report || null)
        setPromptDraft(data.report?.reportPrompt || '')
        setGenerationMeta(data.generation || null)
      } catch (error) {
        console.error('Error fetching report data:', error)
        setFindings([])
        setAnalysis(null)
        setReport(null)
        setPromptDraft('')
        setGenerationMeta(null)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [project.id])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border border-border border-t-primary mb-4"></div>
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!analysis && findings.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Research Insight Report</h2>
            <p className="text-sm text-muted-foreground mt-1">
              A polished synthesis will appear here once analysis outputs have been generated.
            </p>
          </div>
        </div>
        <Card className="p-8 border-border bg-card text-center">
          <FileOutput className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">No report yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Run analysis to generate question-level synthesis, findings, and the final report narrative.
          </p>
        </Card>
      </div>
    )
  }

  if (!report) {
    return null
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    setRegenerateError(null)

    try {
      const response = await fetch(`/api/projects/${project.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptDraft }),
      })

      const data: ReportPayload & { error?: string; details?: string } = await response.json().catch(() => ({} as ReportPayload))
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to regenerate report')
      }

      setFindings(data.findings || [])
      setAnalysis(data.analysis || null)
      setReport(data.report || null)
      setPromptDraft(data.report?.reportPrompt || promptDraft)
      setGenerationMeta(data.generation || null)
    } catch (error) {
      setRegenerateError(error instanceof Error ? error.message : 'Failed to regenerate report')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-3">
          <Badge variant="secondary" className="gap-2 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" />
            Research insight report
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {project.studyName || project.name} Research Insight Report
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            This report synthesizes feedback from {project.transcriptCount} UserTesting participants
            using the saved study script, imported transcripts, question-by-question analysis, and
            final findings generated for this project.
          </p>
        </div>

        <Card className="border-border bg-card p-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="study-overview" className="border-none">
              <AccordionTrigger className="py-0 text-lg font-semibold text-foreground hover:no-underline">
                Study overview
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="space-y-4 text-sm">
                  {project.usertestingUrl && (
                    <a
                      href={project.usertestingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 break-all text-foreground hover:text-primary"
                    >
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      {project.usertestingUrl}
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  )}

                  <p className="text-foreground leading-7">
                    This report synthesizes feedback from {project.transcriptCount} UserTesting participants
                    who reviewed this study. The analysis is based on:
                  </p>

                  <div className="space-y-2">
                    {report.researchInputs.map((input) => (
                      <p key={input} className="text-foreground">
                        {input}
                      </p>
                    ))}
                  </div>

                  {report.balancedComparisonNote && (
                    <p className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-foreground leading-7">
                      {report.balancedComparisonNote}
                    </p>
                  )}

                  <p className="text-foreground leading-7">{report.studyObjective}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Card className="border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Report prompt</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                This is the current prompt/context used to shape the final report narrative from the script, analysis, findings, and transcript evidence. Edit it, then regenerate the report when you want to try a different framing.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPrompt((prev) => !prev)} className="gap-2">
                {showPrompt ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                {showPrompt ? 'Hide prompt' : 'View prompt'}
              </Button>
              <Button size="sm" onClick={handleRegenerate} disabled={regenerating} className="gap-2">
                {regenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Regenerate report
                  </>
                )}
              </Button>
            </div>
          </div>

          {showPrompt && (
            <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
              <textarea
                value={promptDraft}
                onChange={(e) => setPromptDraft(e.target.value)}
                className="min-h-[420px] w-full resize-y rounded-md border border-border bg-background p-3 font-mono text-xs leading-6 text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            {generationMeta?.mode === 'ai' ? (
              <p>
                Current draft was regenerated with <span className="text-foreground">{generationMeta.model || 'AI'}</span>.
              </p>
            ) : (
              <p>
                Current draft is using the deterministic fallback report builder.
              </p>
            )}
            {generationMeta?.warning && (
              <p className="text-amber-600 dark:text-amber-400">{generationMeta.warning}</p>
            )}
            {regenerateError && (
              <p className="text-destructive">{regenerateError}</p>
            )}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Executive summary</h2>
          <div className="mt-4 space-y-4">
            {report.executiveSummary.map((paragraph, index) => (
              <p key={index} className="text-sm leading-7 text-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">What the research says</h2>
          <div className="mt-5 space-y-6">
            {report.researchThemes.map((theme, index) => (
              <div key={theme.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-medium text-foreground">
                    {index + 1}. {theme.title}
                  </h3>
                  {findings[index]?.severity && <Badge variant="secondary">{findings[index].severity}</Badge>}
                </div>
                <p className="text-sm leading-7 text-foreground">{theme.body}</p>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Implication
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {theme.implication}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Key user needs emerging from the study</h2>
          <div className="mt-4 space-y-3">
            {report.keyNeeds.map((need, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-7 text-foreground">{need}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Design recommendations</h2>
          <div className="mt-5 space-y-5">
            {report.recommendations.map((recommendation, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-base font-medium text-foreground">
                  {index + 1}. {recommendation}
                </h3>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Suggested product direction</h2>
          <div className="mt-4 space-y-3">
            {report.suggestedDirection.map((line, index) => (
              <p key={index} className="text-sm leading-7 text-foreground">
                {line}
              </p>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Priority actions</h2>
          <div className="mt-5 space-y-5">
            {(Object.entries(report.priorityGroups) as Array<[PriorityBucket, Finding[]]>).map(([bucket, bucketFindings]) => (
              <div key={bucket}>
                <h3 className="text-base font-medium text-foreground">{priorityLabels[bucket]}</h3>
                <div className="mt-3 space-y-2">
                  {bucketFindings.length > 0 ? (
                    bucketFindings.map((finding) => (
                      <p key={finding.id} className="text-sm leading-7 text-foreground">
                        {finding.title}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No actions in this bucket yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Final takeaway</h2>
          <p className="mt-4 text-sm leading-7 text-foreground">{report.finalTakeaway}</p>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">References</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            The report is drafted from the user test script, the question-by-question analysis,
            the participant-level analysis, and the imported transcript set for this project.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Research inputs</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {report.researchInputs.map((input) => (
                  <p key={input}>{input}</p>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Transcript references</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {report.transcriptReferences.length > 0 ? (
                  report.transcriptReferences.map((reference) => (
                    <p key={`${reference.participantId}-${reference.transcriptReference}`}>
                      {reference.transcriptReference}
                      {reference.sessionId ? ` (${reference.sessionId})` : ''}
                    </p>
                  ))
                ) : (
                  <p>Transcript references will populate after the next analysis run.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
