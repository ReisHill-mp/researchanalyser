'use client'

import { useState } from 'react'
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

type AnalysisMode = 'descriptive' | 'within-condition' | 'cross-condition' | 'order-effect'

interface AnalysisOutput {
  id: string
  name: string
  status: 'pending' | 'running' | 'complete'
  icon: React.ReactNode
}

export function StepGenerateAnalysis() {
  const [selectedModes, setSelectedModes] = useState<AnalysisMode[]>(['descriptive', 'cross-condition'])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [outputs, setOutputs] = useState<AnalysisOutput[]>([
    { id: 'questions', name: 'Question-by-Question Analysis', status: 'pending', icon: <FileText className="h-4 w-4" /> },
    { id: 'findings', name: 'Findings JSON', status: 'pending', icon: <Database className="h-4 w-4" /> },
    { id: 'report', name: 'Final Report', status: 'pending', icon: <FileOutput className="h-4 w-4" /> },
  ])

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

  const handleRunAnalysis = async () => {
    setIsRunning(true)
    setProgress(0)

    // Simulate analysis progress
    const progressSteps = [
      { progress: 15, output: 'questions', status: 'running' as const },
      { progress: 40, output: 'questions', status: 'complete' as const },
      { progress: 55, output: 'findings', status: 'running' as const },
      { progress: 75, output: 'findings', status: 'complete' as const },
      { progress: 85, output: 'report', status: 'running' as const },
      { progress: 100, output: 'report', status: 'complete' as const },
    ]

    for (const step of progressSteps) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setProgress(step.progress)
      setOutputs((prev) =>
        prev.map((o) => (o.id === step.output ? { ...o, status: step.status } : o))
      )
    }

    setIsRunning(false)
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
            disabled={isRunning || selectedModes.length === 0}
            className="gap-2"
          >
            {isRunning ? (
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

        {(isRunning || progress > 0) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

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
                    <Button variant="ghost" size="sm">
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
              <strong className="text-foreground">Model:</strong> GPT-4 Turbo
            </p>
            <p className="mt-1">
              <strong className="text-foreground">Prompt Version:</strong> v2.4.1
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
