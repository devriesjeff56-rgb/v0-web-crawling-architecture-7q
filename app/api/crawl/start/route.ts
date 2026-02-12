import { getCrawlStore } from '@/lib/crawler/store'
import { startCrawlLoop } from '@/lib/crawler/agent-loop'
import type { AiProvider } from '@/lib/crawler/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/crawl/start
 *
 * Starts the crawl loop and returns a **streaming SSE response** so the
 * serverless function stays alive for the entire duration of the crawl
 * (up to maxDuration). The client keeps this connection open and receives
 * periodic heartbeat + status events. This solves the main issue: in a
 * serverless environment the function terminates as soon as the response
 * is sent, killing the background loop.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const {
    location,
    radiusKm,
    aiProvider,
    customSystemPrompt,
    additionalKeywords,
    exclusionTerms,
    seniorityFilter,
    languagePreference,
  } = body as {
    location?: string
    radiusKm?: number
    aiProvider?: AiProvider
    customSystemPrompt?: string
    additionalKeywords?: string[]
    exclusionTerms?: string[]
    seniorityFilter?: string
    languagePreference?: string
  }

  const store = getCrawlStore()

  // Update location if provided
  if (location) {
    const found = store.setLocation(location, radiusKm || 50)
    if (!found) {
      return Response.json(
        {
          error: `City "${location}" not found in the Dutch city database. Try: Amsterdam, Rotterdam, Utrecht, Den Haag, Eindhoven, etc.`,
        },
        { status: 400 }
      )
    }
  }

  // Apply AI configuration
  if (aiProvider) store.config.aiProvider = aiProvider
  if (typeof customSystemPrompt === 'string') store.config.customSystemPrompt = customSystemPrompt
  if (Array.isArray(additionalKeywords)) store.config.additionalKeywords = additionalKeywords
  if (Array.isArray(exclusionTerms)) store.config.exclusionTerms = exclusionTerms
  if (seniorityFilter) store.config.seniorityFilter = seniorityFilter
  if (languagePreference) store.config.languagePreference = languagePreference

  if (store.status === 'running') {
    return Response.json({ message: 'Crawler is already running', stats: store.getStats() })
  }

  store.log(
    'info',
    `Starting crawler with provider: ${store.config.aiProvider}, location: ${store.config.location}, radius: ${store.config.radiusKm}km`
  )

  // Use a ReadableStream to keep the serverless function alive while the
  // crawl loop runs. We send SSE-formatted events to the client.
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to push an SSE event
      const sendEvent = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          )
        } catch {
          // Stream may have been closed by client
        }
      }

      // Send initial acknowledgement
      sendEvent('started', {
        message: `Crawler started targeting ${store.config.location} (${store.config.radiusKm}km radius) using ${store.config.aiProvider}`,
        stats: store.getStats(),
      })

      // Start the crawl loop in the same async context (keeps function alive)
      const crawlPromise = startCrawlLoop().catch((error) => {
        const msg = error instanceof Error ? error.message : 'Unknown'
        store.log('error', `Crawl loop crashed: ${msg}`)
        store.status = 'stopped'
      })

      // Heartbeat: periodically send status updates while the loop is alive
      const heartbeatInterval = setInterval(() => {
        const stats = store.getStats()
        sendEvent('status', {
          stats,
          logCount: store.activityLog.length,
        })
      }, 2000)

      // Wait for the crawl loop to finish (or timeout via maxDuration)
      await crawlPromise

      clearInterval(heartbeatInterval)

      // Send final status
      sendEvent('done', {
        message: 'Crawl loop finished',
        stats: store.getStats(),
      })

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
