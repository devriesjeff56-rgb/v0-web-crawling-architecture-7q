import { getCrawlStore } from '@/lib/crawler/store'
import { startCrawlLoop } from '@/lib/crawler/agent-loop'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { location, radiusKm } = body as { location?: string; radiusKm?: number }

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

  if (store.status === 'running') {
    return Response.json({ message: 'Crawler is already running', stats: store.getStats() })
  }

  // Start the crawl loop (non-blocking)
  startCrawlLoop().catch((error) => {
    store.log('error', `Crawl loop crashed: ${error instanceof Error ? error.message : 'Unknown'}`)
    store.status = 'stopped'
  })

  return Response.json({
    message: `Crawler started targeting ${store.config.location} (${store.config.radiusKm}km radius)`,
    stats: store.getStats(),
  })
}
