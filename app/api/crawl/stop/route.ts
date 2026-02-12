import { getCrawlStore } from '@/lib/crawler/store'
import { stopCrawlLoop } from '@/lib/crawler/agent-loop'

export const dynamic = 'force-dynamic'

export async function POST() {
  stopCrawlLoop()
  const store = getCrawlStore()

  return Response.json({
    message: 'Crawler stopped',
    stats: store.getStats(),
  })
}
