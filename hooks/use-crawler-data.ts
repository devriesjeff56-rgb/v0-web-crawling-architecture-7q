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
      aiProvider: string
      additionalKeywords: string[]
      exclusionTerms: string[]
      seniorityFilter: string
      languagePreference: string
      customSystemPrompt: string
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

// Holds the current SSE abort controller so the crawl connection can be
// cancelled from other parts of the app (e.g. stop button).
let _crawlAbortController: AbortController | null = null

/**
 * Start a crawl. Returns immediately after the SSE connection is
 * established. The connection stays open in the background to keep the
 * serverless function alive while the crawler runs.
 */
export async function startCrawl(
  location: string,
  radiusKm: number,
  aiConfig?: {
    aiProvider?: string
    customSystemPrompt?: string
    additionalKeywords?: string[]
    exclusionTerms?: string[]
    seniorityFilter?: string
    languagePreference?: string
  }
) {
  // Abort any previous connection
  _crawlAbortController?.abort()
  _crawlAbortController = new AbortController()

  const res = await fetch('/api/crawl/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, radiusKm, ...aiConfig }),
    signal: _crawlAbortController.signal,
  })

  // If the response is JSON (e.g. "already running"), return as-is
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }

  // Otherwise it is an SSE stream. Read it in the background to keep
  // the connection (and thus the serverless function) alive.
  const reader = res.body?.getReader()
  if (reader) {
    // Fire-and-forget: read until the stream closes
    ;(async () => {
      try {
        while (true) {
          const { done } = await reader.read()
          if (done) break
        }
      } catch {
        // AbortError when stop is pressed, or network error -- both OK
      }
    })()
  }

  return { message: 'Crawler started (streaming)', stats: null }
}

export async function stopCrawl() {
  // Abort the SSE stream so the serverless function can terminate
  _crawlAbortController?.abort()
  _crawlAbortController = null
  const res = await fetch('/api/crawl/stop', { method: 'POST' })
  return res.json()
}

export async function resetCrawl() {
  _crawlAbortController?.abort()
  _crawlAbortController = null
  const res = await fetch('/api/crawl/reset', { method: 'POST' })
  return res.json()
}
