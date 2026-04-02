'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, FileText, Link as LinkIcon } from 'lucide-react'
import type { Project } from '@/lib/types'

export function ProjectMaterials() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProject() {
      if (!params.id) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch project')
        const data = await response.json()
        setProject(data)
      } catch (error) {
        console.error('Error fetching project materials:', error)
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border border-border border-t-primary"></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6">
        <Card className="p-8 border-border bg-card text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Project materials could not be loaded.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Materials</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Source materials used to ground the study and downstream analysis.
        </p>
      </div>

      <Card className="p-5 border-border bg-card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">User Test Script</h3>
              <p className="text-xs text-muted-foreground">
                The script used to frame participant tasks and question-by-question analysis.
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            {project.testScript ? 'Available' : 'Missing'}
          </Badge>
        </div>

        {project.testScript ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-mono">
              {project.testScript}
            </pre>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No test script has been saved for this project yet.
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5 border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <LinkIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Study Source</h3>
              <p className="text-xs text-muted-foreground">Saved UserTesting sessions link</p>
            </div>
          </div>
          {project.usertestingUrl ? (
            <div className="space-y-3">
              <p className="text-sm text-foreground break-all">{project.usertestingUrl}</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                asChild
              >
                <a href={project.usertestingUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open UserTesting
                </a>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No UserTesting link has been saved yet.</p>
          )}
        </Card>

        <Card className="p-5 border-border bg-card">
          <h3 className="text-sm font-medium text-foreground mb-3">Study Setup</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Study Type</p>
              <p className="text-foreground mt-1 capitalize">{project.studyType.replace(/-/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Comparison Setup</p>
              <p className="text-foreground mt-1">
                {project.isABComparison ? 'Includes an A/B comparison' : 'Single-flow / non-comparative study'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Imported Transcripts</p>
              <p className="text-foreground mt-1">{project.transcriptCount}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
