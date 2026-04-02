'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ProjectFormData } from '@/app/projects/new/page'

interface StepTestScriptProps {
  formData: ProjectFormData
  updateFormData: (updates: Partial<ProjectFormData>) => void
}

export function StepTestScript({ formData, updateFormData }: StepTestScriptProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Test Script</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste your test script content. The script is required so the system can understand the study structure and improve analysis accuracy.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="testScript">Test Script Content *</Label>
          <Textarea
            id="testScript"
            placeholder="Paste your test script here..."
            value={formData.testScript}
            onChange={(e) => updateFormData({ testScript: e.target.value })}
            className="bg-secondary border-border min-h-96 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Include tasks, instructions, and any other content used to guide participants
          </p>
        </div>
      </div>
    </div>
  )
}
