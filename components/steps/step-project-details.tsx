'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { useState } from 'react'
import type { ProjectFormData } from '@/app/projects/new/page'

interface StepProjectDetailsProps {
  formData: ProjectFormData
  updateFormData: (updates: Partial<ProjectFormData>) => void
}

export function StepProjectDetails({ formData, updateFormData }: StepProjectDetailsProps) {
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
        <h2 className="text-xl font-semibold text-foreground">Project Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the basic information about your research project.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name *</Label>
          <Input
            id="projectName"
            placeholder="e.g., Q1 Checkout Optimization"
            value={formData.projectName}
            onChange={(e) => updateFormData({ projectName: e.target.value })}
            className="bg-secondary border-border"
          />
          <p className="text-xs text-muted-foreground">
            A short, descriptive name for this research project
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the goals and scope of this research..."
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
    </div>
  )
}
