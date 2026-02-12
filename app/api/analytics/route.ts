import { getCrawlStore } from '@/lib/crawler/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const store = getCrawlStore()

  return Response.json({
    topSkills: store.getTopSkills(12),
    topCompanies: store.getTopCompanies(10),
    topLocations: store.getTopLocations(10),
    totalJobs: store.jobs.size,
    remoteJobs: Array.from(store.jobs.values()).filter((j) => j.isRemote).length,
    averageConfidence: store.getStats().averageConfidence,
  })
}
