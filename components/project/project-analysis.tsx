'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChevronDown,
  ChevronRight,
  Users,
  Sparkles,
  FileText,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { AnalysisRun } from '@/lib/queries'

export function ProjectAnalysis() {
  const params = useParams()
  const [analysis, setAnalysis] = useState<AnalysisRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([])

  useEffect(() => {
    async function fetchAnalysis() {
      if (!params.id) {
        setLoading(false)
        return
      }

      try {
        const analysisResponse = await fetch(`/api/projects/${params.id}/analysis`)
        if (!analysisResponse.ok) throw new Error('Failed to fetch analysis')

        const analysisData = await analysisResponse.json()
        setAnalysis(analysisData)

        if (analysisData?.questions?.length > 0) {
          setExpandedQuestions([analysisData.questions[0].questionNumber])
        }
      } catch (error) {
        console.error('Error fetching analysis:', error)
        setAnalysis(null)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [params.id])

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border border-border border-t-primary mb-4"></div>
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Analysis</h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-generated analysis from your validated study data.
            </p>
          </div>
        </div>
        <Card className="p-8 border-border bg-card text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">No analysis yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Analysis will appear here once generated from validated transcripts.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Analysis</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Per-question synthesis grounded in the uploaded script and imported participant transcripts.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>{analysis.modelVersion || 'GPT-4'}</span>
          <span className="text-border">|</span>
          <span>Prompt {analysis.promptVersion || 'v1.0'}</span>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Question-by-Question Analysis</h3>
          
          {analysis.questions.length === 0 ? (
            <Card className="p-6 border-border bg-card text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No question analysis available</p>
            </Card>
          ) : (
            analysis.questions.map((question) => {
              const isExpanded = expandedQuestions.includes(question.questionNumber)
              
              return (
                <Card key={question.id} className="border-border bg-card overflow-hidden">
                <button
                  onClick={() => toggleQuestion(question.questionNumber)}
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="mt-0.5">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {question.questionNumber}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {question.participantCount} participants
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-foreground">
                      {question.question}
                    </h4>
                    {!isExpanded && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {question.summary}
                      </p>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 ml-7 border-t border-border">
                    <div className="pt-4 space-y-4">
                      {/* Summary */}
                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Question summary
                        </h5>
                        <p className="text-sm text-foreground leading-relaxed">
                          {question.summary}
                        </p>
                      </div>

                      {/* Key Insights */}
                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Key Insights
                        </h5>
                        <ul className="space-y-1">
                          {question.keyInsights.map((insight, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                              <span className="text-primary mt-1">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Per-user summary */}
                      <div>
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Per-user summary
                        </h5>
                        <div className="space-y-3">
                          {question.citations.map((citation, index) => (
                            <div
                              key={`${question.id}-${citation.participantId}-${index}`}
                              className="rounded-lg border border-border bg-muted/20 p-3"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs">
                                  {citation.participantId}
                                </Badge>
                                {citation.condition && (
                                  <span className="text-xs text-muted-foreground">{citation.condition}</span>
                                )}
                              </div>
                              {citation.summary && (
                                <p className="text-sm text-foreground leading-relaxed">
                                  {citation.summary}
                                </p>
                              )}
                              {citation.quote && (
                                <p className="text-xs text-muted-foreground italic mt-2">
                                  {'"'}{citation.quote}{'"'}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              )
            })
          )}
      </div>
    </div>
  )
}
