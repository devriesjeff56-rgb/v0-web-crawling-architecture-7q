import { getCrawlStore } from '@/lib/crawler/store'
import { startCrawlLoop } from '@/lib/crawler/agent-loop'
import type { AiProvider } from '@/lib/crawler/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

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

  // Start the crawl loop (non-blocking)
  startCrawlLoop().catch((error) => {
    store.log('error', `Crawl loop crashed: ${error instanceof Error ? error.message : 'Unknown'}`)
    store.status = 'stopped'
  })

  return Response.json({
    message: `Crawler started targeting ${store.config.location} (${store.config.radiusKm}km radius) using ${store.config.aiProvider}`,
    stats: store.getStats(),
  })
}
