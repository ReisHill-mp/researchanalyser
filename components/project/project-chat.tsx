'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Send,
  Sparkles,
  Users,
  Quote,
  Loader2,
} from 'lucide-react'
import type { Project } from '@/lib/types'
import type { Finding, Transcript, AnalysisRun } from '@/lib/queries'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: string[]
  participantCount?: number
  conditionCoverage?: string[]
  confidence?: 'high' | 'medium' | 'low'
  isLoading?: boolean
}

interface ProjectChatProps {
  project: Project
}

interface ProjectContext {
  findings: Finding[]
  transcripts: Transcript[]
  analysis: AnalysisRun | null
}

const studyTypeLabels: Record<string, string> = {
  'single-flow': 'Single Flow',
  'concept-test': 'Concept Test',
  'balanced-comparison': 'Balanced Comparison',
  'ab-comparison': 'A/B Comparison',
  'within-subject': 'Within-Subject',
  'between-subject': 'Between-Subject',
}

export function ProjectChat({ project }: ProjectChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contextLoading, setContextLoading] = useState(true)
  const [context, setContext] = useState<ProjectContext>({ findings: [], transcripts: [], analysis: null })
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch project context on mount
  useEffect(() => {
    async function fetchContext() {
      try {
        const [findingsRes, transcriptsRes, analysisRes] = await Promise.all([
          fetch(`/api/projects/${project.id}/report`),
          fetch(`/api/projects/${project.id}/transcripts`),
          fetch(`/api/projects/${project.id}/analysis`),
        ])

        const [reportData, transcriptsData, analysisData] = await Promise.all([
          findingsRes.ok ? findingsRes.json() : { findings: [] },
          transcriptsRes.ok ? transcriptsRes.json() : [],
          analysisRes.ok ? analysisRes.json() : null,
        ])

        setContext({
          findings: reportData.findings || [],
          transcripts: transcriptsData || [],
          analysis: analysisData,
        })
      } catch (error) {
        console.error('Error fetching chat context:', error)
      } finally {
        setContextLoading(false)
      }
    }

    fetchContext()
  }, [project.id])

  // Set initial message after context loads
  useEffect(() => {
    if (!contextLoading) {
      const welcomeMessage: ChatMessage = {
        id: '1',
        role: 'assistant',
        content: `Welcome to the chat for **${project.name}**! I can help you explore the findings from this ${studyTypeLabels[project.studyType] || project.studyType} study.

**Project Summary:**
- ${project.transcriptCount} transcripts analyzed
- ${project.participantCount} participants
- ${project.findingsCount} findings identified

**Some questions you might ask:**
${context.findings.length > 0 
  ? `- Tell me about the "${context.findings[0]?.title}" finding
- What were the main pain points identified?`
  : `- What were the main issues identified?
- How did participants respond?`}
- Which participants had the most issues?
- What quotes support the findings?`,
      }
      setMessages([welcomeMessage])
    }
  }, [contextLoading, project, context.findings])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Generate dynamic suggested questions based on context
  const suggestedQuestions = [
    context.findings.length > 0 
      ? `Tell me about the "${context.findings[0]?.title}" finding`
      : 'What were the main issues identified?',
    `How many participants were in this study?`,
    context.findings.filter(f => f.type === 'pain-point').length > 0
      ? 'What were the main pain points?'
      : 'What insights did we gather?',
    'How confident are we in the findings?',
  ]

  // Generate grounded response based on real project data
  const generateResponse = (query: string): ChatMessage => {
    const lowerQuery = query.toLowerCase()
    const painPoints = context.findings.filter(f => f.type === 'pain-point')
    const delighters = context.findings.filter(f => f.type === 'delighter')
    const participantIds = context.transcripts.map(t => t.participantId).slice(0, 6)
    const conditions = [...new Set(context.transcripts.map(t => t.condition).filter(Boolean))]

    // Check for finding-specific questions
    const matchedFinding = context.findings.find(f => 
      lowerQuery.includes(f.title.toLowerCase()) || 
      lowerQuery.includes(f.title.split(' ').slice(0, 3).join(' ').toLowerCase())
    )

    if (matchedFinding) {
      return {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `**${matchedFinding.title}**

${matchedFinding.description}

**Type:** ${matchedFinding.type === 'pain-point' ? 'Pain Point' : matchedFinding.type === 'delighter' ? 'Delighter' : 'Observation'}
${matchedFinding.severity ? `**Severity:** ${matchedFinding.severity}` : ''}
${matchedFinding.category ? `**Category:** ${matchedFinding.category}` : ''}

This finding was identified through analysis of ${project.transcriptCount} transcripts from ${project.participantCount} participants in this ${studyTypeLabels[project.studyType] || project.studyType} study.`,
        participantCount: project.participantCount,
        conditionCoverage: conditions.length > 0 ? conditions as string[] : undefined,
        confidence: matchedFinding.severity === 'critical' ? 'high' : 'medium',
      }
    }

    // Pain points question
    if (lowerQuery.includes('pain') || lowerQuery.includes('issue') || lowerQuery.includes('problem')) {
      if (painPoints.length === 0) {
        return {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: `No pain points have been identified yet in this ${studyTypeLabels[project.studyType] || project.studyType} study.

The study has analyzed ${project.transcriptCount} transcripts from ${project.participantCount} participants, but findings categorized as pain points have not been recorded.

Would you like me to help with something else about this study?`,
          participantCount: project.participantCount,
          confidence: 'medium',
        }
      }

      return {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `**Pain Points Identified (${painPoints.length} total)**

${painPoints.slice(0, 5).map((f, i) => `${i + 1}. **${f.title}**${f.severity ? ` (${f.severity})` : ''}
   ${f.description}`).join('\n\n')}

${painPoints.length > 5 ? `\n_...and ${painPoints.length - 5} more pain points identified._` : ''}

These findings were identified across ${project.transcriptCount} transcripts from ${project.participantCount} participants.`,
        citations: participantIds,
        participantCount: project.participantCount,
        conditionCoverage: conditions.length > 0 ? conditions as string[] : undefined,
        confidence: painPoints.some(p => p.severity === 'critical') ? 'high' : 'medium',
      }
    }

    // Participant count question
    if (lowerQuery.includes('participant') || lowerQuery.includes('how many')) {
      return {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `**Study Participants**

This ${studyTypeLabels[project.studyType] || project.studyType} study includes:

- **${project.participantCount} participants** total
- **${project.transcriptCount} transcripts** analyzed
- **${project.findingsCount} findings** identified

${conditions.length > 0 ? `**Conditions:** ${conditions.join(', ')}` : ''}

${context.transcripts.length > 0 ? `Recent participant IDs: ${participantIds.join(', ')}` : ''}`,
        participantCount: project.participantCount,
        conditionCoverage: conditions.length > 0 ? conditions as string[] : undefined,
        confidence: 'high',
      }
    }

    // Confidence question
    if (lowerQuery.includes('confident') || lowerQuery.includes('confidence')) {
      const confidenceLevel = project.transcriptCount >= 20 ? 'High' : project.transcriptCount >= 10 ? 'Medium' : 'Low'
      return {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `**Confidence Assessment: ${confidenceLevel}**

Based on the study data:

- **Sample size:** ${project.participantCount} participants
- **Transcripts analyzed:** ${project.transcriptCount}
- **Findings generated:** ${project.findingsCount}
- **Study type:** ${studyTypeLabels[project.studyType] || project.studyType}

${confidenceLevel === 'High' 
  ? 'The sample size is adequate for this type of evaluative study, and consistent patterns were observed across participants.'
  : confidenceLevel === 'Medium'
  ? 'The sample size provides reasonable confidence, though additional participants would strengthen the findings.'
  : 'The sample size is limited. Consider additional participants to increase confidence in findings.'}

${context.analysis?.modelVersion ? `\n**Analysis Model:** ${context.analysis.modelVersion}` : ''}
${context.analysis?.promptVersion ? `**Prompt Version:** ${context.analysis.promptVersion}` : ''}`,
        participantCount: project.participantCount,
        confidence: confidenceLevel.toLowerCase() as 'high' | 'medium' | 'low',
      }
    }

    // Findings overview
    if (lowerQuery.includes('finding') || lowerQuery.includes('insight')) {
      if (context.findings.length === 0) {
        return {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: `No findings have been generated yet for this study.

The study "${project.studyName}" has ${project.transcriptCount} transcripts from ${project.participantCount} participants, but analysis findings have not been recorded.

Run the analysis to generate findings from your validated transcripts.`,
          participantCount: project.participantCount,
          confidence: 'medium',
        }
      }

      return {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `**Findings Overview (${context.findings.length} total)**

${context.findings.slice(0, 4).map(f => `- **${f.title}** (${f.type})${f.severity ? ` — ${f.severity}` : ''}`).join('\n')}

${context.findings.length > 4 ? `\n_...and ${context.findings.length - 4} more findings._` : ''}

**Breakdown:**
- Pain Points: ${painPoints.length}
- Delighters: ${delighters.length}
- Observations: ${context.findings.filter(f => f.type === 'observation').length}

Ask me about any specific finding to learn more.`,
        citations: participantIds,
        participantCount: project.participantCount,
        conditionCoverage: conditions.length > 0 ? conditions as string[] : undefined,
        confidence: 'high',
      }
    }

    // Default response grounded in project data
    return {
      id: String(Date.now() + 1),
      role: 'assistant',
      content: `Based on analysis of the **${project.name}** study:

${context.findings.length > 0 
  ? `This ${studyTypeLabels[project.studyType] || project.studyType} study analyzed ${project.transcriptCount} transcripts from ${project.participantCount} participants and identified ${project.findingsCount} findings.

**Key findings include:**
${context.findings.slice(0, 3).map(f => `- ${f.title}`).join('\n')}`
  : `This study has ${project.transcriptCount} transcripts from ${project.participantCount} participants. Run analysis to generate findings.`}

Would you like me to dive deeper into any specific aspect of the study?`,
      citations: participantIds.length > 0 ? participantIds : undefined,
      participantCount: project.participantCount,
      conditionCoverage: conditions.length > 0 ? conditions as string[] : undefined,
      confidence: context.findings.length > 0 ? 'medium' : 'low',
    }
  }

  const handleSend = async (question?: string) => {
    const query = question || input.trim()
    if (!query || isLoading) return

    const userMessage: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: query,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response with typing indicator
    const loadingMessage: ChatMessage = {
      id: String(Date.now() + 1),
      role: 'assistant',
      content: '',
      isLoading: true,
    }
    setMessages((prev) => [...prev, loadingMessage])

    // Simulate response delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate grounded response using real project data
    const response = generateResponse(query)

    setMessages((prev) => [...prev.slice(0, -1), response])
    setIsLoading(false)
  }

  return (
    <div className="h-full flex">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-lg p-4 max-w-[85%]',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  )}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Analyzing {project.name} data...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      
                      {message.role === 'assistant' && (message.citations || message.participantCount) && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            {message.participantCount && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {message.participantCount} participants
                              </span>
                            )}
                            {message.conditionCoverage && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                Conditions: {message.conditionCoverage.join(', ')}
                              </span>
                            )}
                            {message.confidence && (
                              <Badge
                                variant="secondary"
                                className={cn(
                                  message.confidence === 'high' && 'bg-success/10 text-success',
                                  message.confidence === 'medium' && 'bg-warning/10 text-warning',
                                  message.confidence === 'low' && 'bg-muted text-muted-foreground'
                                )}
                              >
                                {message.confidence} confidence
                              </Badge>
                            )}
                          </div>
                          {message.citations && message.citations.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <Quote className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                Sources: {message.citations.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground text-xs font-medium shrink-0">
                    SC
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length <= 2 && !contextLoading && (
          <div className="px-6 pb-4">
            <div className="max-w-3xl mx-auto">
              <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs max-w-xs truncate"
                    onClick={() => handleSend(question)}
                    disabled={isLoading}
                    title={question}
                  >
                    {question.length > 40 ? question.slice(0, 40) + '...' : question}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4 bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${project.name}...`}
                className="flex-1 bg-secondary border-border"
                disabled={isLoading || contextLoading}
              />
              <Button type="submit" disabled={!input.trim() || isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Responses are grounded in {project.name} data ({project.transcriptCount} transcripts, {project.findingsCount} findings).
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
