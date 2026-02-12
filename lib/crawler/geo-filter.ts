// ============================================================
// Geographic filtering: Haversine distance, location extraction,
// and Dutch city/postal code detection
// ============================================================

import { DUTCH_CITIES, type DutchCity } from './types'

/**
 * Haversine formula to compute distance between two lat/lon points.
 * Returns distance in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Find the best matching Dutch city from text input (user query or extracted text).
 */
export function findDutchCity(text: string): DutchCity | null {
  const normalized = text.toLowerCase().trim()
  for (const city of DUTCH_CITIES) {
    if (normalized.includes(city.name.toLowerCase())) return city
    for (const alias of city.aliases) {
      if (normalized.includes(alias.toLowerCase())) return city
    }
  }
  return null
}

/**
 * Dutch postal code pattern: 4 digits + 2 uppercase letters (e.g. 1012 AB)
 */
const DUTCH_POSTAL_PATTERN = /\b(\d{4})\s*([A-Z]{2})\b/gi

/**
 * Approximate lat/lon from a Dutch postal code prefix (first 2 digits).
 * This is a rough mapping covering the Netherlands' postal zones.
 */
const POSTAL_PREFIX_COORDS: Record<string, { lat: number; lon: number }> = {
  '10': { lat: 52.37, lon: 4.89 },   // Amsterdam
  '11': { lat: 52.38, lon: 4.85 },   // Amsterdam-West
  '12': { lat: 52.30, lon: 4.87 },   // Amstelveen
  '13': { lat: 52.38, lon: 4.63 },   // Haarlem area
  '14': { lat: 52.43, lon: 4.65 },   // Haarlem-North
  '15': { lat: 52.52, lon: 4.67 },   // Velsen
  '16': { lat: 52.45, lon: 4.81 },   // Zaandam
  '17': { lat: 52.63, lon: 4.75 },   // Heerhugowaard
  '18': { lat: 52.65, lon: 5.06 },   // Hoorn
  '19': { lat: 52.51, lon: 5.47 },   // Lelystad
  '20': { lat: 52.08, lon: 4.31 },   // Den Haag
  '21': { lat: 52.08, lon: 4.32 },   // Den Haag
  '22': { lat: 52.01, lon: 4.36 },   // Delft
  '23': { lat: 52.16, lon: 4.49 },   // Leiden
  '24': { lat: 52.07, lon: 4.50 },   // Zoetermeer
  '25': { lat: 52.03, lon: 4.49 },   // Gouda area
  '26': { lat: 52.09, lon: 4.28 },   // Rijswijk area
  '27': { lat: 52.00, lon: 4.37 },   // Westland
  '28': { lat: 51.92, lon: 4.48 },   // Rotterdam
  '29': { lat: 51.92, lon: 4.50 },   // Rotterdam South
  '30': { lat: 51.92, lon: 4.48 },   // Rotterdam
  '31': { lat: 51.82, lon: 4.66 },   // Dordrecht
  '32': { lat: 51.81, lon: 4.69 },   // Papendrecht
  '33': { lat: 52.21, lon: 5.28 },   // Amersfoort
  '34': { lat: 52.23, lon: 5.17 },   // Baarn
  '35': { lat: 52.09, lon: 5.12 },   // Utrecht
  '36': { lat: 52.08, lon: 5.13 },   // Utrecht
  '37': { lat: 52.00, lon: 5.10 },   // Veenendaal
  '38': { lat: 52.35, lon: 5.27 },   // Almere
  '39': { lat: 52.21, lon: 5.96 },   // Apeldoorn
  '40': { lat: 51.97, lon: 5.91 },   // Arnhem
  '41': { lat: 51.98, lon: 5.92 },   // Arnhem
  '42': { lat: 51.97, lon: 5.15 },   // Gorinchem
  '43': { lat: 51.84, lon: 5.86 },   // Nijmegen
  '44': { lat: 51.69, lon: 5.30 },   // 's-Hertogenbosch
  '45': { lat: 51.44, lon: 5.47 },   // Eindhoven
  '46': { lat: 51.44, lon: 5.50 },   // Eindhoven
  '47': { lat: 51.45, lon: 5.48 },   // Helmond area
  '48': { lat: 51.57, lon: 4.78 },   // Breda
  '49': { lat: 51.56, lon: 5.08 },   // Tilburg
  '50': { lat: 51.56, lon: 5.09 },   // Tilburg
  '51': { lat: 51.45, lon: 5.47 },   // Eindhoven South
  '52': { lat: 52.22, lon: 6.89 },   // Enschede
  '53': { lat: 53.22, lon: 6.57 },   // Groningen
  '54': { lat: 53.20, lon: 5.80 },   // Leeuwarden
  '55': { lat: 52.76, lon: 6.16 },   // Meppel
  '56': { lat: 53.08, lon: 5.65 },   // Sneek
  '57': { lat: 52.51, lon: 6.09 },   // Zwolle
  '58': { lat: 52.73, lon: 6.49 },   // Emmen
  '59': { lat: 52.26, lon: 6.79 },   // Hengelo
  '60': { lat: 51.43, lon: 5.48 },   // Eindhoven (Waalre)
  '61': { lat: 51.47, lon: 5.67 },   // Geldrop
  '62': { lat: 50.85, lon: 5.69 },   // Maastricht
  '63': { lat: 50.88, lon: 5.98 },   // Heerlen
  '64': { lat: 51.17, lon: 5.99 },   // Roermond
  '65': { lat: 51.35, lon: 6.17 },   // Venlo
}

/**
 * Extract geographic signals from text: city names, postal codes, regions.
 * Returns an array of {location, lat, lon} tuples.
 */
export function extractLocationsFromText(text: string): Array<{
  location: string
  latitude: number
  longitude: number
  source: 'city' | 'postal' | 'region'
}> {
  const results: Array<{
    location: string
    latitude: number
    longitude: number
    source: 'city' | 'postal' | 'region'
  }> = []

  // 1. Check Dutch city names
  for (const city of DUTCH_CITIES) {
    const cityRegex = new RegExp(`\\b${escapeRegex(city.name)}\\b`, 'i')
    if (cityRegex.test(text)) {
      results.push({
        location: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        source: 'city',
      })
    }
    for (const alias of city.aliases) {
      const aliasRegex = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i')
      if (aliasRegex.test(text)) {
        results.push({
          location: `${city.name} (${alias})`,
          latitude: city.latitude,
          longitude: city.longitude,
          source: 'city',
        })
        break
      }
    }
  }

  // 2. Check Dutch postal codes
  let postalMatch: RegExpExecArray | null
  const postalRegex = new RegExp(DUTCH_POSTAL_PATTERN.source, 'gi')
  while ((postalMatch = postalRegex.exec(text)) !== null) {
    const prefix = postalMatch[1].substring(0, 2)
    const coords = POSTAL_PREFIX_COORDS[prefix]
    if (coords) {
      results.push({
        location: postalMatch[0],
        latitude: coords.lat,
        longitude: coords.lon,
        source: 'postal',
      })
    }
  }

  // 3. Check for "Netherlands" / "Nederland" mentions (broad signal)
  const nlPatterns = [
    /\bnetherlands\b/i,
    /\bnederland\b/i,
    /\bholland\b/i,
    /\bnl\b/i,
  ]
  for (const pattern of nlPatterns) {
    if (pattern.test(text)) {
      results.push({
        location: 'Netherlands',
        latitude: 52.1326,
        longitude: 5.2913,
        source: 'region',
      })
      break
    }
  }

  return results
}

/**
 * Determine if a job/page is geographically relevant based on extracted locations.
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  locations: Array<{ latitude: number; longitude: number }>
): { withinRadius: boolean; closestDistance: number } {
  if (locations.length === 0) {
    return { withinRadius: false, closestDistance: Infinity }
  }

  let closestDistance = Infinity
  for (const loc of locations) {
    const dist = haversineDistance(centerLat, centerLon, loc.latitude, loc.longitude)
    if (dist < closestDistance) closestDistance = dist
  }

  return {
    withinRadius: closestDistance <= radiusKm,
    closestDistance,
  }
}

/**
 * Check if a URL is likely to be Dutch/NL-based from its domain.
 */
export function isDutchDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return (
      hostname.endsWith('.nl') ||
      hostname.includes('.nl.') ||
      hostname.includes('nederland') ||
      hostname.includes('dutch') ||
      hostname.includes('holland')
    )
  } catch {
    return false
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
