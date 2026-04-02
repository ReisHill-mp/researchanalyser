import { cn } from '@/lib/utils'
import type { ProjectStatus, TranscriptStatus, ValidationFlag } from '@/lib/types'

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'processing'

const statusConfig: Record<ProjectStatus, { label: string; variant: StatusVariant }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  'materials-uploaded': { label: 'Materials Ready', variant: 'info' },
  'design-defined': { label: 'Design Defined', variant: 'info' },
  connected: { label: 'Connected', variant: 'info' },
  ingesting: { label: 'Ingesting', variant: 'processing' },
  'validation-required': { label: 'Validation Required', variant: 'warning' },
  validated: { label: 'Validated', variant: 'success' },
  analyzing: { label: 'Analyzing', variant: 'processing' },
  complete: { label: 'Complete', variant: 'success' },
  blocked: { label: 'Blocked', variant: 'error' },
}

const transcriptStatusConfig: Record<TranscriptStatus, { label: string; variant: StatusVariant }> = {
  pending: { label: 'Pending', variant: 'neutral' },
  exported: { label: 'Exported', variant: 'info' },
  failed: { label: 'Failed', variant: 'error' },
  mapped: { label: 'Mapped', variant: 'success' },
  excluded: { label: 'Excluded', variant: 'neutral' },
}

const validationFlagConfig: Record<ValidationFlag, { label: string; variant: StatusVariant }> = {
  'missing-assignment': { label: 'Missing Assignment', variant: 'error' },
  'order-incomplete': { label: 'Order Incomplete', variant: 'warning' },
  'low-confidence': { label: 'Low Confidence', variant: 'warning' },
  'quality-issue': { label: 'Quality Issue', variant: 'warning' },
  excluded: { label: 'Excluded', variant: 'neutral' },
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-success/15 text-success border-success/30',
  warning: 'bg-warning/15 text-warning border-warning/30',
  error: 'bg-destructive/15 text-destructive border-destructive/30',
  info: 'bg-primary/15 text-primary border-primary/30',
  neutral: 'bg-muted text-muted-foreground border-border',
  processing: 'bg-primary/15 text-primary border-primary/30',
}

const dotStyles: Record<StatusVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
  info: 'bg-primary',
  neutral: 'bg-muted-foreground',
  processing: 'bg-primary animate-pulse',
}

interface StatusBadgeProps {
  status: ProjectStatus | TranscriptStatus
  type?: 'project' | 'transcript'
  size?: 'sm' | 'md'
  showDot?: boolean
}

export function StatusBadge({ 
  status, 
  type = 'project', 
  size = 'sm',
  showDot = true 
}: StatusBadgeProps) {
  const config = type === 'project' 
    ? statusConfig[status as ProjectStatus] 
    : transcriptStatusConfig[status as TranscriptStatus]
  
  if (!config) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium',
        variantStyles[config.variant],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[config.variant])} />
      )}
      {config.label}
    </span>
  )
}

interface ValidationFlagBadgeProps {
  flag: ValidationFlag
}

export function ValidationFlagBadge({ flag }: ValidationFlagBadgeProps) {
  const config = validationFlagConfig[flag]
  if (!config) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        variantStyles[config.variant]
      )}
    >
      {config.label}
    </span>
  )
}
