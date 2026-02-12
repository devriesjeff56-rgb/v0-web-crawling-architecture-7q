// ============================================================
// Keyword-based relevance scoring for front-end job filtering.
// Multi-tiered keyword sets with positional weighting.
// ============================================================

export interface KeywordScore {
  totalScore: number
  matchedPrimary: string[]
  matchedSecondary: string[]
  matchedNegative: string[]
  isRelevant: boolean
}

// Must match at least one of these
const PRIMARY_KEYWORDS = [
  'front-end',
  'frontend',
  'front end',
  'fe developer',
  'fe engineer',
  'javascript',
  'typescript',
  'react',
  'reactjs',
  'react.js',
  'vue',
  'vuejs',
  'vue.js',
  'angular',
  'angularjs',
  'svelte',
  'sveltekit',
  'next.js',
  'nextjs',
  'nuxt',
  'nuxtjs',
  'html',
  'css',
  'scss',
  'sass',
  'tailwind',
  'tailwindcss',
  'web developer',
  'web engineer',
  'ui developer',
  'ui engineer',
]

// Boost relevance score
const SECONDARY_KEYWORDS = [
  'responsive design',
  'responsive',
  'ux',
  'user experience',
  'accessibility',
  'a11y',
  'wcag',
  'performance optimization',
  'web performance',
  'jest',
  'cypress',
  'playwright',
  'testing library',
  'storybook',
  'figma',
  'design system',
  'component library',
  'webpack',
  'vite',
  'esbuild',
  'rollup',
  'node.js',
  'nodejs',
  'graphql',
  'rest api',
  'restful',
  'state management',
  'redux',
  'zustand',
  'mobx',
  'pinia',
  'css-in-js',
  'styled-components',
  'emotion',
  'css modules',
  'animation',
  'framer motion',
  'gsap',
  'three.js',
  'webgl',
  'pwa',
  'progressive web',
  'single page',
  'spa',
  'jamstack',
  'headless cms',
  'contentful',
  'sanity',
  'strapi',
  'agile',
  'scrum',
  'kanban',
  'git',
  'ci/cd',
  'vercel',
  'netlify',
  'aws',
  'docker',
]

// Reduce score / flag as irrelevant if ONLY these are present
const NEGATIVE_KEYWORDS = [
  'backend only',
  'back-end only',
  'devops engineer',
  'infrastructure engineer',
  'sre engineer',
  'site reliability',
  'data engineer',
  'data scientist',
  'machine learning engineer',
  'ml engineer',
  'c++ developer',
  'c# developer',
  'java developer', // (not javascript)
  'embedded systems',
  'firmware engineer',
  'network engineer',
  'dba',
  'database administrator',
  'salesforce',
  'sap consultant',
]

/**
 * Score a text block for front-end job relevance.
 * Uses positional weighting: title keywords score 3x, description 1x.
 */
export function scoreKeywordRelevance(
  text: string,
  title?: string
): KeywordScore {
  const normalizedText = text.toLowerCase()
  const normalizedTitle = (title || '').toLowerCase()

  const matchedPrimary: string[] = []
  const matchedSecondary: string[] = []
  const matchedNegative: string[] = []

  let score = 0

  // Primary keywords (must-have)
  for (const kw of PRIMARY_KEYWORDS) {
    const kwLower = kw.toLowerCase()
    if (normalizedTitle.includes(kwLower)) {
      matchedPrimary.push(kw)
      score += 30 // Title match = high value
    } else if (normalizedText.includes(kwLower)) {
      matchedPrimary.push(kw)
      score += 10 // Body match
    }
  }

  // Secondary keywords (boost)
  for (const kw of SECONDARY_KEYWORDS) {
    const kwLower = kw.toLowerCase()
    if (normalizedTitle.includes(kwLower)) {
      matchedSecondary.push(kw)
      score += 8
    } else if (normalizedText.includes(kwLower)) {
      matchedSecondary.push(kw)
      score += 3
    }
  }

  // Negative keywords (penalty)
  for (const kw of NEGATIVE_KEYWORDS) {
    const kwLower = kw.toLowerCase()
    if (normalizedTitle.includes(kwLower)) {
      matchedNegative.push(kw)
      score -= 25
    } else if (normalizedText.includes(kwLower)) {
      matchedNegative.push(kw)
      score -= 8
    }
  }

  // Must have at least one primary match to be considered relevant
  const isRelevant = matchedPrimary.length > 0 && score > 15

  return {
    totalScore: Math.max(0, score),
    matchedPrimary,
    matchedSecondary,
    matchedNegative,
    isRelevant,
  }
}

/**
 * Score a link's anchor text and surrounding context for front-end job relevance.
 * Used by the frontier to prioritize which links to crawl next.
 */
export function scoreLinkRelevance(
  anchorText: string,
  context: string,
  url: string
): number {
  let score = 0

  const combined = `${anchorText} ${context} ${url}`.toLowerCase()

  // Job-related URL patterns
  const jobUrlPatterns = [
    /career/i,
    /vacatur/i,  // Dutch for vacancy
    /job/i,
    /hiring/i,
    /werkenbij/i, // Dutch for "work at"
    /werken-bij/i,
    /openings/i,
    /positions/i,
    /opportunities/i,
    /baan/i,      // Dutch for "job"
    /sollicit/i,  // Dutch for "apply"
  ]

  for (const pattern of jobUrlPatterns) {
    if (pattern.test(url)) score += 15
    if (pattern.test(anchorText)) score += 20
    if (pattern.test(context)) score += 5
  }

  // Front-end specific signals
  for (const kw of PRIMARY_KEYWORDS.slice(0, 15)) {
    if (combined.includes(kw.toLowerCase())) {
      score += 10
    }
  }

  // Dutch signals
  const dutchSignals = ['.nl', 'nederland', 'amsterdam', 'rotterdam', 'utrecht', 'eindhoven', 'den haag']
  for (const signal of dutchSignals) {
    if (combined.includes(signal)) {
      score += 5
    }
  }

  return score
}
