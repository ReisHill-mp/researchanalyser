'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { VerticalStepper } from '@/components/stepper'
import { StepProjectSetup } from '@/components/steps/step-project-setup'
import { StepTestType } from '@/components/steps/step-test-type'
import { StepResearchScript } from '@/components/steps/step-research-script'
import { StepIngestMap } from '@/components/steps/step-ingest-map'
import { StepGenerateAnalysis } from '@/components/steps/step-generate-analysis'
import { StepFinalReport } from '@/components/steps/step-final-report'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export interface ProjectFormData {
  projectName: string
  ownerName: string
  description: string
  tags: string[]
  testScript: string
  isABComparison: boolean
  studyType: 'single-flow' | 'balanced-comparison' | 'moderated-test'
  sessionsUrl: string
  authState: 'disconnected' | 'connecting' | 'connected' | 'error'
  projectId?: string
}

const initialFormData: ProjectFormData = {
  projectName: '',
  ownerName: '',
  description: '',
  tags: [],
  testScript: '',
  isABComparison: false,
  studyType: 'single-flow',
  sessionsUrl: '',
  authState: 'disconnected',
  projectId: undefined,
}

function getWorkflowSteps(studyType: ProjectFormData['studyType']) {
  const isModerated = studyType === 'moderated-test'

  return [
    { id: 1, name: 'Project Setup', description: 'Basic project details' },
    { id: 2, name: 'Test Type', description: 'Choose the research format' },
    {
      id: 3,
      name: isModerated ? 'Research Inputs' : 'Research Script',
      description: isModerated ? 'Guide, objectives, and upfront context' : 'Script and study materials',
    },
    { id: 4, name: 'Transcripts', description: 'Automatic or manual collection' },
    {
      id: 5,
      name: isModerated ? 'Research Analysis' : 'Analysis',
      description: isModerated ? 'Theme-led research synthesis' : 'Per-question, per-user synthesis',
    },
    { id: 6, name: 'Report', description: 'Review final outputs' },
  ]
}

export default function NewProjectPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const steps = getWorkflowSteps(formData.studyType)

  const updateFormData = (updates: Partial<ProjectFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const handleNext = async () => {
    if (currentStep === 3 && !formData.projectId) {
      setIsCreatingProject(true)
      setSubmitError(null)
      try {
        const tags = [...formData.tags]
        const modeTag = formData.studyType === 'moderated-test' ? 'moderated' : 'unmoderated'
        if (!tags.includes(modeTag)) tags.push(modeTag)

        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: formData.projectName,
            studyName: formData.projectName,
            ownerName: formData.ownerName,
            description: formData.description,
            tags,
            testScript: formData.testScript,
            isABComparison: formData.isABComparison,
            studyType: formData.studyType,
            sessionsUrl: '',
          }),
        })
        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || 'Failed to create project')
        }
        const project = await response.json()
        updateFormData({
          projectId: project.id,
          sessionsUrl: project.usertesting_url || '',
        })
        setCurrentStep(4)
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Failed to create project')
      } finally {
        setIsCreatingProject(false)
      }
      return
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <StepProjectSetup formData={formData} updateFormData={updateFormData} />
      case 2:
        return <StepTestType formData={formData} updateFormData={updateFormData} />
      case 3:
        return <StepResearchScript formData={formData} updateFormData={updateFormData} />
      case 4:
        return <StepIngestMap projectId={formData.projectId} />
      case 5:
        return <StepGenerateAnalysis projectId={formData.projectId} studyType={formData.studyType} />
      case 6:
        return <StepFinalReport projectId={formData.projectId} studyType={formData.studyType} />
      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.projectName.trim() !== '' && formData.ownerName.trim() !== ''
      case 2:
        return formData.studyType.trim() !== ''
      case 3:
        return formData.testScript.trim() !== ''
      case 4:
      case 5:
      case 6:
        return true
      default:
        return false
    }
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Projects', href: '/' },
        { label: 'New Project' },
      ]}
    >
      <div className="flex h-full">
        {/* Left sidebar with stepper */}
        <div className="w-64 border-r border-border bg-muted/20 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Create Project</h2>
          <VerticalStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-3xl">
              {renderStepContent()}
            </div>
          </div>

          {/* Footer with navigation */}
          <div className="border-t border-border bg-background px-8 py-4">
            <div className="flex items-center justify-between max-w-3xl">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <div className="text-sm text-muted-foreground">
                Step {currentStep} of {steps.length}
              </div>

              {currentStep === steps.length ? (
                <div />
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isCreatingProject}
                  className="gap-2"
                >
                  {isCreatingProject ? 'Saving...' : 'Continue'}
                  {!isCreatingProject && <ArrowRight className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
