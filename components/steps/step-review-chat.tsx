'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  MessageSquare,
  FileText,
  Quote,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { mockFindings, mockChatMessages } from '@/lib/mock-data'
import type { Transcript } from '@/lib/queries'

interface StepReviewChatProps {
  projectId?: string
}

export function StepReviewChat({ projectId }: StepReviewChatProps) {
  const [messages, setMessages] = useState(mockChatMessages)
  const [input, setInput] = useState('')
  const [activeTab, setActiveTab] = useState<'report' | 'findings' | 'transcripts' | 'chat'>('report')
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [transcriptsLoading, setTranscriptsLoading] = useState(false)

  useEffect(() => {
    async function fetchTranscripts() {
      if (!projectId) return
      setTranscriptsLoading(true)
      try {
        const response = await fetch(`/api/projects/${projectId}/transcripts`)
        if (!response.ok) throw new Error('Failed to fetch transcripts')
        const data = await response.json()
        setTranscripts(data || [])
      } catch (error) {
        console.error('Failed to fetch transcripts for review step:', error)
        setTranscripts([])
      } finally {
        setTranscriptsLoading(false)
      }
    }

    fetchTranscripts()
  }, [projectId])

  const handleSend = () => {
    if (!input.trim()) return

    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), role: 'user' as const, content: input },
    ])
    setInput('')

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant' as const,
          content: `Based on the analysis of 24 participants across both conditions, I found relevant insights about "${input.slice(0, 30)}...".\n\n**Key findings:**\n- The variant showed 34% faster completion times\n- User satisfaction scores were higher in the streamlined flow\n\n*Sources: P003, P007, P012 transcripts*`,
          citations: ['P003', 'P007', 'P012'],
          participantCount: 24,
          conditionCoverage: ['control', 'variant'],
        },
      ])
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Review & Ask Questions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore your analysis results and ask follow-up questions.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: 'report', label: 'Report', icon: FileText },
          { id: 'findings', label: 'Findings', icon: CheckCircle2 },
          { id: 'transcripts', label: 'Transcripts', icon: Quote },
          { id: 'chat', label: 'Chat', icon: MessageSquare },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'report' && (
          <Card className="p-6 border-border bg-card">
            <div className="prose prose-sm prose-invert max-w-none">
              <h3 className="text-lg font-semibold text-foreground mb-4">Executive Summary</h3>
              <p className="text-muted-foreground leading-relaxed">
                This study compared two checkout flow experiences across 24 participants. 
                The streamlined (variant) checkout significantly outperformed the current 
                multi-step (control) flow in completion time, error rates, and user satisfaction.
              </p>

              <h4 className="text-md font-medium text-foreground mt-6 mb-3">Key Findings</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Variant completion time was 34% faster (2m 45s vs 4m 12s)</li>
                <li>Error rates dropped from 48% to 22% in the variant</li>
                <li>User satisfaction scores: Variant 4.2/5 vs Control 3.1/5</li>
                <li>Payment method selection remains the primary friction point</li>
              </ul>

              <h4 className="text-md font-medium text-foreground mt-6 mb-3">Recommendations</h4>
              <ol className="space-y-2 text-muted-foreground">
                <li>Proceed with variant implementation with high confidence</li>
                <li>Prioritize payment selection UX improvements</li>
                <li>Add persistent order summary sidebar</li>
                <li>Conduct follow-up study on shipping cost visibility</li>
              </ol>

              <div className="mt-6 p-4 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                <strong className="text-foreground">Confidence Note:</strong> High confidence based on 
                consistent patterns across 24 participants with balanced condition exposure.
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'findings' && (
          <div className="space-y-3">
            {mockFindings.map((finding) => (
              <Card key={finding.id} className="p-4 border-border bg-card">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md shrink-0',
                      finding.type === 'pain-point'
                        ? 'bg-destructive/10 text-destructive'
                        : finding.type === 'delighter'
                        ? 'bg-success/10 text-success'
                        : finding.type === 'recommendation'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {finding.type === 'pain-point' ? '!' : finding.type === 'delighter' ? '+' : '→'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-foreground">{finding.title}</h4>
                      {finding.severity && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            finding.severity === 'critical' && 'bg-destructive/10 text-destructive',
                            finding.severity === 'major' && 'bg-warning/10 text-warning'
                          )}
                        >
                          {finding.severity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {finding.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {finding.participantCount} participants
                      </span>
                      <span className="flex items-center gap-1">
                        <Quote className="h-3 w-3" />
                        {finding.citations.length} citations
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'transcripts' && (
          <Card className="p-4 border-border bg-card">
            {transcriptsLoading ? (
              <p className="text-sm text-muted-foreground">Loading transcripts...</p>
            ) : transcripts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transcripts available yet for this project.
              </p>
            ) : (
              <div className="space-y-3">
                {transcripts.map((transcript) => (
                  <div key={transcript.id} className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{transcript.participantId}</p>
                        <p className="text-xs text-muted-foreground">{transcript.sessionId}</p>
                      </div>
                      {transcript.condition && (
                        <Badge variant="secondary">{transcript.condition}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {transcript.transcript || 'Transcript text missing.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'chat' && (
          <Card className="border-border bg-card overflow-hidden flex flex-col h-[500px]">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
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
                        'rounded-lg p-3 max-w-[80%]',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {'citations' in message && message.citations && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {message.participantCount} participants
                            </span>
                            <span className="text-muted-foreground">|</span>
                            <span className="text-muted-foreground">
                              Conditions: {message.conditionCoverage?.join(', ')}
                            </span>
                          </div>
                        </div>
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

            {/* Chat Input */}
            <div className="border-t border-border p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your research..."
                  className="flex-1 bg-secondary border-border"
                />
                <Button type="submit" disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Answers are grounded in your study data with citations provided.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
