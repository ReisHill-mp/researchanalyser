import type { Project, Participant, Finding, AnalysisQuestion, ValidationSummary } from './types'

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Q1 Checkout Optimization',
    studyName: 'Checkout Flow Comparison Study',
    description: 'Evaluating new streamlined checkout against current multi-step flow',
    studyType: 'ab-comparison',
    status: 'complete',
    transcriptCount: 24,
    findingsCount: 5,
    participantCount: 24,
    tags: ['checkout', 'conversion', 'q1-2024'],
    team: ['Sarah Chen', 'Mike Johnson'],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
    conditions: [
      { id: 'control', name: 'Current Checkout', description: 'Existing multi-step checkout flow' },
      { id: 'variant', name: 'Streamlined Checkout', description: 'New single-page checkout' },
    ],
    balancingMethod: 'round-robin',
  },
  {
    id: '2',
    name: 'Mobile Navigation Redesign',
    studyName: 'Nav Pattern Concept Test',
    description: 'Testing three navigation pattern concepts for mobile app',
    studyType: 'concept-test',
    status: 'validation-required',
    transcriptCount: 18,
    findingsCount: 3,
    participantCount: 18,
    tags: ['mobile', 'navigation', 'q1-2024'],
    team: ['Lisa Park', 'James Wilson'],
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-28T16:45:00Z',
    conditions: [
      { id: 'bottom-nav', name: 'Bottom Navigation' },
      { id: 'hamburger', name: 'Hamburger Menu' },
      { id: 'gesture', name: 'Gesture-Based Navigation' },
    ],
    balancingMethod: 'latin-square',
  },
  {
    id: '3',
    name: 'Onboarding Flow Evaluation',
    studyName: 'New User Onboarding Study',
    description: 'Single-flow evaluation of the updated onboarding experience',
    studyType: 'single-flow',
    status: 'analyzing',
    transcriptCount: 12,
    findingsCount: 2,
    participantCount: 12,
    tags: ['onboarding', 'new-users', 'q1-2024'],
    team: ['Sarah Chen'],
    createdAt: '2024-01-25T11:00:00Z',
    updatedAt: '2024-01-30T10:15:00Z',
  },
  {
    id: '4',
    name: 'Dashboard Widget Study',
    studyName: 'Widget Layout Comparison',
    description: 'Within-subject comparison of dashboard widget arrangements',
    studyType: 'within-subject',
    status: 'ingesting',
    transcriptCount: 8,
    findingsCount: 0,
    participantCount: 16,
    tags: ['dashboard', 'widgets', 'q1-2024'],
    team: ['Mike Johnson', 'Lisa Park'],
    createdAt: '2024-01-28T14:00:00Z',
    updatedAt: '2024-01-29T09:30:00Z',
    conditions: [
      { id: 'grid', name: 'Grid Layout' },
      { id: 'list', name: 'List Layout' },
    ],
    balancingMethod: 'random',
  },
  {
    id: '5',
    name: 'Search Results Page',
    studyName: 'Search UX Evaluation',
    description: 'Evaluating search result presentation and filtering',
    studyType: 'single-flow',
    status: 'draft',
    transcriptCount: 0,
    findingsCount: 0,
    participantCount: 0,
    tags: ['search', 'discovery'],
    team: ['James Wilson'],
    createdAt: '2024-01-30T08:00:00Z',
    updatedAt: '2024-01-30T08:00:00Z',
  },
]

export const mockParticipants: Participant[] = [
  { id: 'P001', sessionId: 'S001', condition: 'control', expectedOrder: 1, actualOrder: 1, completion: 'complete', transcriptStatus: 'mapped', validationFlags: [] },
  { id: 'P002', sessionId: 'S002', condition: 'variant', expectedOrder: 2, actualOrder: 2, completion: 'complete', transcriptStatus: 'mapped', validationFlags: [] },
  { id: 'P003', sessionId: 'S003', condition: 'control', expectedOrder: 3, actualOrder: 3, completion: 'complete', transcriptStatus: 'mapped', validationFlags: [] },
  { id: 'P004', sessionId: 'S004', condition: 'variant', expectedOrder: 4, actualOrder: 4, completion: 'complete', transcriptStatus: 'mapped', validationFlags: [] },
  { id: 'P005', sessionId: 'S005', condition: 'control', expectedOrder: 5, actualOrder: 5, completion: 'partial', transcriptStatus: 'mapped', validationFlags: ['quality-issue'] },
  { id: 'P006', sessionId: 'S006', condition: 'variant', expectedOrder: 6, actualOrder: 6, completion: 'complete', transcriptStatus: 'mapped', validationFlags: [] },
  { id: 'P007', sessionId: 'S007', condition: undefined, expectedOrder: 7, actualOrder: undefined, completion: 'complete', transcriptStatus: 'exported', validationFlags: ['missing-assignment', 'order-incomplete'] },
  { id: 'P008', sessionId: 'S008', condition: 'control', expectedOrder: 8, actualOrder: 8, completion: 'complete', transcriptStatus: 'mapped', validationFlags: [] },
  { id: 'P009', sessionId: 'S009', condition: 'variant', expectedOrder: 9, actualOrder: undefined, completion: 'complete', transcriptStatus: 'mapped', validationFlags: ['order-incomplete'] },
  { id: 'P010', sessionId: 'S010', condition: undefined, expectedOrder: 10, actualOrder: undefined, completion: 'abandoned', transcriptStatus: 'exported', validationFlags: ['missing-assignment', 'order-incomplete'], excluded: true },
  { id: 'P011', sessionId: 'S011', condition: 'control', expectedOrder: 11, actualOrder: 11, completion: 'complete', transcriptStatus: 'mapped', validationFlags: [] },
  { id: 'P012', sessionId: 'S012', condition: 'variant', expectedOrder: 12, actualOrder: 12, completion: 'complete', transcriptStatus: 'failed', validationFlags: ['low-confidence'] },
]

export const mockFindings: Finding[] = [
  {
    id: 'F001',
    type: 'pain-point',
    title: 'Confusion with payment method selection',
    description: 'Users struggled to understand the difference between saved payment methods and entering new card details. The visual hierarchy did not clearly distinguish these options.',
    severity: 'critical',
    participantCount: 8,
    conditions: ['control', 'variant'],
    citations: [
      { participantId: 'P001', timestamp: '3:24', quote: 'I can\'t tell if this is asking me to use my saved card or add a new one' },
      { participantId: 'P003', timestamp: '4:12', quote: 'Wait, where did my saved cards go? I thought I had one saved.' },
    ],
    tags: ['payment', 'ui-clarity', 'critical'],
  },
  {
    id: 'F002',
    type: 'delighter',
    title: 'Address auto-complete praised',
    description: 'Participants consistently praised the address auto-complete feature, noting it saved significant time and reduced errors.',
    participantCount: 18,
    conditions: ['control', 'variant'],
    citations: [
      { participantId: 'P002', timestamp: '2:45', quote: 'Oh nice, it filled in my whole address. That\'s really helpful.' },
      { participantId: 'P006', timestamp: '2:30', quote: 'I love when it does this. No chance of typos.' },
    ],
    tags: ['address', 'auto-complete', 'positive'],
  },
  {
    id: 'F003',
    type: 'insight',
    title: 'Progress indicator improves confidence',
    description: 'The variant\'s progress indicator significantly improved user confidence. Users in the control group frequently asked "how many more steps?"',
    participantCount: 12,
    conditions: ['variant'],
    citations: [
      { participantId: 'P004', timestamp: '1:15', quote: 'I can see I\'m almost done, just one more section' },
    ],
    tags: ['progress', 'confidence', 'variant-only'],
  },
  {
    id: 'F004',
    type: 'pain-point',
    title: 'Shipping options unclear pricing',
    description: 'Users had difficulty understanding when shipping costs would be applied and how they affected the total.',
    severity: 'major',
    participantCount: 6,
    conditions: ['control'],
    citations: [
      { participantId: 'P001', timestamp: '5:30', quote: 'I picked expedited but I don\'t see the price change anywhere' },
    ],
    tags: ['shipping', 'pricing', 'control-only'],
  },
  {
    id: 'F005',
    type: 'recommendation',
    title: 'Add order summary sidebar',
    description: 'Based on user feedback, adding a persistent order summary sidebar would address confusion about totals and reduce cart abandonment.',
    participantCount: 14,
    conditions: ['control', 'variant'],
    citations: [
      { participantId: 'P005', timestamp: '6:00', quote: 'I wish I could see what I\'m buying without scrolling back up' },
    ],
    tags: ['recommendation', 'order-summary'],
  },
]

export const mockAnalysisQuestions: AnalysisQuestion[] = [
  {
    id: 'Q1',
    question: 'How easily could participants complete the checkout process?',
    summary: 'Participants in the variant condition completed checkout 34% faster on average with fewer errors. The streamlined single-page approach reduced cognitive load.',
    keyInsights: [
      'Variant average completion time: 2m 45s vs Control: 4m 12s',
      '78% of variant users completed without errors vs 52% control',
      'Progress visibility was cited as key confidence factor',
    ],
    participantCount: 24,
    conditionBreakdown: {
      control: 'Higher error rates, more back-tracking observed',
      variant: 'Smoother flow, fewer hesitations',
    },
    citations: [
      { participantId: 'P002', timestamp: '4:30', quote: 'That was surprisingly quick' },
      { participantId: 'P001', timestamp: '6:15', quote: 'I had to go back twice to fix things' },
    ],
  },
  {
    id: 'Q2',
    question: 'What were the main friction points in the checkout flow?',
    summary: 'Payment method selection was the primary friction point across both conditions. Secondary issues included shipping cost visibility and form validation feedback.',
    keyInsights: [
      'Payment selection confusion affected 33% of participants',
      'Shipping cost visibility issue was control-only',
      'Form validation was clearer in variant',
    ],
    participantCount: 24,
    conditionBreakdown: {
      control: 'Payment + shipping + validation all problematic',
      variant: 'Payment selection was main issue, others resolved',
    },
    citations: [
      { participantId: 'P003', timestamp: '3:45', quote: 'The payment part was confusing' },
    ],
  },
  {
    id: 'Q3',
    question: 'How did users perceive the overall checkout experience?',
    summary: 'Variant users reported higher satisfaction scores (4.2 vs 3.1 out of 5) and were more likely to recommend the checkout experience to others.',
    keyInsights: [
      'NPS-style question: Variant +45, Control +12',
      '"Modern" and "clean" were common variant descriptors',
      '"Cluttered" and "slow" were common control descriptors',
    ],
    participantCount: 24,
    conditionBreakdown: {
      control: 'Functional but dated perception',
      variant: 'Modern, trustworthy perception',
    },
    citations: [
      { participantId: 'P006', timestamp: '5:00', quote: 'This feels like a premium experience' },
      { participantId: 'P008', timestamp: '5:30', quote: 'It works but feels a bit old' },
    ],
  },
]

export const mockValidationSummary: ValidationSummary = {
  participantsIngested: 12,
  participantsMapped: 9,
  missingAssignments: 2,
  sampleImbalance: false,
  parseConfidence: 0.87,
  qualityIssues: 1,
  excludedParticipants: 1,
}

export const mockChatMessages = [
  {
    id: '1',
    role: 'user' as const,
    content: 'What were the main differences between the control and variant conditions?',
  },
  {
    id: '2',
    role: 'assistant' as const,
    content: `Based on the study data, the main differences between conditions were:

**Completion Time**
- Variant: 2m 45s average
- Control: 4m 12s average

**Error Rates**
- Variant: 22% of users had errors
- Control: 48% of users had errors

**Key Differentiator**: The variant's progress indicator was frequently cited (12 participants) as improving confidence.

*Sources: P001, P002, P004, P006 transcripts*`,
    citations: ['P001', 'P002', 'P004', 'P006'],
    participantCount: 24,
    conditionCoverage: ['control', 'variant'],
  },
]
