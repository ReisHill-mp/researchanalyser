'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, Image, Table, X, CheckCircle2 } from 'lucide-react'
import type { ProjectFormData } from '@/app/projects/new/page'

interface StepUploadMaterialsProps {
  formData: ProjectFormData
  updateFormData: (updates: Partial<ProjectFormData>) => void
}

interface FileUploadZoneProps {
  label: string
  description: string
  icon: React.ReactNode
  accept?: string
  multiple?: boolean
  file?: File | null
  files?: File[]
  onFileSelect: (files: FileList | null) => void
  onRemove?: () => void
  optional?: boolean
}

function FileUploadZone({
  label,
  description,
  icon,
  accept,
  multiple,
  file,
  files,
  onFileSelect,
  onRemove,
  optional,
}: FileUploadZoneProps) {
  const hasFile = file || (files && files.length > 0)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        {optional && <span className="text-xs text-muted-foreground">(Optional)</span>}
      </Label>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          hasFile
            ? 'border-primary/50 bg-primary/5'
            : 'border-border hover:border-primary/30 hover:bg-muted/30'
        )}
      >
        {hasFile ? (
          <div className="p-4">
            {file && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                {onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
            {files && files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{f.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {icon}
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag and drop or click to browse
            </p>
            <input
              type="file"
              className="sr-only"
              accept={accept}
              multiple={multiple}
              onChange={(e) => onFileSelect(e.target.files)}
            />
          </label>
        )}
      </div>
    </div>
  )
}

export function StepUploadMaterials({ formData, updateFormData }: StepUploadMaterialsProps) {
  const [parseResult, setParseResult] = useState<{
    taskCount: number
    confidence: number
  } | null>(null)

  const handleTestScriptUpload = (files: FileList | null) => {
    if (files && files[0]) {
      updateFormData({ testScript: files[0] })
      // Simulate parsing
      setTimeout(() => {
        setParseResult({
          taskCount: 5,
          confidence: 0.92,
        })
      }, 500)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Upload Research Materials</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your test script and any supporting materials for this study.
        </p>
      </div>

      <div className="space-y-6">
        <FileUploadZone
          label="Primary Test Script"
          description="Upload your test script document"
          icon={<FileText className="h-6 w-6 text-muted-foreground" />}
          accept=".pdf,.doc,.docx,.txt"
          file={formData.testScript}
          onFileSelect={handleTestScriptUpload}
          onRemove={() => {
            updateFormData({ testScript: null })
            setParseResult(null)
          }}
        />

        {parseResult && (
          <Card className="p-4 bg-muted/30 border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">Parse Results</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Detected Tasks</p>
                <p className="text-lg font-semibold text-foreground">{parseResult.taskCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Parse Confidence</p>
                <p className="text-lg font-semibold text-foreground">
                  {(parseResult.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>
        )}

        <FileUploadZone
          label="Screener"
          description="Upload participant screener criteria"
          icon={<FileText className="h-6 w-6 text-muted-foreground" />}
          accept=".pdf,.doc,.docx,.txt"
          file={formData.screener}
          onFileSelect={(files) => files && updateFormData({ screener: files[0] })}
          onRemove={() => updateFormData({ screener: null })}
          optional
        />

        <FileUploadZone
          label="Stimuli Files"
          description="Upload screenshots, mockups, or prototypes"
          icon={<Image className="h-6 w-6 text-muted-foreground" />}
          accept=".png,.jpg,.jpeg,.gif,.pdf"
          multiple
          files={formData.stimuli}
          onFileSelect={(files) => files && updateFormData({ stimuli: Array.from(files) })}
          optional
        />

        <FileUploadZone
          label="Assignment Sheet"
          description="Upload condition assignment mapping"
          icon={<Table className="h-6 w-6 text-muted-foreground" />}
          accept=".csv,.xlsx"
          file={formData.assignmentSheet}
          onFileSelect={(files) => files && updateFormData({ assignmentSheet: files[0] })}
          onRemove={() => updateFormData({ assignmentSheet: null })}
          optional
        />
      </div>
    </div>
  )
}
