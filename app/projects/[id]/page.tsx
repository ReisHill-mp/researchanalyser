'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { ProjectOverview } from '@/components/project/project-overview'
import { ProjectMaterials } from '@/components/project/project-materials'
import { ConditionMatrix } from '@/components/project/condition-matrix'
import { ProjectAnalysis } from '@/components/project/project-analysis'
import { ProjectReport } from '@/components/project/project-report'
import { ProjectChat } from '@/components/project/project-chat'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Table2,
  BarChart3,
  FileOutput,
  MessageSquare,
  AlertCircle,
} from 'lucide-react'
import type { Project } from '@/lib/types'

const tabs = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'materials', label: 'Materials', icon: FileText },
  { id: 'matrix', label: 'Condition Matrix', icon: Table2 },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'report', label: 'Report', icon: FileOutput },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProject() {
      if (!params.id) {
        setError('No project ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/projects/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Project not found')
          } else {
            throw new Error('Failed to fetch project')
          }
          setLoading(false)
          return
        }
        const data = await response.json()
        setProject(data)
      } catch (err) {
        console.error('Error fetching project:', err)
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id])

  const renderTabContent = () => {
    if (!project) return null
    
    switch (activeTab) {
      case 'overview':
        return <ProjectOverview project={project} />
      case 'materials':
        return <ProjectMaterials />
      case 'matrix':
        return <ConditionMatrix />
      case 'analysis':
        return <ProjectAnalysis />
      case 'report':
        return <ProjectReport project={project} />
      case 'chat':
        return <ProjectChat project={project} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <AppShell breadcrumbs={[{ label: 'Projects', href: '/' }, { label: 'Loading...' }]}>
        <div className="flex flex-col items-center justify-center h-full py-12">
          <div className="animate-spin rounded-full h-8 w-8 border border-border border-t-primary mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </AppShell>
    )
  }

  if (error || !project) {
    return (
      <AppShell breadcrumbs={[{ label: 'Projects', href: '/' }, { label: 'Error' }]}>
        <div className="flex flex-col items-center justify-center h-full py-12">
          <AlertCircle className="h-12 w-12 text-destructive/50 mb-4" />
          <h2 className="text-lg font-medium text-foreground">{error || 'Project not found'}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The project you are looking for does not exist or could not be loaded.
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Projects', href: '/' },
        { label: project.name },
      ]}
    >
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="border-b border-border bg-background px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
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
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>
      </div>
    </AppShell>
  )
}
