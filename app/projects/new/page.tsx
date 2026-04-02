'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { VerticalStepper } from '@/components/stepper'
import { StepProjectDetails } from '@/components/steps/step-project-details'
import { StepTestScript } from '@/components/steps/step-test-script'
import { StepStudyDesignSimple } from '@/components/steps/step-study-design-simple'
import { StepConnectUserTesting } from '@/components/steps/step-connect-usertesting'
import { StepIngestMap } from '@/components/steps/step-ingest-map'
import { StepGenerateAnalysis } from '@/components/steps/step-generate-analysis'
import { StepReviewChat } from '@/components/steps/step-review-chat'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const steps = [
  { id: 1, name: 'Project Details', description: 'Basic information' },
  { id: 2, name: 'Test Script', description: 'Study materials' },
  { id: 3, name: 'Study Design', description: 'A/B comparison?' },
  { id: 4, name: 'Connect UserTesting', description: 'Link sessions' },
  { id: 5, name: 'Ingest & Map', description: 'Import transcripts' },
  { id: 6, name: 'Generate Analysis', description: 'Run AI analysis' },
  { id: 7, name: 'Review & Ask', description: 'Explore findings' },
]

export interface ProjectFormData {
  // Step 1: Project Details
  projectName: string
  studyName: string
  description: string
  tags: string[]

  // Step 2: Test Script
  testScript: string

  // Step 3: Study Design
  isABComparison: boolean

  // Step 4: Connect
  sessionsUrl: string
  authState: 'disconnected' | 'connecting' | 'connected' | 'error'

  // Created project id (set after project is saved to DB)
  projectId?: string
}

const initialFormData: ProjectFormData = {
  projectName: '',
  studyName: '',
  description: '',
  tags: [],
  testScript: '',
  isABComparison: false,
  sessionsUrl: '',
  authState: 'disconnected',
  projectId: undefined,
}

export default function NewProjectPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const updateFormData = (updates: Partial<ProjectFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  // Create project in DB when moving from step 3 to step 4
  // so that step 4 and step 5 have a real project_id to work with
  const handleNext = async () => {
    if (currentStep === 3 && !formData.projectId) {
      setIsCreatingProject(true)
      setSubmitError(null)
      try {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: formData.projectName,
            studyName: formData.studyName,
            description: formData.description,
            tags: formData.tags,
            testScript: formData.testScript,
            isABComparison: formData.isABComparison,
            sessionsUrl: '',
          }),
        })
        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || 'Failed to create project')
        }
        const project = await response.json()
        updateFormData({ projectId: project.id })
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

  const handleCreateProject = async () => {
    // Project was already created when moving from step 3 to step 4
    if (formData.projectId) {
      router.push(`/projects/${formData.projectId}`)
      return
    }
    // Fallback: project wasn't created yet (shouldn't normally happen)
    setSubmitError('Project setup incomplete. Please go back to step 3 and continue.')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <StepProjectDetails formData={formData} updateFormData={updateFormData} />
      case 2:
        return <StepTestScript formData={formData} updateFormData={updateFormData} />
      case 3:
        return <StepStudyDesignSimple formData={formData} updateFormData={updateFormData} />
      case 4:
        return <StepConnectUserTesting formData={formData} updateFormData={updateFormData} projectId={formData.projectId} />
      case 5:
        return <StepIngestMap projectId={formData.projectId} />
      case 6:
        return <StepGenerateAnalysis projectId={formData.projectId} />
      case 7:
        return <StepReviewChat projectId={formData.projectId} />
      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.projectName.trim() !== '' && formData.studyName.trim() !== ''
      case 2:
        return formData.testScript.trim() !== ''
      case 3:
        return formData.projectName.trim() !== '' && formData.testScript.trim() !== ''
      case 4:
      case 5:
      case 6:
      case 7:
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
                <div className="flex items-center gap-3">
                  {submitError && (
                    <span className="text-sm text-destructive">{submitError}</span>
                  )}
                  <Button
                    onClick={handleCreateProject}
                    className="gap-2"
                  >
                    Complete Setup
                  </Button>
                </div>
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
