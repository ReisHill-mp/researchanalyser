'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface StepFinalReportProps {
  projectId?: string
  studyType?: 'single-flow' | 'balanced-comparison' | 'moderated-test'
}

export function StepFinalReport({
  projectId,
  studyType = 'single-flow',
}: StepFinalReportProps) {
  const router = useRouter()
  const isModerated = studyType === 'moderated-test'
  const openReport = () => {
    if (!projectId) return
    router.push(`/projects/${projectId}?tab=report`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Report Ready</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Once analysis is complete, open the saved outputs in the project workspace and review the final research report.
        </p>
      </div>

      <Card className="p-5 border-border bg-card">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">What this project now contains</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{isModerated ? 'The original research inputs stored under Materials' : 'The original research script stored under Materials'}</li>
            <li>Collected transcripts from Playwright capture or manual entry</li>
            <li>
              {isModerated
                ? 'A grounded research analysis generated from the inputs and transcripts'
                : 'Per-question, per-user analysis generated from the script and transcripts'}
            </li>
            <li>
              {isModerated
                ? 'A final research report built from the research inputs, analysis, and raw transcripts'
                : 'A final research report built from the analysis, script, and raw transcripts'}
            </li>
          </ul>
        </div>
      </Card>

      <Card className="p-5 border-border bg-muted/20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Finish setup</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Open the final report in the project workspace and continue reviewing from there.
            </p>
          </div>
          <Button onClick={openReport} disabled={!projectId} className="gap-2">
            Open report
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
