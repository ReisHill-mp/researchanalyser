'use client'

import { AppShell } from '@/components/app-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Bell,
  Key,
  Sparkles,
  Database,
  Shield,
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <AppShell breadcrumbs={[{ label: 'Settings' }]}>
      <div className="p-6 max-w-3xl">
        <h1 className="text-2xl font-semibold text-foreground mb-6">Settings</h1>

        <div className="space-y-6">
          {/* Profile */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium text-foreground">Profile</h2>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="Sarah Chen" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="sarah@company.com" className="bg-secondary border-border" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" defaultValue="Research Lead" className="bg-secondary border-border" />
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium text-foreground">Notifications</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Analysis Complete</p>
                  <p className="text-xs text-muted-foreground">Get notified when analysis finishes</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Validation Issues</p>
                  <p className="text-xs text-muted-foreground">Alert when validation problems are detected</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">New Team Activity</p>
                  <p className="text-xs text-muted-foreground">Updates from team members on shared projects</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>

          {/* AI Settings */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium text-foreground">AI Configuration</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default Model</Label>
                <Select defaultValue="gpt4-turbo">
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt4">GPT-4</SelectItem>
                    <SelectItem value="claude-3">Claude 3 Opus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Analysis Prompt Version</Label>
                <Select defaultValue="v2.4.1">
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="v2.4.1">v2.4.1 (Latest)</SelectItem>
                    <SelectItem value="v2.4.0">v2.4.0</SelectItem>
                    <SelectItem value="v2.3.0">v2.3.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Integrations */}
          <Card className="p-6 border-border bg-card">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium text-foreground">Integrations</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">UT</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">UserTesting</p>
                    <p className="text-xs text-muted-foreground">Connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Data Export</p>
                    <p className="text-xs text-muted-foreground">Not configured</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
