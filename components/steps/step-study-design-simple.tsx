'use client'

import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { ProjectFormData } from '@/app/projects/new/page'

interface StepStudyDesignSimpleProps {
  formData: ProjectFormData
  updateFormData: (updates: Partial<ProjectFormData>) => void
}

export function StepStudyDesignSimple({ formData, updateFormData }: StepStudyDesignSimpleProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Study Design</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about the structure of your study.
        </p>
      </div>

      <Card className="p-6 border-border bg-card">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Does this test include an A/B comparison?</Label>
            <p className="mt-2 text-sm text-muted-foreground">
              Select whether you're testing one experience or comparing two variants.
            </p>
          </div>

          <RadioGroup
            value={formData.isABComparison ? 'yes' : 'no'}
            onValueChange={(value) => updateFormData({ isABComparison: value === 'yes' })}
            className="space-y-3 mt-4"
          >
            <label
              className={cn(
                'flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors',
                !formData.isABComparison
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <RadioGroupItem value="no" className="mt-1" />
              <div>
                <p className="font-medium text-foreground">No - Single experience</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Evaluating one design or prototype
                </p>
              </div>
            </label>

            <label
              className={cn(
                'flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors',
                formData.isABComparison
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <RadioGroupItem value="yes" className="mt-1" />
              <div>
                <p className="font-medium text-foreground">Yes - A/B comparison</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Comparative analysis will consider both variants
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>
      </Card>
    </div>
  )
}
