'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Users, AlertCircle, FileText, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react'

interface Session {
  id: string
  username: string
  video_length: string | null
}

interface ImportRun {
  id: string
  status: 'queued' | 'running' | 'complete' | 'failed'
  discovered_session_count: number
  imported_transcript_count: number
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
    Promise.all([fetchSessions(), fetchImportStatus()])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [projectId, fetchSessions, fetchImportStatus])

  // Manual refresh to check for worker writeback results
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchSessions(), fetchImportStatus()])
    setIsRefreshing(false)
  }

  const handleImportTranscripts = async () => {
    if (!projectId) {
      setImportError('Project ID is required. Please go back to step 3 and create the project first.')
      return
    }
    setIsImporting(true)
    setImportError(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/import-transcripts`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Import failed')
      }

      // Fetch updated status after triggering import
      await fetchImportStatus()
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
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

      {/* Sessions and Transcripts counts */}
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
                {importStatus?.importedTranscripts || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Import status and trigger */}
      {importStatus?.importRun ? (
        <Card className={`p-5 border-border bg-card ${importStatus.importRun.status === 'failed' ? 'border-destructive/30' : ''}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              {getStatusIcon(importStatus.importRun.status)}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {importStatus.importRun.status === 'queued' && 'Import Queued'}
                  {importStatus.importRun.status === 'running' && 'Import Running'}
                  {importStatus.importRun.status === 'complete' && 'Import Complete'}
                  {importStatus.importRun.status === 'failed' && 'Import Failed'}
                </p>
                {importStatus.importRun.status === 'queued' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Waiting for worker to process. Click Refresh to check status.
                  </p>
                )}
                {importStatus.importRun.status === 'running' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Worker is processing transcripts. Click Refresh to check progress.
                  </p>
                )}
                {importStatus.importRun.status === 'complete' && (
                  <p className="text-xs text-green-600 mt-1">
                    Successfully imported {importStatus.importedTranscripts} transcript{importStatus.importedTranscripts !== 1 ? 's' : ''} from {importStatus.discoveredSessions} session{importStatus.discoveredSessions !== 1 ? 's' : ''}.
                  </p>
                )}
                {importStatus.importRun.status === 'failed' && importStatus.importRun.error_message && (
                  <p className="text-xs text-destructive mt-1">{importStatus.importRun.error_message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Started: {new Date(importStatus.importRun.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            {!isImportInProgress && (
              <Button
                size="sm"
                onClick={handleImportTranscripts}
                disabled={isImporting}
                className="gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Starting…
                  </>
                ) : (
                  'Re-import'
                )}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="p-5 border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Import not run yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {!projectId 
                  ? 'Go back to step 3 to create the project first'
                  : 'Start importing transcripts from UserTesting'}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleImportTranscripts}
              disabled={isImporting || !projectId}
              className="gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                'Import transcripts'
              )}
            </Button>
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

      {/* Sessions table */}
      <Card className="p-5 border-border bg-card overflow-hidden">
        <h3 className="text-sm font-medium text-foreground mb-4">Session List</h3>

        {loading && (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading sessions…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 py-8 justify-center text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="py-10 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Discovery not run yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Connect your UserTesting study in the previous step to discover sessions.
            </p>
          </div>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Username</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Video Length</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground">{session.username}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {session.video_length ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
