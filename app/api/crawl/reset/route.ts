import { resetCrawler } from '@/lib/crawler/agent-loop'
import { getCrawlStore } from '@/lib/crawler/store'

export const dynamic = 'force-dynamic'

export async function POST() {
  resetCrawler()
  const store = getCrawlStore()

  return Response.json({
    message: 'Crawler state reset',
    stats: store.getStats(),
  })
}
