'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  FolderOpen,
  Settings,
  ChevronRight,
} from 'lucide-react'

const navigation = [
  { name: 'Projects', href: '/', icon: FolderOpen },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface AppShellProps {
  children: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  hideHeader?: boolean
}

export function AppShell({ children, breadcrumbs, hideHeader = false }: AppShellProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-border bg-sidebar">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <span className="text-xs font-bold text-primary-foreground">UT</span>
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">UserTestingSynth</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!hideHeader && (
          <header className="flex h-14 items-center border-b border-border bg-background px-6">
            <div className="flex items-center gap-2">
              {breadcrumbs ? (
                <nav className="flex items-center gap-1 text-sm">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={index} className="flex items-center gap-1">
                      {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                      {crumb.href ? (
                        <Link
                          href={crumb.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-foreground font-medium">{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              ) : (
                <h1 className="text-sm font-medium text-foreground">Projects</h1>
              )}
            </div>
          </header>
        )}

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
