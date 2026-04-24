'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Users, AlertCircle, FileText, CheckCircle2, Clock, XCircle, RefreshCw, Sparkles, Link as LinkIcon } from 'lucide-react'

interface Session {
  id: string
  username: string
  video_length: string | null
}

interface Transcript {
  id: string
  participantId: string
  sessionId: string
  transcript: string
  status: string
  createdAt: string
}

interface BalancedComparisonAssignment {
  participantId: string
  orderLabel: 'A-B' | 'B-A'
}

interface ImportRun {
  id: string
  status: 'queued' | 'running' | 'complete' | 'failed'
  discovered_count: number
  imported_count: number
  current_step?: string | null
  current_user?: string | null
  progress_log?: string[] | null
  error_message?: string
  created_at: string
}

interface ImportStatus {
  importRun: ImportRun | null
  discoveredSessions: number
  importedTranscripts: number
}

interface StepIngestMapProps {
  projectId?: string
}

export function StepIngestMap({ projectId }: StepIngestMapProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [sessionsUrl, setSessionsUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [collectionMode, setCollectionMode] = useState<'automatic' | 'manual'>('automatic')
  const [participantName, setParticipantName] = useState('')
  const [manualTranscript, setManualTranscript] = useState('')
  const [isSavingManual, setIsSavingManual] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)
  const [isSavingUrl, setIsSavingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null)
  const [studyType, setStudyType] = useState<string>('single-flow')
  const [balancedAssignments, setBalancedAssignments] = useState<BalancedComparisonAssignment[]>([])
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const [isSavingAssignments, setIsSavingAssignments] = useState(false)

  const fetchProject = useCallback(async () => {
    if (!projectId) return
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) return
      const data = await res.json()
      setSessionsUrl(data.usertestingUrl || '')
      setStudyType(data.studyType || 'single-flow')
      setBalancedAssignments(data.balancedAssignments || [])
    } catch (err) {
      console.error('Failed to fetch project:', err)
    }
  }, [projectId])

  // Fetch sessions from DB
  const fetchSessions = useCallback(async () => {
    if (!projectId) return
    try {
      const res = await fetch(`/api/projects/${projectId}/sessions`)
      if (res.ok) {
        const data: Session[] = await res.json()
        setSessions(data)
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    }
  }, [projectId])

  const fetchTranscripts = useCallback(async () => {
    if (!projectId) return
    try {
      const res = await fetch(`/api/projects/${projectId}/transcripts`)
      if (res.ok) {
        const data: Transcript[] = await res.json()
        setTranscripts(data)
      }
    } catch (err) {
      console.error('Failed to fetch transcripts:', err)
    }
  }, [projectId])

  // Fetch import status from DB (latest import_runs, sessions count, transcripts count)
  const fetchImportStatus = useCallback(async () => {
    if (!projectId) return
    try {
      const res = await fetch(`/api/projects/${projectId}/import-transcripts`)
      if (res.ok) {
        const data = await res.json()
        setImportStatus(data)
      }
    } catch (err) {
      console.error('Failed to fetch import status:', err)
    }
  }, [projectId])

  // Initial load
  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    Promise.all([fetchProject(), fetchSessions(), fetchImportStatus(), fetchTranscripts()])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [projectId, fetchProject, fetchSessions, fetchImportStatus, fetchTranscripts])

  // Poll while import is active so the UI progresses without manual refresh.
  useEffect(() => {
    if (!projectId) return
    const status = importStatus?.importRun?.status
    if (status !== 'queued' && status !== 'running') return

    const timer = setInterval(() => {
      Promise.all([fetchSessions(), fetchImportStatus(), fetchTranscripts()]).catch((err) => {
        console.error('Failed to refresh import status:', err)
      })
    }, 3000)

    return () => clearInterval(timer)
  }, [projectId, importStatus?.importRun?.status, fetchSessions, fetchImportStatus, fetchTranscripts])

  // Manual refresh to check for worker writeback results
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchSessions(), fetchImportStatus(), fetchTranscripts()])
    setIsRefreshing(false)
  }

  const handleSaveManualTranscript = async () => {
    if (!projectId) {
      setManualError('Project must be created before transcripts can be added.')
      return
    }

    if (!participantName.trim()) {
      setManualError('Participant name is required.')
      return
    }

    if (!manualTranscript.trim()) {
      setManualError('Transcript text is required.')
      return
    }

    setManualError(null)
    setIsSavingManual(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/transcripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participantName,
          transcript: manualTranscript,
        }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to save transcript')
      }

      setParticipantName('')
      setManualTranscript('')
      await Promise.all([fetchTranscripts(), fetchImportStatus()])
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Failed to save transcript')
    } finally {
      setIsSavingManual(false)
    }
  }

  const handleSaveSessionsUrl = async () => {
    if (!projectId) {
      setUrlError('Project must be created before a UserTesting URL can be saved.')
      return false
    }

    if (!sessionsUrl.trim()) {
      setUrlError('Please enter a UserTesting sessions URL.')
      return false
    }

    if (!sessionsUrl.trim().endsWith('/sessions')) {
      setUrlError('URL must end with /sessions.')
      return false
    }

    setIsSavingUrl(true)
    setUrlError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionsUrl }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to save UserTesting URL')
      }

      await fetchProject()
      return true
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Failed to save UserTesting URL')
      return false
    } finally {
      setIsSavingUrl(false)
    }
  }

  const handleRunAutomaticCapture = async () => {
    if (!projectId) {
      setImportError('Project ID is required. Please create the project first.')
      return
    }

    setImportError(null)
    const saveSucceeded = await handleSaveSessionsUrl()

    if (!saveSucceeded) {
      return
    }

    setIsImporting(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/import-transcripts`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Import failed')
      }

      await fetchImportStatus()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelImport = async () => {
    if (!projectId) return
    setIsCancelling(true)
    setImportError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/import-transcripts`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to cancel import')
      }

      await Promise.all([fetchSessions(), fetchImportStatus()])
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to cancel import')
    } finally {
      setIsCancelling(false)
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'queued':
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'complete':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'queued':
        return 'Queued'
      case 'running':
        return 'Importing...'
      case 'complete':
        return 'Complete'
      case 'failed':
        return 'Failed'
      default:
        return 'Not started'
    }
  }

  // Helper to determine if import is in progress (queued or running)
  const isImportInProgress = importStatus?.importRun?.status === 'queued' || importStatus?.importRun?.status === 'running'
  const progressPercent = (() => {
    if (!importStatus?.importRun) return 0
    if (importStatus.importRun.status === 'complete') return 100
    if (importStatus.importRun.status === 'queued') return 10
    if (importStatus.importRun.status !== 'running') return 0
    const discovered = importStatus.discoveredSessions || importStatus.importRun.discovered_count || 0
    const imported = importStatus.importedTranscripts || importStatus.importRun.imported_count || 0
    if (discovered > 0) {
      return Math.max(15, Math.min(95, Math.round((imported / discovered) * 100)))
    }
    return importStatus.importRun.current_user ? 40 : 25
  })()
  const progressLog = importStatus?.importRun?.progress_log || []
  const transcriptParticipants = [...new Set(transcripts.map((transcript) => transcript.participantId).filter(Boolean))]
  const balancedAssignmentMap = new Map(
    balancedAssignments.map((assignment) => [assignment.participantId, assignment.orderLabel])
  )
  const assignmentRows = transcriptParticipants.map((participantId) => ({
    participantId,
    orderLabel: balancedAssignmentMap.get(participantId) || 'A-B',
  }))

  const handleAssignmentOrderChange = (participantId: string, orderLabel: 'A-B' | 'B-A') => {
    setBalancedAssignments((prev) => {
      const next = prev.filter((assignment) => assignment.participantId !== participantId)
      return [...next, { participantId, orderLabel }].sort((a, b) =>
        a.participantId.localeCompare(b.participantId)
      )
    })
  }

  const handleSaveAssignments = async () => {
    if (!projectId) return
    setAssignmentError(null)
    setIsSavingAssignments(true)

    try {
      const res = await fetch(`/api/projects/${projectId}/balanced-comparison-assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments: assignmentRows }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to save balanced comparison ordering')
      }

      setBalancedAssignments(payload.assignments || assignmentRows)
      await fetchProject()
    } catch (err) {
      setAssignmentError(
        err instanceof Error ? err.message : 'Failed to save balanced comparison ordering'
      )
    } finally {
      setIsSavingAssignments(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Ingest & Map</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Import and map transcripts from your UserTesting study.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="p-5 border-border bg-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Transcript collection</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Choose whether to collect transcripts with the local Playwright helper or add them manually.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={collectionMode === 'automatic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCollectionMode('automatic')}
            >
              Automatic
            </Button>
            <Button
              type="button"
              variant={collectionMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCollectionMode('manual')}
            >
              Manual
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Sessions Discovered</p>
              <p className="text-2xl font-semibold text-foreground">
                {loading ? '—' : (importStatus?.discoveredSessions ?? sessions.length)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Transcripts Imported</p>
              <p className="text-2xl font-semibold text-foreground">
                {transcripts.length || importStatus?.importedTranscripts || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {collectionMode === 'automatic' ? (
        <>
          <Card className="p-5 border-border bg-card">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Automatic capture with Playwright</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Paste the UserTesting sessions URL for this study, save it, then run transcript capture.
                    If Playwright is not ready on your machine, switch to manual mode and paste transcripts one by one.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">UserTesting sessions URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={sessionsUrl}
                      onChange={(e) => {
                        setSessionsUrl(e.target.value)
                        setUrlError(null)
                      }}
                      placeholder="https://app.usertesting.com/workspaces/.../study/.../sessions"
                      className="pl-9"
                    />
                  </div>
                  {isImportInProgress ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelImport}
                      disabled={isCancelling}
                      className="gap-2"
                    >
                      {isCancelling ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cancelling…
                        </>
                      ) : (
                        'Cancel'
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleRunAutomaticCapture}
                      disabled={isSavingUrl || isImporting || !projectId}
                      className="gap-2"
                    >
                      {isSavingUrl || isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Starting…
                        </>
                      ) : (
                        'Capture transcripts'
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste the study sessions URL, then start capture. If Playwright is not set up on this machine yet, switch to manual mode and paste transcripts one by one.
                </p>
                {urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
              </div>
              {importStatus?.importRun ? (
                <div className={`rounded-xl border p-4 ${importStatus.importRun.status === 'failed' ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-muted/20'}`}>
                  <div className="flex items-start gap-3">
                    {getStatusIcon(importStatus.importRun.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {importStatus.importRun.status === 'queued' && 'Import queued'}
                        {importStatus.importRun.status === 'running' && 'Import running'}
                        {importStatus.importRun.status === 'complete' && 'Import complete'}
                        {importStatus.importRun.status === 'failed' && 'Import failed'}
                      </p>
                      {importStatus.importRun.status === 'queued' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Waiting for the capture helper to begin processing this study.
                        </p>
                      )}
                      {importStatus.importRun.status === 'running' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {importStatus.importRun.current_user
                            ? `Capturing ${importStatus.importRun.current_user}...`
                            : 'Transcript capture is in progress.'}
                        </p>
                      )}
                      {importStatus.importRun.status === 'complete' && (
                        <p className="text-xs text-green-600 mt-1">
                          Captured {importStatus.importedTranscripts} transcript{importStatus.importedTranscripts !== 1 ? 's' : ''} from {importStatus.discoveredSessions} session{importStatus.discoveredSessions !== 1 ? 's' : ''}.
                        </p>
                      )}
                      {importStatus.importRun.status === 'failed' && importStatus.importRun.error_message && (
                        <p className="text-xs text-destructive mt-1">{importStatus.importRun.error_message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Started: {new Date(importStatus.importRun.created_at).toLocaleString()}
                      </p>
                      {(importStatus.importRun.status === 'queued' || importStatus.importRun.status === 'running') && (
                        <div className="mt-4 space-y-3">
                          <Progress value={progressPercent} className="h-2" />
                          {progressLog.length > 0 && (
                            <div className="rounded-md border border-border bg-background p-3 max-h-32 overflow-y-auto">
                              <div className="space-y-1">
                                {progressLog.map((entry, index) => (
                                  <p key={`${entry}-${index}`} className="text-xs text-muted-foreground">
                                    {entry}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4">
                  <p className="text-sm font-medium text-foreground">Capture not run yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the sessions URL above, then start capture to collect transcripts with Playwright.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-5 border-border bg-card">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">Manual transcript entry</p>
              <p className="text-xs text-muted-foreground mt-1">
                Paste transcripts one by one if you are not using Playwright automation.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Participant / UserTesting name</label>
              <Input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="e.g. Testerjordy"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Transcript</label>
              <Textarea
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                placeholder="Paste the participant transcript here..."
                rows={12}
              />
            </div>

            {manualError && (
              <p className="text-sm text-destructive">{manualError}</p>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleSaveManualTranscript}
                disabled={isSavingManual || !projectId}
                className="gap-2"
              >
                {isSavingManual ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Add transcript'
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {importError && (
        <Card className="p-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{importError}</p>
          </div>
        </Card>
      )}

      {/* Collected transcripts */}
      <Card className="p-5 border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">Collected transcripts</h3>
          <Badge variant="secondary">{transcripts.length} total</Badge>
        </div>

        {!loading && !error && transcripts.length === 0 && (
          <div className="py-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No transcripts collected yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use automatic capture or add participant transcripts manually.
            </p>
          </div>
        )}

        {!loading && !error && transcripts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Participant</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Session</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Transcript</th>
                </tr>
              </thead>
              <tbody>
                {transcripts.map((transcript) => (
                  <tr
                    key={transcript.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground">{transcript.participantId}</td>
                    <td className="py-3 px-4 text-muted-foreground">{transcript.sessionId}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="capitalize">
                        {transcript.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTranscript(transcript)}
                      >
                        Open transcript
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {studyType === 'balanced-comparison' && (
        <Card className="p-5 border-border bg-card">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Balanced comparison ordering</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Set the view order for each collected participant so the A/B analysis and final report use the correct ordering.
              </p>
            </div>

            {assignmentRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4">
                <p className="text-sm text-muted-foreground">
                  Add or capture transcripts first. Once participants are collected, their view order will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignmentRows.map((row) => (
                  <div
                    key={row.participantId}
                    className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_180px]"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{row.participantId}</p>
                      <p className="text-xs text-muted-foreground">Participant</p>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor={`view-order-${row.participantId}`}
                        className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                      >
                        View order
                      </label>
                      <select
                        id={`view-order-${row.participantId}`}
                        value={row.orderLabel}
                        onChange={(e) =>
                          handleAssignmentOrderChange(
                            row.participantId,
                            e.target.value === 'B-A' ? 'B-A' : 'A-B'
                          )
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="A-B">A → B</option>
                        <option value="B-A">B → A</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Analysis will only run once the collected participants have a saved order here.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAssignments}
                disabled={assignmentRows.length === 0 || isSavingAssignments}
              >
                {isSavingAssignments ? 'Saving…' : 'Save ordering'}
              </Button>
            </div>

            {assignmentError && (
              <p className="text-sm text-destructive">{assignmentError}</p>
            )}
          </div>
        </Card>
      )}

      <Dialog
        open={Boolean(selectedTranscript)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTranscript(null)
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTranscript?.participantId || 'Transcript'}
            </DialogTitle>
            <DialogDescription>
              Session {selectedTranscript?.sessionId || '—'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-border bg-muted/20 p-4">
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-foreground">
              {selectedTranscript?.transcript || ''}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
