'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { StatusBadge } from './status-badge'
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
  Plus,
  FileText,
  Users,
  Calendar,
  ArrowUpRight,
  Filter,
} from 'lucide-react'
import type { ProjectStatus, StudyType, Project } from '@/lib/types'

const studyTypeLabels: Record<StudyType, string> = {
  'single-flow': 'Unmoderated',
  'concept-test': 'Concept Test',
  'balanced-comparison': 'Unmoderated Balanced Comparison',
  'ab-comparison': 'A/B Comparison',
  'moderated-test': 'Moderated',
  'within-subject': 'Within-Subject',
  'between-subject': 'Between-Subject',
}

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects')
        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }
        const data = await response.json()
        setProjects(data)
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.studyName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesType = typeFilter === 'all' || project.studyType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your research studies and analysis workflows
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-secondary border-border">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="validation-required">Validation Required</SelectItem>
            <SelectItem value="analyzing">Analyzing</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 bg-secondary border-border">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="single-flow">Unmoderated</SelectItem>
            <SelectItem value="balanced-comparison">Unmoderated Balanced Comparison</SelectItem>
            <SelectItem value="moderated-test">Moderated</SelectItem>
            <SelectItem value="concept-test">Concept Test</SelectItem>
            <SelectItem value="ab-comparison">A/B Comparison</SelectItem>
            <SelectItem value="within-subject">Within-Subject</SelectItem>
            <SelectItem value="between-subject">Between-Subject</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Study Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Transcripts
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Updated
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!loading && !error && filteredProjects.map((project) => (
              <tr
                key={project.id}
                className="group hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-4">
                  <Link href={`/projects/${project.id}`} className="block">
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {project.name}
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {project.studyName}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-foreground">
                    {studyTypeLabels[project.studyType]}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={project.status} />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {project.transcriptCount}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {project.ownerName || 'Unknown'}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open
                      <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border border-border border-t-primary mb-4"></div>
            <h3 className="text-lg font-medium text-foreground">Loading projects...</h3>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-destructive/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Error loading projects</h3>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!loading && !error && filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground">No projects found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {projects.length === 0 ? 'Create your first project to get started' : 'Try adjusting your search or filter criteria'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
