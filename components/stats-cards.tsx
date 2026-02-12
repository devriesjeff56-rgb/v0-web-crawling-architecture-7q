'use client'

import { useCrawlStatus } from '@/hooks/use-crawler-data'
import {
  Briefcase,
  FileSearch,
  Link2,
  Globe2,
  Gauge,
  AlertTriangle,
} from 'lucide-react'

export function StatsCards() {
  const { data } = useCrawlStatus()
  const stats = data?.stats

  const cards = [
    {
      label: 'Jobs Found',
      value: stats?.jobsFound ?? 0,
      icon: Briefcase,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      label: 'Pages Crawled',
      value: stats?.pagesProcessed ?? 0,
      icon: FileSearch,
      color: 'text-sky-400',
      bgColor: 'bg-sky-400/10',
    },
    {
      label: 'Frontier Queue',
      value: stats?.linksInFrontier ?? 0,
      icon: Link2,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
    },
    {
      label: 'Domains Visited',
      value: stats?.domainsVisited ?? 0,
      icon: Globe2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Pages / Min',
      value: stats?.pagesPerMinute ?? 0,
      icon: Gauge,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
    {
      label: 'Errors',
      value: stats?.errorsCount ?? 0,
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            <div className={`rounded-md p-1.5 ${card.bgColor}`}>
              <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
              {card.label}
            </span>
          </div>
          <span className="text-2xl font-bold font-mono text-foreground tabular-nums">
            {typeof card.value === 'number'
              ? card.value.toLocaleString()
              : card.value}
          </span>
        </div>
      ))}
    </div>
  )
}
