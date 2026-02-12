// ============================================================
// HTML parsing and data extraction layer. Handles link discovery,
// text extraction, structured data (JSON-LD), and cleaning.
// Uses regex-based HTML parsing (no DOM dependency needed).
// ============================================================

export interface ParsedPage {
  title: string
  bodyText: string
  links: ExtractedLink[]
  structuredJobs: StructuredJobData[]
  metaDescription: string
  lang: string
}

export interface ExtractedLink {
  url: string
  anchorText: string
  context: string // surrounding text
}

export interface StructuredJobData {
  title: string
  company: string
  location: string
  description: string
  datePosted: string | null
  salary: string | null
  url: string | null
}

/**
 * Parse raw HTML and extract relevant content for the crawler.
 */
export function parseHTML(html: string, baseUrl: string): ParsedPage {
  const title = extractTitle(html)
  const bodyText = extractBodyText(html)
  const links = extractLinks(html, baseUrl)
  const structuredJobs = extractJsonLdJobs(html)
  const metaDescription = extractMetaDescription(html)
  const lang = extractLang(html)

  return {
    title,
    bodyText,
    links,
    structuredJobs,
    metaDescription,
    lang,
  }
}

/**
 * Extract <title> content
 */
function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? cleanText(match[1]) : ''
}

/**
 * Extract meta description
 */
function extractMetaDescription(html: string): string {
  const match = html.match(
    /<meta\s+(?:[^>]*?\s+)?(?:name|property)\s*=\s*["']description["'][^>]*?\s+content\s*=\s*["']([\s\S]*?)["'][^>]*>/i
  )
  if (match) return cleanText(match[1])
  // Try reversed attribute order
  const match2 = html.match(
    /<meta\s+(?:[^>]*?\s+)?content\s*=\s*["']([\s\S]*?)["'][^>]*?\s+(?:name|property)\s*=\s*["']description["'][^>]*>/i
  )
  return match2 ? cleanText(match2[1]) : ''
}

/**
 * Extract lang attribute
 */
function extractLang(html: string): string {
  const match = html.match(/<html[^>]*\slang\s*=\s*["']([^"']+)["']/i)
  return match ? match[1].toLowerCase() : ''
}

/**
 * Strip all HTML tags and extract readable body text.
 * Removes scripts, styles, nav, header, footer to focus on content.
 */
function extractBodyText(html: string): string {
  let text = html
  // Remove scripts and styles
  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  // Remove nav/header/footer (less useful for job content)
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
  text = text.replace(/<header[\s\S]*?<\/header>/gi, ' ')
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
  // Replace block elements with newlines for readability
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br|hr)[^>]*>/gi, '\n')
  text = text.replace(/<(br|hr)\s*\/?>/gi, '\n')
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode common HTML entities
  text = decodeEntities(text)
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n\s*\n/g, '\n')
  text = text.trim()
  // Limit to reasonable size for AI processing
  return text.substring(0, 8000)
}

/**
 * Extract all links from HTML with anchor text and surrounding context.
 */
function extractLinks(html: string, baseUrl: string): ExtractedLink[] {
  const links: ExtractedLink[] = []
  const seen = new Set<string>()

  // Match <a href="...">...</a> with surrounding context
  const linkRegex =
    /(?:[\s\S]{0,100})<a\s+(?:[^>]*?\s+)?href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>(?:[\s\S]{0,100})/gi

  let match: RegExpExecArray | null
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const rawHref = match[1].trim()
      if (!rawHref || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) continue

      const absoluteUrl = resolveUrl(rawHref, baseUrl)
      if (!absoluteUrl) continue
      if (seen.has(absoluteUrl)) continue

      // Only crawl http/https
      if (!absoluteUrl.startsWith('http://') && !absoluteUrl.startsWith('https://')) continue

      // Skip common non-content extensions
      if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|mp4|mp3|zip|exe|dmg|css|js|woff|ttf|ico)$/i.test(absoluteUrl)) continue

      seen.add(absoluteUrl)

      const anchorText = cleanText(match[2])
      const fullMatch = cleanText(match[0])

      links.push({
        url: absoluteUrl,
        anchorText: anchorText.substring(0, 200),
        context: fullMatch.substring(0, 300),
      })
    } catch {
      // Skip malformed URLs
    }
  }

  return links
}

/**
 * Extract JSON-LD structured data for job postings (schema.org/JobPosting).
 */
function extractJsonLdJobs(html: string): StructuredJobData[] {
  const jobs: StructuredJobData[] = []
  const jsonLdRegex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

  let match: RegExpExecArray | null
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1])
      const items = Array.isArray(data) ? data : [data]

      for (const item of items) {
        if (item['@type'] === 'JobPosting' || item['@type']?.includes?.('JobPosting')) {
          jobs.push({
            title: item.title || item.name || '',
            company:
              item.hiringOrganization?.name ||
              item.hiringOrganization?.legalName ||
              '',
            location: extractJsonLdLocation(item),
            description: cleanText(item.description || '').substring(0, 2000),
            datePosted: item.datePosted || null,
            salary: extractJsonLdSalary(item),
            url: item.url || null,
          })
        }

        // Handle @graph arrays
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          for (const subItem of item['@graph']) {
            if (subItem['@type'] === 'JobPosting') {
              jobs.push({
                title: subItem.title || subItem.name || '',
                company: subItem.hiringOrganization?.name || '',
                location: extractJsonLdLocation(subItem),
                description: cleanText(subItem.description || '').substring(0, 2000),
                datePosted: subItem.datePosted || null,
                salary: extractJsonLdSalary(subItem),
                url: subItem.url || null,
              })
            }
          }
        }
      }
    } catch {
      // Invalid JSON-LD, skip
    }
  }

  return jobs
}

function extractJsonLdLocation(item: Record<string, unknown>): string {
  const loc = item.jobLocation as Record<string, unknown> | undefined
  if (!loc) return ''
  if (typeof loc === 'string') return loc
  const address = loc.address as Record<string, unknown> | string | undefined
  if (!address) return ''
  if (typeof address === 'string') return address
  const parts = [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.addressCountry,
  ].filter(Boolean)
  return parts.join(', ')
}

function extractJsonLdSalary(item: Record<string, unknown>): string | null {
  const salary = item.baseSalary as Record<string, unknown> | undefined
  if (!salary) return null
  const value = salary.value as Record<string, unknown> | number | undefined
  if (typeof value === 'number') return `${salary.currency || ''}${value}`
  if (value && typeof value === 'object') {
    const min = value.minValue
    const max = value.maxValue
    const currency = (salary.currency as string) || 'EUR'
    if (min && max) return `${currency} ${min}-${max}`
    if (min) return `${currency} ${min}+`
    if (max) return `up to ${currency} ${max}`
  }
  return null
}

/**
 * Resolve a potentially relative URL against a base URL.
 */
function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return null
  }
}

/**
 * Clean text: strip tags, decode entities, normalize whitespace.
 */
function cleanText(text: string): string {
  let cleaned = text.replace(/<[^>]+>/g, ' ')
  cleaned = decodeEntities(cleaned)
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  return cleaned
}

/**
 * Decode common HTML entities.
 */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}
