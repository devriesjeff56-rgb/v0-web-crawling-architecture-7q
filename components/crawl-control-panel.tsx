'use client'

import { useState } from 'react'
import { useCrawlStatus, startCrawl, stopCrawl, resetCrawl } from '@/hooks/use-crawler-data'
import { DUTCH_CITIES } from '@/lib/crawler/types'
import {
  Globe,
  Play,
  Square,
  RotateCcw,
  MapPin,
  Loader2,
} from 'lucide-react'

export function CrawlControlPanel() {
  const { data, mutate } = useCrawlStatus()
  const [location, setLocation] = useState('Amsterdam')
  const [radius, setRadius] = useState(50)
  const [isLoading, setIsLoading] = useState(false)

  const stats = data?.stats
  const isRunning = stats?.status === 'running'
  const isPaused = stats?.status === 'paused'

  const handleStart = async () => {
    setIsLoading(true)
    try {
      await startCrawl(location, radius)
      await mutate()
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = async () => {
    setIsLoading(true)
    try {
      await stopCrawl()
      await mutate()
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    setIsLoading(true)
    try {
      await resetCrawl()
      await mutate()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Crawler Control
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              isRunning
                ? 'bg-emerald-500 animate-pulse'
                : isPaused
                  ? 'bg-amber-500'
                  : 'bg-muted-foreground'
            }`}
          />
          <span className="text-xs font-mono text-muted-foreground uppercase">
            {stats?.status || 'idle'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Location selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Target City
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={isRunning}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          >
            {DUTCH_CITIES.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {/* Radius slider */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground font-medium">
            Search Radius: {radius}km
          </label>
          <input
            type="range"
            min={10}
            max={150}
            step={5}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            disabled={isRunning}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>10km</span>
            <span>75km</span>
            <span>150km</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isPaused ? 'Resume' : 'Start Crawl'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Stop
            </button>
          )}
          <button
            onClick={handleReset}
            disabled={isLoading || isRunning}
            className="flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            title="Reset crawler state"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
