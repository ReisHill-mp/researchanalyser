import type { Project } from '@/lib/types'
import type { AnalysisQuestion, AnalysisRun, Finding } from '@/lib/queries'

export type PriorityBucket = 'highest' | 'medium' | 'lower'

export interface ReportSectionEvidence {
  evidenceSummary: string
  sourceQuestionIds: string[]
  sourceQuestionLabels: string[]
  sourceParticipantIds: string[]
  sourceParticipantLabels: string[]
  sourceTranscriptIds: string[]
  sourceTranscriptRefs: string[]
  limitedSupport: boolean
}

export interface ResearchTheme {
  id: string
  title: string
  body: string
  implication: string
  evidence?: ReportSectionEvidence
}

export interface TranscriptReference {
  participantId: string
  transcriptReference: string
  sessionId?: string
}

export interface ResearchReportData {
  studyObjective: string
  caveat: string
  balancedComparisonNote?: string
  executiveSummary: string[]
  executiveSummaryEvidence: ReportSectionEvidence
  researchThemes: ResearchTheme[]
  keyNeeds: string[]
  keyNeedsEvidence: ReportSectionEvidence[]
  recommendations: string[]
  recommendationsEvidence: ReportSectionEvidence[]
  suggestedDirection: string[]
  suggestedDirectionEvidence: ReportSectionEvidence[]
  priorityGroups: Record<PriorityBucket, Finding[]>
  finalTakeaway: string
  finalTakeawayEvidence: ReportSectionEvidence
  transcriptReferences: TranscriptReference[]
  researchInputs: string[]
  reportPrompt: string
}

export const priorityLabels: Record<PriorityBucket, string> = {
  highest: 'Highest priority',
  medium: 'Medium priority',
  lower: 'Lower priority',
}

function normaliseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function sentence(value: string) {
  const trimmed = normaliseWhitespace(value)
  if (!trimmed) return ''
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function tokenize(value: string) {
  return new Set(
    normaliseWhitespace(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4)
  )
}

function buildTranscriptEvidenceId(participantId: string, transcriptReference: string, sessionId?: string) {
  return sessionId || `${participantId}:${transcriptReference}`
}

function emptyEvidence(summary = 'Supporting analysis is limited for this section.'): ReportSectionEvidence {
  return {
    evidenceSummary: summary,
    sourceQuestionIds: [],
    sourceQuestionLabels: [],
    sourceParticipantIds: [],
    sourceParticipantLabels: [],
    sourceTranscriptIds: [],
    sourceTranscriptRefs: [],
    limitedSupport: true,
  }
}

function buildEvidenceFromQuestions(
  questions: AnalysisQuestion[],
  summary?: string
): ReportSectionEvidence {
  if (questions.length === 0) {
    return emptyEvidence(summary)
  }

  const participantIds = new Set<string>()
  const transcriptIds = new Set<string>()
  const transcriptRefs = new Set<string>()

  for (const question of questions) {
    for (const citation of question.citations || []) {
      if (citation.participantId) {
        participantIds.add(citation.participantId)
      }
      const transcriptReference = citation.transcriptReference || (citation.participantId ? `${citation.participantId}.md` : '')
      if (transcriptReference) {
        transcriptRefs.add(transcriptReference)
        transcriptIds.add(
          buildTranscriptEvidenceId(citation.participantId || 'unknown', transcriptReference, citation.sessionId)
        )
      }
    }
  }

  const evidenceSummary =
    summary ||
    questions
      .slice(0, 3)
      .map((question) => sentence(question.summary))
      .filter(Boolean)
      .join(' ')

  return {
    evidenceSummary: evidenceSummary || 'Supporting analysis is available from the linked question summaries.',
    sourceQuestionIds: questions.map((question) => question.id),
    sourceQuestionLabels: questions.map((question) => question.questionNumber),
    sourceParticipantIds: [...participantIds],
    sourceParticipantLabels: [...participantIds],
    sourceTranscriptIds: [...transcriptIds],
    sourceTranscriptRefs: [...transcriptRefs],
    limitedSupport:
      questions.length === 0 ||
      participantIds.size === 0 ||
      transcriptRefs.size === 0,
  }
}

function getRelevantQuestions(analysis: AnalysisRun | null, text: string, maxResults = 3) {
  const questions = analysis?.questions ?? []
  if (questions.length === 0) return []

  const targetTokens = tokenize(text)
  if (targetTokens.size === 0) {
    return questions.slice(0, maxResults)
  }

  const scored = questions
    .map((question, index) => {
      const haystack = [
        question.question,
        question.summary,
        question.keyInsights.join(' '),
        ...(question.citations || []).map((citation) => `${citation.summary || ''} ${citation.quote || ''}`),
      ].join(' ')
      const haystackTokens = tokenize(haystack)
      let score = 0
      for (const token of targetTokens) {
        if (haystackTokens.has(token)) score += 1
      }
      return { question, score, index }
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.index - b.index
    })

  const positive = scored.filter((entry) => entry.score > 0).slice(0, maxResults).map((entry) => entry.question)
  if (positive.length > 0) return positive
  return scored.slice(0, maxResults).map((entry) => entry.question)
}

function bucketFinding(finding: Finding): PriorityBucket {
  if (finding.severity === 'critical' || finding.priority === 'high') return 'highest'
  if (finding.severity === 'moderate' || finding.priority === 'medium') return 'medium'
  return 'lower'
}

function deriveStudyObjective(project: Project, findings: Finding[], analysis: AnalysisRun | null) {
  const sourceText = [
    project.studyName,
    project.description,
    ...findings.map((finding) => `${finding.title} ${finding.description}`),
    ...(analysis?.questions ?? []).map((question) => question.question),
  ]
    .join(' ')
    .toLowerCase()

  if (/(which version|design a|design b|comparison|prefer overall)/.test(sourceText)) {
    return 'The study objective was to understand which design direction creates stronger confidence, clearer reviewability, and a more usable experience overall.'
  }

  if (/(confidence|added|not added|completion|feedback|skip|log in|onboarding)/.test(sourceText)) {
    return 'The study objective was to understand whether the experience feels easy to use, whether the outcome feels trustworthy, and where confidence or momentum breaks down for participants.'
  }

  return 'The study objective was to understand how usable the proposed experience feels, where participants lose confidence, and what changes would make the flow easier to trust and complete.'
}

function deriveExecutiveSummary(findings: Finding[], analysis: AnalysisRun | null) {
  const joined = [
    ...findings.map((finding) => `${finding.title} ${finding.description}`),
    ...(analysis?.questions ?? []).map((question) => `${question.question} ${question.summary} ${question.keyInsights.join(' ')}`),
  ]
    .join(' ')
    .toLowerCase()

  const hasCoreValue = /core import concept is working|core-value|value of importing|speed and usefulness|spark curiosity|engaging|informative/.test(joined)
  const hasDiscoverability = /discoverability|entry-point clarity|understanding how to begin|way to start|import route|skip these screens|log in at this point/.test(joined)
  const hasConfidence = /confidence gap|confirmation|truly been added|completion feedback|understood which occasions were added|explain what you can do/.test(joined)
  const hasComparison = /stronger direction|scanability|structured direction|comparison|which version|prefer overall|clearer at a glance/.test(joined)
  const hasClutter = /visual restraint|busier than necessary|simplified version|visual-noise/.test(joined)

  const paragraphs: string[] = []

  if (hasCoreValue) {
    paragraphs.push(
      'The good news is that the core job to be done is working. Participants generally understood the value of the experience and could see why the flow or feature would be useful once they were inside it.'
    )
  }

  if (hasDiscoverability || hasConfidence) {
    paragraphs.push(
      'The bigger issues sit around clarity and confidence. Participants were less concerned with the underlying concept and more concerned with understanding where to start, what the screens were telling them, and whether the outcome of their actions was fully clear.'
    )
  }

  if (hasComparison) {
    paragraphs.push(
      'Where there were direct comparison moments, the stronger direction tended to be the one that improved scanability and review confidence. More structure helped participants feel less likely to miss something important.'
    )
  }

  if (hasClutter || hasConfidence) {
    paragraphs.push(
      'The clearest product direction is not a simple binary choice. The best next version is likely a hybrid: keep the clearer structure, simplify the presentation, and strengthen feedback so the experience feels dependable without becoming visually heavy.'
    )
  }

  if (paragraphs.length > 0) return paragraphs

  const summaries = [
    ...findings.slice(0, 4).map((finding) => sentence(finding.description)),
    ...(analysis?.questions ?? []).slice(0, 2).map((question) => sentence(question.summary)),
  ].filter(Boolean)

  return summaries.length > 0
    ? summaries.slice(0, 4)
    : ['This report is ready to present a sharper research narrative once the next analysis run generates richer findings.']
}

function deriveImplication(finding: Finding) {
  const text = `${finding.title} ${finding.description}`.toLowerCase()

  if (/(discover|entry|start|find)/.test(text)) {
    return 'Improving entry-point labeling and affordance is likely to have a bigger impact than changing the underlying interaction model.'
  }
  if (/(confidence|confirm|added|outcome|clear whether)/.test(text)) {
    return 'The team should treat completion feedback as a core UX decision rather than visual polish.'
  }
  if (/(scan|review|organized|structured|miss something|comparison)/.test(text)) {
    return 'The stronger direction is the one that helps users scan confidently without feeling overloaded.'
  }
  if (/(busy|clutter|noise|icon|visual)/.test(text)) {
    return 'The likely best outcome is a simplified version of the stronger direction, not a more feature-rich one.'
  }
  if (finding.type === 'delighter') {
    return 'The team does not need to rethink the core idea here. The opportunity is refinement, not redesign.'
  }

  return 'This should be used as a directional product call, not just a descriptive observation.'
}

function deriveResearchThemes(findings: Finding[], analysis: AnalysisRun | null) {
  if (findings.length > 0) {
    return findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      body: sentence(finding.description),
      implication: deriveImplication(finding),
      evidence: buildEvidenceFromQuestions(
        getRelevantQuestions(analysis, `${finding.title} ${finding.description}`),
        `This theme is grounded in the saved analysis linked to ${getRelevantQuestions(
          analysis,
          `${finding.title} ${finding.description}`
        )
          .map((question) => question.questionNumber)
          .join(', ') || 'the available research questions'}.`
      ),
    }))
  }

  return (analysis?.questions ?? []).slice(0, 6).map((question) => ({
    id: question.id,
    title: question.question,
    body: sentence(question.summary),
    implication:
      question.keyInsights[0] ||
      'Use this question-level pattern as an input into the next product and design decision.',
    evidence: buildEvidenceFromQuestions(
      [question],
      `This theme is directly grounded in ${question.questionNumber} and its linked participant-level evidence.`
    ),
  }))
}

function deriveNeeds() {
  return [
    'Help me find the flow immediately.',
    'Let me review or scan the experience in a way that feels organized.',
    'Make it obvious what has happened and what I should do next.',
    'Do not make the interface feel busier than it needs to be.',
    'Give me confidence without slowing me down.',
  ]
}

function deriveRecommendations(findings: Finding[]) {
  const sourceText = findings.map((finding) => `${finding.title} ${finding.description}`).join(' ').toLowerCase()
  const recommendations: string[] = []

  if (/(scan|review|organized|structured|comparison|design b)/.test(sourceText)) {
    recommendations.push('Proceed with the stronger structured direction as the base UX direction.')
  }
  if (/(busy|clutter|noise|icon|visual)/.test(sourceText)) {
    recommendations.push('Simplify the chosen direction before rolling it forward by removing decorative or redundant UI treatment.')
  }
  if (/(discover|entry|start|find|floating)/.test(sourceText)) {
    recommendations.push('Make the entry point more explicit through stronger labeling, supporting copy, or a clearer affordance.')
  }
  if (/(confidence|confirm|added|outcome|clear whether)/.test(sourceText)) {
    recommendations.push('Strengthen completion feedback so participants can tell immediately what has happened and what still needs attention.')
  }
  if (/(mixed|source|existing|filter|manual add|select all|timing|recurring)/.test(sourceText)) {
    recommendations.push('Treat filtering, manual add, select all, and related controls as follow-on enhancements after the core clarity issues are resolved.')
  }

  if (recommendations.length > 0) return recommendations

  return findings.length > 0
    ? findings.slice(0, 5).map((finding) => `Use ${finding.title.toLowerCase()} as a design direction and validate it in the next iteration.`)
    : ['Run another analysis pass once richer transcript evidence is available.']
}

function buildEvidenceForStringItems(items: string[], analysis: AnalysisRun | null, prefix: string) {
  return items.map((item) =>
    buildEvidenceFromQuestions(
      getRelevantQuestions(analysis, item),
      `${prefix} is grounded in the saved analysis linked to ${getRelevantQuestions(analysis, item)
        .map((question) => question.questionNumber)
        .join(', ') || 'the available research questions'}.`
    )
  )
}

function deriveSuggestedDirection(findings: Finding[], recommendations: string[]) {
  const joined = findings.map((finding) => `${finding.title} ${finding.description}`).join(' ').toLowerCase()

  if (/(comparison|scan|organized|structured|confidence)/.test(joined)) {
    return [
      'The best next version is likely:',
      'The stronger structured direction',
      'The simpler, more restrained presentation',
      'A clearer entry point or affordance',
      'More explicit feedback after important actions',
    ]
  }

  return [
    'The best next version is likely:',
    recommendations[0] || 'A clearer structure for the main flow',
    recommendations[1] || 'A more restrained visual treatment',
    recommendations[2] || 'Clearer feedback after important actions',
  ]
}

function deriveFinalTakeaway(findings: Finding[]) {
  if (findings.length === 0) {
    return 'The project is ready for a research-style readout as soon as the next analysis run generates report-ready findings.'
  }

  return 'This research does not suggest the team needs a new concept. It suggests the team is close. Users can already see the value in the experience; the work now is to remove the ambiguity around discoverability, confidence, and visual noise so the product feels both easy and dependable.'
}

function deriveTranscriptReferences(analysis: AnalysisRun | null) {
  const references = new Map<string, TranscriptReference>()

  for (const question of analysis?.questions ?? []) {
    for (const citation of question.citations ?? []) {
      const transcriptReference = citation.transcriptReference || `${citation.participantId}.md`
      const key = `${citation.participantId}:${transcriptReference}`
      if (!references.has(key)) {
        references.set(key, {
          participantId: citation.participantId,
          transcriptReference,
          sessionId: citation.sessionId,
        })
      }
    }
  }

  return [...references.values()]
}

function buildReportPrompt(project: Project, findings: Finding[], analysis: AnalysisRun | null) {
  const questionContext = (analysis?.questions ?? [])
    .slice(0, 12)
    .map((question) => {
      const citations = question.citations
        .slice(0, 3)
        .map((citation) => `- ${citation.participantId}: ${citation.summary || citation.quote || 'No summary available'}`)
        .join('\n')

      return [
        `${question.questionNumber}: ${question.question}`,
        `Question summary: ${question.summary}`,
        question.keyInsights.length > 0 ? `Key insights: ${question.keyInsights.join(' | ')}` : null,
        citations ? `Participant evidence:\n${citations}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')

  const findingsContext = findings
    .map((finding) => `- ${finding.title}: ${finding.description}`)
    .join('\n')

  return [
    'You are a senior UX researcher writing a clear, decision-oriented research insight report.',
    'Use the saved user research script as the source of truth for the study structure.',
    'Use the per-question, per-user analysis as the main synthesis layer.',
    'Use the raw transcript evidence to support and sharpen the final narrative rather than repeating every answer literally.',
    'Write for product, design, and research stakeholders.',
    'Keep the tone confident, practical, and specific.',
    '',
    `Project name: ${project.name}`,
    `Study name: ${project.studyName}`,
    `Study type: ${project.studyType}`,
    `Transcript count: ${project.transcriptCount}`,
    '',
    'The report must include these sections:',
    '1. Study overview',
    '2. Important caveat',
    '3. Executive summary',
    '4. What the research says',
    '5. Key user needs emerging from the study',
    '6. Design recommendations',
    '7. Suggested product direction',
    '8. Priority actions',
    '9. Final takeaway',
    '10. References',
    '',
    'Question-by-question analysis context:',
    questionContext || 'No question analysis available.',
    '',
    'Existing findings context:',
    findingsContext || 'No findings available.',
    '',
    'Important drafting rules:',
    '- Do not simply restate the research questions.',
    '- Pull the executive summary up to the level of product direction.',
    '- Prefer themes and implications over generic descriptive recap.',
    '- Where there is comparison evidence, make the directional call clearly.',
    '- Include transcript references at the end.',
    project.studyType === 'balanced-comparison'
      ? '- This is a balanced comparison study. Explicitly account for the balanced comparison random split and ordered participant analysis correctly.'
      : null,
  ].join('\n')
}

export function buildResearchReport(project: Project, findings: Finding[], analysis: AnalysisRun | null): ResearchReportData {
  const recommendations = deriveRecommendations(findings)
  const executiveSummary = deriveExecutiveSummary(findings, analysis)
  const executiveSummaryEvidence = buildEvidenceFromQuestions(
    getRelevantQuestions(analysis, executiveSummary.join(' '), 4),
    `This executive summary is grounded in the saved analysis linked to ${getRelevantQuestions(
      analysis,
      executiveSummary.join(' '),
      4
    )
      .map((question) => question.questionNumber)
      .join(', ') || 'the available research questions'}.`
  )
  const keyNeeds = deriveNeeds()
  const suggestedDirection = deriveSuggestedDirection(findings, recommendations)
  const finalTakeaway = deriveFinalTakeaway(findings)

  return {
    studyObjective: deriveStudyObjective(project, findings, analysis),
    caveat:
      'The transcript exports do not always cleanly preserve every script question as a separate answer, so this report should be read as a careful synthesis rather than a literal coding sheet. Where ordering or direct comparison signals are imperfect, the strongest weight should be placed on repeated patterns and explicit comparative remarks.',
    balancedComparisonNote:
      project.studyType === 'balanced-comparison'
        ? 'This report has considered the balanced comparison random split and ordered the analysis correctly.'
        : undefined,
    executiveSummary,
    executiveSummaryEvidence,
    researchThemes: deriveResearchThemes(findings, analysis),
    keyNeeds,
    keyNeedsEvidence: buildEvidenceForStringItems(keyNeeds, analysis, 'This user need'),
    recommendations,
    recommendationsEvidence: buildEvidenceForStringItems(recommendations, analysis, 'This recommendation'),
    suggestedDirection,
    suggestedDirectionEvidence: buildEvidenceForStringItems(suggestedDirection, analysis, 'This product direction'),
    priorityGroups: findings.reduce<Record<PriorityBucket, Finding[]>>(
      (groups, finding) => {
        groups[bucketFinding(finding)].push(finding)
        return groups
      },
      { highest: [], medium: [], lower: [] }
    ),
    finalTakeaway,
    finalTakeawayEvidence: buildEvidenceFromQuestions(
      getRelevantQuestions(analysis, finalTakeaway, 4),
      `This final takeaway is grounded in the saved analysis linked to ${getRelevantQuestions(
        analysis,
        finalTakeaway,
        4
      )
        .map((question) => question.questionNumber)
        .join(', ') || 'the available research questions'}.`
    ),
    transcriptReferences: deriveTranscriptReferences(analysis),
    researchInputs: [
      'User test script',
      'Question-by-question analysis',
      'Per-question, per-user analysis',
      `${project.transcriptCount} imported transcript file(s)`,
    ],
    reportPrompt: buildReportPrompt(project, findings, analysis),
  }
}
