'use client'

import { useCrawlStatus } from '@/hooks/use-crawler-data'
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
} from 'lucide-react'
import type { ActivityLogEntry } from '@/lib/crawler/types'

const typeConfig: Record<
  ActivityLogEntry['type'],
  { icon: typeof Info; color: string }
> = {
  info: { icon: Info, color: 'text-sky-400' },
  success: { icon: CheckCircle2, color: 'text-emerald-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-400' },
  error: { icon: XCircle, color: 'text-destructive' },
  crawl: { icon: Globe, color: 'text-primary' },
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function truncateUrl(url: string, maxLen: number = 50): string {
  if (url.length <= maxLen) return url
  try {
    const u = new URL(url)
    const path =
      u.pathname.length > 30 ? u.pathname.substring(0, 30) + '...' : u.pathname
    return `${u.hostname}${path}`
  } catch {
    return url.substring(0, maxLen) + '...'
  }
}

export function ActivityFeed() {
  const { data } = useCrawlStatus()
  const logs = data?.logs || []

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Activity Feed
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          {logs.length} entries
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-[520px]">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            No activity yet. Start the crawler to begin.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {logs.map((log) => {
              const config = typeConfig[log.type]
              const Icon = config.icon
              return (
                <div
                  key={log.id}
                  className="px-4 py-2.5 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">
                        {log.message}
                      </p>
                      {log.url && (
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                          {truncateUrl(log.url)}
                        </p>
                      )}
                      {log.details && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                          {log.details}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0 mt-0.5">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
