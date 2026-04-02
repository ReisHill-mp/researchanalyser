'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react'
import type { ProjectFormData } from '@/app/projects/new/page'

interface StepConnectUserTestingProps {
  formData: ProjectFormData
  updateFormData: (updates: Partial<ProjectFormData>) => void
  projectId?: string
}

export function StepConnectUserTesting({ formData, updateFormData, projectId }: StepConnectUserTestingProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)

  const isValidUrl = formData.sessionsUrl.trim().endsWith('/sessions')

  const handleConnect = async () => {
    if (!formData.sessionsUrl.trim()) {
      setValidationError('Please enter a URL')
      return
    }
    if (!isValidUrl) {
      setValidationError('URL must end with /sessions')
      return
    }
    if (!projectId) {
      setConnectError('Project not saved yet. Go back to step 3 and continue again.')
      return
    }

    setValidationError(null)
    setConnectError(null)
    setIsConnecting(true)
    updateFormData({ authState: 'connecting' })

    try {
      const res = await fetch(`/api/projects/${projectId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionsUrl: formData.sessionsUrl,
        }),
      })

      const contentType = res.headers.get('content-type') || ''
      const payload = contentType.includes('application/json')
        ? await res.json().catch(() => null)
        : await res.text().catch(() => '')

      if (!res.ok) {
        if (payload && typeof payload === 'object' && 'error' in payload) {
          throw new Error(String(payload.error))
        }

        const textPayload = typeof payload === 'string' ? payload : ''
        const cleaned = textPayload.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        throw new Error(cleaned || 'Failed to save sessions')
      }

      // Don't set sessionCount from response - it will be fetched from DB
      // The real count comes from the sessions table, not from the POST response
      updateFormData({ authState: 'connected' })
    } catch (err) {
      updateFormData({ authState: 'error' })
      setConnectError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    updateFormData({ authState: 'disconnected', sessionsUrl: '' })
    setValidationError(null)
    setConnectError(null)
  }

  const handleUrlChange = (url: string) => {
    updateFormData({ sessionsUrl: url })
    setValidationError(null)
    setConnectError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Connect UserTesting</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Link your UserTesting study to import session transcripts.
        </p>
      </div>

      <Card className="p-5 border-border bg-card">
        <div className="space-y-4">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="sessionsUrl">UserTesting Sessions URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="sessionsUrl"
              type="url"
              placeholder="https://www.usertesting.com/projects/..."
              value={formData.sessionsUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={formData.authState === 'connected'}
              className="pl-9 bg-secondary border-border"
            />
              </div>
              {formData.authState !== 'connected' ? (
                <Button
                  onClick={handleConnect}
                  disabled={!formData.sessionsUrl.trim() || isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              ) : (
                <Button variant="outline" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              This must be the UserTesting page that lists all sessions in the test (URL must end with /sessions)
            </p>
            {validationError && (
              <p className="text-xs text-destructive">{validationError}</p>
            )}
            {connectError && (
              <p className="text-xs text-destructive">{connectError}</p>
            )}
          </div>

          {/* Connection Status */}
          <div className="space-y-3 pt-2">
            <div className="text-sm font-medium text-foreground">Connection Status</div>

            <div className="space-y-2">
              {/* Authentication State */}
              <div
                className={cn(
                  'flex items-center gap-3 rounded-md p-3 transition-colors',
                  formData.authState === 'connected'
                    ? 'bg-success/10'
                    : formData.authState === 'connecting'
                    ? 'bg-primary/10'
                    : formData.authState === 'error'
                    ? 'bg-destructive/10'
                    : 'bg-muted/50'
                )}
              >
                {formData.authState === 'connected' ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : formData.authState === 'connecting' ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : formData.authState === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Authentication</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.authState === 'connected'
                      ? 'Successfully authenticated'
                      : formData.authState === 'connecting'
                      ? 'Verifying credentials...'
                      : formData.authState === 'error'
                      ? 'Authentication failed'
                      : 'Not connected'}
                  </p>
                </div>
              </div>

              {/* Access Verification */}
              <div
                className={cn(
                  'flex items-center gap-3 rounded-md p-3 transition-colors',
                  formData.authState === 'connected'
                    ? 'bg-success/10'
                    : 'bg-muted/50'
                )}
              >
                {formData.authState === 'connected' ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Access Verification</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.authState === 'connected'
                      ? 'Study access confirmed'
                      : 'Pending authentication'}
                  </p>
                </div>
              </div>

              {/* Session Discovery */}
              <div
                className={cn(
                  'flex items-center gap-3 rounded-md p-3 transition-colors',
                  formData.authState === 'connected' ? 'bg-success/10' : 'bg-muted/50'
                )}
              >
                {formData.authState === 'connected' ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Session Discovery</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.authState === 'connected'
                      ? 'Discovery not run yet. Run import in the next step to fetch real sessions.'
                      : 'Pending connection'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Help Text */}
      <Card className="p-4 border-border bg-muted/30">
        <div className="flex gap-3">
          <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">How it works</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              UserTestingSynth will open a secure browser session to authenticate with your UserTesting account. 
              Once connected, it will scan for available sessions and prepare them for transcript export. 
              Your credentials are never stored - only session tokens are used for secure access.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
