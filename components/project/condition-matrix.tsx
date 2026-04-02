'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
} from 'lucide-react'
import { StatusBadge, ValidationFlagBadge } from '@/components/status-badge'
import type { Transcript } from '@/lib/queries'
import type { ValidationFlag } from '@/lib/types'

const validationFlags: ValidationFlag[] = [
  'missing-assignment',
  'order-incomplete',
  'low-confidence',
  'quality-issue',
  'excluded',
]

function isValidationFlag(value: string): value is ValidationFlag {
  return validationFlags.includes(value as ValidationFlag)
}

export function ConditionMatrix() {
  const params = useParams()
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [conditionFilter, setConditionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function fetchTranscripts() {
      if (!params.id) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/projects/${params.id}/transcripts`)
        if (!response.ok) throw new Error('Failed to fetch transcripts')
        const data = await response.json()
        setTranscripts(data)
      } catch (error) {
        console.error('Error fetching transcripts:', error)
        setTranscripts([])
      } finally {
        setLoading(false)
      }
    }

    fetchTranscripts()
  }, [params.id])

  const filteredParticipants = transcripts.filter((p) => {
    const matchesSearch =
      p.participantId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sessionId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCondition =
      conditionFilter === 'all' || p.condition === conditionFilter || (conditionFilter === 'unassigned' && !p.condition)
    const matchesStatus =
      statusFilter === 'all' ||
      p.status === statusFilter ||
      (statusFilter === 'issues' && p.validationFlags.length > 0)
    return matchesSearch && matchesCondition && matchesStatus
  })

  const conditionCounts = {
    control: transcripts.filter((p) => p.condition === 'control').length,
    variant: transcripts.filter((p) => p.condition === 'variant').length,
    unassigned: transcripts.filter((p) => !p.condition).length,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Condition Matrix</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed view of participant assignments and data quality.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-sm font-semibold text-primary">C</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Control</p>
              <p className="text-xl font-semibold text-foreground">{conditionCounts.control}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <span className="text-sm font-semibold text-success">V</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Variant</p>
              <p className="text-xl font-semibold text-foreground">{conditionCounts.variant}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unassigned</p>
              <p className="text-xl font-semibold text-foreground">{conditionCounts.unassigned}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-semibold text-foreground">{transcripts.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by participant or session ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <Select value={conditionFilter} onValueChange={setConditionFilter}>
          <SelectTrigger className="w-40 bg-secondary border-border">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            <SelectItem value="control">Control</SelectItem>
            <SelectItem value="variant">Variant</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="mapped">Mapped</SelectItem>
            <SelectItem value="exported">Exported</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="issues">Has Issues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Participant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Session
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Condition
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Expected Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actual Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Completion
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Transcript
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Flags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredParticipants.map((transcript) => (
                <tr
                  key={transcript.id}
                  className={cn(
                    'transition-colors',
                    transcript.excluded
                      ? 'bg-muted/30 opacity-60'
                      : transcript.validationFlags.length > 0
                      ? 'bg-warning/5 hover:bg-warning/10'
                      : 'hover:bg-muted/20'
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-foreground">
                      {transcript.participantId}
                    </span>
                    {transcript.excluded && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Excluded
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground font-mono">
                      {transcript.sessionId}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {transcript.condition ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          transcript.condition === 'control'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-success/10 text-success'
                        )}
                      >
                        {transcript.condition}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-warning/10 text-warning">
                        Unassigned
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-foreground">
                      {transcript.expectedOrder ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-sm',
                        transcript.actualOrder !== transcript.expectedOrder &&
                          transcript.actualOrder
                          ? 'text-warning font-medium'
                          : 'text-foreground'
                      )}
                    >
                      {transcript.actualOrder ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        transcript.completion === 'complete'
                          ? 'bg-success/10 text-success'
                          : transcript.completion === 'partial'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                      )}
                    >
                      {transcript.completion}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={transcript.status} type="transcript" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {transcript.validationFlags.length === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        transcript.validationFlags
                          .filter(isValidationFlag)
                          .map((flag) => (
                            <ValidationFlagBadge key={flag} flag={flag} />
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border border-border border-t-primary mb-4"></div>
            <p className="text-muted-foreground">Loading transcripts...</p>
          </div>
        )}

        {!loading && transcripts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No transcripts yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Transcripts will appear here after ingestion
            </p>
          </div>
        )}

        {!loading && transcripts.length > 0 && filteredParticipants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No matches found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
