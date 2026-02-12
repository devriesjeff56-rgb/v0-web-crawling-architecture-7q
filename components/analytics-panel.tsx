'use client'

import { useAnalytics } from '@/hooks/use-crawler-data'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function AnalyticsPanel() {
  const { data } = useAnalytics()

  if (!data || data.totalJobs === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
          Analytics
        </h2>
        <p className="text-sm text-muted-foreground">
          Analytics will appear once jobs are discovered.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top Skills Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
          Most Requested Skills
        </h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.topSkills.slice(0, 8)}
              layout="vertical"
              margin={{ top: 0, right: 10, bottom: 0, left: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="skill"
                width={80}
                tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  fontFamily: 'monospace',
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.topSkills.slice(0, 8).map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Companies */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
          Top Hiring Companies
        </h3>
        {data.topCompanies.length > 0 ? (
          <div className="flex flex-col gap-2">
            {data.topCompanies.slice(0, 8).map((company, i) => (
              <div key={company.company} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground w-4 text-right">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground truncate">
                      {company.company}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
                      {company.count} job{company.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all duration-500"
                      style={{
                        width: `${(company.count / (data.topCompanies[0]?.count || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        )}
      </div>

      {/* Top Locations */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
          Job Locations
        </h3>
        {data.topLocations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.topLocations.map((loc) => (
              <span
                key={loc.location}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs"
              >
                <span className="text-foreground">{loc.location}</span>
                <span className="font-mono text-muted-foreground">
                  {loc.count}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        )}
      </div>

      {/* Summary stats */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">
          Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total Jobs
            </p>
            <p className="text-xl font-bold font-mono text-foreground">
              {data.totalJobs}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Remote Jobs
            </p>
            <p className="text-xl font-bold font-mono text-foreground">
              {data.remoteJobs}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Avg. Confidence
            </p>
            <p className="text-xl font-bold font-mono text-foreground">
              {Math.round(data.averageConfidence * 100)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Unique Skills
            </p>
            <p className="text-xl font-bold font-mono text-foreground">
              {data.topSkills.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
