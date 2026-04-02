'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  FileOutput,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Project } from '@/lib/types'
import type { Finding, AnalysisRun } from '@/lib/queries'

interface ProjectReportProps {
  project: Project
}

const studyTypeLabels: Record<string, string> = {
  'single-flow': 'Single Flow',
  'concept-test': 'Concept Test',
  'balanced-comparison': 'Balanced Comparison',
  'ab-comparison': 'A/B Comparison',
  'within-subject': 'Within-Subject',
  'between-subject': 'Between-Subject',
}

export function ProjectReport({ project }: ProjectReportProps) {
  const [findings, setFindings] = useState<Finding[]>([])
  const [analysis, setAnalysis] = useState<AnalysisRun | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReportData() {
      try {
        const response = await fetch(`/api/projects/${project.id}/report`)
        if (!response.ok) throw new Error('Failed to fetch report data')
        const data = await response.json()
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

    fetchReportData()
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

  if (findings.length === 0 && !analysis) {
    return (
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Report</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Final research report generated from analysis.
            </p>
          </div>
        </div>
        <Card className="p-8 border-border bg-card text-center">
          <FileOutput className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">No report available yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            A report will be generated after analysis is complete.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Report</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Final research report generated from analysis.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Report Content */}
        <div className="col-span-2">
          <Card className="p-8 border-border bg-card">
            <article className="prose prose-sm prose-invert max-w-none">
              {/* Executive Summary */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Executive Summary</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {project.description || `This ${studyTypeLabels[project.studyType] || project.studyType} study "${project.studyName}" analyzed ${project.transcriptCount} transcripts across ${project.participantCount} participants to generate ${project.findingsCount} findings.`}
                </p>
                <div className="grid grid-cols-3 gap-4 mt-4 not-prose">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-semibold text-primary">{project.transcriptCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Transcripts</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-semibold text-success">{project.participantCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Participants</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <p className="text-2xl font-semibold text-foreground">{project.findingsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Findings</p>
                  </div>
                </div>
              </section>

              {/* Key Findings */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Key Findings</h2>
                {findings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No findings available for this project yet.</p>
                ) : (
                  <div className="space-y-4 not-prose">
                    {findings.slice(0, 6).map((finding) => (
                      <div
                        key={finding.id}
                        className="flex items-start gap-3 p-4 rounded-lg bg-muted/20 border border-border"
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded shrink-0 ${
                            finding.type === 'pain-point'
                              ? 'bg-destructive/10 text-destructive'
                              : finding.type === 'delighter'
                              ? 'bg-success/10 text-success'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {finding.type === 'pain-point' ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : finding.type === 'delighter' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground">{finding.title}</h4>
                            {finding.severity && (
                              <Badge
                                variant="secondary"
                                className={
                                  finding.severity === 'critical'
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-warning/10 text-warning'
                                }
                              >
                                {finding.severity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {finding.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Recommendations */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Recommendations</h2>
                <div className="space-y-3 not-prose">
                  {[
                    {
                      priority: 'High',
                      title: 'Proceed with variant implementation',
                      description: 'Strong evidence supports the streamlined checkout as the superior experience.',
                    },
                    {
                      priority: 'High',
                      title: 'Improve payment method selection',
                      description: 'Address the confusion between saved and new payment methods in both flows.',
                    },
                    {
                      priority: 'Medium',
                      title: 'Add persistent order summary',
                      description: 'Users consistently requested visibility into their order throughout checkout.',
                    },
                    {
                      priority: 'Low',
                      title: 'Conduct follow-up study on mobile',
                      description: 'This study focused on desktop; recommend validating findings on mobile.',
                    },
                  ].map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20">
                      <Badge
                        variant="secondary"
                        className={
                          rec.priority === 'High'
                            ? 'bg-destructive/10 text-destructive'
                            : rec.priority === 'Medium'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {rec.priority}
                      </Badge>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">{rec.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Methodology Note */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4">Methodology</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  This study used a {studyTypeLabels[project.studyType] || project.studyType} design with {project.participantCount} participants
                  recruited through UserTesting. {project.transcriptCount} sessions were analyzed
                  using AI-assisted transcript analysis to generate {project.findingsCount} findings.
                  Sessions included think-aloud protocol during task completion followed by post-task questions.
                </p>
              </section>
            </article>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Confidence Note */}
          <Card className="p-4 border-border bg-card">
            <h3 className="text-sm font-medium text-foreground mb-3">Confidence Assessment</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Overall Confidence</span>
                <Badge variant="secondary" className={
                  project.transcriptCount >= 20 
                    ? "bg-success/10 text-success" 
                    : project.transcriptCount >= 10 
                    ? "bg-warning/10 text-warning"
                    : "bg-muted text-muted-foreground"
                }>
                  {project.transcriptCount >= 20 ? 'High' : project.transcriptCount >= 10 ? 'Medium' : 'Low'}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>• {project.participantCount} participants</p>
                <p>• {project.transcriptCount} transcripts analyzed</p>
                <p>• {project.findingsCount} findings identified</p>
                <p>• {studyTypeLabels[project.studyType] || project.studyType} design</p>
              </div>
            </div>
          </Card>

          {/* Limitations */}
          <Card className="p-4 border-border bg-card">
            <h3 className="text-sm font-medium text-foreground mb-3">Limitations</h3>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>
                Desktop-only study; mobile behavior may differ
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>
                Simulated checkout (no real purchase)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-warning mt-0.5">•</span>
                US participants only
              </li>
            </ul>
          </Card>

          {/* Report Metadata */}
          <Card className="p-4 border-border bg-muted/30">
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Report Generated</p>
                <p className="mt-1">
                  {analysis?.completedAt 
                    ? formatDistanceToNow(new Date(analysis.completedAt), { addSuffix: true })
                    : formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
                  }
                </p>
                <p>Project: {project.name}</p>
                {analysis && (
                  <>
                    <p className="mt-2 font-medium text-foreground">AI Assistance</p>
                    <p>Model: {analysis.modelVersion || 'GPT-4'}</p>
                    <p>Prompt: {analysis.promptVersion || 'v1.0'}</p>
                    <p className="capitalize">Status: {analysis.status}</p>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
