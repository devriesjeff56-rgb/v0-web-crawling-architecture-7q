'use client'

import { useState, useMemo } from 'react'
import { useJobs } from '@/hooks/use-crawler-data'
import {
  Search,
  ExternalLink,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
  Wifi,
  Filter,
} from 'lucide-react'
import type { Job } from '@/lib/crawler/types'

type SortKey = 'confidence' | 'extractedAt' | 'distanceFromCity' | 'title'
type SortDir = 'asc' | 'desc'

export function JobsTable() {
  const [search, setSearch] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<string>('')
  const [sortKey, setSortKey] = useState<SortKey>('confidence')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expandedJob, setExpandedJob] = useState<string | null>(null)

  const { data } = useJobs({
    search: search || undefined,
    remoteOnly,
    skills: selectedSkill ? [selectedSkill] : undefined,
  })

  const jobs = data?.jobs || []

  const sorted = useMemo(() => {
    return [...jobs].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'confidence':
          cmp = a.confidence - b.confidence
          break
        case 'extractedAt':
          cmp = a.extractedAt - b.extractedAt
          break
        case 'distanceFromCity':
          cmp = (a.distanceFromCity ?? 999) - (b.distanceFromCity ?? 999)
          break
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
      }
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [jobs, sortKey, sortDir])

  const allSkills = useMemo(() => {
    const skills = new Set<string>()
    jobs.forEach((j) => j.skills.forEach((s) => skills.add(s)))
    return Array.from(skills).sort()
  }, [jobs])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null
    return sortDir === 'desc' ? (
      <ChevronDown className="h-3 w-3 inline ml-0.5" />
    ) : (
      <ChevronUp className="h-3 w-3 inline ml-0.5" />
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header & filters */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Discovered Jobs
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {data?.total ?? 0} results / {data?.totalInStore ?? 0} total
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs, companies, locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Skill filter */}
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="rounded-md border border-input bg-background pl-7 pr-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
            >
              <option value="">All Skills</option>
              {allSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>

          {/* Remote toggle */}
          <button
            onClick={() => setRemoteOnly((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
              remoteOnly
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wifi className="h-3 w-3" />
            Remote
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th
                className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('title')}
              >
                Job Title <SortIcon column="title" />
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Skills
              </th>
              <th
                className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('confidence')}
              >
                Score <SortIcon column="confidence" />
              </th>
              <th
                className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('distanceFromCity')}
              >
                Distance <SortIcon column="distanceFromCity" />
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Link
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  {data
                    ? 'No jobs match the current filters. Try adjusting your search.'
                    : 'Start the crawler to discover jobs.'}
                </td>
              </tr>
            ) : (
              sorted.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  isExpanded={expandedJob === job.id}
                  onToggle={() =>
                    setExpandedJob(expandedJob === job.id ? null : job.id)
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function JobRow({
  job,
  isExpanded,
  onToggle,
}: {
  job: Job
  isExpanded: boolean
  onToggle: () => void
}) {
  const confidenceColor =
    job.confidence >= 0.7
      ? 'text-emerald-400'
      : job.confidence >= 0.4
        ? 'text-amber-400'
        : 'text-destructive'

  return (
    <>
      <tr
        className="hover:bg-accent/30 transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground leading-snug">
              {job.title}
            </span>
            {job.isRemote && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-400/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-400">
                <Wifi className="h-2.5 w-2.5" />
                Remote
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate max-w-[150px]">{job.company}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{job.location}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {job.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{job.skills.length - 3}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`font-mono text-xs font-semibold ${confidenceColor}`}>
            {Math.round(job.confidence * 100)}%
          </span>
        </td>
        <td className="px-4 py-3">
          <span className="font-mono text-xs text-muted-foreground">
            {job.distanceFromCity !== null ? `${job.distanceFromCity}km` : '--'}
          </span>
        </td>
        <td className="px-4 py-3">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors text-xs"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="sr-only">Open job listing</span>
          </a>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-muted/20">
          <td colSpan={7} className="px-4 py-4">
            <div className="flex flex-col gap-3 max-w-3xl">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {job.description.substring(0, 500)}
                {job.description.length > 500 ? '...' : ''}
              </p>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {job.salaryRange && (
                  <span>
                    <strong className="text-foreground">Salary:</strong>{' '}
                    {job.salaryRange}
                  </span>
                )}
                {job.postedDate && (
                  <span>
                    <strong className="text-foreground">Posted:</strong>{' '}
                    {job.postedDate}
                  </span>
                )}
                <span>
                  <strong className="text-foreground">Source:</strong>{' '}
                  {job.sourceDomain}
                </span>
                <span>
                  <strong className="text-foreground">All Skills:</strong>{' '}
                  {job.skills.join(', ')}
                </span>
              </div>
              {job.applicationUrl && (
                <a
                  href={job.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors w-fit"
                >
                  <ExternalLink className="h-3 w-3" />
                  Apply Now
                </a>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
