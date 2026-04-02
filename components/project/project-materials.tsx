'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Image,
  Table,
  Download,
  Eye,
  CheckCircle2,
} from 'lucide-react'
import type { ProjectFile } from '@/lib/queries'

const parsedScriptMap = [
  { id: 1, task: 'Initial navigation to checkout', expectedDuration: '1-2 min' },
  { id: 2, task: 'Add payment method', expectedDuration: '2-3 min' },
  { id: 3, task: 'Enter shipping information', expectedDuration: '1-2 min' },
  { id: 4, task: 'Review order summary', expectedDuration: '1 min' },
  { id: 5, task: 'Complete purchase', expectedDuration: '30 sec' },
]

export function ProjectMaterials() {
  const params = useParams()
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMaterials() {
      if (!params.id) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/projects/${params.id}/files`)
        if (!response.ok) throw new Error('Failed to fetch files')
        const data = await response.json()
        setFiles(data)
      } catch (error) {
        console.error('Error fetching materials:', error)
        setFiles([])
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [params.id])

  const scriptFile = files.find((f) => f.category === 'script')
  const screenerFile = files.find((f) => f.category === 'screener')
  const stimuliFiles = files.filter((f) => f.category === 'stimuli')
  const assignmentFile = files.find((f) => f.category === 'assignment')

  const renderFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Materials</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Uploaded research documents and stimuli for this study.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border border-border border-t-primary"></div>
        </div>
      ) : files.length === 0 ? (
        <Card className="p-8 border-border bg-card text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No materials uploaded yet</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-6">
            {/* Test Script */}
            {scriptFile ? (
              <Card className="p-5 border-border bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Test Script</h3>
                      <p className="text-xs text-muted-foreground">Primary research document</p>
                    </div>
                  </div>
                  {scriptFile.parsedTasks && (
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Parsed
                    </Badge>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-muted/30 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{scriptFile.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{renderFileSize(scriptFile.fileSize)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {scriptFile.parsedTasks && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{scriptFile.parsedTasks} tasks</span> detected
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-5 border-border bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No script uploaded</p>
                </div>
              </Card>
            )}

            {/* Screener */}
            {screenerFile ? (
              <Card className="p-5 border-border bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Screener</h3>
                      <p className="text-xs text-muted-foreground">Participant criteria</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{screenerFile.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{renderFileSize(screenerFile.fileSize)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-5 border-border bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No screener uploaded</p>
                </div>
              </Card>
            )}

            {/* Stimuli */}
            <Card className="p-5 border-border bg-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Image className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Stimuli</h3>
                    <p className="text-xs text-muted-foreground">{stimuliFiles.length} files</p>
                  </div>
                </div>
              </div>

              {stimuliFiles.length > 0 ? (
                <div className="space-y-2">
                  {stimuliFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Image className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground">{file.fileName}</p>
                          <p className="text-xs text-muted-foreground">{renderFileSize(file.fileSize)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Image className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No stimuli uploaded</p>
                </div>
              )}
            </Card>

            {/* Assignment Sheet */}
            {assignmentFile ? (
              <Card className="p-5 border-border bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Table className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Assignment Sheet</h3>
                      <p className="text-xs text-muted-foreground">Condition mapping</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{assignmentFile.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{renderFileSize(assignmentFile.fileSize)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {assignmentFile.participantCount && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{assignmentFile.participantCount} participants</span> mapped
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-5 border-border bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                  <Table className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No assignment sheet</p>
                </div>
              </Card>
            )}
          </div>

          {/* Parsed Script Map */}
          {scriptFile?.parsedTasks && (
            <Card className="p-5 border-border bg-card">
              <h3 className="text-sm font-medium text-foreground mb-4">Parsed Script Map</h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        #
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Task
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Expected Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedScriptMap.map((task) => (
                      <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                            {task.id}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{task.task}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{task.expectedDuration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
