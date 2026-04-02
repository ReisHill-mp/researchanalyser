'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  id: number
  name: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isComplete = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isClickable = onStepClick && step.id <= currentStep

          return (
            <li
              key={step.id}
              className={cn('relative flex-1', index !== steps.length - 1 && 'pr-8')}
            >
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all',
                    isComplete && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary',
                    !isComplete && !isCurrent && 'border-border bg-background text-muted-foreground',
                    isClickable && 'cursor-pointer hover:border-primary/80'
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </button>

                {/* Connector line */}
                {index !== steps.length - 1 && (
                  <div className="absolute top-4 left-8 -translate-y-1/2 w-[calc(100%-2rem)] h-0.5">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        isComplete ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="mt-2 min-w-max">
                <span
                  className={cn(
                    'text-xs font-medium',
                    isCurrent ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.name}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

interface VerticalStepperProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (step: number) => void
}

export function VerticalStepper({ steps, currentStep, onStepClick }: VerticalStepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="space-y-4">
        {steps.map((step, index) => {
          const isComplete = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isClickable = onStepClick && step.id <= currentStep

          return (
            <li key={step.id} className="relative">
              <div className="flex items-start gap-3">
                <div className="relative flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => isClickable && onStepClick(step.id)}
                    disabled={!isClickable}
                    className={cn(
                      'relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all',
                      isComplete && 'border-primary bg-primary text-primary-foreground',
                      isCurrent && 'border-primary bg-background text-primary',
                      !isComplete && !isCurrent && 'border-border bg-background text-muted-foreground',
                      isClickable && 'cursor-pointer hover:border-primary/80'
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </button>

                  {/* Vertical connector */}
                  {index !== steps.length - 1 && (
                    <div
                      className={cn(
                        'absolute top-8 w-0.5 h-8',
                        step.id < currentStep ? 'bg-primary' : 'bg-border'
                      )}
                    />
                  )}
                </div>

                <div className="pt-1">
                  <span
                    className={cn(
                      'text-sm font-medium block',
                      isCurrent ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.name}
                  </span>
                  {step.description && (
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
