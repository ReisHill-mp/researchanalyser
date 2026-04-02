export type StudyType =
  | 'single-flow'
  | 'concept-test'
  | 'balanced-comparison'
  | 'ab-comparison'
  | 'within-subject'
  | 'between-subject'

export type BalancingMethod =
  | 'random'
  | 'fixed-order'
  | 'round-robin'
  | 'latin-square'
  | 'manual'

export type ProjectStatus =
  | 'draft'
  | 'materials-uploaded'
  | 'design-defined'
  | 'connected'
  | 'ingesting'
  | 'validation-required'
  | 'validated'
  | 'analyzing'
  | 'complete'
  | 'blocked'

export type TranscriptStatus =
  | 'pending'
  | 'exported'
  | 'failed'
  | 'mapped'
  | 'excluded'

export type ValidationFlag =
  | 'missing-assignment'
  | 'order-incomplete'
  | 'low-confidence'
  | 'quality-issue'
  | 'excluded'

export interface Condition {
  id: string
  name: string
  description?: string
}

export interface Participant {
  id: string
  sessionId: string
  condition?: string
  expectedOrder?: number
  actualOrder?: number
  completion: 'complete' | 'partial' | 'abandoned'
  transcriptStatus: TranscriptStatus
  validationFlags: ValidationFlag[]
  excluded?: boolean
}

export interface Finding {
  id: string
  type: 'pain-point' | 'delighter' | 'insight' | 'recommendation'
  title: string
  description: string
  severity?: 'critical' | 'major' | 'minor'
  participantCount: number
  conditions: string[]
  citations: Citation[]
  tags: string[]
}

export interface Citation {
  participantId: string
  timestamp?: string
  quote: string
}

export interface Project {
  id: string
  name: string
  studyName: string
  description: string
  studyType: StudyType
  status: ProjectStatus
  transcriptCount: number
  findingsCount: number
  participantCount: number
  tags: string[]
  team: string[]
  usertestingUrl?: string
  testScript?: string
  isABComparison?: boolean
  createdAt: string
  updatedAt: string
  conditions?: Condition[]
  balancingMethod?: BalancingMethod
  participants?: Participant[]
  findings?: Finding[]
}

export interface AnalysisQuestion {
  id: string
  question: string
  summary: string
  keyInsights: string[]
  participantCount: number
  conditionBreakdown: Record<string, string>
  citations: Citation[]
}

export interface JobProgress {
  sessionsDiscovered: number
  transcriptsExported: number
  failedExports: number
  mappedParticipants: number
  lowConfidenceMappings: number
}

export interface ValidationSummary {
  participantsIngested: number
  participantsMapped: number
  missingAssignments: number
  sampleImbalance: boolean
  parseConfidence: number
  qualityIssues: number
  excludedParticipants: number
}
