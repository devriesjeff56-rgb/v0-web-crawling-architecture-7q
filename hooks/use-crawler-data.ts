import useSWR from 'swr'
import type { Job, CrawlStats, ActivityLogEntry } from '@/lib/crawler/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useCrawlStatus(refreshInterval: number = 2000) {
  return useSWR<{
    stats: CrawlStats
    logs: ActivityLogEntry[]
    config: {
      location: string
      radiusKm: number
      maxDepth: number
      delayBetweenRequests: number
    }
  }>('/api/crawl/status', fetcher, {
    refreshInterval,
    revalidateOnFocus: true,
  })
}

export function useJobs(filters?: {
  skills?: string[]
  minConfidence?: number
  maxDistance?: number
  remoteOnly?: boolean
  search?: string
}) {
  const params = new URLSearchParams()
  if (filters?.skills?.length) params.set('skills', filters.skills.join(','))
  if (filters?.minConfidence !== undefined)
    params.set('minConfidence', String(filters.minConfidence))
  if (filters?.maxDistance !== undefined)
    params.set('maxDistance', String(filters.maxDistance))
  if (filters?.remoteOnly) params.set('remoteOnly', 'true')
  if (filters?.search) params.set('search', filters.search)

  const queryString = params.toString()
  const url = `/api/jobs${queryString ? `?${queryString}` : ''}`

  return useSWR<{ jobs: Job[]; total: number; totalInStore: number }>(url, fetcher, {
    refreshInterval: 3000,
  })
}

export function useAnalytics() {
  return useSWR<{
    topSkills: Array<{ skill: string; count: number }>
    topCompanies: Array<{ company: string; count: number }>
    topLocations: Array<{ location: string; count: number }>
    totalJobs: number
    remoteJobs: number
    averageConfidence: number
  }>('/api/analytics', fetcher, {
    refreshInterval: 5000,
  })
}

export async function startCrawl(location: string, radiusKm: number) {
  const res = await fetch('/api/crawl/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, radiusKm }),
  })
  return res.json()
}

export async function stopCrawl() {
  const res = await fetch('/api/crawl/stop', { method: 'POST' })
  return res.json()
}

export async function resetCrawl() {
  const res = await fetch('/api/crawl/reset', { method: 'POST' })
  return res.json()
}
