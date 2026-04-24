'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import type { ProjectFormData } from '@/app/projects/new/page'

interface StepResearchScriptProps {
  formData: ProjectFormData
  updateFormData: (updates: Partial<ProjectFormData>) => void
}

export function StepResearchScript({ formData, updateFormData }: StepResearchScriptProps) {
  const isModerated = formData.studyType === 'moderated-test'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {isModerated ? 'Research Inputs' : 'Research Script'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isModerated
            ? 'Paste the moderated discussion guide, upfront context, or interview structure that should ground the later research analysis.'
            : 'Paste the research script that should drive the later question-by-question analysis.'}
        </p>
      </div>

      <Card className="p-5 border-border bg-card">
        <div className="space-y-2">
          <Label htmlFor="testScript">{isModerated ? 'Research inputs *' : 'Research script *'}</Label>
          <Textarea
            id="testScript"
            placeholder={
              isModerated
                ? 'Paste the moderated discussion guide, objectives, and upfront interview context here...'
                : 'Paste the UserTesting or unmoderated research script here...'
            }
            value={formData.testScript}
            onChange={(e) => updateFormData({ testScript: e.target.value })}
            className="bg-secondary border-border min-h-[28rem] font-mono text-[15px]"
          />
          <p className="text-sm text-muted-foreground">
            {isModerated
              ? 'These materials will be used as the grounding context for the later research analysis and final report.'
              : 'This script will be used as the source of truth for the per-question, per-user analysis.'}
          </p>
        </div>
      </Card>
    </div>
  )
}
