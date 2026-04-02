'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X, AlertCircle } from 'lucide-react'
import type { ProjectFormData } from '@/app/projects/new/page'
import type { StudyType, BalancingMethod, Condition } from '@/lib/types'

interface StepStudyDesignProps {
  formData: ProjectFormData
  updateFormData: (updates: Partial<ProjectFormData>) => void
}

const studyTypes: { value: StudyType; label: string; description: string; comparative: boolean }[] = [
  {
    value: 'single-flow',
    label: 'Single-Flow Evaluative',
    description: 'Evaluate one experience or prototype',
    comparative: false,
  },
  {
    value: 'concept-test',
    label: 'Concept Test',
    description: 'Test multiple concepts with different participants',
    comparative: true,
  },
  {
    value: 'balanced-comparison',
    label: 'Balanced Comparison',
    description: 'Compare conditions with controlled exposure',
    comparative: true,
  },
  {
    value: 'ab-comparison',
    label: 'A/B Comparison',
    description: 'Simple two-condition comparison',
    comparative: true,
  },
  {
    value: 'within-subject',
    label: 'Within-Subject',
    description: 'Each participant sees all conditions',
    comparative: true,
  },
  {
    value: 'between-subject',
    label: 'Between-Subject',
    description: 'Each participant sees one condition',
    comparative: true,
  },
]

const balancingMethods: { value: BalancingMethod; label: string; description: string }[] = [
  { value: 'random', label: 'Random', description: 'Random assignment to conditions' },
  { value: 'fixed-order', label: 'Fixed Order', description: 'Same order for all participants' },
  { value: 'round-robin', label: 'Round Robin', description: 'Cycle through conditions' },
  { value: 'latin-square', label: 'Latin Square', description: 'Balanced counterbalancing' },
  { value: 'manual', label: 'Manual', description: 'Manually assigned via sheet' },
]

export function StepStudyDesign({ formData, updateFormData }: StepStudyDesignProps) {
  const [newConditionName, setNewConditionName] = useState('')

  const selectedStudyType = studyTypes.find((t) => t.value === formData.studyType)
  const isComparative = selectedStudyType?.comparative ?? false

  const handleAddCondition = () => {
    if (newConditionName.trim()) {
      const newCondition: Condition = {
        id: `condition-${Date.now()}`,
        name: newConditionName.trim(),
      }
      updateFormData({ conditions: [...formData.conditions, newCondition] })
      setNewConditionName('')
    }
  }

  const handleRemoveCondition = (id: string) => {
    updateFormData({ conditions: formData.conditions.filter((c) => c.id !== id) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Define Study Design</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Specify the methodology and structure of your research study.
        </p>
      </div>

      <div className="space-y-6">
        {/* Study Type Selection */}
        <div className="space-y-3">
          <Label>Study Type</Label>
          <RadioGroup
            value={formData.studyType}
            onValueChange={(value) => updateFormData({ studyType: value as StudyType })}
            className="grid grid-cols-2 gap-3"
          >
            {studyTypes.map((type) => (
              <label
                key={type.value}
                className={cn(
                  'relative flex cursor-pointer rounded-lg border p-4 transition-colors',
                  formData.studyType === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                )}
              >
                <RadioGroupItem value={type.value} className="sr-only" />
                <div>
                  <p className="text-sm font-medium text-foreground">{type.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{type.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Comparative Study Settings */}
        {isComparative && (
          <>
            {/* Conditions */}
            <Card className="p-4 border-border bg-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground">Conditions</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define the variants or concepts being tested
                  </p>
                </div>
              </div>

              {formData.conditions.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.conditions.map((condition, index) => (
                    <div
                      key={condition.id}
                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                        <span className="text-sm text-foreground">{condition.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCondition(condition.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Condition name..."
                  value={newConditionName}
                  onChange={(e) => setNewConditionName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
                  className="bg-secondary border-border"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCondition}
                  disabled={!newConditionName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.conditions.length < 2 && (
                <div className="flex items-center gap-2 mt-3 text-xs text-warning">
                  <AlertCircle className="h-3 w-3" />
                  <span>At least 2 conditions required for comparative studies</span>
                </div>
              )}
            </Card>

            {/* Subject Type */}
            {(formData.studyType === 'balanced-comparison' || formData.studyType === 'within-subject' || formData.studyType === 'between-subject') && (
              <div className="space-y-3">
                <Label>Subject Design</Label>
                <RadioGroup
                  value={formData.subjectType}
                  onValueChange={(value) => updateFormData({ subjectType: value as 'within' | 'between' })}
                  className="flex gap-4"
                >
                  <label
                    className={cn(
                      'flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                      formData.subjectType === 'within'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value="within" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Within-Subject</p>
                      <p className="text-xs text-muted-foreground">Each participant sees all conditions</p>
                    </div>
                  </label>
                  <label
                    className={cn(
                      'flex flex-1 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors',
                      formData.subjectType === 'between'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value="between" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Between-Subject</p>
                      <p className="text-xs text-muted-foreground">Each participant sees one condition</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            )}

            {/* Balancing Method */}
            <div className="space-y-2">
              <Label>Balancing Method</Label>
              <Select
                value={formData.balancingMethod}
                onValueChange={(value) => updateFormData({ balancingMethod: value as BalancingMethod })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {balancingMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex flex-col">
                        <span>{method.label}</span>
                        <span className="text-xs text-muted-foreground">{method.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Sample Size */}
            <div className="space-y-2">
              <Label htmlFor="sampleSize">Target Sample Size</Label>
              <Input
                id="sampleSize"
                type="number"
                min={1}
                value={formData.targetSampleSize}
                onChange={(e) => updateFormData({ targetSampleSize: parseInt(e.target.value) || 1 })}
                className="bg-secondary border-border w-32"
              />
              <p className="text-xs text-muted-foreground">
                Total participants across all conditions
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
