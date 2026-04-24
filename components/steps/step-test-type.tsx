'use client'

import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { ProjectFormData } from '@/app/projects/new/page'

interface StepTestTypeProps {
  formData: ProjectFormData
  updateFormData: (updates: Partial<ProjectFormData>) => void
}

export function StepTestType({ formData, updateFormData }: StepTestTypeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Test Type</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the research format so the rest of the workflow and analysis shape match the study correctly.
        </p>
      </div>

      <Card className="p-5 border-border bg-card">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">What type of research is this?</Label>
            <p className="mt-2 text-sm text-muted-foreground">
              This choice controls how we guide setup, collect materials, and structure the analysis.
            </p>
          </div>

          <RadioGroup
            value={formData.studyType}
            onValueChange={(value) =>
              updateFormData({
                studyType: value as ProjectFormData['studyType'],
                isABComparison: value === 'balanced-comparison',
              })
            }
            className="space-y-3 mt-2"
          >
            {[
              {
                value: 'single-flow',
                title: 'Unmoderated test',
                description: 'A standard unmoderated test where the script drives question-by-question analysis.',
              },
              {
                value: 'balanced-comparison',
                title: 'Unmoderated with balanced comparison',
                description: 'An unmoderated comparison study where participant order matters and needs to be tracked.',
              },
              {
                value: 'moderated-test',
                title: 'Moderated',
                description: 'A moderated research study where the analysis should be more theme-led than question-led.',
              },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors',
                  formData.studyType === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                )}
              >
                <RadioGroupItem value={option.value} className="mt-1" />
                <div>
                  <p className="font-medium text-foreground">{option.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{option.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>
      </Card>
    </div>
  )
}
