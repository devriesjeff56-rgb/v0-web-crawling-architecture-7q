'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useCrawlStatus } from '@/hooks/use-crawler-data'
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  ArrowDown,
  Pin,
  PinOff,
  Loader2,
} from 'lucide-react'
import type { ActivityLogEntry } from '@/lib/crawler/types'

// ============================================================
// Constants
// ============================================================

type LogType = ActivityLogEntry['type'] | 'all'

const typeConfig: Record<
  ActivityLogEntry['type'],
  { icon: typeof Info; color: string; label: string }
> = {
  info: { icon: Info, color: 'text-sky-400', label: 'Info' },
  success: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Success' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', label: 'Warning' },
  error: { icon: XCircle, color: 'text-destructive', label: 'Error' },
  crawl: { icon: Globe, color: 'text-primary', label: 'Crawl' },
}

const filterTypes: { id: LogType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'crawl', label: 'Crawl' },
  { id: 'success', label: 'Success' },
  { id: 'error', label: 'Error' },
  { id: 'warning', label: 'Warn' },
  { id: 'info', label: 'Info' },
]

// ============================================================
// Helpers
// ============================================================

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

// ============================================================
// Component
// ============================================================

export function ActivityFeed() {
  const { data } = useCrawlStatus()
  const logs = data?.logs || []
  const stats = data?.stats
  const isRunning = stats?.status === 'running'

  const [activeFilter, setActiveFilter] = useState<LogType>('all')
  const [autoscroll, setAutoscroll] = useState(true)
  const [newCount, setNewCount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevLogCountRef = useRef(0)
  const seenIdsRef = useRef<Set<string>>(new Set())

  const filteredLogs =
    activeFilter === 'all' ? logs : logs.filter((l) => l.type === activeFilter)

  // Track new entries
  useEffect(() => {
    if (logs.length > 0) {
      let newEntries = 0
      for (const log of logs) {
        if (!seenIdsRef.current.has(log.id)) {
          newEntries++
          seenIdsRef.current.add(log.id)
        }
      }
      if (!autoscroll && newEntries > 0) {
        setNewCount((prev) => prev + newEntries)
      }
    }
    prevLogCountRef.current = logs.length
  }, [logs, autoscroll])

  // Auto-scroll to top when new logs arrive (logs are prepended)
  useEffect(() => {
    if (autoscroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [logs, autoscroll])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    // If user scrolls down from top, disable autoscroll
    const { scrollTop } = scrollRef.current
    if (scrollTop > 60 && autoscroll) {
      setAutoscroll(false)
    }
  }, [autoscroll])

  const scrollToTop = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
    setAutoscroll(true)
    setNewCount(0)
  }, [])

  // Elapsed time since crawler started
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!stats?.startedAt || !isRunning) {
      setElapsed('')
      return
    }
    const tick = () => {
      const diff = Math.max(0, Date.now() - (stats.startedAt ?? 0))
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setElapsed(`${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [stats?.startedAt, isRunning])

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Activity Feed
        </h2>
        <div className="flex items-center gap-2">
          {elapsed && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {elapsed}
            </span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground">
            {filteredLogs.length} entries
          </span>
          <button
            onClick={() => {
              if (autoscroll) {
                setAutoscroll(false)
              } else {
                scrollToTop()
              }
            }}
            title={autoscroll ? 'Pause auto-scroll' : 'Resume auto-scroll'}
            className={`flex items-center justify-center h-5 w-5 rounded transition-colors ${
              autoscroll
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {autoscroll ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Currently crawling URL */}
      {isRunning && stats?.currentUrl && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-primary/5">
          <Loader2 className="h-3 w-3 text-primary animate-spin flex-shrink-0" />
          <span className="text-[10px] font-mono text-primary truncate">
            {truncateUrl(stats.currentUrl, 60)}
          </span>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border/50 overflow-x-auto">
        {filterTypes.map((ft) => {
          const isActive = activeFilter === ft.id
          const count = ft.id === 'all' ? logs.length : logs.filter((l) => l.type === ft.id).length
          return (
            <button
              key={ft.id}
              onClick={() => setActiveFilter(ft.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              {ft.label}
              {count > 0 && (
                <span className={`text-[9px] tabular-nums ${isActive ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto max-h-[400px] lg:max-h-[520px] relative"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {logs.length === 0
              ? 'No activity yet. Start the crawler to begin.'
              : `No ${activeFilter} entries found.`}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredLogs.map((log, index) => {
              const config = typeConfig[log.type]
              const Icon = config.icon
              const isNew = index < 3 && autoscroll
              return (
                <div
                  key={log.id}
                  className="px-4 py-2.5 hover:bg-accent/50 transition-colors"
                  style={
                    isNew
                      ? {
                          animation: 'feed-in 0.3s ease-out both',
                          animationDelay: `${index * 50}ms`,
                        }
                      : undefined
                  }
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
                    <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0 mt-0.5 tabular-nums">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* New entries indicator */}
        {!autoscroll && newCount > 0 && (
          <button
            onClick={scrollToTop}
            className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium shadow-lg transition-transform hover:scale-105 z-10"
          >
            <ArrowDown className="h-3 w-3 rotate-180" />
            {newCount} new {newCount === 1 ? 'entry' : 'entries'}
          </button>
        )}
      </div>
    </div>
  )
}
