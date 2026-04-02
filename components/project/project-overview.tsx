'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/status-badge'
import { DeleteProjectDialog } from './delete-project-dialog'
import {
  Eye,
  FileText,
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Activity,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type { Project, StudyType } from '@/lib/types'
import type { Finding, Transcript } from '@/lib/queries'

const studyTypeLabels: Record<StudyType, string> = {
  'single-flow': 'Single Flow',
  'concept-test': 'Concept Test',
  'balanced-comparison': 'Balanced Comparison',
  'ab-comparison': 'A/B Comparison',
  'within-subject': 'Within-Subject',
  'between-subject': 'Between-Subject',
}

interface ProjectOverviewProps {
  project: Project
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const [findings, setFindings] = useState<Finding[]>([])
  const [transcripts, setTranscripts] = useState<Transcript[]>([])
  const [loadingFindings, setLoadingFindings] = useState(true)
  const [loadingTranscripts, setLoadingTranscripts] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null)

  useEffect(() => {
    async function fetchOverviewData() {
      try {
        const [reportResponse, transcriptResponse] = await Promise.all([
          fetch(`/api/projects/${project.id}/report`),
          fetch(`/api/projects/${project.id}/transcripts`),
        ])

        if (reportResponse.ok) {
          const reportData = await reportResponse.json()
          setFindings(reportData.findings || [])
        }

        if (transcriptResponse.ok) {
          const transcriptData = await transcriptResponse.json()
          setTranscripts(transcriptData || [])
        }
      } catch (error) {
        console.error('Error fetching project overview data:', error)
      } finally {
        setLoadingFindings(false)
        setLoadingTranscripts(false)
      }
    }

    fetchOverviewData()
  }, [project.id])

  const findingsCount = loadingFindings ? project.findingsCount : findings.length
  const topFindings = findings.slice(0, 3)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.studyName}</p>
        </div>
        <StatusBadge status={project.status} size="md" />
      </div>

      {/* Study Metadata */}
      <Card className="p-5 border-border bg-card">
        <h3 className="text-sm font-medium text-foreground mb-4">Study Metadata</h3>
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Study Type</p>
            <p className="text-sm font-medium text-foreground mt-1">
              {studyTypeLabels[project.studyType]}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Participants</p>
            <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {project.participantCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Transcripts</p>
            <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {project.transcriptCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Updated</p>
            <p className="text-sm font-medium text-foreground mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {project.conditions && project.conditions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Conditions</p>
            <div className="flex flex-wrap gap-2">
              {project.conditions.map((condition) => (
                <Badge key={condition.id} variant="secondary">
                  {condition.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {project.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Transcripts</p>
              <p className="text-xl font-semibold text-foreground">{project.transcriptCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Users className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Participants</p>
              <p className="text-xl font-semibold text-foreground">{project.participantCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Findings</p>
              <p className="text-xl font-semibold text-foreground">{findingsCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-semibold text-foreground capitalize">
                {project.status.replace(/-/g, ' ')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Findings */}
      <Card className="p-5 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Report Highlights</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Surfaced from the latest report and findings output.
            </p>
          </div>
          <Badge variant="secondary">{findingsCount} total</Badge>
        </div>
        {loadingFindings ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border border-border border-t-primary"></div>
          </div>
        ) : topFindings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No findings yet</p>
            <p className="text-xs text-muted-foreground mt-1">Run analysis to generate findings</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topFindings.map((finding) => (
              <div
                key={finding.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded text-xs font-medium shrink-0 ${
                    finding.type === 'pain-point'
                      ? 'bg-destructive/10 text-destructive'
                      : finding.type === 'delighter'
                      ? 'bg-success/10 text-success'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {finding.type === 'pain-point' ? '!' : finding.type === 'delighter' ? '+' : '→'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{finding.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {finding.description}
                  </p>
                </div>
                {finding.severity && (
                  <Badge
                    variant="secondary"
                    className={`shrink-0 ${
                      finding.severity === 'critical'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {finding.severity}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Activity Log */}
      <Card className="p-5 border-border bg-card">
        <h3 className="text-sm font-medium text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-foreground">Last updated</span>
            <span className="text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
            </span>
          </div>
          {project.transcriptCount > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-foreground">{project.transcriptCount} transcripts ingested</span>
              <span className="text-muted-foreground ml-auto">completed</span>
            </div>
          )}
          {findingsCount > 0 && (
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-foreground">{findingsCount} findings generated</span>
              <span className="text-muted-foreground ml-auto">completed</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
            <span className="text-foreground">Project created</span>
            <span className="text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-5 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Participants in this test</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Browse imported participant transcripts directly from the overview.
            </p>
          </div>
          <Badge variant="secondary">{transcripts.length} total</Badge>
        </div>

        {loadingTranscripts ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border border-border border-t-primary"></div>
          </div>
        ) : transcripts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No participant transcripts have been imported for this project yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-foreground">Participant</th>
                  <th className="px-4 py-3 font-medium text-foreground">Session</th>
                  <th className="px-4 py-3 font-medium text-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-foreground">Imported</th>
                  <th className="px-4 py-3 font-medium text-foreground text-right">Transcript</th>
                </tr>
              </thead>
              <tbody>
                {transcripts.map((transcript) => (
                  <tr key={transcript.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-foreground">{transcript.participantId}</td>
                    <td className="px-4 py-3 text-muted-foreground">{transcript.sessionId}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">
                        {transcript.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(transcript.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setSelectedTranscript(transcript)}
                      >
                        <Eye className="h-4 w-4" />
                        View transcript
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Delete Project Section */}
      <div className="border-t border-border pt-8 mt-8">
        <Card className="p-5 border-destructive/20 bg-destructive/5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 shrink-0 mt-0.5">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Delete project</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Permanently delete this project and all related data. This action cannot be undone.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete project
            </Button>
          </div>
        </Card>
      </div>
      <DeleteProjectDialog
        projectId={project.id}
        projectName={project.name}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      <Dialog open={Boolean(selectedTranscript)} onOpenChange={(open) => !open && setSelectedTranscript(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTranscript ? `${selectedTranscript.participantId} transcript` : 'Transcript'}
            </DialogTitle>
            <DialogDescription>
              {selectedTranscript ? `Session ${selectedTranscript.sessionId}` : 'Participant transcript'}
            </DialogDescription>
          </DialogHeader>
          {selectedTranscript && (
            <div className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-muted/20 p-4">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-mono">
                {selectedTranscript.transcript}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
