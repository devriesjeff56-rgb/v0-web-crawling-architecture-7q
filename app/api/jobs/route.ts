import { getCrawlStore } from '@/lib/crawler/store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const store = getCrawlStore()

  const skills = searchParams.get('skills')?.split(',').filter(Boolean)
  const minConfidence = searchParams.get('minConfidence')
    ? parseFloat(searchParams.get('minConfidence')!)
    : undefined
  const maxDistance = searchParams.get('maxDistance')
    ? parseFloat(searchParams.get('maxDistance')!)
    : undefined
  const remoteOnly = searchParams.get('remoteOnly') === 'true'
  const search = searchParams.get('search') || undefined

  const jobs = store.getJobs({
    skills,
    minConfidence,
    maxDistance,
    remoteOnly,
    search,
  })

  return Response.json({
    jobs,
    total: jobs.length,
    totalInStore: store.jobs.size,
  })
}
