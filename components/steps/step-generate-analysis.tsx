'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Play,
  Loader2,
  CheckCircle2,
  FileText,
  Database,
  FileOutput,
  Sparkles,
} from 'lucide-react'
import type { AnalysisRun } from '@/lib/queries'

type AnalysisMode = 'descriptive' | 'within-condition' | 'cross-condition' | 'order-effect'

interface StepGenerateAnalysisProps {
  projectId?: string
}

export function StepGenerateAnalysis({ projectId }: StepGenerateAnalysisProps) {
  const router = useRouter()
  const [selectedModes, setSelectedModes] = useState<AnalysisMode[]>(['descriptive', 'cross-condition'])
  const [analysis, setAnalysis] = useState<AnalysisRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)

  const analysisModes: { value: AnalysisMode; label: string; description: string }[] = [
    {
      value: 'descriptive',
      label: 'Descriptive Only',
      description: 'Summarize findings without comparative analysis',
    },
    {
      value: 'within-condition',
      label: 'Within-Condition Synthesis',
      description: 'Analyze patterns within each condition',
    },
    {
      value: 'cross-condition',
      label: 'Cross-Condition Comparison',
      description: 'Compare findings across conditions',
    },
    {
      value: 'order-effect',
      label: 'Order-Effect Review',
      description: 'Analyze potential order/learning effects',
    },
  ]

  const handleModeToggle = (mode: AnalysisMode) => {
    setSelectedModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    )
  }

  const fetchAnalysis = async () => {
    if (!projectId) return
    try {
      const response = await fetch(`/api/projects/${projectId}/analysis`)
      if (!response.ok) throw new Error('Failed to fetch analysis status')
      const data = await response.json()
      setAnalysis(data)
    } catch (error) {
      console.error('Failed to fetch analysis:', error)
    }
  }

  useEffect(() => {
    if (!projectId) return
    fetchAnalysis()
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    if (!analysis || (analysis.status !== 'queued' && analysis.status !== 'running')) return

    const timer = setInterval(() => {
      fetchAnalysis().catch((error) => {
        console.error('Failed to refresh analysis status:', error)
      })
    }, 3000)

    return () => clearInterval(timer)
  }, [projectId, analysis?.status])

  const handleRunAnalysis = async () => {
    if (!projectId) {
      setRunError('Project must be created before analysis can run.')
      return
    }
    setLoading(true)
    setRunError(null)

    try {
      const response = await fetch(`/api/projects/${projectId}/analysis`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to start analysis')
      }

      await fetchAnalysis()
    } catch (error) {
      setRunError(error instanceof Error ? error.message : 'Failed to start analysis')
    } finally {
      setLoading(false)
    }
  }

  const isRunning = analysis?.status === 'queued' || analysis?.status === 'running'
  const progress = useMemo(() => {
    if (!analysis) return 0
    if (analysis.status === 'queued') return 10
    if (analysis.status === 'complete') return 100
    if (analysis.status === 'failed') return 0
    const completedSteps = analysis.progressLog?.length || 0
    return Math.min(90, 15 + completedSteps * 18)
  }, [analysis])

  const outputs = [
    {
      id: 'questions',
      name: 'Question-by-Question Analysis',
      status:
        analysis?.status === 'complete'
          ? 'complete'
          : isRunning
          ? 'running'
          : 'pending',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'findings',
      name: 'Research Findings',
      status:
        analysis?.status === 'complete'
          ? 'complete'
          : analysis?.currentStep?.toLowerCase().includes('finding')
          ? 'running'
          : isRunning
          ? 'running'
          : 'pending',
      icon: <Database className="h-4 w-4" />,
    },
    {
      id: 'report',
      name: 'Light Insight Report',
      status:
        analysis?.status === 'complete'
          ? 'complete'
          : analysis?.currentStep?.toLowerCase().includes('report')
          ? 'running'
          : isRunning
          ? 'running'
          : 'pending',
      icon: <FileOutput className="h-4 w-4" />,
    },
  ] as const

  const handleViewOutput = (outputId: 'questions' | 'findings' | 'report') => {
    if (!projectId) return

    const tab =
      outputId === 'questions'
        ? 'analysis'
        : outputId === 'report'
        ? 'report'
        : 'report'

    router.push(`/projects/${projectId}?tab=${tab}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Generate Analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure and run AI-powered analysis on your validated data.
        </p>
      </div>

      {/* Analysis Mode Selection */}
      <Card className="p-5 border-border bg-card">
        <Label className="text-sm font-medium text-foreground">Analysis Modes</Label>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Select the types of analysis to generate
        </p>

        <div className="space-y-3">
          {analysisModes.map((mode) => (
            <label
              key={mode.value}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors',
                selectedModes.includes(mode.value)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <Checkbox
                checked={selectedModes.includes(mode.value)}
                onCheckedChange={() => handleModeToggle(mode.value)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{mode.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Run Analysis */}
      <Card className="p-5 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-medium text-foreground">Run Analysis</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate outputs based on selected modes
            </p>
          </div>
          <Button
            onClick={handleRunAnalysis}
            disabled={isRunning || loading || selectedModes.length === 0 || !projectId}
            className="gap-2"
          >
            {isRunning || loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
        {runError && (
          <p className="text-sm text-destructive mb-4">{runError}</p>
        )}

        {(analysis || progress > 0) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {analysis?.currentStep && (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-sm font-medium text-foreground">{analysis.currentStep}</p>
                {analysis.errorMessage && (
                  <p className="text-xs text-destructive mt-1">{analysis.errorMessage}</p>
                )}
              </div>
            )}

            {(analysis?.progressLog?.length || 0) > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Activity
                </p>
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                  {analysis?.progressLog?.slice(-6).map((entry, index) => (
                    <p key={`${entry}-${index}`} className="text-xs text-muted-foreground">
                      {entry}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Output Cards */}
            <div className="space-y-2 pt-2">
              {outputs.map((output) => (
                <div
                  key={output.id}
                  className={cn(
                    'flex items-center gap-3 rounded-md p-3 transition-colors',
                    output.status === 'complete'
                      ? 'bg-success/10'
                      : output.status === 'running'
                      ? 'bg-primary/10'
                      : 'bg-muted/30'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md',
                      output.status === 'complete'
                        ? 'bg-success/20 text-success'
                        : output.status === 'running'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {output.status === 'running' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : output.status === 'complete' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      output.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{output.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {output.status === 'complete'
                        ? 'Generated successfully'
                        : output.status === 'running'
                        ? 'Processing...'
                        : 'Waiting...'}
                    </p>
                  </div>
                  {output.status === 'complete' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewOutput(output.id)}
                    >
                      View
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Model Info */}
      <Card className="p-4 border-border bg-muted/30">
        <div className="flex items-start gap-3 text-xs text-muted-foreground">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p>
              <strong className="text-foreground">Model:</strong> {analysis?.modelVersion || 'Local research synthesizer'}
            </p>
            <p className="mt-1">
              <strong className="text-foreground">Prompt Version:</strong> {analysis?.promptVersion || 'ux-researcher-designer-v1'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
