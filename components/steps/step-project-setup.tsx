'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'
import type { ProjectFormData } from '@/app/projects/new/page'

interface StepProjectSetupProps {
  formData: ProjectFormData
  updateFormData: (updates: Partial<ProjectFormData>) => void
}

export function StepProjectSetup({ formData, updateFormData }: StepProjectSetupProps) {
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!formData.tags.includes(tagInput.trim())) {
        updateFormData({ tags: [...formData.tags, tagInput.trim()] })
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    updateFormData({ tags: formData.tags.filter((t) => t !== tag) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Project Setup</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the core project details first. You will add the research script and study format in the next step.
        </p>
      </div>

      <Card className="p-5 border-border bg-card">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              placeholder="e.g., App onboarding study"
              value={formData.projectName}
              onChange={(e) => updateFormData({ projectName: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Your Name *</Label>
            <Input
              id="ownerName"
              placeholder="e.g., Rich"
              value={formData.ownerName}
              onChange={(e) => updateFormData({ ownerName: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this study is trying to understand..."
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              className="bg-secondary border-border min-h-24"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Type and press Enter to add tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="bg-secondary border-border"
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {tag}</span>
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

    </div>
  )
}
