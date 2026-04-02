'use client'

import { useState } from 'react'
import { AppShell } from '@/components/app-shell'
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
import { cn } from '@/lib/utils'
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Users,
  FileText,
  Quote,
  BarChart3,
} from 'lucide-react'

// Aggregated findings across all projects
const allFindings = [
  {
    id: 'F001',
    type: 'pain-point',
    title: 'Confusion with payment method selection',
    description: 'Users struggled to understand the difference between saved payment methods and entering new card details.',
    severity: 'critical',
    projectCount: 3,
    totalParticipants: 24,
    projects: ['Q1 Checkout Optimization', 'Mobile Navigation Redesign', 'Onboarding Flow Evaluation'],
    tags: ['payment', 'ui-clarity', 'critical'],
    theme: 'Payment UX',
  },
  {
    id: 'F002',
    type: 'delighter',
    title: 'Address auto-complete praised',
    description: 'Participants consistently praised the address auto-complete feature, noting it saved significant time.',
    projectCount: 2,
    totalParticipants: 36,
    projects: ['Q1 Checkout Optimization', 'Mobile Navigation Redesign'],
    tags: ['address', 'auto-complete', 'positive'],
    theme: 'Form UX',
  },
  {
    id: 'F003',
    type: 'pain-point',
    title: 'Navigation depth causes confusion',
    description: 'Users frequently got lost in deep navigation hierarchies and struggled to return to previous states.',
    severity: 'major',
    projectCount: 4,
    totalParticipants: 48,
    projects: ['Mobile Navigation Redesign', 'Dashboard Widget Study', 'Search Results Page', 'Onboarding Flow Evaluation'],
    tags: ['navigation', 'wayfinding', 'mobile'],
    theme: 'Navigation',
  },
  {
    id: 'F004',
    type: 'insight',
    title: 'Progress indicators improve confidence',
    description: 'Visual progress indicators significantly improved user confidence during multi-step flows.',
    projectCount: 3,
    totalParticipants: 42,
    projects: ['Q1 Checkout Optimization', 'Onboarding Flow Evaluation', 'Mobile Navigation Redesign'],
    tags: ['progress', 'confidence', 'multi-step'],
    theme: 'Progress & Feedback',
  },
  {
    id: 'F005',
    type: 'pain-point',
    title: 'Unclear error messages',
    description: 'Error messages were too technical or vague, leaving users unsure how to resolve issues.',
    severity: 'major',
    projectCount: 2,
    totalParticipants: 18,
    projects: ['Q1 Checkout Optimization', 'Search Results Page'],
    tags: ['errors', 'messaging', 'clarity'],
    theme: 'Error Handling',
  },
  {
    id: 'F006',
    type: 'delighter',
    title: 'Contextual help tooltips valued',
    description: 'Users appreciated contextual help tooltips that explained complex features inline.',
    projectCount: 2,
    totalParticipants: 24,
    projects: ['Dashboard Widget Study', 'Onboarding Flow Evaluation'],
    tags: ['help', 'tooltips', 'onboarding'],
    theme: 'Help & Education',
  },
  {
    id: 'F007',
    type: 'pain-point',
    title: 'Search results lack relevance',
    description: 'Search results often surfaced irrelevant content, frustrating users trying to find specific items.',
    severity: 'critical',
    projectCount: 1,
    totalParticipants: 12,
    projects: ['Search Results Page'],
    tags: ['search', 'relevance', 'discovery'],
    theme: 'Search',
  },
  {
    id: 'F008',
    type: 'insight',
    title: 'Mobile gestures underutilized',
    description: 'Users expected swipe and gesture interactions that were not available in the current designs.',
    projectCount: 2,
    totalParticipants: 30,
    projects: ['Mobile Navigation Redesign', 'Dashboard Widget Study'],
    tags: ['mobile', 'gestures', 'interaction'],
    theme: 'Mobile Interaction',
  },
]

const themes = [
  { name: 'Payment UX', count: 1, type: 'pain-point' },
  { name: 'Form UX', count: 1, type: 'delighter' },
  { name: 'Navigation', count: 1, type: 'pain-point' },
  { name: 'Progress & Feedback', count: 1, type: 'insight' },
  { name: 'Error Handling', count: 1, type: 'pain-point' },
  { name: 'Help & Education', count: 1, type: 'delighter' },
  { name: 'Search', count: 1, type: 'pain-point' },
  { name: 'Mobile Interaction', count: 1, type: 'insight' },
]

const recurringPainPoints = [
  { title: 'Payment method confusion', occurrences: 3, severity: 'critical' },
  { title: 'Navigation depth', occurrences: 4, severity: 'major' },
  { title: 'Error message clarity', occurrences: 2, severity: 'major' },
  { title: 'Search relevance', occurrences: 1, severity: 'critical' },
]

const recurringDelighters = [
  { title: 'Address auto-complete', occurrences: 2 },
  { title: 'Contextual help tooltips', occurrences: 2 },
  { title: 'Progress indicators', occurrences: 3 },
]

export default function FindingsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [themeFilter, setThemeFilter] = useState('all')

  const filteredFindings = allFindings.filter((finding) => {
    const matchesSearch =
      finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      finding.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || finding.type === typeFilter
    const matchesTheme = themeFilter === 'all' || finding.theme === themeFilter
    return matchesSearch && matchesType && matchesTheme
  })

  return (
    <AppShell
      breadcrumbs={[{ label: 'All Findings' }]}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">All Findings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Normalized findings across all research projects
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Findings</p>
                <p className="text-xl font-semibold text-foreground">{allFindings.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pain Points</p>
                <p className="text-xl font-semibold text-foreground">
                  {allFindings.filter((f) => f.type === 'pain-point').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delighters</p>
                <p className="text-xl font-semibold text-foreground">
                  {allFindings.filter((f) => f.type === 'delighter').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projects</p>
                <p className="text-xl font-semibold text-foreground">5</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search findings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary border-border"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36 bg-secondary border-border">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pain-point">Pain Points</SelectItem>
                  <SelectItem value="delighter">Delighters</SelectItem>
                  <SelectItem value="insight">Insights</SelectItem>
                </SelectContent>
              </Select>
              <Select value={themeFilter} onValueChange={setThemeFilter}>
                <SelectTrigger className="w-44 bg-secondary border-border">
                  <SelectValue placeholder="All Themes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Themes</SelectItem>
                  {themes.map((theme) => (
                    <SelectItem key={theme.name} value={theme.name}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              {filteredFindings.map((finding) => (
                <Card key={finding.id} className="p-4 border-border bg-card hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                        finding.type === 'pain-point'
                          ? 'bg-destructive/10 text-destructive'
                          : finding.type === 'delighter'
                          ? 'bg-success/10 text-success'
                          : 'bg-primary/10 text-primary'
                      )}
                    >
                      {finding.type === 'pain-point' ? (
                        <AlertTriangle className="h-5 w-5" />
                      ) : finding.type === 'delighter' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <ArrowRight className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-foreground">{finding.title}</h4>
                        <div className="flex items-center gap-2 shrink-0">
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
                          <Badge variant="outline" className="text-xs">
                            {finding.theme}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {finding.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {finding.projectCount} projects
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {finding.totalParticipants} participants
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {finding.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs bg-muted">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Recurring Pain Points */}
            <Card className="p-4 border-border bg-card">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Recurring Pain Points
              </h3>
              <div className="space-y-2">
                {recurringPainPoints.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{item.title}</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-xs',
                          item.severity === 'critical' && 'bg-destructive/10 text-destructive',
                          item.severity === 'major' && 'bg-warning/10 text-warning'
                        )}
                      >
                        {item.severity}
                      </Badge>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {item.occurrences}x
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recurring Delighters */}
            <Card className="p-4 border-border bg-card">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Recurring Delighters
              </h3>
              <div className="space-y-2">
                {recurringDelighters.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <span className="text-sm text-foreground">{item.title}</span>
                    <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                      {item.occurrences}x
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Themes */}
            <Card className="p-4 border-border bg-card">
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Themes
              </h3>
              <div className="space-y-2">
                {themes.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => setThemeFilter(theme.name)}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded transition-colors text-left',
                      themeFilter === theme.name
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/30 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-sm">{theme.name}</span>
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        theme.type === 'pain-point' && 'bg-destructive',
                        theme.type === 'delighter' && 'bg-success',
                        theme.type === 'insight' && 'bg-primary'
                      )}
                    />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
