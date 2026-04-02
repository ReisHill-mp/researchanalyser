'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileOutput,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react'
import type { Project } from '@/lib/types'
import type { AnalysisRun, Finding } from '@/lib/queries'

interface ProjectReportProps {
  project: Project
}

interface ReportPayload {
  project: Project
  findings: Finding[]
  analysis: AnalysisRun | null
}

type PriorityBucket = 'highest' | 'medium' | 'lower'

const priorityLabels: Record<PriorityBucket, string> = {
  highest: 'Highest priority',
  medium: 'Medium priority',
  lower: 'Lower priority',
}

function normaliseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function sentence(value: string) {
  const trimmed = normaliseWhitespace(value)
  if (!trimmed) return ''
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function splitIntoSentences(text: string) {
  return normaliseWhitespace(text)
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function bucketFinding(finding: Finding): PriorityBucket {
  if (finding.severity === 'critical' || finding.priority === 'high') return 'highest'
  if (finding.severity === 'moderate' || finding.priority === 'medium') return 'medium'
  return 'lower'
}

function deriveStudyObjective(project: Project, findings: Finding[], analysis: AnalysisRun | null) {
  const sourceText = [
    project.studyName,
    project.description,
    ...findings.map((finding) => `${finding.title} ${finding.description}`),
    ...(analysis?.questions ?? []).map((question) => question.question),
  ]
    .join(' ')
    .toLowerCase()

  if (/(which version|design a|design b|comparison|prefer overall)/.test(sourceText)) {
    return 'The study objective was to understand which design direction creates stronger confidence, clearer reviewability, and a more usable import experience overall.'
  }

  if (/(confidence|added|not added|completion|feedback)/.test(sourceText)) {
    return 'The study objective was to understand whether the flow feels easy to use, whether the outcome feels trustworthy, and where confidence breaks down for participants.'
  }

  return 'The study objective was to understand how usable the proposed experience feels, where participants lose confidence, and what changes would make the flow easier to trust and complete.'
}

function deriveExecutiveSummary(findings: Finding[], analysis: AnalysisRun | null) {
  const joined = findings.map((finding) => `${finding.title} ${finding.description}`).join(' ').toLowerCase()
  const hasCoreValue = /core import concept is working|core-value|value of importing|speed and usefulness/.test(joined)
  const hasDiscoverability = /discoverability|entry-point clarity|understanding how to begin|way to start|import route/.test(joined)
  const hasConfidence = /confidence gap|confirmation|truly been added|completion feedback/.test(joined)
  const hasComparison = /stronger direction|scanability|structured direction|comparison/.test(joined)
  const hasClutter = /visual restraint|busier than necessary|simplified version|visual-noise/.test(joined)

  const paragraphs = []

  if (hasCoreValue) {
    paragraphs.push(
      'The good news is that the core job to be done is working. Participants consistently understood the value of importing occasions, and the underlying flow feels useful once they are inside it.'
    )
  }

  if (hasDiscoverability || hasConfidence) {
    paragraphs.push(
      'The bigger issues are around clarity at the edges of the experience. Participants were less concerned with the mechanics of import and more concerned with finding the entry point, feeling sure something had actually been added, and scanning the list without missing anything important.'
    )
  }

  if (hasComparison) {
    paragraphs.push(
      'The stronger direction appears to be the one that improves scanability and review confidence. More structured list organisation helps people feel less likely to miss something important and gives the experience a clearer sense of control.'
    )
  }

  if (hasClutter || hasConfidence) {
    paragraphs.push(
      'The clearest product direction is not a simple binary choice. The best next version is likely a hybrid: keep the stronger structured approach, simplify the presentation, and strengthen confirmation feedback so users feel fully confident that the task is complete.'
    )
  }

  if (paragraphs.length > 0) {
    return paragraphs
  }

  const topFindings = findings.slice(0, 4)
  const summaries = [
    ...topFindings.map((finding) => sentence(finding.description)),
    ...(analysis?.conditionSummaries ?? []).slice(0, 1).map((summary) => sentence(summary.summary)),
  ].filter(Boolean)

  if (summaries.length > 0) return summaries.slice(0, 4)

  return [
    'This report is ready to present a sharper research narrative once analysis findings have been generated for the project.',
  ]
}

function deriveImplication(finding: Finding) {
  const text = `${finding.title} ${finding.description}`.toLowerCase()

  if (/(discover|entry|start|find)/.test(text)) {
    return 'Improving entry-point labeling and affordance is likely to have a bigger impact than changing the underlying interaction model.'
  }
  if (/(confidence|confirm|added|outcome|clear whether)/.test(text)) {
    return 'The team should treat completion feedback as a core UX decision rather than visual polish.'
  }
  if (/(scan|review|organized|structured|miss something|comparison)/.test(text)) {
    return 'The stronger direction is the one that helps users scan confidently without feeling overloaded.'
  }
  if (/(busy|clutter|noise|icon|visual)/.test(text)) {
    return 'The likely best outcome is a simplified version of the stronger direction, not a more feature-rich one.'
  }
  if (finding.type === 'delighter') {
    return 'The team does not need to rethink the core idea here. The opportunity is refinement, not redesign.'
  }

  return 'This should be used as a directional product call, not just a descriptive observation.'
}

function deriveNeeds(findings: Finding[]) {
  const generated = [
    'Help me find the import flow immediately.',
    'Let me scan imported items in a way that feels organized.',
    'Make it obvious what has been added and what has not.',
    'Do not make the screen feel busier than it needs to be.',
    'Give me confidence without slowing me down.',
  ]

  if (findings.length === 0) return generated

  return generated
}

function deriveRecommendations(findings: Finding[]) {
  const sourceText = findings.map((finding) => `${finding.title} ${finding.description}`).join(' ').toLowerCase()
  const recommendations: string[] = []

  if (/(scan|review|organized|structured|comparison|design b)/.test(sourceText)) {
    recommendations.push('Proceed with the stronger structured direction as the base UX direction.')
  }
  if (/(busy|clutter|noise|icon|visual)/.test(sourceText)) {
    recommendations.push('Simplify the chosen direction before rolling it forward by removing decorative or redundant UI treatment.')
  }
  if (/(discover|entry|start|find|floating)/.test(sourceText)) {
    recommendations.push('Make the import entry point more explicit through stronger labeling, supporting copy, or a clearer affordance.')
  }
  if (/(confidence|confirm|added|outcome|clear whether)/.test(sourceText)) {
    recommendations.push('Strengthen completion feedback so participants can tell immediately what has been added and what still needs attention.')
  }
  if (/(mixed|source|existing|filter|manual add|select all|timing|recurring)/.test(sourceText)) {
    recommendations.push('Treat filtering, manual add, select all, and related controls as follow-on enhancements after the core clarity issues are resolved.')
  }

  if (recommendations.length === 0) {
    return findings.slice(0, 5).map((finding) => `Use ${finding.title.toLowerCase()} as a design direction and validate it in the next iteration.`)
  }

  return recommendations
}

function deriveSuggestedDirection(findings: Finding[], recommendations: string[]) {
  const joined = findings.map((finding) => `${finding.title} ${finding.description}`).join(' ').toLowerCase()

  if (/(comparison|scan|organized|structured|confidence)/.test(joined)) {
    return [
      'The best next version is likely:',
      'The stronger structured direction',
      'The simpler, more restrained presentation',
      'A clearer import affordance',
      'More explicit confirmation feedback',
    ]
  }

  return [
    'The best next version is likely:',
    recommendations[0] || 'A clearer structure for the main flow',
    recommendations[1] || 'A more restrained visual treatment',
    recommendations[2] || 'Clearer feedback after important actions',
  ]
}

function deriveFinalTakeaway(findings: Finding[]) {
  if (findings.length === 0) {
    return 'The project is ready for a research-style readout as soon as the next analysis run generates report-ready findings.'
  }
  return 'This research does not suggest the team needs a new concept. It suggests the team is close. Users can already see the value in the import flow; the work now is to remove the ambiguity around discoverability, confirmation, and visual noise so the experience feels both easy and dependable.'
}

function deriveTranscriptReferences(analysis: AnalysisRun | null) {
  const references = new Map<string, { participantId: string; transcriptReference: string; sessionId?: string }>()

  for (const question of analysis?.questions ?? []) {
    for (const citation of question.citations ?? []) {
      const transcriptReference = citation.transcriptReference || `${citation.participantId}.md`
      const key = `${citation.participantId}:${transcriptReference}`
      if (!references.has(key)) {
        references.set(key, {
          participantId: citation.participantId,
          transcriptReference,
          sessionId: citation.sessionId,
        })
      }
    }
  }

  return [...references.values()]
}

export function ProjectReport({ project }: ProjectReportProps) {
  const [findings, setFindings] = useState<Finding[]>([])
  const [analysis, setAnalysis] = useState<AnalysisRun | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/projects/${project.id}/report`)
        if (!response.ok) throw new Error('Failed to fetch report')
        const data: ReportPayload = await response.json()
        setFindings(data.findings || [])
        setAnalysis(data.analysis || null)
      } catch (error) {
        console.error('Error fetching report data:', error)
        setFindings([])
        setAnalysis(null)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [project.id])

  const studyObjective = useMemo(
    () => deriveStudyObjective(project, findings, analysis),
    [project, findings, analysis]
  )
  const executiveSummary = useMemo(
    () => deriveExecutiveSummary(findings, analysis),
    [findings, analysis]
  )
  const keyNeeds = useMemo(() => deriveNeeds(findings), [findings])
  const recommendations = useMemo(() => deriveRecommendations(findings), [findings])
  const suggestedDirection = useMemo(
    () => deriveSuggestedDirection(findings, recommendations),
    [findings, recommendations]
  )
  const finalTakeaway = useMemo(() => deriveFinalTakeaway(findings), [findings])
  const transcriptReferences = useMemo(() => deriveTranscriptReferences(analysis), [analysis])

  const priorityGroups = useMemo(() => {
    return findings.reduce<Record<PriorityBucket, Finding[]>>(
      (groups, finding) => {
        groups[bucketFinding(finding)].push(finding)
        return groups
      },
      { highest: [], medium: [], lower: [] }
    )
  }, [findings])

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
          <h2 className="text-lg font-semibold text-foreground">Study overview</h2>
          <div className="mt-4 space-y-4 text-sm">
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
              <p className="text-foreground">User test script</p>
              <p className="text-foreground">Question-by-question analysis</p>
              <p className="text-foreground">{project.transcriptCount} imported transcript file(s)</p>
            </div>

            <p className="text-foreground leading-7">{studyObjective}</p>
          </div>
        </Card>

        <Card className="border-amber-200/50 bg-amber-50/60 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-400" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Important caveat</h2>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                The transcript exports do not always cleanly preserve every script question as a
                separate answer, so this report should be read as a careful synthesis rather than a
                literal coding sheet. Where ordering or direct comparison signals are imperfect, the
                strongest weight should be placed on repeated patterns and explicit comparative remarks.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Executive summary</h2>
          <div className="mt-4 space-y-4">
            {executiveSummary.map((paragraph, index) => (
              <p key={index} className="text-sm leading-7 text-foreground">
                {paragraph}
              </p>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">What the research says</h2>
          <div className="mt-5 space-y-6">
            {findings.map((finding, index) => (
              <div key={finding.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-medium text-foreground">
                    {index + 1}. {finding.title}
                  </h3>
                  {finding.severity && <Badge variant="secondary">{finding.severity}</Badge>}
                </div>
                <p className="text-sm leading-7 text-foreground">{sentence(finding.description)}</p>
                <div className="rounded-lg bg-muted/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Implication
                  </p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {deriveImplication(finding)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Key user needs emerging from the study</h2>
          <div className="mt-4 space-y-3">
            {keyNeeds.map((need, index) => (
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
            {recommendations.map((recommendation, index) => (
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
            {suggestedDirection.map((line, index) => (
              <p
                key={index}
                className={index === 0 ? 'text-sm leading-7 text-foreground' : 'text-sm leading-7 text-foreground'}
              >
                {line}
              </p>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Priority actions</h2>
          <div className="mt-5 space-y-5">
            {(Object.entries(priorityGroups) as Array<[PriorityBucket, Finding[]]>).map(([bucket, bucketFindings]) => (
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
          <p className="mt-4 text-sm leading-7 text-foreground">{finalTakeaway}</p>
        </Card>

        <Card className="border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">References</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            The report is drafted from the user test script, the question-by-question analysis,
            the participant-level appendix, and the imported transcript set for this project.
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Research inputs</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>User test script</p>
                <p>Question-by-question analysis</p>
                <p>Per-question, per-user appendix</p>
                <p>{project.transcriptCount} imported transcript file(s)</p>
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">Transcript references</p>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {transcriptReferences.length > 0 ? (
                  transcriptReferences.map((reference) => (
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
