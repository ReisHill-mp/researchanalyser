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
  const [chatError, setChatError] = useState<string | null>(null)
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
    setChatError(null)

    // Simulate AI response with typing indicator
    const loadingMessage: ChatMessage = {
      id: String(Date.now() + 1),
      role: 'assistant',
      content: '',
      isLoading: true,
    }
    setMessages((prev) => [...prev, loadingMessage])

    try {
      const response = await fetch(`/api/projects/${project.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to generate grounded chat response')
      }

      const assistantMessage: ChatMessage = {
        id: String(Date.now() + 2),
        role: 'assistant',
        content: payload.answer || 'No answer returned.',
        citations: payload.citations || [],
        participantCount: payload.participantCount,
        conditionCoverage: payload.conditionCoverage || [],
        confidence: payload.confidence || 'medium',
      }

      setMessages((prev) => [...prev.slice(0, -1), assistantMessage])
    } catch (error) {
      setMessages((prev) => prev.slice(0, -1))
      setChatError(error instanceof Error ? error.message : 'Failed to generate chat response')
    } finally {
      setIsLoading(false)
    }
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
              Responses are grounded only in the research script, transcripts, question-by-question analysis, and final report for this project.
            </p>
            {chatError && (
              <p className="text-xs text-destructive mt-2">{chatError}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
